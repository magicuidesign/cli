import chalk from "chalk";
import ora from "ora";
import { promptForRestart } from "./client.js";
import { getDefaultConfig } from "./config.js";
import type { ValidClient } from "./types.js";
import { writeConfig } from "./utils.js";

export async function install(client: ValidClient): Promise<void> {
  const capitalizedClient = client.charAt(0).toUpperCase() + client.slice(1);

  const spinner = ora(
    `Installing configuration for ${capitalizedClient}...`,
  ).start();

  try {
    const config = getDefaultConfig();

    writeConfig(client, config);
    spinner.succeed(
      `Successfully installed configuration for ${capitalizedClient}`,
    );

    console.log(
      chalk.green(`${capitalizedClient} configuration updated successfully`),
    );
    console.log(
      chalk.yellow(
        `You may need to restart ${capitalizedClient} to see the Magic MCP server.`,
      ),
    );
    await promptForRestart(client);
  } catch (error) {
    spinner.fail(`Failed to install configuration for ${capitalizedClient}`);
    console.error(
      chalk.red(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
    throw error;
  }
}
