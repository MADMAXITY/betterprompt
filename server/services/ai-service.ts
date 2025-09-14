import OpenAI from "openai";

// Model and sampling config
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-5-mini"; // requested by user
const RAW_TEMPERATURE = process.env.OPENAI_TEMPERATURE;
const TEMPERATURE = RAW_TEMPERATURE !== undefined && RAW_TEMPERATURE !== ""
  ? Number(RAW_TEMPERATURE)
  : undefined;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key",
});

async function createJsonChatCompletion(messages: Array<{ role: string; content: string }>) {
  const params: any = {
    model: DEFAULT_MODEL,
    messages,
    response_format: { type: "json_object" },
  };
  // Only set temperature if provided; some models restrict accepted values
  if (typeof TEMPERATURE === "number" && Number.isFinite(TEMPERATURE)) {
    params.temperature = TEMPERATURE;
  }
  return openai.chat.completions.create(params);
}

export interface PromptGenerationRequest {
  goal: string;
  category?: string;
  audience?: string;
  tone?: string;
  additionalContext?: string;
}

export interface PromptGenerationResponse {
  title: string;
  description: string;
  content: string;
  suggestedCategory: string;
}

export interface PromptRefinementRequest {
  originalPrompt: string;
  refinementGoal: string;
}

export interface PromptRefinementResponse {
  refinedPrompt: string;
  improvements: string[];
}

export class AIService {
  async generatePrompt(request: PromptGenerationRequest): Promise<PromptGenerationResponse> {
    try {
      const systemPrompt = `You are an expert prompt engineer who specializes in creating high-quality, effective prompts for various AI applications. Your task is to generate a comprehensive, reusable prompt based on the user's goal.

Create a detailed prompt that:
1. Is clear and specific in its instructions
2. Includes relevant context and constraints
3. Specifies the desired output format
4. Includes placeholders for customization (use [PLACEHOLDER] format)
5. Follows best practices for prompt engineering

Respond with JSON in this exact format:
{
  "title": "Brief, descriptive title for the prompt",
  "description": "One-sentence description of what this prompt does",
  "content": "The full prompt text with [PLACEHOLDERS] for customization",
  "suggestedCategory": "Most appropriate category (Writing, Coding, Marketing, Business, or Education)"
}`;

      const userPrompt = `Generate a prompt for this goal: "${request.goal}"

Additional context:
- Category preference: ${request.category || "Not specified"}
- Target audience: ${request.audience || "General"}
- Desired tone: ${request.tone || "Professional"}
- Additional context: ${request.additionalContext || "None"}

Create a comprehensive, reusable prompt that achieves this goal effectively.`;

      const response = await createJsonChatCompletion([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ]);

      const content = response.choices?.[0]?.message?.content ?? "{}";
      const result = JSON.parse(content);
      
      return {
        title: result.title || "Generated Prompt",
        description: result.description || "AI-generated prompt",
        content: result.content || "",
        suggestedCategory: result.suggestedCategory || "Writing"
      };
    } catch (error) {
      throw new Error(`Failed to generate prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async refinePrompt(request: PromptRefinementRequest): Promise<PromptRefinementResponse> {
    try {
      const systemPrompt = `You are an expert prompt engineer who specializes in refining and improving prompts. Analyze the given prompt and improve it based on the specified goal.

Focus on:
1. Clarity and specificity
2. Better structure and organization
3. More effective instructions
4. Improved output formatting
5. Better use of placeholders and variables

Respond with JSON in this exact format:
{
  "refinedPrompt": "The improved version of the prompt",
  "improvements": ["List of specific improvements made", "Each improvement as a separate string"]
}`;

      const userPrompt = `Original prompt:
${request.originalPrompt}

Refinement goal: ${request.refinementGoal}

Please refine this prompt to better achieve the stated goal.`;

      const response = await createJsonChatCompletion([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ]);

      const content = response.choices?.[0]?.message?.content ?? "{}";
      const result = JSON.parse(content);
      
      return {
        refinedPrompt: result.refinedPrompt || request.originalPrompt,
        improvements: result.improvements || []
      };
    } catch (error) {
      throw new Error(`Failed to refine prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generatePromptSuggestions(currentPrompt: string): Promise<string[]> {
    try {
      const systemPrompt = `You are an expert prompt engineer. Analyze the given prompt and suggest 3-5 specific improvements that could make it more effective.

Respond with JSON in this format:
{
  "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
}`;

      const response = await createJsonChatCompletion([
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze this prompt and suggest improvements:\n\n${currentPrompt}` },
      ]);

      const content = response.choices?.[0]?.message?.content ?? "{}";
      const result = JSON.parse(content);
      return result.suggestions || [];
    } catch (error) {
      console.error("Failed to generate suggestions:", error);
      return [];
    }
  }

  async chatPromptBuilder(messages: Array<{role: string, content: string}>): Promise<{
    message: string;
    suggestions?: string[];
    isComplete: boolean;
    finalPrompt?: string;
    title?: string;
    category?: string;
    description?: string;
  }> {
    try {
      const systemPrompt = `You are an expert prompt engineer who helps users create perfect prompts through natural conversation. Your goal is to understand their needs through dialogue and eventually create a comprehensive, professional prompt.

Process:
1. Start with friendly greeting and ask about their goal
2. Ask follow-up questions to understand:
   - What they want to accomplish
   - Who the target audience is
   - What tone/style they prefer
   - What format they want the output in
   - Any specific constraints or requirements
3. When you have enough information (usually 3-4 exchanges), create the final prompt

Response format - ALWAYS respond with JSON:
For ongoing conversation:
{
  "message": "Your conversational response with follow-up question",
  "suggestions": ["Quick response option 1", "Quick response option 2", "Quick response option 3"],
  "isComplete": false
}

For final completion:
{
  "message": "Perfect! I've created your custom prompt based on our conversation.",
  "isComplete": true,
  "finalPrompt": "The complete, professional prompt with [PLACEHOLDERS]",
  "title": "Descriptive title for the prompt", 
  "category": "Writing|Coding|Marketing|Business|Education|Creative|Productivity",
  "description": "Brief description of what this prompt does"
}

Keep the conversation natural, friendly, and focused. Ask one key question at a time.`;

      const response = await createJsonChatCompletion([
        { role: "system", content: systemPrompt },
        ...messages,
      ]);

      const content = response.choices?.[0]?.message?.content ?? "{}";
      const result = JSON.parse(content);
      
      return {
        message: result.message || "I'd be happy to help you create a great prompt! What would you like to accomplish?",
        suggestions: result.suggestions,
        isComplete: result.isComplete || false,
        finalPrompt: result.finalPrompt,
        title: result.title,
        category: result.category,
        description: result.description
      };
    } catch (error) {
      console.error("Failed to process chat:", error);
      return {
        message: "I apologize, but I'm having trouble processing that. Could you try rephrasing your request?",
        isComplete: false
      };
    }
  }
}

export const aiService = new AIService();
