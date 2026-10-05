export type ProgramPath = {
  id: string;
  name: string;
  audience: string;
  intro: string;
  benefits: string[];
  pricingHref: string;
  image: string;
};

/** Uch hayot bosqichi — asosiy saytdagi Yo‘nalishlar bo‘limi */
export const PROGRAM_PATHS: ProgramPath[] = [
  {
    id: "boshlanish",
    name: "Uyg‘un Boshlanish",
    audience: "Turmush qurish yoshidagi qizlar uchun",
    image: "/images/icons/uygun-boshlanish.jpg",
    intro:
      "Ayollikni tushunish — turmush qurgandan keyin emas, undan oldin boshlanadi. Turmush qurmasdan oldin Simptotermal metodni o‘rgansangiz:",
    benefits: [
      "Hayz siklingiz qanday ishlashini chuqur tushunasiz",
      "Kelajakdagi turmush o‘rtog‘ingiz bilan farzand rejalashtirish masalasida ishonchli qaror qabul qilish uchun zarur bilimlarni olasiz",
      "Unumdor va unumdor bo‘lmagan kunlarni ilmiy asosda aniqlashni o‘rganasiz",
      "Ayollik salomatligingizni kuzatish odatini shakllantirasiz va organizmingizdagi o‘zgarishlarni erta payqashni o‘rganasiz",
      "Spiral va boshqa kontrasepsiya vositalarining zararini oldindan tushunib yetasiz",
    ],
    pricingHref: "#pricing",
  },
  {
    id: "oila",
    name: "Uyg‘un Oila",
    audience: "Turmush qurgan ayollar uchun",
    image: "/images/icons/uygun-oila.jpg",
    intro:
      "Farzandni qachon kutib olish yoki homiladorlikni tabiiy yo‘l bilan ortga surish — bu er-xotinning eng muhim qarorlaridan biridir. Simptotermal metod bilan siz:",
    benefits: [
      "Homiladorlikni rejalashtirish yoki tabiiy yo‘l bilan ortga surish qoidalarini o‘rganasiz",
      "Unumdor va unumdor bo‘lmagan kunlarni yuqori aniqlik bilan aniqlashni o‘rganasiz",
      "Farzand rejalashtirishda mas’uliyatni turmush o‘rtog‘ingiz bilan birgalikda bo‘lishish va o‘zaro ishonchni mustahkamlashni o‘rganasiz",
      "Reproduktiv salomatligingizni har bir siklda kuzatib borish va organizmingizdagi muhim o‘zgarishlarni erta payqash ko‘nikmasini hosil qilasiz",
      "Sog‘lig‘ingizga zarar berayotgan spiral va boshqa kontrasepsiya vositalarisiz yashashni o‘rganasiz",
    ],
    pricingHref: "#pricing",
  },
  {
    id: "onalik",
    name: "Uyg‘un Onalik",
    audience: "Tug‘ruqdan keyin hayzi hali tiklanmagan onalar uchun",
    image: "/images/icons/uygun-onalik.jpg",
    intro:
      "Tug‘ruqdan keyingi davr ayol organizmidagi eng o‘zgaruvchan bosqichlardan biridir. Ayniqsa emizish davrida fertil belgilarni tushunish ko‘plab savollarni tug‘diradi. Simptotermal metod qoidalarini o‘rganib:",
    benefits: [
      "Tug‘ruqdan keyingi organizmda kechadigan tabiiy o‘zgarishlarni tushunasiz",
      "Emizish davrida unumdorlik belgilarini to‘g‘ri kuzatishni o‘rganasiz",
      "Birinchi ovulyatsiya va hayz tiklanishini oldindan aniqlashni o‘rganasiz",
      "Farzandlar orasidagi tanaffusni tabiiy va ilmiy asoslangan usulda rejalashtirish imkoniga ega bo‘lasiz",
      "O‘z salomatligingizni ishonch bilan kuzatib, bu davrni xotirjam o‘tkazasiz",
    ],
    pricingHref: "#pricing",
  },
];
