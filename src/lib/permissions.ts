import { ROLE_HIERARCHY } from "./constants"
import type { Role } from "./types"

export function hasPermission(userRole: Role, minimumRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole]
}

export const PERMISSIONS = {
  EDIT_BUDGET_DEADLINE: "PM" as Role,
  CREATE_ASSIGN_TASKS: "PM" as Role,
  ASSIGN_SELF: "DEVELOPER" as Role,
  MOVE_KANBAN_CARDS: "DEVELOPER" as Role,
  VIEW_GANTT_SPREADSHEET: "VIEWER" as Role,
  VIEW_HEALTH_SUMMARY: "CLIENT" as Role,
  VIEW_HEALTH_DETAIL: "VIEWER" as Role,
  VIEW_OUTCOME_REPORT: "DEVELOPER" as Role,
  INVITE_MEMBERS: "PM" as Role,
  VIEW_AUDIT_LEDGER: "PM" as Role,
  CREATE_PROJECT: "PM" as Role,
  DELETE_PROJECT: "OWNER" as Role,
  MANAGE_ROLES: "OWNER" as Role,
} as const
