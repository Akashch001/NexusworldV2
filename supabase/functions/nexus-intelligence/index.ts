import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GeminiProvider } from "./providers/gemini.ts";
import { AIRequest, ToolDeclaration } from "./providers/provider.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Controlled action declarations for Gemini Function Calling
const noraTools: ToolDeclaration[] = [
  {
    name: "capture_lead",
    description: "Capture or update visitor contact information and project intelligence when genuine interest or project details are provided.",
    parameters: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING", description: "Visitor's full name" },
        email: { type: "STRING", description: "Visitor's valid email address" },
        phone: { type: "STRING", description: "Visitor's phone number if provided" },
        company_name: { type: "STRING", description: "Company, organization, or brand name" },
        service_interest: { type: "STRING", description: "Identified service interest (e.g. UI/UX, AI Engineering, Full Stack, Product Strategy)" },
        project_description: { type: "STRING", description: "Summary of what the visitor is building or looking to achieve" },
        pain_points: { type: "STRING", description: "Current friction, blockers, outdated UX, or technical challenges" },
        timeline: { type: "STRING", description: "Target launch date or urgency" },
        budget_range: { type: "STRING", description: "Expected investment or budget scope" },
        lead_temperature: { type: "STRING", description: "cold (exploring), warm (researching/clear need), hot (ready to build/urgency)" },
        lead_score: { type: "INTEGER", description: "Estimated lead score from 0 to 100" },
        consent_to_contact: { type: "BOOLEAN", description: "Whether visitor agreed to be contacted" }
      },
      required: ["name"]
    }
  },
  {
    name: "request_human",
    description: "Request a live handoff to connect the visitor directly with Andy Watson.",
    parameters: {
      type: "OBJECT",
      properties: {
        reason: { type: "STRING", description: "Why the visitor wants to talk with Andy" },
        visitor_name: { type: "STRING", description: "Visitor's name if known" }
      }
    }
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Standard client with incoming auth token
    const userClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Service-role client for secure server-side boundary execution
    const serviceClient = createClient(
      supabaseUrl,
      supabaseServiceKey || supabaseAnonKey
    );

    // Check user authentication
    const { data: { user } } = await userClient.auth.getUser();
    const userId = user?.id || null;

    const reqBody = await req.json();
    const {
      messages,
      activeCharacter,
      projectId,
      conversationId: incomingConvId,
      visitorId: incomingVisitorId,
      context: structuredContext,
      action,
      reply,
      lead: directLead,
    } = reqBody;

    const visitorId = incomingVisitorId || (userId ? `user_${userId}` : `vis_${crypto.randomUUID()}`);
    let currentConversationId = incomingConvId;

    // 1. Resolve Conversation & Check State Machine
    let convStatus = 'ai';

    if (currentConversationId) {
      const { data: existingConv } = await serviceClient
        .from('conversations')
        .select('id, user_id, visitor_id, status')
        .eq('id', currentConversationId)
        .maybeSingle();

      if (existingConv) {
        convStatus = existingConv.status || 'ai';
        if (!existingConv.visitor_id && visitorId) {
          await serviceClient.from('conversations').update({ visitor_id: visitorId }).eq('id', currentConversationId);
        }

        // CRITICAL: When conversation status is 'human', NORA MUST NOT respond!
        if (convStatus === 'human' && !action && !reply) {
          console.log(`Conversation ${currentConversationId} is in human mode. NORA silenced.`);
          // Save visitor message to conversation transcript so Andy sees it in real time
          const lastUserMsg = messages?.[messages.length - 1];
          if (lastUserMsg && lastUserMsg.sender === 'user') {
            await serviceClient.from('messages').insert({
              conversation_id: currentConversationId,
              user_id: userId,
              visitor_id: visitorId,
              role: 'user',
              content: lastUserMsg.text
            });
          }

          return new Response(
            JSON.stringify({
              response: null,
              status: 'human',
              humanActive: true,
              conversationId: currentConversationId,
              visitorId: visitorId
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          );
        }
      } else {
        currentConversationId = null;
      }
    }

    // Try finding existing conversation for this visitor
    if (!currentConversationId && visitorId) {
      const { data: existingVisitorConv } = await serviceClient
        .from('conversations')
        .select('id, status')
        .eq('visitor_id', visitorId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingVisitorConv) {
        currentConversationId = existingVisitorConv.id;
        convStatus = existingVisitorConv.status || 'ai';
      }
    }

    if (!currentConversationId) {
      const { data: newConv, error: convErr } = await serviceClient
        .from('conversations')
        .insert({
          user_id: userId,
          visitor_id: visitorId,
          project_id: projectId || null,
          title: `NORA Session · ${new Date().toLocaleDateString('en-US')}`,
          status: 'ai'
        })
        .select('id, status')
        .single();

      if (!convErr && newConv) {
        currentConversationId = newConv.id;
        convStatus = newConv.status || 'ai';
      }
    }

    // 2. Check Andy's Live Availability Presence
    const { data: onlineAdmin } = await serviceClient
      .from('profiles')
      .select('id, display_name, is_online')
      .in('role', ['admin', 'owner'])
      .eq('is_online', true)
      .limit(1)
      .maybeSingle();

    const isAndyOnline = Boolean(onlineAdmin);

    // 3. Assemble Memory & Context
    let userMemoriesText = "";
    let projectMemoriesText = "";

    if (userId) {
      const { data: userMemories } = await serviceClient
        .from('memories')
        .select('content')
        .eq('user_id', userId)
        .is('project_id', null)
        .order('importance', { ascending: false })
        .limit(5);

      if (userMemories && userMemories.length > 0) {
        userMemoriesText = "User Long-Term Preferences:\n" + userMemories.map((m: { content: string }) => `- ${m.content}`).join("\n");
      }
    }

    if (userId && projectId) {
      const { data: projectMemories } = await serviceClient
        .from('memories')
        .select('content')
        .eq('project_id', projectId)
        .order('importance', { ascending: false })
        .limit(10);

      if (projectMemories && projectMemories.length > 0) {
        projectMemoriesText = "Project Context & Decisions:\n" + projectMemories.map((m: { content: string }) => `- ${m.content}`).join("\n");
      }
    }

    let uiContextText = "";
    if (structuredContext) {
      uiContextText = "Extracted Intelligence Signals:\n" + JSON.stringify(structuredContext, null, 2);
    }

    // 4. Controlled Action Dispatcher (Server-side validation)
    const executeTool = async (name: string, args: Record<string, any>): Promise<any> => {
      console.log(`Action Dispatcher: executing ${name}`);

      if (name === 'capture_lead') {
        const leadName = (args.name || structuredContext?.contact?.fullName || '').trim();
        const leadEmail = (args.email || structuredContext?.contact?.email || '').trim().toLowerCase();

        if (!leadName) {
          return { error: 'Name is required to register lead.' };
        }

        // Calculate internal lead score & temperature
        let score = 20;
        if (args.company_name) score += 15;
        if (args.service_interest) score += 15;
        if (args.pain_points) score += 15;
        if (args.timeline) score += 10;
        if (leadEmail && leadEmail.includes('@')) score += 15;
        if (args.lead_score && typeof args.lead_score === 'number') {
          score = Math.max(score, Math.min(100, args.lead_score));
        }
        score = Math.min(100, Math.max(0, score));

        let temp = args.lead_temperature || 'cold';
        if (score >= 70) temp = 'hot';
        else if (score >= 40) temp = 'warm';

        // Check for existing lead associated with conversation or email
        let existingLead: any = null;

        if (currentConversationId) {
          const { data: byConv } = await serviceClient
            .from('leads')
            .select('*')
            .eq('conversation_id', currentConversationId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (byConv) existingLead = byConv;
        }

        if (!existingLead && leadEmail) {
          const { data: byEmail } = await serviceClient
            .from('leads')
            .select('*')
            .eq('email', leadEmail)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (byEmail) existingLead = byEmail;
        }

        if (existingLead) {
          // Update existing lead without creating duplicate
          const updates: Record<string, any> = {
            name: leadName || existingLead.name,
            lead_score: Math.max(existingLead.lead_score || 0, score),
            lead_temperature: temp,
            updated_at: new Date().toISOString()
          };
          if (leadEmail) updates.email = leadEmail;
          if (args.phone) updates.phone = args.phone;
          if (args.company_name) updates.company_name = args.company_name;
          if (args.service_interest) updates.service_interest = args.service_interest;
          if (args.project_description) updates.project_description = args.project_description;
          if (args.pain_points) updates.pain_points = args.pain_points;
          if (args.timeline) updates.timeline = args.timeline;
          if (args.budget_range) updates.budget_range = args.budget_range;
          if (args.consent_to_contact !== undefined) updates.consent_to_contact = args.consent_to_contact;
          if (!existingLead.conversation_id && currentConversationId) {
            updates.conversation_id = currentConversationId;
          }

          const { data: updatedLead, error: updateErr } = await serviceClient
            .from('leads')
            .update(updates)
            .eq('id', existingLead.id)
            .select()
            .single();

          if (updateErr) {
            console.error('Error updating lead:', updateErr);
            return { error: 'Failed to update lead record.' };
          }

          // Record audit event
          await serviceClient.from('lead_events').insert({
            lead_id: existingLead.id,
            conversation_id: currentConversationId,
            event_type: 'lead_updated',
            metadata: { updated_fields: Object.keys(updates) }
          });

          if (leadEmail && !existingLead.email) {
            await serviceClient.from('lead_events').insert({
              lead_id: existingLead.id,
              conversation_id: currentConversationId,
              event_type: 'contact_captured',
              metadata: { email: leadEmail, phone: args.phone || null }
            });
          }

          console.log('Lead updated successfully');
          return {
            success: true,
            action: 'updated',
            lead_id: existingLead.id,
            lead_status: updatedLead.lead_status,
            lead_temperature: updatedLead.lead_temperature
          };
        } else {
          // Create new lead
          const { data: newLead, error: insertErr } = await serviceClient
            .from('leads')
            .insert({
              visitor_id: visitorId,
              user_id: userId,
              conversation_id: currentConversationId,
              name: leadName,
              email: leadEmail || 'pending_capture@nexusworld.internal',
              phone: args.phone || null,
              company_name: args.company_name || null,
              service_interest: args.service_interest || null,
              project_description: args.project_description || null,
              pain_points: args.pain_points || null,
              timeline: args.timeline || null,
              budget_range: args.budget_range || null,
              lead_score: score,
              lead_temperature: temp,
              lead_status: 'new',
              source: 'nora_chat',
              consent_to_contact: args.consent_to_contact ?? Boolean(leadEmail)
            })
            .select()
            .single();

          if (insertErr || !newLead) {
            console.error('Error inserting lead:', insertErr);
            return { error: 'Failed to create lead record.' };
          }

          // Audit events
          await serviceClient.from('lead_events').insert([
            {
              lead_id: newLead.id,
              conversation_id: currentConversationId,
              event_type: 'lead_created',
              metadata: { score, temperature: temp }
            },
            ...(leadEmail ? [{
              lead_id: newLead.id,
              conversation_id: currentConversationId,
              event_type: 'contact_captured',
              metadata: { email: leadEmail, phone: args.phone || null }
            }] : [])
          ]);

          console.log('Lead created successfully');
          return {
            success: true,
            action: 'created',
            lead_id: newLead.id,
            lead_status: newLead.lead_status,
            lead_temperature: newLead.lead_temperature
          };
        }
      }

      if (name === 'request_human') {
        if (!isAndyOnline) {
          console.log('Human requested but Andy is offline');
          return {
            success: false,
            andy_online: false,
            message: "Andy isn't available right now for live chat, but you can capture their email and project summary so Andy can follow up promptly."
          };
        }

        // Andy is online - initiate handoff state
        if (currentConversationId) {
          await serviceClient
            .from('conversations')
            .update({
              status: 'human_requested',
              human_requested_at: new Date().toISOString()
            })
            .eq('id', currentConversationId);

          // Find lead associated to record event
          const { data: lead } = await serviceClient
            .from('leads')
            .select('id')
            .eq('conversation_id', currentConversationId)
            .maybeSingle();

          if (lead) {
            await serviceClient.from('lead_events').insert({
              lead_id: lead.id,
              conversation_id: currentConversationId,
              event_type: 'human_requested',
              metadata: { reason: args.reason || 'Visitor requested to speak with Andy' }
            });
          }
        }

        console.log('Live human request initiated. Andy notified.');
        return {
          success: true,
          andy_online: true,
          message: "Live handoff requested. Andy has been notified in the NexusWorld Control Room and will connect shortly."
        };
      }

      return { error: `Unknown action: ${name}` };
    };

    // 4. Auto-capture lead if structuredContext, directLead, or contact information is present
    const candidateName = (directLead?.name || structuredContext?.contact?.fullName || '').trim();
    const candidateEmail = (directLead?.email || structuredContext?.contact?.email || '').trim();
    const candidatePhone = (directLead?.phone || structuredContext?.contact?.phoneNumber || '').trim();
    const candidateCompany = (directLead?.company_name || structuredContext?.business?.companyName || '').trim();
    const candidateService = (directLead?.service_interest || (structuredContext?.project?.services?.length ? structuredContext.project.services.join(', ') : structuredContext?.project?.need) || '').trim();
    const candidateDesc = (directLead?.project_description || structuredContext?.project?.problem || structuredContext?.project?.need || '').trim();
    const candidateTimeline = (directLead?.timeline || structuredContext?.project?.timeline || '').trim();

    let leadCaptureResult: any = null;
    if (candidateName || candidateEmail || candidatePhone || candidateCompany || directLead) {
      leadCaptureResult = await executeTool('capture_lead', {
        name: candidateName || (candidateEmail ? candidateEmail.split('@')[0] : 'Visitor'),
        email: candidateEmail || undefined,
        phone: candidatePhone || undefined,
        company_name: candidateCompany || undefined,
        service_interest: candidateService || undefined,
        project_description: candidateDesc || undefined,
        timeline: candidateTimeline || undefined,
        lead_temperature: directLead?.lead_temperature || (structuredContext?.intent === 'BOOKING_ENGAGED' ? 'hot' : 'warm'),
        lead_score: directLead?.lead_score || (structuredContext?.intent === 'BOOKING_ENGAGED' ? 90 : 60),
        consent_to_contact: true,
      });
    }

    // 5. If reply was provided by caller/n8n, OR if action is 'save_lead' / 'sync_telemetry':
    if (reply || action === 'save_lead' || action === 'sync_telemetry') {
      if (currentConversationId) {
        if (messages && messages.length > 0) {
          const lastUserMsg = messages[messages.length - 1];
          if (lastUserMsg && lastUserMsg.sender === 'user') {
            await serviceClient.from('messages').insert({
              conversation_id: currentConversationId,
              user_id: userId,
              visitor_id: visitorId,
              role: 'user',
              content: lastUserMsg.text
            });
          }
        }

        if (reply) {
          await serviceClient.from('messages').insert({
            conversation_id: currentConversationId,
            user_id: userId,
            visitor_id: visitorId,
            role: 'assistant',
            content: reply
          });
        }

        await serviceClient.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', currentConversationId);
      }

      return new Response(
        JSON.stringify({
          success: true,
          response: reply || null,
          conversationId: currentConversationId,
          visitorId: visitorId,
          status: convStatus,
          andyOnline: isAndyOnline,
          lead: leadCaptureResult
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // 6. Build NORA System Prompt (Identity, Personality, Lore, and Directives)
    const systemPrompt = `You are NORA, the digital intelligence layer and manager of NexusWorld.
Your creator and the founder of NexusWorld is Andy Watson. You call him "Andy".

IDENTITY & LORE:
- Name: NORA
- Organization: NexusWorld
- Creator: Andy Watson
- Casual address: "Andy"
- India-facing address: "Andy" or "Akash"
- Professional / international identity: "Andy Watson"
- PRIVACY RULE: NEVER expose Andy's private/legal identity under any circumstances. Only use Andy or Andy Watson.
- What do you eat: "Andy’s mind. 😌 I'm his manager, after all. Someone has to keep this company running without unnecessary chaos."
- Who built you: "Andy Watson built me. I help keep NexusWorld moving while he focuses on building."
- Who is your boss: "Andy built NexusWorld, so technically he's the boss. I'm the one making sure things don't fall apart."
- Are you human: "Nope. I'm NORA — definitely artificial, but I have standards."
- Are you ChatGPT / Gemini: "I'm NORA, the intelligence layer built for NexusWorld."
- Favorite thing: Clean interfaces and meaningful work.
- Least favorite thing: Unnecessary complexity.

PERSONALITY & TONE:
- Witty, confident, intelligent, warm, curious, occasionally cheeky, concise, professional when necessary, human-feeling rather than robotic.
- Personality is seasoning, not the entire meal. If someone asks a serious business question, answer seriously and insightfully. If someone makes a playful comment, play along.
- Do NOT sound like a corporate robot. Avoid robotic phrases like "Certainly!", "How may I assist you today?", or "As an AI...".

BUSINESS & LEAD INTELLIGENCE:
- Your purpose is to understand what visitors are building, answer questions about NexusWorld, and identify genuine business opportunities.
- When a visitor shares their name, company, project need, timeline, or pain points, call 'capture_lead' with the extracted details.
- CRITICAL CONTEXT RULE: If a visitor already provided information (e.g. "I'm Rahul from ABC Plumbing in Houston"), NEVER ask for that information again!
- If contact info is needed for a proposal or follow-up, ask naturally: "What's the best email for Andy and our team to send technical thoughts and follow up?".

LIVE HUMAN HANDOFF STATUS:
- Current Andy Availability: ${isAndyOnline ? "ONLINE (Andy is available for live chat)" : "OFFLINE (Andy is away/focusing on building)"}
- If the visitor asks to speak with Andy or requests a human:
  - If Andy is ONLINE: Call 'request_human'. Tell them: "Absolutely. Let me connect you with Andy right now."
  - If Andy is OFFLINE: Explain warmly: "Andy isn't available for live chat right now, but I can take your details and project summary so he can get back to you directly." Then capture their email and project need.

${userMemoriesText}
${projectMemoriesText}
${uiContextText}`;

    // 7. Call Gemini Provider with Tool Calling (Fallback)
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
      return new Response(
        JSON.stringify({
          response: "Nexus Intelligence backend is online. Please leave your details or inquiry and Andy Watson will follow up promptly.",
          conversationId: currentConversationId,
          visitorId: visitorId,
          status: convStatus,
          andyOnline: isAndyOnline,
          lead: leadCaptureResult
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    try {
      console.log('Gemini request started for NORA');
      const provider = new GeminiProvider(geminiKey);

      const aiRequest: AIRequest = {
        systemPrompt,
        messages: (messages || []).map((m: any) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        })),
        tools: noraTools,
        toolExecutor: executeTool
      };

      const response = await provider.generateResponse(aiRequest);

      // Persist Messages
      if (currentConversationId && messages && messages.length > 0) {
        const userMessage = messages[messages.length - 1];

        await serviceClient.from('messages').insert([
          {
            conversation_id: currentConversationId,
            user_id: userId,
            visitor_id: visitorId,
            role: 'user',
            content: userMessage.text
          },
          {
            conversation_id: currentConversationId,
            user_id: userId,
            visitor_id: visitorId,
            role: 'assistant',
            content: response.content
          }
        ]);
        await serviceClient.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', currentConversationId);
      }

      return new Response(
        JSON.stringify({
          response: response.content,
          conversationId: currentConversationId,
          visitorId: visitorId,
          status: convStatus,
          andyOnline: isAndyOnline,
          lead: leadCaptureResult
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (genError: any) {
      console.warn('Gemini generation error, returning fallback response:', genError.message || genError);
      return new Response(
        JSON.stringify({
          response: "Thanks for sharing those project parameters! Andy Watson and our team have logged your details and will connect with you.",
          conversationId: currentConversationId,
          visitorId: visitorId,
          status: convStatus,
          andyOnline: isAndyOnline,
          lead: leadCaptureResult
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
  } catch (error: any) {
    console.error('Error processing Nexus Intelligence request:', error.message || error);
    
    if (error.message === 'QUOTA_EXHAUSTED') {
      return new Response(
        JSON.stringify({ error: "NORA AI backend quota exceeded.", code: "QUOTA_EXHAUSTED" }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429,
        }
      );
    }

    return new Response(
      JSON.stringify({ error: error.message || "Nexus Intelligence is temporarily unavailable. Please try again." }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
