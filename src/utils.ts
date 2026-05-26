       endDate: getOffsetDate(28),
      status: 'approved',
      createdAt: getPastDateStr(5),
      notes: 'Sibling wedding preparation',
      actionBy: 'Hesham Sobhy',
      actionAt: getPastDateStr(4)
    },
    {
      id: 'req_6',
      agentName: 'Kareem Tarek',
      type: 'annual',
      startDate: getOffsetDate(5), // 5 days away (<14 days rule violation - historically rejected)
      endDate: getOffsetDate(10),
      status: 'declined',
      createdAt: getPastDateStr(1),
      notes: 'Urgent home renovation',
      actionBy: 'Emad Sayed',
      actionAt: getPastDateStr(1),
      ruleViolation: true,
      violationMessage: 'Failed minimum 14 days advance notice rule (only 5 days notice given).'
    },
    {
      id: 'req_7',
      agentName: 'Ziad Amr',
      type: 'swap',
      date: getOffsetDate(0), // Today (Strict swap rule violation)
      shift: '13:00 - 22:00',
      swapWithAgent: 'Yasmine Sherif',
      swapWithShift: '22:00 - 07:00',
      status: 'declined',
      createdAt: getPastDateStr(0),
      notes: 'Car breakdown',
      actionBy: 'Amira Hassan',
      actionAt: getPastDateStr(0),
      ruleViolation: true,
      violationMessage: 'Failed minimum 24 hour advance notice rule.'
    }
  ];
};

// CSV Export Generator
export const generateCSV = (requests: SchedulingRequest[], filterType: 'all' | 'swap' | 'annual' = 'all'): string => {
  const filtered = filterType === 'all' ? requests : requests.filter(r => r.type === filterType);
  
  const headers = [
    'Request ID',
    'Agent Name',
    'Type',
    'Status',
    'Shift Date/Start Date',
    'Shift Hours/End Date',
    'Swapping With Agent',
    'Swapping With Shift',
    'Submitted At',
    'Actioned By',
    'Actioned At',
    'Notes',
    'Rule Violation'
  ];

  const rows = filtered.map(r => {
    const isSwap = r.type === 'swap';
    return [
      r.id,
      `"${r.agentName.replace(/"/g, '""')}"`,
      r.type.toUpperCase(),
      r.status.toUpperCase(),
      isSwap ? (r as SwapRequest).date : (r as AnnualRequest).startDate,
      isSwap ? (r as SwapRequest).shift : (r as AnnualRequest).endDate,
      isSwap ? `"${(r as SwapRequest).swapWithAgent.replace(/"/g, '""')}"` : '',
      isSwap ? (r as SwapRequest).swapWithShift : '',
      r.createdAt,
      r.actionBy ? `"${r.actionBy.replace(/"/g, '""')}"` : '',
      r.actionAt || '',
      r.notes ? `"${r.notes.replace(/"/g, '""')}"` : '',
      r.ruleViolation ? 'YES' : 'NO'
    ];
  });

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
};

