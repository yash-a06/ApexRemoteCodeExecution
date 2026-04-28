import { PageWrapper } from "@/components/layout/page-wrapper";
import { Link } from "wouter";
import { useGetPlatformStats, useListFeaturedProblems, useGetLeaderboard, getGetPlatformStatsQueryKey, getListFeaturedProblemsQueryKey, getGetLeaderboardQueryKey } from "@workspace/api-client-react";
import { Code2, Zap, Layers, Database, ArrowRight, Trophy, Users, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const categoryMeta = {
  trigger: { icon: Zap, label: "Triggers", desc: "Master before/after and bulkification", color: "text-amber-500", bg: "bg-amber-500/10" },
  async_apex: { icon: Activity, label: "Async Apex", desc: "Batch, Future, Queueable, and Schedulable", color: "text-blue-500", bg: "bg-blue-500/10" },
  classes: { icon: Layers, label: "Classes", desc: "OOP, inheritance, and design patterns", color: "text-purple-500", bg: "bg-purple-500/10" },
  soql: { icon: Database, label: "SOQL", desc: "Queries, relationships, and aggregates", color: "text-emerald-500", bg: "bg-emerald-500/10" },
} as const;

export default function Home() {
  const { data: stats, isLoading: loadingStats } = useGetPlatformStats();
  const { data: featured, isLoading: loadingFeatured } = useListFeaturedProblems();
  const { data: leaderboard, isLoading: loadingLeaderboard } = useGetLeaderboard();

  return (
    <PageWrapper>
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/40 py-24 sm:py-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>
        <div className="container max-w-screen-xl px-4 md:px-6 mx-auto text-center">
          <Badge variant="outline" className="mb-6 border-primary/30 text-primary bg-primary/5 px-3 py-1">
            Salesforce Developer Practice Arena
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
            Master Apex <span className="text-primary">The Hard Way</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground mb-10">
            Real-world scenarios. Strict governor limits. Instant feedback. Level up your Salesforce development skills in a competitive, zero-distraction environment.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/problems" className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" data-testid="link-explore-problems">
              Start Coding
            </Link>
            <Link href="/leaderboard" className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" data-testid="link-view-leaderboard">
              View Leaderboard
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-4xl mx-auto">
            <StatCard icon={Code2} value={stats?.totalProblems} label="Problems" loading={loadingStats} />
            <StatCard icon={Activity} value={stats?.totalSubmissions} label="Submissions" loading={loadingStats} />
            <StatCard icon={Users} value={stats?.totalUsers} label="Developers" loading={loadingStats} />
            <StatCard icon={Zap} value="99.9%" label="Uptime" loading={false} />
          </div>
        </div>
      </section>

      <div className="container max-w-screen-xl px-4 md:px-6 mx-auto py-16 space-y-24">
        
        {/* Categories */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Tracks</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(Object.entries(categoryMeta) as [keyof typeof categoryMeta, typeof categoryMeta[keyof typeof categoryMeta]][]).map(([key, meta]) => {
              const Icon = meta.icon;
              return (
                <Link key={key} href={`/problems?category=${key}`} className="block group">
                  <Card className="h-full bg-card hover:bg-accent/5 transition-colors border-border/50 hover:border-primary/50 relative overflow-hidden">
                    <CardHeader>
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-4", meta.bg, meta.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">{meta.label}</CardTitle>
                      <CardDescription className="text-sm">{meta.desc}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Featured Problems & Leaderboard */}
        <section className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">Featured Challenges</h2>
              <Link href="/problems" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid gap-4">
              {loadingFeatured ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
              ) : featured?.map((p) => (
                <Link key={p.id} href={`/problems/${p.slug}`}>
                  <Card className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{p.title}</h3>
                          <Badge variant="secondary" className="text-xs capitalize">{p.difficulty}</Badge>
                        </div>
                        <div className="flex gap-2">
                          {p.tags.slice(0, 3).map(t => (
                            <Badge key={t} variant="outline" className="text-xs text-muted-foreground">{t}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div className="font-medium text-foreground">{p.acceptanceRate}%</div>
                        <div>Acceptance</div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" /> Top Devs
              </h2>
            </div>
            
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {loadingLeaderboard ? (
                    Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-none" />)
                  ) : leaderboard?.slice(0, 5).map((user, idx) => (
                    <div key={user.userId} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-6 text-center font-bold",
                          idx === 0 ? "text-yellow-500" : idx === 1 ? "text-gray-400" : idx === 2 ? "text-amber-700" : "text-muted-foreground"
                        )}>
                          #{idx + 1}
                        </div>
                        <div className="font-medium">{user.username}</div>
                      </div>
                      <div className="text-sm font-semibold">{user.solvedCount}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

      </div>
    </PageWrapper>
  );
}

function StatCard({ icon: Icon, value, label, loading }: { icon: any, value: number | string | undefined, label: string, loading: boolean }) {
  return (
    <div className="flex flex-col items-center p-4 bg-background/50 border border-border/50 rounded-xl backdrop-blur-sm">
      <Icon className="w-5 h-5 text-muted-foreground mb-2" />
      {loading ? (
        <Skeleton className="h-8 w-16 mb-1" />
      ) : (
        <div className="text-2xl sm:text-3xl font-bold text-foreground">{value || 0}</div>
      )}
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  );
}
