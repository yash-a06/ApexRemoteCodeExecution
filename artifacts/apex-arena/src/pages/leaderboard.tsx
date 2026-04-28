import { PageWrapper } from "@/components/layout/page-wrapper";
import { useGetLeaderboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Medal, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard();

  return (
    <PageWrapper className="container max-w-screen-xl px-4 py-12 mx-auto">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-2">
            <Trophy className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">Hall of Fame</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The top Salesforce developers conquering the Arena.
          </p>
        </div>

        <Card className="border-border/50 overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardHeader className="bg-muted/30 border-b border-border/50">
            <CardTitle>Global Rankings</CardTitle>
            <CardDescription>Ranked by total solved problems.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-24 text-center">Rank</TableHead>
                  <TableHead>Developer</TableHead>
                  <TableHead className="text-right">Solved</TableHead>
                  <TableHead className="text-right">Submissions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-6 w-8 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-12 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-12 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : leaderboard?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                      No developers found. Be the first to join the leaderboard!
                    </TableCell>
                  </TableRow>
                ) : (
                  leaderboard?.map((user, i) => (
                    <TableRow key={user.userId} className="group hover:bg-muted/30 transition-colors">
                      <TableCell className="text-center font-medium">
                        {i === 0 ? <Trophy className="w-5 h-5 mx-auto text-yellow-500" /> :
                         i === 1 ? <Medal className="w-5 h-5 mx-auto text-gray-400" /> :
                         i === 2 ? <Award className="w-5 h-5 mx-auto text-amber-700" /> :
                         <span className="text-muted-foreground group-hover:text-foreground transition-colors">#{i + 1}</span>}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-lg">{user.username}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-bold text-lg text-primary">{user.solvedCount}</div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground font-medium">
                        {user.submissionCount}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
