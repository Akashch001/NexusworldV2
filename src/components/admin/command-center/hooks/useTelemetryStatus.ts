import { useState, useEffect } from 'react';

export type TelemetryFreshnessLevel = 'live' | 'delayed' | 'stale' | 'offline' | 'waiting';

export interface TelemetryStatusResult {
  statusText: string;
  statusPillText: string;
  level: TelemetryFreshnessLevel;
  secondsAgo: number | null;
  relativeTimeText: string;
}

/**
 * Tracks real-time telemetry freshness and provides dynamic state strings
 * based on authentic timestamps and realtime connection state.
 */
export function useTelemetryStatus(
  latestTelemetryAt: Date | null,
  realtimeStatus: 'connected' | 'connecting' | 'disconnected' = 'connected'
): TelemetryStatusResult {
  const [, setTick] = useState(0);

  // Tick every second to update "X seconds ago"
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => (t + 1) % 1000000);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (realtimeStatus === 'disconnected') {
    return {
      statusText: 'NEXUS WORLD · REALTIME DISCONNECTED',
      statusPillText: 'OFFLINE',
      level: 'offline',
      secondsAgo: null,
      relativeTimeText: 'Connection lost',
    };
  }

  if (!latestTelemetryAt) {
    return {
      statusText: 'NEXUS WORLD · WAITING FOR TELEMETRY',
      statusPillText: 'WAITING',
      level: 'waiting',
      secondsAgo: null,
      relativeTimeText: 'No events yet',
    };
  }

  const now = Date.now();
  const secondsAgo = Math.max(0, Math.floor((now - latestTelemetryAt.getTime()) / 1000));

  let relativeTimeText = '';
  if (secondsAgo <= 2) {
    relativeTimeText = 'just now';
  } else if (secondsAgo < 60) {
    relativeTimeText = `${secondsAgo}s ago`;
  } else if (secondsAgo < 3600) {
    const mins = Math.floor(secondsAgo / 60);
    const secs = secondsAgo % 60;
    relativeTimeText = `${mins}m ${secs}s ago`;
  } else {
    const hours = Math.floor(secondsAgo / 3600);
    relativeTimeText = `${hours}h ago`;
  }

  // Under 60s is considered live
  if (secondsAgo <= 60) {
    return {
      statusText: 'NEXUS WORLD · SYSTEM LIVE',
      statusPillText: `LIVE (${relativeTimeText})`,
      level: 'live',
      secondsAgo,
      relativeTimeText,
    };
  }

  // 60s to 300s (5m) is delayed
  if (secondsAgo <= 300) {
    return {
      statusText: 'NEXUS WORLD · TELEMETRY DELAYED',
      statusPillText: `DELAYED (${relativeTimeText})`,
      level: 'delayed',
      secondsAgo,
      relativeTimeText,
    };
  }

  // Over 5m is considered stale
  return {
    statusText: 'NEXUS WORLD · TELEMETRY STALE',
    statusPillText: `STALE (${relativeTimeText})`,
    level: 'stale',
    secondsAgo,
    relativeTimeText,
  };
}
