import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, CheckCircle2, AlertCircle, Loader2, Send } from 'lucide-react';
import { ensurePushSubscription } from '@/lib/pushService';
import { toast } from 'sonner';

export default function NotificationSetup() {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const [subscribing, setSubscribing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (typeof Notification === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setSupported(false);
    }
  }, []);

  const handleEnable = async () => {
    setSubscribing(true);
    const ok = await ensurePushSubscription();
    setSubscribing(false);
    setPermission(Notification.permission);
    if (ok) {
      toast.success('Push notifications enabled! Alarms will fire even when the app is closed.');
    } else if (Notification.permission === 'denied') {
      toast.error('Notifications were blocked. Please enable them in your browser/site settings.');
    } else {
      toast.error('Could not enable notifications. Make sure you allow the permission prompt.');
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      // Send a test notification immediately via the service worker
      const reg = await navigator.serviceWorker.ready;
      reg.showNotification('🎣 Test Notification', {
        body: 'If you can see this, push notifications are working!',
        icon: 'https://base44.com/logo_v2.svg',
        vibrate: [300, 150, 300],
        requireInteraction: true,
        tag: 'test-notification',
      });
      toast.success('Test notification sent — check your screen!');
    } catch (e) {
      toast.error('Could not show test notification: ' + e.message);
    } finally {
      setTesting(false);
    }
  };

  if (!supported) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-amber-600">
          <AlertCircle className="w-4 h-4" />
          <p className="text-sm font-medium">Push notifications not supported</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Your browser or device doesn't support push notifications. On iOS, you need to add the app to your Home Screen first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {permission === 'granted' ? (
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        ) : permission === 'denied' ? (
          <AlertCircle className="w-4 h-4 text-red-600" />
        ) : (
          <Bell className="w-4 h-4 text-amber-600" />
        )}
        <p className="text-sm font-medium">
          {permission === 'granted'
            ? 'Notifications enabled'
            : permission === 'denied'
            ? 'Notifications blocked'
            : 'Notifications not yet enabled'}
        </p>
      </div>

      {permission === 'denied' ? (
        <p className="text-xs text-muted-foreground">
          Notification permission was blocked. To receive alarm notifications when the app is closed,
          you need to reset the permission in your browser settings: Site Settings → Notifications → Allow.
        </p>
      ) : permission !== 'granted' ? (
        <p className="text-xs text-muted-foreground">
          You must enable notifications to receive alarm alerts when the app is closed.
          Tap the button below and choose "Allow".
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          You'll receive push notifications for your fishing alarms even when the app is closed.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {permission !== 'granted' && (
          <Button onClick={handleEnable} disabled={subscribing} className="flex items-center gap-2">
            {subscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
            {subscribing ? 'Enabling…' : 'Enable Notifications'}
          </Button>
        )}
        {permission === 'granted' && (
          <Button onClick={handleEnable} variant="outline" disabled={subscribing} className="flex items-center gap-2">
            {subscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {subscribing ? 'Re-registering…' : 'Re-register Device'}
          </Button>
        )}
        {permission === 'granted' && (
          <Button onClick={handleTest} variant="outline" disabled={testing} className="flex items-center gap-2">
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Test Notification
          </Button>
        )}
      </div>
    </div>
  );
}