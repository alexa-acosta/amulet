'use client'

import { useState, useEffect } from 'react';
import { createClient } from '../../utils/supabase/client';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import Link from 'next/link';

// helpers
const getContrastColor = (hexColor?: string) => {
  if (!hexColor) return 'text-black/80';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 128 ? 'text-black/80' : 'text-white/95';
};

interface GoogleEvent {
  id: string;
  summary: string;
  hexColor?: string;
  start: { dateTime?: string; date?: string; };
  end: { dateTime?: string; date?: string; };
}

export default function CalendarPage() {
  const supabase = createClient();
  const [events, setEvents] = useState<GoogleEvent[]>([]);
  const [view, setView] = useState<'mine' | 'theirs' | 'both'>('both');

  useEffect(() => {
    const fetchAllData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.provider_token;
      if (!token) return;

      try {
        const colorRes = await fetch('https://www.googleapis.com/calendar/v3/colors', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const colorPalette = await colorRes.json();
        const calRes = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const calData = await calRes.json();
        const allEvents: GoogleEvent[] = [];

        await Promise.all(calData.items.map(async (cal: any) => {
          const evRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?singleEvents=true&timeMin=${startOfWeek(new Date()).toISOString()}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const evData = await evRes.json();
          if (evData.items) {
            allEvents.push(...evData.items.map((e: any) => ({
              ...e,
              hexColor: e.colorId && colorPalette.event?.[e.colorId] ? colorPalette.event[e.colorId].background : cal.backgroundColor
            })));
          }
        }));
        setEvents(allEvents);
      } catch (err) { console.error(err); }
    };
    fetchAllData();
  }, [supabase]);

  // toggle between showing only user's events, only others' events, or both
  const displayEvents = view === 'theirs' ? [] : events;
  const days = [0, 1, 2, 3, 4, 5, 6].map(i => addDays(startOfWeek(new Date()), i));

  return (
    <main className="min-h-screen bg-[#D0D7E1] flex flex-col pt-6 font-maitree overflow-hidden text-wild-berry lowercase">
      {/* nav bar */}
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
        
        {/* inline toggles & title */}
        <div className="flex justify-between items-end mb-6 px-4">
          <div className="flex gap-4">
            {(['mine', 'theirs', 'both'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-10 py-2 rounded-full text-xl transition-all duration-300 border ${
                  view === v 
                  ? 'bg-[#2D0A16] text-[#DFE4EA] border-[#2D0A16] shadow-lg' 
                  : 'text-[#2D0A16] border-[#2D0A16]/30 hover:bg-[#2D0A16]/5' 
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <h1 className="text-9xl font-regular tracking-tighter opacity-80 leading-[0.8] lowercase">calendar</h1>
        </div>
        
        {/* main calendar card */}
        <div className="bg-white rounded-[60px] flex-1 flex flex-col overflow-hidden border border-wild-berry/10 shadow-2xl relative">
          {/* calendar header (displays days) */}
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

          {/* scrollable grid */}
          <div className="flex-1 overflow-y-auto relative bg-white scrollbar-hide">
            <div className="grid grid-cols-[100px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] min-h-[1200px] relative">
              {/* time column */}
              <div className="flex flex-col border-r border-gray-100 bg-white z-10">
                {Array.from({ length: 15 }, (_, i) => i + 7).map(h => (
                  <div key={h} className="h-20 text-right pr-6 text-[11px] text-gray-300 pt-1 border-b border-gray-50/50 uppercase">
                    {h > 12 ? h - 12 : h} {h >= 12 ? 'pm' : 'am'}
                  </div>
                ))}
              </div>

              {/* event columns */}
              {days.map((day, dayIdx) => {
                const dayEvents = displayEvents
                  .filter(e => isSameDay(parseISO(e.start.dateTime || e.start.date || ""), day))
                  .sort((a, b) => parseISO(a.start.dateTime || a.start.date || "").getTime() - parseISO(b.start.dateTime || b.start.date || "").getTime());

                const positioned: any[] = [];
                let clusters: any[][] = [];

                // overlapping events ui
                dayEvents.forEach(event => {
                  const start = parseISO(event.start.dateTime || event.start.date || "").getTime();
                  let addedToCluster = false;
                  for (let cluster of clusters) {
                    const clusterEnd = Math.max(...cluster.map(e => parseISO(e.end.dateTime || e.end.date || "").getTime()));
                    if (start < clusterEnd) {
                      cluster.push(event);
                      addedToCluster = true;
                      break;
                    }
                  }
                  if (!addedToCluster) clusters.push([event]);
                });

                // position events within clusters, and determine how many columns each cluster needs
                clusters.forEach(cluster => {
                  const columns: any[][] = [];
                  cluster.forEach(event => {
                    const start = parseISO(event.start.dateTime || event.start.date || "").getTime();
                    let colIdx = columns.findIndex(col => parseISO(col[col.length - 1].end.dateTime || col[col.length - 1].end.date || "").getTime() <= start);
                    if (colIdx === -1) { colIdx = columns.length; columns.push([event]); }
                    else { columns[colIdx].push(event); }
                    
                    const sH = parseISO(event.start.dateTime || event.start.date || "").getHours() + parseISO(event.start.dateTime || event.start.date || "").getMinutes() / 60;
                    const eH = parseISO(event.end.dateTime || event.end.date || "").getHours() + parseISO(event.end.dateTime || event.end.date || "").getMinutes() / 60;

                    positioned.push({
                      ...event,
                      colIdx,
                      clusterCols: columns.length,
                      top: (sH - 7) * 80,
                      height: Math.max((eH - sH) * 80, 24)
                    });
                  });

                  cluster.forEach(e => {
                    const p = positioned.find(pe => pe.id === e.id);
                    if (p) p.clusterCols = columns.length;
                  });
                });

                return (
                  <div key={dayIdx} className="border-r border-gray-50 relative h-full">
                    {positioned.map((event: any) => {
                      const hasCollision = positioned.some(other => 
                        other.id !== event.id && 
                        ((event.top >= other.top && event.top < (other.top + other.height)) ||
                         (other.top >= event.top && other.top < (event.top + event.height)))
                      );

                      const isActuallySolo = !hasCollision;
                      const colWidth = 100 / event.clusterCols;

                      const width = isActuallySolo ? `calc(100% - 8px)` : `${colWidth * 1.7}%`;
                      const left = isActuallySolo ? `4px` : `${event.colIdx * colWidth}%`;

                      return (
                        <div 
                          key={event.id}
                          style={{ 
                            top: `${event.top}px`,
                            height: `${event.height}px`,
                            width: width,
                            left: left,
                            zIndex: 10 + event.colIdx,
                            maxWidth: isActuallySolo ? '100%' : `${100 - (event.colIdx * colWidth)}%`,
                            backgroundColor: event.hexColor
                          }}
                          className={`absolute rounded-xl p-3 text-[11px] leading-none transition-all shadow-md border border-white/20 ${getContrastColor(event.hexColor)}`}
                        >
                          <p className="font-bold tracking-tighter mb-1 truncate">{event.summary}</p>
                          <p className="opacity-70 text-[10px] font-medium">
                            {event.start.dateTime ? format(parseISO(event.start.dateTime), 'h:mm a') : 'all day'}
                          </p>
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