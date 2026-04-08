'use client'

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '../../utils/supabase/client';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'aven';
}

interface Chat {
  id: string;
  title: string;
  shared: boolean;
  created_at: string;
}

export default function ChatPage() {
  const supabase = createClient();

  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "hello, i'm aven! i'm here to help you and your partner stay connected. what's on your mind?", sender: 'aven' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchChats = useCallback(async () => {
    const { data } = await supabase
      .from('chats')
      .select('id, title, shared, created_at')
      .order('created_at', { ascending: false });
    if (data) setChats(data);
  }, [supabase]);

  useEffect(() => { fetchChats(); }, [fetchChats]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const loadChat = async (chat: Chat) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_id', chat.id)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data.map((m, i) => ({
        id: i,
        text: m.text,
        sender: m.sender as 'user' | 'aven',
      })));
    }
    setChatId(chat.id);
    setIsShared(chat.shared);
  };

  const startNewChat = () => {
    setMessages([{ id: 1, text: "hello. i'm aven. i'm here to help you and your partner stay connected. what's on your mind?", sender: 'aven' }]);
    setChatId(null);
    setIsShared(false);
    setInput('');
  };

  const handleShare = async () => {
    if (!chatId || isShared || isSharing) return;
    setIsSharing(true);
    try {
      await fetch('/api/chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId }),
      });
      setIsShared(true);
      fetchChats();
    } finally {
      setIsSharing(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now(),
      text: input.toLowerCase(),
      sender: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.text,
          history: messages.slice(-10),
          chatId,
        }),
      });

      const data = await response.json();

      if (data.text) {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: data.text.toLowerCase(),
          sender: 'aven'
        }]);
      }

      if (data.chatId && !chatId) {
        setChatId(data.chatId);
        fetchChats();
      }

    } catch (error) {
      console.error("Aven had a hiccup:", error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: "sorry, i'm having a bit of trouble connecting right now.",
        sender: 'aven'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const filteredChats = chats.filter(c =>
    c.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="h-screen bg-[#2D0A16] flex flex-col pt-6 font-maitree overflow-hidden text-[#DFE4EA] lowercase relative">

      {/* Navigation */}
      <nav className="flex justify-between items-center w-full px-12 py-4 text-3xl tracking-widest relative z-10 flex-shrink-0">
        <Link href="/home" className="opacity-50 hover:opacity-100 transition-opacity">home</Link>
        <Link href="/browse" className="opacity-50 hover:opacity-100 transition-opacity">browse</Link>
        <Link href="/calendar" className="opacity-50 hover:opacity-100 transition-opacity">calendar</Link>
        <Link href="/chat" className="border-b border-[#DFE4EA]">chat</Link>
        <Link href="/q&a" className="opacity-50 hover:opacity-100 transition-opacity">q&a</Link>
        <Link href="/mems" className="opacity-50 hover:opacity-100 transition-opacity">mems</Link>
        <Link href="/account" className="opacity-50 hover:opacity-100 transition-opacity">account</Link>
      </nav>

      {/* Dotted Background */}
      <div className="absolute inset-0 opacity-50 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #46192A 50px, transparent 0)', backgroundSize: '200px 200px' }}>
      </div>

      {/* Main layout — fills remaining height */}
      <div className="flex-1 px-12 pb-12 mt-8 flex gap-8 relative z-10 min-h-0">

        {/* Sidebar */}
        <aside className="w-1/4 bg-[#bdc5cf] rounded-[32px] p-5 flex flex-col gap-3 shadow-xl hidden md:flex">
          {/* Search */}
          <div className="bg-[#dfe3ea] rounded-full px-5 py-3">
            <input
              type="text"
              placeholder="search chats ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-[#330511]/70 placeholder-[#330511]/30 text-lg"
            />
          </div>

          {/* New chat */}
          <button
            onClick={startNewChat}
            className="bg-[#dfe3ea] hover:bg-[#330511]/10 transition-colors rounded-full px-5 py-3 text-[#330511]/80 hover:text-[#330511] text-lg text-left"
          >
            + new chat
          </button>

          {/* Chat list — scrollable */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0 pr-1"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#DFE4EA20 transparent' }}>
            {filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => loadChat(chat)}
                className={`rounded-full px-5 py-3 text-lg text-left transition-all flex-shrink-0 ${
                  chat.id === chatId
                    ? 'bg-[#dfe3ea] text-[#330511]'
                    : 'bg-[#dfe3ea] text-[#330511]/50 hover:bg-[#330511]/10 hover:text-[#330511]/80'
                }`}
              >
                <span className="truncate block">{chat.title || 'untitled chat'}</span>
                {chat.shared && (
                  <span className="text-xs opacity-40 mt-0.5 block">- shared - </span>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Main Chat — fixed height, no page growth */}
        <section className="flex-1 bg-[#B8C2CC] rounded-[32px] flex flex-col min-h-0 shadow-xl overflow-hidden">
          
          {/* Header */}
          <header className="px-10 py-5 flex justify-between items-center border-b border-[#2D0A16]/10 flex-shrink-0">
            <div>
              {chatId && (
                <button
                  onClick={handleShare}
                  disabled={isShared || isSharing}
                  className={`text-sm tracking-widest border rounded-full px-5 py-2 transition-all ${
                    isShared
                      ? 'border-[#2D0A16]/20 text-[#2D0A16]/30 cursor-default'
                      : 'border-[#2D0A16]/30 text-[#2D0A16]/50 hover:border-[#2D0A16] hover:text-[#2D0A16]'
                  }`}
                >
                  {isShared ? 'shared' : isSharing ? '...' : 'share with partner'}
                </button>
              )}
            </div>
            <h2 className="text-4xl text-[#2D0A16] opacity-70 tracking-tighter">ask aven</h2>
          </header>

          {/* Messages — this scrolls, nothing else does */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-10 flex flex-col gap-5 min-h-0"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#2D0A1630 transparent' }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[70%] px-8 py-6 rounded-[28px] text-xl leading-relaxed flex-shrink-0 ${
                  m.sender === 'aven'
                    ? 'bg-[#DFE4EA]/70 text-[#2D0A16] self-start rounded-bl-sm'
                    : 'bg-[#2D0A16]/15 text-[#2D0A16] self-end rounded-br-sm'
                }`}
              >
                {m.text}
              </div>
            ))}

            {isTyping && (
              <div className="self-start px-7 py-3 bg-[#DFE4EA]/40 text-[#2D0A16]/40 text-lg italic rounded-full animate-pulse flex-shrink-0">
                aven is writing...
              </div>
            )}
          </div>

          {/* Input — always pinned to bottom */}
          <div className="p-6 flex-shrink-0 border-t border-[#2D0A16]/10">
            <div className={`bg-white/40 rounded-full flex items-center px-8 py-4 gap-4 transition-all ${
              isTyping ? 'opacity-50' : 'focus-within:bg-white/60'
            }`}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isTyping ? "waiting for aven..." : "type your message here ..."}
                className="flex-1 bg-transparent border-none outline-none text-[#2D0A16] text-xl placeholder-[#2D0A16]/40"
                disabled={isTyping}
              />
              <button
                onClick={handleSend}
                disabled={isTyping || !input.trim()}
                className={`text-[#2D0A16] transition-all ${
                  isTyping || !input.trim() ? 'opacity-10 cursor-default' : 'opacity-50 hover:opacity-100 hover:scale-110'
                }`}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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