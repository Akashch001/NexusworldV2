// ==============================================================================
// NEXUS WORLD — RESEND EMAIL NOTIFICATION SERVICE
// ==============================================================================

// @ts-ignore
declare const Deno: any;

export interface ClientEmailData {
  clientName: string;
  clientEmail: string;
  meetingType: string;
  scheduledStart: string; // formatted date/time string
  timezone: string;
  meetingLink?: string | null;
  projectContext?: string | null;
}

export interface OwnerEmailData {
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  companyName?: string | null;
  serviceInterest?: string | null;
  projectDescription?: string | null;
  timeline?: string | null;
  budgetRange?: string | null;
  leadScore: number;
  leadTemperature: string;
  scheduledStart: string;
  timezone: string;
  meetingType: string;
  conversationSummary?: string | null;
}

export async function sendClientConfirmationEmail(
  data: ClientEmailData
): Promise<{ success: boolean; error?: string }> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('NEXUS_FROM_EMAIL') || 'onboarding@resend.dev';

  if (!apiKey) {
    console.warn('Email failed: RESEND_API_KEY is not configured on server.');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; background-color: #0b0c10; color: #f4f4f6; border-radius: 12px; border: 1px solid #1f2430;">
      <div style="border-bottom: 1px solid #1f2430; padding-bottom: 16px; margin-bottom: 24px;">
        <span style="font-family: monospace; font-size: 11px; letter-spacing: 2px; color: #3b82f6; text-transform: uppercase;">NEXUS WORLD // CONFIRMATION</span>
        <h1 style="font-size: 22px; font-weight: 700; margin: 8px 0 0 0; color: #ffffff;">${data.meetingType} Confirmed</h1>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #d1d5db;">
        Hello ${escapeHtml(data.clientName)},
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #d1d5db;">
        Your consultation session with the NexusWorld team has been successfully scheduled. We look forward to exploring your roadmap and strategic vision.
      </p>

      <div style="background-color: #131722; border: 1px solid #23293a; border-radius: 8px; padding: 18px; margin: 24px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #9ca3af; font-family: monospace; width: 140px;">SESSION:</td>
            <td style="padding: 6px 0; color: #ffffff; font-weight: 600;">${escapeHtml(data.meetingType)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #9ca3af; font-family: monospace;">SCHEDULED TIME:</td>
            <td style="padding: 6px 0; color: #60a5fa; font-weight: 600;">${escapeHtml(data.scheduledStart)} (${escapeHtml(data.timezone)})</td>
          </tr>
          ${data.meetingLink ? `
          <tr>
            <td style="padding: 6px 0; color: #9ca3af; font-family: monospace;">LOCATION / LINK:</td>
            <td style="padding: 6px 0;"><a href="${escapeHtml(data.meetingLink)}" style="color: #3b82f6;">Join Meeting</a></td>
          </tr>` : `
          <tr>
            <td style="padding: 6px 0; color: #9ca3af; font-family: monospace;">ACCESS:</td>
            <td style="padding: 6px 0; color: #e5e7eb;">Direct link will be shared prior to call</td>
          </tr>`}
        </table>
      </div>

      ${data.projectContext ? `
      <div style="margin: 20px 0; padding: 14px; background: rgba(59, 130, 246, 0.05); border-left: 3px solid #3b82f6; font-size: 13px; color: #cbd5e1;">
        <strong style="color: #ffffff; display: block; margin-bottom: 4px; font-family: monospace; font-size: 11px;">FOCUS & CONTEXT:</strong>
        ${escapeHtml(data.projectContext)}
      </div>` : ''}

      <p style="font-size: 12px; line-height: 1.6; color: #6b7280; margin-top: 32px; border-top: 1px solid #1f2430; padding-top: 16px;">
        NexusWorld Intelligence System · Need to reschedule? Simply reply to this email.
      </p>
    </div>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `NexusWorld <${fromEmail}>`,
        to: [data.clientEmail],
        subject: `Confirmed: ${data.meetingType} with NexusWorld`,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('Email failed: Resend returned error status', res.status);
      return { success: false, error: `Resend error: ${res.status}` };
    }

    console.log('Email sent: Client confirmation delivered successfully');
    return { success: true };
  } catch (err: any) {
    console.warn('Email failed: Network error contacting Resend API');
    return { success: false, error: err?.message || 'Network failure' };
  }
}

