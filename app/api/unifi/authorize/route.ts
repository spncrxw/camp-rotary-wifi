import { auth0 } from "@/lib/auth0";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type GuestContext = {
  ap?: string;
  clientMac: string;
  originalUrl?: string;
  ssid?: string;
};

function parseGuestContext(raw?: string): GuestContext | null {
  if (!raw) return null;

  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function getSafeRedirectTarget(input?: string): string {
  if (!input) return "/connected";

  try {
    const url = new URL(input);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    // ignore invalid URLs
  }

  return "/connected";
}

async function unifiFetch(path: string, init?: RequestInit) {
  const baseUrl = process.env.UNIFI_API_BASE_URL;
  const apiKey = process.env.UNIFI_API_KEY;
  const apiKeyHeader = process.env.UNIFI_API_KEY_HEADER || "X-API-KEY";

  if (!baseUrl || !apiKey) {
    throw new Error("Missing UniFi API environment variables");
  }

  const url = new URL(path.replace(/^\//, ""), baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  const headers = new Headers(init?.headers);

  headers.set(apiKeyHeader, apiKey);

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url.toString(), {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`UniFi API error ${response.status}: ${text}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return null;
}

function extractArray(payload: unknown): any[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    const p = payload as Record<string, unknown>;
    if (Array.isArray(p.data)) return p.data;
    if (Array.isArray(p.items)) return p.items;
  }
  return [];
}

export async function POST() {
  const session = await auth0.getSession();

  if (!session) {
    return NextResponse.redirect(new URL("/auth/login", process.env.APP_BASE_URL || "http://localhost:3000"));
  }

  const cookieStore = await cookies();
  const guest = parseGuestContext(cookieStore.get("guest_ctx")?.value);

  if (!guest?.clientMac) {
    return NextResponse.json(
      { error: "No pending guest authorization context" },
      { status: 400 }
    );
  }

  try {
    let siteId = process.env.UNIFI_SITE_ID;

    if (!siteId) {
      const sitesPayload = await unifiFetch("/v1/sites");
      const sites = extractArray(sitesPayload);
      if (!sites[0]?.id) {
        throw new Error("No UniFi site found");
      }
      siteId = sites[0].id;
    }

    const filter = encodeURIComponent(`macAddress.eq('${guest.clientMac}')`);
    const clientsPayload = await unifiFetch(`/v1/sites/${siteId}/clients?filter=${filter}`);
    const clients = extractArray(clientsPayload);

    const client =
      clients.find(
        (c: any) =>
          String(c?.macAddress || "").toLowerCase() === guest.clientMac.toLowerCase()
      ) || clients[0];

    if (!client?.id) {
      throw new Error("Could not find UniFi client for guest MAC");
    }

    await unifiFetch(`/v1/sites/${siteId}/clients/${client.id}/actions`, {
      method: "POST",
      body: JSON.stringify({
        action: "AUTHORIZE_GUEST_ACCESS",
        timeLimitMinutes: Number(process.env.UNIFI_TIME_LIMIT_MINUTES || 120),
      }),
    });

    const response = NextResponse.redirect(
      getSafeRedirectTarget(guest.originalUrl)
    );

    response.cookies.delete("guest_ctx");
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown UniFi authorization error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}