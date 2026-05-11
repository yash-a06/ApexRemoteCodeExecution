import {
  pgTable,
  text,
  serial,
  integer,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";

export type ProblemCategory = "trigger" | "async_apex" | "classes" | "soql";
export type Difficulty = "easy" | "medium" | "hard";
export type ProblemKind =
  | "trigger"
  | "class"
  | "batch"
  | "queueable"
  | "schedulable"
  | "future"
  | "soql";

export interface TestSpec {
  name: string;
  description: string;
  hidden: boolean;
}

export const problemsTable = pgTable("problems", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  category: text("category").$type<ProblemCategory>().notNull(),
  difficulty: text("difficulty").$type<Difficulty>().notNull(),
  kind: text("kind").$type<ProblemKind>().notNull(),
  tags: text("tags").array().notNull().default([]),
  statement: text("statement").notNull(),
  hints: jsonb("hints").$type<string[]>().notNull().default([]),
  starterCode: text("starter_code").notNull(),
  tests: jsonb("tests").$type<TestSpec[]>().notNull().default([]),
  featuredOrder: integer("featured_order"),
  isPremium: boolean("is_premium").notNull().default(false),
});

export type Problem = typeof problemsTable.$inferSelect;
