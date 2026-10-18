const esbuild = require("esbuild");
const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");

const output = path.join(__dirname, "..", "node_modules", ".cache", `sofia-redis-test-${process.pid}.cjs`);
try {
  esbuild.buildSync({ entryPoints: [path.join(__dirname, "redisStorage.test.ts")],
    bundle: true, platform: "node", packages: "external", target: "node18", outfile: output });
  const result = childProcess.spawnSync(process.execPath, ["--test", output], { stdio: "inherit" });
  process.exitCode = result.status === null ? 1 : result.status;
} finally {
  if (fs.existsSync(output)) fs.unlinkSync(output);
}
