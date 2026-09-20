import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col items-start gap-4 px-6 py-16">
      <p className="text-xs uppercase tracking-[0.28em] text-f1">F1 Weather Resilience</p>
      <h1 className="text-3xl">Page not found</h1>
      <p className="text-sm text-muted">That path is not part of the static planner.</p>
      <Link href="/" className="rounded-xl border border-stroke px-4 py-2 text-sm">
        Back to planner
      </Link>
    </div>
  );
}
