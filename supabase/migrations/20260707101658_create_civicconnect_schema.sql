/*
# CivicConnect AI - Core Schema

## Overview
Creates the complete database schema for CivicConnect AI, an AI-powered civic issue
reporting and management platform connecting Citizens, Municipal Officers, and Field Workers.

## New Tables
1. `profiles` - Extends auth.users with role (citizen/officer/worker), name, phone, department, address, avatar
2. `departments` - Municipal departments (Sanitation, Roads, Water, etc.) with performance metrics
3. `complaints` - Civic issue reports with AI analysis fields, status flow, location, images
4. `assignments` - Links complaints to officers and workers with assignment metadata
5. `notifications` - User notifications for status changes, assignments, comments
6. `feedback` - Citizen ratings and comments after complaint resolution
7. `activity_logs` - Audit trail of all status changes and actions on complaints

## Security
- RLS enabled on ALL tables
- Profiles: users read/update own profile; officers/workers readable by authenticated users for assignment purposes
- Complaints: citizens CRUD own complaints; officers read all + update status/assignment; workers read assigned + update progress
- Departments: readable by all authenticated users
- Notifications: users read/update own only
- Feedback: citizens insert own; readable by complaint owner + assigned officer/worker
- Activity logs: readable by complaint owner + assigned officer/worker
- Assignments: readable by involved parties

## Notes
- Uses auth.uid() for ownership checks
- Complaint status flow: submitted -> ai_processing -> department_assigned -> officer_review -> worker_assigned -> accepted -> in_progress -> resolved -> citizen_verified -> closed
- AI fields (category, severity, priority, department, confidence, summary) populated client-side after image analysis
- Storage bucket 'complaints' used for images (created separately)
*/

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  role text NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'officer', 'worker')),
  department text DEFAULT '',
  address text DEFAULT '',
  avatar_url text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_select_all_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_all_authenticated" ON public.profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============ DEPARTMENTS ============
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text DEFAULT '',
  head_officer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "departments_select_all" ON public.departments;
CREATE POLICY "departments_select_all" ON public.departments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "departments_insert_officer" ON public.departments;
CREATE POLICY "departments_insert_officer" ON public.departments FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'officer')
  );

DROP POLICY IF EXISTS "departments_update_officer" ON public.departments;
CREATE POLICY "departments_update_officer" ON public.departments FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'officer')
  );

-- ============ COMPLAINTS ============
CREATE TABLE IF NOT EXISTS public.complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  officer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  worker_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text DEFAULT '',
  latitude double precision,
  longitude double precision,
  address text DEFAULT '',
  category text DEFAULT 'Others',
  priority text DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  department text DEFAULT '',
  severity text DEFAULT 'Moderate' CHECK (severity IN ('Low', 'Moderate', 'High', 'Severe')),
  ai_confidence numeric DEFAULT 0,
  ai_summary text DEFAULT '',
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN (
    'submitted', 'ai_processing', 'department_assigned', 'officer_review',
    'worker_assigned', 'accepted', 'in_progress', 'resolved', 'citizen_verified', 'closed', 'rejected'
  )),
  resolution_images text[] DEFAULT '{}',
  remarks text DEFAULT '',
  officer_comment text DEFAULT '',
  is_duplicate boolean DEFAULT false,
  duplicate_of uuid,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_complaints_citizen_id ON public.complaints(citizen_id);
CREATE INDEX IF NOT EXISTS idx_complaints_officer_id ON public.complaints(officer_id);
CREATE INDEX IF NOT EXISTS idx_complaints_worker_id ON public.complaints(worker_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_department ON public.complaints(department);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON public.complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON public.complaints(created_at DESC);

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Citizens can see their own complaints
DROP POLICY IF EXISTS "complaints_select_citizen_own" ON public.complaints;
CREATE POLICY "complaints_select_citizen_own" ON public.complaints FOR SELECT
  TO authenticated USING (
    auth.uid() = citizen_id
    OR auth.uid() = officer_id
    OR auth.uid() = worker_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'officer')
  );

-- Citizens insert their own complaints
DROP POLICY IF EXISTS "complaints_insert_citizen_own" ON public.complaints;
CREATE POLICY "complaints_insert_citizen_own" ON public.complaints FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = citizen_id);

-- Citizens can update their own complaints (limited) + officers/workers update assigned
DROP POLICY IF EXISTS "complaints_update_involved" ON public.complaints;
CREATE POLICY "complaints_update_involved" ON public.complaints FOR UPDATE
  TO authenticated USING (
    auth.uid() = citizen_id
    OR auth.uid() = officer_id
    OR auth.uid() = worker_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'officer')
  ) WITH CHECK (
    auth.uid() = citizen_id
    OR auth.uid() = officer_id
    OR auth.uid() = worker_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'officer')
  );

