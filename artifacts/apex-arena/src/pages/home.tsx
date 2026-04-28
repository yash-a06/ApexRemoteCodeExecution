import { PageWrapper } from "@/components/layout/page-wrapper";
import { Link } from "wouter";
import { useGetPlatformStats, useListFeaturedProblems, useGetLeaderboard } from "@workspace/api-client-react";
import { Code2, Zap, Layers, Database, ArrowRight, Trophy, Users, Activity, Terminal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const categoryMeta = {
  trigger: { icon: Zap, label: "Triggers", desc: "Master before/after and bulkification", color: "text-cyan-400", bg: "bg-cyan-400/10", border: "group-hover:border-cyan-400/50" },
  async_apex: { icon: Activity, label: "Async Apex", desc: "Batch, Future, Queueable, and Schedulable", color: "text-mint-400", bg: "bg-emerald-400/10", border: "group-hover:border-emerald-400/50" },
  classes: { icon: Layers, label: "Classes", desc: "OOP, inheritance, and design patterns", color: "text-indigo-400", bg: "bg-indigo-400/10", border: "group-hover:border-indigo-400/50" },
  soql: { icon: Database, label: "SOQL", desc: "Queries, relationships, and aggregates", color: "text-teal-400", bg: "bg-teal-400/10", border: "group-hover:border-teal-400/50" },
} as const;

function AnimatedNumber({ value }: { value: number }) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { stiffness: 50, damping: 20 });
  
  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  return <motion.span>{springValue}</motion.span>;
}

