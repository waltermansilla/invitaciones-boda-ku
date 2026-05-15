/**
 * Antes de `next dev`: libera `.next/dev/lock`.
 * Si un proceso sigue usando ese archivo (otro `next dev` en la misma carpeta),
 * lo termina para evitar "Unable to acquire lock" al arrancar de nuevo.
 */
import { existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { platform } from "node:os";
import { setTimeout as delay } from "node:timers/promises";

const lockPath = join(process.cwd(), ".next", "dev", "lock");

function pidsHoldingFile(path) {
    if (platform() === "win32") return [];
    try {
        const out = execFileSync("lsof", ["-t", path], {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "pipe"],
        }).trim();
        return [...new Set(out.split(/\n/).filter(Boolean))];
    } catch {
        return [];
    }
}

function killPid(pid, signal) {
    const n = Number.parseInt(pid, 10);
    if (!Number.isFinite(n) || n <= 0 || n === process.pid) return;
    try {
        process.kill(n, signal);
    } catch {
        /* ESRCH */
    }
}

async function main() {
    if (!existsSync(lockPath)) return;

    let pids = pidsHoldingFile(lockPath);
    for (const pid of pids) killPid(pid, "SIGTERM");

    const deadline = Date.now() + 1200;
    while (Date.now() < deadline) {
        pids = pidsHoldingFile(lockPath);
        if (pids.length === 0) break;
        await delay(80);
    }

    for (const pid of pidsHoldingFile(lockPath)) killPid(pid, "SIGKILL");
    await delay(120);

    try {
        if (existsSync(lockPath)) unlinkSync(lockPath);
    } catch {
        /* noop */
    }
}

await main();
