import { PageWrapper } from "@/components/layout/page-wrapper";
import { useGetLeaderboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Trophy, Medal, Award, Crown } from "lucide-react";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard();

  return (
    <PageWrapper className="container max-w-screen-xl px-3 sm:px-4 py-8 sm:py-16 mx-auto">
      <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12">

        {/* Header */}
        <div className="text-center space-y-4 sm:space-y-5">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="inline-flex items-center justify-center p-3.5 sm:p-5 bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 rounded-2xl mb-1 border border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.2)]"
          >
            <Crown className="w-9 h-9 sm:w-12 sm:h-12 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
          </motion.div>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-display mb-2 sm:mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
              Hall of Fame
            </h1>
            <p className="text-sm sm:text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed px-2">
              The top Salesforce developers conquering the Arena. Rank up by solving more challenges.
            </p>
          </motion.div>
        </div>

        {/* Table card */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          <Card className="border-white/10 overflow-hidden bg-card/60 backdrop-blur-xl shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-gray-300 to-amber-700 opacity-80" />
            <CardHeader className="bg-secondary/30 border-b border-white/5 py-4 sm:py-6 px-4 sm:px-8">
              <CardTitle className="font-display text-lg sm:text-2xl">Global Rankings</CardTitle>
              <CardDescription className="text-[10px] sm:text-sm font-medium uppercase tracking-widest mt-1">
                Ranked by total solved problems
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* Mobile list (< sm) */}
              <div className="sm:hidden divide-y divide-white/5">
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                        <Skeleton className="w-7 h-7 rounded-full bg-white/5 shrink-0" />
                        <Skeleton className="h-4 flex-1 bg-white/5" />
                        <Skeleton className="h-4 w-8 bg-white/5" />
                      </div>
                    ))
                  : leaderboard?.length === 0
                  ? (
                    <div className="py-16 text-center text-muted-foreground font-display text-base px-4">
                      No developers yet. Be the first to join the leaderboard!
                    </div>
                  )
                  : leaderboard?.map((user, i) => {
                      const isTop3 = i < 3;
                      return (
                        <div
                          key={user.userId}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3.5 transition-colors",
                            i % 2 === 0 ? "bg-transparent" : "bg-black/10",
                          )}
                        >
                          {/* Rank icon */}
                          <div className="shrink-0 w-7 h-7 flex items-center justify-center">
                            {i === 0 ? <Trophy className="w-5 h-5 text-yellow-500" /> :
                             i === 1 ? <Medal className="w-5 h-5 text-gray-300" /> :
                             i === 2 ? <Award className="w-5 h-5 text-amber-600" /> :
                             <span className="font-mono text-xs text-muted-foreground font-medium">#{i + 1}</span>}
                          </div>
                          {/* Avatar + name */}
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            {isTop3 && (
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm shrink-0",
                                i === 0 ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/50"
                                  : i === 1 ? "bg-gray-300/20 text-gray-300 border border-gray-300/50"
                                  : "bg-amber-700/20 text-amber-600 border border-amber-700/50",
                              )}>
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className={cn(
                              "font-display font-semibold text-sm truncate",
                              i === 0 && "text-yellow-500",
                              i === 1 && "text-gray-300",
                              i === 2 && "text-amber-600",
                              i >= 3 && "text-foreground/90",
                            )}>
                              {user.username}
                            </span>
                          </div>
                          {/* Solved */}
                          <div className="shrink-0 text-right">
                            <div className={cn("font-mono font-bold text-base", isTop3 ? "text-primary" : "text-foreground")}>
                              {user.solvedCount}
                            </div>
                            <div className="text-[9px] text-muted-foreground uppercase tracking-widest">solved</div>
                          </div>
                        </div>
                      );
                    })}
              </div>

              {/* Desktop table (sm+) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black/20">
                    <tr className="border-b border-white/5">
                      <th className="w-24 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground h-12 px-4">Rank</th>
                      <th className="text-left font-mono text-xs uppercase tracking-widest text-muted-foreground h-12 px-2">Developer</th>
                      <th className="text-right font-mono text-xs uppercase tracking-widest text-muted-foreground h-12 px-4">Solved</th>
                      <th className="text-right font-mono text-xs uppercase tracking-widest text-muted-foreground h-12 pr-8">Submissions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading
                      ? Array.from({ length: 10 }).map((_, i) => (
                          <tr key={i} className="border-b border-white/5">
                            <td className="px-4 py-4"><Skeleton className="h-6 w-8 mx-auto bg-white/5" /></td>
                            <td className="px-2 py-4"><Skeleton className="h-6 w-32 bg-white/5" /></td>
                            <td className="px-4 py-4"><Skeleton className="h-6 w-12 ml-auto bg-white/5" /></td>
                            <td className="pr-8 py-4"><Skeleton className="h-6 w-12 ml-auto bg-white/5" /></td>
                          </tr>
                        ))
                      : leaderboard?.length === 0
                      ? (
                        <tr>
                          <td colSpan={4} className="h-40 text-center text-muted-foreground font-display text-lg">
                            No developers found. Be the first to join the leaderboard!
                          </td>
                        </tr>
                      )
                      : leaderboard?.map((user, i) => {
                          const isTop3 = i < 3;
                          return (
                            <tr
                              key={user.userId}
                              className={cn(
                                "group hover:bg-white/5 transition-colors border-b border-white/5",
                                i % 2 === 0 ? "bg-transparent" : "bg-black/10",
                              )}
                            >
                              <td className="text-center py-4 px-4">
                                {i === 0 ? <Trophy className="w-6 h-6 mx-auto text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" /> :
                                 i === 1 ? <Medal className="w-6 h-6 mx-auto text-gray-300 drop-shadow-[0_0_8px_rgba(209,213,219,0.5)]" /> :
                                 i === 2 ? <Award className="w-6 h-6 mx-auto text-amber-700 drop-shadow-[0_0_8px_rgba(180,83,9,0.5)]" /> :
                                 <span className="font-mono text-muted-foreground group-hover:text-foreground transition-colors font-medium">#{i + 1}</span>}
                              </td>
                              <td className="py-4 px-2">
                                <div className="flex items-center gap-4">
                                  {isTop3 && (
                                    <div className={cn(
                                      "w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-lg shadow-lg",
                                      i === 0 ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/50"
                                        : i === 1 ? "bg-gray-300/20 text-gray-300 border border-gray-300/50"
                                        : "bg-amber-700/20 text-amber-600 border border-amber-700/50",
                                    )}>
                                      {user.username.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <div className={cn(
                                    "font-display font-bold transition-colors truncate",
                                    isTop3 ? "text-base sm:text-xl" : "text-sm sm:text-lg text-foreground/90 group-hover:text-foreground",
                                    i === 0 && "text-yellow-500",
                                    i === 1 && "text-gray-300",
                                    i === 2 && "text-amber-600",
                                  )}>
                                    {user.username}
                                  </div>
                                </div>
                              </td>
                              <td className="text-right py-4 px-4">
                                <div className={cn("font-mono font-bold text-lg sm:text-xl", isTop3 ? "text-primary" : "text-foreground")}>
                                  {user.solvedCount}
                                </div>
                              </td>
                              <td className="text-right py-4 pr-8">
                                <span className="font-mono text-muted-foreground font-medium bg-black/30 px-3 py-1 rounded-md border border-white/5">
                                  {user.submissionCount}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
