-- ============================================================
-- Rabt Al-Baneen — Migration 003: Parents Phones & Friday Attendance
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Add father_phone and mother_phone columns to boys table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'boys' AND column_name = 'father_phone'
  ) THEN
    ALTER TABLE public.boys ADD COLUMN father_phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'boys' AND column_name = 'mother_phone'
  ) THEN
    ALTER TABLE public.boys ADD COLUMN mother_phone text;
  END IF;
END $$;

-- 2. Backfill father_phone from existing phone_number
UPDATE public.boys
SET father_phone = phone_number
WHERE father_phone IS NULL AND phone_number IS NOT NULL;

-- 3. Create attendance table for weekly Friday attendance
CREATE TABLE IF NOT EXISTS public.attendance (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  boy_id      uuid NOT NULL REFERENCES public.boys(id) ON DELETE CASCADE,
  date        date NOT NULL,
  status      text NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'excused')),
  notes       text,
  marked_by   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(boy_id, date)
);

CREATE INDEX IF NOT EXISTS attendance_date_idx ON public.attendance(date);
CREATE INDEX IF NOT EXISTS attendance_boy_id_idx ON public.attendance(boy_id);
CREATE INDEX IF NOT EXISTS attendance_status_idx ON public.attendance(status);

-- Auto-update updated_at for attendance
DROP TRIGGER IF EXISTS attendance_updated_at ON public.attendance;
CREATE TRIGGER attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 4. Enable Row Level Security (RLS) on attendance table
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Policies for attendance
DROP POLICY IF EXISTS "Active users can view attendance" ON public.attendance;
CREATE POLICY "Active users can view attendance"
  ON public.attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_active = true
    )
  );

DROP POLICY IF EXISTS "Active users can manage attendance" ON public.attendance;
CREATE POLICY "Active users can manage attendance"
  ON public.attendance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_active = true
    )
  );
