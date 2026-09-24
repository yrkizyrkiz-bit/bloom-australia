"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  FlaskConical,
  ArrowLeft,
  KeyRound,
  Loader2,
  CheckCircle,
  AlertCircle,
  LinkIcon,
} from "lucide-react";

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
    <div className="min-h-screen gradient-mesh">
      <nav className="border-b border-border/50 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-white" />
              </div>
              <span className="font-serif text-xl font-semibold text-foreground">sanative</span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-md mx-auto px-4 py-20">
        <Card className="shadow-xl border-border/50">
          <CardHeader className="space-y-1 text-center pb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              {stage === "checking" ? (
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              ) : stage === "invalid" ? (
                <LinkIcon className="w-8 h-8 text-primary" />
              ) : stage === "done" ? (
                <CheckCircle className="w-8 h-8 text-primary" />
              ) : (
                <KeyRound className="w-8 h-8 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl font-serif">
              {stage === "checking" ? "Checking your link" : heading}
            </CardTitle>
            <CardDescription>
              {stage === "checking" ? "One moment..." : description}
            </CardDescription>
          </CardHeader>

          {stage === "form" && (
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min 8 characters"
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
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repeat your new password"
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

                <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4 mr-2" />
                      Update password
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          )}

          {stage === "invalid" && (
            <CardContent>
              <Button asChild className="w-full h-11">
                <Link href="/forgot-password">Request a new reset link</Link>
              </Button>
            </CardContent>
          )}

          {stage === "done" && (
            <CardContent className="flex justify-center py-2">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </CardContent>
          )}

          <CardFooter className="flex flex-col gap-4 pt-4">
            <div className="text-center text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link href="/" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>For security reasons, password reset links expire after 1 hour.</p>
        </div>
      </div>

      <footer className="border-t border-border/50 bg-white/50 mt-auto absolute bottom-0 left-0 right-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-center items-center gap-6 text-xs text-muted-foreground">
            <span>AHPRA Compliant</span>
            <span>TGA Registered</span>
            <span>Australian Owned</span>
          </div>
        </div>
      </footer>
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
