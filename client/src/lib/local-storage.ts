import { type PromptWithCategory } from "@shared/schema";

const SAVED_PROMPTS_KEY = "better-prompt-saved-prompts";
const USER_PROMPTS_KEY = "better-prompt-user-prompts";

export interface SavedPromptData {
  id: string;
  savedAt: Date;
}

export interface UserPromptData extends PromptWithCategory {
  isUserCreated: boolean;
}

export class LocalStorageService {
  // Saved prompts management
  getSavedPrompts(): SavedPromptData[] {
    try {
      const saved = localStorage.getItem(SAVED_PROMPTS_KEY);
      if (!saved) return [];
      
      const parsed = JSON.parse(saved);
      return parsed.map((item: any) => ({
        ...item,
        savedAt: new Date(item.savedAt)
      }));
    } catch (error) {
      console.error("Error loading saved prompts:", error);
      return [];
    }
  }

  savePrompt(promptId: string): void {
    try {
      const savedPrompts = this.getSavedPrompts();
      const isAlreadySaved = savedPrompts.some(saved => saved.id === promptId);
      
      if (!isAlreadySaved) {
        savedPrompts.push({
          id: promptId,
          savedAt: new Date()
        });
        localStorage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(savedPrompts));
      }
    } catch (error) {
      console.error("Error saving prompt:", error);
    }
  }

  unsavePrompt(promptId: string): void {
    try {
      const savedPrompts = this.getSavedPrompts();
      const filtered = savedPrompts.filter(saved => saved.id !== promptId);
      localStorage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error("Error unsaving prompt:", error);
    }
  }

  isPromptSaved(promptId: string): boolean {
    const savedPrompts = this.getSavedPrompts();
    return savedPrompts.some(saved => saved.id === promptId);
  }

  // User-created prompts management
  getUserPrompts(): UserPromptData[] {
    try {
      const userPrompts = localStorage.getItem(USER_PROMPTS_KEY);
      if (!userPrompts) return [];
      
      const parsed = JSON.parse(userPrompts);
      return parsed.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt)
      }));
    } catch (error) {
      console.error("Error loading user prompts:", error);
      return [];
    }
  }

  saveUserPrompt(prompt: PromptWithCategory): void {
    try {
      const userPrompts = this.getUserPrompts();
      const userPrompt: UserPromptData = {
        ...prompt,
        isUserCreated: true
      };
      
      // Check if prompt already exists and update, otherwise add new
      const existingIndex = userPrompts.findIndex(p => p.id === prompt.id);
      if (existingIndex >= 0) {
        userPrompts[existingIndex] = userPrompt;
      } else {
        userPrompts.push(userPrompt);
      }
      
      localStorage.setItem(USER_PROMPTS_KEY, JSON.stringify(userPrompts));
    } catch (error) {
      console.error("Error saving user prompt:", error);
    }
  }

  deleteUserPrompt(promptId: string): void {
    try {
      const userPrompts = this.getUserPrompts();
      const filtered = userPrompts.filter(prompt => prompt.id !== promptId);
      localStorage.setItem(USER_PROMPTS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error("Error deleting user prompt:", error);
    }
  }

  // Copy to clipboard utility
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);
        return successful;
      }
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      return false;
    }
  }

  // Clear all data
  clearAllData(): void {
    try {
      localStorage.removeItem(SAVED_PROMPTS_KEY);
      localStorage.removeItem(USER_PROMPTS_KEY);
    } catch (error) {
      console.error("Error clearing data:", error);
    }
  }
}

export const localStorageService = new LocalStorageService();
