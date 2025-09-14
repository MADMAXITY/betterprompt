import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Category, type PromptWithCategory } from "@shared/schema";
import { localStorageService } from "@/lib/local-storage";

interface SidebarProps {
  selectedCategory?: string;
  onCategorySelect: (categoryId: string | undefined) => void;
  onAIGenerate: (goal: string) => void;
  isGenerating: boolean;
}

export default function Sidebar({ 
  selectedCategory, 
  onCategorySelect, 
  onAIGenerate,
  isGenerating 
}: SidebarProps) {
  const [aiGoal, setAiGoal] = useState("");
  const savedPrompts = localStorageService.getSavedPrompts();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: allPrompts = [] } = useQuery<PromptWithCategory[]>({
    queryKey: ["/api/prompts"],
  });

  const getCategoryPromptCount = (categoryId: string) => {
    return allPrompts.filter((prompt) => prompt.categoryId === categoryId).length;
  };

  const getCategoryColor = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case "writing": return "bg-primary/10 text-primary";
      case "coding": return "bg-green-500/10 text-green-600 dark:text-green-400";
      case "marketing": return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "business": return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
      case "education": return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
      default: return "bg-muted/50 text-muted-foreground";
    }
  };

  const handleAISubmit = () => {
    if (aiGoal.trim() && !isGenerating) {
      onAIGenerate(aiGoal.trim());
    }
  };

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-80 bg-card border-r border-border">
      <div className="flex-1 p-6">
        {/* AI Prompt Builder Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">AI Prompt Builder</h2>
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10">
            <CardContent className="p-4">
              <div className="mb-3">
                <label className="block text-sm font-medium text-foreground mb-2">
                  What do you want to create?
                </label>
                <Input 
                  value={aiGoal}
                  onChange={(e) => setAiGoal(e.target.value)}
                  placeholder="e.g., Email marketing campaign for SaaS product"
                  className="bg-background border-border focus:ring-ring"
                  onKeyDown={(e) => e.key === "Enter" && handleAISubmit()}
                  data-testid="input-ai-goal"
                />
              </div>
              <Button 
                onClick={handleAISubmit}
                disabled={!aiGoal.trim() || isGenerating}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                data-testid="button-generate-prompt"
              >
                <i className={`fas ${isGenerating ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'} mr-2`}></i>
                {isGenerating ? "Generating..." : "Generate Prompt"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Categories */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Categories</h2>
          <div className="space-y-2">
            <Button
              variant="ghost"
              className={`w-full justify-between px-3 py-2 h-auto ${
                !selectedCategory ? "bg-accent text-accent-foreground" : "hover:bg-accent"
              }`}
              onClick={() => onCategorySelect(undefined)}
              data-testid="button-category-all"
            >
              <div className="flex items-center space-x-3">
                <i className="fas fa-grid-2 text-primary w-4"></i>
                <span className="text-foreground">All Categories</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {allPrompts.length}
              </Badge>
            </Button>
            
            {categories.map((category) => (
              <Button
                key={category.id}
                variant="ghost"
                className={`w-full justify-between px-3 py-2 h-auto ${
                  selectedCategory === category.id ? "bg-accent text-accent-foreground" : "hover:bg-accent"
                }`}
                onClick={() => onCategorySelect(category.id)}
                data-testid={`button-category-${category.name.toLowerCase()}`}
              >
                <div className="flex items-center space-x-3">
                  <i className={`${category.icon} text-primary w-4`}></i>
                  <span className="text-foreground">{category.name}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {getCategoryPromptCount(category.id)}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* My Prompts */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">My Prompts</h2>
          <div className="space-y-2">
            {savedPrompts.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                <i className="fas fa-bookmark text-2xl text-muted-foreground mb-2 block"></i>
                No saved prompts yet
              </div>
            ) : (
              <div className="space-y-2">
                {savedPrompts.slice(0, 5).map((saved) => (
                  <div
                    key={saved.id}
                    className="text-sm text-foreground p-2 rounded hover:bg-accent transition-colors cursor-pointer"
                    data-testid={`saved-prompt-${saved.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">Saved Prompt</span>
                      <i className="fas fa-bookmark text-primary text-xs"></i>
                    </div>
                  </div>
                ))}
                {savedPrompts.length > 5 && (
                  <div className="text-xs text-muted-foreground text-center pt-2">
                    And {savedPrompts.length - 5} more...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
