'use client'
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '../../utils/supabase/client';

export default function AccountPage() {
  const supabase = createClient();
  const [anniversaryDate, setAnniversaryDate] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        setUser({
          name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'user',
          email: authUser.email
        });

        const { data } = await supabase
          .from('users')
          .select('anniversary')
          .eq('id', authUser.id)
          .single();

        if (data?.anniversary) {
          setAnniversaryDate(data.anniversary);
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, [supabase]);

  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setAnniversaryDate(newDate);

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      await supabase
        .from('users')
        .upsert({ 
          id: authUser.id, 
          email: authUser.email, 
          anniversary: newDate 
        });
    }
  };

  return (
    <main className="min-h-screen bg-wild-berry flex flex-col pt-6 pb-12 font-maitree overflow-x-hidden">
      
      {/* nav bar */}
      <nav className="flex justify-between items-center w-full px-12 py-4 text-cool-mist text-3xl tracking-widest z-10">
        <Link href="/home" className="opacity-50 hover:opacity-100 transition-opacity">home</Link>
        <Link href="/browse" className="opacity-50 hover:opacity-100 transition-opacity">browse</Link>
        <Link href="/calendar" className="opacity-50 hover:opacity-100 transition-opacity">calendar</Link>
        <Link href="/chat" className="opacity-50 hover:opacity-100 transition-opacity">chat</Link>
        <Link href="/q&a" className="opacity-50 hover:opacity-100 transition-opacity">q&a</Link>
        <Link href="/mems" className="opacity-50 hover:opacity-100 transition-opacity">mems</Link>
        <Link href="/account" className="border-b border-cool-mist pb-1 text-cool-mist">account</Link>
      </nav>

      <div className="flex-1 flex flex-col items-center px-6 mt-8">
        <div className="w-full max-w-5xl bg-cool-mist rounded-[80px] flex flex-col items-center pt-20 pb-24 px-12 relative overflow-hidden shadow-2xl">
          
          {/* profile circle - takes first inital of name */}
          <div className={`w-64 h-64 bg-powder-grey rounded-full flex items-center justify-center mb-8 shadow-inner transition-opacity duration-500 ${loading ? 'animate-pulse opacity-50' : 'opacity-100'}`}>
             <span className="text-wild-berry text-9xl font-light">
               {!loading && user?.name?.charAt(0)}
             </span>
          </div>

          <h1 className={`text-7xl font-bold text-wild-berry tracking-tighter mb-16 transition-all duration-500 ${loading ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
            {user?.name}
          </h1>

          <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-16 mt-4">
            
            <div className="space-y-6">
              <h2 className="text-2xl tracking-[0.3em] text-wild-berry/50 uppercase">anniversary</h2>
              <input 
                type="date" 
                value={anniversaryDate}
                onChange={handleDateChange}
                disabled={loading}
                className={`w-full bg-transparent border-b border-wild-berry/20 py-2 text-3xl text-wild-berry focus:outline-none focus:border-wild-berry transition-all cursor-pointer ${loading ? 'opacity-20' : 'opacity-100'}`}
              />
              <p className="text-sm italic text-wild-berry/60 font-light">
                this will power the countdown on your home page.
              </p>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl tracking-[0.3em] text-wild-berry/50 uppercase">partner link</h2>
              <div className="flex gap-4">
                <input 
                  type="text" 
                  placeholder="enter code"
                  value={pairingCode}
                  onChange={(e) => setPairingCode(e.target.value)}
                  className="flex-1 bg-transparent border-b border-wild-berry/20 py-2 text-3xl text-wild-berry placeholder:text-wild-berry/10 focus:outline-none focus:border-wild-berry transition-colors"
                />
                <button className="text-wild-berry border border-wild-berry/20 px-6 rounded-full hover:bg-wild-berry hover:text-cool-mist transition-all text-xs tracking-widest font-bold">
                  pair
                </button>
              </div>
              <p className="text-sm italic text-wild-berry/60 font-light">
                your unique code: <span className="font-bold select-all">AMLT-8821</span>
              </p>
            </div>

          </div>

          <button 
            onClick={() => supabase.auth.signOut()}
            className="mt-24 text-wild-berry/80 hover:text-wild-berry transition-colors tracking-[0.3em]"
          >
            sign out of amulet
          </button>

        </div>
      </div>
    </main>
  );
}