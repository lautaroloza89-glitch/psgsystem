import Link from "next/link";

export function BackButton({ href }: { href: string }) {
  return (
    <Link
      href={href}
      aria-label="Volver"
      className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border-strong text-lg text-text transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      <span aria-hidden="true">←</span>
    </Link>
  );
}
