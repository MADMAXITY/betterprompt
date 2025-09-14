import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type PromptWithCategory } from "@shared/schema";
import { localStorageService } from "@/lib/local-storage";
import { useAuth } from "@/context/AuthContext";
import { savePrompt as apiSavePrompt, unsavePrompt as apiUnsavePrompt } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface PromptCardProps {
  prompt: PromptWithCategory;
  onClick: () => void;
  onSaveToggle?: () => void;
  onEditWithAI?: (prompt: PromptWithCategory) => void;
  hideSaveToggle?: boolean;
  savedIds?: Set<string>;
  onSavedChange?: (id: string, saved: boolean) => void;
}

export default function PromptCard({ prompt, onClick, onSaveToggle, onEditWithAI, hideSaveToggle, savedIds, onSavedChange }: PromptCardProps) {
  const initialSaved = savedIds ? savedIds.has(prompt.id) : localStorageService.isPromptSaved(prompt.id);
  const [isSaved, setIsSaved] = useState(initialSaved);
  const { toast } = useToast();
  const { user } = useAuth();

  const getCategoryColor = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case "writing": return "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground";
      case "coding": return "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-300";
      case "marketing": return "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300";
      case "business": return "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300";
      case "education": return "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300";
      default: return "bg-muted/50 text-muted-foreground";
    }
  };

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case "writing": return "fas fa-pen";
      case "coding": return "fas fa-code";
      case "marketing": return "fas fa-bullhorn";
      case "business": return "fas fa-briefcase";
      case "education": return "fas fa-graduation-cap";
      case "productivity": return "fas fa-tasks";
      case "creative": return "fas fa-palette";
      default: return "fas fa-tag";
    }
  };

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isSaved) {
        if (user) await apiUnsavePrompt(prompt.id);
        else localStorageService.unsavePrompt(prompt.id);
        setIsSaved(false);
        onSavedChange?.(prompt.id, false);
        toast({ title: "Prompt removed", description: "Removed from your saved collection." });
      } else {
        if (user) await apiSavePrompt(prompt.id);
        else localStorageService.savePrompt(prompt.id);
        setIsSaved(true);
        onSavedChange?.(prompt.id, true);
        toast({ title: "Prompt saved", description: "Added to your saved collection." });
      }
    } catch (err) {
      toast({
        title: "Action failed",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      onSaveToggle?.();
    }
  };

  const formatTimeAgo = (date: Date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return "Recently";
    }
  };

  return (
    <Card 
      className="card-hover cursor-pointer"
      onClick={onClick}
      data-testid={`card-prompt-${prompt.id}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Badge className={getCategoryColor(prompt.category.name)}>
              <i className={`${getCategoryIcon(prompt.category.name)} mr-1.5`}></i>
              {prompt.category.name}
            </Badge>
            {prompt.isFeatured && (
              <Badge variant="secondary" className="bg-accent text-accent-foreground">
                Featured
              </Badge>
            )}
          </div>
          {!hideSaveToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSaveToggle}
              className="text-muted-foreground hover:text-foreground h-6 w-6 -mt-1"
              data-testid={`button-save-${prompt.id}`}
            >
              <i className={`fas fa-bookmark ${isSaved ? 'text-primary' : ''}`}></i>
            </Button>
          )}
        </div>
        
        <h3 className="font-semibold text-foreground mb-2" data-testid={`text-title-${prompt.id}`}>
          {prompt.title}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3" data-testid={`text-description-${prompt.id}`}>
          {prompt.description}
        </p>
        
        {/* Action buttons */}
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              // This will be handled by the parent component
              onEditWithAI?.(prompt);
            }}
            className="text-primary hover:text-primary/80 border-primary/20 hover:border-primary/40"
            data-testid={`button-edit-ai-${prompt.id}`}
          >
            <i className="fas fa-magic mr-2"></i>
            Edit with AI
          </Button>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-3">
            <span data-testid={`text-views-${prompt.id}`}>
              <i className="fas fa-eye mr-1"></i>
              {(prompt.views || 0).toLocaleString()}
            </span>
            <span data-testid={`text-likes-${prompt.id}`}>
              <i className="fas fa-heart mr-1"></i>
              {(prompt.likes || 0).toLocaleString()}
            </span>
          </div>
          <span data-testid={`text-updated-${prompt.id}`}>
            Updated {formatTimeAgo(prompt.updatedAt || new Date())}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
