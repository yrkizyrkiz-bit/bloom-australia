"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

// Program routes by subscription tier
const PROGRAM_ROUTES: Record<string, string> = {
  weight_management: "/dashboard/weight-management",
  womens_health:     "/dashboard/womens-health",
  mens_health:       "/dashboard/mens-health",
  hair_loss:         "/dashboard/mens-health",
  fatty_liver:       "/dashboard/weight-management",
};

function MagicLoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "set-password">("loading");
  const [error, setError] = useState<string>("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userId, setUserId] = useState("");
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setError("Invalid or missing link.");
      return;
    }
    validateToken(token);
  }, [searchParams]);

  async function validateToken(token: string) {
    try {
      const res = await fetch("/api/auth/magic-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setError(data.error || "This link has expired. Please contact support.");
        return;
      }

      setUserId(data.userId);
      setSubscriptionTier(data.subscriptionTier);

      if (data.needsPassword) {
        setStatus("set-password");
      } else {
        // Sign them in directly
        const result = await signIn("credentials", {
          email: data.email,
          magicToken: token,
          redirect: false,
        });

        if (result?.ok) {
          const redirectPath = PROGRAM_ROUTES[data.subscriptionTier || ""] || "/dashboard";
          router.push(redirectPath);
        } else {
          setStatus("error");
          setError("Failed to sign in. Please try again.");
        }
      }
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  }

  async function handleSetPassword() {
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
      });

      if (res.ok) {
        // Sign in with the new password
        const result = await signIn("credentials", {
          email: userId, // Will be resolved by the API
          password,
          redirect: false
        });

        if (result?.ok) {
          const redirectPath = PROGRAM_ROUTES[subscriptionTier || ""] || "/dashboard";
          router.push(redirectPath);
        } else {
          setStatus("error");
          setError("Failed to sign in. Please try logging in manually.");
        }
      } else {
        const data = await res.json();
        setError(data.error || "Failed to set password. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5c7a52] mx-auto" />
          <p className="mt-4 text-[#5c7a52]">Verifying your link...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7]">
        <div className="max-w-sm w-full mx-4 p-8 bg-white rounded-2xl shadow-sm border border-[#e6ebe3] text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-[#2c3628] mb-2">Link Invalid</h1>
          <p className="text-red-600 mb-6">{error}</p>
          <a
            href="/contact"
            className="inline-block px-6 py-3 bg-[#5c7a52] text-white rounded-xl font-medium hover:bg-[#4a6343] transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    );
  }

  if (status === "set-password") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7]">
        <div className="max-w-sm w-full mx-4 p-8 bg-white rounded-2xl shadow-sm border border-[#e6ebe3]">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#e6ebe3] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#5c7a52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-serif text-[#2c3628]">Set Your Password</h1>
            <p className="text-[#5c7a52] mt-2">Choose a secure password for your portal access</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#2c3628] mb-1">Password</label>
              <input
                type="password"
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-[#e6ebe3] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#5c7a52] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2c3628] mb-1">Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-[#e6ebe3] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#5c7a52] focus:border-transparent"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>
            )}

            <button
              onClick={handleSetPassword}
              className="w-full bg-[#5c7a52] text-white py-4 rounded-xl font-semibold hover:bg-[#4a6343] transition-colors"
            >
              Access My Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function MagicLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5c7a52]" />
      </div>
    }>
      <MagicLoginContent />
    </Suspense>
  );
}
