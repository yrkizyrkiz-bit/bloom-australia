"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  FlaskConical,
  ArrowLeft,
  Mail,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";

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
    <div className="min-h-screen gradient-mesh">
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-white" />
              </div>
              <span className="font-serif text-xl font-semibold text-foreground">
                sanative
              </span>
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

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-20">
        <Card className="shadow-xl border-border/50">
          <CardHeader className="space-y-1 text-center pb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              {isSubmitted ? (
                <CheckCircle className="w-8 h-8 text-primary" />
              ) : (
                <Mail className="w-8 h-8 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl font-serif">
              {isSubmitted ? "Check your email" : "Reset your password"}
            </CardTitle>
            <CardDescription>
              {isSubmitted
                ? `We've sent password reset instructions to ${email}`
                : "Enter your email address and we'll send you a link to reset your password."
              }
            </CardDescription>
          </CardHeader>

          {!isSubmitted ? (
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Error Alert */}
                {error && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
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
                    className={`h-11 ${error ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                    autoFocus
                  />
                </div>

                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send reset link
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          ) : (
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm text-green-700">
                  If an account exists for <strong>{email}</strong>, you will receive a password reset email shortly.
                </p>
              </div>

              <div className="text-center text-sm text-muted-foreground space-y-2">
                <p>Didn't receive the email?</p>
                <ul className="list-disc text-left pl-6 space-y-1">
                  <li>Check your spam or junk folder</li>
                  <li>Make sure you entered the correct email</li>
                  <li>Wait a few minutes for the email to arrive</li>
                </ul>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail("");
                }}
              >
                Try another email
              </Button>
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

        {/* Security Notice */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>
            For security reasons, password reset links expire after 1 hour.
          </p>
        </div>
      </div>

      {/* Footer */}
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
