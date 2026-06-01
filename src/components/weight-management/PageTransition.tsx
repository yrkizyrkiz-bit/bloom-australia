"use client";

import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode, createContext, useContext, useState, useEffect, useRef } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

// Navigation direction context
interface NavigationContextType {
  direction: number;
  previousIndex: number;
  currentIndex: number;
  setTabIndex: (index: number) => void;
}

const NavigationContext = createContext<NavigationContextType>({
  direction: 0,
  previousIndex: 0,
  currentIndex: 0,
  setTabIndex: () => {},
});

export function useNavigationDirection() {
  return useContext(NavigationContext);
}

// Navigation tabs for index tracking
const TAB_PATHS = [
  "/dashboard/weight-management",
  "/dashboard/weight-management/learn",
  "/dashboard/weight-management/progress",
  "/dashboard/weight-management/treatment",
  "/dashboard/weight-management/support",
];

export function NavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [previousIndex, setPreviousIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      const index = TAB_PATHS.findIndex(p =>
        pathname === p || (p !== TAB_PATHS[0] && pathname?.startsWith(p))
      );
      setCurrentIndex(index >= 0 ? index : 0);
      return;
    }

    const newIndex = TAB_PATHS.findIndex(p =>
      pathname === p || (p !== TAB_PATHS[0] && pathname?.startsWith(p))
    );

    if (newIndex >= 0 && newIndex !== currentIndex) {
      setPreviousIndex(currentIndex);
      setDirection(newIndex > currentIndex ? 1 : -1);
      setCurrentIndex(newIndex);
    }
  }, [pathname, currentIndex]);

  const setTabIndex = (index: number) => {
    if (index !== currentIndex) {
      setPreviousIndex(currentIndex);
      setDirection(index > currentIndex ? 1 : -1);
      setCurrentIndex(index);
    }
  };

  return (
    <NavigationContext.Provider value={{ direction, previousIndex, currentIndex, setTabIndex }}>
      <LayoutGroup>
        {children}
      </LayoutGroup>
    </NavigationContext.Provider>
  );
}

// iOS-like easing curve
const iosEasing: [number, number, number, number] = [0.32, 0.72, 0, 1];

// Direction-aware page variants
const getPageVariants = (direction: number) => ({
  initial: {
    opacity: 0,
    x: direction * 30,
    scale: 0.98,
  },
  enter: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: iosEasing,
    },
  },
  exit: {
    opacity: 0,
    x: direction * -20,
    scale: 0.98,
    transition: {
      duration: 0.25,
      ease: iosEasing,
    },
  },
});

// Fallback variants for non-tab pages
const defaultVariants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: iosEasing,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2,
      ease: iosEasing,
    },
  },
};

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const { direction, currentIndex } = useNavigationDirection();

  // Check if this is a main tab page
  const isTabPage = TAB_PATHS.some(p => pathname === p);
  const variants = isTabPage && direction !== 0 ? getPageVariants(direction) : defaultVariants;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial="initial"
        animate="enter"
        exit="exit"
        variants={variants}
        className="will-change-transform"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Stagger children animation
const containerVariants = {
  initial: {
    opacity: 0,
  },
  enter: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.08,
    },
  },
};

const itemVariants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: iosEasing,
    },
  },
};

// For staggered content animations
export function StaggerContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="enter"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

// Scale animation for cards/buttons with spring physics
export function ScaleOnTap({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.02 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Slide from direction with spring physics
export function SlideIn({
  children,
  direction = "up",
  delay = 0,
  className
}: {
  children: ReactNode;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  className?: string;
}) {
  const directionMap = {
    up: { y: 24, x: 0 },
    down: { y: -24, x: 0 },
    left: { y: 0, x: 24 },
    right: { y: 0, x: -24 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directionMap[direction] }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Fade in animation with spring
export function FadeIn({
  children,
  delay = 0,
  duration = 0.4,
  className
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration,
        delay,
        ease: iosEasing
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Shared element transition for tab indicators
export function TabIndicator({ isActive, layoutId }: { isActive: boolean; layoutId: string }) {
  if (!isActive) return null;

  return (
    <motion.div
      layoutId={layoutId}
      className="absolute inset-0 bg-emerald-50 rounded-lg -z-10"
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 35,
        mass: 1,
      }}
    />
  );
}

// Bottom bar active indicator with smooth sliding
export function BottomTabIndicator({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;

  return (
    <motion.div
      layoutId="bottomTabIndicator"
      className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-emerald-600 rounded-b-full"
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
      }}
    />
  );
}

// Ripple effect for touch feedback
export function TouchRipple({
  children,
  className,
  onTap
}: {
  children: ReactNode;
  className?: string;
  onTap?: () => void;
}) {
  return (
    <motion.div
      className={`relative overflow-hidden ${className}`}
      whileTap={{
        scale: 0.97,
        backgroundColor: "rgba(16, 185, 129, 0.1)"
      }}
      transition={{ duration: 0.15 }}
      onTap={onTap}
    >
      {children}
    </motion.div>
  );
}

// Card hover animation
export function AnimatedCard({
  children,
  className,
  delay = 0
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// List item stagger animation
export function AnimatedListItem({
  children,
  index = 0,
  className
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        delay: index * 0.05,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
