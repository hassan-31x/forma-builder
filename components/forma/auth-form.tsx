"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Brand } from "./brand";
import { authClient } from "@/lib/auth-client";
export function AuthForm({
  initialMode,
  configured,
  token,
  error: initialError,
}: {
  initialMode: string;
  configured: boolean;
  token?: string;
  error?: string;
}) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(
    initialError
      ? "This link is invalid or has expired. Please request a new one."
      : "",
  );
  const [message, setMessage] = useState("");
  const router = useRouter();
  const signup = mode === "signup",
    reset = mode === "reset",
    forgot = mode === "forgot";
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      if (!configured)
        throw new Error(
          "Cloud accounts are not configured yet. You can explore the local demo below.",
        );
      if (reset) {
        if (!token)
          throw new Error(
            "This reset link is missing its token. Request a new link.",
          );
        const result = await authClient.resetPassword({
          newPassword: password,
          token,
        });
        if (result.error) throw new Error(result.error.message);
        setMessage("Password updated. You can sign in with your new password.");
        setMode("login");
      } else if (forgot) {
        const result = await authClient.requestPasswordReset({
          email,
          redirectTo: `${location.origin}/login?mode=reset`,
        });
        if (result.error) throw new Error(result.error.message);
        setMessage(
          "If an account exists for this email, a password reset link is on its way.",
        );
      } else if (signup) {
        const result = await authClient.signUp.email({
          email,
          password,
          name: name.trim(),
          callbackURL: "/dashboard",
        });
        if (result.error) throw new Error(result.error.message);
        if (result.data?.token) {
          router.push("/dashboard");
          router.refresh();
        } else
          setMessage(
            "Check your inbox to verify your email. Then return here to sign in.",
          );
      } else {
        const result = await authClient.signIn.email({
          email,
          password,
          callbackURL: "/dashboard",
        });
        if (result.error) throw new Error(result.error.message);
        router.push("/dashboard");
        router.refresh();
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "We could not complete this request. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  function change(next: string) {
    setMode(next);
    setError("");
    setMessage("");
  }
  return (
    <main id="main" className="auth-layout">
      <header className="auth-nav">
        <Brand />
        <Link href="/" className="text-button">
          <ArrowLeft size={14} /> Back to Forma
        </Link>
      </header>
      <div className="auth-card">
        <h1>
          {signup
            ? "Make room for your ideas."
            : reset
              ? "A fresh start."
              : forgot
                ? "Let’s get you back in."
                : "Good to see you again."}
        </h1>
        <p>
          {signup
            ? "Your next website starts here."
            : reset
              ? "Choose a new password for your account."
              : forgot
                ? "We’ll email you a link to reset your password."
                : "Pick up where your ideas left off."}
        </p>
        {!configured && (
          <p className="notice">
            Cloud accounts need deployment configuration. The local studio demo
            is ready to explore.
          </p>
        )}
        <form onSubmit={submit}>
          {signup && (
            <label className="field">
              Your name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                autoComplete="name"
                placeholder="Your name"
              />
            </label>
          )}
          {!reset && (
            <label className="field">
              Email address
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                maxLength={254}
                placeholder="you@company.com"
              />
            </label>
          )}
          {!forgot && (
            <label className="field">
              {reset ? "New password" : "Password"}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={signup || reset ? 10 : 1}
                maxLength={128}
                autoComplete={
                  signup || reset ? "new-password" : "current-password"
                }
                placeholder={
                  signup ? "At least 10 characters" : "Your password"
                }
              />
            </label>
          )}
          {!signup && !forgot && !reset && (
            <button
              className="text-button"
              type="button"
              onClick={() => change("forgot")}
            >
              Forgot your password?
            </button>
          )}
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
          <button className="button" type="submit" disabled={busy}>
            {busy
              ? "Please wait…"
              : signup
                ? "Create your account"
                : forgot
                  ? "Send reset link"
                  : reset
                    ? "Update password"
                    : "Log in"}
            <ArrowRight size={16} />
          </button>
        </form>
        <div className="auth-footer">
          {signup ? "Already have an account? " : "New to Forma? "}
          <button
            className="text-button"
            onClick={() => change(signup ? "login" : "signup")}
          >
            {signup ? "Log in" : "Create an account"}
          </button>
        </div>
        <div className="auth-divider" />
        <Link href="/dashboard?demo=1" className="text-button">
          Try the studio without an account <ArrowRight size={14} />
        </Link>
        <p className="notice">
          By continuing, you agree to our <Link href="/terms">Terms</Link> and{" "}
          <Link href="/privacy">Privacy policy</Link>.
        </p>
      </div>
    </main>
  );
}
