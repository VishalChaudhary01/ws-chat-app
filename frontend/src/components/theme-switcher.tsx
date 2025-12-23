import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "../lib/utils";
import { Moon, Sun } from "lucide-react";

export function ThemeSwitcher() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark((prev) => !prev)}
      className={cn(
        "shadow-base flex w-11 cursor-pointer items-center rounded-full border border-gray-400 p-0.5",
        isDark ? "justify-end" : "justify-start",
      )}
    >
      <motion.div
        layout
        transition={{
          type: "spring",
          duration: 0.3,
          bounce: 0.3,
        }}
        className="flex items-center rounded-full"
      >
        {isDark ? (
          <Moon className="size-5 text-neutral-300" />
        ) : (
          <Sun className="size-5 text-neutral-500" />
        )}
      </motion.div>
    </button>
  );
}
