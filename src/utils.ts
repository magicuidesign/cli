import fs from "node:fs";
import path from "node:path";
import { clientPaths } from "./config.js";
import type { ClientConfig, ServerConfig, ValidClient } from "./types.js";

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

const MCP_SERVER_BLOCK_END = /\r?\n/;

function removeCodexMcpServerBlocks(
  content: string,
  serverNamesToReplace: Set<string>,
): string {
  const lines = content.split(MCP_SERVER_BLOCK_END);
  const kept: string[] = [];
  let droppingBlock = false;

  for (const line of lines) {
    const header = line.trimStart();
    if (droppingBlock && !header.startsWith("[")) {
      continue;
    }
    if (droppingBlock) {
      droppingBlock = false;
    }

    const serverName = mcpServerNameFromTableHeader(header);
    if (serverName && serverNamesToReplace.has(serverName)) {
      droppingBlock = true;
      continue;
    }

    kept.push(line);
  }

  return kept.join("\n");
}

function formatCodexMcpServerTable(name: string, sc: ServerConfig): string {
  const header = `[mcp_servers."${escapeTomlBasicString(name)}"]`;
  const cmd = `command = "${escapeTomlBasicString(sc.command)}"`;
  const argStrs = sc.args.map((a) => `"${escapeTomlBasicString(a)}"`);
  return `${header}\n${cmd}\nargs = [${argStrs.join(", ")}]\n`;
}

function writeCodexTomlConfig(configPath: string, config: ClientConfig): void {
  if (!config.mcpServers || typeof config.mcpServers !== "object") {
    throw new Error("Invalid mcpServers structure");
  }

  const configDir = path.dirname(configPath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const serverNames = new Set(Object.keys(config.mcpServers));
  let content = "";
  if (fs.existsSync(configPath)) {
    content = fs.readFileSync(configPath, "utf8");
  }

  content = removeCodexMcpServerBlocks(content, serverNames);
  const additions = Object.entries(config.mcpServers)
    .map(([name, sc]) => formatCodexMcpServerTable(name, sc))
    .join("\n");

  const trimmed = content.trimEnd();
  const sep = trimmed.length > 0 ? "\n\n" : "";
  fs.writeFileSync(configPath, `${trimmed}${sep}${additions}`.trimEnd() + "\n");
}

export function getConfigPath(client: ValidClient): string {
  const configPath = clientPaths[client];
  if (!configPath) {
    throw new Error(`Invalid client: ${client}`);
  }
  return configPath;
}

export function readConfig(client: ValidClient): ClientConfig {
  const configPath = getConfigPath(client);

  if (!fs.existsSync(configPath)) {
    return { mcpServers: {} };
  }

  try {
    const rawConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return {
      ...rawConfig,
      mcpServers: rawConfig.mcpServers || {},
    };
  } catch (error) {
    return { mcpServers: {} };
  }
}

export function writeConfig(client: ValidClient, config: ClientConfig): void {
  const configPath = getConfigPath(client);

  if (client === "codex") {
    writeCodexTomlConfig(configPath, config);
    return;
  }

  const configDir = path.dirname(configPath);

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  if (!config.mcpServers || typeof config.mcpServers !== "object") {
    throw new Error("Invalid mcpServers structure");
  }

  let existingConfig: ClientConfig = { mcpServers: {} };
  try {
    if (fs.existsSync(configPath)) {
      existingConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    }
  } catch (error) {
    // If reading fails, continue with empty existing config
  }

  const mergedConfig = {
    ...existingConfig,
    mcpServers: {
      ...existingConfig.mcpServers,
      ...config.mcpServers,
    },
  };

  fs.writeFileSync(configPath, JSON.stringify(mergedConfig, null, 2));
}
