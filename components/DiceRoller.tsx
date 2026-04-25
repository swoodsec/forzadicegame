"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onRoll: () => Promise<void>;
  disabled?: boolean;
}

const DICE_UNICODE = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

export default function DiceRoller({ onRoll, disabled }: Props) {
  const [rolling, setRolling] = useState(false);
  const [displayFace, setDisplayFace] = useState<number | null>(null);

  async function handleRoll() {
    if (rolling || disabled) return;
    setRolling(true);
    setDisplayFace(null);

    // Animate random faces during roll
    let ticks = 0;
    const maxTicks = 18;
    const interval = setInterval(() => {
      setDisplayFace(Math.floor(Math.random() * 6));
      ticks++;
      if (ticks >= maxTicks) {
        clearInterval(interval);
      }
    }, 80);

    try {
      await onRoll();
    } finally {
      setTimeout(() => {
        clearInterval(interval);
        setRolling(false);
      }, maxTicks * 80 + 200);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <AnimatePresence mode="wait">
        {rolling && displayFace !== null && (
          <motion.div
            key={displayFace}
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ duration: 0.07 }}
            className="text-8xl select-none dice-scene"
          >
            {DICE_UNICODE[displayFace]}
          </motion.div>
        )}
        {!rolling && (
          <motion.div
            key="idle"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-7xl select-none text-zinc-500"
          >
            🎲
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleRoll}
        disabled={rolling || disabled}
        className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-900 font-bold text-lg rounded-xl transition-colors shadow-lg disabled:cursor-not-allowed"
      >
        {rolling ? "Rolling..." : "Roll Dice"}
      </motion.button>
    </div>
  );
}
