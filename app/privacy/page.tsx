import Link from "next/link";
import { Brand } from "@/components/forma/brand";
export const metadata = { title: "Privacy" };
export default function Privacy() {
  return (
    <main id="main" className="legal-page">
      <Brand />
      <h1>Privacy, plainly.</h1>
      <p>
        Forma stores the information needed to run your account and your
        websites. This policy describes the application’s current data flow.
      </p>
      <h2>Your account and projects</h2>
      <p>
        Cloud accounts store your name, email address, password hash, sessions,
        and website projects in MongoDB. Project APIs require your session and
        check project ownership. Passwords are hashed by Better Auth.
      </p>
      <h2>AI generation</h2>
      <p>
        When you generate a website, your brief is sent to OpenRouter and its
        model provider. Avoid including confidential or sensitive personal
        information in a brief. Daily usage counters help enforce generation
        limits.
      </p>
      <h2>Publishing</h2>
      <p>
        Publishing makes a snapshot of your website available to anyone with its
        public link. Unpublishing removes that snapshot. Private draft changes
        do not appear on a published website until you publish again.
      </p>
      <h2>Local demo and cookies</h2>
      <p>
        The local demo stores projects in your browser’s local storage.
        Authentication uses essential session cookies. This application does not
        include advertising or analytics trackers.
      </p>
      <h2>Deleting your work</h2>
      <p>
        You can delete projects from the workspace. Deleting a project also
        removes its published snapshot. Clearing browser site data removes local
        demo projects. Account settings lets you delete your cloud account,
        projects, and published websites.
      </p>
      <h2>Service providers</h2>
      <p>
        Vercel hosts the application, MongoDB stores cloud data, your email
        provider delivers account messages, and OpenRouter processes AI briefs.
        Their own privacy policies apply to their services.
      </p>
      <p className="notice">
        Before public launch, the operator must provide its legal identity,
        privacy contact, retention schedule, and any jurisdiction specific
        terms. This page is an operational policy draft.
      </p>
      <Link href="/" className="text-button">
        Back to Forma
      </Link>
    </main>
  );
}
