export type ValidClient =
  | "claude"
  | "cline"
  | "roo-cline"
  | "windsurf"
  | "cursor"
  | "codex";

export const VALID_CLIENTS: ValidClient[] = [
  "claude",
  "cline",
  "roo-cline",
  "windsurf",
  "cursor",
  "codex",
];

export interface ServerConfig {
  command: string;
  args: string[];
}

export interface ClientConfig {
  mcpServers: Record<string, ServerConfig>;
}

export interface InstallOptions {
  apiKey?: string;
}
