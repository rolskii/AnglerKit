/**
 * Available alarm sounds — all public-domain / CC-licensed recordings from Wikimedia Commons.
 * The first entry ("First Call" bugle) is the original default.
 */
export const ALARM_SOUNDS = [
  {
    id: 'first_call',
    label: 'First Call Bugle',
    url: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/6/60/FirstCall.ogg/FirstCall.ogg.mp3',
  },
  {
    id: 'alarm_clock',
    label: 'Alarm Clock',
    url: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/5/5c/Alarm_clock_-_01.ogg/Alarm_clock_-_01.ogg.mp3',
  },
  {
    id: 'mechanical',
    label: 'Mechanical Bell',
    url: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/b/bc/Alarmclock-mechanical.ogg/Alarmclock-mechanical.ogg.mp3',
  },
  {
    id: 'beep',
    label: 'Beep',
    url: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/4/42/Beep_alarm_clock.ogg/Beep_alarm_clock.ogg.mp3',
  },
  {
    id: 'electronic',
    label: 'Electronic Buzzer',
    url: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/5/5d/Electronic_Alarmclocksound.ogg/Electronic_Alarmclocksound.ogg.mp3',
  },
  {
    id: 'classic_buzz',
    label: 'Classic Buzz',
    url: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/b/be/Sonnerie_classique_reveil.ogg/Sonnerie_classique_reveil.ogg.mp3',
  },
];

const STORAGE_KEY = 'alarmSoundId';

/** Returns the currently selected alarm sound object (defaults to First Call Bugle). */
export function getSelectedAlarmSound() {
  const id = localStorage.getItem(STORAGE_KEY);
  return ALARM_SOUNDS.find(s => s.id === id) || ALARM_SOUNDS[0];
}

/** Returns the URL of the currently selected alarm sound. */
export function getAlarmSoundUrl() {
  return getSelectedAlarmSound().url;
}

/** Persists the selected alarm sound id. */
export function setSelectedAlarmSoundId(id) {
  localStorage.setItem(STORAGE_KEY, id);
}

export function getSelectedAlarmSoundId() {
  return localStorage.getItem(STORAGE_KEY) || ALARM_SOUNDS[0].id;
}