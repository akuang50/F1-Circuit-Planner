import Link from "next/link";

const LINKS = [
  { href: "/", label: "Planner" },
  { href: "/circuits", label: "Circuits" },
  { href: "/climate", label: "Climate" },
  { href: "/safety", label: "Safety" },
];

export function SiteNav() {
  return (
    <nav className="border-b border-stroke bg-black/40">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="text-xs uppercase tracking-[0.28em] text-f1">
          F1 Weather Resilience
        </Link>
        <ul className="flex flex-wrap gap-2 text-sm">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="rounded-full border border-stroke px-3 py-1.5 hover:border-white/30"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
