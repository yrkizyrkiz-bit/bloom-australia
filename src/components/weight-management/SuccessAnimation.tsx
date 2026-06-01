"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, Star, Heart, Flame } from "lucide-react";

interface SuccessAnimationProps {
  show: boolean;
  message?: string;
  subMessage?: string;
  type?: "weight" | "meal" | "exercise" | "milestone" | "streak";
  onComplete?: () => void;
}

// Confetti particle component
function Confetti({ delay, color }: { delay: number; color: string }) {
  const randomX = Math.random() * 200 - 100;
  const randomRotation = Math.random() * 360;

  return (
    <motion.div
      className="absolute w-3 h-3 rounded-sm"
      style={{ backgroundColor: color }}
      initial={{
        y: 0,
        x: 0,
        opacity: 1,
        rotate: 0,
        scale: 1
      }}
      animate={{
        y: [0, -150, 200],
        x: [0, randomX, randomX * 1.5],
        opacity: [1, 1, 0],
        rotate: [0, randomRotation, randomRotation * 2],
        scale: [1, 1.2, 0.5]
      }}
      transition={{
        duration: 2,
        delay,
        ease: "easeOut"
      }}
    />
  );
}

// Floating emoji/icon component
function FloatingIcon({ icon: Icon, delay, color }: { icon: typeof Star; delay: number; color: string }) {
  const randomX = Math.random() * 100 - 50;

  return (
    <motion.div
      className="absolute"
      initial={{ y: 0, x: 0, opacity: 0, scale: 0 }}
      animate={{
        y: -120,
        x: randomX,
        opacity: [0, 1, 1, 0],
        scale: [0, 1.2, 1, 0.5]
      }}
      transition={{
        duration: 1.5,
        delay,
        ease: "easeOut"
      }}
    >
      <Icon className={`w-6 h-6 ${color}`} />
    </motion.div>
  );
}

const CONFETTI_COLORS = [
  "#10b981", // emerald
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#ec4899", // pink
  "#8b5cf6", // violet
  "#06b6d4", // cyan
];

const TYPE_CONFIG = {
  weight: {
    icon: Check,
    iconColor: "text-emerald-500",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    messages: [
      "Logged!",
      "Great job!",
      "Tracked!",
      "You showed up!",
    ]
  },
  meal: {
    icon: Heart,
    iconColor: "text-orange-500",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    messages: [
      "Yum!",
      "Nourished!",
      "Delicious!",
      "Fueled up!",
    ]
  },
  exercise: {
    icon: Flame,
    iconColor: "text-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    messages: [
      "Crushed it!",
      "Strong!",
      "On fire!",
      "Unstoppable!",
    ]
  },
  milestone: {
    icon: Star,
    iconColor: "text-amber-500",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    messages: [
      "Milestone!",
      "Amazing!",
      "You did it!",
      "Incredible!",
    ]
  },
  streak: {
    icon: Flame,
    iconColor: "text-orange-500",
    bgColor: "bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30",
    messages: [
      "On fire!",
      "Streak!",
      "Consistent!",
      "Unstoppable!",
    ]
  },
};

export function SuccessAnimation({
  show,
  message,
  subMessage,
  type = "weight",
  onComplete
}: SuccessAnimationProps) {
  const [displayMessage, setDisplayMessage] = useState("");
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  useEffect(() => {
    if (show) {
      // Pick a random message if none provided
      const messages = config.messages;
      setDisplayMessage(message || messages[Math.floor(Math.random() * messages.length)]);

      // Auto-hide after animation
      const timer = setTimeout(() => {
        onComplete?.();
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [show, message, config.messages, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Success content */}
          <motion.div
            className="relative flex flex-col items-center"
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: -50 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25
            }}
          >
            {/* Confetti */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              {CONFETTI_COLORS.map((color, i) => (
                <Confetti key={`c1-${i}`} delay={i * 0.05} color={color} />
              ))}
              {CONFETTI_COLORS.map((color, i) => (
                <Confetti key={`c2-${i}`} delay={0.1 + i * 0.05} color={color} />
              ))}
            </div>

            {/* Floating icons */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <FloatingIcon icon={Sparkles} delay={0.2} color="text-amber-400" />
              <FloatingIcon icon={Star} delay={0.4} color="text-emerald-400" />
              <FloatingIcon icon={Heart} delay={0.6} color="text-rose-400" />
            </div>

            {/* Main icon */}
            <motion.div
              className={`w-24 h-24 rounded-full ${config.bgColor} flex items-center justify-center mb-4 shadow-xl`}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
                delay: 0.1
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <Icon className={`w-12 h-12 ${config.iconColor}`} />
              </motion.div>
            </motion.div>

            {/* Message */}
            <motion.div
              className="text-center bg-white dark:bg-gray-900 rounded-2xl px-8 py-4 shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.p
                className="text-2xl font-bold text-gray-900 dark:text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {displayMessage}
              </motion.p>
              {subMessage && (
                <motion.p
                  className="text-sm text-muted-foreground mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {subMessage}
                </motion.p>
              )}
            </motion.div>

            {/* Pulse ring effect */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-4 border-emerald-400"
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 1, repeat: 2, repeatDelay: 0.2 }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Simple inline success badge for smaller celebrations
export function SuccessBadge({
  show,
  message = "Done!"
}: {
  show: boolean;
  message?: string;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <motion.div
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Check className="w-4 h-4" />
          </motion.div>
          <span className="font-medium text-sm">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
