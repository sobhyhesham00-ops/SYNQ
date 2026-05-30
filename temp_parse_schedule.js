export const parseScheduleCSV = (
  csvContent: string,
  existingAgents: string[]
): { schedules: ScheduledShift[]; errors: string[]; parsedCount: number; newAgents: string[]; parsedMeta: Record<string, { tlName?: string }> } => {
  const schedules: ScheduledShift[] = [];
  const errors: string[] = [];
  const newAgentsSet = new Set<string>();
  const parsedMeta: Record<string, { tlName?: string }> = {};

  if (!csvContent || !csvContent.trim()) {
    return { schedules: [], errors: ['CSV content is empty.'], parsedCount: 0, newAgents: [], parsedMeta: {} };
  }

  // 1. Strip BOM character if present
  const cleanCSV = csvContent.replace(/^\uFEFF/, '').trim();

  // Helper Row Tokenizer
  const getCSVRows = (csvText: string): string[][] => {
    const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    return lines.map(lineStr => {
      const row: string[] = [];
      let curVal = '';
      let inQuotes = false;
      for (let i = 0; i < lineStr.length; i++) {
        const char = lineStr[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          row.push(curVal.trim().replace(/^["']|["']$/g, ''));
          curVal = '';
        } else {
          curVal += char;
        }
      }
      row.push(curVal.trim().replace(/^["']|["']$/g, ''));
      return row;
    });
  };

  const parsedRows = getCSVRows(cleanCSV);
  if (parsedRows.length === 0) {
    return { schedules: [], errors: ['No data rows found in CSV.'], parsedCount: 0, newAgents: [], parsedMeta: {} };
  }

  const parseTargetDate = (dateStr: string): string | null => {
    const s = dateStr.trim();
    if (!s) return null;

    // ISO format YYYY-MM-DD
    const yymmdd = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (yymmdd) {
      return `${yymmdd[1]}-${yymmdd[2].padStart(2, '0')}-${yymmdd[3].padStart(2, '0')}`;
    }

    // Locale formats MM/DD/YYYY or DD/MM/YYYY
    const m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
    if (m) {
      const v1 = parseInt(m[1], 10);
      const v2 = parseInt(m[2], 10);
      const yrMatch = m[3];
      const yr = yrMatch.length === 2 ? `20${yrMatch}` : yrMatch;
      if (v1 > 12 && v2 <= 12) {
        return `${yr}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
      }
      if (v2 > 12 && v1 <= 12) {
        return `${yr}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
      }
      return `${yr}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    }

    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const dUtc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      return dUtc.toISOString().split('T')[0];
    }
    
    // Support "May 26", "26 May", "May 26th"
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const short = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const lower = s.toLowerCase();
    
    for (let i = 0; i < 12; i++) {
       if (lower.includes(months[i]) || lower.includes(short[i])) {
          const digits = lower.replace(/[a-z]/g, '').trim().match(/\b\d{1,2}\b/);
          if (digits) {
             let yearConfig = new Date().getFullYear();
             const yrMatch2 = s.match(/\b(202\d|203\d)\b/);
             if (yrMatch2) { yearConfig = parseInt(yrMatch2[1], 10); }
             return `${yearConfig}-${(i+1).toString().padStart(2, '0')}-${parseInt(digits[0], 10).toString().padStart(2, '0')}`;
          }
       }
    }

    return null;
  };

  const mapShiftValue = (raw: string): string => {
    const val = (raw || '').trim().toLowerCase();
    if (!val) return 'Off Day';
    if (['off', 'day off', 'leave', 'al', 'sl', 'vacation', 'sick', 'holiday', 'rest'].some(k => val === k)) return 'Off Day';
    if (['morning', 'am', '07', '08', '07:00'].some(k => val.includes(k))) return 'Morning Shift';
    if (['afternoon', 'pm', '12', '13', '14', 'afternoon shift'].some(k => val.includes(k))) return 'Afternoon Shift';
    if (['night', 'evening', '19', '20', 'graveyard', 'night shift'].some(k => val.includes(k))) return 'Night Shift';
    
    // exact lookup in SHIFTS
    const matchedShift = SHIFTS.find(s => s.label?.toLowerCase() === val || s.display?.toLowerCase() === val);
    if (matchedShift) return matchedShift.label;
    
    return 'Off Day';
  };

  const isAgentHeaderCol = (h: string): boolean => {
    const s = h.trim().toLowerCase();
    return ['agent name', 'agent', 'name', 'employee', 'staff'].includes(s);
  };
  const isDateHeaderCol = (h: string): boolean => {
    const s = h.trim().toLowerCase();
    return ['date', 'day', 'week', 'shift date', 'schedule'].includes(s);
  };
  const isShiftHeaderCol = (h: string): boolean => {
    const s = h.trim().toLowerCase();
    return ['shift', 'schedule', 'type', 'slot', 'time', 'shift time'].includes(s);
  };

  const rawHeadersRow = parsedRows[0] || [];
  const cleanHeaders = rawHeadersRow.map(h => h.trim().toLowerCase().replace(/["']/g, ''));
  let nameIdx = cleanHeaders.findIndex(h => h && isAgentHeaderCol(h));
  let dateIdx = cleanHeaders.findIndex(h => h && isDateHeaderCol(h));
  let shiftIdx = cleanHeaders.findIndex(h => h && isShiftHeaderCol(h));

  // Fallbacks if not found by strict match
  if (nameIdx === -1) { errors.push('Column Match Warning: Could not explicitly find Agent Name column. Defaulting to Column 1.'); nameIdx = 0; }
  if (dateIdx === -1) { errors.push('Column Match Warning: Could not explicitly find Date column. Defaulting to Column 2.'); dateIdx = 1; }
  if (shiftIdx === -1) { errors.push('Column Match Warning: Could not explicitly find Shift column. Defaulting to Column 3.'); shiftIdx = 2; }

  for (let idx = 1; idx < parsedRows.length; idx++) {
    const row = parsedRows[idx];
    if (row.length === 0 || row.every(c => !c)) continue; // skip blank rows

    const lineNum = idx + 1;
    const rawName = (row[nameIdx] || '').trim();
    const rawDate = (row[dateIdx] || '').trim();
    const rawShift = (row[shiftIdx] || '').trim();

    if (!rawName && !rawDate && !rawShift) continue; // skip fully empty row

    if (!rawName) {
      errors.push(`Row ${lineNum}: Missing agent name.`);
      continue;
    }
    if (rawName?.toLowerCase().includes('total') || rawName?.toLowerCase().includes('count')) continue;

    const formattedDate = parseTargetDate(rawDate);
    if (!formattedDate) {
      errors.push(`Row ${lineNum} (${rawName}): Date format unrecognized "${rawDate}". Expected formats like YYYY-MM-DD or MM/DD/YYYY.`);
      continue;
    }

    const yearCheck = parseInt(formattedDate.split('-')[0], 10);
    if (yearCheck < 2020 || yearCheck > 2100) {
      errors.push(`Row ${lineNum} (${rawName}): Date year is out of bounds "${formattedDate}". Allowed bounds are 2020 to 2100.`);
      continue;
    }

    // Extract metadata if exists in brackets (TL name usually)
    let extractedTL = '';
    let processedName = rawName;
    const tlMatch = processedName.match(/\((.*?)\)/);
    if (tlMatch) {
      extractedTL = tlMatch[1].trim();
      processedName = processedName.replace(/\(.*?\)/g, '').trim();
    }
    
    const agentName = capitalizeName(processedName);
    if (extractedTL) {
      parsedMeta[agentName] = { tlName: extractedTL };
    }

    const shiftLabel = mapShiftValue(rawShift);

    const isExisting = existingAgents.some(a => a?.toLowerCase() === agentName?.toLowerCase());
    if (!isExisting) {
      newAgentsSet.add(agentName);
    }

    schedules.push({
      id: `sch_up_${Date.now()}_vert_${idx}`,
      agentName,
      date: formattedDate,
      shiftLabel
    });
  }

  return {
    schedules,
    errors,
    parsedCount: schedules.length,
    newAgents: Array.from(newAgentsSet),
    parsedMeta
  };
};

// Generate CSV report for Inquiries
