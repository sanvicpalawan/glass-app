"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = (localStorage.getItem("fenestra-theme") as "dark" | "light" | null);
    const initial = saved || "dark";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("fenestra-theme", next);
  }

  return (
    <button className="btn" onClick={toggle} title="Toggle light/dark mode" aria-label="Toggle theme">
      {theme === "dark" ? "☀ Light" : "🌙 Dark"}
    </button>
  );
}
