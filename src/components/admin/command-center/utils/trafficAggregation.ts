import type { VisitorSession, VisitorEvent } from '../types';

export interface TrafficBucket {
  timestamp: string; // ISO string of bucket start
  label: string;     // Formatted time, e.g. "14:32"
  bucketStart: Date;
  bucketEnd: Date;
  activeVisitors: number;
  eventCount: number;
}

export interface TrafficAggregationResult {
  rangeMinutes: 15 | 30 | 60;
  buckets: TrafficBucket[];
  currentActive: number;
  peakActive: number;
  totalEvents: number;
  hasActivity: boolean;
}

/**
 * Aggregates genuine visitor sessions and events into discrete time buckets
 * for the real-time traffic chart. Zero fabricated data points.
 */
export function generateTrafficBuckets(
  sessions: VisitorSession[],
  events: VisitorEvent[],
  rangeMinutes: 15 | 30 | 60 = 30,
  nowDate: Date = new Date()
): TrafficAggregationResult {
  const now = nowDate.getTime();
  const startTime = now - rangeMinutes * 60 * 1000;

  // Choose interval per range for optimal visual density
  // 15m: 15 buckets (1 min each)
  // 30m: 15 buckets (2 min each)
  // 60m: 20 buckets (3 min each)
  let bucketCount = 15;
  if (rangeMinutes === 60) {
    bucketCount = 20;
  }
  const bucketDurationMs = (rangeMinutes * 60 * 1000) / bucketCount;

  const buckets: TrafficBucket[] = [];
  let peakActive = 0;
  let totalEvents = 0;

  for (let i = 0; i < bucketCount; i++) {
    const bStart = new Date(startTime + i * bucketDurationMs);
    const bEnd = new Date(startTime + (i + 1) * bucketDurationMs);

    // Active Visitors in this bucket window:
    // A session was active if its creation was before/during bucketEnd
    // and its last_seen_at was during/after bucketStart
    const activeInBucket = sessions.filter((s) => {
      const created = new Date(s.created_at).getTime();
      const lastSeen = new Date(s.last_seen_at).getTime();
      return created <= bEnd.getTime() && lastSeen >= bStart.getTime();
    }).length;

    // Events recorded within this bucket window
    const eventsInBucket = events.filter((e) => {
      const evTime = new Date(e.created_at).getTime();
      return evTime >= bStart.getTime() && evTime < bEnd.getTime();
    }).length;

    totalEvents += eventsInBucket;
    if (activeInBucket > peakActive) {
      peakActive = activeInBucket;
    }

    const timeLabel = bStart.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    buckets.push({
      timestamp: bStart.toISOString(),
      label: timeLabel,
      bucketStart: bStart,
      bucketEnd: bEnd,
      activeVisitors: activeInBucket,
      eventCount: eventsInBucket,
    });
  }

  // Current active visitors based on actual active sessions
  const currentActive = sessions.filter((s) => s.is_active).length;
  const hasActivity = buckets.some((b) => b.activeVisitors > 0 || b.eventCount > 0);

  return {
    rangeMinutes,
    buckets,
    currentActive,
    peakActive,
    totalEvents,
    hasActivity,
  };
}
