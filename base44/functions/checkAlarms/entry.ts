import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const VAPID_PUBLIC_KEY = 'BFsm3txeTi8rhAzQUu39fke-rJS2AgfzGnPiVdzTFi8pNlVzQxt5nPPK2rTOXIO9OtKlkKdJLm4c39efLT6RwxY';

Deno.serve(async (req) => {
  try {
    // Validate scheduler secret — only the scheduled automation may trigger this.
    // Scheduled automations can't send custom HTTP headers, so the secret is
    // passed via function_args (body.args.cron_secret) and checked against the
    // CRON_SECRET environment variable.
    const CRON_SECRET = Deno.env.get("CRON_SECRET");
    let body = {};
    try { body = await req.json(); } catch (_e) { /* empty body */ }
    const providedSecret = body?.args?.cron_secret;
    if (!CRON_SECRET || !providedSecret || providedSecret !== CRON_SECRET) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
    if (!VAPID_PRIVATE_KEY) {
      return Response.json({ error: 'VAPID_PRIVATE_KEY not set' }, { status: 500 });
    }

    const webpush = (await import('npm:web-push@3.6.7')).default;
    webpush.setVapidDetails(
      'mailto:noreply@anglerslog.app',
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );

    const now = new Date();
    const unfiredAlarms = await base44.asServiceRole.entities.FishingAlarm.filter({ fired: false, enabled: true });
    const dueAlarms = unfiredAlarms.filter(a => new Date(a.fire_time) <= now);
    let sentCount = 0;

    for (const alarm of dueAlarms) {
      // Mark fired before sending, not after — this runs on a schedule, so two
      // overlapping invocations could otherwise both pick up the same
      // still-unfired alarm and double-send the notification.
      await base44.asServiceRole.entities.FishingAlarm.update(alarm.id, { fired: true });

      const subs = await base44.asServiceRole.entities.PushSubscription.filter({ created_by_id: alarm.created_by_id });

      const payload = JSON.stringify({
        title: '🎣 Fishing Time!',
        body: `Your feeding window (${alarm.time}) is starting${alarm.offset > 0 ? ` in ${alarm.offset} minutes` : ' now'}!`,
      });

      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
          sentCount++;
        } catch (e) {
          if (e.statusCode === 410 || e.statusCode === 404) {
            await base44.asServiceRole.entities.PushSubscription.delete(sub.id);
          }
        }
      }
    }

    return Response.json({ checked: dueAlarms.length, sent: sentCount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
