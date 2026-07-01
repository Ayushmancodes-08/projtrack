"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  Shield, 
  ArrowRight, 
  Sparkles, 
  KanbanSquare, 
  Table, 
  FileText, 
  Activity, 
  Layers, 
  Lock, 
  CheckCircle2, 
  ChevronRight,
  Menu,
  X,
  TrendingUp,
  Briefcase,
  Users
} from "lucide-react"

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"kanban" | "spreadsheet" | "reports" | "portfolios">("kanban")

  const features = [
    {
      icon: <KanbanSquare className="h-6 w-6 text-gold" />,
      title: "Interactive Kanban Boards",
      description: "Manage tasks visually with drag-and-drop ease, custom columns, and real-time state synchronization."
    },
    {
      icon: <Table className="h-6 w-6 text-gold" />,
      title: "Powerful Spreadsheet Grid",
      description: "Perform bulk updates, filter tasks, and view project details in a high-performance grid layout."
    },
    {
      icon: <FileText className="h-6 w-6 text-gold" />,
      title: "Automated Status Reports",
      description: "Generate intelligent project health reports and summaries instantly, saving hours of manual updates."
    },
    {
      icon: <Activity className="h-6 w-6 text-gold" />,
      title: "Real-time Activity Stream",
      description: "Track team contributions, task updates, and project changes live as they happen."
    },
    {
      icon: <Layers className="h-6 w-6 text-gold" />,
      title: "Portfolio Management",
      description: "Group related projects together to track overall progress, budgets, and milestones at a glance."
    },
    {
      icon: <Lock className="h-6 w-6 text-gold" />,
      title: "Enterprise Audit Logs",
      description: "Maintain complete compliance with detailed, immutable logs tracking every system event."
    }
  ]

  const faqs = [
    {
      q: "What makes projectBeacon different from other project management tools?",
      a: "projectBeacon combines traditional agile tools (like Kanban boards and spreadsheets) with autonomous project intelligence—meaning we automate status reporting, analyze project health, and keep compliance-ready audit logs automatically."
    },
    {
      q: "Can I switch between Kanban and Spreadsheet views?",
      a: "Yes! Every project can be viewed as a visual Kanban board, a high-performance spreadsheet, or a detailed report stream. Your data is synced instantly across all views."
    },
    {
      q: "Is projectBeacon secure and compliant?",
      a: "Absolutely. With built-in Clerk authentication, enterprise-grade role-based access control, and comprehensive system audit logs, projectBeacon is built for security-conscious teams."
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy via-[#0A1A30] to-navy text-white selection:bg-gold selection:text-navy">
      {/* Background Glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full bg-gold/[0.03] blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 h-[500px] w-[500px] rounded-full bg-blue-500/[0.02] blur-[150px]" />
        <div className="absolute bottom-10 left-10 h-[600px] w-[600px] rounded-full bg-gold/[0.02] blur-[120px]" />
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-navy/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-gold-dark shadow-lg shadow-gold/20">
              <Shield className="h-5 w-5 text-navy" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              projectBeacon
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-white/70 transition hover:text-gold">Features</a>
            <a href="#showcase" className="text-sm font-medium text-white/70 transition hover:text-gold">Showcase</a>
            <a href="#faq" className="text-sm font-medium text-white/70 transition hover:text-gold">FAQ</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link 
              href="/login" 
              className="rounded-lg px-4 py-2 text-sm font-medium text-white/90 transition hover:text-white hover:bg-white/5"
            >
              Sign In
            </Link>
            <Link 
              href="/signup" 
              className="rounded-lg bg-gradient-to-r from-gold to-gold-dark px-4.5 py-2 text-sm font-semibold text-navy shadow-md shadow-gold/15 transition hover:brightness-110 active:scale-[0.98]"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/5 md:hidden"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Nav Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-white/5 bg-[#0A1A30] px-6 py-6 md:hidden">
            <div className="flex flex-col gap-4">
              <a 
                href="#features" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-medium text-white/80"
              >
                Features
              </a>
              <a 
                href="#showcase" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-medium text-white/80"
              >
                Showcase
              </a>
              <a 
                href="#faq" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-medium text-white/80"
              >
                FAQ
              </a>
              <hr className="my-2 border-white/5" />
              <Link 
                href="/login"
                className="flex w-full justify-center rounded-lg border border-white/10 py-2.5 text-center text-sm font-medium text-white"
              >
                Sign In
              </Link>
              <Link 
                href="/signup"
                className="flex w-full justify-center rounded-lg bg-gradient-to-r from-gold to-gold-dark py-2.5 text-center text-sm font-semibold text-navy"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-6 pt-16 pb-24 text-center sm:pt-24 sm:pb-32">
        <div className="mx-auto flex max-w-3xl flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/5 px-3.5 py-1.5 text-xs font-semibold text-gold tracking-wide uppercase mb-6 backdrop-blur-sm animate-pulse">
            <Sparkles className="h-3.5 w-3.5" />
            Autonomous Project Intelligence
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-white leading-tight">
            Manage projects with{" "}
            <span className="bg-gradient-to-r from-gold via-[#E5C173] to-gold-dark bg-clip-text text-transparent">
              intelligence
            </span>
            , not just boards.
          </h1>
          
          <p className="mt-6 text-lg text-white/70 max-w-2xl leading-relaxed">
            The enterprise-ready platform that combines visual Kanban workflows, high-speed spreadsheets, automated status reports, and compliance audit logs.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link 
              href="/signup" 
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-dark px-6 py-3.5 text-base font-semibold text-navy shadow-lg shadow-gold/20 transition-all hover:brightness-110 active:scale-[0.98]"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a 
              href="#showcase" 
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-white/10 active:scale-[0.98]"
            >
              Explore Features
            </a>
          </div>
        </div>

        {/* Hero Demo Mockup */}
        <div className="relative mt-20 rounded-2xl border border-white/15 bg-navy-light/40 p-3 shadow-2xl shadow-navy-light/50 backdrop-blur-sm">
          <div className="rounded-xl border border-white/5 bg-navy/95 overflow-hidden">
            {/* Window Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3 bg-navy-light/30">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-500/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <span className="h-3 w-3 rounded-full bg-green-500/80" />
              </div>
              <div className="text-xs text-white/40 font-mono tracking-wider">
                projectBeacon-dashboard.app
              </div>
              <div className="w-12" />
            </div>
            
            {/* App Mockup Content */}
            <div className="grid grid-cols-1 md:grid-cols-4 min-h-[360px]">
              {/* Mock Sidebar */}
              <div className="border-r border-white/5 bg-[#08182E] p-4 text-left hidden md:block">
                <div className="flex items-center gap-2 mb-8">
                  <div className="h-7 w-7 rounded bg-gold/20 flex items-center justify-center">
                    <Shield className="h-4.5 w-4.5 text-gold" />
                  </div>
                  <span className="font-semibold text-sm">projectBeacon</span>
                </div>
                <div className="space-y-2">
                  <div className="h-8 rounded bg-white/10 flex items-center px-2.5 gap-2 text-xs text-white">
                    <Layers className="h-3.5 w-3.5 text-gold" /> Dashboard
                  </div>
                  <div className="h-8 rounded flex items-center px-2.5 gap-2 text-xs text-white/50">
                    <KanbanSquare className="h-3.5 w-3.5" /> Kanban Board
                  </div>
                  <div className="h-8 rounded flex items-center px-2.5 gap-2 text-xs text-white/50">
                    <Table className="h-3.5 w-3.5" /> Spreadsheet
                  </div>
                  <div className="h-8 rounded flex items-center px-2.5 gap-2 text-xs text-white/50">
                    <FileText className="h-3.5 w-3.5" /> Reports
                  </div>
                </div>
              </div>

              {/* Mock Main Content */}
              <div className="col-span-3 p-6 text-left bg-navy/90">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold">Q2 Product Launch</h3>
                    <p className="text-xs text-white/50">Autonomous Tracking & Delivery</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                    On Track
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="rounded-xl bg-navy-light/40 border border-white/5 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-white/40">Progress</p>
                    <p className="text-lg font-bold mt-1 text-gold">84%</p>
                  </div>
                  <div className="rounded-xl bg-navy-light/40 border border-white/5 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-white/40">Tasks Done</p>
                    <p className="text-lg font-bold mt-1 text-white">42 / 50</p>
                  </div>
                  <div className="rounded-xl bg-navy-light/40 border border-white/5 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-white/40">Next Report</p>
                    <p className="text-lg font-bold mt-1 text-white/80">Tonight</p>
                  </div>
                </div>

                {/* Mock Visual Kanban */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-[#08182E]/50 p-2.5 border border-white/5">
                    <p className="text-[11px] font-bold text-white/40 uppercase mb-2">Todo</p>
                    <div className="rounded bg-navy-light/60 p-2 border border-white/5 shadow-sm space-y-2">
                      <div className="h-2 w-12 rounded bg-gold/30" />
                      <div className="h-2 w-full rounded bg-white/25" />
                    </div>
                  </div>
                  <div className="rounded-lg bg-[#08182E]/50 p-2.5 border border-white/5">
                    <p className="text-[11px] font-bold text-white/40 uppercase mb-2">In Progress</p>
                    <div className="rounded bg-navy-light/60 p-2 border border-white/5 shadow-sm space-y-2">
                      <div className="h-2 w-8 rounded bg-sky-500/30" />
                      <div className="h-2 w-full rounded bg-white/25" />
                    </div>
                  </div>
                  <div className="rounded-lg bg-[#08182E]/50 p-2.5 border border-white/5">
                    <p className="text-[11px] font-bold text-white/40 uppercase mb-2">Done</p>
                    <div className="rounded bg-navy-light/60 p-2 border border-white/5 shadow-sm space-y-2 opacity-50">
                      <div className="h-2 w-10 rounded bg-emerald-500/30" />
                      <div className="h-2 w-full rounded bg-white/25" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-white/5 bg-navy-light/20 py-12 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl font-bold text-gold">3x</p>
            <p className="text-xs text-white/50 mt-1 uppercase tracking-wider">Faster Delivery</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">0</p>
            <p className="text-xs text-white/50 mt-1 uppercase tracking-wider">Manual Status Emails</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">100%</p>
            <p className="text-xs text-white/50 mt-1 uppercase tracking-wider">Audit Compliance</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gold">24/7</p>
            <p className="text-xs text-white/50 mt-1 uppercase tracking-wider">Autonomous Monitoring</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">
            Built for High-Performance Teams
          </h2>
          <p className="mt-4 text-base text-white/70 leading-relaxed">
            Stop wasting hours compiling status updates and managing rigid boards. projectBeacon delivers complete visibility out of the box.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => (
            <div 
              key={idx} 
              className="group relative rounded-2xl border border-white/5 bg-navy-light/20 p-8 transition-all hover:border-gold/30 hover:bg-navy-light/40 hover:-translate-y-1"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-navy/80 border border-white/10 group-hover:border-gold/20 transition">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Showcase Showcase Tabs */}
      <section id="showcase" className="border-t border-white/5 bg-navy-light/10 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">
              Experience Project Intelligence
            </h2>
            <p className="mt-4 text-base text-white/70">
              Switch between views instantly depending on your working style.
            </p>
          </div>

          {/* Tab Buttons */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            <button
              onClick={() => setActiveTab("kanban")}
              className={`rounded-lg px-4.5 py-2 text-sm font-medium transition-all ${
                activeTab === "kanban" 
                  ? "bg-gold text-navy font-semibold shadow-md shadow-gold/15" 
                  : "bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              Kanban Board
            </button>
            <button
              onClick={() => setActiveTab("spreadsheet")}
              className={`rounded-lg px-4.5 py-2 text-sm font-medium transition-all ${
                activeTab === "spreadsheet" 
                  ? "bg-gold text-navy font-semibold shadow-md shadow-gold/15" 
                  : "bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              Spreadsheet view
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`rounded-lg px-4.5 py-2 text-sm font-medium transition-all ${
                activeTab === "reports" 
                  ? "bg-gold text-navy font-semibold shadow-md shadow-gold/15" 
                  : "bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              Status Reports
            </button>
            <button
              onClick={() => setActiveTab("portfolios")}
              className={`rounded-lg px-4.5 py-2 text-sm font-medium transition-all ${
                activeTab === "portfolios" 
                  ? "bg-gold text-navy font-semibold shadow-md shadow-gold/15" 
                  : "bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              Portfolio View
            </button>
          </div>

          {/* Interactive tab representation */}
          <div className="rounded-xl border border-white/10 bg-navy p-6 min-h-[300px] flex flex-col justify-center">
            {activeTab === "kanban" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 text-gold mb-1">
                  <KanbanSquare className="h-5 w-5" />
                  <span className="font-semibold text-sm uppercase tracking-wider">Visual Task Management</span>
                </div>
                <h3 className="text-xl font-bold">Dynamic Kanban Boards</h3>
                <p className="text-sm text-white/70 max-w-2xl leading-relaxed">
                  Drag tasks across custom-defined stages. Each card contains task descriptions, subtasks, priorities, and assignees, updating in real-time for your entire team.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <div className="p-4 rounded-lg bg-navy-light/40 border border-white/5">
                    <div className="text-xs font-semibold text-white/40 uppercase mb-3">To Do (2)</div>
                    <div className="p-3 rounded bg-navy border border-white/5 text-xs font-medium mb-2">Design UI layouts</div>
                    <div className="p-3 rounded bg-navy border border-white/5 text-xs font-medium">Draft technical specs</div>
                  </div>
                  <div className="p-4 rounded-lg bg-navy-light/40 border border-white/5">
                    <div className="text-xs font-semibold text-white/40 uppercase mb-3">In Progress (1)</div>
                    <div className="p-3 rounded bg-navy border border-white/5 text-xs font-medium border-l-2 border-l-gold">Integrate Clerk Auth</div>
                  </div>
                  <div className="p-4 rounded-lg bg-navy-light/40 border border-white/5">
                    <div className="text-xs font-semibold text-white/40 uppercase mb-3">Done (4)</div>
                    <div className="p-3 rounded bg-navy border border-white/5 text-xs font-medium opacity-50">Setup database schema</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "spreadsheet" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 text-gold mb-1">
                  <Table className="h-5 w-5" />
                  <span className="font-semibold text-sm uppercase tracking-wider">High-Speed Grid Editor</span>
                </div>
                <h3 className="text-xl font-bold">Spreadsheet Grid View</h3>
                <p className="text-sm text-white/70 max-w-2xl leading-relaxed">
                  Ideal for power users. Edit task details, adjust due dates, set priorities, and update assignees in a dense, tabular grid with inline editing.
                </p>
                <div className="overflow-x-auto rounded-lg border border-white/5 pt-3">
                  <table className="w-full text-left text-xs text-white/80">
                    <thead className="bg-navy-light/40 uppercase text-white/40 text-[10px] tracking-wider border-b border-white/5">
                      <tr>
                        <th className="p-3">Task Name</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Priority</th>
                        <th className="p-3">Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr>
                        <td className="p-3 font-medium">Design UI layouts</td>
                        <td className="p-3"><span className="bg-white/5 px-2 py-0.5 rounded text-white/70 text-[10px]">Todo</span></td>
                        <td className="p-3 text-amber-500">Medium</td>
                        <td className="p-3 text-white/50">Jul 04, 2026</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium text-gold">Integrate Clerk Auth</td>
                        <td className="p-3"><span className="bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded text-[10px]">In Progress</span></td>
                        <td className="p-3 text-red-400">High</td>
                        <td className="p-3 text-white/50">Tomorrow</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium">Setup database schema</td>
                        <td className="p-3"><span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px]">Done</span></td>
                        <td className="p-3 text-white/40">Low</td>
                        <td className="p-3 text-white/35">Completed</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "reports" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 text-gold mb-1">
                  <FileText className="h-5 w-5" />
                  <span className="font-semibold text-sm uppercase tracking-wider">Automated Status Tracking</span>
                </div>
                <h3 className="text-xl font-bold">AI Status Reports</h3>
                <p className="text-sm text-white/70 max-w-2xl leading-relaxed">
                  No more manual status writing. projectBeacon automatically summarizes changes made by your team and generates professional, high-level project status reports.
                </p>
                <div className="p-4 rounded-lg bg-navy-light/40 border border-gold-subtle bg-gold-fade space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gold">Weekly Executive Summary</span>
                    <span className="text-white/40 font-mono">June 28, 2026</span>
                  </div>
                  <hr className="border-white/5" />
                  <p className="text-xs leading-relaxed text-white/90">
                    <strong>Project Status:</strong> <span className="text-emerald-400">On Track (Healthy)</span>. 
                    This week, we completed database schema setups and began integrating Clerk Auth. Design layouts are scheduled for next week. No blockers identified.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "portfolios" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 text-gold mb-1">
                  <Layers className="h-5 w-5" />
                  <span className="font-semibold text-sm uppercase tracking-wider">Multi-Project Management</span>
                </div>
                <h3 className="text-xl font-bold">Portfolio Control</h3>
                <p className="text-sm text-white/70 max-w-2xl leading-relaxed">
                  Organize and track multiple related projects in portfolios. Ideal for agencies and managers who need to monitor cross-project health, budgets, and milestones.
                </p>
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-navy-light/30 border border-white/5">
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-4.5 w-4.5 text-gold" />
                      <span className="text-xs font-semibold">Marketing & Branding Portfolio</span>
                    </div>
                    <span className="text-xs text-white/50">3 Projects</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-navy-light/30 border border-white/5">
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-4.5 w-4.5 text-gold" />
                      <span className="text-xs font-semibold">Core Product Engineering</span>
                    </div>
                    <span className="text-xs text-white/50">5 Projects</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="mx-auto max-w-4xl px-6 py-24 sm:py-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, idx) => (
            <div key={idx} className="rounded-xl border border-white/5 bg-navy-light/20 p-6">
              <h3 className="text-base font-semibold text-gold mb-2">{faq.q}</h3>
              <p className="text-sm text-white/70 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative mx-auto max-w-7xl px-6 pb-24 sm:pb-32">
        <div className="relative overflow-hidden rounded-3xl border border-gold-subtle bg-gradient-to-br from-navy-light to-navy px-8 py-16 text-center shadow-2xl shadow-navy-light/30 sm:px-16">
          {/* Decorative light blob */}
          <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />

          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Upgrade your project management intelligence today.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-sm sm:text-base text-white/70 leading-relaxed">
            Get complete visibility, automate your status reporting, and lead your team with clarity. Sign up for free.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link 
              href="/signup" 
              className="rounded-xl bg-gradient-to-r from-gold to-gold-dark px-6 py-3.5 text-base font-semibold text-navy shadow-lg shadow-gold/20 transition hover:brightness-110 active:scale-[0.98]"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#081526] py-12 text-sm text-white/40">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 border border-gold/20">
              <Shield className="h-4.5 w-4.5 text-gold" />
            </div>
            <span className="font-semibold text-white">projectBeacon</span>
          </div>
          <p>&copy; {new Date().getFullYear()} projectBeacon. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

