'use client'

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '../../utils/supabase/client';

const DATE_CATEGORIES = [
  { id: 'ent', name: 'entertainment', color: 'bg-powder-grey' },
  { id: 'act', name: 'activities', color: 'bg-powder-grey' },
  { id: 'gam', name: 'games', color: 'bg-powder-grey' },
];

const DATE_IDEAS = [
  { 
    id: 1, 
    title: 'movie night', 
    category: 'entertainment', 
    description: 'Sync up your favorite films and watch together in real-time.',
    instructions: [
      'Install the Teleparty extension on your browser.',
      'One person picks a movie on Netflix or Disney+.',
      'Click the "TP" icon to create a room and share the link.',
      'Chat in the sidebar while you watch the magic happen.'
    ]
  },
  { 
    id: 2, 
    title: 'digital scrapbook', 
    category: 'entertainment', 
    description: 'Curate your favorite memories in a shared space.',
    instructions: [
      'Create a shared Pinterest board or Canva project.',
      'Upload photos from your last visit.',
      'Add digital stickers, notes, and ticket stubs.',
      'Export it as a PDF to keep forever.'
    ]
  },
  { 
    id: 3, 
    title: 'playlist swap', 
    category: 'entertainment', 
    description: 'Build a soundtrack for your next visit.',
    instructions: [
      'Open Spotify and create a "Blend" playlist.',
      'Add 5 songs that remind you of your partner.',
      'Listen to the generated mix together while on a call.',
      'Rate each other\'s music taste (gently!).'
    ]
  },
  { id: 4, title: 'museum walkthrough', category: 'entertainment', description: 'Explore a museum virtually.' },
  { id: 5, title: 'powerpoint night', category: 'entertainment', description: 'Present a niche topic.' },
  { id: 6, title: 'house hunting', category: 'entertainment', description: 'Zillow surf for dream homes.' },
];

