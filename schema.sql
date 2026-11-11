-- 

-- Enable UUID extension for auto-generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Workspaces Table
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY, -- Corresponds to user's organizationId or 'personal'
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Profiles Table (Holds independent users synced with Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY, -- References auth.users(id) in Supabase Auth
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Workspace Members Table (Links users/emails to workspaces)
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL, -- e.g., OWNER, PM, DEVELOPER, CLIENT, VIEWER
  custom_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Team Invitations Table (Pending invitations to workspaces)
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL, -- Access code, e.g., PT-XXXXXX
  organization_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  custom_title TEXT,
  accepted BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  portfolio_id UUID, -- For future portfolio grouping features
  organization_id TEXT NOT NULL DEFAULT 'default_org',
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'SOFTWARE', -- Holds project_type (e.g., SOFTWARE, CONSTRUCTION, EVENT, etc.)
  color TEXT NOT NULL DEFAULT 'ON_TRACK', -- Holds health_status (e.g., ON_TRACK, AT_RISK, CRITICAL)
  deadline TIMESTAMP WITH TIME ZONE,
  status_config JSONB DEFAULT '[]'::jsonb, -- Custom board statuses configuration
  custom_fields JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Project Members Table (Users assigned to specific projects)
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL, -- PM, DEVELOPER, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id UUID, -- For future milestone features
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL, -- Custom board column ID/status
  priority TEXT NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
  assignee_id TEXT, -- User ID or email of assignee
  due_date TIMESTAMP WITH TIME ZONE,
  estimate_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Activity Logs Table (For audit tracking)
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  actor_email TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL, -- e.g., task_created, status_changed, etc.
  details TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Notifications Queue Table (Holds realtime push-oriented app alerts)
CREATE TABLE IF NOT EXISTS notifications_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT, -- Target owner/member email or ID
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE NOT NULL,
  data JSONB DEFAULT '{}'::jsonb, -- Holds dynamic payload (type, task_id, project_id, user_name, timestamp)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- INDEXES FOR QUERY OPTIMIZATION
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_email ON workspace_members(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_org ON team_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email_code ON team_invitations(email, code);
CREATE INDEX IF NOT EXISTS idx_projects_workspace ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_email ON project_members(email);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_project ON activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications_queue(user_id);


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all exposed tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_queue ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Public profiles are readable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- 2. Workspaces Policies
CREATE POLICY "Workspaces viewable by members or owners"
  ON workspaces FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT workspace_id FROM workspace_members
      WHERE email = (SELECT email FROM auth.users WHERE id = (select auth.uid()))
    )
    OR id = (select auth.uid())::text
  );

CREATE POLICY "Workspaces insertable by authenticated users"
  ON workspaces FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Workspaces updatable by authenticated users"
  ON workspaces FOR UPDATE
  TO authenticated
  USING (
    id = (select auth.uid())::text
    OR id IN (
      SELECT workspace_id FROM workspace_members
      WHERE email = (SELECT email FROM auth.users WHERE id = (select auth.uid()))
      AND role IN ('OWNER', 'PM')
    )
  )
  WITH CHECK (
    id = (select auth.uid())::text
    OR id IN (
      SELECT workspace_id FROM workspace_members
      WHERE email = (SELECT email FROM auth.users WHERE id = (select auth.uid()))
      AND role IN ('OWNER', 'PM')
    )
  );

-- 3. Projects Policies
CREATE POLICY "Projects viewable by workspace or project members"
  ON projects FOR SELECT
  TO authenticated
  USING (
    workspace_id = (select auth.uid())::text
    OR workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE email = (SELECT email FROM auth.users WHERE id = (select auth.uid()))
    )
    OR id IN (
      SELECT project_id FROM project_members
      WHERE email = (SELECT email FROM auth.users WHERE id = (select auth.uid()))
    )
  );

CREATE POLICY "Projects insertable by authenticated users"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Projects updatable by authenticated users"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    workspace_id = (select auth.uid())::text
    OR workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE email = (SELECT email FROM auth.users WHERE id = (select auth.uid()))
    )
  )
  WITH CHECK (
    workspace_id = (select auth.uid())::text
    OR workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE email = (SELECT email FROM auth.users WHERE id = (select auth.uid()))
    )
  );

CREATE POLICY "Projects deletable by authenticated owners"
  ON projects FOR DELETE
  TO authenticated
  USING (
    workspace_id = (select auth.uid())::text
    OR workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE email = (SELECT email FROM auth.users WHERE id = (select auth.uid()))
      AND role = 'OWNER'
    )
  );

-- 4. Tasks Policies
CREATE POLICY "Tasks viewable by project members"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE workspace_id = (select auth.uid())::text
      OR workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE email = (SELECT email FROM auth.users WHERE id = (select auth.uid()))
      )
    )
  );

CREATE POLICY "Tasks manageable by authenticated users"
  ON tasks FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE workspace_id = (select auth.uid())::text
      OR workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE email = (SELECT email FROM auth.users WHERE id = (select auth.uid()))
      )
    )
  );

-- 5. Activity Logs Policies
CREATE POLICY "Activity logs viewable by project members"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Activity logs insertable by authenticated users"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 6. Notifications Queue Policies
CREATE POLICY "Notifications viewable by target user"
  ON notifications_queue FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())::text
    OR user_id = (SELECT email FROM auth.users WHERE id = (select auth.uid()))
  );

CREATE POLICY "Notifications manageable by target user"
  ON notifications_queue FOR ALL
  TO authenticated
  USING (
    user_id = (select auth.uid())::text
    OR user_id = (SELECT email FROM auth.users WHERE id = (select auth.uid()))
  );

-- ==========================================
-- AUTOMATIC PROFILE PROVISIONING TRIGGER
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
