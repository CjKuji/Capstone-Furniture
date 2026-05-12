const channel =
  typeof window !== "undefined"
    ? new BroadcastChannel("ar-debug")
    : null;

export function logAR(event: any) {
  channel?.postMessage({
    type: "AR_LOG",
    payload: event,
    time: Date.now(),
  });
}

export function subscribeARLogs(cb: (data: any) => void) {
  if (!channel) return;

  channel.onmessage = (e) => {
    if (e.data?.type === "AR_LOG") {
      cb(e.data);
    }
  };
}