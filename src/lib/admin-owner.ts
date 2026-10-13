import "server-only";
import { ObjectId } from "mongodb";
import { collections } from "./db";
import type { UserDoc } from "./types";

export function configuredAdminOwner() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const storedHash = process.env.ADMIN_PASSWORD_HASH?.trim();
  // The encoded form keeps bcrypt's dollar signs intact in Next.js .env parsing.
  const passwordHash = storedHash?.startsWith("bcrypt:")
    ? Buffer.from(storedHash.slice(7), "base64url").toString("utf8")
    : storedHash;
  if (!email && !passwordHash) return null;
  // A partially configured owner must fail closed instead of restoring legacy access.
  if (
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !passwordHash ||
    !/^\$2[aby]\$12\$[./A-Za-z0-9]{53}$/.test(passwordHash)
  )
    throw new Error("ADMIN_OWNER_CONFIGURATION_INVALID");
  return { email, passwordHash };
}

export function adminOwnerAllowed(user: UserDoc) {
  if (user.role !== "admin") return true;
  const owner = configuredAdminOwner();
  return (
    !owner ||
    (user.email === owner.email && user.passwordHash === owner.passwordHash)
  );
}

// Only a successful comparison against the server's owner secret calls this.
// Existing participant/judge accounts are never promoted to admin automatically.
export async function provisionAdminOwner(
  owner: NonNullable<ReturnType<typeof configuredAdminOwner>>,
): Promise<UserDoc> {
  const c = await collections();
  const session = c.client.startSession();
  let user: UserDoc | null = null;
  try {
    await session.withTransaction(async () => {
      const existing = await c.users.findOne(
        { email: owner.email },
        { session },
      );
      if (existing && existing.role !== "admin")
        throw new Error("ADMIN_OWNER_EMAIL_CONFLICT");
      if (
        existing &&
        existing.passwordHash === owner.passwordHash &&
        !existing.disabled
      ) {
        user = existing;
        return;
      }
      user = existing
        ? { ...existing, passwordHash: owner.passwordHash, disabled: false }
        : {
            _id: new ObjectId(),
            email: owner.email,
            name: "BuildFest Organizer",
            passwordHash: owner.passwordHash,
            role: "admin",
            disabled: false,
            createdAt: new Date(),
          };
      if (existing) {
        await c.users.updateOne(
          { _id: existing._id },
          { $set: { passwordHash: owner.passwordHash, disabled: false } },
          { session },
        );
        await c.sessions.deleteMany({ userId: existing._id }, { session });
      } else await c.users.insertOne(user, { session });
      await c.audit.insertOne(
        {
          actorId: user._id,
          action: existing
            ? "owner_admin_credentials_rotated"
            : "owner_admin_provisioned",
          createdAt: new Date(),
        },
        { session },
      );
    });
  } catch (error) {
    // Two first sign-ins may race on the unique email index.
    if ((error as { code?: number }).code !== 11000) throw error;
    user = await c.users.findOne({
      email: owner.email,
      role: "admin",
      disabled: false,
      passwordHash: owner.passwordHash,
    });
    if (!user) throw error;
  } finally {
    await session.endSession();
  }
  if (!user) throw new Error("ADMIN_OWNER_UNAVAILABLE");
  return user;
}
