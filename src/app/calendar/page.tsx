'use client'

import { useState, useEffect } from 'react';
import { createClient } from '../../utils/supabase/client';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import Link from 'next/link';

const getContrastColor = (hexColor?: string) => {
  if (!hexColor) return 'text-black/80';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 128 ? 'text-black/80' : 'text-white/95';
};

export default function CalendarPage() {
  const supabase = createClient();
  const [sharedEvents, setSharedEvents] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [view, setView] = useState<'mine' | 'theirs' | 'both'>('both');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndSync = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;
      const token = session.provider_token;
      setCurrentUserId(uid);

      try {
        // resolve couple + partner
        const { data: profile } = await supabase
          .from('users')
          .select('id, couple_id')
          .eq('id', uid)
          .single();

        if (!profile?.couple_id) return;

        const { data: couple } = await supabase
          .from('couples')
          .select('partner_1_id, partner_2_id')
          .eq('id', profile.couple_id)
          .single();

        let resolvedPartnerId: string | null = null;
        if (couple) {
          resolvedPartnerId = couple.partner_1_id === uid ? couple.partner_2_id : couple.partner_1_id;
          setPartnerId(resolvedPartnerId);
        }

        if (token) {
          // fetch fresh google events
          const colorRes = await fetch('https://www.googleapis.com/calendar/v3/colors', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const colorPalette = await colorRes.json();
          const calRes = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const calData = await calRes.json();

          const googleEvents: any[] = [];
          await Promise.all(calData.items.map(async (cal: any) => {
            const evRes = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?singleEvents=true&timeMin=${startOfWeek(new Date()).toISOString()}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const evData = await evRes.json();
            if (evData.items) {
              googleEvents.push(...evData.items.map((e: any) => ({
                google_event_id: e.id,
                user_id: uid,
                couple_id: profile.couple_id,
                title: e.summary || '(no title)',
                start_time: e.start.dateTime || e.start.date,
                end_time: e.end.dateTime || e.end.date,
                hex_color: e.colorId && colorPalette.event?.[e.colorId]
                  ? colorPalette.event[e.colorId].background
                  : cal.backgroundColor
              })));
            }
          }));

          // upsert user google events into database
          if (googleEvents.length > 0) {
            await supabase.from('events').upsert(googleEvents, { onConflict: 'google_event_id' });
          }

          // fetch user's current database rows
          const { data: myDbEvents } = await supabase
            .from('events')
            .select('id, google_event_id, is_amulet_date, start_time, end_time')
            .eq('user_id', uid);

          const googleIdSet = new Set(googleEvents.map(e => e.google_event_id));

          for (const dbEvent of (myDbEvents || [])) {
            const baseId = dbEvent.google_event_id?.replace('_partner', '');
            const stillExistsOnGoogle = googleIdSet.has(baseId) || googleIdSet.has(dbEvent.google_event_id);

            if (!stillExistsOnGoogle) {
              // event was deleted from google calendar
              if (dbEvent.is_amulet_date) {
                // cancel the google event entirely (removes it from partner's google calendar too)
                // only cancel if user is the organizer (google_event_id doesn't have _partner suffix)
                if (!dbEvent.google_event_id?.endsWith('_partner')) {
                  await fetch(
                    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${baseId}?sendUpdates=all`,
                    { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
                  );
                }

                // delete both database rows (mine + partner's _partner row)
                await supabase
                  .from('events')
                  .delete()
                  .or(`google_event_id.eq.${baseId},google_event_id.eq.${baseId}_partner`);
              } else {
                // regular event — just delete user's row
                await supabase.from('events').delete().eq('id', dbEvent.id);
              }
            } else if (dbEvent.is_amulet_date && !dbEvent.google_event_id?.endsWith('_partner')) {
              // amulet event still exists — sync any time changes to partner's _partner row
              const updatedGoogle = googleEvents.find(e => e.google_event_id === dbEvent.google_event_id);
              if (
                updatedGoogle &&
                (updatedGoogle.start_time !== dbEvent.start_time || updatedGoogle.end_time !== dbEvent.end_time)
              ) {
                await supabase
                  .from('events')
                  .update({
                    start_time: updatedGoogle.start_time,
                    end_time: updatedGoogle.end_time,
                  })
                  .eq('google_event_id', `${dbEvent.google_event_id}_partner`);
              }
            }
          }
        }

        // fetch full couple schedule for UI
        const { data: allCoupleEvents } = await supabase
          .from('events')
          .select('*')
          .eq('couple_id', profile.couple_id);

        setSharedEvents(allCoupleEvents || []);
      } catch (err) {
        console.error("Sync Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndSync();
  }, [supabase]);

  const days = [0, 1, 2, 3, 4, 5, 6].map(i => addDays(startOfWeek(new Date()), i));

  if (loading) return (
    <div className="min-h-screen bg-[#D0D7E1] flex items-center justify-center font-maitree text-wild-berry">
      syncing calendars...
    </div>
  );

  return (
    <main className="min-h-screen bg-[#D0D7E1] flex flex-col pt-6 font-maitree overflow-hidden text-wild-berry lowercase">
      <nav className="flex justify-between items-center w-full px-12 py-4 text-3xl tracking-widest">
        <Link href="/home" className="opacity-50 hover:opacity-100">home</Link>
        <Link href="/browse" className="opacity-50 hover:opacity-100">browse</Link>
        <Link href="/calendar" className="border-b border-wild-berry">calendar</Link>
        <Link href="/chat" className="opacity-50 hover:opacity-100">chat</Link>
        <Link href="/q&a" className="opacity-50 hover:opacity-100">q&a</Link>
        <Link href="/mems" className="opacity-50 hover:opacity-100">mems</Link>
        <Link href="/account" className="opacity-50 hover:opacity-100">account</Link>
      </nav>

      <div className="flex-1 px-12 pb-12 mt-4 flex flex-col">
        <div className="flex justify-between items-end mb-6 px-4">
          <div className="flex gap-4">
            {(['mine', 'theirs', 'both'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-10 py-2 rounded-full text-xl transition-all border ${view === v ? 'bg-[#2D0A16] text-[#DFE4EA] border-[#2D0A16] shadow-lg' : 'text-[#2D0A16] border-[#2D0A16]/30 hover:bg-[#2D0A16]/5'}`}
              >
                {v}
              </button>
            ))}
          </div>
          <h1 className="text-9xl font-regular tracking-tighter opacity-80 leading-[0.8]">calendar</h1>
        </div>

        <div className="bg-white rounded-[60px] flex-1 flex flex-col overflow-hidden border border-wild-berry/10 shadow-2xl relative">
          <div className="grid grid-cols-[100px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-gray-100 py-8 text-center bg-white z-20">
            <div className="text-[10px] text-gray-400 self-center uppercase tracking-[0.2em]">gmt-05</div>
            {days.map((day, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-[10px] text-gray-400 uppercase mb-2 tracking-widest">{format(day, 'eee')}</span>
                <span className={`text-3xl font-light w-12 h-12 flex items-center justify-center rounded-full ${isSameDay(day, new Date()) ? 'bg-[#3366FF] text-white' : 'text-gray-800'}`}>
                  {format(day, 'd')}
                </span>
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto relative bg-white scrollbar-hide">
            <div className="grid grid-cols-[100px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] min-h-[1200px] relative">
              <div className="flex flex-col border-r border-gray-100 bg-white z-10">
                {Array.from({ length: 15 }, (_, i) => i + 7).map(h => (
                  <div key={h} className="h-20 text-right pr-6 text-[11px] text-gray-300 pt-1 border-b border-gray-50/50 uppercase">
                    {h > 12 ? h - 12 : h} {h >= 12 ? 'pm' : 'am'}
                  </div>
                ))}
              </div>

              {days.map((day, dayIdx) => {
                const dayEvents = sharedEvents.filter(e => isSameDay(parseISO(e.start_time), day));
                let displayBlocks: any[] = [];

                if (view === 'both') {
                  const amuletEvents = dayEvents.filter(e => e.is_amulet_date);
                  const regularEvents = dayEvents.filter(e => !e.is_amulet_date);

                  // deduplicate amulet events by base google_event_id so they only render once
                  const seenAmuletIds = new Set<string>();
                  const dedupedAmulet = amuletEvents.filter(e => {
                    const baseId = e.google_event_id?.replace('_partner', '');
                    if (seenAmuletIds.has(baseId)) return false;
                    seenAmuletIds.add(baseId);
                    return true;
                  });

                  // merge regular events into busy blocks
                  if (regularEvents.length > 0) {
                    const sorted = [...regularEvents].sort(
                      (a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime()
                    );
                    let current = {
                      start: parseISO(sorted[0].start_time),
                      end: parseISO(sorted[0].end_time),
                      title: 'busy',
                      is_amulet_date: false,
                    };
                    for (let i = 1; i < sorted.length; i++) {
                      const nextS = parseISO(sorted[i].start_time);
                      const nextE = parseISO(sorted[i].end_time);
                      if (nextS < current.end) {
                        if (nextE > current.end) current.end = nextE;
                      } else {
                        displayBlocks.push({ ...current });
                        current = { start: nextS, end: nextE, title: 'busy', is_amulet_date: false };
                      }
                    }
                    displayBlocks.push({ ...current });
                  }

                  // amulet events render individually in blue
                  dedupedAmulet.forEach(e => {
                    displayBlocks.push({
                      start: parseISO(e.start_time),
                      end: parseISO(e.end_time),
                      title: e.title,
                      is_amulet_date: true,
                    });
                  });

                } else {
                  const targetId = view === 'mine' ? currentUserId : partnerId;
                  const filtered = dayEvents.filter(e => e.user_id === targetId && !e.is_amulet_date);
                  displayBlocks = filtered.map(e => ({
                    start: parseISO(e.start_time),
                    end: parseISO(e.end_time),
                    title: e.title,
                    is_amulet_date: false,
                    hex_color: e.hex_color || '#2D0A16',
                  }));
                }

                return (
                  <div key={dayIdx} className="border-r border-gray-50 relative h-full">
                    {displayBlocks.map((block, bIdx) => {
                      const sH = block.start.getHours() + block.start.getMinutes() / 60;
                      const eH = block.end.getHours() + block.end.getMinutes() / 60;
                      const top = (sH - 7) * 80;
                      const height = Math.max((eH - sH) * 80, 24);

                      const bgColor = view === 'both'
                        ? (block.is_amulet_date ? '#bdc5cf' : '#2D0A16')
                        : (block.hex_color || '#2D0A16');

                      const opacity = view === 'both'
                        ? (block.is_amulet_date ? 0.9 : 0.8)
                        : 1;

                      return (
                        <div
                          key={bIdx}
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            backgroundColor: bgColor,
                            opacity,
                            width: 'calc(100% - 8px)',
                            left: '4px',
                          }}
                          className={`absolute rounded-xl p-3 text-[11px] transition-all shadow-sm border border-white/20 z-10 ${view === 'both' ? 'text-white' : getContrastColor(block.hex_color)}`}
                        >
                          <p className="font-bold tracking-tighter truncate">{block.title}</p>
                          {(view !== 'both' || block.is_amulet_date) && (
                            <p className="opacity-70 text-[10px]">{format(block.start, 'h:mm a')}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}