import { AuthForm } from "@/components/forma/auth-form";
import { authConfigured } from "@/lib/auth";
export const metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; token?: string; error?: string }>;
}) {
  const p = await searchParams;
  return (
    <AuthForm
      initialMode={p.mode || "login"}
      configured={authConfigured()}
      token={p.token}
      error={p.error}
    />
  );
}
