export type QuizDobParts = {
  day: string;
  month: string;
  year: string;
};

export type QuizDobFieldErrors = {
  day?: string;
  month?: string;
  year?: string;
  form?: string;
};

export type QuizDobValidation = {
  age: number;
  isComplete: boolean;
  isValid: boolean;
  errors: QuizDobFieldErrors;
};

const MIN_YEAR = 1900;
const MAX_AGE = 120;

export function splitQuizDob(value: string): QuizDobParts {
  const [day = "", month = "", year = ""] = (value || "").split("/");
  return { day, month, year };
}

export function joinQuizDob(parts: QuizDobParts): string {
  return `${parts.day}/${parts.month}/${parts.year}`;
}

export function digitsOnly(value: string, maxLength: number): string {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function daysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function ageOn(birth: Date, today: Date): number {
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/** Validate a quiz DOB stored as DD/MM/YYYY, with per-field errors. */
export function validateQuizDob(value: string, now = new Date()): QuizDobValidation {
  const { day, month, year } = splitQuizDob(value);
  const errors: QuizDobFieldErrors = {};
  const currentYear = now.getFullYear();

  const dayReady = day.length === 2;
  const monthReady = month.length === 2;
  const yearReady = year.length === 4;

  const dayNum = dayReady ? Number(day) : NaN;
  const monthNum = monthReady ? Number(month) : NaN;
  const yearNum = yearReady ? Number(year) : NaN;

  if (dayReady && (dayNum < 1 || dayNum > 31)) {
    errors.day = "Enter a valid day (1–31)";
  }
  if (monthReady && (monthNum < 1 || monthNum > 12)) {
    errors.month = "Enter a valid month (1–12)";
  }
  if (yearReady && (yearNum < MIN_YEAR || yearNum > currentYear)) {
    errors.year = `Enter a valid year (${MIN_YEAR}–${currentYear})`;
  }

  const isComplete = dayReady && monthReady && yearReady;
  if (!isComplete) {
    return { age: 0, isComplete: false, isValid: false, errors };
  }

  if (errors.day || errors.month || errors.year) {
    return { age: 0, isComplete: true, isValid: false, errors };
  }

  const maxDay = daysInMonth(monthNum, yearNum);
  if (dayNum > maxDay) {
    errors.day = `That month only has ${maxDay} days`;
    return { age: 0, isComplete: true, isValid: false, errors };
  }

  const birth = startOfDay(new Date(yearNum, monthNum - 1, dayNum));
  const today = startOfDay(now);

  if (birth.getDate() !== dayNum || birth.getMonth() !== monthNum - 1 || birth.getFullYear() !== yearNum) {
    errors.form = "Enter a valid date of birth";
    return { age: 0, isComplete: true, isValid: false, errors };
  }

  if (birth > today) {
    errors.form = "Date of birth cannot be in the future";
    return { age: 0, isComplete: true, isValid: false, errors };
  }

  const age = ageOn(birth, today);
  if (age > MAX_AGE) {
    errors.year = "Enter a valid year";
    return { age, isComplete: true, isValid: false, errors };
  }
  if (age < 18) {
    errors.form = "You must be 18 or older.";
    return { age, isComplete: true, isValid: false, errors };
  }

  return { age, isComplete: true, isValid: true, errors };
}

export function isQuizDobDayComplete(day: string): boolean {
  if (day.length !== 2) return false;
  const n = Number(day);
  return n >= 1 && n <= 31;
}

export function isQuizDobMonthComplete(month: string): boolean {
  if (month.length !== 2) return false;
  const n = Number(month);
  return n >= 1 && n <= 12;
}
