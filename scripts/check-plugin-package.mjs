#!/usr/bin/env node
// Parses a stack's MiniMax plugin package with the same reader MiniMax Code
// uses, so a manifest change that the runtime would reject fails here first.
//
// Usage: node scripts/check-plugin-package.mjs <plugin-root> [<plugin-root> ...]
// Requires MINIMAX_CODE_DIR to point at a MiniMax Code checkout or app.asar
// whose dist/service/plugin-system modules can be loaded.

import { existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const roots = process.argv.slice(2);
if (roots.length === 0) {
  console.error("usage: node scripts/check-plugin-package.mjs <plugin-root> [...]");
  process.exit(2);
}

const readerModule = process.env.PLUGIN_READER_MODULE;
if (!readerModule || !existsSync(readerModule)) {
  console.error("note: PLUGIN_READER_MODULE not set, skipping the runtime package parser.");
  process.exit(0);
}

const { readMiniMaxPluginPackage } = await import(pathToFileURL(readerModule).href);

let failed = 0;
for (const root of roots) {
  try {
    const plugin = await readMiniMaxPluginPackage(root, { source: "LOCAL_MINIMAX" });
    const diagnostics = plugin.diagnostics ?? [];
    if (diagnostics.length > 0) {
      failed += 1;
      console.error(`error: ${root}: ${diagnostics.length} diagnostic(s): ${JSON.stringify(diagnostics)}`);
      continue;
    }
    const agents = plugin.agents ?? [];
    console.log(
      `ok: ${root} -> ${plugin.name} ${plugin.version} skills=${plugin.skills.length} agents=${agents.length}`,
    );
    for (const agent of agents) {
      console.log(`   ${agent.scopedName} model=${agent.model ?? "(inherit)"} display=${agent.displayName ?? "-"}`);
    }
  } catch (error) {
    failed += 1;
    console.error(`error: ${root}: ${error.code ?? ""} ${error.message}`);
  }
}

if (failed > 0) {
  console.error(`check-plugin-package: ${failed} package(s) failed.`);
  process.exit(1);
}
console.log(`check-plugin-package: ${roots.length} package(s) passed.`);
