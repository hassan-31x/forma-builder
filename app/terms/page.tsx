import Link from "next/link";
import { Brand } from "@/components/forma/brand";
export const metadata = { title: "Terms" };
export default function Terms() {
  return (
    <main id="main" className="legal-page">
      <Brand />
      <h1>A few ground rules.</h1>
      <p>
        Forma helps you create and publish single page websites. These terms
        describe the current service.
      </p>
      <h2>Your work is yours</h2>
      <p>
        You retain your rights to the content you create. You grant the service
        permission to store, process, and display that content as needed to
        operate your projects and published websites. You can export your work
        as HTML.
      </p>
      <h2>Use it responsibly</h2>
      <p>
        You are responsible for your content and for having permission to use
        it. Do not publish illegal content, impersonate others, distribute
        malware, or try to access another person’s account or projects.
      </p>
      <h2>AI output</h2>
      <p>
        AI generated content can be inaccurate. Review facts, links, and content
        rights before publishing. Each account can make up to 10 generation
        attempts daily, with a brief wait between requests. Service limits may
        change.
      </p>
      <h2>Availability</h2>
      <p>
        The service is provided as available, without a guarantee of
        uninterrupted operation. Keep exports of work you need to retain. The
        local demo stores data in your browser and does not provide cloud
        backups.
      </p>
      <h2>Publishing and account access</h2>
      <p>
        You choose when your site becomes public. Keep your login details
        private. The operator may restrict accounts that abuse the service or
        violate these terms.
      </p>
      <p className="notice">
        Before public launch, the operator must complete these terms with its
        legal identity, contact details, governing law, and applicable consumer
        protections. This page is a service terms draft.
      </p>
      <Link href="/" className="text-button">
        Back to Forma
      </Link>
    </main>
  );
}
