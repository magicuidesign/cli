import fs from "node:fs";
import path from "node:path";
import type { ClientDefinition } from "./clients.js";

interface ServerConfig {
  command: string;
  args: string[];
}

function serverConfigFor(client: ClientDefinition): ServerConfig {
  const args = ["-y", "@magicuidesign/mcp@latest"];
  return client.cmdOnWindows && process.platform === "win32"
    ? { command: "cmd", args: ["/c", "npx", ...args] }
    : { command: "npx", args };
}

export function writeServerConfig(client: ClientDefinition): void {
  const configDir = path.dirname(client.configPath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const server = serverConfigFor(client);
  if (client.file.kind === "toml") {
    writeTomlServer(client.configPath, client.serverName, server);
  } else {
    writeJsonServer(
      client.configPath,
      client.file.rootKey,
      client.serverName,
      server,
    );
  }
}
function readJsonObject(configPath: string): Record<string, unknown> {
  if (!fs.existsSync(configPath)) return {};
  const raw = fs.readFileSync(configPath, "utf8");
  return raw.trim() ? JSON.parse(raw) : {};
}

function writeJsonServer(
  configPath: string,
  rootKey: string,
  name: string,
  server: ServerConfig,
): void {
  const existing = readJsonObject(configPath);
  const servers = existing[rootKey];
  const existingServers =
    servers && typeof servers === "object" && !Array.isArray(servers)
      ? (servers as Record<string, unknown>)
      : {};

  const merged = {
    ...existing,
    [rootKey]: { ...existingServers, [name]: server },
  };

  fs.writeFileSync(configPath, JSON.stringify(merged, null, 2));
}

function escapeTomlBasicString(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

const CODEX_MCP_TABLE_HEADER =
  /^\[mcp_servers\.(?:"([^"]+)"|([a-zA-Z0-9_.-]+))\]\s*$/;

function mcpServerNameFromTableHeader(line: string): string | undefined {
  if (!line.startsWith("[mcp_servers.")) return undefined;
  const match = line.match(CODEX_MCP_TABLE_HEADER);
  if (!match) return undefined;
  return match[1] ?? match[2];
}

function removeTomlServerTable(content: string, name: string): string {
  const kept: string[] = [];
  let droppingBlock = false;

  for (const line of content.split(/\r?\n/)) {
    const header = line.trimStart();
    if (droppingBlock && !header.startsWith("[")) {
      continue;
    }
    droppingBlock = mcpServerNameFromTableHeader(header) === name;
    if (!droppingBlock) kept.push(line);
  }

  return kept.join("\n");
}

function formatTomlServerTable(name: string, server: ServerConfig): string {
  const header = `[mcp_servers."${escapeTomlBasicString(name)}"]`;
  const cmd = `command = "${escapeTomlBasicString(server.command)}"`;
  const args = server.args.map((a) => `"${escapeTomlBasicString(a)}"`);
  return `${header}\n${cmd}\nargs = [${args.join(", ")}]\n`;
}

function writeTomlServer(
  configPath: string,
  name: string,
  server: ServerConfig,
): void {
  const content = fs.existsSync(configPath)
    ? fs.readFileSync(configPath, "utf8")
    : "";

  const rest = removeTomlServerTable(content, name).trimEnd();
  const sep = rest.length > 0 ? "\n\n" : "";
  const table = formatTomlServerTable(name, server);
  fs.writeFileSync(configPath, `${rest}${sep}${table}`.trimEnd() + "\n");
}
