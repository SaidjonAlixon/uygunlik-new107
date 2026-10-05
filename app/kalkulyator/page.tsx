import type { Metadata } from "next";
import { KalkulyatorApp } from "@/components/kalkulyator/kalkulyator-app";

export const metadata: Metadata = {
  title: "Kalkulyator — Uyg‘unlik",
  description: "40 kunlik bazal tana harorati va sikl kuzatuvi. Ma’lumot saqlanadi va Excel yuklab olinadi.",
};

export default function KalkulyatorPage() {
  return <KalkulyatorApp />;
}
