import { NextResponse } from "next/server";

interface ARDebugLog {
  message: string;
  time: string;
}

const logs: ARDebugLog[] = [];

export async function POST(req: Request) {
  const body: { message: string } = await req.json();

  logs.push({
    message: body.message,
    time: new Date().toISOString(),
  });

  if (logs.length > 200) logs.shift();

  return NextResponse.json({ success: true });
}

export async function GET() {
  return NextResponse.json(logs);
}