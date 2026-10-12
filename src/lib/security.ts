import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { collections } from "./db";
import type { Role, UserDoc } from "./types";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const randomToken = () => randomBytes(32).toString("base64url");
export const id = (value: string) => {
  if (!/^[a-f\d]{24}$/i.test(value))
    throw new HttpError(400, "Invalid identifier.");
  return new ObjectId(value);
};
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const allowed = new Set([new URL(request.url).origin]);
  if (process.env.APP_URL) allowed.add(new URL(process.env.APP_URL).origin);
  if (!origin || !allowed.has(origin))
    throw new HttpError(
      403,
      "This request must come from the BuildFest website.",
    );
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 4_000_000)
    throw new HttpError(413, "Uploads must be smaller than 3 MB.");
}
export async function rateLimit(
  request: Request,
  scope: string,
  max = 30,
  minutes = 15,
  identity?: string,
) {
  const { rateLimits } = await collections();
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";
  const window = Math.floor(Date.now() / (minutes * 60_000));
  const key = hash(`${scope}:${identity || ip}:${window}`);
  try {
    const row = await rateLimits.findOneAndUpdate(
      { key },
      {
        $inc: { count: 1 },
        $setOnInsert: { expiresAt: new Date((window + 2) * minutes * 60_000) },
      },
      { upsert: true, returnDocument: "after" },
    );
    if ((row?.count || 0) > max)
      throw new HttpError(
        429,
        "Too many attempts. Please try again in a few minutes.",
      );
  } catch (error) {
    if ((error as { code?: number }).code === 11000)
      throw new HttpError(429, "Please try again shortly.");
    throw error;
  }
}
export async function currentUser(): Promise<UserDoc | null> {
  const token = (await cookies()).get("bf_session")?.value;
  if (!token || token.length > 100) return null;
  const c = await collections();
  const session = await c.sessions.findOne({
    tokenHash: hash(token),
    expiresAt: { $gt: new Date() },
  });
  if (!session) return null;
  return c.users.findOne({ _id: session.userId, disabled: false });
}
export async function authorize(roles?: Role[]) {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Sign in to continue.");
  if (roles && !roles.includes(user.role))
    throw new HttpError(403, "You don't have access to this action.");
  return user;
}
export async function newSession(userId: ObjectId) {
  const c = await collections();
  const token = randomToken();
  await c.sessions.insertOne({
    _id: new ObjectId(),
    tokenHash: hash(token),
    userId,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 86400_000),
  });
  (await cookies()).set("bf_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 86400,
  });
}
export async function logout() {
  const store = await cookies();
  const token = store.get("bf_session")?.value;
  if (token)
    await (await collections()).sessions.deleteOne({ tokenHash: hash(token) });
  store.delete("bf_session");
}
export function apiError(error: unknown) {
  if (error instanceof ZodError)
    return NextResponse.json(
      {
        error: error.issues[0]?.message || "Check your form.",
        fields: Object.fromEntries(
          error.issues.map((i) => [i.path.join("."), i.message]),
        ),
      },
      { status: 400 },
    );
  if (error instanceof HttpError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  if ((error as { code?: number }).code === 11000)
    return NextResponse.json(
      {
        error:
          "This team name, participant email, or transaction reference is already registered. Sign in to your existing team or contact the organizer.",
      },
      { status: 409 },
    );
  // Never return database errors or credentials to the browser.
  console.error(
    "BuildFest request failed:",
    error instanceof Error ? error.name : "UnknownError",
  );
  return NextResponse.json(
    {
      error:
        "We couldn't complete that request. Please try again shortly. Your form data is safe.",
    },
    { status: 503 },
  );
}
export const json = (data: unknown, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
