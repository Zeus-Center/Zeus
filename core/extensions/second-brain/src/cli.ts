// Second Brain plugin CLI: `openclaw second-brain import|list`.
import os from "node:os";
import path from "node:path";
import type { Command } from "commander";
import type { OpenClawConfig } from "openclaw/plugin-sdk/plugin-entry";
import { importSecondBrainSource, listSecondBrainSources } from "./import-conversations.ts";
import type { ImportReport, SecondBrainSourceId } from "./types.ts";
import { SECOND_BRAIN_SOURCE_IDS, SECOND_BRAIN_SOURCE_LABELS, isSecondBrainSourceId } from "./types.ts";

const DEFAULT_WORKSPACE = path.join(os.homedir(), ".openclaw", "workspace");

type SecondBrainImportCliOptions = {
  from?: string;
  agent?: string;
  workspace?: string;
  overwrite?: boolean;
  dryRun?: boolean;
  maxFiles?: string;
  json?: boolean;
};

function resolveWorkspaceDir(
  config: OpenClawConfig | undefined,
  opts: SecondBrainImportCliOptions,
  workspaceDir?: string,
): string {
  if (opts.workspace) {
    return path.resolve(opts.workspace);
  }
  if (workspaceDir) {
    return path.resolve(workspaceDir);
  }
  const list = config?.agents?.list ?? [];
  const entries = config?.agents?.entries ?? {};
  const entryFor = (agentId: string) => {
    const fromList = list.find((entry) => entry.id === agentId);
    const fromEntries = entries[agentId];
    return fromList?.workspace ?? (fromEntries && "workspace" in fromEntries ? fromEntries.workspace : undefined);
  };
  if (opts.agent) {
    const resolved = entryFor(opts.agent);
    if (resolved) {
      return path.resolve(resolved);
    }
  }
  const defaultAgent = list.find((entry) => entry.default === true) ?? list[0];
  const defaultWorkspace = defaultAgent?.workspace ?? (defaultAgent ? entryFor(defaultAgent.id) : undefined);
  return defaultWorkspace ? path.resolve(defaultWorkspace) : DEFAULT_WORKSPACE;
}

function printImportReport(report: ImportReport, json: boolean, dryRun: boolean): void {
  if (json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }
  const label = SECOND_BRAIN_SOURCE_LABELS[report.source];
  console.log(`\n${dryRun ? "Dry run" : "Import"} complete for ${label}:`);
  console.log(`  created : ${report.created}`);
  console.log(`  skipped : ${report.skipped}`);
  console.log(`  errors  : ${report.errors}`);
  if (report.redactions > 0) {
    console.log(`  redacted secrets: ${report.redactions}`);
  }
  for (const file of report.files) {
    if (file.status === "created") {
      console.log(`  + ${file.relativePath} (${file.messageCount} messages)`);
    } else if (file.status === "skipped") {
      console.log(`  = ${file.relativePath} (${file.reason ?? "skipped"})`);
    } else if (file.status === "error") {
      console.log(`  ! ${file.relativePath || "(warning)"}: ${file.reason ?? "error"}`);
    }
  }
  console.log("");
}

async function runImport(
  config: OpenClawConfig | undefined,
  workspaceDir: string | undefined,
  sourceArg: string,
  opts: SecondBrainImportCliOptions,
): Promise<void> {
  if (!isSecondBrainSourceId(sourceArg)) {
    throw new Error(
      `Unknown source "${sourceArg}". Expected one of: ${SECOND_BRAIN_SOURCE_IDS.join(", ")}.`,
    );
  }
  if (!opts.from) {
    throw new Error("--from <path> is required (the export file or directory).");
  }
  const resolvedWorkspace = resolveWorkspaceDir(config, opts, workspaceDir);
  const importsRoot = path.join(resolvedWorkspace, "memory", "imports");
  const maxFiles = opts.maxFiles ? Number.parseInt(opts.maxFiles, 10) : undefined;
  if (maxFiles !== undefined && (!Number.isFinite(maxFiles) || maxFiles < 1)) {
    throw new Error("--max-files must be a positive integer.");
  }
  const report = await importSecondBrainSource({
    source: sourceArg as SecondBrainSourceId,
    from: path.resolve(opts.from),
    importsRoot,
    overwrite: opts.overwrite === true,
    dryRun: opts.dryRun === true,
    maxFiles,
  });
  printImportReport(report, opts.json === true, opts.dryRun === true);
}

