export type PricingPlan = {
  id: string;
  name: string;
  priceLabel: string;
  priceAmount: number;
  features: string[];
  highlighted?: boolean;
};

/** Landing / pricing sahifalaridagi tariflar — bitta manba */
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "boshlanish",
    name: "Uyg‘un Boshlanish",
    priceLabel: "3.999.000 UZS",
    priceAmount: 3_999_000,
    features: [
      "Simptotermal metod darslari",
      "Ayollik Fiqhi darslari",
      "Bonus dars “Yoni-steam”",
      "4 oy davomida kurs materiallariga kirish",
      "1 ta to‘liq hayz xaritasi kuzatuvi",
      "Foydalanuvchi sertifikati (o‘qitish huquqisiz)",
    ],
  },
  {
    id: "oila",
    name: "Uyg‘un Oila",
    priceLabel: "4.999.000 UZS",
    priceAmount: 4_999_000,
    features: [
      "Simptotermal metod darslari",
      "Ayollik Fiqhi darslari",
      "Bonus dars “Yoni-steam”",
      "Juftlar munosabati bo‘yicha dars",
      "Sog‘lom Ayollik Sirlari darsi",
      "5 oy davomida kurs materiallariga kirish",
      "1 ta to‘liq hayz xaritasi kuzatuvi",
      "Foydalanuvchi sertifikati (o‘qitish huquqisiz)",
    ],
    highlighted: true,
  },
  {
    id: "onalik",
    name: "Uyg‘un Onalik",
    priceLabel: "5.999.000 UZS",
    priceAmount: 5_999_000,
    features: [
      "Simptotermal metod darslari",
      "Ayollik Fiqhi darslari",
      "Bonus dars “Yoni-steam”",
      "Juftlar munosabati bo‘yicha dars",
      "Sog‘lom Ayollik Sirlari darsi",
      "To‘g‘ri emizish va oson sutdan chiqarish mahorati",
      "6 oy davomida kurs materiallariga kirish",
      "STM xaritasi kuzatuvi (hayz tiklanmagan holatda)",
      "Foydalanuvchi sertifikati (o‘qitish huquqisiz)",
    ],
  },
];

export function telegramBuyLink(planName: string, userName?: string) {
  const who = userName ? `Men ${userName}` : "Men";
  const text = `Assalomu alaykum yaxshimisiz. ${who} sizning ${planName} kursingizni sotib olmoqchiman.`;
  return `https://t.me/stm_kurs?text=${encodeURIComponent(text)}`;
}
