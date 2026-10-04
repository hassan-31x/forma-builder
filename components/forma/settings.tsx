"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Trash2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Brand } from "./brand";
export function AccountSettings({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const [oldPassword, setOld] = useState(""),
    [newPassword, setNew] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [deleting, setDeleting] = useState(false),
    [deletePassword, setDeletePassword] = useState("");
  const router = useRouter();
  async function change(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await authClient.changePassword({
        currentPassword: oldPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (result.error) throw new Error(result.error.message);
      setOld("");
      setNew("");
      setMessage("Password updated. Your other sessions have been signed out.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await authClient.deleteUser({ password: deletePassword });
      if (result.error) throw new Error(result.error.message);
      router.push("/");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <header className="app-header">
        <Brand />
        <Link href="/dashboard" className="text-button">
          <ArrowLeft size={14} />
          Workspace
        </Link>
      </header>
      <main id="main" className="legal-page">
        <span className="eyebrow">Your account</span>
        <h1>A little housekeeping.</h1>
        <p>
          {name}
          <br />
          {email}
        </p>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="success-message" role="status">
            {message}
          </p>
        )}
        <section className="settings-section">
          <h2>Change your password</h2>
          <form onSubmit={change}>
            <label className="field">
              Current password
              <input
                required
                type="password"
                value={oldPassword}
                onChange={(e) => setOld(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            <label className="field">
              New password
              <input
                required
                type="password"
                minLength={10}
                maxLength={128}
                value={newPassword}
                onChange={(e) => setNew(e.target.value)}
                autoComplete="new-password"
                placeholder="At least 10 characters"
              />
            </label>
            <button className="button small" disabled={busy}>
              {busy ? "Please wait…" : "Update password"}
              <Check size={14} />
            </button>
          </form>
        </section>
        <section className="settings-section">
          <h2>Delete your account</h2>
          <p>
            Deleting your account removes your cloud projects, published
            websites, and account access. Export any websites you want to keep
            first.
          </p>
          {!deleting ? (
            <button
              className="button small danger"
              onClick={() => setDeleting(true)}
            >
              <Trash2 size={14} />
              Delete account
            </button>
          ) : (
            <form onSubmit={remove}>
              <label className="field">
                Confirm your password
                <input
                  type="password"
                  required
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  autoComplete="current-password"
                />
              </label>
              <div className="panel-actions">
                <button className="button small danger" disabled={busy}>
                  {busy ? "Deleting…" : "Permanently delete account"}
                </button>
                <button
                  className="button small secondary"
                  type="button"
                  onClick={() => setDeleting(false)}
                >
                  Keep my account
                </button>
              </div>
            </form>
          )}
        </section>
      </main>
    </>
  );
}
