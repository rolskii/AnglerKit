import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Bell, CheckCircle2, AlertCircle, Loader2, Send, Share, Plus, ExternalLink, RefreshCw } from 'lucide-react';
import { ensurePushSubscription } from '@/lib/pushService';

function detectIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function isInIframe() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

export default function NotificationSetup() {
  const { toast } = useToast();
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const [subscribing, setSubscribing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [ios] = useState(detectIOS());
  const [standalone] = useState(isStandaloneMode());
  const [inIframe] = useState(isInIframe());

  const pushSupported = typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window;

  const notificationSupported = typeof Notification !== 'undefined';
  const iosNeedsInstall = ios && !standalone;

  const handleEnable = async () => {
    setSubscribing(true);
    const result = await ensurePushSubscription();
    setSubscribing(false);
    const currentPerm = typeof Notification !== 'undefined' ? Notification.permission : 'denied';
    setPermission(currentPerm);
    if (result.ok) {
      toast({
        title: 'Push notifications enabled',
        description: 'Alarms will fire even when the app is closed.',
      });
    } else {
      // Update local state to reflect what the browser actually returned
      if (result.permission) setPermission(result.permission);
      toast({
        variant: 'destructive',
        title: 'Could not enable notifications',
        description: result.error || 'Unknown error.',
        duration: 8000,
      });
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
      toast({ title: 'Test sent', description: 'Check your screen for the notification.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Failed', description: e.message });
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
          <li>Tap the <strong>Share</strong> button <Share className="inline w-3 h-3 mx-1" /> in Safari's bottom toolbar</li>
          <li>Scroll down and tap <strong>Add to Home Screen</strong> <Plus className="inline w-3 h-3 mx-1" /></li>
          <li>Tap <strong>Add</strong> — the app appears as an icon on your Home Screen</li>
          <li>Open the app <strong>from that Home Screen icon</strong> (not Safari)</li>
          <li>Come back to Settings → Enable Notifications</li>
        </ol>
        <p className="text-xs text-muted-foreground">Requires iOS 16.4 or later.</p>
      </div>
    );
  }

  // ── Running inside an iframe (app preview) ──
  // Always redirect to a new tab — push subscriptions can't be created
  // inside a cross-origin iframe even if permission was previously granted.
  if (inIframe) {
    const appUrl = window.location.href;
    const cleanUrl = appUrl.replace(/\/+$/, '');
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-amber-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm font-medium">Open in new tab to {permission === 'granted' ? 'complete setup' : 'enable'}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {permission === 'granted'
            ? 'Notification permission is granted, but the browser won\'t allow push subscription setup inside an embedded preview. Open the app in its own tab to finish.'
            : 'Browsers block notification permission requests inside embedded previews. Open the app directly in your browser to enable them.'}
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-2 py-1.5 text-xs bg-muted rounded-md truncate">{cleanUrl}</code>
          <Button size="sm" onClick={() => navigator.clipboard?.writeText(cleanUrl)} variant="outline">
            Copy
          </Button>
        </div>
        <Button onClick={() => window.open(cleanUrl, '_blank')} className="flex items-center gap-2">
          <ExternalLink className="w-4 h-4" />
          Open in New Tab
        </Button>
      </div>
    );
  }

  // ── Not supported ──
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
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Your browser blocked notifications for this site. You need to manually reset this — it can't be done from the app itself.
          </p>
          <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-1.5">
            <p className="text-xs font-semibold text-foreground">Chrome / Edge:</p>
            <p className="text-xs text-muted-foreground">Click the 🔒 lock icon left of the address bar → Site Settings → Notifications → Allow → Reload page.</p>
            <p className="text-xs font-semibold text-foreground pt-1">Safari (macOS):</p>
            <p className="text-xs text-muted-foreground">Safari → Settings → Websites → Notifications → Find this site → Set to Allow.</p>
            <p className="text-xs font-semibold text-foreground pt-1">Firefox:</p>
            <p className="text-xs text-muted-foreground">Click the 🔒 icon → Clear permissions → Reload → Click Enable again.</p>
          </div>
          <p className="text-xs text-muted-foreground">After resetting, reload this page and tap "Enable Notifications" again.</p>
        </div>
      ) : permission !== 'granted' ? (
        <p className="text-xs text-muted-foreground">
          Tap the button below and choose "Allow" to receive alarm alerts when the app is closed.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          You'll receive push notifications for your fishing alarms even when the app is closed.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {permission !== 'granted' && permission !== 'denied' && (
          <Button onClick={handleEnable} disabled={subscribing} className="flex items-center gap-2">
            {subscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
            {subscribing ? 'Enabling…' : 'Enable Notifications'}
          </Button>
        )}
        {permission === 'denied' && (
          <Button onClick={() => window.location.reload()} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Reload After Resetting
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