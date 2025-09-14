import { useState, useMemo } from "react";
import NavigationBar from "@/components/navigation-bar";
import SearchHeader from "@/components/search-header";
import PromptCard from "@/components/prompt-card";
import PromptEditorModal from "@/components/prompt-editor-modal";
import AIEditModal from "@/components/ai-edit-modal";
import MobileNavigation from "@/components/mobile-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { type PromptWithCategory } from "@shared/schema";
import { localStorageService, type UserPromptData } from "@/lib/local-storage";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { getSavedPrompts as apiGetSavedPrompts, unsavePrompt as apiUnsavePrompt } from "@/lib/api";

export default function MyPrompts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedPrompt, setSelectedPrompt] = useState<PromptWithCategory | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [aiEditPrompt, setAiEditPrompt] = useState<PromptWithCategory | null>(null);
  const [isAiEditOpen, setIsAiEditOpen] = useState(false);
  const initialTab = (() => {
    try {
      const p = new URLSearchParams(window.location.search).get("tab");
      return p === "created" ? "created" : "saved";
    } catch {
      return "saved";
    }
  })();
  const [activeTab, setActiveTab] = useState(initialTab);
  type DeleteTarget = { id: string; type: 'saved' | 'created' } | null;
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const { toast } = useToast();

  const { user } = useAuth();
  // Saved prompts: server if logged in, otherwise fallback to localStorage
  const savedPromptIds = user ? [] : localStorageService.getSavedPrompts();
  const { data: serverSavedPrompts = [], refetch: refetchSaved } = useQuery<PromptWithCategory[]>({
    queryKey: ["/api/saved-prompts"],
    enabled: !!user,
    queryFn: apiGetSavedPrompts,
  });
  const userPrompts = localStorageService.getUserPrompts();

  // Fetch actual prompt data for saved prompts
  const { data: allPrompts = [] } = useQuery<PromptWithCategory[]>({
    queryKey: ["/api/prompts"],
  });

  const savedPrompts = useMemo(() => {
    if (user) return serverSavedPrompts;
    return savedPromptIds
      .map(saved => allPrompts.find(prompt => prompt.id === saved.id))
      .filter(prompt => prompt !== undefined)
      .map(prompt => prompt!);
  }, [user, serverSavedPrompts, savedPromptIds, allPrompts]);

  // Filter prompts based on search and category
  const filteredSavedPrompts = useMemo(() => {
    let prompts = savedPrompts;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      prompts = prompts.filter(prompt => 
        prompt.title.toLowerCase().includes(query) ||
        prompt.description.toLowerCase().includes(query)
      );
    }
    
    if (selectedCategory) {
      prompts = prompts.filter(prompt => prompt.categoryId === selectedCategory);
    }
    
    return prompts;
  }, [savedPrompts, searchQuery, selectedCategory]);

  const filteredUserPrompts = useMemo(() => {
    let prompts = userPrompts;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      prompts = prompts.filter(prompt => 
        prompt.title.toLowerCase().includes(query) ||
        prompt.description.toLowerCase().includes(query)
      );
    }
    
    if (selectedCategory) {
      prompts = prompts.filter(prompt => prompt.categoryId === selectedCategory);
    }
    
    return prompts;
  }, [userPrompts, searchQuery, selectedCategory]);

  const handlePromptClick = (prompt: PromptWithCategory) => {
    setSelectedPrompt(prompt);
    setIsEditorOpen(true);
  };

  const handleSaveToggle = () => {
    // Refresh from server when authed; otherwise rely on local reload
    if (user) refetchSaved(); else window.location.reload();
  };

  const handleDeleteUserPrompt = (promptId: string) => {
    localStorageService.deleteUserPrompt(promptId);
    toast({
      title: "Prompt deleted",
      description: "Your prompt has been permanently deleted.",
    });
    setDeleteTarget(null);
  };

  const handleDeleteSavedPrompt = async (promptId: string) => {
    try {
      if (user) {
        await apiUnsavePrompt(promptId);
        await refetchSaved();
      } else {
        localStorageService.unsavePrompt(promptId);
        window.location.reload();
      }
      toast({ title: "Removed", description: "Prompt removed from Saved." });
    } catch (error) {
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  const handlePromptSave = (updatedPrompt: PromptWithCategory) => {
    // If it's a user-created prompt, update it in localStorage
    const isUserPrompt = userPrompts.some(p => p.id === updatedPrompt.id);
    if (isUserPrompt) {
      localStorageService.saveUserPrompt(updatedPrompt);
      toast({
        title: "Prompt updated",
        description: "Your changes have been saved.",
      });
    }
  };

  const getTotalCount = () => {
    return activeTab === "saved" ? filteredSavedPrompts.length : filteredUserPrompts.length;
  };

  const renderPromptGrid = (prompts: PromptWithCategory[], isUserCreated = false) => {
    if (prompts.length === 0) {
      return (
        <div className="text-center py-12">
          <i className="fas fa-bookmark text-4xl text-muted-foreground mb-4 block"></i>
          <h3 className="text-lg font-medium text-foreground mb-2">
            {searchQuery || selectedCategory 
              ? "No prompts found" 
              : `No ${activeTab === "saved" ? "saved" : "created"} prompts yet`
            }
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || selectedCategory ? (
              searchQuery 
                ? `No prompts match "${searchQuery}"`
                : "No prompts available in this category"
            ) : activeTab === "saved" ? (
              "Start saving prompts from the library to build your collection."
            ) : (
              "Create your first custom prompt using the AI Builder."
            )}
          </p>
          {!searchQuery && !selectedCategory && (
            <div className="flex justify-center space-x-4">
              {activeTab === "saved" ? (
                <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link href="/library" data-testid="link-browse-library">
                    <i className="fas fa-book mr-2"></i>Browse Library
                  </Link>
                </Button>
              ) : (
                <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link href="/ai-builder" data-testid="link-create-prompt">
                    <i className="fas fa-plus mr-2"></i>Create Prompt
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {prompts.map((prompt) => (
          <div key={prompt.id} className="relative">
            <PromptCard
              prompt={prompt}
              onClick={() => handlePromptClick(prompt)}
              onSaveToggle={handleSaveToggle}
              onEditWithAI={handleEditWithAI}
              hideSaveToggle
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget({ id: prompt.id, type: isUserCreated ? 'created' : 'saved' });
              }}
              data-testid={`button-delete-${prompt.id}`}
              title={isUserCreated ? 'Delete my prompt' : 'Remove from saved'}
            >
              <i className="fas fa-trash" />
            </Button>
          </div>
        ))}
      </div>
    );
  };

  const handleEditWithAI = (prompt: PromptWithCategory) => {
    setAiEditPrompt(prompt);
    setIsAiEditOpen(true);
  };

  const handleAIEditComplete = (originalPrompt: PromptWithCategory, editedContent: string) => {
    const editedPrompt = {
      ...originalPrompt,
      content: editedContent,
      title: `${originalPrompt.title} (AI Edited)`
    };
    setSelectedPrompt(editedPrompt);
    setIsEditorOpen(true);
    setIsAiEditOpen(false);
    setAiEditPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />
      
      <div className="max-w-7xl mx-auto">
        <SearchHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          totalCount={getTotalCount()}
        />

        <div className="p-6 pb-28 lg:pb-6" data-testid="main-content">
          <div className="fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">My Prompts</h1>
                <p className="text-muted-foreground mt-1">
                  Your saved and created prompt collection
                </p>
              </div>
              <div className="hidden lg:flex items-center space-x-2 text-sm text-muted-foreground">
                <span data-testid="text-saved-count">{savedPrompts.length} saved</span>
                <span>•</span>
                <span data-testid="text-created-count">{userPrompts.length} created</span>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger 
                  value="saved" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  data-testid="tab-saved"
                >
                  <i className="fas fa-bookmark mr-2"></i>
                  Saved Prompts ({savedPrompts.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="created" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  data-testid="tab-created"
                >
                  <i className="fas fa-magic mr-2"></i>
                  My Creations ({userPrompts.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="saved" className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-4">
                    {searchQuery || selectedCategory ? "Search Results" : "Saved Prompts"}
                  </h2>
                  {renderPromptGrid(filteredSavedPrompts)}
                </div>
              </TabsContent>

              <TabsContent value="created" className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">
                      {searchQuery || selectedCategory ? "Search Results" : "My Creations"}
                    </h2>
                    <Button 
                      asChild 
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      data-testid="button-create-new"
                    >
                      <Link href="/ai-builder">
                        <i className="fas fa-plus mr-2"></i>Create New
                      </Link>
                    </Button>
                  </div>
                  {renderPromptGrid(filteredUserPrompts, true)}
                </div>
              </TabsContent>
            </Tabs>

            {(searchQuery || selectedCategory) && getTotalCount() === 0 && (
              <div className="text-center mt-8">
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory(undefined);
                  }}
                  variant="outline"
                  data-testid="button-clear-filters"
                >
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <MobileNavigation />

      <PromptEditorModal
        prompt={selectedPrompt}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setSelectedPrompt(null);
        }}
        onSave={handlePromptSave}
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

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="w-[min(92vw,520px)] p-0 overflow-hidden rounded-2xl border border-border/70 shadow-xl">
          <div className="p-6 pb-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <div className="space-y-1.5">
                <AlertDialogTitle className="text-xl font-semibold tracking-tight">Confirm deletion</AlertDialogTitle>
                <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">
                  {deleteTarget?.type === 'created'
                    ? 'This will permanently delete your created prompt.'
                    : 'This will remove the prompt from your Saved list.'}
                </AlertDialogDescription>
              </div>
            </div>
          </div>
          <div className="px-6 pb-6 pt-4 border-t border-border/60 flex items-center justify-end gap-3">
            <AlertDialogCancel 
              className="rounded-full px-5 h-10 border border-border/70 bg-transparent hover:bg-muted/40 transition"
              data-testid="button-cancel-delete"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteTarget) return;
                if (deleteTarget.type === 'created') handleDeleteUserPrompt(deleteTarget.id);
                else handleDeleteSavedPrompt(deleteTarget.id);
              }}
              className="rounded-full px-5 h-10 bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/20 hover:border-destructive/40 transition"
              data-testid="button-confirm-delete"
            >
              <i className="fas fa-trash mr-2"></i>
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
