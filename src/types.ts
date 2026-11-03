export type ValidClient =
  | "claude"
  | "cline"
  | "roo-cline"
  | "windsurf"
  | "cursor"
  | "codex"
  | "vscode"
  | "antigravity";

export const VALID_CLIENTS: ValidClient[] = [
  "claude",
  "cline",
  "roo-cline",
  "windsurf",
  "cursor",
  "codex",
  "vscode",
  "antigravity",
];

export interface ServerConfig {
  command: string;
  args: string[];
}

/** MCP config shape used by Claude Desktop, Cursor, Windsurf, Cline, etc. */
export interface McpServersClientConfig {
  mcpServers: Record<string, ServerConfig>;
}

/** VS Code native MCP config (`User/mcp.json`) */
export interface VscodeClientConfig {
  servers: Record<string, ServerConfig>;
}

export type ClientConfig = McpServersClientConfig | VscodeClientConfig;
