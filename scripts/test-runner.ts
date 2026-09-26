import { run } from "node:test";
import { spec } from "node:test/reporters";
import fs from "node:fs";
import path from "node:path";

const testsDir = path.resolve(process.cwd(), "tests");
const testFiles = fs
  .readdirSync(testsDir)
  .filter((f) => f.endsWith(".test.ts"))
  .map((f) => path.join(testsDir, f));

const filterArg = process.argv.slice(2).join(" ");
const filteredFiles = filterArg
  ? testFiles.filter((f) => f.toLowerCase().includes(filterArg.toLowerCase()))
  : testFiles;

if (filteredFiles.length === 0) {
  console.error("No test files found matching criteria:", filterArg);
  process.exit(1);
}

run({ files: filteredFiles })
  .on("test:fail", () => {
    process.exitCode = 1;
  })
  .compose(new spec())
  .pipe(process.stdout);
