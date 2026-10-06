"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { PROGRAM_PATHS } from "@/lib/program-paths";
import { cn } from "@/lib/utils";

type ProgramPathsSectionProps = {
  onPricingClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  showHeader?: boolean;
};

export function ProgramPathsSection({
  onPricingClick,
  showHeader = true,
}: ProgramPathsSectionProps) {
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
            <h2 className="text-3xl md:text-4xl font-bold text-center text-red-900">
              KURS KIMLAR UCHUN?
            </h2>
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

              <div className="mx-auto flex max-w-3xl flex-col gap-6">
                <div className="min-w-0">
                  <div className="mb-6 flex flex-col items-center text-center">
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight text-red-900">
                      {path.name}
                    </h3>

                    <div className="relative mt-5 h-36 w-36 sm:h-40 sm:w-40 md:h-44 md:w-44 shrink-0">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#5D1111]/25 via-[#C4A484]/40 to-[#5D1111]/15 p-[3px] shadow-[0_12px_28px_-12px_rgba(93,17,17,0.55)]">
                        <div className="h-full w-full overflow-hidden rounded-full border-[3px] border-[#FEFBEE] bg-[#FEFBEE]">
                          <img
                            src={path.image}
                            alt=""
                            className="h-full w-full object-cover"
                            style={{
                              objectPosition: path.imagePosition,
                              transform: path.imageZoom ? `scale(${path.imageZoom})` : undefined,
                              transformOrigin: path.imageZoom ? path.imageZoomOrigin ?? path.imagePosition : undefined,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <p className="mt-5 text-lg sm:text-xl font-bold leading-snug text-gray-700">
                      {path.audience}
                    </p>
                  </div>

                  <p className="mt-4 text-[15px] sm:text-base leading-relaxed text-gray-600">
                    {path.intro}
                  </p>

                  <ul className="mt-5 space-y-3">
                    {path.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-3">
                        <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-900/10">
                          <Sparkles className="h-3 w-3 text-red-800" />
                        </span>
                        <span className="text-[15px] sm:text-base leading-relaxed text-gray-600">
                          {benefit}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex justify-center">
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
