export default function ConnectedPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-12">
      <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl">
        <h1 className="text-3xl font-semibold">You’re connected</h1>
        <p className="mt-3 text-white/80">
          Your device has been authorized for guest access.
        </p>

        <div className="mt-6">
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