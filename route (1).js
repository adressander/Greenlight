import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { daysUntil, ALERT_THRESHOLDS, KIND_LABELS } from '../../../lib/deadlines';
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

  // Pull every deadline along with the truck it belongs to and that
  // truck owner's phone/SMS opt-in.
  const { data: deadlines, error } = await supabaseAdmin
    .from('deadlines')
    .select('id, kind, due_date, alerted_thresholds, truck_id, trucks(nickname, user_id, profiles(phone, sms_opt_in))');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;

  for (const d of deadlines) {
    const days = daysUntil(d.due_date);
    const alreadySent = (d.alerted_thresholds || '')
      .split(',')
      .filter(Boolean)
      .map(Number);

    // Find the tightest threshold this deadline has just crossed that we
    // haven't already alerted on for this due_date.
    const dueThreshold = ALERT_THRESHOLDS.find(
      (t) => days <= t && !alreadySent.includes(t)
    );
    if (dueThreshold === undefined) continue;

    const profile = d.trucks?.profiles;
    const truckName = d.trucks?.nickname || 'your truck';
    const label = KIND_LABELS[d.kind] || d.kind;
    const message = `Greenlight: ${label} for ${truckName} is due in ${days} day${days === 1 ? '' : 's'} (${d.due_date}). Renew it to stay on the road.`;

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
    // every day until the truck's status changes color again.
    await supabaseAdmin
      .from('deadlines')
      .update({
        alerted_thresholds: [...alreadySent, dueThreshold].join(','),
      })
      .eq('id', d.id);
  }

  return NextResponse.json({ checked: deadlines.length, alertsSent: sent });
}
