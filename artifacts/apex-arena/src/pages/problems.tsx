import { useState } from "react";
import { Link } from "wouter";
import { useListProblems, useListTags, getListProblemsQueryKey } from "@workspace/api-client-react";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { useUser } from "@/lib/user-context";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, CheckCircle2, Filter, Zap, Activity, Layers, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ProblemCategory, Difficulty } from "@workspace/api-client-react";

const categoryMeta = {
  trigger: { icon: Zap, label: "Triggers" },
  async_apex: { icon: Activity, label: "Async Apex" },
  classes: { icon: Layers, label: "Classes" },
  soql: { icon: Database, label: "SOQL" },
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

  return (
    <PageWrapper className="container max-w-screen-xl px-4 md:px-6 py-8 mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Problem Library</h1>
          <p className="text-muted-foreground mt-1">Practice real Salesforce scenarios.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6 items-start">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border/50">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 font-semibold pb-2 border-b border-border/50">
                <Filter className="w-4 h-4" /> Filters
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search problems..." 
                    className="pl-9"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    data-testid="input-search"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                  <SelectTrigger data-testid="select-category">
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty</label>
                <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                  <SelectTrigger data-testid="select-difficulty">
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Tags</label>
                <Select value={tag} onValueChange={(v: any) => setTag(v)}>
                  <SelectTrigger data-testid="select-tags">
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
                <button 
                  className="w-full text-sm text-primary hover:underline pt-2"
                  onClick={() => { setSearch(""); setCategory("all"); setDifficulty("all"); setTag("all"); }}
                  data-testid="btn-clear-filters"
                >
                  Clear filters
                </button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Problems List */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : problems?.length === 0 ? (
            <Card className="border-dashed border-2 py-12 text-center bg-muted/20">
              <CardContent>
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Search className="w-10 h-10 mb-4 opacity-20" />
                  <p className="text-lg font-medium text-foreground">No problems found</p>
                  <p className="text-sm">Try adjusting your filters to find what you're looking for.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {problems?.map(p => (
                <Link key={p.id} href={`/problems/${p.slug}`} className="group block">
                  <Card className="bg-card hover:bg-accent/5 transition-colors border-border/50 hover:border-primary/50 relative overflow-hidden">
                    <CardContent className="p-4 flex items-center justify-between sm:flex-row flex-col gap-4">
                      <div className="flex items-start gap-4 w-full">
                        <div className="pt-1">
                          {p.solved ? (
                            <CheckCircle2 className="w-5 h-5 text-success" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-muted" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                            {p.title}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs font-medium bg-background", 
                                p.difficulty === "easy" ? "text-success border-success/30" : 
                                p.difficulty === "medium" ? "text-warning border-warning/30" : 
                                "text-destructive border-destructive/30"
                              )}
                            >
                              {p.difficulty}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {categoryMeta[p.category as keyof typeof categoryMeta]?.label || p.category}
                            </Badge>
                            {p.tags.slice(0, 3).map(t => (
                              <Badge key={t} variant="outline" className="text-xs text-muted-foreground">{t}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-muted-foreground sm:w-auto w-full justify-between sm:justify-end pl-9 sm:pl-0">
                        <div className="text-right">
                          <div className="font-medium text-foreground">{p.acceptanceRate}%</div>
                          <div className="text-xs">Acceptance</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
