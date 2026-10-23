-- 本地开发专用：角色与 auth.uid() 兼容函数
-- 仅用于本机自托管环境，请勿用于生产。

-- PostgREST 会把 JWT 的 sub 声明注入到 request.jwt.claims GUC，
-- 这里提供 auth.uid() 让 RLS 策略能与云端保持一致。
CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS text
  LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::text
$$;

-- PostgREST 连接用户：仅能“切换”到 anon / authenticated，自身无直接权限
CREATE ROLE authenticator LOGIN NOINHERIT PASSWORD 'authpass';
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
GRANT authenticated TO authenticator;
GRANT anon TO authenticator;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
