import { z } from "zod";

export const gameStatusSchema = z.enum(["playing", "finished", "abandoned"]);
export const verdictKindSchema = z.enum(["correct", "wrong", "too_safe"]);

export const credentialsSchema = z.object({
  email: z.string().trim().email().transform((e) => e.toLowerCase()),
  password: z.string().min(6).max(128),
});

export const libraryGameSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: gameStatusSchema,
  hoursPlayed: z.number().nonnegative().nullable(),
  notes: z.string().nullable(),
});

export const saleCandidateSchema = z.object({
  title: z.string().min(1),
  price: z.number().nonnegative().optional(),
  note: z.string().optional(),
});

export const scoreContributionSchema = z.object({
  code: z.string(),
  label: z.string(),
  weight: z.number(),
});

export const refusalItemSchema = z.object({
  title: z.string(),
  reason: z.string(),
  signals: z.array(z.string()),
  refuseScore: z.number(),
  ledger: z.array(scoreContributionSchema),
});

export const saleResultSchema = z.object({
  hardNos: z.array(refusalItemSchema),
  reluctantYes: refusalItemSchema.nullable(),
  buyNothing: z.boolean(),
  summary: z.string(),
  engine: z.enum(["rules", "rules+llm"]),
  dollarsRefused: z.number().nonnegative(),
  inputFingerprint: z.string().min(8),
  scoredAt: z.string().datetime(),
});

export const addGameInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  status: gameStatusSchema,
  hoursPlayed: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? Number(v) : null))
    .pipe(z.number().nonnegative().nullable()),
  notes: z
    .string()
    .trim()
    .max(280)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type GameStatus = z.infer<typeof gameStatusSchema>;
export type VerdictKind = z.infer<typeof verdictKindSchema>;
export type LibraryGame = z.infer<typeof libraryGameSchema>;
export type SaleCandidate = z.infer<typeof saleCandidateSchema>;
export type ScoreContribution = z.infer<typeof scoreContributionSchema>;
export type RefusalItem = z.infer<typeof refusalItemSchema>;
export type SaleResult = z.infer<typeof saleResultSchema>;
