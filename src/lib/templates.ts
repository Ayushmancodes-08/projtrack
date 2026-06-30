import type { ProjectTemplate, StatusConfig } from "./types"

const softwareStatuses: StatusConfig[] = [
  { id: "idea", label: "Idea", color: "slate", order: 0, category: "todo" },
  { id: "todo", label: "Planned", color: "blue", order: 1, category: "todo" },
  { id: "in_progress", label: "In Progress", color: "amber", order: 2, category: "in_progress" },
  { id: "review", label: "Review", color: "purple", order: 3, category: "review" },
  { id: "completed", label: "Completed", color: "green", order: 4, category: "done" },
]

const constructionStatuses: StatusConfig[] = [
  { id: "idea", label: "Idea", color: "slate", order: 0, category: "todo" },
  { id: "permit", label: "Permitting", color: "amber", order: 1, category: "in_progress" },
  { id: "foundation", label: "Foundation", color: "purple", order: 2, category: "in_progress" },
  { id: "framing", label: "Framing", color: "indigo", order: 3, category: "in_progress" },
  { id: "finishing", label: "Finishing", color: "teal", order: 4, category: "review" },
  { id: "completed", label: "Completed", color: "green", order: 5, category: "done" },
]

const eventStatuses: StatusConfig[] = [
  { id: "idea", label: "Idea", color: "slate", order: 0, category: "todo" },
  { id: "planning", label: "Planning", color: "blue", order: 1, category: "todo" },
  { id: "vendor", label: "Vendor Coordination", color: "amber", order: 2, category: "in_progress" },
  { id: "marketing", label: "Marketing", color: "purple", order: 3, category: "in_progress" },
  { id: "finalizing", label: "Finalizing", color: "teal", order: 4, category: "review" },
  { id: "live", label: "Live / Executing", color: "crimson", order: 5, category: "in_progress" },
  { id: "completed", label: "Completed", color: "green", order: 6, category: "done" },
]

const marketingStatuses: StatusConfig[] = [
  { id: "idea", label: "Idea", color: "slate", order: 0, category: "todo" },
  { id: "strategy", label: "Strategy", color: "blue", order: 1, category: "in_progress" },
  { id: "creation", label: "Content Creation", color: "purple", order: 2, category: "in_progress" },
  { id: "review", label: "Review", color: "amber", order: 3, category: "review" },
  { id: "completed", label: "Completed", color: "green", order: 4, category: "done" },
]

const researchStatuses: StatusConfig[] = [
  { id: "idea", label: "Idea", color: "slate", order: 0, category: "todo" },
  { id: "lit_review", label: "Literature Review", color: "blue", order: 1, category: "in_progress" },
  { id: "methodology", label: "Methodology", color: "purple", order: 2, category: "in_progress" },
  { id: "data_collection", label: "Data Collection", color: "amber", order: 3, category: "in_progress" },
  { id: "analysis", label: "Analysis", color: "teal", order: 4, category: "in_progress" },
  { id: "writing", label: "Writing", color: "indigo", order: 5, category: "review" },
  { id: "completed", label: "Completed", color: "green", order: 6, category: "done" },
]

const generalStatuses: StatusConfig[] = [
  { id: "idea", label: "Idea", color: "slate", order: 0, category: "todo" },
  { id: "in_progress", label: "In Progress", color: "blue", order: 1, category: "in_progress" },
  { id: "pending", label: "Pending Review", color: "amber", order: 2, category: "review" },
  { id: "completed", label: "Completed", color: "green", order: 3, category: "done" },
]

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    type: "SOFTWARE",
    label: "Software",
    icon: "Code2",
    description: "Web apps, mobile, APIs, and internal tools",
    defaultStatuses: softwareStatuses,
    defaultMilestones: [
      { name: "Requirements & Planning" },
      { name: "Design & Prototyping" },
      { name: "Core Development" },
      { name: "Testing & QA" },
      { name: "Deployment & Launch" },
    ],
  },
  {
    type: "CONSTRUCTION",
    label: "Construction",
    icon: "HardHat",
    description: "Buildings, renovations, infrastructure projects",
    defaultStatuses: constructionStatuses,
    defaultMilestones: [
      { name: "Design & Planning" },
      { name: "Permitting & Approvals" },
      { name: "Site Preparation" },
      { name: "Structural Work" },
      { name: "Finishing & Inspection" },
      { name: "Handover" },
    ],
  },
  {
    type: "EVENT",
    label: "Event Planning",
    icon: "CalendarCheck",
    description: "Conferences, weddings, launches, and gatherings",
    defaultStatuses: eventStatuses,
    defaultMilestones: [
      { name: "Concept & Budget" },
      { name: "Vendor Booking" },
      { name: "Marketing & Registration" },
      { name: "Final Preparations" },
      { name: "Event Day" },
      { name: "Post-Event Wrap-up" },
    ],
  },
  {
    type: "MARKETING",
    label: "Marketing",
    icon: "Megaphone",
    description: "Campaigns, content, brand launches",
    defaultStatuses: marketingStatuses,
    defaultMilestones: [
      { name: "Campaign Strategy" },
      { name: "Content Production" },
      { name: "Review & Approvals" },
      { name: "Launch" },
      { name: "Reporting & Analysis" },
    ],
  },
  {
    type: "RESEARCH",
    label: "Research",
    icon: "FlaskConical",
    description: "Academic studies, market research, experiments",
    defaultStatuses: researchStatuses,
    defaultMilestones: [
      { name: "Question Formulation" },
      { name: "Literature Review" },
      { name: "Methodology Design" },
      { name: "Data Collection" },
      { name: "Analysis & Findings" },
      { name: "Publication" },
    ],
  },
  {
    type: "GENERAL",
    label: "General",
    icon: "FolderKanban",
    description: "Any other project type — fully customizable",
    defaultStatuses: generalStatuses,
    defaultMilestones: [
      { name: "Kickoff" },
      { name: "Phase 1" },
      { name: "Phase 2" },
      { name: "Completion" },
    ],
  },
]

export function getTemplate(type: string): ProjectTemplate {
  return PROJECT_TEMPLATES.find((t) => t.type === type) || PROJECT_TEMPLATES[5]
}
