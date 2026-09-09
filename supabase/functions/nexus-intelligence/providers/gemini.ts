import { AIProvider, AIRequest, AIResponse } from './provider.ts';

export class GeminiProvider implements AIProvider {
  private apiKey: string;
  private model = 'gemini-1.5-flash';
  private endpoint: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
  }

  async generateResponse(input: AIRequest): Promise<AIResponse> {
    if (!this.apiKey) {
      throw new Error('Gemini API Key is missing.');
    }

    // Format messages for Gemini API
    const contents: any[] = input.messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const toolsConfig = input.tools && input.tools.length > 0 ? [
      {
        functionDeclarations: input.tools
      }
    ] : undefined;

    let turns = 0;
    const maxTurns = 3;

    while (turns < maxTurns) {
      turns++;

      const body: any = {
        systemInstruction: {
          role: "user",
          parts: [{ text: input.systemPrompt }]
        },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        }
      };

      if (toolsConfig) {
        body.tools = toolsConfig;
      }

      let response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.status === 429) {
        const clonedResponse = response.clone();
        let errorText = '';
        try {
           errorText = await clonedResponse.text();
        } catch (_) {}

        if (errorText.toLowerCase().includes('quota')) {
          console.error('Gemini 429 QUOTA EXHAUSTED:', errorText);
          throw new Error('QUOTA_EXHAUSTED');
        }

        console.warn('Gemini 429 rate limit received. Backing off 3s before retry...');
        await new Promise(r => setTimeout(r, 3000));
        response = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
      }

      if (!response.ok) {
        let errorText = await response.text();
        try {
          const parsed = JSON.parse(errorText);
          errorText = parsed.error?.message || errorText;
        } catch (_) {}

        console.error('Gemini API Error:', errorText);

        throw new Error(`Gemini Error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];
      const candidateContent = candidate?.content;
      const parts = candidateContent?.parts || [];

      // Check if Gemini invoked a function call
      const functionCallPart = parts.find((p: any) => p.functionCall);

      if (functionCallPart && input.toolExecutor) {
        const { name, args } = functionCallPart.functionCall;
        console.log(`Gemini requested tool execution: ${name}`);

        // Append the model's functionCall turn to contents
        contents.push(candidateContent);

        // Execute server-side tool action safely
        let toolResult: any;
        try {
          toolResult = await input.toolExecutor(name, args || {});
        } catch (err: any) {
          console.error(`Tool execution error for ${name}:`, err);
          toolResult = { error: err.message || 'Action execution failed' };
        }

        // Append the functionResponse turn in Gemini format (role: 'user')
        contents.push({
          role: 'user',
          parts: [
            {
              functionResponse: {
                name,
                response: {
                  output: toolResult,
                }
              }
            }
          ]
        });

        // Continue next loop turn so Gemini generates natural conversational continuation
        continue;
      }

      // Check for normal text response
      const textPart = parts.find((p: any) => p.text);
      if (textPart && textPart.text) {
        return { content: textPart.text };
      }

      if (candidateContent?.parts?.[0]?.text) {
        return { content: candidateContent.parts[0].text };
      }

      break;
    }

    return {
      content: "I've noted that down. What else can I help you explore regarding your project?"
    };
  }
}
