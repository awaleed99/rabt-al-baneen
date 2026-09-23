-- ============================================================
-- Rabt Al-Baneen / Fasl El-Ameer Tadros
-- Migration 004: Servant Assignments & Pastoral Care
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Add assigned_servant_id to boys table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'boys' AND column_name = 'assigned_servant_id'
  ) THEN
    ALTER TABLE public.boys ADD COLUMN assigned_servant_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  -- 2. Add visitation_type to check_ins table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'check_ins' AND column_name = 'visitation_type'
  ) THEN
    ALTER TABLE public.check_ins ADD COLUMN visitation_type text DEFAULT 'general';
  END IF;
END $$;

-- 3. Indexes for fast care queries
CREATE INDEX IF NOT EXISTS boys_assigned_servant_id_idx ON public.boys(assigned_servant_id);
CREATE INDEX IF NOT EXISTS check_ins_visitation_type_idx ON public.check_ins(visitation_type);
