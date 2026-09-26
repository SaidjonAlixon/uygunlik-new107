import localFont from "next/font/local";

/** Dekorativ kursiv/script matnlar uchun — Snell Roundhand */
export const scriptFont = localFont({
  src: "../public/fonts/SnellRoundhand.woff",
  variable: "--font-script",
  display: "swap",
  weight: "400",
  style: "normal",
  fallback: ["cursive"],
});

/** @deprecated scriptFont dan foydalaning */
export const subtitleFont = scriptFont;
