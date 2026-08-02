import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yo‘nalishlar | Uygunlik",
  description:
    "Uyg‘un Boshlanish, Uyg‘un Oila va Uyg‘un Onalik — hayot bosqichingizga mos yo‘nalishni tanlang.",
};

export default function YoNalishlarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
