"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PRICING_PLANS,
  telegramBuyLink,
  type PricingPlan,
} from "@/lib/pricing-plans";
import { cn } from "@/lib/utils";

type PricingPlansGridProps = {
  className?: string;
  buyHref?: (plan: PricingPlan) => string;
};

export function PricingPlansGrid({ className, buyHref }: PricingPlansGridProps) {
  return (
    <div
      className={cn(
        "grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch",
        className
      )}
    >
      {PRICING_PLANS.map((plan, index) => (
        <motion.div
          key={plan.id}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.15 + index * 0.1 }}
          className="h-full"
        >
          <Card
            className={cn(
              "h-full flex flex-col hover:shadow-xl hover:-translate-y-2 transition-all duration-300",
              plan.highlighted
                ? "border-red-500 shadow-lg"
                : "border-red-300"
            )}
          >
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl font-bold text-red-900 uppercase not-italic tracking-wide">
                {plan.name}
              </CardTitle>
              <div className="text-2xl font-bold text-red-800 mb-1 underline decoration-red-800/40 underline-offset-4">
                {plan.priceLabel}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={buyHref?.(plan) ?? telegramBuyLink(plan.name)}
                className="block pt-4"
                target={buyHref?.(plan)?.startsWith("http") ? "_blank" : undefined}
                rel={buyHref?.(plan)?.startsWith("http") ? "noopener noreferrer" : undefined}
              >
                <Button className="w-full bg-red-800 hover:bg-red-900">
                  Sotib olish
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
