// Seasonal layer toggle. Generic "Big Season" branding only.
// Activates between 1 April 2026 and 31 July 2026 (KSA time).

const SEASON_START = new Date("2026-04-01T00:00:00+03:00").getTime();
const SEASON_END = new Date("2026-07-31T23:59:59+03:00").getTime();
const EVENT_START = new Date("2026-06-11T18:00:00+03:00").getTime();

export function isSeasonActive(now: Date = new Date()): boolean {
  const t = now.getTime();
  return t >= SEASON_START && t <= SEASON_END;
}

export function isSeasonStarted(now: Date = new Date()): boolean {
  return now.getTime() >= EVENT_START;
}

export function getCountdownTarget(): Date {
  return new Date(EVENT_START);
}

export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
};

export function diffToCountdown(target: Date, now: Date = new Date()): CountdownParts {
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  const sec = Math.floor(ms / 1000);
  return {
    days: Math.floor(sec / 86400),
    hours: Math.floor((sec % 86400) / 3600),
    minutes: Math.floor((sec % 3600) / 60),
    seconds: sec % 60,
    done: false,
  };
}
