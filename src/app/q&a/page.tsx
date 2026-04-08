'use client'

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '../../utils/supabase/client';

interface Answer {
  user_id: string;
  answer: string;
}

export default function QAPage() {
  const supabase = createClient();

  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [answer, setAnswer] = useState('');
  const [myAnswer, setMyAnswer] = useState<string | null>(null);
  const [partnerAnswer, setPartnerAnswer] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [dragDirection, setDragDirection] = useState(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: profile } = await supabase
        .from('users')
        .select('couple_id')
        .eq('id', user.id)
        .single();

      if (profile?.couple_id) setCoupleId(profile.couple_id);
    };
    init();
  }, [supabase]);

  const generateQuestions = useCallback(async (forCoupleId: string) => {
    setIsLoadingQuestions(true);
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupleId: forCoupleId }),
      });
      const data = await res.json();
      if (data.questions) setQuestions(data.questions);
    } catch (e) {
      console.error('Failed to generate questions:', e);
    } finally {
      setIsLoadingQuestions(false);
    }
  }, []);

  useEffect(() => {
    if (!coupleId) return;

    const loadInitialState = async () => {
      const { data } = await supabase
        .from('qa_questions')
        .select('current_index, questions')
        .eq('couple_id', coupleId)
        .maybeSingle();

      if (data?.questions) {
        setQuestions(data.questions);
        setCurrentIndex(data.current_index ?? 0);
        setIsLoadingQuestions(false);
      } else {
        await generateQuestions(coupleId);
      }
    };

    loadInitialState();

    // Listen to ALL changes on qa_questions for this couple
    const channel = supabase
      .channel(`qa-sync-${coupleId}`)
      .on('postgres_changes', {
        event: '*', 
        schema: 'public',
        table: 'qa_questions',
        filter: `couple_id=eq.${coupleId}`,
      }, (payload: any) => {
        const newData = payload.new;
        if (newData.questions && newData.questions.length > 0) {
          setQuestions(newData.questions);
        }
        setCurrentIndex(newData.current_index ?? 0);
        setIsFlipped(false);
        setMyAnswer(null);
        setPartnerAnswer(null);
        setAnswer('');
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [coupleId, supabase, generateQuestions]);

  const loadAnswers = useCallback(async () => {
    if (!coupleId || !userId || !questions[currentIndex]) return;

    const { data } = await supabase
      .from('qa_answers')
      .select('user_id, answer')
      .eq('couple_id', coupleId)
      .eq('question', questions[currentIndex]);

    if (data) {
      const mine = data.find((a: Answer) => a.user_id === userId);
      const theirs = data.find((a: Answer) => a.user_id !== userId);
      setMyAnswer(mine?.answer ?? null);
      setPartnerAnswer(theirs?.answer ?? null);
      if (mine && theirs) setIsFlipped(true);
    }

    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const channel = supabase
      .channel(`qa-answers-${coupleId}-${currentIndex}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'qa_answers',
        filter: `couple_id=eq.${coupleId}`,
      }, (payload) => {
        if (payload.new.question !== questions[currentIndex]) return;
        if (payload.new.user_id !== userId) {
          setPartnerAnswer(payload.new.answer);
        } else {
          setMyAnswer(payload.new.answer);
        }
      })
      .subscribe();

    channelRef.current = channel;
  }, [coupleId, userId, questions, currentIndex, supabase]);

  useEffect(() => { loadAnswers(); }, [loadAnswers]);

  // Handle Flipping Logic automatically when both answer
  useEffect(() => {
    if (myAnswer && partnerAnswer) {
      setIsFlipped(true);
    }
  }, [myAnswer, partnerAnswer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isSubmitting || !coupleId || !userId || myAnswer) return;
    setIsSubmitting(true);

    const submittedAnswer = answer.trim().toLowerCase();
    const { error } = await supabase.from('qa_answers').insert({
      couple_id: coupleId,
      user_id: userId,
      question: questions[currentIndex],
      answer: submittedAnswer,
    });

    if (!error) {
      setMyAnswer(submittedAnswer);
      setAnswer('');
    }
    setIsSubmitting(false);
  };

  const nextCard = async () => {
    if (!coupleId || !questions.length || isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    try {
      const isLast = currentIndex >= questions.length - 1;

      if (isLast) {
        // Reset state locally first
        setIsLoadingQuestions(true);
        // Clear questions in DB to force API to regenerate
        await supabase
          .from('qa_questions')
          .update({ questions: [], current_index: 0 })
          .eq('couple_id', coupleId);
        
        await generateQuestions(coupleId);
      } else {
        await supabase
          .from('qa_questions')
          .update({ current_index: currentIndex + 1 })
          .eq('couple_id', coupleId);
      }
    } finally {
      setTimeout(() => { isNavigatingRef.current = false; }, 600);
    }
  };

  return (
    <main className="min-h-screen bg-ivory-cream flex flex-col pt-6 font-maitree overflow-hidden text-wild-berry lowercase">
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

        <div className="relative w-full max-w-2xl aspect-[4/3] perspective-1000">
          {isLoadingQuestions ? (
            <div className="w-full h-full bg-[#2D0A16] rounded-[60px] flex items-center justify-center">
              <p className="text-[#DFE4EA]/40 text-2xl italic animate-pulse">generating questions ...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait" custom={dragDirection}>
              <motion.div
                key={currentIndex}
                custom={dragDirection}
                initial={{ opacity: 0, x: dragDirection * 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dragDirection * -60 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                drag={isFlipped ? "x" : false} // Only allow drag if answers are revealed
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (Math.abs(info.offset.x) > 100) {
                    setDragDirection(info.offset.x > 0 ? 1 : -1);
                    nextCard();
                  }
                }}
                className="w-full h-full"
              >
                <motion.div
                  className="w-full h-full relative transition-all duration-500 preserve-3d"
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                >
                  {/* Question side */}
                  <div className="absolute inset-0 backface-hidden bg-[#2D0A16] rounded-[60px] p-16 flex flex-col items-center justify-center text-center shadow-2xl border border-white/10">
                    <p className="text-3xl text-[#DFE4EA] italic mb-10 px-8 leading-relaxed">
                      {questions[currentIndex]}
                    </p>

                    {myAnswer ? (
                      <div className="w-full max-w-md space-y-3 text-center">
                        <div className="bg-[#B8C2CC] rounded-full py-4 px-8 text-wild-berry text-lg">
                          {myAnswer}
                        </div>
                        <p className="text-[#DFE4EA]/30 text-base italic animate-pulse">
                          {partnerAnswer ? '' : 'waiting for partner ...'}
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="w-full max-w-md relative">
                        <input
                          type="text"
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          placeholder="type your answer here ..."
                          className="w-full bg-[#B8C2CC] rounded-full py-4 px-8 pr-16 text-wild-berry outline-none placeholder-wild-berry/40 text-lg"
                          disabled={isSubmitting}
                        />
                        <button
                          type="submit"
                          disabled={isSubmitting || !answer.trim()}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-wild-berry/60 hover:text-wild-berry transition-colors disabled:opacity-20"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                          </svg>
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Answers side */}
                  <div className="absolute inset-0 backface-hidden bg-[#2D0A16] rounded-[60px] p-16 flex flex-col items-center justify-center gap-8 shadow-2xl rotate-y-180 border border-white/10 z-20">
                    <p className="text-[#DFE4EA]/50 text-2xl italic text-center px-4 leading-relaxed">
                      "{questions[currentIndex]}"
                    </p>

                    <div className="w-full space-y-2">
                      <p className="text-[#DFE4EA]/40 text-lg italic text-center">your answer</p>
                      <div className="bg-[#B8C2CC] rounded-full py-4 px-8 text-wild-berry text-lg text-center">
                        {myAnswer}
                      </div>
                    </div>

                    <div className="w-full space-y-2">
                      <p className="text-[#DFE4EA]/40 text-lg italic text-center">their answer</p>
                      <div className="bg-[#B8C2CC] rounded-full py-4 px-8 text-wild-berry text-lg text-center">
                        {partnerAnswer ?? '...'}
                      </div>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); nextCard(); }}
                      className="mt-2 text-[#DFE4EA]/50 hover:text-[#DFE4EA] text-lg underline underline-offset-4 transition-colors relative z-30"
                    >
                      swipe or tap for next →
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        <div className="text-center mt-12">
          <h1 className="text-9xl font-regular tracking-tighter opacity-80 leading-[0.5]">answers</h1>
        </div>
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