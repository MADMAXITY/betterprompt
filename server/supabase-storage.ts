import { createClient } from "@supabase/supabase-js";
import type {
  User,
  InsertUser,
  Category,
  InsertCategory,
  Prompt,
  InsertPrompt,
  SavedPrompt,
  InsertSavedPrompt,
  PromptWithCategory,
} from "../shared/schema";
import { seededCategories, seededPrompts } from "./default-data";

type DbPrompt = Omit<Prompt, "createdAt" | "updatedAt"> & {
  created_at: string | null;
  updated_at: string | null;
};

export class SupabaseStorage {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY)!,
  );

  constructor() {
    // fire and forget seed
    this.seedIfEmpty().catch(() => {});
  }

  private toPrompt(row: any): Prompt {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      content: row.content,
      categoryId: row.category_id,
      isFeatured: !!row.is_featured,
      views: row.views ?? 0,
      likes: row.likes ?? 0,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    };
  }

  private async seedIfEmpty() {
    // Only attempt seeding when using service role; anon key cannot upsert with RLS typically
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
    const { count: catCount } = await this.supabase
      .from("categories")
      .select("id", { count: "exact", head: true });
    if (!catCount || catCount === 0) {
      await this.supabase.from("categories").upsert(
        seededCategories.map((c) => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          color: c.color,
          description: c.description,
        })),
        { onConflict: "id" },
      );
    }

    const { count: pCount } = await this.supabase
      .from("prompts")
      .select("id", { count: "exact", head: true });
    if (!pCount || pCount === 0) {
      await this.supabase.from("prompts").upsert(
        seededPrompts.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          content: p.content,
          category_id: p.categoryId,
          is_featured: p.isFeatured,
          views: p.views,
          likes: p.likes,
          created_at: p.createdAt.toISOString(),
          updated_at: p.updatedAt.toISOString(),
        })),
        { onConflict: "id" },
      );
    }
  }

  // User methods (basic placeholder implementations)
  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) return undefined;
    return data as User | undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data } = await this.supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .maybeSingle();
    return (data as User) || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const { data, error } = await this.supabase
      .from("users")
      .insert(user)
      .select("*")
      .single();
    if (error) throw error;
    return data as User;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    const { data, error } = await this.supabase
      .from("categories")
      .select("*")
      .order("name");
    if (error) throw error;
    return (data as any[]) as Category[];
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    const { data } = await this.supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return (data as Category) || undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const { data, error } = await this.supabase
      .from("categories")
      .insert(category)
      .select("*")
      .single();
    if (error) throw error;
    return data as Category;
  }

  // Prompt methods
  async getPrompts(): Promise<PromptWithCategory[]> {
    const { data, error } = await this.supabase
      .from("prompts")
      .select("*, category:categories(*)")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((row: any) => ({
      ...this.toPrompt(row),
      category: row.category as Category,
    }));
  }

  async getPromptById(id: string): Promise<PromptWithCategory | undefined> {
    const { data } = await this.supabase
      .from("prompts")
      .select("*, category:categories(*)")
      .eq("id", id)
      .maybeSingle();
    if (!data) return undefined;
    return { ...this.toPrompt(data), category: (data as any).category as Category };
  }

  async getPromptsByCategory(categoryId: string): Promise<PromptWithCategory[]> {
    const { data, error } = await this.supabase
      .from("prompts")
      .select("*, category:categories(*)")
      .eq("category_id", categoryId);
    if (error) throw error;
    return (data || []).map((row: any) => ({
      ...this.toPrompt(row),
      category: row.category as Category,
    }));
  }

  async getFeaturedPrompts(): Promise<PromptWithCategory[]> {
    const { data, error } = await this.supabase
      .from("prompts")
      .select("*, category:categories(*)")
      .eq("is_featured", true);
    if (error) throw error;
    return (data || []).map((row: any) => ({
      ...this.toPrompt(row),
      category: row.category as Category,
    }));
  }

  async searchPrompts(query: string): Promise<PromptWithCategory[]> {
    const q = `%${query}%`;
    const { data, error } = await this.supabase
      .from("prompts")
      .select("*, category:categories(*)")
      .or(
        `title.ilike.${q},description.ilike.${q},content.ilike.${q}`,
      );
    if (error) throw error;
    return (data || []).map((row: any) => ({
      ...this.toPrompt(row),
      category: row.category as Category,
    }));
  }

  async createPrompt(insertPrompt: InsertPrompt): Promise<Prompt> {
    const payload = {
      title: insertPrompt.title,
      description: insertPrompt.description,
      content: insertPrompt.content,
      category_id: insertPrompt.categoryId,
      is_featured: insertPrompt.isFeatured ?? false,
    };
    const { data, error } = await this.supabase
      .from("prompts")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw error;
    return this.toPrompt(data);
  }

  async updatePrompt(id: string, updates: Partial<InsertPrompt>): Promise<Prompt | undefined> {
    const payload: any = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.content !== undefined) payload.content = updates.content;
    if (updates.categoryId !== undefined) payload.category_id = updates.categoryId;
    if (updates.isFeatured !== undefined) payload.is_featured = updates.isFeatured;
    const { data, error } = await this.supabase
      .from("prompts")
      .update(payload)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data ? this.toPrompt(data) : undefined;
  }

  async incrementPromptViews(id: string): Promise<void> {
    const { data } = await this.supabase
      .from("prompts")
      .select("views")
      .eq("id", id)
      .maybeSingle();
    const current = (data?.views ?? 0) as number;
    await this.supabase.from("prompts").update({ views: current + 1 }).eq("id", id);
  }

  async incrementPromptLikes(id: string): Promise<void> {
    const { data } = await this.supabase
      .from("prompts")
      .select("likes")
      .eq("id", id)
      .maybeSingle();
    const current = (data?.likes ?? 0) as number;
    await this.supabase.from("prompts").update({ likes: current + 1 }).eq("id", id);
  }

  // Saved prompts
  async getSavedPrompts(userId: string): Promise<PromptWithCategory[]> {
    const { data, error } = await this.supabase
      .from("saved_prompts")
      .select("prompt:prompts(*, category:categories(*))")
      .eq("user_id", userId);
    if (error) throw error;
    return (data || []).map((row: any) => ({
      ...(this.toPrompt(row.prompt)),
      category: row.prompt.category as Category,
    }));
  }

  async savePrompt(insertSavedPrompt: InsertSavedPrompt): Promise<SavedPrompt> {
    const { data, error } = await this.supabase
      .from("saved_prompts")
      .insert({ prompt_id: insertSavedPrompt.promptId, user_id: insertSavedPrompt.userId })
      .select("*")
      .single();
    if (error) throw error;
    return {
      id: data.id,
      promptId: data.prompt_id,
      userId: data.user_id,
      createdAt: data.created_at ? new Date(data.created_at) : new Date(),
    };
  }

  async unsavePrompt(promptId: string, userId: string): Promise<void> {
    await this.supabase
      .from("saved_prompts")
      .delete()
      .match({ prompt_id: promptId, user_id: userId });
  }

  async isPromptSaved(promptId: string, userId: string): Promise<boolean> {
    const { count } = await this.supabase
      .from("saved_prompts")
      .select("id", { count: "exact", head: true })
      .match({ prompt_id: promptId, user_id: userId });
    return !!count && count > 0;
  }
}
