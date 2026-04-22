import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const ANTHROPIC_API_URL = 'https://api.minimaxi.com/anthropic/v1';

const SYSTEM_PROMPT = `你是一个AI提示词元数据生成助手。根据用户提供的提示词内容，生成一个简洁的标题和简明的描述。
只输出严格的JSON，不包含任何其他内容：
{"title":"标题（不超过25字）","description":"用途描述（不超过60字）"}
如果内容是英文则用英文输出，中文则用中文。只输出JSON。`;

export async function POST(req) {
  try {
    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const anthropic = new Anthropic({
      apiKey,
      baseURL: ANTHROPIC_API_URL,
    });

    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: `提示词内容：\n${content.slice(0, 2000)}` },
      ],
      temperature: 0.3,
    });

    const text = response.content?.[0]?.text ?? '';

    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse response' }, { status: 500 });
    }

    const meta = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      title: meta.title || '',
      description: meta.description || '',
    });
  } catch (error) {
    console.error('Error in meta generate route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
