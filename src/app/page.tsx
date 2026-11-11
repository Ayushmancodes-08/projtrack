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
  Menu, 
  X, 
  Briefcase 
} from "lucide-react"

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"kanban" | "spreadsheet" | "reports" | "portfolios">("kanban")

  const features = [
    {
      icon: <KanbanSquare className="h-6 w-6 text-orange-500" />,
      title: "Tactile Kanban Boards",
      description: "Manage projects with smooth visual cards, intuitive swimlanes, and instant real-time synchronization across your entire crew."
    },
    {
      icon: <Table className="h-6 w-6 text-amber-500" />,
      title: "High-Speed Spreadsheet Grid",
      description: "Execute bulk updates, filter complex tasks, and edit deadlines in a fluid, high-performance tabular environment."
    },
    {
      icon: <FileText className="h-6 w-6 text-orange-400" />,
      title: "Automated Status Reports",
      description: "Generate executive project summaries and health assessments automatically, reclaiming hours of manual reporting."
    },
    {
      icon: <Activity className="h-6 w-6 text-emerald-500" />,
      title: "Live Activity & Pulse Stream",
      description: "Track team momentum, task completions, and status changes in an ambient, real-time activity river."
    },
    {
      icon: <Layers className="h-6 w-6 text-amber-500" />,
      title: "Portfolio Architecture",
      description: "Cluster related initiatives to inspect overarching budgets, deliverables, and team bandwidth from a single vantage point."
    },
    {
      icon: <Lock className="h-6 w-6 text-stone-400" />,
      title: "Enterprise Audit Trail",
      description: "Maintain complete peace of mind with immutable, chronologically-sealed audit logs of every system event."
    }
  ]

  const faqs = [
    {
      q: "What makes projectBeacon feel different from traditional project tools?",
      a: "Most tools are cold, clinical digital spreadsheets disguised as boards. projectBeacon combines visual craftsmanship with autonomous intelligence—proactively flagging risks, compiling status digests, and maintaining clean audit logs without draining your energy."
    },
    {
      q: "Can I fluidly toggle between Kanban and Spreadsheet perspectives?",
      a: "Yes. Every project exists simultaneously as a visual card board, a rapid keyboard-friendly spreadsheet, and an automated report stream. Updates in one view propagate instantly."
    },
    {
      q: "How does projectBeacon protect our team data?",
      a: "We leverage enterprise Supabase authentication with strict PostgreSQL Row Level Security (RLS) policies and cryptographically-verified session cookies."
    }
  ]

  return (
    <div className="min-h-screen bg-[#151311] text-[#FAF8F5] selection:bg-orange-600 selection:text-white font-sans">
      {/* Warm Ambient Radial Embers */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 h-[650px] w-[650px] rounded-full bg-orange-600/[0.07] blur-[150px]" />
        <div className="absolute top-1/3 right-1/4 h-[550px] w-[550px] rounded-full bg-amber-600/[0.05] blur-[160px]" />
        <div className="absolute bottom-10 left-10 h-[650px] w-[650px] rounded-full bg-stone-500/[0.03] blur-[140px]" />
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-stone-800/80 bg-[#151311]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-600 to-amber-600 shadow-md shadow-orange-950/40">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#FAF8F5]">
              projectBeacon
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-stone-400 transition hover:text-orange-400">Features</a>
            <a href="#showcase" className="text-sm font-medium text-stone-400 transition hover:text-orange-400">Showcase</a>
            <a href="#faq" className="text-sm font-medium text-stone-400 transition hover:text-orange-400">FAQ</a>
          </nav>

          <div className="hidden md:flex items-center gap-3.5">
            <Link 
              href="/login" 
              className="rounded-xl px-4 py-2 text-sm font-medium text-stone-300 transition hover:text-white hover:bg-white/5"
            >
              Sign In
            </Link>
            <Link 
              href="/signup" 
              className="rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-950/40 transition hover:brightness-110 active:scale-[0.98]"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-1.5 text-stone-400 transition hover:bg-white/5 md:hidden"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Nav Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-stone-800 bg-[#1C1815] px-6 py-6 md:hidden">
            <div className="flex flex-col gap-4">
              <a 
                href="#features" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-stone-300"
              >
                Features
              </a>
              <a 
                href="#showcase" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-stone-300"
              >
                Showcase
              </a>
              <a 
                href="#faq" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-stone-300"
              >
                FAQ
              </a>
              <hr className="my-2 border-stone-800" />
              <Link 
                href="/login" 
                className="flex w-full justify-center rounded-xl border border-stone-700 py-2.5 text-center text-sm font-medium text-stone-200"
              >
                Sign In
              </Link>
              <Link 
                href="/signup" 
                className="flex w-full justify-center rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 py-2.5 text-center text-sm font-semibold text-white"
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
          <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-semibold text-orange-300 tracking-wider uppercase mb-6 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-orange-400" />
            Autonomous Project Intelligence
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-[#FAF8F5] leading-tight">
            Manage projects with{" "}
            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
              human warmth
            </span>
            , not robotic boards.
          </h1>
          
          <p className="mt-6 text-lg text-stone-400 max-w-2xl leading-relaxed">
            The crafted platform combining tactile Kanban workflows, high-speed spreadsheets, automated status digests, and compliance audit trails.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link 
              href="/signup" 
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 via-orange-600 to-amber-600 px-6.5 py-3.5 text-base font-semibold text-white shadow-xl shadow-orange-950/40 transition-all hover:brightness-110 active:scale-[0.98]"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a 
              href="#showcase" 
              className="rounded-xl border border-stone-800 bg-[#201C19]/80 px-6 py-3.5 text-base font-semibold text-stone-300 transition hover:bg-[#2A2420] active:scale-[0.98]"
            >
              Explore Views
            </a>
          </div>
        </div>

        {/* Hero Demo Mockup */}
        <div className="relative mt-20 rounded-2xl border border-stone-800/80 bg-[#1F1B18]/70 p-3 shadow-2xl shadow-black/50 backdrop-blur-sm">
          <div className="rounded-xl border border-stone-800/60 bg-[#171412] overflow-hidden">
            {/* Window Header */}
            <div className="flex items-center justify-between border-b border-stone-800 px-4 py-3 bg-[#1C1815]/90">
              <div className="flex gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="text-xs text-stone-500 font-mono tracking-wider">
                beacon-workspace.studio
              </div>
              <div className="w-12" />
            </div>
            
            {/* App Mockup Content */}
            <div className="grid grid-cols-1 md:grid-cols-4 min-h-[360px]">
              {/* Mock Sidebar */}
              <div className="border-r border-stone-800/80 bg-[#141210] p-4 text-left hidden md:block">
                <div className="flex items-center gap-2.5 mb-8">
                  <div className="h-7 w-7 rounded-lg bg-orange-600/20 flex items-center justify-center border border-orange-500/30">
                    <Shield className="h-4 w-4 text-orange-400" />
                  </div>
                  <span className="font-semibold text-sm text-[#FAF8F5]">projectBeacon</span>
                </div>
                <div className="space-y-1.5">
                  <div className="h-8.5 rounded-lg bg-stone-800/70 flex items-center px-3 gap-2.5 text-xs text-white font-medium">
                    <Layers className="h-3.5 w-3.5 text-orange-400" /> Dashboard
                  </div>
                  <div className="h-8.5 rounded-lg flex items-center px-3 gap-2.5 text-xs text-stone-400">
                    <KanbanSquare className="h-3.5 w-3.5" /> Kanban Board
                  </div>
                  <div className="h-8.5 rounded-lg flex items-center px-3 gap-2.5 text-xs text-stone-400">
                    <Table className="h-3.5 w-3.5" /> Spreadsheet
                  </div>
                  <div className="h-8.5 rounded-lg flex items-center px-3 gap-2.5 text-xs text-stone-400">
                    <FileText className="h-3.5 w-3.5" /> Reports
                  </div>
                </div>
              </div>

              {/* Mock Main Content */}
              <div className="col-span-3 p-6 text-left bg-[#191614]/90">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-[#FAF8F5]">Q2 Brand & Platform Overhaul</h3>
                    <p className="text-xs text-stone-400">Autonomous Progress & Timeline Health</p>
                  </div>
                  <span className="rounded-full bg-emerald-950/60 border border-emerald-800/40 px-3 py-1 text-xs font-semibold text-emerald-400">
                    On Track
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="rounded-xl bg-[#221D1A] border border-stone-800 p-3.5">
                    <p className="text-[10px] uppercase tracking-wider text-stone-400">Delivery Velocity</p>
                    <p className="text-xl font-bold mt-1 text-orange-400">88%</p>
                  </div>
                  <div className="rounded-xl bg-[#221D1A] border border-stone-800 p-3.5">
                    <p className="text-[10px] uppercase tracking-wider text-stone-400">Tasks Completed</p>
                    <p className="text-xl font-bold mt-1 text-[#FAF8F5]">44 / 50</p>
                  </div>
                  <div className="rounded-xl bg-[#221D1A] border border-stone-800 p-3.5">
                    <p className="text-[10px] uppercase tracking-wider text-stone-400">Next Executive Digest</p>
                    <p className="text-xl font-bold mt-1 text-stone-300">Tomorrow</p>
                  </div>
                </div>

                {/* Mock Visual Kanban */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-xl bg-[#141210]/60 p-3 border border-stone-800/70">
                    <p className="text-[11px] font-bold text-stone-400 uppercase mb-2.5">To Do (2)</p>
                    <div className="rounded-lg bg-[#241F1C] p-2.5 border border-stone-800 shadow-sm space-y-2">
                      <div className="h-2 w-12 rounded bg-orange-500/40" />
                      <div className="h-2 w-full rounded bg-stone-700/50" />
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#141210]/60 p-3 border border-stone-800/70">
                    <p className="text-[11px] font-bold text-stone-400 uppercase mb-2.5">In Progress (1)</p>
                    <div className="rounded-lg bg-[#241F1C] p-2.5 border-l-2 border-l-orange-500 border border-stone-800 shadow-sm space-y-2">
                      <div className="h-2 w-8 rounded bg-amber-500/40" />
                      <div className="h-2 w-full rounded bg-stone-700/50" />
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#141210]/60 p-3 border border-stone-800/70">
                    <p className="text-[11px] font-bold text-stone-400 uppercase mb-2.5">Done (4)</p>
                    <div className="rounded-lg bg-[#241F1C] p-2.5 border border-stone-800 shadow-sm space-y-2 opacity-50">
                      <div className="h-2 w-10 rounded bg-emerald-500/40" />
                      <div className="h-2 w-full rounded bg-stone-700/50" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-stone-800/80 bg-[#1B1715]/60 py-12 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl font-bold text-orange-400">3x</p>
            <p className="text-xs text-stone-400 mt-1 uppercase tracking-wider">Faster Delivery</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#FAF8F5]">0</p>
            <p className="text-xs text-stone-400 mt-1 uppercase tracking-wider">Manual Status Emails</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#FAF8F5]">100%</p>
            <p className="text-xs text-stone-400 mt-1 uppercase tracking-wider">Audit Traceability</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-amber-400">24/7</p>
            <p className="text-xs text-stone-400 mt-1 uppercase tracking-wider">Automated Vigilance</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-[#FAF8F5]">
            Crafted for Thoughtful, High-Output Teams
          </h2>
          <p className="mt-4 text-base text-stone-400 leading-relaxed">
            Eliminate hours lost compiling static updates. projectBeacon surfaces instant clarity without digital noise.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => (
            <div 
              key={idx} 
              className="group relative rounded-2xl border border-stone-800/80 bg-[#1E1916]/70 p-7 transition-all hover:border-orange-500/40 hover:bg-[#25201C] hover:-translate-y-1"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#2A2420] border border-stone-800 group-hover:border-orange-500/30 transition">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-[#FAF8F5] mb-2">{feature.title}</h3>
              <p className="text-sm text-stone-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Showcase Tabs */}
      <section id="showcase" className="border-t border-stone-800/80 bg-[#181513] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-[#FAF8F5]">
              Experience Project Intelligence
            </h2>
            <p className="mt-4 text-base text-stone-400">
              Shift between views naturally to match how you think and work.
            </p>
          </div>

          {/* Tab Buttons */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            <button
              onClick={() => setActiveTab("kanban")}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "kanban" 
                  ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-950/40" 
                  : "bg-stone-900/60 text-stone-400 hover:text-stone-200 hover:bg-stone-800"
              }`}
            >
              Kanban Board
            </button>
            <button
              onClick={() => setActiveTab("spreadsheet")}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "spreadsheet" 
                  ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-950/40" 
                  : "bg-stone-900/60 text-stone-400 hover:text-stone-200 hover:bg-stone-800"
              }`}
            >
              Spreadsheet View
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "reports" 
                  ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-950/40" 
                  : "bg-stone-900/60 text-stone-400 hover:text-stone-200 hover:bg-stone-800"
              }`}
            >
              Status Reports
            </button>
            <button
              onClick={() => setActiveTab("portfolios")}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "portfolios" 
                  ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-950/40" 
                  : "bg-stone-900/60 text-stone-400 hover:text-stone-200 hover:bg-stone-800"
              }`}
            >
              Portfolio View
            </button>
          </div>

          {/* Interactive tab representation */}
          <div className="rounded-2xl border border-stone-800/80 bg-[#1E1916] p-7 min-h-[300px] flex flex-col justify-center shadow-xl">
            {activeTab === "kanban" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-orange-400 mb-1">
                  <KanbanSquare className="h-5 w-5" />
                  <span className="font-semibold text-xs uppercase tracking-wider">Visual Task Movement</span>
                </div>
                <h3 className="text-xl font-bold text-[#FAF8F5]">Dynamic Kanban Boards</h3>
                <p className="text-sm text-stone-400 max-w-2xl leading-relaxed">
                  Drag tasks across custom-defined stages. Each card contains task descriptions, subtasks, priorities, and assignees, updating in real-time for your entire team.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <div className="p-4 rounded-xl bg-[#25201C] border border-stone-800">
                    <div className="text-xs font-semibold text-stone-400 uppercase mb-3">To Do (2)</div>
                    <div className="p-3 rounded-lg bg-[#1C1815] border border-stone-800 text-xs font-medium text-stone-200 mb-2">Design UI layouts</div>
                    <div className="p-3 rounded-lg bg-[#1C1815] border border-stone-800 text-xs font-medium text-stone-200">Draft technical specs</div>
                  </div>
                  <div className="p-4 rounded-xl bg-[#25201C] border border-stone-800">
                    <div className="text-xs font-semibold text-stone-400 uppercase mb-3">In Progress (1)</div>
                    <div className="p-3 rounded-lg bg-[#1C1815] border border-stone-800 text-xs font-medium text-orange-400 border-l-2 border-l-orange-500">Integrate Supabase Auth</div>
                  </div>
                  <div className="p-4 rounded-xl bg-[#25201C] border border-stone-800">
                    <div className="text-xs font-semibold text-stone-400 uppercase mb-3">Done (4)</div>
                    <div className="p-3 rounded-lg bg-[#1C1815] border border-stone-800 text-xs font-medium text-stone-400 opacity-60">Setup database schema</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "spreadsheet" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-amber-400 mb-1">
                  <Table className="h-5 w-5" />
                  <span className="font-semibold text-xs uppercase tracking-wider">High-Speed Grid Editor</span>
                </div>
                <h3 className="text-xl font-bold text-[#FAF8F5]">Spreadsheet Grid View</h3>
                <p className="text-sm text-stone-400 max-w-2xl leading-relaxed">
                  Ideal for power users. Edit task details, adjust due dates, set priorities, and update assignees in a dense, tabular grid with inline editing.
                </p>
                <div className="overflow-x-auto rounded-xl border border-stone-800 pt-3">
                  <table className="w-full text-left text-xs text-stone-300">
                    <thead className="bg-[#25201C] uppercase text-stone-400 text-[10px] tracking-wider border-b border-stone-800">
                      <tr>
                        <th className="p-3">Task Name</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Priority</th>
                        <th className="p-3">Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/80">
                      <tr>
                        <td className="p-3 font-medium text-stone-200">Design UI layouts</td>
                        <td className="p-3"><span className="bg-stone-800 px-2.5 py-0.5 rounded text-stone-300 text-[10px]">Todo</span></td>
                        <td className="p-3 text-amber-400">Medium</td>
                        <td className="p-3 text-stone-400">Jul 04, 2026</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium text-orange-400">Integrate Supabase Auth</td>
                        <td className="p-3"><span className="bg-orange-950/60 text-orange-400 border border-orange-800/40 px-2.5 py-0.5 rounded text-[10px]">In Progress</span></td>
                        <td className="p-3 text-rose-400">High</td>
                        <td className="p-3 text-stone-400">Tomorrow</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium text-stone-200">Setup database schema</td>
                        <td className="p-3"><span className="bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 px-2.5 py-0.5 rounded text-[10px]">Done</span></td>
                        <td className="p-3 text-stone-500">Low</td>
                        <td className="p-3 text-stone-500">Completed</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "reports" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-orange-400 mb-1">
                  <FileText className="h-5 w-5" />
                  <span className="font-semibold text-xs uppercase tracking-wider">Automated Status Tracking</span>
                </div>
                <h3 className="text-xl font-bold text-[#FAF8F5]">AI Status Reports</h3>
                <p className="text-sm text-stone-400 max-w-2xl leading-relaxed">
                  No more manual status writing. projectBeacon automatically summarizes changes made by your team and generates professional, high-level project status reports.
                </p>
                <div className="p-5 rounded-xl bg-[#25201C] border border-orange-500/20 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-orange-400">Weekly Executive Summary</span>
                    <span className="text-stone-500 font-mono">June 28, 2026</span>
                  </div>
                  <hr className="border-stone-800" />
                  <p className="text-xs leading-relaxed text-stone-300">
                    <strong>Project Status:</strong> <span className="text-emerald-400">On Track (Healthy)</span>. 
                    This week, we completed database schema setups and began integrating Supabase Auth. Design layouts are scheduled for next week. No blockers identified.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "portfolios" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-amber-400 mb-1">
                  <Layers className="h-5 w-5" />
                  <span className="font-semibold text-xs uppercase tracking-wider">Multi-Project Management</span>
                </div>
                <h3 className="text-xl font-bold text-[#FAF8F5]">Portfolio Control</h3>
                <p className="text-sm text-stone-400 max-w-2xl leading-relaxed">
                  Organize and track multiple related projects in portfolios. Ideal for agencies and managers who need to monitor cross-project health, budgets, and milestones.
                </p>
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center p-3.5 rounded-xl bg-[#25201C] border border-stone-800">
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-4.5 w-4.5 text-orange-400" />
                      <span className="text-xs font-semibold text-stone-200">Marketing & Branding Portfolio</span>
                    </div>
                    <span className="text-xs text-stone-400">3 Projects</span>
                  </div>
                  <div className="flex justify-between items-center p-3.5 rounded-xl bg-[#25201C] border border-stone-800">
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-4.5 w-4.5 text-orange-400" />
                      <span className="text-xs font-semibold text-stone-200">Core Product Engineering</span>
                    </div>
                    <span className="text-xs text-stone-400">5 Projects</span>
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
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-[#FAF8F5]">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-5">
          {faqs.map((faq, idx) => (
            <div key={idx} className="rounded-2xl border border-stone-800 bg-[#1E1916]/80 p-6">
              <h3 className="text-base font-semibold text-orange-400 mb-2">{faq.q}</h3>
              <p className="text-sm text-stone-400 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative mx-auto max-w-7xl px-6 pb-24 sm:pb-32">
        <div className="relative overflow-hidden rounded-3xl border border-orange-500/20 bg-gradient-to-br from-[#241F1C] to-[#171412] px-8 py-16 text-center shadow-2xl sm:px-16">
          <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-orange-600/10 blur-3xl" />

          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-[#FAF8F5] sm:text-4xl">
            Upgrade your project management intelligence today.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm sm:text-base text-stone-400 leading-relaxed">
            Gain complete visibility, automate your status reporting, and lead your team with clarity.
          </p>
          <div className="mt-9 flex justify-center gap-4">
            <Link 
              href="/signup" 
              className="rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-orange-950/40 transition hover:brightness-110 active:scale-[0.98]"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-800 bg-[#12100E] py-12 text-sm text-stone-500">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600/20 border border-orange-500/30">
              <Shield className="h-4.5 w-4.5 text-orange-400" />
            </div>
            <span className="font-semibold text-stone-300">projectBeacon</span>
          </div>
          <p>&copy; {new Date().getFullYear()} projectBeacon. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
