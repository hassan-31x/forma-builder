"use client";
import Link from "next/link";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main" className="legal-page">
      <h1>We couldn’t open this page.</h1>
      <p>Something went wrong. Please try again.</p>
      <div className="panel-actions">
        <button className="button" onClick={reset}>
          Try again
        </button>
        <Link href="/" className="text-button">
          Back to Forma
        </Link>
      </div>
    </main>
  );
}
