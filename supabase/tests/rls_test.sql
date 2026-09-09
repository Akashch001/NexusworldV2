-- ==============================================================================
-- NEXUS WORLD — RLS VERIFICATION TEST
-- Run this block in the Supabase SQL Editor to verify RLS policies.
-- It attempts to perform actions as different users and expects certain failures.
-- ==============================================================================

begin;

do $$
declare
  user_a uuid := gen_random_uuid();
  user_b uuid := gen_random_uuid();
  proj_a uuid := gen_random_uuid();
  conv_a uuid := gen_random_uuid();
  msg_a uuid := gen_random_uuid();
  mem_a uuid := gen_random_uuid();
begin
  -- 1. Setup mock users
  insert into auth.users (id, email) values (user_a, 'user_a@test.com'), (user_b, 'user_b@test.com');
  
  -- 2. Setup mock data for User A as superuser
  insert into public.projects (id, user_id, name) values (proj_a, user_a, 'Project A');
  insert into public.conversations (id, user_id, project_id) values (conv_a, user_a, proj_a);
  insert into public.messages (id, conversation_id, user_id, role, content) values (msg_a, conv_a, user_a, 'user', 'Hello A');
  insert into public.memories (id, user_id, project_id, memory_type, content) values (mem_a, user_a, proj_a, 'test', 'Memory A');

  -- 3. Impersonate User B and attempt illegal actions
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', '{"sub": "' || user_b || '", "role": "authenticated"}', true);

  -- Test 1: User B tries to read User A's project (Should return 0 rows)
  if exists (select 1 from public.projects where id = proj_a) then
    raise exception 'SECURITY FAIL: User B can read User A project';
  end if;

  -- Test 2: User B tries to update User A's project (Should update 0 rows)
  update public.projects set name = 'Hacked' where id = proj_a;
  if exists (select 1 from public.projects where id = proj_a and name = 'Hacked') then
    raise exception 'SECURITY FAIL: User B can update User A project';
  end if;

  -- Test 3: User B tries to read User A's memory
  if exists (select 1 from public.memories where id = mem_a) then
    raise exception 'SECURITY FAIL: User B can read User A memory';
  end if;

  -- Test 4: User B tries to insert a conversation into User A's project
  begin
    insert into public.conversations (user_id, project_id) values (user_b, proj_a);
    raise exception 'SECURITY FAIL: User B successfully inserted conversation into User A project';
  exception when others then
    -- Expected failure due to check_resource_project_ownership trigger
    if SQLERRM != 'Project does not belong to user' then
      raise exception 'SECURITY FAIL: Unexpected error message when inserting conversation into another project. Expected "Project does not belong to user", got "%"', SQLERRM;
    end if;
  end;

  -- 4. Impersonate User A and attempt illegal profile escalation
  perform set_config('request.jwt.claims', '{"sub": "' || user_a || '", "role": "authenticated"}', true);

  -- Test 5: User A tries to change their own role
  update public.profiles set role = 'admin' where id = user_a;
  if exists (select 1 from public.profiles where id = user_a and role = 'admin') then
    raise exception 'SECURITY FAIL: User A escalated privileges to admin';
  end if;

  -- If all passes, raise notice
  raise notice '✅ ALL RLS AND SECURITY TESTS PASSED SUCESSFULLY!';
end;
$$;

rollback;
