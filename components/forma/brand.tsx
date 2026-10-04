import Link from "next/link";
export function Mark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="26"
      height="26"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path d="M6 5h21l-5 6H12v5h12l-5 6h-7v5H6V5Z" fill="currentColor" />
    </svg>
  );
}
export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="brand" aria-label="Forma home">
      <Mark />
      <span>forma</span>
    </Link>
  );
}
