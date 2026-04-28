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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit2, Check, User as UserIcon, Flame, Target, Activity, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

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
    upsertMut.mutate({
      data: { id: userId, username: editName }
    }, {
      onSuccess: () => {
        setIsEditing(false);
        queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(userId) });
        queryClient.invalidateQueries({ queryKey: getGetUserStatsQueryKey(userId) });
        toast.success("Profile updated");
      },
      onError: () => toast.error("Failed to update profile")
    });
  };

  if (loadingUser || loadingStats) {
    return <PageWrapper className="container max-w-screen-xl px-4 py-8 mx-auto"><Skeleton className="h-64 w-full" /></PageWrapper>;
  }

  if (!user || !stats) {
    return <PageWrapper className="container max-w-screen-xl px-4 py-8 mx-auto text-center">User not found</PageWrapper>;
  }

  return (
    <PageWrapper className="container max-w-screen-xl px-4 py-8 mx-auto">
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column: User Card & Progress */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border/50 overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-primary/40 to-accent/40" />
            <CardContent className="pt-0 relative px-6 pb-6">
              <div className="w-20 h-20 rounded-xl bg-background border-4 border-background flex items-center justify-center -mt-10 mb-4 shadow-sm relative z-10 overflow-hidden">
                <div className="w-full h-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                {isEditing ? (
                  <div className="flex items-center gap-2 w-full">
                    <Input 
                      value={editName} 
                      onChange={e => setEditName(e.target.value)}
                      className="h-8"
                      autoFocus
                    />
                    <Button size="sm" onClick={handleSaveName} disabled={upsertMut.isPending}>
                      {upsertMut.isPending ? <Activity className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">{user.username}</h1>
                    <button onClick={() => setIsEditing(true)} className="text-muted-foreground hover:text-foreground transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <Calendar className="w-4 h-4" />
                Joined {format(new Date(user.joinedAt), "MMMM yyyy")}
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-t border-border/50">
                <div>
                  <div className="text-2xl font-bold">{stats.solvedCount}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Solved</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-success">{stats.acceptanceRate}%</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Acceptance</div>
                </div>
                <div>
                  <div className="text-2xl font-bold flex items-center gap-1">
                    {stats.currentStreakDays} <Flame className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Day Streak</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.submissionCount}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Submissions</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" /> Track Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.byCategory.map(c => {
                const pct = c.total > 0 ? (c.solved / c.total) * 100 : 0;
                return (
                  <div key={c.category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{c.category.replace('_', ' ')}</span>
                      <span className="text-muted-foreground">{c.solved} / {c.total}</span>
                    </div>
                    <Progress value={pct} className="h-2 bg-muted" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Difficulty & Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            {stats.byDifficulty.map(d => (
              <Card key={d.difficulty} className="border-border/50">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div className="text-3xl font-bold mb-1">{d.solved}</div>
                  <Badge variant="outline" className={
                    d.difficulty === "easy" ? "text-success border-success/30" : 
                    d.difficulty === "medium" ? "text-warning border-warning/30" : 
                    "text-destructive border-destructive/30"
                  }>{d.difficulty}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-border/50 h-[500px] flex flex-col">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto">
              {stats.recentActivity.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
                  <Activity className="w-12 h-12 mb-4 opacity-20" />
                  <p>No activity yet.</p>
                  <Button variant="link" asChild className="mt-2 text-primary">
                    <Link href="/problems">Start solving problems</Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {stats.recentActivity.map((activity, i) => (
                    <div key={i} className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between">
                      <div>
                        <div className="font-medium mb-1">
                          <Link href={`/problems/${activity.problemSlug}`} className="hover:text-primary transition-colors">
                            {activity.problemTitle}
                          </Link>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(activity.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </div>
                      </div>
                      <Badge variant="outline" className={
                        activity.status === "accepted" ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"
                      }>
                        {activity.status === "accepted" ? "Accepted" : "Attempted"}
                      </Badge>
                    </div>
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
