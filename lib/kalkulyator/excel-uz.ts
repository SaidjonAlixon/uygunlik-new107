import type { ObservationCard } from "./model";

const o = (value: string) => value.replace(/'/g, "\u2018");

/** Shared-string index → o‘zbekcha matn. Belgilar va sonlar o‘z holicha qoladi. */
export const SHARED_UZ: Record<number, string> = {
  0: "Sikl kuni",
  1: "Buzilish sabablari",
  2: "Shilliq holati",
  3: "Qonli ajralma",
  4: "Loyqa",
  5: "Tiniq",
  6: o("Xom tuxum oqiga o'xshash"),
  7: o("Shilliq cho'qqi kuni"),
  8: o("Bachadon bo'yni — qattiqlik, joyi, ochilishi"),
  9: "Qattiq yoki yumshoq",
  10: "Past yoki yuqori, yopiq yoki ochiq",
  11: o("Tana belgilaridagi o'zgarishlar"),
  12: "Kayfiyat +/-",
  13: o("Og'riq, qorin dam bo'lishi"),
  14: o("Ko'krakdagi taranglik"),
  15: "Serhosil kunlar",
  16: "Er-xotin yaqinligi",
  17: "Sikl davomiyligi",
  18: "Birinchi shilliq kuni",
  19: o("O'lchash vaqti"),
  20: o("O'lchash joyi"),
  21: o("og'iz/orqa teshik/vaginal"),
  22: o("Oldingi kartada harorat ko'tarilishi"),
  23: o("So'nggi 12 sikldagi eng uzun (EU) "),
  25: "Sikl №",
  26: o("Harorat ko'tarilishining 3-kuni"),
  27: o("Taxminiy oxirgi serhosil bo'lmagan kun"),
  28: " siklning birinchi fazasida",
  30: o("So'nggi sikllardagi eng qisqa (EQ)"),
  31: "sikl",
  43: "EQ -",
  44: o("Shilliq cho'qqi kuni + 3 kun"),
  45: "Quruqlik hissi",
  46: "Rang aniqlanmadi",
  47: "Namlik hissi",
  48: "Oq rangli ajralma",
  49: "Quyuq, qaymoqsimon",
  50: o("Ho'llik hissi"),
  52: o(
    "Yangi termometr (YT), Kech o'lchash (K), yoki vaqtli (V), Xastalik (X), Bezovta kecha (BK), Safar/Sayohat (S), Ta'til (T), Sistit/Yallig'lanish (Y), Dori (D), Boshqa sabab (B)"
  ),
  53: "Oy: ",
  54: "Karta №  ",
  55: "Karta № ",
  56: o("Bachadon bo'yni cho'qqi kuni + 3 kun"),
  57: "Yil:                          Sana:",
  58: "Sirpanchiq / moysimon",
  59: o("Bachadon bo'ynining birinchi o'zgarish kuni"),
  60: "Yosh: ",
  61: "Yopishqoq",
  62: o("Bo'lakchali yoki quyuq"),
  63: "Yarim tiniq",
  65: "Ajralma miqdori (1-5)",
  66: o("Hayz ko'rish"),
  67: "harorat",
  68: "omillar",
  69: "serhosil davr",
  70: "Vaqt",
  71: "kech/erta",
  72: "sana",
  73: "Oy",
  74: "yanvar",
  75: "fevral",
  76: "mart",
  77: "aprel",
  78: "may",
  79: "iyun",
  80: "iyul",
  81: "avgust",
  82: "sentabr",
  83: "oktabr",
  84: "noyabr",
  85: "dekabr",
  86: o("og'iz orqali"),
  87: "vaginal",
  88: o("to'g'ri ichak"),
  89: o("Bachadon bo'yni"),
  90: "Qattiq/yumshoq",
  92: "Q",
  96: "Y",
  98: "Sana",
  99: "Harorat",
  100: "Omillar",
  101: "Izoh",
  102: "Yangi termometr",
  103: "YT",
  104: o("Kech o'lchash"),
  105: "K",
  106: "Vaqtli",
  107: "V",
  108: "Xastalik",
  109: "X",
  110: "Bezovta kecha",
  111: "BK",
  112: "Safar/Sayohat",
  113: "S",
  114: o("Ta'til"),
  115: o("Sistit/Yallig'lanish"),
  116: "Y",
  117: "Dori",
  118: "Boshqa sabab",
  119: "B",
  120: "",
  121: "",
  122: "ha",
  123: o("yo'q"),
};

export function translateSharedStrings(xml: string): string {
  let index = 0;
  const translated = xml.replace(/<si>([\s\S]*?)<\/si>/g, (full) => {
    const current = index++;
    if (current === 64) {
      return full.replace("<t>Тип:</t>", "<t>Turi:</t>").replace("<t>растяжимая</t>", `<t>${o("cho'ziluvchan")}</t>`);
    }
    const text = SHARED_UZ[current];
    if (text == null) return full;
    return full.replace(/<t([^>]*)>[\s\S]*?<\/t>/, `<t$1>${escapeXml(text)}</t>`);
  });
  return translated
    .replace(/uniqueCount="205"/, 'uniqueCount="207"')
    .replace("</sst>", "<si><t>T</t></si><si><t>D</t></si></sst>");
}

export function observationSheetName(card: Pick<ObservationCard, "firstName" | "lastName">): string {
  let name = [card.firstName, card.lastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/[\\/?*[\]:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  name = name.replace(/^'+|'+$/g, "").trim();
  if (!name) name = "Karta";
  if (name.length > 31) name = name.slice(0, 31).trim();
  return name;
}

export function formulaSheetName(name: string): string {
  return escapeXml(`'${name.replace(/'/g, "''")}'`);
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function xmlAttr(value: string): string {
  return escapeXml(value).replace(/"/g, "&quot;");
}

export function downloadFileName(card: Pick<ObservationCard, "firstName" | "lastName">): string {
  const base = observationSheetName(card)
    .replace(/[<>:"|]/g, "")
    .trim();
  return `${base || "Karta"}.xlsx`;
}
