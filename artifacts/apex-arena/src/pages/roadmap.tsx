import { useState, useEffect } from "react";
import { Link } from "wouter";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, ChevronRight, Lock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  problemSlug?: string;
  isPremium?: boolean;
}

interface RoadmapSection {
  id: string;
  phase: string;
  title: string;
  description: string;
  color: string;
  borderColor: string;
  bgColor: string;
  nodes: RoadmapNode[];
}

const ROADMAP: RoadmapSection[] = [
  {
    id: "foundation",
    phase: "Phase 1",
    title: "Apex Foundations",
    description: "Core language fundamentals every Salesforce developer must know",
    color: "text-cyan-400",
    borderColor: "border-cyan-400/30",
    bgColor: "bg-cyan-400/5",
    nodes: [
      { id: "variables", title: "Variables & Data Types", description: "Primitive types, sObject references, null handling" },
      { id: "collections", title: "Collections", description: "List, Set, and Map — when and why to use each" },
      { id: "control-flow", title: "Control Flow & Loops", description: "for, while, for-each loops and conditional branching" },
      { id: "exceptions", title: "Exception Handling", description: "try-catch-finally, throwing custom exceptions", problemSlug: "custom-exception-class" },
    ],
  },
  {
    id: "triggers",
    phase: "Phase 2",
    title: "Apex Triggers",
    description: "Automate business logic that fires on data changes",
    color: "text-orange-400",
    borderColor: "border-orange-400/30",
    bgColor: "bg-orange-400/5",
    nodes: [
      { id: "trigger-basics", title: "Before & After Triggers", description: "Trigger events, context variables, and firing order", problemSlug: "prevent-duplicate-account-names" },
      { id: "bulkification", title: "Bulkification", description: "Writing bulk-safe triggers that handle 200 records", problemSlug: "sync-contact-account-name" },
      { id: "trigger-context", title: "Trigger Context Variables", description: "Trigger.new, Trigger.old, Trigger.newMap, Trigger.oldMap", problemSlug: "prevent-deleting-won-opportunity" },
      { id: "rollup", title: "Rollup Summaries in Apex", description: "Aggregating child data to parent with maps", problemSlug: "rollup-account-revenue", isPremium: true },
      { id: "trigger-handler", title: "Trigger Handler Pattern", description: "One-liner triggers delegating to a handler class", problemSlug: "trigger-handler-pattern", isPremium: true },
    ],
  },
  {
    id: "classes",
    phase: "Phase 3",
    title: "Classes & OOP",
    description: "Object-oriented programming patterns in Apex",
    color: "text-indigo-400",
    borderColor: "border-indigo-400/30",
    bgColor: "bg-indigo-400/5",
    nodes: [
      { id: "oop-basics", title: "Classes & Objects", description: "Access modifiers, constructors, properties", problemSlug: "singleton-class" },
      { id: "static-instance", title: "Static vs Instance", description: "When to use static methods and shared state" },
      { id: "virtual-abstract", title: "Virtual & Abstract Classes", description: "Inheritance, method overriding, abstract contracts" },
      { id: "interfaces", title: "Interfaces", description: "Define contracts for pluggable behavior", problemSlug: "interface-payment-processor", isPremium: true },
      { id: "wrapper-class", title: "Wrapper Classes", description: "Bundling multiple objects for UI or API exposure", problemSlug: "wrapper-class-table", isPremium: true },
    ],
  },
  {
    id: "soql",
    phase: "Phase 4",
    title: "SOQL & Data Access",
    description: "Query Salesforce data efficiently and securely",
    color: "text-teal-400",
    borderColor: "border-teal-400/30",
    bgColor: "bg-teal-400/5",
    nodes: [
      { id: "soql-basics", title: "Basic SOQL", description: "SELECT, WHERE, ORDER BY, LIMIT clauses", problemSlug: "soql-top-accounts-by-revenue" },
      { id: "soql-relationships", title: "Relationship Queries", description: "Parent-to-child and child-to-parent SOQL traversal", problemSlug: "soql-relationship-contacts-under-accounts" },
      { id: "soql-aggregates", title: "Aggregate Queries", description: "GROUP BY, COUNT, SUM, AVG in SOQL", problemSlug: "soql-aggregate-opportunity-stage", isPremium: true },
      { id: "soql-without-contacts", title: "Semi-join & Anti-join", description: "IN and NOT IN subqueries for complex filters", problemSlug: "soql-accounts-without-contacts" },
      { id: "dynamic-soql", title: "Dynamic SOQL & Security", description: "Database.query, escapeSingleQuotes, SECURITY_ENFORCED", problemSlug: "soql-prevent-injection", isPremium: true },
    ],
  },
  {
    id: "async",
    phase: "Phase 5",
    title: "Async Apex",
    description: "Run long-running or deferred operations outside request limits",
    color: "text-emerald-400",
    borderColor: "border-emerald-400/30",
    bgColor: "bg-emerald-400/5",
    nodes: [
      { id: "future", title: "Future Methods", description: "@future annotation for callouts and async DML", problemSlug: "future-external-callout" },
      { id: "queueable", title: "Queueable Apex", description: "Chaining jobs and tracking execution with AsyncApexJob", problemSlug: "queueable-followup-emails" },
      { id: "batch", title: "Batch Apex", description: "Process millions of records in chunks of 200", problemSlug: "batch-clean-inactive-accounts" },
      { id: "schedulable", title: "Schedulable Apex", description: "Run code on a recurring CRON schedule", problemSlug: "schedulable-daily-report", isPremium: true },
    ],
  },
  {
    id: "governor-limits",
    phase: "Phase 6",
    title: "Governor Limits",
    description: "Understand and respect Salesforce's multitenant resource limits",
    color: "text-rose-400",
    borderColor: "border-rose-400/30",
    bgColor: "bg-rose-400/5",
    nodes: [
      { id: "soql-limits", title: "SOQL Limits", description: "100 SOQL queries per transaction — never query in a loop" },
      { id: "dml-limits", title: "DML Limits", description: "150 DML statements — collect and commit once" },
      { id: "cpu-heap", title: "CPU Time & Heap", description: "10s CPU limit, 6MB heap — write lean Apex" },
      { id: "test-coverage", title: "Test Class Coverage", description: "75% coverage required for deployment", problemSlug: "apex-test-class-coverage" },
    ],
  },
];

