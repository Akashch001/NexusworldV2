import { AIProvider, AIRequest, AIResponse } from './provider.ts';

export class OpenCodeProvider implements AIProvider {
  private apiKey: string;
  private endpoint = 'https://opencode.ai/zen/v1/chat/completions';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateResponse(input: AIRequest): Promise<AIResponse> {
    if (!this.apiKey) {
      throw new Error('OpenCode API Key is missing.');
    }

    const messages = [
      { role: 'system', content: input.systemPrompt },
      ...input.messages.map(m => ({ role: m.role, content: m.content }))
    ];

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'nemotron-3.5-lightning-free',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenCode API Error:', errorText);
      throw new Error(`OpenCode API responded with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || 'I encountered an error generating my response.'
    };
  }
}
