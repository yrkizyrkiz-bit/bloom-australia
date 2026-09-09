"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GEORGE_ALT, GEORGE_IMAGE_SRC, GEORGE_NAME } from "@/lib/george";

const SIZE_PX = {
  xs: 28,
  sm: 40,
  md: 64,
  lg: 112,
  xl: 160,
} as const;

type GeorgeSize = keyof typeof SIZE_PX;

type GeorgeMascotProps = {
  size?: GeorgeSize;
  className?: string;
  /** Focus on the scribble face for tiny circular avatars. */
  cropFace?: boolean;
  /** Soft idle bounce — good for chat header / insight card. */
  idle?: boolean;
  /** Bigger bounce + wiggle — used while cheering. */
  cheering?: boolean;
  showName?: boolean;
  priority?: boolean;
};

export function GeorgeMascot({
  size = "md",
  className,
  cropFace = false,
  idle = false,
  cheering = false,
  showName = false,
  priority = false,
}: GeorgeMascotProps) {
  const px = SIZE_PX[size];

  const motionProps = cheering
    ? {
        animate: {
          y: [0, -28, 0, -18, 0, -10, 0],
          rotate: [0, -10, 10, -8, 8, -4, 0],
          scale: [1, 1.12, 1, 1.08, 1, 1.04, 1],
        },
        transition: {
          duration: 1.35,
          ease: "easeInOut" as const,
          repeat: 1,
          repeatType: "loop" as const,
        },
      }
    : idle
      ? {
          animate: { y: [0, -6, 0] },
          transition: {
            duration: 2.4,
            ease: "easeInOut" as const,
            repeat: Infinity,
            repeatType: "mirror" as const,
          },
        }
      : {};

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <motion.div
        className={cn(
          "relative overflow-hidden bg-white shadow-sm",
          cropFace ? "rounded-full" : "rounded-2xl",
          cheering && "drop-shadow-lg"
        )}
        style={{ width: px, height: px }}
        {...motionProps}
      >
        <Image
          src={GEORGE_IMAGE_SRC}
          alt={GEORGE_ALT}
          width={px}
          height={px}
          priority={priority}
          className={cn(
            "h-full w-full",
            cropFace ? "object-cover object-[center_28%]" : "object-contain p-1"
          )}
        />
      </motion.div>
      {showName ? (
        <span className="mt-1 text-sm font-semibold text-[#4a6243]">{GEORGE_NAME}</span>
      ) : null}
    </div>
  );
}