const STORAGE_KEY = "apex-arena-roadmap-progress";

function loadProgress(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return new Set(JSON.parse(stored) as string[]);
  } catch { /* ignore */ }
  return new Set();
}

function saveProgress(done: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(done)));
  } catch { /* ignore */ }
}

export default function Roadmap() {
  const [done, setDone] = useState<Set<string>>(() => loadProgress());

  const totalNodes = ROADMAP.flatMap((s) => s.nodes).length;
  const completedNodes = ROADMAP.flatMap((s) => s.nodes).filter((n) => done.has(n.id)).length;
  const progressPercent = totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0;

  const toggle = (nodeId: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      saveProgress(next);
      return next;
    });
  };

  useEffect(() => {
    saveProgress(done);
  }, [done]);

  return (
    <PageWrapper className="container max-w-screen-lg px-4 md:px-6 py-8 sm:py-12 mx-auto">
      {/* Header */}
      <div className="mb-8 sm:mb-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-display mb-2">
              Apex Developer Roadmap
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl">
              A structured learning path from Apex basics to advanced patterns. Check off topics as you master them.
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-3xl font-extrabold font-mono text-foreground">{progressPercent}%</div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Complete</div>
          </div>
        </div>

        {/* Global progress bar */}
        <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-teal-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground font-mono">
          <span>{completedNodes} of {totalNodes} topics</span>
          <span>{totalNodes - completedNodes} remaining</span>
        </div>
      </div>

      {/* Roadmap sections */}
      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-[23px] top-8 bottom-8 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent hidden sm:block" />

        <div className="space-y-6 sm:space-y-8">
          {ROADMAP.map((section, sectionIdx) => {
            const sectionDone = section.nodes.filter((n) => done.has(n.id)).length;
            const sectionTotal = section.nodes.length;

            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: sectionIdx * 0.06 }}
                className="relative"
              >
                {/* Phase marker (desktop) */}
                <div className="hidden sm:flex absolute left-0 top-6 w-12 h-12 rounded-full border-2 border-white/10 bg-background items-center justify-center z-10 shrink-0">
                  <span className={cn("text-xs font-bold font-mono", section.color)}>
                    P{sectionIdx + 1}
                  </span>
                </div>

                {/* Section card */}
                <div className="sm:ml-16">
                  <div className={cn(
                    "rounded-2xl border p-5 sm:p-6",
                    section.borderColor,
                    section.bgColor,
                  )}>
                    {/* Section header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <span className={cn("text-[10px] font-mono font-bold uppercase tracking-widest", section.color)}>
                          {section.phase}
                        </span>
                        <h2 className="text-base sm:text-xl font-bold font-display mt-0.5">
                          {section.title}
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                          {section.description}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-lg font-bold font-mono">{sectionDone}/{sectionTotal}</span>
                      </div>
                    </div>

                    {/* Section progress bar */}
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-4">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", section.color.replace("text-", "bg-"))}
                        style={{ width: sectionTotal > 0 ? `${(sectionDone / sectionTotal) * 100}%` : "0%" }}
                      />
                    </div>

                    {/* Topic nodes */}
                    <div className="grid sm:grid-cols-2 gap-2">
                      {section.nodes.map((node) => {
                        const isComplete = done.has(node.id);
                        return (
                          <div
                            key={node.id}
                            className={cn(
                              "group flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none",
                              isComplete
                                ? "border-white/10 bg-white/5"
                                : "border-white/5 hover:border-white/15 hover:bg-white/[0.03]",
                            )}
                            onClick={() => toggle(node.id)}
                          >
                            {/* Checkbox */}
                            <div className="shrink-0 mt-0.5">
                              {isComplete ? (
                                <CheckCircle2 className={cn("w-5 h-5", section.color)} />
                              ) : (
                                <Circle className="w-5 h-5 text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors" />
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={cn(
                                  "text-sm font-semibold leading-tight transition-colors",
                                  isComplete ? "line-through text-muted-foreground" : "text-foreground group-hover:text-foreground",
                                )}>
                                  {node.title}
                                </span>
                                {node.isPremium && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-1.5 py-0.5 rounded-full">
                                    <Sparkles className="w-2.5 h-2.5" />Pro
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                                {node.description}
                              </p>
                            </div>

                            {/* Practice link */}
                            {node.problemSlug && (
                              <Link
                                href={`/problems/${node.problemSlug}`}
                                onClick={(e) => e.stopPropagation()}
                                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Practice this topic"
                              >
                                <div className={cn(
                                  "flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg border transition-colors",
                                  section.borderColor,
                                  section.color,
                                  "hover:bg-white/5",
                                )}>
                                  Practice <ChevronRight className="w-3 h-3" />
                                </div>
                              </Link>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="mt-10 sm:mt-14 rounded-2xl border border-white/5 bg-card/50 p-6 sm:p-8 text-center">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full mb-4">
          <Sparkles className="w-3 h-3" /> Pro topics included
        </div>
        <h3 className="text-lg sm:text-2xl font-bold font-display mb-2">
          Unlock all {ROADMAP.flatMap(s => s.nodes.filter(n => n.isPremium)).length} Pro topics
        </h3>
        <p className="text-muted-foreground text-sm mb-5 max-w-md mx-auto">
          Advanced patterns, design challenges, and security problems that separate senior devs from the rest.
        </p>
        <Link
          href="/pricing"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-yellow-500 hover:bg-yellow-400 text-yellow-950 px-6 text-sm font-bold shadow-[0_0_20px_hsl(48,96%,53%,0.2)] transition-all hover:shadow-[0_0_30px_hsl(48,96%,53%,0.3)] hover:-translate-y-0.5"
        >
          <Sparkles className="w-4 h-4" />
          Go Pro
        </Link>
      </div>
    </PageWrapper>
  );
}
