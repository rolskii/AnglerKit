import { getAlarmSoundUrl } from '@/lib/alarmSounds';

let intervalId = null;
const firedAlarms = new Set();

const parseTimeToMinutes = (timeStr) => {
  const match = String(timeStr).match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const playAlarm = (time, offset) => {
  const timeText = offset === 0 ? 'now' : `in ${offset} minutes`;
  const message = `🎣 Time to fish! Your feeding window (${time}) is starting ${timeText}!`;

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification('Fishing Time!', { body: message, tag: 'fishing-alarm' });
    } catch (e) {}
  }

  try {
    const sound = new Audio(getAlarmSoundUrl());
    sound.volume = 1;
    sound.play().catch(() => {});
  } catch (e) {}

  if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
    alert(message);
  }
};

const tick = () => {
  if (typeof localStorage === 'undefined') return;
  const stored = localStorage.getItem('alarmsByDate');
  if (!stored) return;

  let allAlarms;
  try {
    allAlarms = JSON.parse(stored);
  } catch {
    return;
  }

  const now = new Date();

  for (const [dateStr, alarmList] of Object.entries(allAlarms)) {
    if (!Array.isArray(alarmList)) continue;
    for (const alarm of alarmList) {
      if (!alarm.enabled) continue;

      const alarmKey = `${dateStr}_${alarm.time}`;
      if (firedAlarms.has(alarmKey)) continue;

      const targetMinutes = parseTimeToMinutes(alarm.time);
      if (targetMinutes == null) continue;

      const fireMinutes = targetMinutes - (alarm.offset || 0);
      const [year, month, day] = dateStr.split('-').map(Number);
      const fireDate = new Date(year, month - 1, day);
      fireDate.setHours(Math.floor(fireMinutes / 60), fireMinutes % 60, 0, 0);

      if (now >= fireDate) {
        // Only play if within 2 minutes of the fire time; otherwise mark silently
        if (now - fireDate < 120000) {
          playAlarm(alarm.time, alarm.offset);
        }
        firedAlarms.add(alarmKey);
      }
    }
  }
};

export function initAlarmService() {
  if (intervalId !== null) return;
  intervalId = setInterval(tick, 1000);
  tick();
}

export function clearFiredAlarms() {
  firedAlarms.clear();
}