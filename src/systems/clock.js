import { SLEEP_START_HOUR, SLEEP_END_HOUR } from '../constants.js';

// Bedtime: Bibi sleeps in the bedroom from SLEEP_START_HOUR to SLEEP_END_HOUR (real clock).
export function inSleepWindow(date = new Date()) {
  const h = date.getHours();
  return SLEEP_START_HOUR > SLEEP_END_HOUR
    ? h >= SLEEP_START_HOUR || h < SLEEP_END_HOUR // crosses midnight (e.g. 22:00 - 4:00)
    : h >= SLEEP_START_HOUR && h < SLEEP_END_HOUR;
}

// one name per night (the date the night started), so waking Bibi up counts for that night only
export function nightKey(date = new Date()) {
  const d = new Date(date);
  if (d.getHours() < SLEEP_END_HOUR) d.setDate(d.getDate() - 1);
  return d.toDateString();
}
