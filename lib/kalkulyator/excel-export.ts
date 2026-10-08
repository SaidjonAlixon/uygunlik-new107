import fs from "fs";
import path from "path";
import { inflateRawSync } from "zlib";
import {
  applyStartDate,
  cardSheetName,
  createEmptyCard,
  DAY_COUNT,
  deriveStats,
  displayDayNumber,
  factorExcelCode,
  MONTHS,
  rememberMonth,
  type DayEntry,
  type MucusKey,
  type ObservationCard,
} from "./model";
import { formulaSheetName, observationSheetName, translateSharedStrings, xmlAttr } from "./excel-uz";
import { patchZip } from "./zip-patch";

const TEMPLATE_PATH = path.join(process.cwd(), "templates", "blank-nablyudeniy.xlsx");

const MUCUS_ROW: Record<MucusKey, number> = {
  menstruation: 41,
  spotting: 42,
  dry: 43,
  colorUnclear: 44,
  moist: 45,
  white: 46,
  cloudy: 47,
  creamy: 48,
  sticky: 49,
  lumpy: 50,
  wet: 51,
  slippery: 52,
  semiClear: 53,
  clear: 54,
  stretchy: 55,
  eggwhite: 56,
};

const MARK = "х";

function columnName(index: number): string {
  let n = index;
  let name = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

function dayColumn(day: number): string {
  return columnName(day + 1);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

type CellValue = { kind: "blank" } | { kind: "num"; value: number } | { kind: "text"; value: string };

function cellPattern(ref: string): RegExp {
  return new RegExp(`<c r="${ref}"([^>]*?)(?:/>|>([\\s\\S]*?)</c>)`);
}

function setCell(xml: string, ref: string, value: CellValue): string {
  const match = xml.match(cellPattern(ref));
  if (match && /<f[\s>]/.test(match[2] || "")) return xml;
  const style = match?.[1]?.match(/\ss="(\d+)"/);
  const styleAttr = style ? ` s="${style[1]}"` : "";
  let next: string;
  if (value.kind === "blank") {
    next = `<c r="${ref}"${styleAttr}/>`;
  } else if (value.kind === "num") {
    next = `<c r="${ref}"${styleAttr}><v>${value.value}</v></c>`;
  } else {
    next = `<c r="${ref}"${styleAttr} t="inlineStr"><is><t xml:space="preserve">${escapeXml(value.value)}</t></is></c>`;
  }
  if (match) return xml.replace(match[0], next);

  const row = ref.replace(/[A-Z]/g, "");
  const col = ref.replace(/[0-9]/g, "");
  const rowRe = new RegExp(`(<row r="${row}"[^>]*>)([\\s\\S]*?)(</row>)`);
  const rowMatch = xml.match(rowRe);
  if (!rowMatch) return xml;
  const body = rowMatch[2];
  const cells = [...body.matchAll(/<c r="([A-Z]+)[0-9]+"/g)];
  const target = columnIndex(col);
  let insertAt = body.length;
  for (const cell of cells) {
    if (columnIndex(cell[1]) > target) {
      insertAt = cell.index ?? body.length;
      break;
    }
  }
  const updated = body.slice(0, insertAt) + next + body.slice(insertAt);
  return xml.replace(rowMatch[0], `${rowMatch[1]}${updated}${rowMatch[3]}`);
}

function columnIndex(name: string): number {
  let n = 0;
  for (const char of name) n = n * 26 + (char.charCodeAt(0) - 64);
  return n;
}

function textOrBlank(value: string): CellValue {
  const trimmed = value.trim();
  return trimmed ? { kind: "text", value: trimmed } : { kind: "blank" };
}

function numberOrBlank(value: string): CellValue {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return { kind: "blank" };
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return textOrBlank(trimmed);
  return { kind: "num", value: parsed };
}

function dayOfMonth(iso: string): number | null {
  const match = /^\d{4}-\d{2}-(\d{2})$/.exec(iso);
  return match ? Number(match[1]) : null;
}

/** 2- va 39-qatordagi sana kataklari AR ustunida tanlangan kunni ko‘rsatadi */
function setDateMirror(xml: string, ref: string, sourceRow: number, day: number | null): string {
  const pattern = new RegExp(`<c r="${ref}"(?![0-9])([^>]*?)(?:/>|>([\\s\\S]*?)</c>)`);
  const match = xml.match(pattern);
  if (!match) return xml;
  const style = match[1].match(/\ss="(\d+)"/);
  const styleAttr = style ? ` s="${style[1]}"` : "";
  const formula = `<f>IF(AR${sourceRow}=0," ",AR${sourceRow})</f>`;
  const next =
    day == null
      ? `<c r="${ref}"${styleAttr} t="str">${formula}<v xml:space="preserve"> </v></c>`
      : `<c r="${ref}"${styleAttr}>${formula}<v>${day}</v></c>`;
  return xml.replace(match[0], next);
}

function noteText(day: DayEntry): string {
  return [day.other.trim(), day.note.trim()].filter(Boolean).join(". ");
}

function methodLabel(method: ObservationCard["measureMethod"]): string {
  if (method === "oral") return "og\u2018iz";
  if (method === "rectal") return "orqa teshik";
  if (method === "vaginal") return "vaginal";
  return "";
}

function measureTimeText(value: string): string {
  const match = /^0?(\d{1,2}):(\d{2})/.exec(value.trim());
  return match ? `${Number(match[1])}:${match[2]}` : value.trim();
}

function chartPoints(values: Array<number | null>, empty: string | null): string {
  return values
    .map((value, index) => {
      if (value == null && empty == null) return "";
      const shown = value == null ? empty : String(value);
      return `<c:pt idx="${index}"><c:v>${shown}</c:v></c:pt>`;
    })
    .join("");
}

function updateChart(xml: string, temperatures: Array<number | null>, disturbances: Array<number | null>): string {
  const temperaturePoints = chartPoints(temperatures, null);
  const withTemperatures = xml.replace(
    /(<c:f>'Карта 1'!\$AS\$2:\$AS\$41<\/c:f><c:numCache><c:formatCode>0\.00<\/c:formatCode><c:ptCount val="40"\/>)([\s\S]*?)(<\/c:numCache>)/,
    `$1${temperaturePoints}$3`
  );
  const disturbancePoints = chartPoints(disturbances, "#N/A");
  return withTemperatures.replace(
    /(<c:f>'Карта 1'!\$BK\$2:\$BK\$41<\/c:f><c:numCache><c:formatCode>General<\/c:formatCode><c:ptCount val="40"\/>)([\s\S]*?)(<\/c:numCache>)/,
    `$1${disturbancePoints}$3`
  );
}

function markGrid(xml: string, row: number, day: number, value: CellValue): string {
  return setCell(xml, `${dayColumn(day)}${row}`, value);
}

type TemplateParts = {
  template: Buffer;
  sheet: string;
  chart: string;
  drawing: string;
  shared: string;
  workbook: string;
  props: string;
  workbookRels: string;
  contentTypes: string;
  sheetRels: string;
  drawingRels: string;
};

function loadTemplateParts(): TemplateParts {
  const template = fs.readFileSync(TEMPLATE_PATH);
  return {
    template,
    sheet: extractStoredXml(template, "xl/worksheets/sheet1.xml"),
    chart: extractStoredXml(template, "xl/charts/chart1.xml"),
    drawing: raiseCoverLine(translateDrawingNames(extractStoredXml(template, "xl/drawings/drawing1.xml"))),
    shared: translateSharedStrings(extractStoredXml(template, "xl/sharedStrings.xml")),
    workbook: extractStoredXml(template, "xl/workbook.xml").replace(
      '<calcPr calcId="191029"/>',
      '<calcPr calcId="191029" fullCalcOnLoad="1"/>'
    ),
    props: extractStoredXml(template, "docProps/app.xml").replace(
      "<vt:lpstr>Листы</vt:lpstr>",
      "<vt:lpstr>Varaqlar</vt:lpstr>"
    ),
    workbookRels: extractStoredXml(template, "xl/_rels/workbook.xml.rels"),
    contentTypes: extractStoredXml(template, "[Content_Types].xml"),
    sheetRels: extractStoredXml(template, "xl/worksheets/_rels/sheet1.xml.rels"),
    drawingRels: extractStoredXml(template, "xl/drawings/_rels/drawing1.xml.rels"),
  };
}

export function buildObservationWorkbook(card: ObservationCard, sheetName = observationSheetName(card)): Buffer {
  const parts = loadTemplateParts();
  const rendered = renderObservation(parts, card, sheetName);
  const workbook = parts.workbook.replace('name="Карта 1"', `name="${xmlAttr(sheetName)}"`);
  const props = parts.props.replace("<vt:lpstr>Карта 1</vt:lpstr>", `<vt:lpstr>${xmlAttr(sheetName)}</vt:lpstr>`);
  return patchZip(parts.template, {
    "xl/worksheets/sheet1.xml": rendered.sheet,
    "xl/charts/chart1.xml": rendered.chart,
    "xl/sharedStrings.xml": parts.shared,
    "xl/workbook.xml": workbook,
    "docProps/app.xml": props,
    "xl/drawings/drawing1.xml": rendered.drawing,
  });
}

function renderObservation(parts: TemplateParts, card: ObservationCard, sheetName: string) {
  const derived = deriveStats(card);
  const resolved = {
    peakMucusDay: displayDayNumber(card.peakMucusDay, derived.peakMucusDay),
    peakMucusPlus3: displayDayNumber(card.peakMucusPlus3, derived.peakMucusPlus3),
    firstMucusDay: displayDayNumber(card.firstMucusDay, derived.firstMucusDay),
    firstCervixDay: displayDayNumber(card.firstCervixDay, derived.firstCervixDay),
    thirdRiseDay: displayDayNumber(card.thirdRiseDay, derived.thirdRiseDay),
    cycleLength: displayDayNumber(card.cycleLength, derived.cycleLength),
    lastInfertileDay: card.lastInfertileDay.trim(),
    peakCervixPlus3: card.peakCervixPlus3.trim(),
  };

  let sheet = parts.sheet;
  const chart = parts.chart;
  const drawing = parts.drawing;

  const temperatures: Array<number | null> = [];
  const disturbances: Array<number | null> = [];

  for (let day = 1; day <= DAY_COUNT; day++) {
    const entry = card.days[day - 1] || {
      date: "",
      temperature: null,
      factors: [],
      mucus: [],
      amount: null,
      peakMucus: false,
      firmness: "",
      position: "",
      opening: "",
      mood: "",
      pain: false,
      bloating: false,
      breast: false,
      other: "",
      intercourse: false,
      fertile: false,
      note: "",
      saved: false,
    };
    const inputRow = day + 1;
    const calendarDay = dayOfMonth(entry.date);
    sheet = setCell(sheet, `AR${inputRow}`, calendarDay ? { kind: "num", value: calendarDay } : { kind: "blank" });
    sheet = setDateMirror(sheet, `${dayColumn(day)}2`, inputRow, calendarDay);
    sheet = setDateMirror(sheet, `${dayColumn(day)}39`, inputRow, calendarDay);
    sheet = setCell(
      sheet,
      `AS${inputRow}`,
      entry.temperature == null ? { kind: "blank" } : { kind: "num", value: entry.temperature }
    );
    sheet = setCell(
      sheet,
      `AT${inputRow}`,
      entry.factors.length ? { kind: "text", value: entry.factors.map(factorExcelCode).join(",") } : { kind: "blank" }
    );
    sheet = setCell(sheet, `AU${inputRow}`, textOrBlank(noteText(entry)));

    for (const option of Object.keys(MUCUS_ROW) as MucusKey[]) {
      const marked = entry.mucus.includes(option);
      sheet = markGrid(sheet, MUCUS_ROW[option], day, marked ? { kind: "text", value: MARK } : { kind: "blank" });
    }
    sheet = markGrid(
      sheet,
      57,
      day,
      entry.peakMucus ? { kind: "text", value: MARK } : { kind: "num", value: day }
    );
    sheet = markGrid(
      sheet,
      58,
      day,
      entry.amount ? { kind: "num", value: entry.amount } : { kind: "blank" }
    );
    sheet = markGrid(
      sheet,
      60,
      day,
      entry.firmness === "hard" ? { kind: "text", value: "Q" } : entry.firmness === "soft" ? { kind: "text", value: "Y" } : { kind: "blank" }
    );
    sheet = markGrid(sheet, 61, day, entry.position === "high" ? { kind: "text", value: "•" } : { kind: "blank" });
    sheet = markGrid(sheet, 62, day, entry.position === "low" ? { kind: "text", value: "•" } : { kind: "blank" });
    sheet = markGrid(
      sheet,
      63,
      day,
      entry.opening === "open"
        ? { kind: "text", value: "О" }
        : entry.opening === "closed"
          ? { kind: "text", value: "о" }
          : { kind: "blank" }
    );
    sheet = markGrid(sheet, 65, day, entry.mood ? { kind: "text", value: entry.mood } : { kind: "blank" });
    sheet = markGrid(sheet, 66, day, entry.pain || entry.bloating ? { kind: "text", value: MARK } : { kind: "blank" });
    sheet = markGrid(sheet, 67, day, entry.breast ? { kind: "text", value: MARK } : { kind: "blank" });
    sheet = markGrid(sheet, 68, day, entry.fertile ? { kind: "text", value: MARK } : { kind: "num", value: day });
    sheet = markGrid(sheet, 69, day, entry.intercourse ? { kind: "text", value: "♥" } : { kind: "blank" });

    temperatures.push(entry.temperature);
    disturbances.push(entry.factors.length && entry.temperature != null ? entry.temperature : null);
  }

  sheet = setCell(sheet, "A40", { kind: "text", value: "Hayz kuni" });
  sheet = setCell(sheet, "B70", numberOrBlank(card.age));
  sheet = setCell(sheet, "N71", textOrBlank(card.cardNumber));
  sheet = setCell(sheet, "L71", textOrBlank(card.cycleNumber));
  if (card.previousRise === "ha") {
    sheet = setCell(sheet, "M72", { kind: "text", value: "\u2713 ha" });
    sheet = setCell(sheet, "O72", { kind: "text", value: "yo\u2018q" });
  } else if (card.previousRise === "yoq") {
    sheet = setCell(sheet, "M72", { kind: "text", value: "ha" });
    sheet = setCell(sheet, "O72", { kind: "text", value: "\u2713 yo\u2018q" });
  } else {
    sheet = setCell(sheet, "M72", { kind: "text", value: "ha" });
    sheet = setCell(sheet, "O72", { kind: "text", value: "yo\u2018q" });
  }

  sheet = setCell(sheet, "N74", numberOrBlank(resolved.lastInfertileDay));
  sheet = setCell(sheet, "N75", numberOrBlank(resolved.firstMucusDay));
  sheet = setCell(sheet, "N76", numberOrBlank(resolved.firstCervixDay));
  sheet = setCell(sheet, "N77", numberOrBlank(resolved.thirdRiseDay));
  sheet = setCell(sheet, "AM70", numberOrBlank(resolved.peakMucusDay));
  sheet = setCell(sheet, "AM71", numberOrBlank(resolved.peakMucusPlus3));
  sheet = setCell(sheet, "AM72", numberOrBlank(resolved.peakCervixPlus3));
  sheet = setCell(sheet, "AM73", numberOrBlank(resolved.cycleLength));
  sheet = setCell(sheet, "AF75", numberOrBlank(card.longestCycle));
  sheet = setCell(sheet, "AH75", numberOrBlank(card.shortestCycle));
  sheet = setCell(sheet, "AM76", textOrBlank(measureTimeText(card.measureTime)));
  const method = methodLabel(card.measureMethod);
  if (method) {
    sheet = setCell(sheet, "AD77", {
      kind: "text",
      value: `og\u2018iz/orqa teshik/vaginal          ${method}`,
    });
  }

  sheet = sheet.replace(
    '<c r="AW7" s="12" t="s"><v>97</v></c>',
    '<c r="AW7" s="12" t="s"><v>205</v></c>'
  );
  sheet = sheet.replace(
    '<c r="AW9" s="12" t="s"><v>96</v></c>',
    '<c r="AW9" s="12" t="s"><v>206</v></c>'
  );

  sheet = sheet.replace(
    /<f>IF\(AT(\d+)=0," ",AT\d+\)<\/f>/g,
    '<f>IF(LEN(AT$1&amp;"")=0," ",AT$1)</f>'
  );
  sheet = sheet.replace(
    "IF(OR(AT2&gt;0),AS2,NA())",
    'IF(LEN(AT2&amp;"")=0,NA(),AS2)'
  );
  sheet = applyDateDisplay(sheet);
  sheet = applyTemperatureScale(sheet);

  const nextChart = updateChart(chart, temperatures, disturbances)
    .replaceAll("'Карта 1'", formulaSheetName(sheetName))
    .replace("<c:v>БТТ</c:v>", "<c:v>Harorat</c:v>")
    .replace("<c:v>Корректірованная</c:v>", "<c:v>Tuzatilgan</c:v>")
    .replaceAll("#Н/Д", "#N/A")
    .replace('<c:max val="37.35"/>', '<c:max val="36.95"/>')
    .replace('<c:min val="35.9"/>', '<c:min val="35.5"/>');

  return { sheet, chart: nextChart, drawing };
}

function monthSlice(source: ObservationCard, key: string): ObservationCard {
  const saved = rememberMonth(source);
  const month = saved.months[key];
  return {
    ...saved,
    activeMonth: key,
    startDate: month?.startDate || "",
    days: month?.days || Array.from({ length: DAY_COUNT }, () => emptyObservationDay()),
    peakMucusDay: "",
    peakMucusPlus3: "",
    peakCervixPlus3: "",
    cycleLength: "",
    firstMucusDay: "",
    firstCervixDay: "",
    thirdRiseDay: "",
    lastInfertileDay: "",
  };
}

function emptyObservationDay(): DayEntry {
  return {
    date: "",
    temperature: null,
    factors: [],
    mucus: [],
    amount: null,
    peakMucus: false,
    firmness: "",
    position: "",
    opening: "",
    mood: "",
    pain: false,
    bloating: false,
    breast: false,
    other: "",
    intercourse: false,
    fertile: false,
    note: "",
    saved: false,
  };
}

export function buildPersonYearWorkbook(card: ObservationCard): Buffer {
  const saved = rememberMonth(card);
  return buildYearWorkbook(
    MONTHS.map((month) => ({ name: cardSheetName(month.key), card: monthSlice(saved, month.key) }))
  );
}

export function buildAdminTemplate(startDate: string): Buffer {
  const startMonth = startDate.slice(5, 7);
  return buildYearWorkbook(
    MONTHS.map((month) => {
      const card = createEmptyCard("shablon");
      const name = cardSheetName(month.key);
      if (month.key !== startMonth) return { name, card };
      return { name, card: applyStartDate(card, startDate) };
    })
  );
}

function buildYearWorkbook(sheets: Array<{ name: string; card: ObservationCard }>): Buffer {
  const parts = loadTemplateParts();
  const replacements: Record<string, string> = {
    "xl/sharedStrings.xml": parts.shared,
  };
  const extras: Array<{ name: string; data: string }> = [];
  const titles: string[] = [];

  sheets.forEach((item, index) => {
    const number = index + 1;
    const rendered = renderObservation(parts, item.card, item.name);
    titles.push(item.name);
    if (number === 1) {
      replacements["xl/worksheets/sheet1.xml"] = rendered.sheet;
      replacements["xl/charts/chart1.xml"] = rendered.chart;
      replacements["xl/drawings/drawing1.xml"] = rendered.drawing;
      return;
    }
    extras.push(
      { name: `xl/worksheets/sheet${number}.xml`, data: rendered.sheet },
      { name: `xl/charts/chart${number}.xml`, data: rendered.chart },
      { name: `xl/drawings/drawing${number}.xml`, data: rendered.drawing },
      {
        name: `xl/worksheets/_rels/sheet${number}.xml.rels`,
        data: parts.sheetRels.replace("../drawings/drawing1.xml", `../drawings/drawing${number}.xml`),
      },
      {
        name: `xl/drawings/_rels/drawing${number}.xml.rels`,
        data: parts.drawingRels.replace("../charts/chart1.xml", `../charts/chart${number}.xml`),
      }
    );
  });

  const sheetTags = titles
    .map((name, index) => `<sheet name="${xmlAttr(name)}" sheetId="${index + 1}" r:id="rId${20 + index}"/>`)
    .join("");
  let workbook = parts.workbook.replace(/<sheets>[\s\S]*?<\/sheets>/, `<sheets>${sheetTags}</sheets>`);
  let rels = parts.workbookRels
    .replace(/<Relationship Id="rId1"[^>]*relationships\/worksheet[^>]*\/>/, "")
    .replace(/<Relationship Id="rId5"[^>]*relationships\/calcChain[^>]*\/>/, "");
  titles.forEach((_, index) => {
    rels = rels.replace(
      "</Relationships>",
      `<Relationship Id="rId${20 + index}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/></Relationships>`
    );
  });
  let types = parts.contentTypes;
  for (let number = 2; number <= titles.length; number++) {
    types = types.replace(
      "</Types>",
      `<Override PartName="/xl/worksheets/sheet${number}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
        `<Override PartName="/xl/charts/chart${number}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>` +
        `<Override PartName="/xl/drawings/drawing${number}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/></Types>`
    );
  }
  const titleXml = titles.map((name) => `<vt:lpstr>${xmlAttr(name)}</vt:lpstr>`).join("");
  const props = parts.props
    .replace("<vt:i4>1</vt:i4>", `<vt:i4>${titles.length}</vt:i4>`)
    .replace(
      /<TitlesOfParts><vt:vector size="1" baseType="lpstr"><vt:lpstr>[^<]*<\/vt:lpstr><\/vt:vector><\/TitlesOfParts>/,
      `<TitlesOfParts><vt:vector size="${titles.length}" baseType="lpstr">${titleXml}</vt:vector></TitlesOfParts>`
    );

  replacements["xl/workbook.xml"] = workbook;
  replacements["xl/_rels/workbook.xml.rels"] = rels;
  replacements["[Content_Types].xml"] = types;
  replacements["docProps/app.xml"] = props;
  return patchZip(parts.template, replacements, extras);
}

/** AR2:AR41 — har bir katakda 1–31 kun ro‘yxati, boshqa qiymat kiritilmaydi */
function applyDateDisplay(sheet: string): string {
  return sheet.replace(
    /<dataValidation type="list"[^>]*sqref="AR2:AR41"([^>]*)>\s*<formula1>\$BO\$2:\$BO\$32<\/formula1>/,
    (_match, rest: string) =>
      `<dataValidation type="list" allowBlank="1" showInputMessage="1" showErrorMessage="1" errorTitle="Sana" error="1 dan 31 gacha kunni ro\u2018yxatdan tanlang" sqref="AR2:AR41"${rest}><formula1>$BO$2:$BO$32</formula1>`
  );
}

function applyTemperatureScale(sheet: string): string {
  let next = sheet;
  for (let index = 0; index < 30; index++) {
    const value = (36.95 - index * 0.05).toFixed(2);
    next = setCell(next, `A${4 + index}`, { kind: "text", value });
  }
  let temperature = 35.5;
  for (let row = 2; row <= 40; row++) {
    next = setCell(next, `BP${row}`, { kind: "num", value: Math.round(temperature * 100) / 100 });
    temperature += 0.05;
  }
  return next.replaceAll("$BP$2:$BP$32", "$BP$2:$BP$40");
}

function raiseCoverLine(xml: string): string {
  const anchorRe =
    /<xdr:(?:twoCellAnchor|oneCellAnchor|absoluteAnchor)\b[^>]*>[\s\S]*?<\/xdr:(?:twoCellAnchor|oneCellAnchor|absoluteAnchor)>/g;
  const blocks = [...xml.matchAll(anchorRe)].map((match) => match[0]);
  if (blocks.length < 2) return xml;
  const chartIndex = blocks.findIndex((block) => block.includes("<c:chart "));
  const coverIndex = blocks.findIndex(
    (block) => block.includes('val="FF0000"') && /<a:ext cx="\d+" cy="0"\/>/.test(block)
  );
  if (chartIndex < 0 || coverIndex < 0) return xml;
  const chart = blocks[chartIndex];
  const cover = blocks[coverIndex]
    .replace("<xdr:twoCellAnchor>", '<xdr:twoCellAnchor editAs="absolute">')
    .replace(/<xdr:cNvCxnSpPr>[\s\S]*?<\/xdr:cNvCxnSpPr>/, "<xdr:cNvCxnSpPr/>");
  const rest = blocks.filter((_, index) => index !== chartIndex && index !== coverIndex);
  const ordered = [chart, ...rest, cover];
  let cursor = 0;
  return xml.replace(anchorRe, () => ordered[cursor++]);
}

function translateDrawingNames(xml: string): string {
  const names: Array<[string, string]> = [
    ["Прямая соединительная линия", "To\u2018g\u2018ri chiziq"],
    ["Прямая со стрелкой", "Strelkali chiziq"],
    ["Полилиния", "Siniq chiziq"],
    ["Сердце", "Yurak"],
    ["Овал", "Doira"],
    ["Дуга", "Yoy"],
    ["Умножение", "Belgi"],
    ["Диаграмма", "Grafik"],
  ];
  return names.reduce((current, [from, to]) => current.replaceAll(from, to), xml);
}

function extractStoredXml(zip: Buffer, name: string): string {
  const eocdMin = Math.max(0, zip.length - 22 - 65535);
  let eocd = -1;
  for (let i = zip.length - 22; i >= eocdMin; i--) {
    if (zip.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Excel arxivi buzilgan");
  const count = zip.readUInt16LE(eocd + 10);
  let cursor = zip.readUInt32LE(eocd + 16);
  for (let i = 0; i < count; i++) {
    const method = zip.readUInt16LE(cursor + 10);
    const compressedSize = zip.readUInt32LE(cursor + 20);
    const nameLen = zip.readUInt16LE(cursor + 28);
    const extraLen = zip.readUInt16LE(cursor + 30);
    const commentLen = zip.readUInt16LE(cursor + 32);
    const localOffset = zip.readUInt32LE(cursor + 42);
    const entryName = zip.slice(cursor + 46, cursor + 46 + nameLen).toString("utf8");
    if (entryName === name) {
      const localNameLen = zip.readUInt16LE(localOffset + 26);
      const localExtraLen = zip.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + localNameLen + localExtraLen;
      const compressed = zip.slice(dataStart, dataStart + compressedSize);
      const raw = method === 0 ? compressed : inflateRawSync(compressed);
      return raw.toString("utf8");
    }
    cursor += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error(`Excel ichida ${name} topilmadi`);
}
