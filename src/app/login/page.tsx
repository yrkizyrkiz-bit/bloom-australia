"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { MEMBER_PROGRAMS_HOME } from "@/lib/portal/member-home";
import { resolveStaffPortalHome } from "@/lib/portal/staff-home";
import { toast } from "sonner";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  FlaskConical,
  TrendingUp,
  Shield,
  CheckCircle2,
  ScanFace,
} from "lucide-react";
import { loginWithFaceId, webauthnErrorMessage } from "@/lib/webauthn/client";
import {
  canUseFaceId,
  clearFaceIdSetupOnThisDevice,
  getFaceIdEmailOnThisDevice,
  isFaceIdSetupOnThisDevice,
  markFaceIdSetupOnThisDevice,
} from "@/lib/webauthn/device";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showFaceId, setShowFaceId] = useState(false);
  const [faceIdLoading, setFaceIdLoading] = useState(false);
  const { login, loginWithPasskey, user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  // Prefill email from Remember me or from a prior Face ID setup on this phone.
  useEffect(() => {
    const savedEmail = localStorage.getItem("sanative_remembered_email");
    const faceIdEmail = getFaceIdEmailOnThisDevice();
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    } else if (faceIdEmail) {
      setEmail(faceIdEmail);
    }
  }, []);

  // Face ID login only when this account/device already has Face ID set up.
  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        const capable = await canUseFaceId();
        if (!capable) {
          if (!cancelled) setShowFaceId(false);
          return;
        }

        if (isFaceIdSetupOnThisDevice()) {
          if (!cancelled) setShowFaceId(true);
          return;
        }

        const trimmed = email.trim().toLowerCase();
        if (!trimmed.includes("@")) {
          if (!cancelled) setShowFaceId(false);
          return;
        }

        try {
          const res = await fetch("/api/auth/webauthn/available", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: trimmed }),
          });
          const data = await res.json().catch(() => ({}));
          if (!cancelled) setShowFaceId(Boolean(data.available));
        } catch {
          if (!cancelled) setShowFaceId(false);
        }
      })();
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [email]);

  // Handle redirect when user is already authenticated (e.g. revisit /login)
  useEffect(() => {
    if (user && !isAuthLoading && !isLoading) {
      setIsRedirecting(true);
      const targetPath =
        user.role === "DOCTOR" || ["admin", "ADMIN", "CARE_PARTNER"].includes(user.role)
          ? resolveStaffPortalHome(user.role)
          : MEMBER_PROGRAMS_HOME;
      router.replace(targetPath);
    }
  }, [user, isAuthLoading, isLoading, router]);

  // Show loading while checking auth or redirecting
  if (isAuthLoading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#5c7a52]" />
          <p className="text-[#7e9a72] promo-body">
            {isRedirecting ? "Redirecting to dashboard..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  // Parse and improve error messages
  const getReadableError = (error: string): string => {
    const errorLower = error.toLowerCase();

    if (errorLower.includes("invalid email or password") || errorLower.includes("credentialssignin")) {
      return "The email or password you entered is incorrect. Please check and try again.";
    }
    if (errorLower.includes("email and password are required")) {
      return "Please enter both your email and password.";
    }
    if (errorLower.includes("user not found") || errorLower.includes("no user")) {
      return "No account found with this email address. Please check your email or create a new account.";
    }
    if (errorLower.includes("too many") || errorLower.includes("rate limit")) {
      return "Too many login attempts. Please wait a few minutes and try again.";
    }
    if (errorLower.includes("network") || errorLower.includes("fetch")) {
      return "Unable to connect to the server. Please check your internet connection.";
    }
    if (errorLower.includes("session") || errorLower.includes("expired")) {
      return "Your session has expired. Please sign in again.";
    }
    if (errorLower.includes("face id")) {
      return error;
    }

    return error || "An unexpected error occurred. Please try again.";
  };

  const redirectAfterLogin = (role?: string) => {
    setIsRedirecting(true);
    const targetPath =
      role === "DOCTOR" || ["admin", "ADMIN", "CARE_PARTNER"].includes(role || "")
        ? resolveStaffPortalHome(role || "")
        : MEMBER_PROGRAMS_HOME;
    router.replace(targetPath);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError(null);

    // Basic validation
    if (!email.trim()) {
      setLoginError("Please enter your email address.");
      setIsLoading(false);
      return;
    }
    if (!password) {
      setLoginError("Please enter your password.");
      setIsLoading(false);
      return;
    }

    const result = await login(email, password);

    if (result.success) {
      // Save or clear remembered email
      if (rememberMe) {
        localStorage.setItem("sanative_remembered_email", email);
      } else {
        localStorage.removeItem("sanative_remembered_email");
      }

      toast.success("Welcome back!", {
        description: "You're being redirected to your dashboard."
      });
      redirectAfterLogin(result.role);
    } else {
      const readableError = getReadableError(result.error || "Login failed");
      setLoginError(readableError);
      toast.error("Login failed", {
        description: readableError
      });
      setIsLoading(false);
    }
  };

  const handleFaceIdLogin = async () => {
    setFaceIdLoading(true);
    setLoginError(null);
    try {
      const trimmedEmail = (email.trim() || getFaceIdEmailOnThisDevice() || "").toLowerCase();
      if (!trimmedEmail) {
        const readableError = "Enter your email, then tap Face ID.";
        setLoginError(readableError);
        toast.error("Face ID login failed", { description: readableError });
        return;
      }
      if (!email.trim()) setEmail(trimmedEmail);
      const webauthnToken = await loginWithFaceId(trimmedEmail);
      const result = await loginWithPasskey(webauthnToken);
      if (result.success) {
        markFaceIdSetupOnThisDevice(trimmedEmail);
        if (rememberMe) {
          localStorage.setItem("sanative_remembered_email", trimmedEmail);
        }
        toast.success("Welcome back!", {
          description: "You're being redirected to your dashboard.",
        });
        redirectAfterLogin(result.role);
        return;
      }
      if ((result.error || "").toLowerCase().includes("not set up")) {
        clearFaceIdSetupOnThisDevice();
        setShowFaceId(false);
      }
      const readableError = getReadableError(result.error || "Face ID login failed");
      setLoginError(readableError);
      toast.error("Face ID login failed", { description: readableError });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.toLowerCase().includes("not set up")) {
        clearFaceIdSetupOnThisDevice();
        setShowFaceId(false);
      }
      const readableError = webauthnErrorMessage(error, "Face ID login failed");
      setLoginError(readableError);
      toast.error("Face ID login failed", { description: readableError });
    } finally {
      setFaceIdLoading(false);
    }
  };

  const features = [
    { icon: FlaskConical, title: "85+ Biomarkers", desc: "Comprehensive health tracking" },
    { icon: TrendingUp, title: "Trend Analysis", desc: "Track progress over time" },
    { icon: Shield, title: "Secure & Private", desc: "Bank-level encryption" },
    { icon: CheckCircle2, title: "Expert Insights", desc: "Personalized recommendations" },
  ];

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      {/* Header */}
      <header className="border-b border-[#e6ebe3] bg-[#fdfbf7]/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e6ebe3] to-[#cdd8c6] flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-[#5c7a52]" />
              </div>
              <span className="text-2xl lg:text-3xl font-serif tracking-tight text-[#34412f] promo-heading">
                sanative
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/#membership"
                className="text-[15px] text-[#34412f] hover:text-[#5c7a52] transition-colors promo-body"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-[#e6ebe3] rounded-full px-4 py-2">
                <div className="w-2 h-2 rounded-full bg-[#5c7a52] animate-pulse" />
                <span className="text-sm font-medium text-[#5c7a52] promo-body">Member Portal</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl text-[#2c3628] leading-tight promo-heading">
                Your health data,{" "}
                <span className="text-[#c17a58] italic">decoded</span>
              </h1>

              <p className="text-lg text-[#5c7a52] max-w-lg promo-body">
                Access your biomarker results, track trends over time, and get personalized insights to optimize your health.
              </p>
            </div>

            {/* Features */}
            <div className="grid sm:grid-cols-2 gap-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-[#e6ebe3] hover:border-[#cdd8c6] transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e6ebe3] to-[#cdd8c6] flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-[#5c7a52]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#2c3628] promo-body">{feature.title}</h3>
                    <p className="text-sm text-[#7e9a72] promo-body">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Login Form */}
          <div className="lg:pl-8">
            <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl border border-[#e6ebe3] overflow-hidden">
              {/* Card Header */}
              <div className="text-center p-8 pb-6 border-b border-[#e6ebe3] bg-gradient-to-b from-[#f4f7f2] to-white">
                <h2 className="text-2xl text-[#2c3628] promo-heading">Welcome back</h2>
                <p className="mt-2 text-[#7e9a72] promo-body">
                  Sign in to access your health dashboard
                </p>
              </div>

              {/* Card Content */}
              <div className="p-8">
                <form onSubmit={handleLogin} className="space-y-5">
                  {/* Error Alert */}
                  {loginError && (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <p className="text-sm promo-body">{loginError}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-[#2c3628] promo-body">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setLoginError(null);
                      }}
                      required
                      className={`w-full px-4 py-3.5 rounded-xl border ${
                        loginError ? 'border-red-300' : 'border-[#cdd8c6]'
                      } bg-white focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20 outline-none transition-all promo-body`}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="block text-sm font-medium text-[#2c3628] promo-body">
                        Password
                      </label>
                      <Link
                        href="/forgot-password"
                        className="text-xs text-[#c17a58] hover:text-[#a9634a] transition-colors promo-body"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setLoginError(null);
                        }}
                        required
                        className={`w-full px-4 py-3.5 pr-12 rounded-xl border ${
                          loginError ? 'border-red-300' : 'border-[#cdd8c6]'
                        } bg-white focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20 outline-none transition-all promo-body`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7e9a72] hover:text-[#5c7a52] transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me Checkbox */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setRememberMe(!rememberMe)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        rememberMe
                          ? 'bg-[#5c7a52] border-[#5c7a52]'
                          : 'border-[#cdd8c6] hover:border-[#5c7a52]'
                      }`}
                    >
                      {rememberMe && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <span className="text-sm text-[#5c7a52] promo-body">Remember my email</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || faceIdLoading}
                    className="w-full py-4 bg-[#5c7a52] text-white font-medium rounded-xl hover:bg-[#4a6243] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 promo-body"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign in
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
                {showFaceId && (
                  <div className="mt-5 space-y-3">
                    <div className="flex items-center gap-3 text-[#7e9a72]">
                      <div className="h-px flex-1 bg-[#e6ebe3]" />
                      <span className="text-xs promo-body">or</span>
                      <div className="h-px flex-1 bg-[#e6ebe3]" />
                    </div>
                    <button
                      type="button"
                      onClick={handleFaceIdLogin}
                      disabled={isLoading || faceIdLoading}
                      className="w-full py-4 border border-[#cdd8c6] text-[#2c3628] font-medium rounded-xl hover:bg-[#f4f7f2] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 promo-body"
                    >
                      {faceIdLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Waiting for Face ID...
                        </>
                      ) : (
                        <>
                          <ScanFace className="w-5 h-5 text-[#5c7a52]" />
                          Face ID
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="p-6 pt-0 space-y-4">
                <div className="text-center text-sm text-[#7e9a72] promo-body">
                  Don&apos;t have an account?{" "}
                  <Link href="/#membership" className="text-[#c17a58] hover:text-[#a9634a] font-medium transition-colors">
                    Get started
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#e6ebe3] bg-[#f4f7f2] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-serif text-[#34412f] promo-heading">sanative</span>
              <span className="text-sm text-[#7e9a72] promo-body">Health Pty Ltd</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[#7e9a72] promo-body">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5c7a52]" />
                AHPRA Compliant
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5c7a52]" />
                TGA Registered
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5c7a52]" />
                Australian Owned
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