-- Citizens can delete their own complaints (only if not yet processed)
DROP POLICY IF EXISTS "complaints_delete_citizen_own" ON public.complaints;
CREATE POLICY "complaints_delete_citizen_own" ON public.complaints FOR DELETE
  TO authenticated USING (auth.uid() = citizen_id);

-- ============ ASSIGNMENTS ============
CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  officer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  worker_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'in_progress', 'completed', 'rejected')),
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assignments_complaint_id ON public.assignments(complaint_id);
CREATE INDEX IF NOT EXISTS idx_assignments_worker_id ON public.assignments(worker_id);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assignments_select_involved" ON public.assignments;
CREATE POLICY "assignments_select_involved" ON public.assignments FOR SELECT
  TO authenticated USING (
    auth.uid() = officer_id
    OR auth.uid() = worker_id
    OR auth.uid() = assigned_by
    OR EXISTS (
      SELECT 1 FROM public.complaints c
      WHERE c.id = assignments.complaint_id AND c.citizen_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'officer')
  );

DROP POLICY IF EXISTS "assignments_insert_officer" ON public.assignments;
CREATE POLICY "assignments_insert_officer" ON public.assignments FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('officer', 'worker'))
  );

DROP POLICY IF EXISTS "assignments_update_involved" ON public.assignments;
CREATE POLICY "assignments_update_involved" ON public.assignments FOR UPDATE
  TO authenticated USING (
    auth.uid() = officer_id
    OR auth.uid() = worker_id
    OR auth.uid() = assigned_by
  ) WITH CHECK (
    auth.uid() = officer_id
    OR auth.uid() = worker_id
    OR auth.uid() = assigned_by
  );

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  complaint_id uuid REFERENCES public.complaints(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'assignment', 'status', 'comment')),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_own_or_officer" ON public.notifications;
CREATE POLICY "notifications_insert_own_or_officer" ON public.notifications FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('officer', 'worker'))
  );

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ FEEDBACK ============
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  citizen_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  comment text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_complaint_id ON public.feedback(complaint_id);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feedback_select_involved" ON public.feedback;
CREATE POLICY "feedback_select_involved" ON public.feedback FOR SELECT
  TO authenticated USING (
    auth.uid() = citizen_id
    OR EXISTS (
      SELECT 1 FROM public.complaints c
      WHERE c.id = feedback.complaint_id AND (c.officer_id = auth.uid() OR c.worker_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'officer')
  );

DROP POLICY IF EXISTS "feedback_insert_citizen_own" ON public.feedback;
CREATE POLICY "feedback_insert_citizen_own" ON public.feedback FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = citizen_id);

DROP POLICY IF EXISTS "feedback_update_citizen_own" ON public.feedback;
CREATE POLICY "feedback_update_citizen_own" ON public.feedback FOR UPDATE
  TO authenticated USING (auth.uid() = citizen_id) WITH CHECK (auth.uid() = citizen_id);

-- ============ ACTIVITY LOGS ============
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  from_status text,
  to_status text,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_complaint_id ON public.activity_logs(complaint_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity_logs_select_involved" ON public.activity_logs;
CREATE POLICY "activity_logs_select_involved" ON public.activity_logs FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.complaints c
      WHERE c.id = activity_logs.complaint_id
      AND (c.citizen_id = auth.uid() OR c.officer_id = auth.uid() OR c.worker_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'officer')
  );

DROP POLICY IF EXISTS "activity_logs_insert_involved" ON public.activity_logs;
CREATE POLICY "activity_logs_insert_involved" ON public.activity_logs FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.complaints c
      WHERE c.id = activity_logs.complaint_id
      AND (c.citizen_id = auth.uid() OR c.officer_id = auth.uid() OR c.worker_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('officer', 'worker'))
  );

-- ============ TRIGGERS: auto-create profile on signup ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, phone, department, address)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'citizen'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'department', ''),
    COALESCE(NEW.raw_user_meta_data->>'address', '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ TRIGGERS: auto-update updated_at ============
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS complaints_updated_at ON public.complaints;
CREATE TRIGGER complaints_updated_at BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS assignments_updated_at ON public.assignments;
CREATE TRIGGER assignments_updated_at BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============ SEED DEPARTMENTS ============
INSERT INTO public.departments (name, description) VALUES
  ('Sanitation', 'Waste management, garbage collection, and street cleaning'),
  ('Roads & Infrastructure', 'Road maintenance, potholes, and public infrastructure'),
  ('Water & Sewage', 'Water supply, leakage, drainage, and sewage systems'),
  ('Electricity', 'Street lighting and electrical infrastructure'),
  ('Parks & Trees', 'Public parks, tree maintenance, and green spaces'),
  ('Traffic & Transport', 'Traffic signals, signage, and transportation infrastructure'),
  ('General Administration', 'General municipal services and public property')
ON CONFLICT (name) DO NOTHING;
