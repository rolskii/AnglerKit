import React, { useState, useEffect, useRef } from 'react';
import { Play, Square } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ALARM_SOUNDS, getSelectedAlarmSoundId, setSelectedAlarmSoundId } from '@/lib/alarmSounds';

export default function AlarmSoundPicker() {
  const [selectedId, setSelectedId] = useState(getSelectedAlarmSoundId());
  const [previewing, setPreviewing] = useState(false);
  const audioRef = useRef(null);

  const handleChange = (id) => {
    setSelectedId(id);
    setSelectedAlarmSoundId(id);
    stopPreview();
  };

  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setPreviewing(false);
  };

  const togglePreview = () => {
    if (previewing) {
      stopPreview();
      return;
    }
    stopPreview();
    const sound = ALARM_SOUNDS.find(s => s.id === selectedId) || ALARM_SOUNDS[0];
    const audio = new Audio(sound.url);
    audio.volume = 1;
    audio.onended = () => stopPreview();
    audioRef.current = audio;
    audio.play().catch(() => {});
    setPreviewing(true);
  };

  useEffect(() => () => stopPreview(), []);

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedId} onValueChange={handleChange}>
        <SelectTrigger className="flex-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ALARM_SOUNDS.map(sound => (
            <SelectItem key={sound.id} value={sound.id}>
              {sound.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={togglePreview}
        title={previewing ? 'Stop preview' : 'Preview sound'}
        className="shrink-0"
      >
        {previewing ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </Button>
    </div>
  );
}