'use client'

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const QUESTIONS = [
  { id: 1, question: "what is your favorite memory about each other?" },
  { id: 2, question: "what is one thing you're looking forward to doing together this summer?" },
  { id: 3, question: "what was your very first impression of me?" },
  { id: 4, question: "if we could travel anywhere tomorrow, where would we go?" },
];

export default function QAPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [answer, setAnswer] = useState('');

  const nextCard = () => {
    setIsFlipped(false);
    setAnswer('');
    setCurrentIndex((prev) => (prev + 1) % QUESTIONS.length);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.trim()) setIsFlipped(true);
  };

  return (
    <main className="min-h-screen bg-ivory-cream flex flex-col pt-6 font-maitree overflow-hidden text-wild-berry lowercase">
      {/* nav bar */}
      <nav className="flex justify-between items-center w-full px-12 py-4 text-3xl tracking-widest z-10">
        <Link href="/home" className="opacity-50 hover:opacity-100">home</Link>
        <Link href="/browse" className="opacity-50 hover:opacity-100">browse</Link>
        <Link href="/calendar" className="opacity-50 hover:opacity-100">calendar</Link>
        <Link href="/chat" className="opacity-50 hover:opacity-100">chat</Link>
        <Link href="/q&a" className="border-b border-wild-berry">q&a</Link>
        <Link href="/mems" className="opacity-50 hover:opacity-100">mems</Link>
        <Link href="/account" className="opacity-50 hover:opacity-100">account</Link>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-12 relative">
        <div className="text-center mb-12">
          <h1 className="text-9xl font-regular tracking-tighter opacity-80 leading-[0.5]">questions</h1>
        </div>

        {/* card container */}
        <div className="relative w-full max-w-2xl aspect-[4/3] perspective-1000">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => info.offset.x < -100 && nextCard()}
              className="w-full h-full cursor-grab active:cursor-grabbing"
            >
              <motion.div
                className="w-full h-full relative transition-all duration-500 preserve-3d"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              >
                {/* question side */}
                <div className="absolute inset-0 backface-hidden bg-[#2D0A16] rounded-[60px] p-16 flex flex-col items-center justify-center text-center shadow-2xl border border-white/10">
                  <p className="text-3xl text-[#DFE4EA] italic mb-12 px-8 leading-relaxed">
                    {QUESTIONS[currentIndex].question}
                  </p>
                  <form onSubmit={handleSend} className="w-full max-w-md relative">
                    <input 
                      type="text" 
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="type your answer here ..." 
                      className="w-full bg-[#B8C2CC] rounded-full py-4 px-8 pr-16 text-wild-berry outline-none placeholder-wild-berry/40 text-lg"
                    />
                    <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-wild-berry/60 hover:text-wild-berry transition-colors">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                  </form>
                </div>

                {/* answers side */}
                <div className="absolute inset-0 backface-hidden bg-[#2D0A16] rounded-[60px] p-16 flex flex-col items-center justify-center gap-10 shadow-2xl rotate-y-180 border border-white/10">
                  <div className="w-full space-y-2">
                    <p className="text-[#DFE4EA]/40 text-xl italic text-center">your response</p>
                    <div className="bg-[#B8C2CC] rounded-full py-4 px-8 text-wild-berry text-lg text-center truncate">
                      {answer}
                    </div>
                  </div>
                  <div className="w-full space-y-2">
                    <p className="text-[#DFE4EA]/40 text-xl italic text-center">their response</p>
                    <div className="bg-[#B8C2CC] rounded-full py-4 px-8 text-wild-berry/50 text-lg text-center italic">
                      waiting for partner ...
                    </div>
                  </div>
                  <button onClick={nextCard} className="mt-4 text-[#DFE4EA]/60 hover:text-[#DFE4EA] text-lg underline underline-offset-4">swipe for next question</button>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="text-center mt-12">
          <h1 className="text-9xl font-regular tracking-tighter opacity-80 leading-[0.5]">answers</h1>
        </div>

        {/* mobile/desktop swipe */}
      </div>

      <style jsx global>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </main>
  );
}