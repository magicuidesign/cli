import inquirer from "inquirer";
import chalk from "chalk";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

const isWindows = process.platform === "win32";

async function isProcessRunning(processName: string): Promise<boolean> {
  try {
    if (isWindows) {
      const { stdout } = await execAsync(
        `tasklist /FI "IMAGENAME eq ${processName}.exe" /NH`,
      );
      return stdout.includes(`${processName}.exe`);
    }
    const { stdout } = await execAsync(`pgrep -x "${processName}"`);
    return !!stdout.trim();
  } catch {
    return false;
  }
}

async function restartProcess(processName: string): Promise<void> {
  try {
    await execAsync(
      isWindows ? `taskkill /F /IM "${processName}.exe"` : `killall "${processName}"`,
    );
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await execAsync(
      isWindows ? `start "" "${processName}.exe"` : `open -a "${processName}"`,
    );
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
