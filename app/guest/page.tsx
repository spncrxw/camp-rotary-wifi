type SearchParams = {
  ap?: string;
  id?: string;
  t?: string;
  url?: string;
  ssid?: string;
};

export default async function GuestPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  if (!params.id) {
    return (
      <main className="min-h-screen bg-slate-950 text-white px-6 py-12">
        <div className="mx-auto max-w-xl rounded-2xl border border-red-500/30 bg-red-500/10 p-8">
          <h1 className="text-2xl font-semibold">Missing guest parameters</h1>
          <p className="mt-3 text-white/80">
            UniFi did not send the client MAC address to this portal.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-12">
      <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl">
        <h1 className="text-3xl font-semibold">Connect to Guest Wi-Fi</h1>
        <p className="mt-3 text-white/80">
          Continue to sign in and authorize this device for{" "}
          <span className="font-medium text-white">{params.ssid || "Guest"}</span>.
        </p>

        <form action="/api/guest/init" method="get" className="mt-6">
          <input type="hidden" name="ap" value={params.ap || ""} />
          <input type="hidden" name="id" value={params.id || ""} />
          <input type="hidden" name="t" value={params.t || ""} />
          <input type="hidden" name="url" value={params.url || ""} />
          <input type="hidden" name="ssid" value={params.ssid || ""} />

          <button
            type="submit"
            className="rounded-xl bg-white px-4 py-2 font-medium text-slate-900"
          >
            Continue with Auth0
          </button>
        </form>
      </div>
    </main>
  );
}