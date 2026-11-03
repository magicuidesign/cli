import os from "node:os";
import path from "node:path";

type ConfigFile =
  | { kind: "json"; rootKey: "mcpServers" | "servers" }
  | { kind: "toml" };

export interface ClientDefinition {
  displayName: string;
  configPath: string;
  file: ConfigFile;
  serverName: string;
  /** VS Code resolves npx itself on Windows. Every other client needs `cmd /c`. */
  cmdOnWindows: boolean;
  /** Only Claude Desktop is safe to kill. The IDE clients may host the terminal this CLI runs in. */
  restartProcessName?: string;
}

const homeDir = os.homedir();

const platformBaseDirs = {
  win32: process.env.APPDATA || path.join(homeDir, "AppData", "Roaming"),
  darwin: path.join(homeDir, "Library", "Application Support"),
  linux: process.env.XDG_CONFIG_HOME || path.join(homeDir, ".config"),
};

const baseDir =
  platformBaseDirs[process.platform as keyof typeof platformBaseDirs];

const vscodeExtensionSettings = (extensionId: string) =>
  path.join(
    baseDir,
    "Code",
    "User",
    "globalStorage",
    extensionId,
    "settings",
    "cline_mcp_settings.json",
  );

const mcpServersJson = { kind: "json", rootKey: "mcpServers" } as const;

const clients = {
  claude: {
    displayName: "Claude",
    configPath: path.join(baseDir, "Claude", "claude_desktop_config.json"),
    file: mcpServersJson,
    serverName: "@magicuidesign/mcp",
    cmdOnWindows: true,
    restartProcessName: "Claude",
  },
  cline: {
    displayName: "Cline",
    configPath: vscodeExtensionSettings("saoudrizwan.claude-dev"),
    file: mcpServersJson,
    serverName: "@magicuidesign/mcp",
    cmdOnWindows: true,
  },
  "roo-cline": {
    displayName: "Roo-cline",
    configPath: vscodeExtensionSettings("rooveterinaryinc.roo-cline"),
    file: mcpServersJson,
    serverName: "@magicuidesign/mcp",
    cmdOnWindows: true,
  },
  windsurf: {
    displayName: "Windsurf",
    configPath: path.join(homeDir, ".codeium", "windsurf", "mcp_config.json"),
    file: mcpServersJson,
    serverName: "@magicuidesign/mcp",
    cmdOnWindows: true,
  },
  cursor: {
    displayName: "Cursor",
    configPath: path.join(homeDir, ".cursor", "mcp.json"),
    file: mcpServersJson,
    serverName: "@magicuidesign/mcp",
    cmdOnWindows: true,
  },
  codex: {
    displayName: "Codex",
    configPath: path.join(
      process.env.CODEX_HOME || path.join(homeDir, ".codex"),
      "config.toml",
    ),
    file: { kind: "toml" },
    serverName: "@magicuidesign/mcp",
    cmdOnWindows: true,
  },
  vscode: {
    displayName: "VS Code",
    configPath: path.join(baseDir, "Code", "User", "mcp.json"),
    file: { kind: "json", rootKey: "servers" },
    serverName: "magicui",
    cmdOnWindows: false,
  },
  antigravity: {
    displayName: "Antigravity",
    configPath: path.join(homeDir, ".gemini", "config", "mcp_config.json"),
    file: mcpServersJson,
    serverName: "@magicuidesign/mcp",
    cmdOnWindows: true,
  },
} satisfies Record<string, ClientDefinition>;

export type ValidClient = keyof typeof clients;

export const CLIENTS: Record<ValidClient, ClientDefinition> = clients;

export const VALID_CLIENTS = Object.keys(clients) as ValidClient[];

export function isValidClient(name: string): name is ValidClient {
  return Object.hasOwn(clients, name);
}
