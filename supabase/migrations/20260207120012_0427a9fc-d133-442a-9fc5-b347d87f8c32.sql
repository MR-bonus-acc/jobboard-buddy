
-- Drop the overly broad ALL policy and replace with specific policies
DROP POLICY IF EXISTS "Users can manage own candidates" ON public.candidates;

CREATE POLICY "Users can insert own candidates"
ON public.candidates FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own candidates"
ON public.candidates FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own candidates"
ON public.candidates FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
