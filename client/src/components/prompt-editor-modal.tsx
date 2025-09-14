import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type PromptWithCategory } from "@shared/schema";
import { localStorageService } from "@/lib/local-storage";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface PromptEditorModalProps {
  prompt: PromptWithCategory | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (prompt: PromptWithCategory) => void;
}

export default function PromptEditorModal({ 
  prompt, 
  isOpen, 
  onClose, 
  onSave 
}: PromptEditorModalProps) {
  const [editedContent, setEditedContent] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (prompt) {
      setEditedContent(prompt.content);
      setIsSaved(localStorageService.isPromptSaved(prompt.id));
    }
  }, [prompt]);

  const suggestionsQuery = useMutation({
    mutationFn: async (promptContent: string) => {
      const response = await apiRequest("POST", "/api/ai/suggest-improvements", {
        prompt: promptContent
      });
      return response.json();
    },
    onSuccess: (data) => {
      setSuggestions(data.suggestions || []);
    },
    onError: (error) => {
      console.error("Failed to get suggestions:", error);
      toast({
        title: "Error",
        description: "Failed to get AI suggestions. Please try again.",
        variant: "destructive",
      });
    }
  });

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

  const handleCopy = async () => {
    const success = await localStorageService.copyToClipboard(editedContent);
    if (success) {
      toast({
        title: "Copied!",
        description: "Prompt has been copied to your clipboard.",
      });
    } else {
      toast({
        title: "Copy failed",
        description: "Failed to copy prompt. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveToggle = () => {
    if (!prompt) return;

    if (isSaved) {
      localStorageService.unsavePrompt(prompt.id);
      setIsSaved(false);
      toast({
        title: "Prompt removed",
        description: "Prompt has been removed from your saved collection.",
      });
    } else {
      localStorageService.savePrompt(prompt.id);
      setIsSaved(true);
      toast({
        title: "Prompt saved",
        description: "Prompt has been added to your saved collection.",
      });
    }
  };

  const handleGetSuggestions = () => {
    if (editedContent.trim()) {
      suggestionsQuery.mutate(editedContent);
    }
  };

  const handleUsePrompt = () => {
    if (prompt && onSave) {
      const updatedPrompt = { ...prompt, content: editedContent };
      onSave(updatedPrompt);
    }
    onClose();
  };

  if (!prompt) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
        {/* Modal Header */}
        <DialogHeader className="flex flex-row items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <DialogTitle className="text-xl font-semibold" data-testid="text-prompt-title">
              {prompt.title}
            </DialogTitle>
            <Badge className={getCategoryColor(prompt.category.name)}>
              {prompt.category.name}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCopy}
              data-testid="button-copy"
            >
              <i className="fas fa-copy mr-1"></i>Copy
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSaveToggle}
              data-testid="button-save"
            >
              <i className={`fas fa-bookmark mr-1 ${isSaved ? 'text-primary' : ''}`}></i>
              {isSaved ? 'Saved' : 'Save'}
            </Button>
          </div>
        </DialogHeader>

        {/* Editor Content */}
        <div className="flex h-[70vh]">
          {/* Editor Panel */}
          <div className="flex-1 border-r border-border flex flex-col">
            <div className="p-4 border-b border-border">
              <h3 className="font-medium text-foreground mb-2">Prompt Editor</h3>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGetSuggestions}
                  disabled={suggestionsQuery.isPending || !editedContent.trim()}
                  className="text-primary hover:text-primary/80 p-0 h-auto"
                  data-testid="button-ai-suggestions"
                >
                  <i className={`fas ${suggestionsQuery.isPending ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'} mr-1`}></i>
                  AI Suggestions
                </Button>
                <span>•</span>
                <span data-testid="text-character-count">
                  {editedContent.length} characters
                </span>
              </div>
            </div>
            <div className="flex-1 p-4">
              <Textarea 
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-full resize-none border-0 bg-transparent focus:ring-0 focus:outline-none"
                placeholder="Enter your prompt here..."
                data-testid="textarea-prompt-content"
              />
            </div>
          </div>

          {/* Preview Panel */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-border">
              <h3 className="font-medium text-foreground">Preview & Suggestions</h3>
              <p className="text-sm text-muted-foreground">AI insights and improvements</p>
            </div>
            <ScrollArea className="flex-1 p-4">
              {/* AI Suggestions */}
              {suggestions.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-foreground mb-3">💡 AI Suggestions</h4>
                  <div className="space-y-2">
                    {suggestions.map((suggestion, index) => (
                      <Card key={index} className="bg-muted/50">
                        <CardContent className="p-3">
                          <p className="text-sm text-foreground">{suggestion}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <Separator className="my-4" />
                </div>
              )}

              {/* Preview */}
              <div>
                <h4 className="font-medium text-foreground mb-3">📝 Prompt Preview</h4>
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {editedContent || "Enter content in the editor to see preview..."}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span data-testid="text-stats-views">
                <i className="fas fa-eye mr-1"></i>{(prompt.views || 0).toLocaleString()} views
              </span>
              <span data-testid="text-stats-likes">
                <i className="fas fa-heart mr-1"></i>{(prompt.likes || 0).toLocaleString()} likes
              </span>
              <span data-testid="text-stats-updated">
                Updated {formatDistanceToNow(new Date(prompt.updatedAt || new Date()), { addSuffix: true })}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline"
                onClick={onClose}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUsePrompt}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-use-prompt"
              >
                Use This Prompt
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
