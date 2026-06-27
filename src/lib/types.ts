export type Role = "OWNER" | "PM" | "DEVELOPER" | "CLIENT" | "VIEWER"

export type ProjectType = "SOFTWARE" | "CONSTRUCTION" | "EVENT" | "MARKETING" | "RESEARCH" | "GENERAL"

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

export type HealthStatus = "ON_TRACK" | "AT_RISK" | "CRITICAL"

export type StatusConfig = {
  id: string
  label: string
  color: string
  order: number
  category: "todo" | "in_progress" | "review" | "done"
}

export type Portfolio = {
  id: string
  organization_id: string
  name: string
  description: string | null
  color: string | null
  created_at: string
}

export type Organization = {
  id: string
  name: string
  created_at: string
}

export type Membership = {
  id: string
  user_id: string
  organization_id: string
  role: Role
  created_at: string
}

export type Project = {
  id: string
  portfolio_id: string | null
  organization_id: string
  name: string
  description: string | null
  project_type: ProjectType
  budget: number | null
  deadline: string | null
  client_name: string | null
  location: string | null
  health_status: HealthStatus
  is_completed: boolean
  custom_fields: Record<string, unknown> | null
  status_config: StatusConfig[]
  created_at: string
  updated_at: string
}

export type Milestone = {
  id: string
  project_id: string
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  is_critical_path: boolean
  sort_order: number
  created_at: string
}

export type Task = {
  id: string
  milestone_id: string | null
  project_id: string
  title: string
  description: string | null
  status: string
  priority: Priority
  assignee_id: string | null
  due_date: string | null
  estimated_hours: number | null
  actual_hours: number | null
  blocked_reason: string | null
  is_critical_path: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type Subtask = {
  id: string
  task_id: string
  title: string
  is_completed: boolean
  sort_order: number
  created_at: string
}

export type Comment = {
  id: string
  task_id: string
  author_id: string
  content: string
  created_at: string
}

export type Attachment = {
  id: string
  task_id: string
  file_name: string
  file_url: string
  file_size: number
  uploaded_by: string
  created_at: string
}

export type TaskDependency = {
  id: string
  task_id: string
  depends_on_task_id: string
  created_at: string
}

export type ActivityLog = {
  id: string
  project_id: string
  actor_id: string
  action: string
  entity_type: string
  entity_id: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export type AuditLog = {
  id: string
  project_id: string
  actor_id: string
  action: string
  field_changed: string | null
  old_value: string | null
  new_value: string | null
  created_at: string
}

export type Notification = {
  id: string
  user_id: string
  title: string
  message: string
  type: "health_change" | "mention" | "assignment" | "status_change"
  is_read: boolean
  created_at: string
}

export type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export type ProjectTemplate = {
  type: ProjectType
  label: string
  icon: string
  description: string
  defaultStatuses: StatusConfig[]
  defaultMilestones: { name: string; description?: string }[]
}
