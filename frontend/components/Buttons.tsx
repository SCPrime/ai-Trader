"use client";
import { useState } from "react";
import { health, getPositions, executeDryRun } from "../lib/api";

export default function Buttons() {
  const [log, setLog] = useState<string>("");
  const run = (name: string, fn: () => Promise<any>) => async () => {
    try { const res = await fn(); setLog(`${name}: ${JSON.stringify(res)}`); }
    catch (e:any) { setLog(`${name} ERROR: ${e.message}`); }
  };
  return (
    <div>
      <button onClick={run("health", health)}>Health</button>
      <button onClick={run("positions", getPositions)}>Positions</button>
      <button onClick={run("executeDryRun", executeDryRun)}>Execute (Dry)</button>
      <pre>{log}</pre>
    </div>
  );
}