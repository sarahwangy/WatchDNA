// Anthropic SDK 封装，使用单例模式避免重复创建客户端
import Anthropic from '@anthropic-ai/sdk';

// 行业标准：全局单例，防止每次请求都创建新客户端
const globalForClaude = global as unknown as { claude: Anthropic };

export const claude =
  globalForClaude.claude ||
  new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

if (process.env.NODE_ENV !== 'production') globalForClaude.claude = claude;

// 便捷函数：调用 Claude Haiku（最便宜的模型）生成文本
export async function askClaude(prompt: string): Promise<string> {
  const message = await claude.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');
  return content.text;
}
