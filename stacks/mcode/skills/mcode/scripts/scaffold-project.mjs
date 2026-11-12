#!/usr/bin/env node
// mcode 新项目配置脚手架 —— 确定性部分，秒级、零 token。
//
// 用法：
//   node scripts/scaffold-project.mjs [--cwd <dir>] [--force] [--dry-run]
//
// 做三件事：
//   1. 探测项目（技术栈 / 构建命令 / 已有 AGENTS.md 与验证入口）
//   2. 生成或校准 AGENTS.md、唯一验收入口（verify.ps1 / verify.sh）
//   3. 建 docs/requirements/ 骨架（README + REQ 模板）
//
// 幂等：已存在的文件不覆盖，除非 --force；跳过的项写进输出的 JSON 摘要。

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATES = join(HERE, "..", "templates");

const args = process.argv.slice(2);
const argOf = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const cwd = resolve(argOf("--cwd") ?? process.cwd());
const force = args.includes("--force");
const dryRun = args.includes("--dry-run");

const read = (p) => readFileSync(p, "utf8");
const fill = (tpl, vars) =>
  tpl.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, k) => (k in vars ? vars[k] : ""));

function probe(root) {
  const p = { root, type: null, name: null, build: null, dev: null, test: null, deps: [], notes: [] };

  const pkgPath = join(root, "package.json");
  if (existsSync(pkgPath)) {
    let pkg = null;
    try {
      pkg = JSON.parse(read(pkgPath));
    } catch {
      p.notes.push("package.json 解析失败，跳过 Node 探测");
    }
    if (pkg) {
      p.type = "node";
      p.name = pkg.name ?? null;
      const s = pkg.scripts ?? {};
      if (s.build) p.build = "npm run build";
      if (s.dev) p.dev = "npm run dev";
      if (s.test) p.test = "npm test";
      else if (s["test:unit"]) p.test = "npm run test:unit";
      p.deps = Object.keys(pkg.dependencies ?? {}).slice(0, 12);
    }
  }

  let entries = [];
  try {
    entries = readdirSync(root);
  } catch {
    return p;
  }
  const csproj = entries.find((f) => f.endsWith(".csproj"));
  if (csproj && !p.type) {
    p.type = "dotnet";
    p.name ??= csproj.replace(/\.csproj$/, "");
    p.build ??= `dotnet build ${csproj}`;
    p.test ??= "dotnet test";
  }
  if (existsSync(join(root, "go.mod")) && !p.type) {
    p.type = "go";
    p.build ??= "go build ./...";
    p.test ??= "go test ./...";
  }
  if ((existsSync(join(root, "pyproject.toml")) || existsSync(join(root, "requirements.txt"))) && !p.type) {
    p.type = "python";
    p.test ??= "pytest";
  }
  if (!p.type) p.notes.push("未识别到技术栈，AGENTS.md 的构建命令留空待填");
  return p;
}

const outputs = [];
function write(rel, content, { overwrite = false } = {}) {
  const target = join(cwd, rel);
  const existed = existsSync(target);
  if (existed && !overwrite && !force) {
    outputs.push({ file: rel, action: "skipped", reason: "已存在（加 --force 覆盖）" });
    return;
  }
  if (!dryRun) {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content, "utf8");
  }
  outputs.push({ file: rel, action: existed ? "updated" : "created" });
}

const p = probe(cwd);
const projectName = p.name ?? "（未命名项目）";
const verifyCmd = process.platform === "win32" ? "pwsh -File verify.ps1" : "bash verify.sh";

// AGENTS.md
const agentsVars = {
  PROJECT_NAME: projectName,
  STACK: p.type ?? "未识别",
  BUILD_CMD: p.build ?? "（待填）",
  DEV_CMD: p.dev ?? "（待填）",
  TEST_CMD: p.test ?? "（待填）",
  VERIFY_CMD: verifyCmd,
};
write("AGENTS.md", fill(read(join(TEMPLATES, "AGENTS.md.tmpl")), agentsVars));

// 唯一验收入口
const verifyVars = {
  PROJECT_NAME: projectName,
  BUILD_LINE: p.build ?? "",
  TEST_LINE: p.test ?? "",
};
const verifyFile = process.platform === "win32" ? "verify.ps1" : "verify.sh";
const verifyTpl = process.platform === "win32" ? "verify.ps1.tmpl" : "verify.sh.tmpl";
write(verifyFile, fill(read(join(TEMPLATES, verifyTpl)), verifyVars));

// 需求文档骨架
write("docs/requirements/README.md", fill(read(join(TEMPLATES, "requirements-README.md.tmpl")), agentsVars));
write("docs/requirements/REQ-000-template.md", fill(read(join(TEMPLATES, "REQ.md.tmpl")), agentsVars));

const summary = {
  ok: true,
  dryRun,
  cwd,
  detected: { type: p.type, name: p.name, build: p.build, dev: p.dev, test: p.test, deps: p.deps },
  notes: p.notes,
  files: outputs,
  next: "读 AGENTS.md 的「硬规则」段补齐本项目专属规则；确认后把 verify 入口跑通一次。",
};
console.log(JSON.stringify(summary, null, 2));