export async function sendOwnerNotificationEmail(
  data: OwnerEmailData
): Promise<{ success: boolean; error?: string }> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const ownerEmail = Deno.env.get('NEXUS_OWNER_EMAIL');
  const fromEmail = Deno.env.get('NEXUS_FROM_EMAIL') || 'onboarding@resend.dev';

  if (!apiKey || !ownerEmail) {
    console.warn('Email failed: RESEND_API_KEY or NEXUS_OWNER_EMAIL is not configured.');
    return { success: false, error: 'Email configuration missing on server' };
  }

  const tempBadgeColor =
    data.leadTemperature === 'hot'
      ? '#ef4444'
      : data.leadTemperature === 'warm'
      ? '#f59e0b'
      : '#3b82f6';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 650px; margin: 0 auto; padding: 28px; background-color: #0b0c10; color: #f4f4f6; border-radius: 12px; border: 1px solid #1f2430;">
      <div style="border-bottom: 1px solid #1f2430; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-family: monospace; font-size: 11px; letter-spacing: 2px; color: #10b981; text-transform: uppercase;">⚡ NEW NEXUSWORLD MEETING</span>
          <h1 style="font-size: 22px; font-weight: 700; margin: 6px 0 0 0; color: #ffffff;">Discovery Call Booked</h1>
        </div>
      </div>

      <div style="display: flex; gap: 12px; margin-bottom: 20px;">
        <span style="display: inline-block; padding: 4px 10px; border-radius: 4px; background-color: ${tempBadgeColor}20; color: ${tempBadgeColor}; font-size: 11px; font-family: monospace; font-weight: 700; text-transform: uppercase; border: 1px solid ${tempBadgeColor}40;">
          TEMP: ${data.leadTemperature}
        </span>
        <span style="display: inline-block; padding: 4px 10px; border-radius: 4px; background-color: #3b82f620; color: #60a5fa; font-size: 11px; font-family: monospace; font-weight: 700; border: 1px solid #3b82f640;">
          SCORE: ${data.leadScore}/100
        </span>
      </div>

      <div style="background-color: #131722; border: 1px solid #23293a; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
        <h3 style="margin-top: 0; font-size: 13px; font-family: monospace; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">Client Dossier</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #9ca3af; font-family: monospace; width: 140px;">NAME:</td>
            <td style="padding: 6px 0; color: #ffffff; font-weight: 600;">${escapeHtml(data.clientName)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #9ca3af; font-family: monospace;">EMAIL:</td>
            <td style="padding: 6px 0;"><a href="mailto:${escapeHtml(data.clientEmail)}" style="color: #3b82f6;">${escapeHtml(data.clientEmail)}</a></td>
          </tr>
          ${data.clientPhone ? `
          <tr>
            <td style="padding: 6px 0; color: #9ca3af; font-family: monospace;">PHONE:</td>
            <td style="padding: 6px 0; color: #e5e7eb;">${escapeHtml(data.clientPhone)}</td>
          </tr>` : ''}
          ${data.companyName ? `
          <tr>
            <td style="padding: 6px 0; color: #9ca3af; font-family: monospace;">COMPANY:</td>
            <td style="padding: 6px 0; color: #ffffff;">${escapeHtml(data.companyName)}</td>
          </tr>` : ''}
          ${data.serviceInterest ? `
          <tr>
            <td style="padding: 6px 0; color: #9ca3af; font-family: monospace;">SERVICE INTEREST:</td>
            <td style="padding: 6px 0; color: #e5e7eb;">${escapeHtml(data.serviceInterest)}</td>
          </tr>` : ''}
          ${data.timeline ? `
          <tr>
            <td style="padding: 6px 0; color: #9ca3af; font-family: monospace;">TIMELINE:</td>
            <td style="padding: 6px 0; color: #e5e7eb;">${escapeHtml(data.timeline)}</td>
          </tr>` : ''}
          ${data.budgetRange ? `
          <tr>
            <td style="padding: 6px 0; color: #9ca3af; font-family: monospace;">BUDGET:</td>
            <td style="padding: 6px 0; color: #e5e7eb;">${escapeHtml(data.budgetRange)}</td>
          </tr>` : ''}
        </table>
      </div>

      <div style="background-color: #131722; border: 1px solid #23293a; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
        <h3 style="margin-top: 0; font-size: 13px; font-family: monospace; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">Appointment Specification</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #9ca3af; font-family: monospace; width: 140px;">MEETING TYPE:</td>
            <td style="padding: 6px 0; color: #ffffff; font-weight: 600;">${escapeHtml(data.meetingType)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #9ca3af; font-family: monospace;">SCHEDULED TIME:</td>
            <td style="padding: 6px 0; color: #10b981; font-weight: 600;">${escapeHtml(data.scheduledStart)} (${escapeHtml(data.timezone)})</td>
          </tr>
        </table>
      </div>

      ${data.projectDescription ? `
      <div style="margin-bottom: 20px; padding: 14px; background: rgba(59, 130, 246, 0.05); border-left: 3px solid #3b82f6; font-size: 13px; color: #cbd5e1;">
        <strong style="color: #ffffff; display: block; margin-bottom: 4px; font-family: monospace; font-size: 11px;">PROJECT SUMMARY:</strong>
        ${escapeHtml(data.projectDescription)}
      </div>` : ''}

      ${data.conversationSummary ? `
      <div style="margin-bottom: 20px; padding: 14px; background: #181d29; border-radius: 8px; font-size: 12px; color: #9ca3af; font-family: monospace;">
        <strong style="color: #ffffff; display: block; margin-bottom: 6px;">NORA CONVERSATION CONTEXT:</strong>
        ${escapeHtml(data.conversationSummary)}
      </div>` : ''}

      <p style="font-size: 11px; line-height: 1.6; color: #6b7280; margin-top: 28px; border-top: 1px solid #1f2430; padding-top: 14px;">
        NexusWorld V2 · Automated Lead Intelligence · Generated via Supabase Edge Function
      </p>
    </div>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Nexus Intelligence <${fromEmail}>`,
        to: [ownerEmail],
        subject: `[${data.leadTemperature.toUpperCase()}] New Meeting: ${data.clientName} (${data.companyName || 'Private'})`,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('Email failed: Resend returned error status', res.status);
      return { success: false, error: `Resend error: ${res.status}` };
    }

    console.log('Email sent: Owner notification delivered successfully');
    return { success: true };
  } catch (err: any) {
    console.warn('Email failed: Network error contacting Resend API');
    return { success: false, error: err?.message || 'Network failure' };
  }
}

function escapeHtml(text?: string | null): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
