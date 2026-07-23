import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const entityNames = [
      'Catch', 'Rod', 'Reel', 'FlyLine', 'Lure', 'MiscItem',
      'RiverNote', 'RiverFavoriteStation', 'SavedLocation',
      'FishingAlarm', 'MapCourse', 'PushSubscription',
    ];

    const deleted = {};
    for (const name of entityNames) {
      try {
        const res = await base44.asServiceRole.entities[name].deleteMany({ created_by_id: user.id });
        deleted[name] = res?.deleted_count ?? 'ok';
      } catch (e) {
        deleted[name] = 'skipped';
      }
    }

    // Attempt to delete the user account record itself
    let userDeleted = false;
    try {
      await base44.asServiceRole.entities.User.delete(user.id);
      userDeleted = true;
    } catch (e) {
      // Data is erased even if the user record can't be removed from here
    }

    return Response.json({ success: true, deleted, userDeleted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});