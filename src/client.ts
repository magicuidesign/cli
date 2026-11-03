import inquirer from "inquirer";
import chalk from "chalk";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

async function isProcessRunning(processName: string): Promise<boolean> {
  try {
    const platform = process.platform;

    if (platform === "win32") {
      const { stdout } = await execAsync(
        `tasklist /FI "IMAGENAME eq ${processName}.exe" /NH`,
      );
      return stdout.includes(`${processName}.exe`);
    } else if (platform === "darwin") {
      const { stdout } = await execAsync(`pgrep -x "${processName}"`);
      return !!stdout.trim();
    } else if (platform === "linux") {
      const { stdout } = await execAsync(
        `pgrep -f "${processName.toLowerCase()}"`,
      );
      return !!stdout.trim();
    }
    return false;
  } catch {
    return false;
  }
}

async function restartProcess(processName: string): Promise<void> {
  const platform = process.platform;

  try {
    if (platform === "win32") {
      await execAsync(`taskkill /F /IM "${processName}.exe"`);
    } else if (platform === "darwin") {
      await execAsync(`killall "${processName}"`);
    } else if (platform === "linux") {
      await execAsync(`pkill -f "${processName.toLowerCase()}"`);
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (platform === "win32") {
      await execAsync(`start "" "${processName}.exe"`);
    } else if (platform === "darwin") {
      await execAsync(`open -a "${processName}"`);
    } else if (platform === "linux") {
      await execAsync(processName.toLowerCase());
    }

    console.log(chalk.green(`${processName} has been restarted.`));
  } catch (error) {
    console.error(chalk.red(`Failed to restart ${processName}:`), error);
  }
}

export async function promptForRestart(
  displayName: string,
  processName: string,
): Promise<void> {
  if (!(await isProcessRunning(processName))) return;

  const { shouldRestart } = await inquirer.prompt<{ shouldRestart: boolean }>([
    {
      type: "confirm",
      name: "shouldRestart",
      message: `Would you like to restart ${chalk.bold(displayName)} now?`,
      default: true,
    },
  ]);

  if (shouldRestart) {
    console.log(`Restarting ${displayName} app...`);
    await restartProcess(processName);
  }
}
