import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  description: text("description"),
});

export const prompts = pgTable("prompts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  categoryId: varchar("category_id").references(() => categories.id).notNull(),
  isFeatured: boolean("is_featured").default(false),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const savedPrompts = pgTable("saved_prompts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  promptId: varchar("prompt_id").references(() => prompts.id).notNull(),
  userId: text("user_id").notNull(), // For future user system
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertPromptSchema = createInsertSchema(prompts).omit({ 
  id: true, 
  views: true, 
  likes: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertSavedPromptSchema = createInsertSchema(savedPrompts).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true });

export type Category = typeof categories.$inferSelect;
export type Prompt = typeof prompts.$inferSelect;
export type SavedPrompt = typeof savedPrompts.$inferSelect;
export type User = typeof users.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertPrompt = z.infer<typeof insertPromptSchema>;
export type InsertSavedPrompt = z.infer<typeof insertSavedPromptSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type PromptWithCategory = Prompt & { category: Category };
