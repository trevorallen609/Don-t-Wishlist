"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createSession,
  destroySession,
  hashPassword,
  requireUser,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseCandidateLines, parseCandidates } from "@/lib/parse";
import { loadEngineContext } from "@/lib/queries";
import { maybeEnrichWithLlm, runRefusalEngine } from "@/lib/refusal-engine";
import type { ActionState } from "@/lib/result";
import {
  addGameInputSchema,
  credentialsSchema,
  verdictKindSchema,
} from "@/lib/schemas";
import { SAMPLE_LIBRARY } from "@/mocks/sample-library";

export type { ActionState };

export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Valid email and password (6+ chars) required." };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) return { error: "Account already exists. Log in instead." };

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
    },
  });
  await createSession(user.id, user.email);
  redirect("/library");
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Valid email and password required." };

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Invalid email or password." };
  }
  await createSession(user.id, user.email);
  redirect("/library");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function addGameAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!user) return { error: "Not signed in." };

  const parsed = addGameInputSchema.safeParse({
    title: formData.get("title"),
    status: formData.get("status"),
    hoursPlayed: formData.get("hoursPlayed") ?? "",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return { error: "Check title, status, and hours." };

  await prisma.game.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      status: parsed.data.status,
      hoursPlayed: parsed.data.hoursPlayed,
      notes: parsed.data.notes,
    },
  });
  revalidatePath("/library");
  return { ok: true };
}

export async function deleteGameAction(gameId: string) {
  const user = await requireUser();
  if (!user) return;
  await prisma.game.deleteMany({ where: { id: gameId, userId: user.id } });
  revalidatePath("/library");
}

/** Seeds from `src/mocks/sample-library.ts` — static file, not live Steam. */
export async function seedSampleLibraryAction() {
  const user = await requireUser();
  if (!user) redirect("/login");

  const count = await prisma.game.count({ where: { userId: user.id } });
  if (count === 0) {
    await prisma.game.createMany({
      data: SAMPLE_LIBRARY.map((g) => ({
        userId: user.id,
        title: g.title,
        status: g.status,
        hoursPlayed: g.hoursPlayed ?? null,
        notes: g.notes ?? null,
      })),
    });
  }

  revalidatePath("/library");
  redirect("/library");
}

export async function runSaleCheckAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!user) return { error: "Not signed in." };

  const candidatesResult = parseCandidateLines(String(formData.get("candidates") ?? ""));
  if (!candidatesResult.ok) return { error: candidatesResult.error };

  const { games, verdicts } = await loadEngineContext(user.id);
  let result = runRefusalEngine(games, candidatesResult.value, verdicts);
  result = await maybeEnrichWithLlm(result);

  const check = await prisma.saleCheck.create({
    data: {
      userId: user.id,
      candidates: JSON.stringify(candidatesResult.value),
      result: JSON.stringify(result),
    },
  });

  redirect(`/checks/${check.id}`);
}

export async function submitVerdictAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!user) return { error: "Not signed in." };

  const saleCheckId = String(formData.get("saleCheckId") ?? "");
  const itemTitle = String(formData.get("itemTitle") ?? "").trim();
  const verdictParsed = verdictKindSchema.safeParse(formData.get("verdict"));

  if (!saleCheckId || !itemTitle || !verdictParsed.success) {
    return { error: "Invalid verdict." };
  }

  const check = await prisma.saleCheck.findFirst({
    where: { id: saleCheckId, userId: user.id },
    select: { id: true },
  });
  if (!check) return { error: "Sale check not found." };

  await prisma.verdict.create({
    data: {
      saleCheckId,
      itemTitle,
      verdict: verdictParsed.data,
    },
  });

  revalidatePath(`/checks/${saleCheckId}`);
  revalidatePath("/checks");
  return { ok: true };
}

export async function regenerateSaleCheckAction(saleCheckId: string) {
  const user = await requireUser();
  if (!user) redirect("/login");

  const check = await prisma.saleCheck.findFirst({
    where: { id: saleCheckId, userId: user.id },
  });
  if (!check) redirect("/checks");

  const candidatesResult = parseCandidates(check.candidates);
  if (!candidatesResult.ok) redirect("/checks");

  const { games, verdicts } = await loadEngineContext(user.id);
  let result = runRefusalEngine(games, candidatesResult.value, verdicts);
  result = await maybeEnrichWithLlm(result);

  const next = await prisma.saleCheck.create({
    data: {
      userId: user.id,
      candidates: JSON.stringify(candidatesResult.value),
      result: JSON.stringify(result),
    },
  });

  redirect(`/checks/${next.id}`);
}
