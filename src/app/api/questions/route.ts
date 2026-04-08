import Groq from 'groq-sdk';
import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '../../../utils/supabase/server';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { coupleId } = await req.json();

  if (!coupleId) {
    return NextResponse.json({ error: 'Missing coupleId' }, { status: 400 });
  }

  // Check if questions already exist for this couple
  const { data: existing } = await supabase
    .from('qa_questions')
    .select('questions')
    .eq('couple_id', coupleId)
    .maybeSingle();

  if (existing?.questions && existing.questions.length > 0) {
    return NextResponse.json({ questions: existing.questions });
  }

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You generate thoughtful, warm questions for couples. Respond with ONLY a valid JSON array of exactly 10 questions as strings. No markdown.`
        },
        {
          role: 'user',
          content: 'Generate 10 fresh couple questions. Varied topics.'
        }
      ],
    });

    const text = response.choices[0].message.content ?? '[]';
    const clean = text.replace(/```json|```/g, '').trim();
    const questions: string[] = JSON.parse(clean);

    await supabase
      .from('qa_questions')
      .upsert(
        { couple_id: coupleId, questions, current_index: 0 },
        { onConflict: 'couple_id' }
      );

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Questions generation error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}