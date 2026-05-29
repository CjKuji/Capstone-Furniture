"use client";

import { motion, useInView } from "framer-motion";
import { useRef, isValidElement } from "react";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Delay in seconds before animation starts */
  delay?: number;
  /** Direction the element slides from */
  from?: "bottom" | "left" | "right" | "none";
  /** Custom class for the wrapper */
  className?: string;
  /** Amount of element that must be visible before triggering (0–1) */
  threshold?: number;
};

export default function Reveal({
  children,
  delay = 0,
  from = "bottom",
  className,
  threshold = 0.15,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: threshold });

  const initialOffset = {
    bottom: { y: 32, x: 0 },
    left:   { y: 0,  x: -32 },
    right:  { y: 0,  x: 32 },
    none:   { y: 0,  x: 0 },
  }[from];

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, ...initialOffset }}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Stagger helper — wraps a list and offsets each child's delay */
export function RevealList({
  children,
  stagger = 0.08,
  baseDelay = 0,
  from = "bottom",
  className,
}: {
  children: ReactNode[];
  stagger?: number;
  baseDelay?: number;
  from?: Props["from"];
  className?: string;
}) {
  return (
    <>
      {children.map((child, i) => {
        // Safe check: If the child has a dedicated key, preserve it to protect 3D Canvas elements
        const stableKey = isValidElement(child) && child.key ? child.key : i;
        
        return (
          <Reveal key={`reveal-${stableKey}`} delay={baseDelay + i * stagger} from={from} className={className}>
            {child}
          </Reveal>
        );
      })}
    </>
  );
}