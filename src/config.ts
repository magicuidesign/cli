import os from "node:os";
import path from "node:path";
import type { ValidClient, VscodeClientConfig, McpServersClientConfig } from "./types.js";

const homeDir = os.homedir();

const platformBaseDirs = {
  win32: process.env.APPDATA || path.join(homeDir, "AppData", "Roaming"),
  darwin: path.join(homeDir, "Library", "Application Support"),
  linux: process.env.XDG_CONFIG_HOME || path.join(homeDir, ".config"),
};

const baseDir = platformBaseDirs[process.platform as keyof typeof platformBaseDirs];
const vscodePath = path.join("Code", "User", "globalStorage");

export const clientPaths: Record<string, string> = {
  codex: path.join(
    process.env.CODEX_HOME || path.join(homeDir, ".codex"),
    "config.toml",
  ),
  claude: path.join(baseDir, "Claude", "claude_desktop_config.json"),
  cline: path.join(
    baseDir,
    vscodePath,
    "saoudrizwan.claude-dev",
    "settings",
    "cline_mcp_settings.json",
  ),
  "roo-cline": path.join(
    baseDir,
    vscodePath,
    "rooveterinaryinc.roo-cline",
    "settings",
    "cline_mcp_settings.json",
  ),
  windsurf: path.join(homeDir, ".codeium", "windsurf", "mcp_config.json"),
  cursor: path.join(homeDir, ".cursor", "mcp.json"),
  vscode: path.join(baseDir, "Code", "User", "mcp.json"),
  antigravity: path.join(homeDir, ".gemini", "config", "mcp_config.json"),
};

export const createPlatformCommand = (passedArgs: string[]) => {
  if (process.platform === "win32") {
    return {
      command: "cmd",
      args: ["/c", "npx", ...passedArgs],
    };
  }
  return {
    command: "npx",
    args: passedArgs,
  };
};

export function getDefaultConfig(
  client: ValidClient,
): McpServersClientConfig | VscodeClientConfig {
  if (client === "vscode") {
    return {
      servers: {
        magicui: {
          command: "npx",
          args: ["-y", "@magicuidesign/mcp@latest"],
        },
      },
    };
  }

  const args = ["-y", "@magicuidesign/mcp@latest"];
  const command = createPlatformCommand(args);

  return {
    mcpServers: {
      "@magicuidesign/mcp": command,
    },
  };
}
