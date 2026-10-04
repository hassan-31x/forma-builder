import Link from "next/link";
import { Brand } from "@/components/forma/brand";
export default function NotFound() {
  return (
    <main id="main" className="legal-page">
      <Brand />
      <p className="eyebrow">404 / A little off course</p>
      <h1>This page hasn’t found its home.</h1>
      <p>
        The link may have changed, or this website may no longer be published.
      </p>
      <Link href="/" className="button">
        Back to Forma
      </Link>
    </main>
  );
}
