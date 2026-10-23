DO $ddl_ref$
BEGIN
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
END
$ddl_ref$;
