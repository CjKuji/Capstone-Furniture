"use client";

import { useEffect, useState } from "react";

interface ARDebugLog {
  message: string;
  time: string;
}

export default function ARDebugPage() {
  const [logs, setLogs] = useState<ARDebugLog[]>([]);

  const fetchLogs = async () => {
    const res = await fetch("/api/ar-debug");
    const data: ARDebugLog[] = await res.json();
    setLogs([...data].reverse());
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const startPolling = async () => {
      await fetchLogs();
      interval = setInterval(fetchLogs, 1000);
    };

    startPolling();

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>AR Debug Console</h1>

      <div
        style={{
          background: "black",
          color: "#00ff90",
          padding: 20,
          fontFamily: "monospace",
          height: "80vh",
          overflow: "auto",
        }}
      >
        {logs.map((log, i) => (
          <div key={i}>
            [{log.time}] {log.message}
          </div>
        ))}
      </div>
    </div>
  );
}