async function runList(
  config: OpenClawConfig | undefined,
  workspaceDir: string | undefined,
  opts: SecondBrainImportCliOptions,
): Promise<void> {
  const resolvedWorkspace = resolveWorkspaceDir(config, opts, workspaceDir);
  const importsRoot = path.join(resolvedWorkspace, "memory", "imports");
  const sources = await listSecondBrainSources(importsRoot);
  if (opts.json) {
    process.stdout.write(`${JSON.stringify({ importsRoot, sources }, null, 2)}\n`);
    return;
  }
  console.log(`\nSecond Brain imports at ${importsRoot}\n`);
  if (sources.length === 0) {
    console.log("No second-brain imports found yet. Run `openclaw second-brain import --help`.\n");
    return;
  }
  for (const entry of sources) {
    const label = SECOND_BRAIN_SOURCE_LABELS[entry.source];
    console.log(`  ${label.padEnd(10)} ${String(entry.files).padStart(6)} files  ${entry.bytes} bytes`);
  }
  console.log("");
}

export function registerSecondBrainCli(program: Command, context?: {
  config?: OpenClawConfig;
  workspaceDir?: string;
}): void {
  const config = context?.config;
  const workspaceDir = context?.workspaceDir;

  const secondBrain = program
    .command("second-brain")
    .description("Import, list, and inspect second-brain conversation memory")
    .addHelpText(
      "after",
      () =>
        `\nExamples:\n` +
        `  $ openclaw second-brain import chatgpt --from ~/Downloads/conversations.json\n` +
        `  $ openclaw second-brain import claude-ai --from ~/Downloads/claude-export/\n` +
        `  $ openclaw second-brain import gemini --from ~/Downloads/Takeout/Gemini/\n` +
        `  $ openclaw second-brain list\n`,
    );

  secondBrain
    .command("import")
    .description("Import conversations from a ChatGPT, Claude.ai, or Gemini export")
    .argument("<source>", "chatgpt | claude-ai | gemini")
    .requiredOption("--from <path>", "export file or directory")
    .option("--agent <id>", "destination agent id (defaults to the default agent)")
    .option("--workspace <dir>", "destination agent workspace directory")
    .option("--overwrite", "replace already-imported conversations")
    .option("--dry-run", "normalize and report without writing files")
    .option("--max-files <n>", "safety cap on imported conversations")
    .option("--json", "print a machine-readable JSON report")
    .action(async (sourceArg: string, opts: SecondBrainImportCliOptions) => {
      try {
        await runImport(config, workspaceDir, sourceArg, opts);
      } catch (error) {
        process.stderr.write(
          `second-brain import failed: ${error instanceof Error ? error.message : String(error)}\n`,
        );
        process.exitCode = 1;
      }
    });

  secondBrain
    .command("list")
    .description("List imported second-brain sources and file counts")
    .option("--agent <id>", "agent id (defaults to the default agent)")
    .option("--workspace <dir>", "agent workspace directory")
    .option("--json", "print a machine-readable JSON report")
    .action(async (opts: SecondBrainImportCliOptions) => {
      try {
        await runList(config, workspaceDir, opts);
      } catch (error) {
        process.stderr.write(
          `second-brain list failed: ${error instanceof Error ? error.message : String(error)}\n`,
        );
        process.exitCode = 1;
      }
    });
}

