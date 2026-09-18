-- ============================================================
-- Rabt Al-Baneen — Migration 002: Add KG Level
-- ============================================================

-- 1. Add kg_level column if it doesn't exist (text with check constraint)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'boys' AND column_name = 'kg_level'
  ) THEN
    ALTER TABLE public.boys ADD COLUMN kg_level text CHECK (kg_level IN ('kg1', 'kg2'));
  END IF;
END $$;

-- 2. Backfill existing records to 'kg1'
UPDATE public.boys 
SET kg_level = 'kg1' 
WHERE kg_level IS NULL;

-- 3. Set NOT NULL and DEFAULT 'kg1'
ALTER TABLE public.boys 
ALTER COLUMN kg_level SET DEFAULT 'kg1',
ALTER COLUMN kg_level SET NOT NULL;

-- 4. Create an index for faster filtering
CREATE INDEX IF NOT EXISTS boys_kg_level_idx ON public.boys(kg_level);
