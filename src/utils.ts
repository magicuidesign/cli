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
    return client === "vscode" ? { mcp: { servers: {} } } : { mcpServers: {} };
  }

  try {
    const rawConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    if (client === "vscode") {
      return {
        mcp: {
          servers: (rawConfig.mcp && rawConfig.mcp.servers) || {},
        },
      };
    }
    return {
      ...rawConfig,
      mcpServers: rawConfig.mcpServers || {},
    };
  } catch (error) {
    return client === "vscode" ? { mcp: { servers: {} } } : { mcpServers: {} };
  }
}

export function writeConfig(client: ValidClient, config: ClientConfig): void {
  const configPath = getConfigPath(client);
  const configDir = path.dirname(configPath);

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // Validate config structure
  if (client === "vscode") {
    if (!config.mcp?.servers || typeof config.mcp.servers !== "object") {
      throw new Error("Invalid mcp.servers structure for vscode");
    }
  } else if (!config.mcpServers || typeof config.mcpServers !== "object") {
    throw new Error("Invalid mcpServers structure");
  }

  let existingConfig: ClientConfig = client === "vscode" 
    ? { mcp: { servers: {} } }
    : { mcpServers: {} };

  try {
    if (fs.existsSync(configPath)) {
      existingConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    }
  } catch (error) {
    // If reading fails, continue with empty existing config
  }

  let mergedConfig;
  if (client === "vscode" && config.mcp?.servers) {
    mergedConfig = {
      ...existingConfig,
      mcp: {
        ...existingConfig.mcp,
        servers: {
          ...(existingConfig.mcp?.servers || {}),
          ...config.mcp.servers,
        },
      },
    };
  } else if (config.mcpServers) {
    mergedConfig = {
      ...existingConfig,
      mcpServers: {
        ...existingConfig.mcpServers,
        ...config.mcpServers,
      },
    };
  }

  fs.writeFileSync(configPath, JSON.stringify(mergedConfig, null, 2));
}
