"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Basic validation
    if (!email.trim()) {
      setError("Please enter your email address.");
      setIsLoading(false);
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    try {
      // Call password reset API
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send reset email");
      }

      setIsSubmitted(true);
      toast.success("Reset email sent!", {
        description: "Check your inbox for password reset instructions."
      });
    } catch (err) {
      // For security, we still show success even if email doesn't exist
      // This prevents email enumeration attacks
      setIsSubmitted(true);
      toast.success("Reset email sent!", {
        description: "If an account exists with this email, you'll receive reset instructions."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      <div className="mx-auto w-full max-w-sm px-4 py-16">
        <Link href="/" className="font-serif text-xl text-[#2c3628]">
          sanative
        </Link>

        <h1 className="mt-10 font-serif text-2xl text-[#2c3628]">
          {isSubmitted ? "Check your email" : "Reset your password"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#5c7a52]">
          {isSubmitted
            ? `If an account exists for ${email}, a reset link is on its way. Check spam if it is not in your inbox.`
            : "Enter your email and we will send a link to choose a new password."}
        </p>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="flex items-start gap-2 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                required
                className="h-11"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              className="h-11 w-full bg-[#5c7a52] hover:bg-[#4a6343]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending
                </>
              ) : (
                "Send reset link"
              )}
            </Button>
          </form>
        ) : (
          <Button
            variant="outline"
            className="mt-8 h-11 w-full"
            onClick={() => {
              setIsSubmitted(false);
              setEmail("");
            }}
          >
            Use a different email
          </Button>
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
