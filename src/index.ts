import chalk from "chalk";
import ora from "ora";
import { CLIENTS, type ValidClient } from "./clients.js";
import { promptForRestart } from "./restart.js";
import { writeServerConfig } from "./write.js";

export async function install(clientName: ValidClient): Promise<void> {
  const client = CLIENTS[clientName];
  const spinner = ora(
    `Installing configuration for ${client.displayName}...`,
  ).start();

  try {
    writeServerConfig(client);
    spinner.succeed(
      `Successfully installed configuration for ${client.displayName}`,
    );

    console.log(
      chalk.green(`${client.displayName} configuration updated successfully`),
    );
    console.log(
      chalk.yellow(
        `You may need to restart ${client.displayName} to see the Magic MCP server.`,
      ),
    );
    if (client.restartProcessName) {
      await promptForRestart(client.displayName, client.restartProcessName);
    }
  } catch (error) {
    spinner.fail(`Failed to install configuration for ${client.displayName}`);
    console.error(
      chalk.red(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
    throw error;
  }
}
