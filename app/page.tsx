import { auth0 } from "@/lib/auth0";
import { cookies } from "next/headers";

type GuestContext = {
  ap?: string;
  clientMac: string;
  originalUrl?: string;
  ssid?: string;
};

async function getGuestContext(): Promise<GuestContext | null> {
  const store = await cookies();
  const raw = store.get("guest_ctx")?.value;
  if (!raw) return null;

  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export default async function Home() {
  const session = await auth0.getSession();
  const guest = await getGuestContext();

  if (!session) {
    return (
      <main className="min-h-screen bg-slate-950 text-white px-6 py-12">
        <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl">
          <h1 className="text-3xl font-semibold">Guest Wi-Fi Portal</h1>
          <p className="mt-3 text-white/80">
            Sign in to continue to the guest network.
          </p>

          <div className="mt-6">
            <a
              href="/auth/login"
              className="inline-flex rounded-xl bg-white px-4 py-2 font-medium text-slate-900"
            >
              Continue with Auth0
            </a>
          </div>
        </div>
      </main>
    );
  }

  if (guest) {
    return (
      <main className="min-h-screen bg-slate-950 text-white px-6 py-12">
        <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl">
          <h1 className="text-3xl font-semibold">Welcome, {session.user.name}</h1>
          <p className="mt-3 text-white/80">
            You are signed in and ready to authorize this device on{" "}
            <span className="font-medium text-white">
              {guest.ssid || "Guest Wi-Fi"}
            </span>.
          </p>

          <div className="mt-6 flex gap-3">
            <form action="/api/unifi/authorize" method="post">
              <button
                type="submit"
                className="rounded-xl bg-white px-4 py-2 font-medium text-slate-900"
              >
                Connect this device
              </button>
            </form>

            <a
              href="/auth/logout"
              className="rounded-xl border border-white/20 px-4 py-2"
            >
              Log out
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-12">
      <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl">
        <h1 className="text-3xl font-semibold">Signed in</h1>
        <p className="mt-3 text-white/80">
          There is no pending UniFi guest authorization for this session.
        </p>

        <div className="mt-6 flex gap-3">
          <a
            href="/auth/logout"
            className="rounded-xl border border-white/20 px-4 py-2"
          >
            Log out
          </a>
        </div>
      </div>
    </main>
  );
}