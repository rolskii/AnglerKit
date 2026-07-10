import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const VAPID_PUBLIC_KEY = 'BFsm3txeTi8rhAzQUu39fke-rJS2AgfzGnPiVdzTFi8pNlVzQxt5nPPK2rTOXIO9OtKlkKdJLm4c39efLT6RwxY';

Deno.serve(async (req) => {
  try {
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
    const unfiredAlarms = await base44.asServiceRole.entities.FishingAlarm.filter({ fired: false });
    const dueAlarms = unfiredAlarms.filter(a => new Date(a.fire_time) <= now);
    let sentCount = 0;

    for (const alarm of dueAlarms) {
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

      await base44.asServiceRole.entities.FishingAlarm.update(alarm.id, { fired: true });
    }

    return Response.json({ checked: dueAlarms.length, sent: sentCount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});