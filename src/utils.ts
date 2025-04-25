import fs from "node:fs";
import path from "node:path";
import type { ValidClient, ClientConfig } from "./types.js";
import { clientPaths } from "./config.js";

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
  const configDir = path.dirname(configPath);

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  if (!config.mcpServers || typeof config.mcpServers !== "object") {
    throw new Error("Invalid mcpServers structure");
  }

  let existingConfig: any = {};
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

  const mergedServers = {
    ...existingConfig.mcp?.servers,
    ...config.mcpServers
  };

  // For VS Code, preserve all existing settings and just update mcp.servers
  const finalConfig = client === "vscode" 
    ? {
        ...existingConfig,
        mcp: {
          ...existingConfig.mcp,
          servers: mergedServers
        }
      }
    : mergedConfig;

  fs.writeFileSync(configPath, JSON.stringify(finalConfig, null, 2));
}
