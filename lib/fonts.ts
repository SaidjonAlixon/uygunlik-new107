import { Cormorant_Garamond } from "next/font/google";

export const subtitleFont = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-subtitle",
});
