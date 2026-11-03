#!/usr/bin/env node

import chalk from "chalk";
import { Command } from "commander";
import { install } from "./index.js";
import { isValidClient, VALID_CLIENTS } from "./clients.js";

const program = new Command();

program
  .name("@magicuidesign/cli")
  .description("Install Magic UI Components or MCP configuration")
  .version("1.0.0");

program
  .command("install")
  .description("Install MCP configuration for a specific client")
  .argument(
    "<client>",
    `The client to install for (${VALID_CLIENTS.join(", ")})`,
  )
  .action(async (client: string) => {
    if (!isValidClient(client)) {
      console.error(
        chalk.red(
          `Invalid client "${client}". Available clients: ${VALID_CLIENTS.join(
            ", ",
          )}`,
        ),
      );
      process.exit(1);
    }

    try {
      await install(client);
    } catch (error) {
      console.error(
        chalk.red(
          error instanceof Error ? error.message : "Unknown error occurred",
        ),
      );
      process.exit(1);
    }
  });

program.parse();
