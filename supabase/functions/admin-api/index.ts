import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const dbUrl = Deno.env.get('SUPABASE_DB_URL') ?? '';

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    // MANDATORY AUTHENTICATION: All actions require a valid authorization token
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized: missing authorization token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check caller profile and status
    const { data: callerProfile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('role, is_active, password_change_required')
      .eq('id', user.id)
      .single();

    if (profileErr || !callerProfile) {
      return new Response(JSON.stringify({ error: 'Forbidden: caller profile not found' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (callerProfile.is_active === false) {
      return new Response(JSON.stringify({ error: 'Forbidden: account is deactivated' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Action: Complete forced password change for the current authenticated user
    if (action === 'complete_password_change') {
      const { error: updateErr } = await supabaseAdmin
        .from('profiles')
        .update({ 
          password_change_required: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateErr) {
        return new Response(JSON.stringify({ error: updateErr.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true, message: 'Password change requirement cleared' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // OWNER-ONLY ACTIONS: Schema operations require explicit owner role
    if (action === 'init_schema') {
      if (callerProfile.role !== 'owner') {
        return new Response(JSON.stringify({ error: 'Forbidden: only owner can execute schema operations' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!dbUrl) {
        return new Response(JSON.stringify({ error: 'SUPABASE_DB_URL not set' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const sql = postgres(dbUrl, { ssl: 'require', max: 1 });
      try {
        await sql`
          DROP POLICY IF EXISTS "Admins and owners can view all profiles" ON public.profiles;
        `;

        await sql`
          ALTER TABLE public.profiles 
            ADD COLUMN IF NOT EXISTS full_name text,
            ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
            ADD COLUMN IF NOT EXISTS password_change_required boolean DEFAULT true;
        `;

        await sql`
          UPDATE public.profiles 
          SET 
            full_name = COALESCE(full_name, display_name, 'Andy Watson'),
            is_active = COALESCE(is_active, true),
            password_change_required = true
          WHERE email = 'andy.watson@nexusworld.in';
        `;

        return new Response(JSON.stringify({ success: true, message: 'Schema fixed and initialized successfully' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } finally {
        await sql.end();
      }
    }

    // Action: Migrate Command Center Telemetry Schema (Owner-only)
    if (action === 'migrate_telemetry') {
      if (callerProfile.role !== 'owner') {
        return new Response(JSON.stringify({ error: 'Forbidden: only owner can execute telemetry migration' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!dbUrl) {
        return new Response(JSON.stringify({ error: 'SUPABASE_DB_URL not set' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const sql = postgres(dbUrl, { ssl: 'require', max: 1 });
      try {
        await sql.unsafe(`
          CREATE TABLE IF NOT EXISTS public.visitor_sessions (
            id uuid default gen_random_uuid() primary key,
            visitor_token text not null unique,
            entry_url text default '/',
            current_url text default '/',
            referrer text,
            device_type text default 'desktop',
            browser text,
            os text,
            ip_masked text default '•••.•••.•••',
            country text,
            city text,
            is_active boolean default true,
            created_at timestamp with time zone default timezone('utc'::text, now()) not null,
            last_seen_at timestamp with time zone default timezone('utc'::text, now()) not null
          );

          CREATE INDEX IF NOT EXISTS idx_visitor_sessions_token on public.visitor_sessions(visitor_token);
          CREATE INDEX IF NOT EXISTS idx_visitor_sessions_active on public.visitor_sessions(is_active);
          CREATE INDEX IF NOT EXISTS idx_visitor_sessions_last_seen on public.visitor_sessions(last_seen_at desc);
          CREATE INDEX IF NOT EXISTS idx_visitor_sessions_created_at on public.visitor_sessions(created_at desc);

          CREATE TABLE IF NOT EXISTS public.visitor_events (
            id uuid default gen_random_uuid() primary key,
            session_id uuid references public.visitor_sessions(id) on delete cascade,
            visitor_token text not null,
            event_type text not null,
            event_name text not null,
            metadata jsonb default '{}'::jsonb,
            created_at timestamp with time zone default timezone('utc'::text, now()) not null
          );

          CREATE INDEX IF NOT EXISTS idx_visitor_events_session_id on public.visitor_events(session_id);
          CREATE INDEX IF NOT EXISTS idx_visitor_events_token on public.visitor_events(visitor_token);
          CREATE INDEX IF NOT EXISTS idx_visitor_events_type on public.visitor_events(event_type);
          CREATE INDEX IF NOT EXISTS idx_visitor_events_created_at on public.visitor_events(created_at desc);

          CREATE TABLE IF NOT EXISTS public.system_logs (
            id uuid default gen_random_uuid() primary key,
            service text not null,
            level text not null check (level in ('info', 'warning', 'error', 'critical')),
            event text not null,
            message text not null,
            details jsonb default '{}'::jsonb,
            created_at timestamp with time zone default timezone('utc'::text, now()) not null
          );

          CREATE INDEX IF NOT EXISTS idx_system_logs_level on public.system_logs(level);
          CREATE INDEX IF NOT EXISTS idx_system_logs_service on public.system_logs(service);
          CREATE INDEX IF NOT EXISTS idx_system_logs_created_at on public.system_logs(created_at desc);

          ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;
          ALTER TABLE public.visitor_events ENABLE ROW LEVEL SECURITY;
          ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

          DROP POLICY IF EXISTS "Anyone can insert visitor session" on public.visitor_sessions;
          CREATE POLICY "Anyone can insert visitor session"
            on public.visitor_sessions for insert
            with check (visitor_token is not null and length(visitor_token) > 0);

          DROP POLICY IF EXISTS "Anyone can update own visitor session" on public.visitor_sessions;
          CREATE POLICY "Anyone can update own visitor session"
            on public.visitor_sessions for update
            using (true)
            with check (visitor_token is not null);

          DROP POLICY IF EXISTS "Admins can view all visitor sessions" on public.visitor_sessions;
          CREATE POLICY "Admins can view all visitor sessions"
            on public.visitor_sessions for select
            using (public.is_admin());

          DROP POLICY IF EXISTS "Admins can manage visitor sessions" on public.visitor_sessions;
          CREATE POLICY "Admins can manage visitor sessions"
            on public.visitor_sessions for all
            using (public.is_admin());

          DROP POLICY IF EXISTS "Anyone can insert visitor events" on public.visitor_events;
          CREATE POLICY "Anyone can insert visitor events"
            on public.visitor_events for insert
            with check (visitor_token is not null and length(visitor_token) > 0);

          DROP POLICY IF EXISTS "Admins can view all visitor events" on public.visitor_events;
          CREATE POLICY "Admins can view all visitor events"
            on public.visitor_events for select
            using (public.is_admin());

          DROP POLICY IF EXISTS "Anyone can log system events" on public.system_logs;
          CREATE POLICY "Anyone can log system events"
            on public.system_logs for insert
            with check (service is not null and message is not null);

          DROP POLICY IF EXISTS "Admins can view system logs" on public.system_logs;
          CREATE POLICY "Admins can view system logs"
            on public.system_logs for select
            using (public.is_admin());

          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_publication_tables 
              WHERE pubname = 'supabase_realtime' 
              AND schemaname = 'public' 
              AND tablename = 'visitor_sessions'
            ) THEN
              ALTER PUBLICATION supabase_realtime ADD TABLE public.visitor_sessions;
            END IF;

            IF NOT EXISTS (
              SELECT 1 FROM pg_publication_tables 
              WHERE pubname = 'supabase_realtime' 
              AND schemaname = 'public' 
              AND tablename = 'visitor_events'
            ) THEN
              ALTER PUBLICATION supabase_realtime ADD TABLE public.visitor_events;
            END IF;

            IF NOT EXISTS (
              SELECT 1 FROM pg_publication_tables 
              WHERE pubname = 'supabase_realtime' 
              AND schemaname = 'public' 
              AND tablename = 'system_logs'
            ) THEN
              ALTER PUBLICATION supabase_realtime ADD TABLE public.system_logs;
            END IF;
          END $$;

          ALTER TABLE public.visitor_sessions REPLICA IDENTITY FULL;
          ALTER TABLE public.visitor_events REPLICA IDENTITY FULL;
          ALTER TABLE public.system_logs REPLICA IDENTITY FULL;

          CREATE OR REPLACE FUNCTION public.cleanup_stale_telemetry(p_days_retention integer default 7)
          RETURNS jsonb AS $$
          DECLARE
            v_stale_sessions integer;
            v_old_events integer;
            v_old_logs integer;
          BEGIN
            UPDATE public.visitor_sessions
            SET is_active = false
            WHERE is_active = true
              AND last_seen_at < (timezone('utc'::text, now()) - interval '10 minutes');
            GET DIAGNOSTICS v_stale_sessions = row_count;

            DELETE FROM public.visitor_events
            WHERE created_at < (timezone('utc'::text, now()) - (p_days_retention || ' days')::interval);
            GET DIAGNOSTICS v_old_events = row_count;

            DELETE FROM public.system_logs
            WHERE level in ('info', 'warning')
              AND created_at < (timezone('utc'::text, now()) - interval '30 days');
            GET DIAGNOSTICS v_old_logs = row_count;

            RETURN jsonb_build_object(
              'deactivated_sessions', v_stale_sessions,
              'deleted_events', v_old_events,
              'deleted_logs', v_old_logs,
              'cleaned_at', timezone('utc'::text, now())
            );
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `);

        return new Response(JSON.stringify({ success: true, message: 'Telemetry schema (migration 04) applied successfully' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } finally {
        await sql.end();
      }
    }

    // Verify caller is owner or admin for administrative actions
    if (!['owner', 'admin'].includes(callerProfile.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden: administrative privileges required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Action: List all users
    if (action === 'list_users') {
      const { data: authUsers, error: listAuthErr } = await supabaseAdmin.auth.admin.listUsers();
      if (listAuthErr) {
        return new Response(JSON.stringify({ error: listAuthErr.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: profiles, error: listProfErr } = await supabaseAdmin
        .from('profiles')
        .select('*');

      if (listProfErr) {
        return new Response(JSON.stringify({ error: listProfErr.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      const combinedUsers = (authUsers.users || []).map((u: any) => {
        const prof: any = profileMap.get(u.id) || {};
        return {
          id: u.id,
          email: u.email,
          full_name: prof.full_name || prof.display_name || u.user_metadata?.full_name || 'Admin User',
          role: prof.role || 'user',
          is_active: prof.is_active !== false,
          password_change_required: prof.password_change_required === true,
          created_at: u.created_at || prof.created_at,
          last_sign_in_at: u.last_sign_in_at
        };
      });

      return new Response(JSON.stringify({ success: true, users: combinedUsers }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Action: Create user
    if (action === 'create_user') {
      const { email, password, full_name, role = 'user' } = body;
      if (!email || !password) {
        return new Response(JSON.stringify({ error: 'Email and initial password are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (role === 'owner' && callerProfile.role !== 'owner') {
        return new Response(JSON.stringify({ error: 'Only owners can create another owner' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name }
      });

      if (createErr || !newUser?.user) {
        return new Response(JSON.stringify({ error: createErr?.message || 'Failed to create user' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { error: profErr } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: newUser.user.id,
          email,
          display_name: full_name,
          full_name,
          role,
          is_active: true,
          password_change_required: true,
          updated_at: new Date().toISOString()
        });

      if (profErr) {
        return new Response(JSON.stringify({ error: profErr.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true, user: { id: newUser.user.id, email, full_name, role } }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Action: Update role
    if (action === 'update_role') {
      const { user_id, role } = body;
      if (!user_id || !role) {
        return new Response(JSON.stringify({ error: 'user_id and role required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (role === 'owner' && callerProfile.role !== 'owner') {
        return new Response(JSON.stringify({ error: 'Only owners can assign the owner role' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { error: updateErr } = await supabaseAdmin
        .from('profiles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', user_id);

      if (updateErr) {
        return new Response(JSON.stringify({ error: updateErr.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Action: Toggle active / disabled status
    if (action === 'toggle_status') {
      const { user_id, is_active } = body;
      if (!user_id || typeof is_active !== 'boolean') {
        return new Response(JSON.stringify({ error: 'user_id and is_active required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (user_id === user.id) {
        return new Response(JSON.stringify({ error: 'You cannot disable your own account' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { error: updateErr } = await supabaseAdmin
        .from('profiles')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', user_id);

      if (updateErr) {
        return new Response(JSON.stringify({ error: updateErr.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true, is_active }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Action: Admin initiate password reset for user
    if (action === 'reset_password') {
      const { email, redirect_to } = body;
      if (!email) {
        return new Response(JSON.stringify({ error: 'email required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { error: resetErr } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: redirect_to || 'https://nexusworld.in/auth/recovery'
      });

      if (resetErr) {
        return new Response(JSON.stringify({ error: resetErr.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true, message: 'Password recovery email dispatched' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Action: Delete user
    if (action === 'delete_user') {
      const { user_id } = body;
      if (!user_id) {
        return new Response(JSON.stringify({ error: 'user_id required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (user_id === user.id) {
        return new Response(JSON.stringify({ error: 'You cannot delete your own account' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: targetProf } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user_id)
        .single();

      if (targetProf?.role === 'owner' && callerProfile.role !== 'owner') {
        return new Response(JSON.stringify({ error: 'Only owners can delete another owner' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { error: deleteAuthErr } = await supabaseAdmin.auth.admin.deleteUser(user_id);
      if (deleteAuthErr) {
        return new Response(JSON.stringify({ error: deleteAuthErr.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
