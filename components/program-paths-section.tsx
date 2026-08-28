"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { scriptFont } from "@/lib/fonts";
import { PROGRAM_PATHS } from "@/lib/program-paths";
import { cn } from "@/lib/utils";

type ProgramPathsSectionProps = {
  onPricingClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  showHeader?: boolean;
};

export function ProgramPathsSection({ onPricingClick, showHeader = true }: ProgramPathsSectionProps) {
  return (
    <section
      id="paths"
      className="relative overflow-hidden py-16 sm:py-20 -mt-8 scroll-mt-24"
    >
      <div className="absolute inset-0 z-0" aria-hidden>
        <div
          className="hidden md:block w-full h-full opacity-60"
          style={{
            backgroundImage: "url(/images/fon.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
          }}
        />
        <div
          className="md:hidden w-full h-full opacity-50"
          style={{
            backgroundImage: "url(/images/fon.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-[#FEFBEE]/55" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 max-w-6xl">
        {showHeader && (
        <motion.div
          className="text-center mb-12 sm:mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p
            className={cn(
              "text-sm sm:text-base tracking-[0.2em] uppercase text-[#7A2E2E]/70",
              scriptFont.className
            )}
          >
            Uch yo‘nalish · bir maqsad
          </p>
          <h2
            className="mt-3 text-3xl sm:text-4xl md:text-5xl text-[#5D1111]"
            style={{ fontFamily: "Bergstena Decorated, serif" }}
          >
            Yo‘nalishlar
          </h2>
          <p
            className={cn(
              "mt-3 mx-auto max-w-2xl text-lg sm:text-xl not-italic text-[#7A2E2E]/85",
              scriptFont.className
            )}
          >
            Hayot bosqichingizga mos yo‘nalishni tanlang
          </p>
        </motion.div>
        )}

        <div className="space-y-8 sm:space-y-10">
          {PROGRAM_PATHS.map((path, index) => (
            <motion.article
              key={path.id}
              id={`path-${path.id}`}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: index * 0.05 }}
              className={cn(
                "relative overflow-hidden rounded-[1.75rem]",
                "bg-gradient-to-br from-white/85 via-[#FFF8EC]/92 to-[#F7E8C9]/55",
                "border border-[#5D1111]/10",
                "shadow-[0_24px_60px_-36px_rgba(93,17,17,0.4)]",
                "px-5 py-7 sm:px-9 sm:py-10"
              )}
            >
              <span
                aria-hidden
                className="absolute left-0 top-7 bottom-7 w-1 rounded-full bg-gradient-to-b from-[#5D1111] via-[#8B2E2E] to-[#5D1111]/30"
              />

              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 lg:gap-10">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#5D1111]/[0.08] text-xs font-bold tracking-wider text-[#5D1111]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={cn(
                        "text-sm sm:text-base not-italic text-[#7A2E2E]/80",
                        scriptFont.className
                      )}
                    >
                      {path.audience}
                    </span>
                  </div>

                  <h3
                    className="text-2xl sm:text-3xl md:text-4xl text-[#5D1111] leading-tight"
                    style={{ fontFamily: "Bergstena Decorated, serif" }}
                  >
                    {path.name}
                  </h3>

                  <p className="mt-4 max-w-3xl text-[15px] sm:text-base leading-relaxed text-[#5D1111]/80">
                    {path.intro}
                  </p>

                  <ul className="mt-5 space-y-3">
                    {path.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-3">
                        <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#5D1111]/[0.08]">
                          <Sparkles className="h-3 w-3 text-[#8B2E2E]" />
                        </span>
                        <span className="text-[15px] sm:text-base leading-relaxed text-[#5D1111]/85">
                          {benefit}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="lg:pt-8 lg:w-52 shrink-0 flex lg:justify-end">
                  <Link
                    href="#pricing"
                    onClick={onPricingClick}
                    className={cn(
                      "group inline-flex items-center gap-2",
                      "rounded-full bg-[#5D1111] px-5 py-3",
                      "text-sm font-semibold text-[#FEFBEE]",
                      "shadow-[0_12px_28px_-14px_rgba(93,17,17,0.8)]",
                      "hover:bg-[#7A2E2E] transition-colors"
                    )}
                  >
                    Narx bilan tanishish
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
