-- Disable RLS for participants2026 and certificates2026 as per troubleshooting request
ALTER TABLE public.participants2026 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates2026 DISABLE ROW LEVEL SECURITY;
