import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { daysUntil, ALERT_THRESHOLDS, DAILY_ALERT_THRESHOLD, KIND_LABELS } from '../../../lib/deadlines';
import twilio from 'twilio';

// This route is meant to be triggered once a day by a scheduler
// (Vercel Cron, an external cron service, etc.) — see vercel.json.
// It is protected by a shared secret so randoms on the internet can't
// trigger it (and burn your Twilio balance).
export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const twilioClient =
    process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
      ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
      : null;

  // Pull every deadline along with the truck it belongs to. trucks.user_id
  // and profiles.id both reference auth.users independently (no direct FK
  // between trucks and profiles), so Supabase can't embed profiles in this
  // query directly — fetch them separately and join in JS below.
  const { data: deadlines, error } = await supabaseAdmin
    .from('deadlines')
    .select('id, kind, due_date, alerted_thresholds, truck_id, trucks(nickname, user_id)');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const userIds = [...new Set(deadlines.map((d) => d.trucks?.user_id).filter(Boolean))];
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('id, phone, sms_opt_in')
    .in('id', userIds);

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const profileByUserId = Object.fromEntries(profiles.map((p) => [p.id, p]));

  let sent = 0;

  for (const d of deadlines) {
    const days = daysUntil(d.due_date);
    const alreadySent = (d.alerted_thresholds || '')
      .split(',')
      .filter(Boolean)
      .map(Number);

    // Inside the daily window, alert every day the cron runs (no dedup).
    // Otherwise, only alert once per ALERT_THRESHOLDS crossing.
    const isDaily = days <= DAILY_ALERT_THRESHOLD;
    const dueThreshold = isDaily
      ? undefined
      : ALERT_THRESHOLDS.find((t) => days <= t && !alreadySent.includes(t));
    if (!isDaily && dueThreshold === undefined) continue;

    const profile = profileByUserId[d.trucks?.user_id];
    const truckName = d.trucks?.nickname || 'your truck';
    const label = KIND_LABELS[d.kind] || d.kind;
    const message =
      days < 0
        ? `Greenlight: ${label} for ${truckName} is ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} OVERDUE (was due ${d.due_date}). Renew it now.`
        : `Greenlight: ${label} for ${truckName} is due in ${days} day${days === 1 ? '' : 's'} (${d.due_date}). Renew it to stay on the road.`;

    if (twilioClient && profile?.sms_opt_in && profile?.phone) {
      try {
        await twilioClient.messages.create({
          to: profile.phone,
          from: process.env.TWILIO_FROM_NUMBER,
          body: message,
        });
        sent += 1;
      } catch (smsErr) {
        console.error('Twilio send failed for deadline', d.id, smsErr.message);
      }
    }

    // Record that we've alerted at this threshold so we don't repeat it
    // every day until the truck's status changes color again. Daily-window
    // alerts aren't recorded — they're meant to fire every day regardless.
    if (dueThreshold !== undefined) {
      await supabaseAdmin
        .from('deadlines')
        .update({
          alerted_thresholds: [...alreadySent, dueThreshold].join(','),
        })
        .eq('id', d.id);
    }
  }

  return NextResponse.json({ checked: deadlines.length, alertsSent: sent });
}
