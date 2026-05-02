import { useState, useEffect } from "react";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { useUser } from "@/lib/user-context";
import {
  useGetUser,
  useGetUserStats,
  useUpsertUser,
  getGetUserQueryKey,
  getGetUserStatsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit2, Check, Flame, Target, Activity, Calendar, Code2, CheckCircle2, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

function AnimatedNumber({ value }: { value: number }) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { stiffness: 50, damping: 20 });
  const rounded = useTransform(springValue, (v) => Math.round(v));

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  return <motion.span>{rounded}</motion.span>;
}

export default function Profile() {
  const { userId } = useUser();
  const queryClient = useQueryClient();

  const { data: user, isLoading: loadingUser } = useGetUser(userId, {
    query: { enabled: !!userId, queryKey: getGetUserQueryKey(userId) }
  });

  const { data: stats, isLoading: loadingStats } = useGetUserStats(userId, {
    query: { enabled: !!userId, queryKey: getGetUserStatsQueryKey(userId) }
  });

  const upsertMut = useUpsertUser();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    if (user && !isEditing) {
      setEditName(user.username);
    }
  }, [user, isEditing]);

  const handleSaveName = () => {
    if (!editName.trim()) return;
    upsertMut.mutate(
      { data: { id: userId, username: editName } },
      {
        onSuccess: () => {
          setIsEditing(false);
          queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(userId) });
          queryClient.invalidateQueries({ queryKey: getGetUserStatsQueryKey(userId) });
          toast.success("Profile updated");
        },
        onError: () => toast.error("Failed to update profile"),
      }
    );
  };

  if (!userId) {
    return (
      <PageWrapper className="container max-w-screen-xl px-4 py-20 mx-auto">
        <div className="flex flex-col items-center justify-center text-center gap-5 max-w-sm mx-auto">
          <div className="w-16 h-16 rounded-full bg-secondary/50 border border-white/10 flex items-center justify-center">
            <LogIn className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold mb-2">Sign in to view your profile</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Track your progress, streaks, and solved problems after signing in.
            </p>
          </div>
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-[0_0_15px_hsl(var(--primary)/0.2)]">
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      </PageWrapper>
    );
  }

  if (loadingUser || loadingStats) {
    return (
      <PageWrapper className="container max-w-screen-xl px-3 sm:px-4 py-8 sm:py-12 mx-auto">
        <Skeleton className="h-[500px] w-full rounded-xl bg-secondary/30 border border-white/5" />
      </PageWrapper>
    );
  }

  if (!user || !stats) {
    return (
      <PageWrapper className="container max-w-screen-xl px-4 py-20 mx-auto text-center font-display text-2xl text-muted-foreground">
        User not found
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="container max-w-screen-xl px-3 sm:px-4 py-6 sm:py-12 mx-auto">
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">

        {/* Left: User card + progress */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          <Card className="border-white/5 overflow-hidden bg-card/50 backdrop-blur-sm shadow-xl">
            <div className="h-24 sm:h-32 bg-[url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center relative">
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
              <div className="absolute inset-0 bg-primary/20 mix-blend-overlay" />
            </div>
            <CardContent className="pt-0 relative px-4 sm:px-6 pb-5 sm:pb-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-background border-4 border-background flex items-center justify-center -mt-10 sm:-mt-12 mb-4 sm:mb-5 shadow-lg relative z-10 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-teal-400/20 group-hover:opacity-100 transition-opacity" />
                <div className="w-full h-full bg-secondary/80 text-foreground flex items-center justify-center text-3xl sm:text-4xl font-display font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                {isEditing ? (
                  <div className="flex items-center gap-2 w-full">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-9 font-display font-bold text-base sm:text-lg bg-background border-primary/50 focus-visible:ring-primary"
                      autoFocus
                    />
                    <Button size="sm" onClick={handleSaveName} disabled={upsertMut.isPending} className="h-9 px-3 shrink-0">
                      {upsertMut.isPending ? <Activity className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group min-w-0">
                    <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight font-display truncate">{user.username}</h1>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="shrink-0 text-muted-foreground opacity-100 sm:opacity-0 group-hover:opacity-100 hover:text-primary transition-all"
                      aria-label="Edit name"
                      data-testid="btn-edit-name"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-5 sm:mb-8">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                Joined {format(new Date(user.joinedAt), "MMMM yyyy")}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-6 py-4 sm:py-6 border-t border-white/5">
                <div>
                  <div className="text-2xl sm:text-3xl font-mono font-bold text-foreground mb-1">
                    <AnimatedNumber value={stats.solvedCount} />
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Solved</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-mono font-bold text-success mb-1 drop-shadow-[0_0_8px_hsl(var(--success)/0.3)]">
                    <AnimatedNumber value={stats.acceptanceRate} />%
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Acceptance</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-mono font-bold flex items-center gap-1.5 mb-1 text-foreground">
                    <AnimatedNumber value={stats.currentStreakDays} />
                    <Flame className="w-5 h-5 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Day Streak</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-mono font-bold text-foreground mb-1">
                    <AnimatedNumber value={stats.submissionCount} />
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Submissions</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/5 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4 border-b border-white/5 px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg font-display flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" /> Track Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 px-4 sm:px-6 pb-5 space-y-4 sm:space-y-5">
              {stats.byCategory.map((c, i) => {
                const pct = c.total > 0 ? (c.solved / c.total) * 100 : 0;
                return (
                  <motion.div
                    key={c.category}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="flex justify-between text-sm mb-1.5 font-medium text-foreground">
                      <span className="capitalize text-xs sm:text-sm">{c.category.replace("_", " ")}</span>
                      <span className="font-mono text-muted-foreground text-xs sm:text-sm">
                        {c.solved} <span className="opacity-50">/ {c.total}</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: i * 0.1 + 0.2 }}
                        className="h-full bg-gradient-to-r from-primary to-teal-400 shadow-[0_0_10px_hsl(var(--primary)/0.5)]"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right: difficulty badges + activity */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {stats.byDifficulty.map((d, i) => (
              <motion.div key={d.difficulty} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="border-white/5 bg-card/50 backdrop-blur-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="p-3 sm:p-6 flex flex-col items-center justify-center text-center relative z-10">
                    <div className="text-2xl sm:text-4xl font-mono font-bold mb-2 text-foreground">
                      <AnimatedNumber value={d.solved} />
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] sm:text-[10px] uppercase tracking-widest font-mono font-bold px-2 py-0.5",
                        d.difficulty === "easy" ? "text-success border-success/30 bg-success/5"
                          : d.difficulty === "medium" ? "text-warning border-warning/30 bg-warning/5"
                          : "text-destructive border-destructive/30 bg-destructive/5",
                      )}
                    >
                      {d.difficulty}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card className="border-white/5 bg-card/50 backdrop-blur-sm flex flex-col" style={{ minHeight: "360px" }}>
            <CardHeader className="border-b border-white/5 bg-secondary/20 px-4 sm:px-6 py-4">
              <CardTitle className="text-base sm:text-lg font-display flex items-center gap-2">
                <Activity className="w-5 h-5 text-muted-foreground" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto custom-scrollbar">
              {stats.recentActivity.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-secondary/50 flex items-center justify-center mb-5 border border-white/5">
                    <Code2 className="w-7 h-7 opacity-50" />
                  </div>
                  <p className="font-display font-medium text-base sm:text-lg text-foreground mb-2">No activity yet</p>
                  <p className="text-sm max-w-xs mb-6 leading-relaxed">Your problem-solving journey starts here. Head over to the arena to write your first Apex.</p>
                  <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-[0_0_15px_hsl(var(--primary)/0.2)]">
                    <Link href="/problems">Enter the Arena</Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {stats.recentActivity.map((activity, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="px-4 sm:px-5 py-3.5 sm:py-4 hover:bg-secondary/30 transition-colors flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium font-display text-sm sm:text-base mb-1 truncate">
                          <Link href={`/problems/${activity.problemSlug}`} className="text-foreground hover:text-primary transition-colors">
                            {activity.problemTitle}
                          </Link>
                        </div>
                        <div className="text-[10px] sm:text-xs font-mono text-muted-foreground">
                          {format(new Date(activity.createdAt), "MMM d, yyyy • HH:mm")}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-mono text-[10px] sm:text-xs px-2 py-1 rounded-md shrink-0",
                          activity.status === "accepted"
                            ? "bg-success/10 text-success border-success/30 shadow-[0_0_10px_hsl(var(--success)/0.2)]"
                            : "bg-destructive/5 text-destructive border-destructive/20",
                        )}
                      >
                        {activity.status === "accepted" ? (
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3" /> Accepted
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <Code2 className="w-3 h-3" /> Attempted
                          </span>
                        )}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
