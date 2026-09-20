-- ==============================================================================
-- NEXUS WORLD — MIGRATION 09: CLEANUP NORA MEMORIES & TEAM ROUTING
-- ==============================================================================

-- 1. CLEAN UP ANY STALE MEMORIES PRESCRIBING ANDY AS DEFAULT CUSTOMER REPRESENTATIVE
update public.memories
set content = 'Andy Watson is a Co-Founder of Nexus World. Andy is not the default customer representative. NORA must use the appropriate Nexus team for normal customer assistance. Normal requests should be routed to sales, support, technical, design, development, project, or another appropriate team. NORA must not proactively mention Andy. Andy may only be mentioned when the customer explicitly asks about Andy or explicitly requests to speak with him.'
where content ilike '%andy%' 
  and (content ilike '%handles%' or content ilike '%default%' or content ilike '%contact%' or content ilike '%representative%');

-- 2. ENSURE CANONICAL ORGANIZATIONAL MEMORY RECORD EXISTS
insert into public.memories (
  user_id,
  memory_type,
  content,
  importance,
  source,
  metadata
)
select 
  p.id,
  'organizational_rule',
  'Andy Watson is a Co-Founder of Nexus World. Andy is not the default customer representative. NORA must use the appropriate Nexus team for normal customer assistance. Normal requests should be routed to sales, support, technical, design, development, project, or another appropriate team. NORA must not proactively mention Andy. Andy may only be mentioned when the customer explicitly asks about Andy or explicitly requests to speak with him.',
  1.0,
  'system',
  '{"rule": "absolute_andy_rule", "version": "2.0"}'::jsonb
from public.profiles p
where p.role in ('admin', 'owner')
limit 1
on conflict do nothing;
