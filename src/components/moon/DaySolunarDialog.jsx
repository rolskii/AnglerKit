import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Waves, Bell, BellOff, Save } from 'lucide-react';
import SunMoonFooter from '@/components/moon/SunMoonFooter';

export default function DaySolunarDialog({
  open,
  onOpenChange,
  moonData,
  solunar,
  sunData,
  currentDayAlarmList = [],
  onToggleAlarm,
  pendingTime,
  setPendingTime,
  pendingOffset,
  setPendingOffset,
  onSaveAlarm,
}) {
  if (!moonData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[85vh] overflow-y-auto p-4" style={{ scrollbarGutter: 'stable' }}>
        <DialogHeader>
          <DialogTitle>{moonData.date}</DialogTitle>
          <DialogDescription>Solunar feeding times & sun/moon data</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 w-full">
          {/* Solunar Feeding Times Card */}
          <Card className="bg-card border-primary/20">
            <CardHeader className="pt-3 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                Solunar Feeding Times
                <Waves className="w-5 h-5 text-primary" />
              </CardTitle>
              <CardDescription>Major & minor feeding windows for {moonData.date}</CardDescription>
            </CardHeader>
            <CardContent className="pt-3 pb-3">
              <div className="grid grid-cols-2 gap-2">
                {/* Major Times */}
                <div className="border-r border-border pr-2">
                  <p className="text-xs font-bold text-primary tracking-wide mb-3">MAJOR TIME</p>
                  <ul className="space-y-2">
                    {solunar.major.map((item, idx) => {
                      const alarmTime = item.time.split(' - ')[0];
                      const hasAlarm = currentDayAlarmList.some(a => a.time === alarmTime);
                      return (
                        <li key={idx}>
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <p className="text-sm font-medium whitespace-nowrap">{item.time}</p>
                            <button
                              onClick={() => onToggleAlarm(alarmTime)}
                              className={`p-1 rounded-md flex items-center transition-colors ${
                                hasAlarm
                                  ? 'bg-primary text-primary-foreground'
                                  : pendingTime === alarmTime
                                    ? 'bg-accent text-accent-foreground'
                                    : 'bg-primary/20 text-primary hover:bg-primary/30'
                              }`}
                            >
                              {hasAlarm ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <p className="text-[10px] text-muted-foreground">{item.text}</p>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                {/* Minor Times */}
                <div>
                  <p className="text-xs font-bold text-amber-500 tracking-wide mb-3">MINOR TIME</p>
                  <ul className="space-y-2">
                    {solunar.minor.map((item, idx) => (
                      <li key={idx}>
                        <p className="text-sm font-medium whitespace-nowrap">{item.time}</p>
                        <p className="text-[10px] text-muted-foreground">{item.text}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Pending alarm UI */}
              {(pendingTime || currentDayAlarmList.length > 0) && (
                <div className="mt-4 space-y-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                  {pendingTime ? (
                    <>
                      <p className="text-xs font-medium text-primary">Set alarm for {pendingTime}</p>
                      <p className="text-xs text-muted-foreground">Choose how early to be reminded, then save.</p>
                      <div className="flex gap-2">
                        {[0, 5, 10, 15].map((min) => (
                          <button
                            key={min}
                            onClick={() => setPendingOffset(min)}
                            className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                              pendingOffset === min ? 'bg-primary text-primary-foreground' : 'bg-background text-primary border border-primary/30 hover:bg-primary/20'
                            }`}
                          >
                            {min}m
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={onSaveAlarm}
                          className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Save className="w-3.5 h-3.5" /> Save Alarm
                        </button>
                        <button
                          onClick={() => setPendingTime(null)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-background text-muted-foreground border border-border hover:bg-muted transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      {currentDayAlarmList.map(alarm => (
                        <div key={alarm.time} className="flex items-center justify-between">
                          <p className="text-xs font-medium text-primary">
                            ⏰ {alarm.offset === 0 ? 'at' : alarm.offset + ' min before'} {alarm.time}
                          </p>
                          <p className="text-xs text-green-600">✓ Active</p>
                        </div>
                      ))}
                      <p className="text-xs text-green-600">
                        {currentDayAlarmList.length} alarm{currentDayAlarmList.length !== 1 ? 's' : ''} active
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sun & Moon Footer Card */}
          <Card>
            <CardContent className="pt-3 pb-3">
              <SunMoonFooter
                sunrise={sunData?.sunrise}
                sunset={sunData?.sunset}
                zenith={sunData?.zenith}
                moonPhase={moonData.phase}
                illumination={moonData.illumination}
              />
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}