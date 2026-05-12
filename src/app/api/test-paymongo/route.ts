export async function GET() {
  const res = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
    method: "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(
        process.env.PAYMONGO_SECRET_KEY + ":"
      ).toString("base64")}`,
    },
  });

  const data = await res.json();

  return Response.json({
    ok: res.ok,
    status: res.status,
    data,
  });
}