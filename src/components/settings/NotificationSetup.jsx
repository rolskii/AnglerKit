import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle2, AlertCircle, Loader2, Send, Share, Plus } from 'lucide-react';
import { ensurePushSubscription } from '@/lib/pushService';
import { toast } from 'sonner';

function detectIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return isIOS;
}

function isStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

export default function NotificationSetup() {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const [subscribing, setSubscribing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [ios] = useState(detectIOS());
  const [standalone] = useState(isStandaloneMode());

  const pushSupported = typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window;

  const notificationSupported = typeof Notification !== 'undefined';

  // On iOS Safari (not installed as PWA), neither Notification nor PushManager exist
  const iosNeedsInstall = ios && !standalone;

  useEffect(() => {
    if (!notificationSupported || !pushSupported) return;
  }, []);

  const handleEnable = async () => {
    setSubscribing(true);
    const ok = await ensurePushSubscription();
    setSubscribing(false);
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission);
    }
    if (ok) {
      toast.success('Push notifications enabled! Alarms will fire even when the app is closed.');
    } else if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
      toast.error('Notifications were blocked. Please enable them in your browser/site settings.');
    } else {
      toast.error('Could not enable notifications. Make sure you allow the permission prompt.');
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
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

  // ── iOS: not installed as PWA ──
  if (iosNeedsInstall) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-amber-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm font-medium">Install to Home Screen required</p>
        </div>
        <p className="text-xs text-muted-foreground">
          iOS only allows push notifications from apps installed on your Home Screen. Follow these steps:
        </p>
        <ol className="space-y-2 text-xs text-muted-foreground list-decimal list-inside">
          <li>
            Tap the <strong>Share</strong> button
            <Share className="inline w-3 h-3 mx-1" />
            in Safari's bottom toolbar
          </li>
          <li>
            Scroll down and tap <strong>Add to Home Screen</strong>
            <Plus className="inline w-3 h-3 mx-1" />
          </li>
          <li>Tap <strong>Add</strong> — the app appears as an icon on your Home Screen</li>
          <li>Open the app <strong>from that Home Screen icon</strong> (not Safari)</li>
          <li>Come back to Settings → Enable Notifications</li>
        </ol>
        <p className="text-xs text-muted-foreground">
          Requires iOS 16.4 or later.
        </p>
      </div>
    );
  }

  // ── Not supported (non-iOS) ──
  if (!pushSupported || !notificationSupported) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-amber-600">
          <AlertCircle className="w-4 h-4" />
          <p className="text-sm font-medium">Push notifications not supported</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Your browser or device doesn't support push notifications. Try updating your browser or using a different device.
        </p>
      </div>
    );
  }

  // ── Supported & ready ──
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