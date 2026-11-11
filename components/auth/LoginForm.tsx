"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { friendlyAuthError, signInWithEmail } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/components/providers/i18n-provider";

export function LoginForm({ title, subtitle, showSignup = true }: { title: string; subtitle: string; showSignup?: boolean }) {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { role } = await signInWithEmail(email, password);
      const next = params.get("next");
      const home = role === "ADMIN" ? "/admin" : "/dashboard";
      router.push(next && next.startsWith(home) ? next : home);
      router.refresh();
    } catch (err) {
      toast.error(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    if (!email) return void toast.error("Type your email first, then tap “Forgot password”.");
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch {
      // Same message either way, so nobody can test which emails have accounts.
    }
    toast.success("If that email has an account, a reset link is on its way.");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-warm-cream p-4">
      <div className="w-full max-w-md bg-white border border-[#E4DED2] rounded-card shadow-sm p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-display font-bold text-navy-900">{title}</h1>
          <p className="text-sm text-navy-700">{subtitle}</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">{t("Email")}</Label>
            <Input id="login-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password">{t("Password")}</Label>
              <button type="button" onClick={reset} className="text-xs underline text-navy-700">{t("Forgot password")}</button>
            </div>
            <Input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11" />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-11 bg-navy-900 text-gold-500 hover:bg-navy-950 font-bold">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {t("Signing in…")}</> : t("Sign in")}
          </Button>
        </form>
        {showSignup && (
          <p className="text-center text-sm text-navy-700">
            {t("New agent?")} <Link href="/register" className="underline font-semibold text-navy-900">{t("Start your free trial")}</Link>
          </p>
        )}
      </div>
    </div>
  );
}
