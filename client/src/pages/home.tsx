import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import NavigationBar from "@/components/navigation-bar";
import Sidebar from "@/components/sidebar";
import SearchHeader from "@/components/search-header";
import PromptCard from "@/components/prompt-card";
import PromptEditorModal from "@/components/prompt-editor-modal";
import AIEditModal from "@/components/ai-edit-modal";
import MobileNavigation from "@/components/mobile-navigation";
import { type PromptWithCategory } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { getSavedPrompts as apiGetSavedPrompts } from "@/lib/api";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState<PromptWithCategory | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [aiEditPrompt, setAiEditPrompt] = useState<PromptWithCategory | null>(null);
  const [isAiEditOpen, setIsAiEditOpen] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Saved prompts for logged-in users (to color bookmarks and prevent duplicates)
  const { data: savedPromptsServer = [] } = useQuery<PromptWithCategory[]>({
    queryKey: ["/api/saved-prompts"],
    enabled: !!user,
    queryFn: apiGetSavedPrompts,
  });
  const savedIds = useMemo(() => new Set(savedPromptsServer.map((p) => p.id)), [savedPromptsServer]);

  // Fetch prompts with filters
  const { data: allPrompts = [], isLoading: isLoadingPrompts } = useQuery<PromptWithCategory[]>({
    queryKey: ["/api/prompts", { category: selectedCategory, search: searchQuery }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append("category", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);
      
      const response = await fetch(`/api/prompts?${params}`);
      if (!response.ok) throw new Error("Failed to fetch prompts");
      return response.json();
    },
  });

  // Fetch featured prompts
  const { data: featuredPrompts = [] } = useQuery<PromptWithCategory[]>({
    queryKey: ["/api/prompts", { featured: true }],
    queryFn: async () => {
      const response = await fetch("/api/prompts?featured=true");
      if (!response.ok) throw new Error("Failed to fetch featured prompts");
      return response.json();
    },
  });

  // AI prompt generation
  const generatePromptMutation = useMutation({
    mutationFn: async (goal: string) => {
      const response = await apiRequest("POST", "/api/ai/generate-prompt", { goal });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Prompt Generated!",
        description: "Your AI-generated prompt is ready. Redirecting to the AI Builder...",
      });
      // Navigate to AI builder with generated prompt data
      navigate("/ai-builder", { state: { generatedPrompt: data } });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate prompt. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Filter prompts based on search and category
  const filteredPrompts = useMemo(() => {
    let prompts = allPrompts;
    
    if (!searchQuery && !selectedCategory) {
      return prompts;
    }
    
    return prompts;
  }, [allPrompts, searchQuery, selectedCategory]);

  const handlePromptClick = async (prompt: PromptWithCategory) => {
    // Increment view count
    try {
      await apiRequest("POST", `/api/prompts/${prompt.id}/views`, {});
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
    } catch (error) {
      console.error("Failed to increment view count:", error);
    }
    
    setSelectedPrompt(prompt);
    setIsEditorOpen(true);
  };

  const handleSaveToggle = () => {
    // Refresh queries to update counts
    queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
    if (user) queryClient.invalidateQueries({ queryKey: ["/api/saved-prompts"] });
  };

  const handleEditWithAI = (prompt: PromptWithCategory) => {
    setAiEditPrompt(prompt);
    setIsAiEditOpen(true);
  };

  const handleAIEditComplete = (originalPrompt: PromptWithCategory, editedContent: string) => {
    // Create a new prompt object with the edited content
    const editedPrompt = { 
      ...originalPrompt, 
      content: editedContent,
      title: `${originalPrompt.title} (AI Edited)`
    };
    
    // Open the editor modal with the AI-edited prompt
    setSelectedPrompt(editedPrompt);
    setIsEditorOpen(true);
    setIsAiEditOpen(false);
    setAiEditPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />
      
      <div className="flex min-h-screen">
        <Sidebar 
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          onAIGenerate={(goal) => generatePromptMutation.mutate(goal)}
          isGenerating={generatePromptMutation.isPending}
        />

        <main className="flex-1 min-w-0">
          <SearchHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            totalCount={filteredPrompts.length}
          />

          <div className="p-6 pb-20 lg:pb-6" data-testid="main-content">
            <div className="fade-in">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <i className="fas fa-book-open text-primary"></i>
                  <span>Prompt Library</span>
                </h1>
                <div className="hidden lg:flex items-center space-x-2 text-sm text-muted-foreground">
                  <span data-testid="text-total-prompts">{allPrompts.length} prompts</span>
                  <span>•</span>
                  <span>Updated daily</span>
                </div>
              </div>

              {/* Featured Prompts */}
              {!searchQuery && !selectedCategory && featuredPrompts.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <i className="fas fa-star text-yellow-400"></i>
                    <span>Featured Prompts</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featuredPrompts.map((prompt) => (
                      <PromptCard
                        key={prompt.id}
                        prompt={prompt}
                        onClick={() => handlePromptClick(prompt)}
                        onSaveToggle={handleSaveToggle}
                        onEditWithAI={handleEditWithAI}
                        savedIds={user ? savedIds : undefined}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* All Prompts */}
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <i className="fas fa-list"></i>
                  {searchQuery || selectedCategory ? "Search Results" : "All Prompts"}
                </h2>
                
                {isLoadingPrompts ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-card border border-border rounded-lg p-6 animate-pulse">
                        <div className="h-4 bg-muted rounded w-1/4 mb-3"></div>
                        <div className="h-5 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-full mb-1"></div>
                        <div className="h-3 bg-muted rounded w-2/3 mb-4"></div>
                        <div className="flex justify-between">
                          <div className="h-3 bg-muted rounded w-1/3"></div>
                          <div className="h-3 bg-muted rounded w-1/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredPrompts.length === 0 ? (
                  <div className="text-center py-12">
                    <i className="fas fa-search text-4xl text-muted-foreground mb-4 block"></i>
                    <h3 className="text-lg font-medium text-foreground mb-2">No prompts found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery 
                        ? `No prompts match "${searchQuery}"`
                        : "No prompts available in this category"
                      }
                    </p>
                    <button 
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory(undefined);
                      }}
                      className="text-primary hover:text-primary/80 font-medium"
                      data-testid="button-clear-search"
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPrompts.map((prompt) => (
                      <PromptCard
                        key={prompt.id}
                        prompt={prompt}
                        onClick={() => handlePromptClick(prompt)}
                        onSaveToggle={handleSaveToggle}
                        onEditWithAI={handleEditWithAI}
                        savedIds={user ? savedIds : undefined}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      <MobileNavigation />

      <PromptEditorModal
        prompt={selectedPrompt}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setSelectedPrompt(null);
        }}
        onEditWithAI={handleEditWithAI}
      />

      <AIEditModal
        prompt={aiEditPrompt}
        isOpen={isAiEditOpen}
        onClose={() => {
          setIsAiEditOpen(false);
          setAiEditPrompt(null);
        }}
        onEditComplete={handleAIEditComplete}
      />
    </div>
  );
}
