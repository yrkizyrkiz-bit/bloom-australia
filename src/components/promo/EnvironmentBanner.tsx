"use client";

export function EnvironmentBanner() {
  const env = process.env.NEXT_PUBLIC_ENV;

  // Don't show banner in production
  if (!env || env === "production") {
    return null;
  }

  const envConfig = {
    staging: {
      label: "STAGING",
      bgColor: "bg-amber-500",
      textColor: "text-white",
      icon: "🔧",
    },
    preview: {
      label: "PREVIEW",
      bgColor: "bg-purple-600",
      textColor: "text-white",
      icon: "👁️",
    },
    development: {
      label: "DEV",
      bgColor: "bg-blue-600",
      textColor: "text-white",
      icon: "💻",
    },
  };

  const config = envConfig[env as keyof typeof envConfig] || envConfig.preview;

  return (
    <>
      {/* Spacer to push content down */}
      <div className="h-8" />
      {/* Fixed banner */}
      <div className={`fixed top-0 left-0 right-0 z-[100] ${config.bgColor} py-2 text-center shadow-md`}>
        <p className={`text-xs font-bold ${config.textColor} tracking-wider flex items-center justify-center gap-2`}>
          <span>{config.icon}</span>
          <span>{config.label} ENVIRONMENT</span>
          <span className="opacity-75">•</span>
          <span className="font-normal opacity-90">Changes here will not affect production</span>
        </p>
      </div>
    </>
  );
}
