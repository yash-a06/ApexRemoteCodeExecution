import { Router, type IRouter } from "express";
import { sql, desc, inArray } from "drizzle-orm";
import {
  db,
  usersTable,
  submissionsTable,
  problemsTable,
} from "@workspace/db";
import {
  GetPlatformStatsResponse,
  GetLeaderboardResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const CATEGORIES = ["trigger", "async_apex", "classes", "soql"] as const;
const DIFFICULTIES = ["easy", "medium", "hard"] as const;

router.get("/stats/platform", async (_req, res): Promise<void> => {
  const [problems, [submissionsCount], [usersCount]] = await Promise.all([
    db.select().from(problemsTable),
    db
      .select({ c: sql<number>`COUNT(*)::int` })
      .from(submissionsTable),
    db.select({ c: sql<number>`COUNT(*)::int` }).from(usersTable),
  ]);

  res.json(
    GetPlatformStatsResponse.parse({
      totalProblems: problems.length,
      totalSubmissions: submissionsCount?.c ?? 0,
      totalUsers: usersCount?.c ?? 0,
      byCategory: CATEGORIES.map((category) => ({
        category,
        count: problems.filter((p) => p.category === category).length,
      })),
      byDifficulty: DIFFICULTIES.map((difficulty) => ({
        difficulty,
        count: problems.filter((p) => p.difficulty === difficulty).length,
      })),
    }),
  );
});

router.get("/stats/leaderboard", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      userId: submissionsTable.userId,
      submissionCount: sql<number>`COUNT(*)::int`,
      solvedCount: sql<number>`COUNT(DISTINCT CASE WHEN ${submissionsTable.status} = 'accepted' THEN ${submissionsTable.problemSlug} END)::int`,
    })
    .from(submissionsTable)
    .groupBy(submissionsTable.userId)
    .orderBy(
      desc(
        sql<number>`COUNT(DISTINCT CASE WHEN ${submissionsTable.status} = 'accepted' THEN ${submissionsTable.problemSlug} END)`,
      ),
    )
    .limit(20);

  const userIds = rows.map((r) => r.userId);
  const users =
    userIds.length > 0
      ? await db
          .select()
          .from(usersTable)
          .where(inArray(usersTable.id, userIds))
      : [];
  const userMap = new Map(users.map((u) => [u.id, u.username]));

  const out = rows.map((r) => ({
    userId: r.userId,
    username: userMap.get(r.userId) ?? r.userId.slice(0, 8),
    solvedCount: r.solvedCount ?? 0,
    submissionCount: r.submissionCount ?? 0,
  }));

  res.json(GetLeaderboardResponse.parse(out));
});

export default router;
