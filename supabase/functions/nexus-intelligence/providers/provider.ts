export interface ToolDeclaration {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface AIRequest {
  systemPrompt: string;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  context?: string;
  tools?: ToolDeclaration[];
  toolExecutor?: (name: string, args: Record<string, any>) => Promise<any>;
}

export interface AIResponse {
  content: string;
}

export interface AIProvider {
  generateResponse(input: AIRequest): Promise<AIResponse>;
}
