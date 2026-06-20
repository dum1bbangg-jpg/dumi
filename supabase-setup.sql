-- ──────────────────────────────────────────
--  두미 (hika12) 사이트 Supabase 초기 셋업
--  Supabase SQL Editor에 전체 붙여넣고 RUN
-- ──────────────────────────────────────────

-- ========== 1. VOD · 클립 (명장면캐치) ==========
CREATE TABLE IF NOT EXISTS public.vod_clips (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text NOT NULL,
  vod_id     text NOT NULL,            -- SOOP VOD/클립 ID (embed URL용)
  kind       text DEFAULT 'vod',       -- 'vod' | 'clip'
  thumb_url  text DEFAULT NULL,
  sort_order int  DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.vod_clips ADD COLUMN IF NOT EXISTS kind      text DEFAULT 'vod';
ALTER TABLE public.vod_clips ADD COLUMN IF NOT EXISTS thumb_url text DEFAULT NULL;
ALTER TABLE public.vod_clips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read vod_clips" ON public.vod_clips;
DROP POLICY IF EXISTS "auth all vod_clips"    ON public.vod_clips;
CREATE POLICY "public read vod_clips" ON public.vod_clips FOR SELECT USING (true);
CREATE POLICY "auth all vod_clips"    ON public.vod_clips FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ========== 2. 업보 타입 ==========
CREATE TABLE IF NOT EXISTS public.upbo_task_types (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  category   text DEFAULT 'normal',    -- 'normal' | 'event'
  sort_order int  DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.upbo_task_types ADD COLUMN IF NOT EXISTS sort_order int DEFAULT 0;

-- ========== 3. 시청자(멤버) ==========
CREATE TABLE IF NOT EXISTS public.upbo_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname   text NOT NULL,
  user_id    text,                     -- SOOP ID (프사 자동 로드용)
  memo       text,                     -- 관리자 비공개 메모
  is_hidden  boolean DEFAULT false,
  sort_order int  DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.upbo_members ADD COLUMN IF NOT EXISTS sort_order int DEFAULT 0;

-- ========== 4. 업보 기록 (멤버 × 타입 × 수량) ==========
CREATE TABLE IF NOT EXISTS public.upbo_tasks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id  uuid REFERENCES public.upbo_members(id) ON DELETE CASCADE,
  type_id    uuid REFERENCES public.upbo_task_types(id) ON DELETE CASCADE,
  quantity   int  DEFAULT 1,
  memo       text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dumi_tasks_member ON public.upbo_tasks(member_id);
CREATE INDEX IF NOT EXISTS idx_dumi_tasks_type   ON public.upbo_tasks(type_id);

-- ========== 5. 업보 문의 ==========
CREATE TABLE IF NOT EXISTS public.upbo_inquiries (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname   text,
  content    text,
  is_read    boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.upbo_inquiries ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

-- ========== 6. 설정 (갱신일 등) ==========
CREATE TABLE IF NOT EXISTS public.upbo_settings (
  key   text PRIMARY KEY,
  value text
);

-- ========== RLS ==========
ALTER TABLE public.upbo_task_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upbo_members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upbo_tasks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upbo_inquiries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upbo_settings   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read task_types" ON public.upbo_task_types;
DROP POLICY IF EXISTS "auth all task_types"    ON public.upbo_task_types;
CREATE POLICY "public read task_types" ON public.upbo_task_types FOR SELECT USING (true);
CREATE POLICY "auth all task_types"    ON public.upbo_task_types FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public read members" ON public.upbo_members;
DROP POLICY IF EXISTS "auth all members"    ON public.upbo_members;
CREATE POLICY "public read members" ON public.upbo_members FOR SELECT USING (true);
CREATE POLICY "auth all members"    ON public.upbo_members FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public read tasks" ON public.upbo_tasks;
DROP POLICY IF EXISTS "auth all tasks"    ON public.upbo_tasks;
CREATE POLICY "public read tasks" ON public.upbo_tasks FOR SELECT USING (true);
CREATE POLICY "auth all tasks"    ON public.upbo_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public read settings" ON public.upbo_settings;
DROP POLICY IF EXISTS "auth all settings"    ON public.upbo_settings;
CREATE POLICY "public read settings" ON public.upbo_settings FOR SELECT USING (true);
CREATE POLICY "auth all settings"    ON public.upbo_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 문의: 공개 INSERT만, 조회/수정/삭제는 관리자만
DROP POLICY IF EXISTS "public insert inquiries" ON public.upbo_inquiries;
DROP POLICY IF EXISTS "auth read inquiries"     ON public.upbo_inquiries;
DROP POLICY IF EXISTS "auth update inquiries"   ON public.upbo_inquiries;
DROP POLICY IF EXISTS "auth delete inquiries"   ON public.upbo_inquiries;
CREATE POLICY "public insert inquiries" ON public.upbo_inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "auth read inquiries"     ON public.upbo_inquiries FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth update inquiries"   ON public.upbo_inquiries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete inquiries"   ON public.upbo_inquiries FOR DELETE TO authenticated USING (true);


-- ========== 7. 두미 기본 업보 타입 시드 (필요시 어드민에서 추가/수정) ==========
INSERT INTO public.upbo_task_types (name, category, sort_order) VALUES
  ('지각',       'normal', 0),
  ('노래 신청',  'normal', 1),
  ('단컷 방셀',  'normal', 2),
  ('합방 약속',  'event',  3)
ON CONFLICT DO NOTHING;
