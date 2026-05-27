export interface IScheduleItem {
  date: string;
  agentName: string;
  shiftLabel: string;
}

export function validateSchedules(data: any): { valid: boolean; errors: string[]; data?: IScheduleItem[] } {
  if (!Array.isArray(data)) {
    return { valid: false, errors: ['Must be array'] };
  }
  if (data.length === 0) {
    return { valid: false, errors: ['Cannot be empty'] };
  }
  if (data.length > 1000) {
    return { valid: false, errors: ['Maximum 1000 items'] };
  }

  const errors: string[] = [];
  const cleanedData: IScheduleItem[] = [];

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  data.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      errors.push(`Item at index ${index} must be an object`);
      return;
    }

    const { date, agentName, shiftLabel } = item;

    if (typeof date !== 'string' || !date.trim() || !dateRegex.test(date.trim()) || isNaN(Date.parse(date.trim()))) {
      errors.push(`Item at index ${index}: date must be string, valid YYYY-MM-DD format, and not empty`);
    }

    if (typeof agentName !== 'string' || !agentName.trim() || agentName.trim().length > 100) {
      errors.push(`Item at index ${index}: agentName must be a string between 1 and 100 characters`);
    }

    if (typeof shiftLabel !== 'string' || !shiftLabel.trim() || shiftLabel.trim().length > 50) {
      errors.push(`Item at index ${index}: shiftLabel must be a string between 1 and 50 characters`);
    }

    if (
      typeof date === 'string' &&
      typeof agentName === 'string' &&
      typeof shiftLabel === 'string' &&
      date.trim() &&
      agentName.trim() &&
      shiftLabel.trim() &&
      dateRegex.test(date.trim()) &&
      !isNaN(Date.parse(date.trim())) &&
      agentName.trim().length <= 100 &&
      shiftLabel.trim().length <= 50
    ) {
      cleanedData.push({
        date: date.trim(),
        agentName: agentName.trim(),
        shiftLabel: shiftLabel.trim()
      });
    }
  });

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, errors: [], data: cleanedData };
}

export function validateMessage(msg: any): { valid: boolean; errors: string[]; data?: string } {
  if (typeof msg !== 'string') {
    return { valid: false, errors: ['Must be string'] };
  }
  const trimmed = msg.trim();
  if (trimmed.length === 0) {
    return { valid: false, errors: ['Cannot be empty'] };
  }
  if (msg.length > 2000) {
    return { valid: false, errors: ['Max 2000 chars'] };
  }
  return { valid: true, errors: [], data: trimmed };
}
