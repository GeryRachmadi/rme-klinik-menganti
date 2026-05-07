/**
 * Returns the start of today (midnight) in WIB (UTC+7) as a UTC Date.
 * Date.UTC with hour=-7 rolls back to 17:00 UTC the prior day, which is
 * exactly 00:00 WIB — used for Prisma date-range queries on periodStart.
 */
export function getStartOfTodayWIB(): Date {
  const nowWib = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return new Date(Date.UTC(nowWib.getUTCFullYear(), nowWib.getUTCMonth(), nowWib.getUTCDate(), -7, 0, 0, 0));
}

/**
 * Returns the start of tomorrow (midnight) in WIB (UTC+7) as a UTC Date.
 * Used as the exclusive upper bound in date-range queries paired with getStartOfTodayWIB.
 */
export function getStartOfTomorrowWIB(): Date {
  const nowWib = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return new Date(Date.UTC(nowWib.getUTCFullYear(), nowWib.getUTCMonth(), nowWib.getUTCDate() + 1, -7, 0, 0, 0));
}

/**
 * Returns a human-readable age string ("X Hari" / "X Bulan" / "X Tahun")
 * computed relative to today in WIB (UTC+7).
 */
export function calculateAge(birthDate: Date): string {
  const todayWib = new Date(Date.now() + 7 * 60 * 60 * 1000);

  const birthYear = birthDate.getUTCFullYear();
  const birthMonth = birthDate.getUTCMonth();
  const birthDay = birthDate.getUTCDate();

  const todayYear = todayWib.getUTCFullYear();
  const todayMonth = todayWib.getUTCMonth();
  const todayDay = todayWib.getUTCDate();

  const diffDays = Math.floor(
    (todayWib.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 30) {
    return `${diffDays} Hari`;
  }

  let months = (todayYear - birthYear) * 12 + (todayMonth - birthMonth);
  if (todayDay < birthDay) months--;

  if (months < 12) {
    return `${months} Bulan`;
  }

  let years = todayYear - birthYear;
  if (
    todayMonth < birthMonth ||
    (todayMonth === birthMonth && todayDay < birthDay)
  ) {
    years--;
  }

  return `${years} Tahun`;
}
