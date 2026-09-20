/**
 * Nexus World — Date, Time & IANA Timezone Service
 * Provides server-authoritative and client-side timezone calculations,
 * DST handling, natural-language date resolution, and dynamic formatting.
 */

export interface TimezoneOption {
  value: string;
  label: string;
  abbr: string;
}

/**
 * Validates whether a string is a recognized IANA timezone identifier.
 */
export function isValidIanaTimezone(tz: string | null | undefined): boolean {
  if (!tz || typeof tz !== 'string') return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely returns user's browser IANA timezone with validation.
 */
export function detectUserTimezone(): string {
  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (isValidIanaTimezone(detected)) {
      return detected;
    }
  } catch (err) {
    console.warn('Failed to detect client timezone:', err);
  }
  return 'UTC';
}

/**
 * Curated list of major IANA timezones for UI selection,
 * always including the user's detected local timezone at the top.
 */
export function getAvailableTimezones(userTz?: string): TimezoneOption[] {
  const local = userTz || detectUserTimezone();
  const majorZones: string[] = [
    'Asia/Kolkata',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Dubai',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Australia/Sydney',
    'UTC',
  ];

  const list: string[] = Array.from(new Set([local, ...majorZones]));

  return list.map((tz) => {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        timeZoneName: 'short',
      });
      const parts = formatter.formatToParts(now);
      const tzName = parts.find((p) => p.type === 'timeZoneName')?.value || '';
      return {
        value: tz,
        label: `${tz.replace('_', ' ')} (${tzName})`,
        abbr: tzName,
      };
    } catch {
      return { value: tz, label: tz, abbr: 'UTC' };
    }
  });
}

/**
 * Formats a UTC timestamp into a user-friendly local date & time display in the target IANA timezone.
 */
export function formatSlotForDisplay(
  isoOrDate: string | Date,
  timeZone: string = 'UTC',
  options?: { showDateOnly?: boolean; showTimeOnly?: boolean }
): {
  dayName: string;
  formattedDate: string;
  formattedTime: string;
  fullDisplay: string;
  tzAbbr: string;
} {
  const safeTz = isValidIanaTimezone(timeZone) ? timeZone : 'UTC';
  const date = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;

  const dayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: safeTz,
    weekday: 'long',
  });

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: safeTz,
    month: 'short',
    day: 'numeric',
  });

  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: safeTz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const tzFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: safeTz,
    timeZoneName: 'short',
  });

  const dayName = dayFormatter.format(date);
  const formattedDate = dateFormatter.format(date);
  const formattedTime = timeFormatter.format(date);
  const tzParts = tzFormatter.formatToParts(date);
  const tzAbbr = tzParts.find((p) => p.type === 'timeZoneName')?.value || '';

  let fullDisplay = `${dayName}, ${formattedDate} · ${formattedTime} ${tzAbbr}`.trim();
  if (options?.showDateOnly) {
    fullDisplay = `${dayName}, ${formattedDate}`;
  } else if (options?.showTimeOnly) {
    fullDisplay = `${formattedTime} ${tzAbbr}`.trim();
  }

  return {
    dayName,
    formattedDate,
    formattedTime: `${formattedTime} ${tzAbbr}`.trim(),
    fullDisplay,
    tzAbbr,
  };

}

/**
 * Dynamically resolves natural language relative date expressions
 * against the current runtime clock and user's IANA timezone.
 */
export function resolveNaturalLanguageDate(
  expression: string,
  timeZone: string = 'UTC',
  baseDate: Date = new Date()
): { resolvedDate: Date; dateStringYYYYMMDD: string } {
  const safeTz = isValidIanaTimezone(timeZone) ? timeZone : 'UTC';
  const expr = expression.toLowerCase().trim();

  // Get current date representation in target timezone
  const tzYear = Number(new Intl.DateTimeFormat('en-US', { timeZone: safeTz, year: 'numeric' }).format(baseDate));
  const tzMonth = Number(new Intl.DateTimeFormat('en-US', { timeZone: safeTz, month: 'numeric' }).format(baseDate)) - 1;
  const tzDay = Number(new Intl.DateTimeFormat('en-US', { timeZone: safeTz, day: 'numeric' }).format(baseDate));
  const tzHours = Number(new Intl.DateTimeFormat('en-US', { timeZone: safeTz, hour: 'numeric', hour12: false }).format(baseDate));

  let targetYear = tzYear;
  let targetMonth = tzMonth;
  let targetDay = tzDay;
  let targetHour = tzHours;

  if (expr.includes('tomorrow')) {
    targetDay += 1;
  } else if (expr.includes('today')) {
    // remains targetDay
  } else if (expr.includes('later today') || expr.includes('this evening')) {
    targetHour = 18;
  } else if (expr.includes('in two hours') || expr.includes('in 2 hours')) {
    targetHour += 2;
  } else {
    // Check day of week mentions (e.g. 'next monday', 'friday')
    const daysMap: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };
    for (const [dayName, dayIndex] of Object.entries(daysMap)) {
      if (expr.includes(dayName)) {
        const currentDayOfWeek = new Date(Date.UTC(tzYear, tzMonth, tzDay)).getUTCDay();
        let diff = dayIndex - currentDayOfWeek;
        if (diff <= 0 || expr.includes('next')) {
          diff += 7;
        }
        targetDay += diff;
        break;
      }
    }
  }

  // Normalize date
  const resolved = new Date(Date.UTC(targetYear, targetMonth, targetDay, targetHour, 0, 0));
  const yyyy = resolved.getUTCFullYear();
  const mm = String(resolved.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(resolved.getUTCDate()).padStart(2, '0');

  return {
    resolvedDate: resolved,
    dateStringYYYYMMDD: `${yyyy}-${mm}-${dd}`,
  };
}

/**
 * Returns dynamic context for LLM prompt:
 * Authoritative current UTC time, user timezone, and current local date/time.
 */
export function getRuntimeDateTimeContext(userTz?: string): {
  current_time_utc: string;
  user_timezone: string;
  current_local_date: string;
  current_local_time: string;
} {
  const safeTz = userTz && isValidIanaTimezone(userTz) ? userTz : detectUserTimezone();
  const now = new Date();

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: safeTz,
    dateStyle: 'full',
  });

  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: safeTz,
    timeStyle: 'long',
  });

  return {
    current_time_utc: now.toISOString(),
    user_timezone: safeTz,
    current_local_date: dateFormatter.format(now),
    current_local_time: timeFormatter.format(now),
  };
}
