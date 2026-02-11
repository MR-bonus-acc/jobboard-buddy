-- Allow public (anon) access for the /apply/:jobId page
-- 1. Anonymous users can read job details to display the application form
CREATE POLICY "Public can view jobs for application"
ON public.jobs FOR SELECT
TO anon
USING (true);

-- 2. Anonymous users can submit applications (insert into candidates)
CREATE POLICY "Public can submit job applications"
ON public.candidates FOR INSERT
TO anon
WITH CHECK (true);
