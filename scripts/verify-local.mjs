import { spawn } from "node:child_process";
import { once } from "node:events";
import { existsSync } from "node:fs";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { MongoClient } from "mongodb";

let binary = process.env.MONGOD_PATH;
if (!binary && process.platform === "win32") {
  const root = path.join(
    process.env.ProgramFiles || "C:/Program Files",
    "MongoDB",
    "Server",
  );
  for (const version of (await readdir(root)).sort().reverse()) {
    const candidate = path.join(root, version, "bin", "mongod.exe");
    if (existsSync(candidate)) {
      binary = candidate;
      break;
    }
  }
}
if (!binary)
  throw new Error("Set MONGOD_PATH to an installed MongoDB server binary.");
const root = path.resolve("artifacts");
const { mkdir } = await import("node:fs/promises");
await mkdir(root, { recursive: true });
const storage = await mkdtemp(path.join(root, "verification-mongo-"));
const port = Number(process.env.VERIFY_MONGO_PORT || 27117);
const uri = `mongodb://127.0.0.1:${port}/?replicaSet=buildfest_verify`;
const mongo = spawn(
  binary,
  [
    "--dbpath",
    storage,
    "--port",
    String(port),
    "--bind_ip",
    "127.0.0.1",
    "--replSet",
    "buildfest_verify",
  ],
  { stdio: ["ignore", "ignore", "pipe"], windowsHide: true },
);
let errors = "",
  test;
mongo.stderr.on("data", (chunk) => {
  errors += chunk.toString();
});
const client = new MongoClient(
  `mongodb://127.0.0.1:${port}/?directConnection=true`,
  { serverSelectionTimeoutMS: 1000 },
);
try {
  let connected = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    if (mongo.exitCode !== null)
      throw new Error(`Isolated MongoDB failed to start: ${errors}`);
    try {
      await client.connect();
      connected = true;
      break;
    } catch {}
  }
  if (!connected) throw new Error("Isolated MongoDB did not become ready.");
  await client
    .db("admin")
    .command({
      replSetInitiate: {
        _id: "buildfest_verify",
        members: [{ _id: 0, host: `127.0.0.1:${port}` }],
      },
    });
  for (let attempt = 0; attempt < 60; attempt++) {
    if ((await client.db("admin").command({ hello: 1 })).isWritablePrimary)
      break;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  console.log(
    "Running HTTP and transaction tests on an isolated local MongoDB replica set.",
  );
  test = spawn(
    process.execPath,
    ["scripts/verify-workflow.mjs", ...process.argv.slice(2)],
    {
      stdio: "inherit",
      windowsHide: true,
      env: {
        ...process.env,
        MONGODB_URI: uri,
        MONGODB_DB: "buildfest_local_untouched",
        VERIFY_LOCAL_DATABASE: "1",
      },
    },
  );
  const [code] = await once(test, "exit");
  process.exitCode = code || 0;
} finally {
  await client.close();
  if (mongo.exitCode === null) {
    mongo.kill();
    await once(mongo, "exit");
  }
  if (
    !storage.startsWith(root + path.sep) ||
    !path.basename(storage).startsWith("verification-mongo-")
  )
    throw new Error(
      "Refusing to clean a path outside isolated verification storage.",
    );
  await rm(storage, { recursive: true, force: true });
}