// Text Report Generator
export const generateTextReport = (
  requests: SchedulingRequest[], 
  period: 'day' | 'week' | 'month' | 'year',
  currentTime: Date
): string => {
  const now = new Date(currentTime);
  const cutoff = new Date(currentTime);

  if (period === 'day') {
    cutoff.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    cutoff.setDate(now.getDate() - 7);
  } else if (period === 'month') {
    cutoff.setMonth(now.getMonth() - 1);
  } else if (period === 'year') {
    cutoff.setFullYear(now.getFullYear() - 1);
  }

  const reports = requests.filter(r => new Date(r.createdAt) >= cutoff);
  const approved = reports.filter(r => r.status === 'approved');
  const pending = reports.filter(r => r.status === 'pending');
  const declined = reports.filter(r => r.status === 'declined');

  const swaps = reports.filter(r => r.type === 'swap');
  const annuals = reports.filter(r => r.type === 'annual');

  const lines: string[] = [];
  lines.push('====================================================');
  lines.push(`          SCHEDULING TOOL - STATUS REPORT           `);
  lines.push(`               Period: ${period.toUpperCase()}`);
  lines.push(`          Generated At: ${now.toUTCString()}`);
  lines.push('====================================================');
  lines.push('');
  lines.push(`Total Requests Received: ${reports.length}`);
  lines.push(`  - Approved           : ${approved.length}`);
  lines.push(`  - Pending            : ${pending.length}`);
  lines.push(`  - Declined/Violated  : ${declined.length}`);
  lines.push('');
  lines.push(`By Request Type:`);
  lines.push(`  - Shift Swaps        : ${swaps.length}`);
  lines.push(`  - Annual Leaves      : ${annuals.length}`);
  lines.push('');
  lines.push('----------------------------------------------------');
  lines.push('Detailed Request Logs:');
  lines.push('----------------------------------------------------');

  if (reports.length === 0) {
    lines.push('No requests recorded in this period.');
  } else {
    reports.forEach((r, idx) => {
      lines.push(`${idx + 1}. [${r.type.toUpperCase()}] by ${r.agentName}`);
      lines.push(`   Status   : ${r.status.toUpperCase()}`);
      if (r.type === 'swap') {
        lines.push(`   Date     : ${(r as SwapRequest).date} (Shift: ${(r as SwapRequest).shift})`);
        lines.push(`   Swapping : with ${(r as SwapRequest).swapWithAgent} [${(r as SwapRequest).swapWithShift}]`);
      } else {
        lines.push(`   Dates    : ${(r as AnnualRequest).startDate} to ${(r as AnnualRequest).endDate}`);
      }
      lines.push(`   Submitted: ${new Date(r.createdAt).toLocaleDateString()}`);
      if (r.actionBy) {
        lines.push(`   Actioned : ${r.status === 'approved' ? 'Approved' : 'Declined'} by ${r.actionBy} on ${new Date(r.actionAt || '').toLocaleDateString()}`);
      }
      if (r.ruleViolation) {
        lines.push(`   ⚠️ Violation: ${r.violationMessage || 'Notice interval violation'}`);
      }
      if (r.notes) {
        lines.push(`   Remarks  : ${r.notes}`);
      }
      lines.push('');
    });
  }

  lines.push('====================================================');
  lines.push('                  END OF REPORT                     ');
  lines.push('====================================================');

  return lines.join('\n');
};

// Generate initial schedules for agents over a 30-day window
export const getInitialSchedules = (currentTime: Date, agents: string[]): ScheduledShift[] => {
  const list: ScheduledShift[] = [];
  const totalDays = 30;
  
  // Start from 5 days ago to 25 days in the future
  const startDate = new Date(currentTime);
  startDate.setDate(startDate.getDate() - 5);

  const shiftLabels = SHIFTS.map(s => s.label); // ['07:00 - 16:00', '13:00 - 22:00', '22:00 - 07:00']

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    agents.forEach((agent, agentIdx) => {
      // Rotation algorithm: (dayOffset + agentOffset) % 4
      // 0 = Morning, 1 = Afternoon, 2 = Night, 3 = Rest Day (Off)
      const patternIdx = (i + agentIdx) % 4;
      if (patternIdx < 3) {
        list.push({
          id: `sch_${dateStr}_${agentIdx}`,
          agentName: agent,
          date: dateStr,
          shiftLabel: shiftLabels[patternIdx]
        });
      }
    });
  }

  return list;
};

// Generate a sample CSV template for Schedule uploading
export const generateScheduleTemplateFile = (): string => {
  const headers = ['Agent Name', 'Date (YYYY-MM-DD)', 'Shift (Morning / Afternoon / Night / or exact hours)', 'Shift Notes'];
  const samples = [
    ['Ahmed Aly', '2026-05-25', 'Morning', 'First day back from vacation'],
    ['Ahmed Aly', '2026-05-26', 'Afternoon', 'Late arrival approved by leadership'],
    ['Mostafa Mahmoud', '2026-05-25', '13:00 - 22:00', 'On-site premium shift'],
    ['Fatma Omar', '2026-05-25', 'Night', 'Coverage role'],
    ['Nour Selim', '2026-05-27', '22:00 - 07:00', 'Regular support hours']
  ];

  return [
    headers.join(','),
    ...samples.map(row => row.join(','))
  ].join('\n');
};

export const parseAgentDirectoryCSV = (
  csvContent: string
): { directory: AgentDirectoryRow[]; errors: string[]; parsedCount: number; headers: string[] } => {
  const directory: AgentDirectoryRow[] = [];
  const errors: string[] = [];

  if (!csvContent || !csvContent.trim()) {
    return { directory: [], errors: ['CSV content is empty.'], parsedCount: 0, headers: [] };
  }

  const parseRow = (lineStr: string) => {
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
  };

  const allLines = csvContent.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (allLines.length <= 1) {
    return { directory: [], errors: ['No data rows found in CSV.'], parsedCount: 0, headers: [] };
  }

  const parsedLines = allLines.map(line => parseRow(line));

  // Dynamic Header Recognition: look for keywords in the first 20 rows
