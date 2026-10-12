"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";

type Stage = "checking" | "invalid" | "form" | "done";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [stage, setStage] = useState<Stage>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStage("invalid");
      return;
    }
    let cancelled = false;
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!cancelled) setStage(res.ok && data.valid ? "form" : "invalid");
      })
      .catch(() => {
        if (!cancelled) setStage("invalid");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 400 && /link/i.test(data.error || "")) {
          setStage("invalid");
          return;
        }
        throw new Error(data.error || "Could not reset your password");
      }

      setStage("done");
      toast.success("Password updated", {
        description: "Signing you in...",
      });

      const redirectTo: string = data.redirectTo || "/dashboard/programs";
      const result = await signIn("credentials", {
        email: data.email,
        password,
        redirect: false,
      });
      if (result?.ok) {
        window.location.assign(redirectTo);
        return;
      }
      window.location.assign(redirectTo.startsWith("/gp") ? "/gp/login" : "/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset your password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const heading =
    stage === "invalid"
      ? "This link has expired"
      : stage === "done"
        ? "Password updated"
        : "Choose a new password";
  const description =
    stage === "invalid"
      ? "Password reset links last for 1 hour and can only be used once. Request a new one to continue."
      : stage === "done"
        ? "Your password has been changed. Taking you to your portal..."
        : "Enter a new password for your Sanative account.";

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      <div className="mx-auto w-full max-w-sm px-4 py-16">
        <Link href="/" className="font-serif text-xl text-[#2c3628]">
          sanative
        </Link>

        <h1 className="mt-10 font-serif text-2xl text-[#2c3628]">
          {stage === "checking" ? "Checking your link" : heading}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#5c7a52]">
          {stage === "checking" ? "One moment." : description}
        </p>

        {stage === "checking" && (
          <Loader2 className="mt-8 h-5 w-5 animate-spin text-[#5c7a52]" />
        )}

        {stage === "form" && (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="flex items-start gap-2 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                required
                minLength={8}
                autoComplete="new-password"
                className="h-11"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError(null);
                }}
                required
                minLength={8}
                autoComplete="new-password"
                className="h-11"
              />
            </div>

            <Button type="submit" className="h-11 w-full bg-[#5c7a52] hover:bg-[#4a6343]" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating
                </>
              ) : (
                "Update password"
              )}
            </Button>
          </form>
        )}

        {stage === "invalid" && (
          <Button asChild className="mt-8 h-11 w-full bg-[#5c7a52] hover:bg-[#4a6343]">
            <Link href="/forgot-password">Request a new link</Link>
          </Button>
        )}

        {stage === "done" && (
          <Loader2 className="mt-8 h-5 w-5 animate-spin text-[#5c7a52]" />
        )}

        <p className="mt-8 text-sm text-[#5c7a52]">
          <Link href="/login" className="underline underline-offset-2 hover:text-[#2c3628]">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen gradient-mesh flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
