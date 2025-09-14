import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

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

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1500
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
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

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1500
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
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

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this prompt and suggest improvements:\n\n${currentPrompt}` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.5,
        max_tokens: 500
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.suggestions || [];
    } catch (error) {
      console.error("Failed to generate suggestions:", error);
      return [];
    }
  }
}

export const aiService = new AIService();
