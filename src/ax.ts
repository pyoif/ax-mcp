import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function runAx(args: string[]): Promise<{ stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execFileAsync("ax", args, {
      maxBuffer: 1024 * 1024 * 5,
      timeout: 30_000,
    });
    return { stdout, stderr };
  } catch (err: any) {
    if (err.stdout) return { stdout: err.stdout, stderr: err.stderr ?? "" };
    throw err;
  }
}
