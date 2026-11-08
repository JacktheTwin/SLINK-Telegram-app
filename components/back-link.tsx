import Link from "next/link";

type BackLinkProps = {
  href: string;
  label: string;
};

// Link "indietro" della barra superiore, nascosto in Telegram dove c'è il
// BackButton nativo.
export function BackLink({ href, label }: BackLinkProps) {
  return (
    <Link className="app-icon-button web-only-control px-3" href={href}>
      <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
        <path d="m15 18-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
      {label}
    </Link>
  );
}
