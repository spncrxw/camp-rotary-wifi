import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const clientMac = params.get("id");
  if (!clientMac) {
    return NextResponse.json(
      { error: "Missing UniFi client MAC address" },
      { status: 400 }
    );
  }

  const guestCtx = {
    ap: params.get("ap") || undefined,
    clientMac,
    originalUrl: params.get("url") || undefined,
    ssid: params.get("ssid") || undefined,
  };

  const encoded = Buffer.from(JSON.stringify(guestCtx), "utf8").toString(
    "base64url"
  );

  const loginUrl = new URL("/auth/login", request.nextUrl.origin);
  const response = NextResponse.redirect(loginUrl);

  response.cookies.set("guest_ctx", encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}