export default function Home() {
  const { data: stats, isLoading: loadingStats } = useGetPlatformStats();
  const { data: featured, isLoading: loadingFeatured } = useListFeaturedProblems();
  const { data: leaderboard, isLoading: loadingLeaderboard } = useGetLeaderboard();

  return (
    <PageWrapper>
      {/* Cinematic Hero Section */}
      <section className="relative overflow-hidden border-b border-white/[0.08] pt-32 pb-24 sm:pt-40 sm:pb-32 bg-background">
        <div className="absolute inset-0 z-0 bg-grid-pattern opacity-20 mask-image-radial-gradient"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="container max-w-screen-xl px-4 md:px-6 mx-auto relative z-10 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="outline" className="mb-6 border-primary/30 text-primary bg-primary/10 px-3 py-1 font-mono text-xs uppercase tracking-widest">
                Salesforce Developer Practice Arena
              </Badge>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tighter mb-6 font-display leading-[1.1]">
                Master Apex <br className="hidden lg:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-400 animate-pulse-slow glow-text">The Hard Way</span>
              </h1>
              <p className="max-w-2xl mx-auto lg:mx-0 text-lg sm:text-xl text-muted-foreground mb-10 font-sans font-light leading-relaxed">
                Real-world scenarios. Strict governor limits. Instant feedback. Level up your Salesforce development skills in a competitive, zero-distraction environment.
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                <Link href="/problems" className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.3)] transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" data-testid="link-explore-problems">
                  Start Coding
                </Link>
                <Link href="/leaderboard" className="inline-flex h-12 items-center justify-center rounded-md border border-white/10 bg-secondary/50 backdrop-blur-sm px-8 text-sm font-semibold shadow-sm transition-all hover:bg-secondary hover:border-white/20 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" data-testid="link-view-leaderboard">
                  View Leaderboard
                </Link>
              </div>
              
              <div className="mt-12 flex items-center justify-center lg:justify-start gap-8 border-t border-white/10 pt-8">
                <div className="text-sm text-muted-foreground font-mono">Trusted by developers at</div>
                <div className="flex gap-4 opacity-50 grayscale">
                  {/* Pseudo logos */}
                  <div className="font-bold font-display tracking-tight text-xl">CloudInc</div>
                  <div className="font-bold font-display tracking-tight text-xl italic">Nexus</div>
                </div>
              </div>
            </motion.div>
          </div>
          
          <motion.div 
            className="flex-1 w-full max-w-lg hidden md:block"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="rounded-xl border border-white/10 bg-[#0d1117] overflow-hidden shadow-2xl shadow-primary/5 relative group">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center px-4 py-3 border-b border-white/5 bg-[#161b22]">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="ml-4 text-xs font-mono text-muted-foreground flex items-center gap-2">
                  <Terminal className="w-3 h-3" /> AccountTriggerHandler.cls
                </div>
              </div>
              <div className="p-4 font-mono text-sm leading-relaxed overflow-hidden h-[240px]">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ staggerChildren: 0.1, delayChildren: 0.5 }}
                >
                  <div className="text-purple-400">public class <span className="text-blue-400">AccountTriggerHandler</span> {'{'}</div>
                  <div className="pl-4 text-purple-400">public static void <span className="text-blue-400">beforeInsert</span>(List&lt;Account&gt; newList) {'{'}</div>
                  <div className="pl-8 text-gray-400">// Ensure all new accounts have a domain</div>
                  <div className="pl-8 text-purple-400">for <span className="text-foreground">(Account acc : newList) {'{'}</span></div>
                  <div className="pl-12 text-foreground">if <span className="text-purple-400">(</span>acc.Website != <span className="text-blue-400">null</span><span className="text-purple-400">) {'{'}</span></div>
                  <div className="pl-16 text-foreground">acc.Domain__c = extractDomain<span className="text-purple-400">(</span>acc.Website<span className="text-purple-400">)</span>;</div>
                  <div className="pl-12 text-purple-400">{'}'}</div>
                  <div className="pl-8 text-purple-400">{'}'}</div>
                  <div className="pl-4 text-purple-400">{'}'}</div>
                  <div className="text-purple-400">{'}'}</div>
                  <div className="mt-2 text-primary animate-pulse">_</div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Ribbon */}
      <div className="border-b border-white/[0.08] bg-secondary/30 backdrop-blur-md">
        <div className="container max-w-screen-xl px-4 md:px-6 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/[0.08]">
            <StatCard icon={Code2} value={stats?.totalProblems} label="Problems" loading={loadingStats} />
            <StatCard icon={Activity} value={stats?.totalSubmissions} label="Submissions" loading={loadingStats} />
            <StatCard icon={Users} value={stats?.totalUsers} label="Developers" loading={loadingStats} />
            <StatCard icon={Zap} value={99.9} label="Uptime %" loading={false} />
          </div>
        </div>
      </div>

      <div className="container max-w-screen-xl px-4 md:px-6 mx-auto py-24 space-y-32">
        
        {/* Categories */}
        <section>
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-bold tracking-tight font-display">Training Tracks</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(Object.entries(categoryMeta) as [keyof typeof categoryMeta, typeof categoryMeta[keyof typeof categoryMeta]][]).map(([key, meta], i) => {
              const Icon = meta.icon;
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link href={`/problems?category=${key}`} className="block group">
                    <Card className={cn("h-full bg-card hover:bg-secondary/50 transition-all duration-300 border-white/5 relative overflow-hidden glow-card hover:-translate-y-1", meta.border)}>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                      <CardHeader>
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-inner", meta.bg, meta.color)}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-xl font-display group-hover:text-primary transition-colors">{meta.label}</CardTitle>
                        <CardDescription className="text-sm font-light mt-2 leading-relaxed">{meta.desc}</CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Featured Problems & Leaderboard */}
        <section className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold tracking-tight font-display">Featured Challenges</h2>
              <Link href="/problems" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 group">
                View all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="grid gap-4">
              {loadingFeatured ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full bg-secondary rounded-xl" />)
              ) : featured?.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link href={`/problems/${p.slug}`}>
                    <Card className="hover:bg-secondary/40 transition-all duration-300 border-white/5 hover:border-primary/30 relative overflow-hidden group">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <CardContent className="p-6 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="font-semibold text-lg font-display">{p.title}</h3>
                            <Badge variant="outline" className={cn(
                                "text-xs px-2 py-0.5 uppercase tracking-wider font-mono rounded-full flex items-center gap-1.5",
                                p.difficulty === "easy" ? "text-success border-success/20 bg-success/5" : 
                                p.difficulty === "medium" ? "text-warning border-warning/20 bg-warning/5" : 
                                "text-destructive border-destructive/20 bg-destructive/5"
                              )}>
                                <span className={cn("w-1.5 h-1.5 rounded-full", 
                                  p.difficulty === "easy" ? "bg-success" : 
                                  p.difficulty === "medium" ? "bg-warning" : 
                                  "bg-destructive"
                                )}></span>
                                {p.difficulty}
                              </Badge>
                          </div>
                          <div className="flex gap-2">
                            {p.tags.slice(0, 3).map(t => (
                              <span key={t} className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded-md border border-white/5">{t}</span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${p.acceptanceRate}%` }}></div>
                            </div>
                            <span className="font-mono text-sm text-foreground font-medium w-10 text-right">{p.acceptanceRate}%</span>
                          </div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Acceptance</div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold tracking-tight font-display flex items-center gap-3">
                Top Devs
              </h2>
            </div>
            
            <Card className="border-white/5 bg-card/50 backdrop-blur-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-yellow-500 via-gray-400 to-amber-700"></div>
              <CardContent className="p-0">
                <div className="divide-y divide-white/5">
                  {loadingLeaderboard ? (
                    Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-none bg-transparent" />)
                  ) : leaderboard?.slice(0, 5).map((user, idx) => (
                    <div key={user.userId} className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold",
                          idx === 0 ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" : 
                          idx === 1 ? "bg-gray-400/10 text-gray-400 border border-gray-400/20" : 
                          idx === 2 ? "bg-amber-700/10 text-amber-700 border border-amber-700/20" : 
                          "bg-muted/50 text-muted-foreground border border-white/5"
                        )}>
                          {idx + 1}
                        </div>
                        <div className="font-medium group-hover:text-primary transition-colors">{user.username}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono font-bold text-foreground">{user.solvedCount}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Solved</div>
                      </div>
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
  const numValue = typeof value === 'number' ? value : parseFloat(value as string) || 0;
  
  return (
    <div className="flex flex-col items-center p-8 hover:bg-white/[0.02] transition-colors relative group">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <Icon className="w-6 h-6 text-muted-foreground mb-4 group-hover:text-primary transition-colors" />
      {loading ? (
        <Skeleton className="h-10 w-20 mb-2 bg-white/10" />
      ) : (
        <div className="text-4xl font-extrabold text-foreground font-mono tracking-tight mb-1">
          {typeof value === 'number' ? <AnimatedNumber value={numValue} /> : value}
        </div>
      )}
      <div className="text-xs text-muted-foreground uppercase tracking-[0.2em] font-semibold">{label}</div>
    </div>
  );
}
