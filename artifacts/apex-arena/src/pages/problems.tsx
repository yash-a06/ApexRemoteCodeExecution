import { useState } from "react";
import { Link } from "wouter";
import { useListProblems, useListTags, ProblemCategory, Difficulty } from "@workspace/api-client-react";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { useUser } from "@/lib/user-context";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, CheckCircle2, Filter, Zap, Activity, Layers, Database, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

const categoryMeta = {
  trigger: { icon: Zap, label: "Triggers", color: "text-cyan-400" },
  async_apex: { icon: Activity, label: "Async Apex", color: "text-emerald-400" },
  classes: { icon: Layers, label: "Classes", color: "text-indigo-400" },
  soql: { icon: Database, label: "SOQL", color: "text-teal-400" },
} as const;

export default function Problems() {
  const { userId } = useUser();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ProblemCategory | "all">("all");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [tag, setTag] = useState<string | "all">("all");

  const { data: problems, isLoading } = useListProblems({
    search: search || undefined,
    category: category !== "all" ? category as ProblemCategory : undefined,
    difficulty: difficulty !== "all" ? difficulty as Difficulty : undefined,
    tag: tag !== "all" ? tag : undefined,
    userId
  });

  const { data: tags } = useListTags();

  const solvedCount = problems?.filter(p => p.solved).length || 0;
  const totalCount = problems?.length || 0;

  return (
    <PageWrapper className="container max-w-screen-xl px-4 md:px-6 py-12 mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight font-display mb-2">Problem Library</h1>
          <p className="text-muted-foreground text-lg">Practice real Salesforce scenarios with instant feedback.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8 items-start">
        {/* Sticky Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
          <div className="rounded-xl border border-white/5 bg-card/50 backdrop-blur-sm overflow-hidden shadow-2xl shadow-primary/5">
            <div className="p-5 border-b border-white/5 bg-secondary/30 flex items-center gap-2 font-semibold font-display">
              <Filter className="w-4 h-4 text-primary" /> Filters
            </div>

            <div className="p-5 space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Search</label>
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="Search problems..." 
                    className="pl-9 h-10 bg-background border-white/10 focus-visible:ring-primary focus-visible:border-primary transition-all"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    data-testid="input-search"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Category</label>
                <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                  <SelectTrigger className="h-10 bg-background border-white/10" data-testid="select-category">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.entries(categoryMeta).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Difficulty</label>
                <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                  <SelectTrigger className="h-10 bg-background border-white/10" data-testid="select-difficulty">
                    <SelectValue placeholder="All Difficulties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Difficulties</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Tags</label>
                <Select value={tag} onValueChange={(v: any) => setTag(v)}>
                  <SelectTrigger className="h-10 bg-background border-white/10" data-testid="select-tags">
                    <SelectValue placeholder="All Tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tags</SelectItem>
                    {tags?.map(t => (
                      <SelectItem key={t.tag} value={t.tag}>{t.tag} ({t.count})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(search || category !== "all" || difficulty !== "all" || tag !== "all") && (
                <motion.button 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="w-full text-xs font-semibold text-primary hover:text-primary/80 pt-2 transition-colors uppercase tracking-widest"
                  onClick={() => { setSearch(""); setCategory("all"); setDifficulty("all"); setTag("all"); }}
                  data-testid="btn-clear-filters"
                >
                  Clear all filters
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Problems List */}
        <div className="lg:col-span-3">
          {/* List Header Strip */}
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="text-sm font-medium text-muted-foreground">
              Showing <span className="text-foreground font-mono">{totalCount}</span> problems
            </div>
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Solved: <span className="text-foreground font-mono">{solvedCount}</span>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl bg-secondary/50 border border-white/5" />
              ))}
            </div>
          ) : problems?.length === 0 ? (
            <div className="rounded-xl border border-white/5 border-dashed py-24 bg-card/30 flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-6 shadow-inner border border-white/5">
                <Search className="w-8 h-8 text-muted-foreground opacity-50" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2">No problems found</h3>
              <p className="text-muted-foreground max-w-md">
                We couldn't find any problems matching your current filters. Try adjusting your search or clearing filters.
              </p>
              <button 
                onClick={() => { setSearch(""); setCategory("all"); setDifficulty("all"); setTag("all"); }}
                className="mt-6 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md text-sm font-medium transition-colors border border-white/10"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              <AnimatePresence>
                {problems?.map((p, i) => {
                  const CatIcon = categoryMeta[p.category as keyof typeof categoryMeta]?.icon || Code2;
                  const catColor = categoryMeta[p.category as keyof typeof categoryMeta]?.color || "text-muted-foreground";
                  
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: Math.min(i * 0.04, 0.4) }}
                    >
                      <Link href={`/problems/${p.slug}`} className="group block">
                        <div className="rounded-xl bg-card hover:bg-secondary/40 border border-white/5 hover:border-primary/30 transition-all duration-300 relative overflow-hidden glow-card">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          
                          <div className="p-5 flex items-center gap-5">
                            {/* Status Icon */}
                            <div className="shrink-0 pt-0.5">
                              {p.solved ? (
                                <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center border border-success/20">
                                  <CheckCircle2 className="w-4 h-4 text-success shadow-[0_0_10px_hsl(var(--success))]" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full border-2 border-white/10 group-hover:border-primary/30 transition-colors" />
                              )}
                            </div>
                            
                            {/* Main Content */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg font-display group-hover:text-primary transition-colors truncate mb-2">
                                {p.title}
                              </h3>
                              <div className="flex flex-wrap items-center gap-3">
                                {/* Difficulty Pill */}
                                <div className={cn(
                                  "text-[10px] uppercase tracking-widest font-mono font-bold flex items-center gap-1.5",
                                  p.difficulty === "easy" ? "text-success" : 
                                  p.difficulty === "medium" ? "text-warning" : 
                                  "text-destructive"
                                )}>
                                  <span className={cn("w-1.5 h-1.5 rounded-full", 
                                    p.difficulty === "easy" ? "bg-success shadow-[0_0_5px_hsl(var(--success))]" : 
                                    p.difficulty === "medium" ? "bg-warning shadow-[0_0_5px_hsl(var(--warning))]" : 
                                    "bg-destructive shadow-[0_0_5px_hsl(var(--destructive))]"
                                  )}></span>
                                  {p.difficulty}
                                </div>
                                
                                <div className="w-px h-3 bg-white/10" />
                                
                                {/* Category */}
                                <div className={cn("flex items-center gap-1.5 text-xs font-medium", catColor)}>
                                  <CatIcon className="w-3.5 h-3.5" />
                                  {categoryMeta[p.category as keyof typeof categoryMeta]?.label || p.category}
                                </div>

                                <div className="hidden sm:block w-px h-3 bg-white/10" />
                                
                                {/* Tags */}
                                <div className="hidden sm:flex gap-1.5">
                                  {p.tags.slice(0, 3).map(t => (
                                    <span key={t} className="text-[10px] font-mono text-muted-foreground bg-white/5 px-2 py-0.5 rounded border border-white/5">{t}</span>
                                  ))}
                                  {p.tags.length > 3 && (
                                    <span className="text-[10px] font-mono text-muted-foreground bg-white/5 px-2 py-0.5 rounded border border-white/5">+{p.tags.length - 3}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Acceptance Rate */}
                            <div className="shrink-0 text-right hidden md:block">
                              <div className="flex items-center justify-end gap-3 mb-1">
                                <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-primary" style={{ width: `${p.acceptanceRate}%` }}></div>
                                </div>
                                <span className="font-mono text-sm text-foreground font-medium w-12">{p.acceptanceRate}%</span>
                              </div>
                              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold pr-1">Acceptance</div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
