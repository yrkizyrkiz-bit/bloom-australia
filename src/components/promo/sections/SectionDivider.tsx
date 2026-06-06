interface SectionDividerProps {
  fromColor?: string;
  toColor?: string;
  variant?: "wave" | "curve" | "botanical";
  flip?: boolean;
}

export function SectionDivider({
  fromColor = "#dce4d6",
  toColor = "#fdfbf7",
  variant = "wave",
  flip = false,
}: SectionDividerProps) {
  if (variant === "wave") {
    return (
      <div
        className={`relative w-full h-24 md:h-32 lg:h-40 overflow-hidden ${flip ? "rotate-180" : ""}`}
        style={{ backgroundColor: toColor }}
      >
        <svg
          className="absolute bottom-0 w-full h-full"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main wave */}
          <path
            d="M0 120V60C120 80 240 90 360 85C480 80 600 60 720 50C840 40 960 45 1080 55C1200 65 1320 80 1380 87.5L1440 95V120H0Z"
            fill={fromColor}
          />
          {/* Secondary softer wave for depth */}
          <path
            d="M0 120V75C180 85 360 95 540 88C720 81 900 68 1080 65C1260 62 1380 70 1440 75V120H0Z"
            fill={fromColor}
            fillOpacity="0.5"
          />
        </svg>

        {/* Decorative elements */}
        <div
          className="absolute top-1/2 left-1/4 w-32 h-32 rounded-full blur-3xl opacity-30"
          style={{ backgroundColor: "#7e9a72" }}
        />
        <div
          className="absolute top-1/3 right-1/3 w-24 h-24 rounded-full blur-2xl opacity-20"
          style={{ backgroundColor: "#c17a58" }}
        />
      </div>
    );
  }

  if (variant === "curve") {
    return (
      <div
        className={`relative w-full h-20 md:h-28 lg:h-36 overflow-hidden ${flip ? "rotate-180" : ""}`}
        style={{ backgroundColor: toColor }}
      >
        <svg
          className="absolute bottom-0 w-full h-full"
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 100V0C360 60 720 80 1080 60C1260 50 1380 35 1440 25V100H0Z"
            fill={fromColor}
          />
        </svg>
      </div>
    );
  }

  // Botanical variant with leaf-like organic shapes
  return (
    <div
      className={`relative w-full h-28 md:h-36 lg:h-44 overflow-hidden ${flip ? "rotate-180" : ""}`}
      style={{ backgroundColor: toColor }}
    >
      <svg
        className="absolute bottom-0 w-full h-full"
        viewBox="0 0 1440 140"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Organic flowing base */}
        <path
          d="M0 140V80C100 75 200 85 320 70C440 55 520 40 640 45C760 50 880 75 1000 65C1120 55 1200 40 1280 50C1360 60 1400 75 1440 80V140H0Z"
          fill={fromColor}
        />
        {/* Leaf-like accent */}
        <ellipse
          cx="720"
          cy="90"
          rx="180"
          ry="25"
          fill="#7e9a72"
          fillOpacity="0.15"
        />
        <ellipse
          cx="400"
          cy="75"
          rx="120"
          ry="18"
          fill="#5c7a52"
          fillOpacity="0.1"
        />
        <ellipse
          cx="1100"
          cy="70"
          rx="140"
          ry="20"
          fill="#5c7a52"
          fillOpacity="0.1"
        />
      </svg>

      {/* Floating botanical accents */}
      <div className="absolute top-1/2 left-[15%] w-2 h-2 rounded-full bg-[#7e9a72]/40" />
      <div className="absolute top-1/3 left-[35%] w-1.5 h-1.5 rounded-full bg-[#5c7a52]/30" />
      <div className="absolute top-2/3 right-[25%] w-2.5 h-2.5 rounded-full bg-[#a8bb9e]/50" />
      <div className="absolute top-1/2 right-[40%] w-1.5 h-1.5 rounded-full bg-[#c17a58]/25" />
    </div>
  );
}
