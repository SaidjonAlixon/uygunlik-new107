/** Kurs start ma'lumotlari — o'zgarsa Start matni va countdown ham yangilanadi */
export const COURSE_START_ISO = "2026-10-03T00:00:00+05:00";
export const COURSE_DURATION_WEEKS = 12;

const UZ_MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
] as const;

export function getCourseStartDate() {
  return new Date(COURSE_START_ISO);
}

/** Masalan: "3-oktabr, 2026" */
export function formatCourseStartLabel(date = getCourseStartDate()) {
  const day = date.getDate();
  const month = UZ_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}, ${year}`;
}

export function getTimeRemaining(target: Date, now = new Date()) {
  const diff = Math.max(0, target.getTime() - now.getTime());
  const totalSeconds = Math.floor(diff / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    isComplete: diff <= 0,
  };
}
