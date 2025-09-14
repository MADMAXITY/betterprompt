import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type PromptWithCategory } from "@shared/schema";
import { localStorageService } from "@/lib/local-storage";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface PromptCardProps {
  prompt: PromptWithCategory;
  onClick: () => void;
  onSaveToggle?: () => void;
}

export default function PromptCard({ prompt, onClick, onSaveToggle }: PromptCardProps) {
  const [isSaved, setIsSaved] = useState(localStorageService.isPromptSaved(prompt.id));
  const { toast } = useToast();

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

  const handleSaveToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    
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
    
    onSaveToggle?.();
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
              {prompt.category.name}
            </Badge>
            {prompt.isFeatured && (
              <Badge variant="secondary" className="bg-accent text-accent-foreground">
                Featured
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSaveToggle}
            className="text-muted-foreground hover:text-foreground h-6 w-6 -mt-1"
            data-testid={`button-save-${prompt.id}`}
          >
            <i className={`fas fa-bookmark ${isSaved ? 'text-primary' : ''}`}></i>
          </Button>
        </div>
        
        <h3 className="font-semibold text-foreground mb-2" data-testid={`text-title-${prompt.id}`}>
          {prompt.title}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3" data-testid={`text-description-${prompt.id}`}>
          {prompt.description}
        </p>
        
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
