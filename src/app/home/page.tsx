'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCountdown } from '../../hooks/useCountdown';
import { createClient } from '../../utils/supabase/client';
import { setYear, isBefore, parseISO, getYear } from 'date-fns';

export default function HomePage() {
  const supabase = createClient();
  const [targetDate, setTargetDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSharedAnniversary = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // get user profile to find the couple_id
          const { data: profile } = await supabase
            .from('users')
            .select('couple_id')
            .eq('id', user.id)
            .single();

          if (profile?.couple_id) {
            // fetch the anniversary from the shared couples table
            const { data: coupleData } = await supabase
              .from('couples')
              .select('anniversary')
              .eq('id', profile.couple_id)
              .single();

            if (coupleData?.anniversary) {
              const today = new Date();
              const originalDate = parseISO(coupleData.anniversary);
              let nextOccurrence = setYear(originalDate, getYear(today));
              
              if (isBefore(nextOccurrence, today)) {
                nextOccurrence = setYear(originalDate, getYear(today) + 1);
              }
              setTargetDate(nextOccurrence.toISOString());
            }
          } else {
            // if they aren't linked yet, can optionally look at their personal profile 
            // or just keep targetDate null to show the "set your anniversary" prompt
            setTargetDate(null);
          }
        }
      } catch (err) {
        console.error('Error fetching anniversary:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSharedAnniversary();
  }, [supabase]);

  const { days, hours, minutes, seconds } = useCountdown(targetDate || '');

  return (
    <main className="min-h-screen bg-wild-berry flex flex-col pt-6 pb-0 overflow-y-auto font-maitree">
      
      {/* nav bar */}
      <nav className="flex justify-between items-center w-full px-12 py-4 text-powder-grey text-3xl tracking-widest z-10">
        <Link href="/home" className="border-b border-powder-grey pb-1 text-powder-grey">home</Link>
        <Link href="/browse" className="opacity-50 hover:opacity-100 transition-opacity">browse</Link>
        <Link href="/calendar" className="opacity-50 hover:opacity-100 transition-opacity">calendar</Link>
        <Link href="/chat" className="opacity-50 hover:opacity-100 transition-opacity">chat</Link>
        <Link href="/q&a" className="opacity-50 hover:opacity-100 transition-opacity">q&a</Link>
        <Link href="/mems" className="opacity-50 hover:opacity-100 transition-opacity">mems</Link>
        <Link href="/account" className="opacity-50 hover:opacity-100 transition-opacity">account</Link>
      </nav>

      {/* hero section */}
      <div className="min-h-screen flex flex-col px-6 mb-32">
        <div className="flex-1 bg-powder-grey rounded-t-[80px] flex flex-col items-center pt-[15vh] px-12 shadow-none relative">
          <h1 className="text-[11rem] font-bold text-wild-berry tracking-tighter leading-none mb-12">
            amulet
          </h1>

          <div className="text-center h-32 flex flex-col justify-center">
            {loading ? (
              <p className="text-2xl italic font-light text-wild-berry/20 animate-pulse">
                fetching the moment...
              </p>
            ) : targetDate ? (
              <div className="animate-in fade-in zoom-in-95 duration-700">
                <p className="text-4xl italic font-light tracking-widest text-wild-berry">
                  {days} : {hours} : {minutes} : {seconds}
                  <span className="block text-xs not-italic opacity-40 uppercase tracking-[0.4em] mt-4">
                    until your anniversary
                  </span>
                </p>
              </div>
            ) : (
              <Link href="/account" className="group animate-in fade-in duration-500">
                <p className="text-3xl italic font-light text-wild-berry/60 group-hover:text-wild-berry transition-colors">
                  set your anniversary in account
                </p>
                <div className="h-[1px] w-12 bg-wild-berry/30 mx-auto mt-4 group-hover:w-32 transition-all" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* about us section */}
      <div className="min-h-screen bg-powder-grey w-full flex flex-col items-center pt-32 pb-32">
        <div className="w-full overflow-hidden mb-24 py-4 flex">
          <div className="flex animate-marquee whitespace-nowrap">
            {[...Array(8)].map((_, i) => (
              <span key={i} className="text-[12rem] font-semibold text-wild-berry tracking-tighter mr-64 flex-shrink-0">
                about <span className="font-briem-hand font-normal">us</span>
              </span>
            ))}
          </div>
        </div>

        <div className="w-full max-w-[100rem] px-12 grid grid-cols-1 lg:grid-cols-3 gap-16 items-start">
          <div className="lg:col-span-2 text-wild-berry text-2xl leading-relaxed columns-1 md:columns-2 gap-16 space-y-0">
            <p className="mb-10 text-justify">
              Amulet was born from a personal experience, navigating a long-distance relationship while attending university. 
              As the developer behind this project, I experienced firsthand the challenges of maintaining a meaningful connection 
              across far distances, busy schedules, and the constant back-and-forth between messaging apps, calendars, and photo-sharing 
              platforms. 
            </p>
            <p className="mb-10 text-justify">
              Our mission is simple. To bring couples closer together through a centralized, interactive, and intuitive platform. 
              Amulet eliminates the need for multiple apps by providing a cohesive ecosystem for long-distance relationships. 
            </p>
            <p className="mb-10 text-justify">
              Amulet’s features are carefully crafted to balance practicality and creativity. Couples can browse a curated library of 
              date ideas, schedule them instantly in a shared Google Calendar, engage with an AI companion for advice or planning, and 
              store memories in a visually rich gallery. 
            </p>
            <p className="mb-10 text-justify">
              Built with modern web technologies like Next.js, Supabase, and the OpenAI API, Amulet combines smart scheduling, AI-driven 
              insights, and cloud-based memory storage to deliver a robust, user-friendly experience. Welcome to your shared sanctuary.
            </p>
          </div>

          <div className="flex justify-end items-start w-full">
            <div className="bg-wild-berry w-full aspect-square max-w-[450px] rounded-[60px] flex items-center justify-center relative overflow-hidden shadow-2xl transition-transform hover:scale-[1.02]">
               <span className="text-ivory-cream/10 text-[15rem] font-bold select-none absolute -bottom-10 -right-10"></span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}