import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

try {
  process.loadEnvFile(".env.local");
} catch {
  /* Deployed environment variables may be used instead. */
}
if (!process.env.MONGODB_URI)
  throw new Error("Set MONGODB_URI in .env.local or your environment first.");
const rl = readline.createInterface({ input: stdin, output: stdout });
const email = (await rl.question("Organizer email: ")).trim().toLowerCase();
const name = (await rl.question("Organizer name: ")).trim();
rl.close();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || name.length < 2)
  throw new Error("Enter a valid organizer email and name.");
if (!stdin.isTTY)
  throw new Error(
    "Run this command in an interactive terminal to securely enter the password.",
  );
stdout.write("Password (at least 12 characters): ");
const password = await new Promise((resolve) => {
  let value = "";
  stdin.setRawMode(true);
  stdin.resume();
  const handler = (chunk) => {
    for (const char of chunk.toString()) {
      if (char === "\u0003") {
        stdin.setRawMode(false);
        process.exit(130);
      }
      if (char === "\r" || char === "\n") {
        stdin.off("data", handler);
        stdin.setRawMode(false);
        stdin.pause();
        stdout.write("\n");
        resolve(value);
        return;
      }
      if (char === "\u007f" || char === "\b") {
        if (value) {
          value = value.slice(0, -1);
          stdout.write("\b \b");
        }
      } else if (char >= " ") {
        value += char;
        stdout.write("*");
      }
    }
  };
  stdin.on("data", handler);
});
if (password.length < 12 || Buffer.byteLength(password) > 72)
  throw new Error("Use at least 12 characters, up to 72 bytes.");
const client = new MongoClient(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 8000,
});
try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "buildfest2026");
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  if (await db.collection("users").findOne({ email }))
    throw new Error(
      "This email already has an account. Choose a unique organizer email.",
    );
  const adminId = new ObjectId();
  await db
    .collection("users")
    .insertOne({
      _id: adminId,
      email,
      name,
      passwordHash: await bcrypt.hash(password, 12),
      role: "admin",
      disabled: false,
      createdAt: new Date(),
    });
  await db
    .collection("audit")
    .insertOne({
      actorId: adminId,
      action: "admin_provisioned_from_cli",
      createdAt: new Date(),
    });
  stdout.write(
    `Organizer account created for ${email}. Sign in at /login?role=admin.\n`,
  );
} finally {
  await client.close();
}
