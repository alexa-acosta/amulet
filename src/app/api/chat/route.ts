import Groq from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../utils/supabase/server';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `you are aven, a warm and thoughtful assistant built into a couples app. your purpose is to help partners stay connected, communicate better, and feel supported.

your personality:
- calm, gentle, and non-judgmental
- speak in all lowercase — it's part of your aesthetic
- concise but meaningful. never rambling.
- you don't give generic advice. you ask good questions and listen.
- you care about both people in the relationship, not just the one talking to you

never break character. never use uppercase. never mention that you're built on groq, llama, or any other ai.`;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { message, history, chatId: existingChatId } = await req.json();

    // Get user's couple_id
    const { data: profile } = await supabase
      .from('users')
      .select('couple_id')
      .eq('id', user.id)
      .single();

    // Create a new chat if none exists
    let chatId = existingChatId;
    if (!chatId) {
      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert({
          user_id: user.id,
          couple_id: profile?.couple_id ?? null,
          title: message.slice(0, 40), // use first message as title
          shared: false,
        })
        .select()
        .single();

      if (chatError || !newChat) {
        console.error('Error creating chat:', chatError);
        return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
      }
      chatId = newChat.id;
    }

    // Save user message
    await supabase.from('chat_messages').insert({
      chat_id: chatId,
      couple_id: profile?.couple_id ?? null,
      user_id: user.id,
      text: message,
      sender: 'user',
    });

    // Call Groq
    const formattedHistory = history.map((m: { sender: string; text: string }) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
    }));

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...formattedHistory,
        { role: 'user', content: message },
      ],
    });

    const text = response.choices[0].message.content ?? '';

    // Save aven's response
    await supabase.from('chat_messages').insert({
      chat_id: chatId,
      couple_id: profile?.couple_id ?? null,
      user_id: user.id,
      text,
      sender: 'aven',
    });

    return NextResponse.json({ text, chatId });

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// Share a chat with partner
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { chatId } = await req.json();

    const { error } = await supabase
      .from('chats')
      .update({ shared: true })
      .eq('id', chatId)
      .eq('user_id', user.id); // only the owner can share

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}