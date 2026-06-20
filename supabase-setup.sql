-- ──────────────────────────────────────────
--  두미 (hika12) 사이트 Supabase 초기 셋업
--  Supabase SQL Editor에 전체 붙여넣고 RUN
-- ──────────────────────────────────────────

-- ========== 1. VOD · 클립 (명장면캐치) ==========
CREATE TABLE IF NOT EXISTS public.vod_clips (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  vod_id     TEXT NOT NULL,            -- SOOP VOD/클립 ID (embed URL용)
  kind       TEXT DEFAULT 'vod',       -- 'vod' | 'clip'
  thumb_url  TEXT DEFAULT NULL,
  sort_order INT  DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 기존 테이블 대비 컬럼 보강
ALTER TABLE public.vod_clips ADD COLUMN IF NOT EXISTS kind      TEXT DEFAULT 'vod';
ALTER TABLE public.vod_clips ADD COLUMN IF NOT EXISTS thumb_url TEXT DEFAULT NULL;

ALTER TABLE public.vod_clips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read vod_clips" ON public.vod_clips;
DROP POLICY IF EXISTS "auth all vod_clips"    ON public.vod_clips;
CREATE POLICY "public read vod_clips" ON public.vod_clips FOR SELECT USING (true);
CREATE POLICY "auth all vod_clips"    ON public.vod_clips FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ========== 2. 업보 카테고리 ==========
CREATE TABLE IF NOT EXISTS public.achievement_categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  color      TEXT DEFAULT '#FF8FB0',   -- 형광펜 색상
  sort_order INT  DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.achievement_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read ach_cat" ON public.achievement_categories;
DROP POLICY IF EXISTS "auth all ach_cat"    ON public.achievement_categories;
CREATE POLICY "public read ach_cat" ON public.achievement_categories FOR SELECT USING (true);
CREATE POLICY "auth all ach_cat"    ON public.achievement_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ========== 3. 업보 항목 ==========
CREATE TABLE IF NOT EXISTS public.achievements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.achievement_categories(id) ON DELETE SET NULL,
  year        INT,
  date_label  TEXT,                    -- 표시 날짜 (11.25, 7.17 등)
  content     TEXT NOT NULL,
  sort_order  INT  DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dumi_ach_year ON public.achievements(year);
CREATE INDEX IF NOT EXISTS idx_dumi_ach_cat  ON public.achievements(category_id);
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read ach" ON public.achievements;
DROP POLICY IF EXISTS "auth all ach"    ON public.achievements;
CREATE POLICY "public read ach" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "auth all ach"    ON public.achievements FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ========== 4. 두미 기본 업보 카테고리 시드 ==========
INSERT INTO public.achievement_categories (name, color, sort_order) VALUES
  ('소통',   '#FF8FB0', 0),
  ('노래',   '#CF7FA3', 1),
  ('게임',   '#C49A72', 2),
  ('합방',   '#3BAD7A', 3),
  ('컨텐츠', '#4299E1', 4),
  ('기념일', '#ED8936', 5)
ON CONFLICT DO NOTHING;

-- ── (선택) 데뷔 기념일 예시. 필요 없으면 지워도 됨 ──
-- INSERT INTO public.achievements (category_id, year, date_label, content, sort_order)
-- SELECT id, 2025, '7.17', '두미 방송 데뷔 🎉', 0
-- FROM public.achievement_categories WHERE name='기념일';
