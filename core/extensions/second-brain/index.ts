// Second Brain plugin entrypoint registers its OpenClaw integration.
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "second-brain",
  name: "Second Brain",
  description:
    "Imports ChatGPT, Claude.ai, and Gemini conversation exports into searchable OpenClaw memory.",
  register(api) {
    api.registerCli(
      async ({ program, config, workspaceDir }) => {
        const { registerSecondBrainCli } = await import("./cli.ts");
        registerSecondBrainCli(program, { config, workspaceDir });
      },
      {
        descriptors: [
          {
            name: "second-brain",
            description: "Import, list, and inspect second-brain conversation memory",
            hasSubcommands: true,
          },
        ],
      },
    );
  },
});
