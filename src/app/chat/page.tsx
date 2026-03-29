'use client'

import { useState } from 'react';
import Link from 'next/link';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'aven';
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", sender: 'aven' },
    { id: 2, text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", sender: 'user' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const newMessage: Message = {
      id: Date.now(),
      text: input,
      sender: 'user'
    };
    setMessages([...messages, newMessage]);
    setInput('');
  };

  return (
    <main className="min-h-screen bg-[#2D0A16] flex flex-col pt-6 font-maitree overflow-hidden text-[#DFE4EA] lowercase">
      {/* nav bar */}
      <nav className="flex justify-between items-center w-full px-12 py-4 text-3xl tracking-widest relative z-10">
        <Link href="/home" className="opacity-50 hover:opacity-100 transition-opacity">home</Link>
        <Link href="/browse" className="opacity-50 hover:opacity-100 transition-opacity">browse</Link>
        <Link href="/calendar" className="opacity-50 hover:opacity-100 transition-opacity">calendar</Link>
        <Link href="/chat" className="border-b border-[#DFE4EA]">chat</Link>
        <Link href="/q&a" className="opacity-50 hover:opacity-100 transition-opacity">q&a</Link>
        <Link href="/mems" className="opacity-50 hover:opacity-100 transition-opacity">mems</Link>
        <Link href="/account" className="opacity-50 hover:opacity-100 transition-opacity">account</Link>
      </nav>

      {/* dotted background pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, #DFE4EA 2px, transparent 0)', backgroundSize: '80px 80px' }}>
      </div>

      <div className="flex-1 px-12 pb-12 mt-8 flex gap-8 relative z-10">
        
        {/* sidebar - conversation list */}
        <aside className="w-1/4 bg-[#B8C2CC] rounded-[40px] p-6 flex flex-col gap-4 border border-white/10 shadow-xl">
          <div className="bg-white/40 rounded-full px-6 py-3 mb-2">
            <input 
              type="text" 
              placeholder="search chats ..." 
              className="bg-transparent border-none outline-none w-full text-[#2D0A16] placeholder-[#2D0A16]/50 text-xl"
            />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/40 rounded-full px-6 py-4 text-[#2D0A16]/80 text-xl truncate cursor-pointer hover:bg-white/60 transition-colors">
              Lorem ipsum dolor sit ...
            </div>
          ))}
        </aside>

        {/* main chat area */}
        <section className="flex-1 bg-[#B8C2CC] rounded-[40px] flex flex-col overflow-hidden border border-white/10 shadow-xl">
          <header className="px-10 py-6 flex justify-end items-center border-b border-[#2D0A16]/10">
            <h2 className="text-4xl text-[#2D0A16] opacity-80 tracking-tighter">ask aven</h2>
          </header>

          {/* message list */}
          <div className="flex-1 overflow-y-auto p-10 flex flex-col gap-6 scrollbar-hide">
            {messages.map((m) => (
              <div 
                key={m.id} 
                className={`max-w-[70%] p-8 rounded-[40px] text-xl leading-relaxed ${
                  m.sender === 'aven' 
                  ? 'bg-white/50 text-[#2D0A16] self-start rounded-bl-none' 
                  : 'bg-[#DFE4EA] text-[#2D0A16] self-end rounded-br-none shadow-md'
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>

          {/* input area */}
          <div className="p-8">
            <div className="bg-white/40 rounded-full flex items-center px-8 py-4 gap-4 focus-within:bg-white/60 transition-all border border-transparent focus-within:border-white/20">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="type your message here ..." 
                className="flex-1 bg-transparent border-none outline-none text-[#2D0A16] text-xl placeholder-[#2D0A16]/40"
              />
              <button 
                onClick={handleSend}
                className="text-[#2D0A16] opacity-60 hover:opacity-100 transition-opacity"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}