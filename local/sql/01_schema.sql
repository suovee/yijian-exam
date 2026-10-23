-- 一建备考小程序 · 本地自托管库结构（15 张业务表 + 1 张本地登录用户表）
-- 前 4 张表与云端 DDL 保持一致；其余按前端 api.js 实际字段重建。
-- 所有用户私有表统一用 owner_id = auth.uid() 做行级隔离，与云端 RLS 等价。

-- ============ 公共只读表 ============
CREATE TABLE IF NOT EXISTS subjects (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  exam_minutes INTEGER NOT NULL DEFAULT 120,
  full_score INTEGER NOT NULL DEFAULT 100,
  pass_score INTEGER NOT NULL DEFAULT 60,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON TABLE public.subjects TO authenticated, anon;
CREATE POLICY subjects_read_all ON subjects FOR SELECT TO authenticated, anon USING (true);

CREATE TABLE IF NOT EXISTS chapters (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subject_code TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  parent_code TEXT,
  name TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON TABLE public.chapters TO authenticated, anon;
CREATE POLICY chapters_read_all ON chapters FOR SELECT TO authenticated, anon USING (true);
CREATE INDEX IF NOT EXISTS chapters_subject_idx ON chapters (subject_code, parent_code, sort_order);

CREATE TABLE IF NOT EXISTS questions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subject_code TEXT NOT NULL,
  chapter_code TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'single',
  stem TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  answer JSONB NOT NULL DEFAULT '[]'::jsonb,
  analysis TEXT,
  difficulty INTEGER NOT NULL DEFAULT 3,
  source TEXT NOT NULL DEFAULT 'original',
  year INTEGER,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  contributor_id TEXT DEFAULT auth.uid(),
  contributor_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON TABLE public.questions TO authenticated, anon;
CREATE POLICY questions_read_all ON questions FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY questions_insert_own ON questions FOR INSERT TO authenticated, anon WITH CHECK (contributor_id = auth.uid());
CREATE INDEX IF NOT EXISTS questions_chapter_idx ON questions (subject_code, chapter_code);
CREATE INDEX IF NOT EXISTS questions_source_idx ON questions (source);

CREATE TABLE IF NOT EXISTS exam_papers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subject_code TEXT NOT NULL,
  paper_type TEXT NOT NULL DEFAULT 'mock',
  round_no INTEGER,
  year INTEGER,
  title TEXT NOT NULL,
  question_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  duration_minutes INTEGER NOT NULL DEFAULT 120,
  total_score INTEGER NOT NULL DEFAULT 100,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE exam_papers ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON TABLE public.exam_papers TO authenticated, anon;
CREATE POLICY exam_papers_read_all ON exam_papers FOR SELECT TO authenticated, anon USING (true);

-- ============ 本地登录用户（仅自托管环境使用） ============
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  openid TEXT UNIQUE,
  nickname TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ 用户私有表（owner_id 行级隔离） ============
CREATE TABLE IF NOT EXISTS answer_records (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  question_id BIGINT NOT NULL DEFAULT 0,
  question_sid TEXT,
  subject_code TEXT,
  chapter_code TEXT,
  selected_options JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  attempt_no INTEGER NOT NULL DEFAULT 1,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  mode TEXT NOT NULL DEFAULT 'practice',
  owner_id TEXT NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE answer_records ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.answer_records TO authenticated;
CREATE POLICY answer_records_owner ON answer_records FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE INDEX IF NOT EXISTS answer_records_owner_qid_idx ON answer_records (owner_id, question_id);
CREATE INDEX IF NOT EXISTS answer_records_owner_sid_idx ON answer_records (owner_id, question_sid);

CREATE TABLE IF NOT EXISTS wrong_questions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  question_id BIGINT NOT NULL,
  subject_code TEXT,
  chapter_code TEXT,
  wrong_count INTEGER NOT NULL DEFAULT 1,
  last_wrong_at TIMESTAMPTZ,
  mastered BOOLEAN NOT NULL DEFAULT false,
  owner_id TEXT NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, question_id)
);
ALTER TABLE wrong_questions ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.wrong_questions TO authenticated;
CREATE POLICY wrong_questions_owner ON wrong_questions FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE TABLE IF NOT EXISTS question_corrections (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  question_id BIGINT NOT NULL,
  new_answer JSONB NOT NULL DEFAULT '[]'::jsonb,
  new_analysis TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  owner_id TEXT NOT NULL DEFAULT auth.uid(),
  owner_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE question_corrections ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.question_corrections TO authenticated;
CREATE POLICY question_corrections_owner ON question_corrections FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE TABLE IF NOT EXISTS user_question_overrides (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  question_id BIGINT NOT NULL,
  answer JSONB,
  analysis TEXT,
  correction_id BIGINT,
  owner_id TEXT NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, question_id)
);
ALTER TABLE user_question_overrides ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.user_question_overrides TO authenticated;
CREATE POLICY user_question_overrides_owner ON user_question_overrides FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE TABLE IF NOT EXISTS favorites (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ref_type TEXT NOT NULL,
  ref_id TEXT NOT NULL,
  title TEXT,
  owner_id TEXT NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, ref_type, ref_id)
);
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.favorites TO authenticated;
CREATE POLICY favorites_owner ON favorites FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE TABLE IF NOT EXISTS checkins (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  day DATE NOT NULL,
  question_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  study_seconds INTEGER DEFAULT 0,
  owner_id TEXT NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, day)
);
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.checkins TO authenticated;
CREATE POLICY checkins_owner ON checkins FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE TABLE IF NOT EXISTS study_progress (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subject_code TEXT NOT NULL,
  chapter_code TEXT NOT NULL,
  done_questions INTEGER DEFAULT 0,
  correct_questions INTEGER DEFAULT 0,
  owner_id TEXT NOT NULL DEFAULT auth.uid(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, subject_code, chapter_code)
);
ALTER TABLE study_progress ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.study_progress TO authenticated;
CREATE POLICY study_progress_owner ON study_progress FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE TABLE IF NOT EXISTS exam_sessions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  paper_id BIGINT,
  subject_code TEXT,
  paper_type TEXT,
  title TEXT,
  question_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_count INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  answers JSONB,
  score INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  owner_id TEXT NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.exam_sessions TO authenticated;
CREATE POLICY exam_sessions_owner ON exam_sessions FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE TABLE IF NOT EXISTS knowledge_points (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subject_code TEXT,
  chapter_code TEXT,
  title TEXT NOT NULL,
  content TEXT,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  mastery INTEGER DEFAULT 0,
  owner_id TEXT NOT NULL DEFAULT auth.uid(),
  owner_name TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE knowledge_points ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.knowledge_points TO authenticated;
CREATE POLICY knowledge_points_owner ON knowledge_points FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE TABLE IF NOT EXISTS ai_question_drafts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  knowledge_point_id BIGINT,
  subject_code TEXT,
  chapter_code TEXT,
  qtype TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  owner_id TEXT NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE ai_question_drafts ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.ai_question_drafts TO authenticated;
CREATE POLICY ai_question_drafts_owner ON ai_question_drafts FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE TABLE IF NOT EXISTS materials (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  subject_code TEXT,
  category TEXT,
  description TEXT,
  file_path TEXT NOT NULL,
  file_ext TEXT,
  file_size BIGINT DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  owner_id TEXT NOT NULL DEFAULT auth.uid(),
  owner_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.materials TO authenticated;
CREATE POLICY materials_read_all ON materials FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY materials_owner_write ON materials FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
