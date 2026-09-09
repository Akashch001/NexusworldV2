SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'conversations', 'messages', 'projects', 'project_context', 'memories');