export default function BrowsePage() {
  const supabase = createClient();
  const [view, setView] = useState<'categories' | 'carousel' | 'grid'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string>('entertainment');
  const [selectedIdea, setSelectedIdea] = useState<typeof DATE_IDEAS[0] | null>(null);
  
  // New States for Planning
  const [isPlanning, setIsPlanning] = useState(false);
  const [plannedDate, setPlannedDate] = useState('');
  const [plannedTime, setPlannedTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-scroll logic
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (view !== 'carousel' || isHovered) return;
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 1) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [view, isHovered]);

  const handleConfirmPlan = async () => {
    if (!plannedDate || !plannedTime) {
      alert("Please select both a date and time!");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Get the session for the Google provider_token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.provider_token;

      if (!token) {
        alert("You need to be logged in with Google to add to calendar!");
        setIsSubmitting(false);
        return;
      }

      // 2. Format the date/time for Google (ISO format)
      // Assuming a default 1-hour duration
      const startDateTime = new Date(`${plannedDate}T${plannedTime}:00`).toISOString();
      const endDateTime = new Date(new Date(`${plannedDate}T${plannedTime}:00`).getTime() + 60 * 60 * 1000).toISOString();

      // 3. Create the event in the Primary Google Calendar
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: `amulet date: ${selectedIdea?.title}`,
          description: selectedIdea?.description,
          start: {
            dateTime: startDateTime,
          },
          end: {
            dateTime: endDateTime,
          },
        }),
      });

      if (response.ok) {
        alert(`✨ ${selectedIdea?.title} added! Check your calendar tab.`);
        // Reset states
        setSelectedIdea(null);
        setIsPlanning(false);
        setPlannedDate('');
        setPlannedTime('');
      } else {
        const error = await response.json();
        console.error('Google API Error:', error);
        alert("Failed to add to Google Calendar. Check console for details.");
      }
    } catch (err) {
      console.error('Error scheduling date:', err);
      alert("Something went wrong while planning your date.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-ivory-cream flex flex-col pt-6 pb-12 font-maitree overflow-x-hidden lowercase">
      
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none !important; }
        .hide-scrollbar { -ms-overflow-style: none !important; scrollbar-width: none !important; }
      `}</style>
      
      <nav className="flex justify-between items-center w-full px-12 py-4 text-wild-berry text-3xl tracking-widest z-10">
        <Link href="/home" className="opacity-50 hover:opacity-100 transition-opacity">home</Link>
        <Link href="/browse" className="border-b border-wild-berry pb-1">browse</Link>
        <Link href="/calendar" className="opacity-50 hover:opacity-100 transition-opacity">calendar</Link>
        <Link href="/chat" className="opacity-50 hover:opacity-100 transition-opacity">chat</Link>
        <Link href="/q&a" className="opacity-50 hover:opacity-100 transition-opacity">q&a</Link>
        <Link href="/mems" className="opacity-50 hover:opacity-100 transition-opacity">mems</Link>
        <Link href="/account" className="opacity-50 hover:opacity-100 transition-opacity">account</Link>
      </nav>

      <div className="px-12 mt-12">
        <div className="flex items-baseline gap-6 mb-16">
          <h1 className="text-9xl font-bold text-wild-berry tracking-tighter">browse</h1>
          <span className="text-4xl italic font-light text-wild-berry/30">
            {view === 'categories' ? 'plan your next date' : selectedCategory}
          </span>
        </div>

        {/* --- VIEW 1: CATEGORIES --- */}
        {view === 'categories' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-8 animate-in fade-in duration-700">
            {DATE_CATEGORIES.map((cat) => (
              <div key={cat.id} onClick={() => { setSelectedCategory(cat.name); setView('carousel'); }} className="group cursor-pointer flex flex-col items-center">
                <div className={`w-full aspect-[4/5] ${cat.color} rounded-[60px] shadow-sm transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-xl`} />
                <p className="mt-8 text-3xl tracking-widest text-wild-berry/60 group-hover:text-wild-berry transition-colors">{cat.name}</p>
              </div>
            ))}
          </div>
        )}

        {/* --- VIEW 2: CAROUSEL --- */}
        {view === 'carousel' && (
          <div className="relative animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="absolute -top-20 right-0 flex items-center gap-8">
                <button onClick={() => setView('grid')} className="bg-wild-berry text-ivory-cream px-10 py-3 rounded-full text-sm tracking-widest hover:bg-wild-berry/90 transition-all active:scale-95">see all</button>
                <button onClick={() => setView('categories')} className="text-wild-berry/40 hover:text-wild-berry tracking-widest transition-colors text-lg">back</button>
            </div>
            
            <div 
              ref={scrollRef}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="flex gap-10 overflow-x-auto pb-12 hide-scrollbar scroll-smooth"
            >
              {DATE_IDEAS.map((idea) => (
                <div key={idea.id} className="min-w-[450px] aspect-[3/4] bg-powder-grey rounded-[80px] p-16 flex flex-col justify-end shadow-sm hover:shadow-2xl transition-all duration-500 group">
                  <h3 className="text-5xl font-bold text-wild-berry mb-4 group-hover:translate-x-2 transition-transform duration-500">{idea.title}</h3>
                  <p className="text-xl italic text-wild-berry/60 mb-10 normal-case">{idea.description}</p>
                  <button onClick={() => setSelectedIdea(idea)} className="w-full bg-wild-berry text-ivory-cream py-5 rounded-full text-xs tracking-[0.4em] hover:bg-wild-berry/90 transition-colors">plan this date</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- VIEW 3: GRID VIEW --- */}
        {view === 'grid' && (
          <div className="relative animate-in fade-in zoom-in-95 duration-500">
             <button onClick={() => setView('carousel')} className="absolute -top-20 right-0 bg-wild-berry text-ivory-cream px-10 py-3 rounded-full text-sm tracking-widest hover:bg-wild-berry/90 transition-all active:scale-95">back</button>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-4">
              {DATE_IDEAS.map((idea) => (
                <div key={idea.id} className="bg-powder-grey rounded-[40px] p-8 flex flex-col h-[400px] shadow-sm hover:shadow-lg transition-shadow items-center justify-center text-center">
                  <h3 className="text-3xl font-bold text-wild-berry mb-4 flex-1">{idea.title}</h3>
                  <button onClick={() => setSelectedIdea(idea)} className="w-full bg-wild-berry text-ivory-cream py-4 rounded-full text-[10px] tracking-[0.3em] hover:opacity-90 transition-opacity">plan this date</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- DETAIL & PLANNING MODAL --- */}
      {selectedIdea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-wild-berry/20 backdrop-blur-md animate-in fade-in duration-300" onClick={() => { if(!isSubmitting) setSelectedIdea(null); setIsPlanning(false); }}>
          <div className="bg-powder-grey w-full max-w-3xl rounded-[80px] p-20 relative shadow-2xl animate-in zoom-in-95 duration-500" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-6xl font-bold text-wild-berry mb-10 text-center tracking-tighter">{selectedIdea.title}</h2>
            
            {!isPlanning ? (
              <>
                <div className="space-y-6 text-wild-berry/70 text-2xl italic leading-relaxed normal-case mb-12">
                  {selectedIdea.instructions ? (
                    selectedIdea.instructions.map((step, i) => (
                      <p key={i} className="flex gap-6"><span className="opacity-20 font-bold not-italic">0{i + 1}</span><span>{step}</span></p>
                    ))
                  ) : (
                    <p className="text-center opacity-50">Detailed instructions coming soon!</p>
                  )}
                </div>
                <button onClick={() => setIsPlanning(true)} className="w-full bg-wild-berry text-ivory-cream py-6 rounded-full text-sm tracking-[0.5em] hover:scale-[1.02] transition-transform shadow-xl">plan this date</button>
              </>
            ) : (
              <div className="flex flex-col gap-8 animate-in slide-in-from-bottom-4 duration-500">
                <p className="text-center text-2xl text-wild-berry/60 italic lowercase">pick your moment</p>
                <div className="grid grid-cols-2 gap-4">
                  <input type="date" className="bg-white/40 border-none rounded-3xl p-6 text-wild-berry text-xl outline-none focus:bg-white/60 transition-all" onChange={(e) => setPlannedDate(e.target.value)} disabled={isSubmitting} />
                  <input type="time" className="bg-white/40 border-none rounded-3xl p-6 text-wild-berry text-xl outline-none focus:bg-white/60 transition-all" onChange={(e) => setPlannedTime(e.target.value)} disabled={isSubmitting} />
                </div>
                <button 
                  onClick={handleConfirmPlan} 
                  disabled={isSubmitting}
                  className={`w-full bg-wild-berry text-ivory-cream py-6 rounded-full text-sm tracking-[0.5em] shadow-xl transition-all ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-wild-berry/90'}`}
                >
                  {isSubmitting ? 'Syncing...' : 'Confirm Date'}
                </button>
                {!isSubmitting && (
                  <button onClick={() => setIsPlanning(false)} className="text-wild-berry/40 text-lg hover:text-wild-berry transition-colors">back to details</button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}