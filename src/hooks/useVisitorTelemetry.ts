import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const SESSION_TOKEN_KEY = 'nexus_session_token';
const SESSION_ID_KEY = 'nexus_session_id';
const SESSION_REGISTERED_KEY = 'nexus_session_registered';
const HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds

function getDeviceType(): string {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

function getBrowserName(): string {
  if (typeof window === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome/')) return 'Chrome';
  if (ua.includes('Safari/')) return 'Safari';
  if (ua.includes('OPR/') || ua.includes('Opera/')) return 'Opera';
  return 'Browser';
}

function getOSName(): string {
  if (typeof window === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  if (ua.includes('Mac OS X')) return 'macOS';
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'OS';
}

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return crypto.randomUUID();
  try {
    let id = localStorage.getItem(SESSION_ID_KEY) || sessionStorage.getItem(SESSION_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_ID_KEY, id);
      sessionStorage.setItem(SESSION_ID_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export function getOrCreateSessionToken(): string {
  if (typeof window === 'undefined') return 'anonymous_server';
  try {
    let token = localStorage.getItem(SESSION_TOKEN_KEY) || sessionStorage.getItem(SESSION_TOKEN_KEY);
    if (!token) {
      token = `ses_${crypto.randomUUID()}`;
      localStorage.setItem(SESSION_TOKEN_KEY, token);
      sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    }
    return token;
  } catch {
    return 'anonymous_client';
  }
}

export function useVisitorTelemetry(currentDistrictIndex?: number) {
  const sessionIdRef = useRef<string>(getOrCreateSessionId());
  const tokenRef = useRef<string>(getOrCreateSessionToken());
  const lastHeartbeatRef = useRef<number>(0);
  const hasInitializedRef = useRef<boolean>(false);

  // Helper to log structured events
  const logEvent = useCallback(async (
    eventType: 'navigation' | 'interaction' | 'concierge' | 'lead' | 'system',
    eventName: string,
    metadata: Record<string, any> = {}
  ) => {
    try {
      const token = tokenRef.current;
      await supabase.from('visitor_events').insert({
        session_id: sessionIdRef.current,
        visitor_token: token,
        event_type: eventType,
        event_name: eventName,
        metadata: {
          ...metadata,
          url: window.location.pathname + window.location.hash,
        },
      });
    } catch {
      // Telemetry failures should never block visitor UX
    }
  }, []);

  // Initialize or resume visitor session
  useEffect(() => {
    // Avoid running on admin route itself
    if (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/auth')) {
      return;
    }

    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const token = tokenRef.current;
    const entryUrl = window.location.pathname + window.location.hash || '/';
    const referrer = document.referrer || null;
    const deviceType = getDeviceType();
    const browser = getBrowserName();
    const os = getOSName();

    async function registerSession() {
      try {
        const isRegistered = sessionStorage.getItem(SESSION_REGISTERED_KEY) === 'true';

        let geoData: {
          ip: string;
          country_name: string | null;
          country_code: string | null;
          city: string | null;
          region: string | null;
          latitude: number | null;
          longitude: number | null;
          timezone: string | null;
        } = {
          ip: 'Unknown',
          country_name: null,
          country_code: null,
          city: null,
          region: null,
          latitude: null,
          longitude: null,
          timezone: null,
        };

        try {
          // Fetch real IP and location
          const res = await fetch('https://ipapi.co/json/');
          if (res.ok) {
            const data = await res.json();
            if (!data.error) {
              geoData = {
                ip: data.ip || 'Unknown',
                country_name: data.country_name || null,
                country_code: data.country || null, // e.g. "US"
                city: data.city || data.region || null,
                region: data.region || null,
                latitude: typeof data.latitude === 'number' ? data.latitude : null,
                longitude: typeof data.longitude === 'number' ? data.longitude : null,
                timezone: data.timezone || null,
              };
            }
          }
        } catch {
          // Ignore geo fetch errors
        }

        const countryVal = geoData.country_code && geoData.country_name ? `${geoData.country_code}|${geoData.country_name}` : geoData.country_name;

        if (isRegistered) {
          // Update existing session
          await supabase
            .from('visitor_sessions')
            .update({
              current_url: entryUrl,
              last_seen_at: new Date().toISOString(),
              is_active: true,
              ip_masked: geoData.ip,
              country: countryVal,
              city: geoData.city,
            })
            .eq('visitor_token', token);
        } else {
          // Insert new session with client-generated UUID
          const { error } = await supabase
            .from('visitor_sessions')
            .insert({
              id: sessionIdRef.current,
              visitor_token: token,
              entry_url: entryUrl,
              current_url: entryUrl,
              referrer,
              device_type: deviceType,
              browser,
              os,
              is_active: true,
              last_seen_at: new Date().toISOString(),
              ip_masked: geoData.ip,
              country: countryVal,
              city: geoData.city,
            });

          if (!error) {
            sessionStorage.setItem(SESSION_REGISTERED_KEY, 'true');
          } else {
            // If already exists in DB from prior tab/session, update current state
            await supabase
              .from('visitor_sessions')
              .update({
                current_url: entryUrl,
                last_seen_at: new Date().toISOString(),
                is_active: true,
              })
              .eq('visitor_token', token);
            sessionStorage.setItem(SESSION_REGISTERED_KEY, 'true');
          }
        }

        // Log entry event with full telemetry
        await logEvent('navigation', 'page_entry', {
          entryUrl,
          referrer,
          device: deviceType,
          browser,
          os,
          ip: geoData.ip,
          country: countryVal,
          city: geoData.city,
          region: geoData.region,
          latitude: geoData.latitude,
          longitude: geoData.longitude,
          timezone: geoData.timezone,
        });
      } catch {
        // Graceful telemetry fallback
      }
    }

    registerSession();

    // Heartbeat Interval
    const heartbeatTimer = setInterval(async () => {
      // Only heartbeat if page is currently visible
      if (document.visibilityState !== 'visible') return;

      const now = Date.now();
      if (now - lastHeartbeatRef.current < HEARTBEAT_INTERVAL_MS - 2000) return;
      lastHeartbeatRef.current = now;

      try {
        await supabase
          .from('visitor_sessions')
          .update({
            current_url: window.location.pathname + window.location.hash || '/',
            last_seen_at: new Date().toISOString(),
            is_active: true,
          })
          .eq('visitor_token', token);
      } catch {
        // Silent
      }
    }, HEARTBEAT_INTERVAL_MS);

    // Handle visibility changes (away / return)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        try {
          await supabase
            .from('visitor_sessions')
            .update({
              last_seen_at: new Date().toISOString(),
              is_active: true,
            })
            .eq('visitor_token', token);
        } catch {
          // Silent
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(heartbeatTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [logEvent]);

  // Track District Changes in Spatial 3D Experience
  const prevDistrictRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (currentDistrictIndex === undefined) return;
    if (prevDistrictRef.current === currentDistrictIndex) return;

    const prevIndex = prevDistrictRef.current;
    prevDistrictRef.current = currentDistrictIndex;

    // Skip the first initial render event to avoid duplicate with page_entry
    if (prevIndex !== undefined) {
      logEvent('navigation', 'district_explored', {
        districtIndex: currentDistrictIndex,
      });

      // Update current_url in session
      supabase
        .from('visitor_sessions')
        .update({
          current_url: `/#district-${currentDistrictIndex}`,
          last_seen_at: new Date().toISOString(),
        })
        .eq('visitor_token', tokenRef.current)
        .then(() => {});
    }
  }, [currentDistrictIndex, logEvent]);

  return {
    visitorToken: tokenRef.current,
    sessionId: sessionIdRef.current,
    logEvent,
  };
}
