import { PageWrapper } from "@/components/layout/page-wrapper";
import { useGetLeaderboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Medal, Award, Crown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard();

  return (
    <PageWrapper className="container max-w-screen-xl px-4 py-10 sm:py-16 mx-auto">
      <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12">
        <div className="text-center space-y-4 sm:space-y-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="inline-flex items-center justify-center p-4 sm:p-5 bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 rounded-2xl mb-2 border border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.2)]"
          >
            <Crown className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-3xl xs:text-4xl sm:text-5xl font-extrabold tracking-tight font-display mb-3 sm:mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">Hall of Fame</h1>
            <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed px-2">
              The top Salesforce developers conquering the Arena. Rank up by solving more challenges.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-white/10 overflow-hidden bg-card/60 backdrop-blur-xl shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-gray-300 to-amber-700 opacity-80" />
            <CardHeader className="bg-secondary/30 border-b border-white/5 py-5 sm:py-6 px-5 sm:px-8">
              <CardTitle className="font-display text-xl sm:text-2xl">Global Rankings</CardTitle>
              <CardDescription className="text-xs sm:text-sm font-medium uppercase tracking-widest mt-1">Ranked by total solved problems</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-black/20">
                  <TableRow className="hover:bg-transparent border-white/5">
                    <TableHead className="w-16 sm:w-24 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground h-12">Rank</TableHead>
                    <TableHead className="font-mono text-xs uppercase tracking-widest text-muted-foreground h-12">Developer</TableHead>
                    <TableHead className="text-right font-mono text-xs uppercase tracking-widest text-muted-foreground h-12">Solved</TableHead>
                    <TableHead className="text-right font-mono text-xs uppercase tracking-widest text-muted-foreground h-12 pr-4 sm:pr-8 hidden sm:table-cell">Submissions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <TableRow key={i} className="border-white/5">
                        <TableCell><Skeleton className="h-6 w-8 mx-auto bg-white/5" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-32 bg-white/5" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-12 ml-auto bg-white/5" /></TableCell>
                        <TableCell className="pr-8"><Skeleton className="h-6 w-12 ml-auto bg-white/5" /></TableCell>
                      </TableRow>
                    ))
                  ) : leaderboard?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-40 text-center text-muted-foreground font-display text-lg">
                        No developers found. Be the first to join the leaderboard!
                      </TableCell>
                    </TableRow>
                  ) : (
                    leaderboard?.map((user, i) => {
                      const isTop3 = i < 3;
                      return (
                        <TableRow 
                          key={user.userId} 
                          className={cn(
                            "group hover:bg-white/5 transition-colors border-white/5",
                            i % 2 === 0 ? "bg-transparent" : "bg-black/10"
                          )}
                        >
                          <TableCell className="text-center py-4">
                            {i === 0 ? <Trophy className="w-6 h-6 mx-auto text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" /> :
                             i === 1 ? <Medal className="w-6 h-6 mx-auto text-gray-300 drop-shadow-[0_0_8px_rgba(209,213,219,0.5)]" /> :
                             i === 2 ? <Award className="w-6 h-6 mx-auto text-amber-700 drop-shadow-[0_0_8px_rgba(180,83,9,0.5)]" /> :
                             <span className="font-mono text-muted-foreground group-hover:text-foreground transition-colors font-medium">#{i + 1}</span>}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-4">
                              {isTop3 && (
                                <div className={cn(
                                  "w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-lg shadow-lg",
                                  i === 0 ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/50" :
                                  i === 1 ? "bg-gray-300/20 text-gray-300 border border-gray-300/50" :
                                  "bg-amber-700/20 text-amber-600 border border-amber-700/50"
                                )}>
                                  {user.username.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className={cn(
                                "font-display font-bold transition-colors truncate",
                                isTop3 ? "text-base sm:text-xl" : "text-sm sm:text-lg text-foreground/90 group-hover:text-foreground",
                                i === 0 && "text-yellow-500",
                                i === 1 && "text-gray-300",
                                i === 2 && "text-amber-600"
                              )}>
                                {user.username}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-4">
                            <div className={cn(
                              "font-mono font-bold text-lg sm:text-xl",
                              isTop3 ? "text-primary" : "text-foreground"
                            )}>{user.solvedCount}</div>
                          </TableCell>
                          <TableCell className="text-right py-4 pr-4 sm:pr-8 hidden sm:table-cell">
                            <span className="font-mono text-muted-foreground font-medium bg-black/30 px-3 py-1 rounded-md border border-white/5">
                              {user.submissionCount}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
