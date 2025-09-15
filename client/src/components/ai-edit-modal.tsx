import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { type PromptWithCategory } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AIEditModalProps {
  prompt: PromptWithCategory | null;
  isOpen: boolean;
  onClose: () => void;
  onEditComplete: (originalPrompt: PromptWithCategory, editedPrompt: string) => void;
}

export default function AIEditModal({ 
  prompt, 
  isOpen, 
  onClose, 
  onEditComplete 
}: AIEditModalProps) {
  const [userRequest, setUserRequest] = useState("");
  const { toast } = useToast();

  const editPromptMutation = useMutation({
    mutationFn: async (data: { originalPrompt: string; refinementGoal: string }) => {
      const response = await apiRequest("POST", "/api/refine-prompt", data);
      return response.json();
    },
    onSuccess: (result) => {
      if (prompt) {
        onEditComplete(prompt, result.refinedPrompt);
      }
      setUserRequest("");
      onClose();
      toast({
        title: "Prompt edited successfully!",
        description: "AI has customized the prompt based on your description.",
      });
    },
    onError: (error) => {
      toast({
        title: "Edit failed",
        description: error instanceof Error ? error.message : "Failed to edit prompt. Please try again.",
        variant: "destructive",
      });
    }
  });

  const getCategoryColor = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case "writing": return "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground";
      case "coding": return "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-300";
      case "marketing": return "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300";
      case "business": return "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300";
      case "education": return "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300";
      case "productivity": return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400";
      case "creative": return "bg-pink-500/10 text-pink-600 dark:text-pink-400";
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

  const handleSubmit = () => {
    if (!prompt || !userRequest.trim()) return;
    
    editPromptMutation.mutate({
      originalPrompt: prompt.content,
      refinementGoal: userRequest.trim()
    });
  };

  const handleCancel = () => {
    setUserRequest("");
    onClose();
  };

  if (!prompt) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto p-0">
        {/* Modal Header */}
        <DialogHeader className="flex flex-row items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <DialogTitle className="text-xl font-semibold" data-testid="text-ai-edit-title">
              Edit with AI
            </DialogTitle>
            <Badge className={getCategoryColor(prompt.category.name)}>
              <i className={`${getCategoryIcon(prompt.category.name)} mr-1.5`}></i>
              {prompt.category.name}
            </Badge>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Original Prompt Preview */}
          <div>
            <h3 className="font-medium text-foreground mb-2">Original Prompt:</h3>
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-foreground">{prompt.title}</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{prompt.description}</p>
                <div className="text-xs text-muted-foreground bg-background/50 rounded p-2 max-h-32 overflow-y-auto">
                  {prompt.content.substring(0, 200)}...
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* User Request Input */}
          <div className="space-y-3">
            <div>
              <h3 className="font-medium text-foreground mb-2">
                Describe how you'd like to customize this prompt:
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Tell AI what changes you need. For example: "Make it more formal", "Add specific examples for marketing emails", "Simplify for beginners", etc.
              </p>
            </div>
            
            <Textarea
              value={userRequest}
              onChange={(e) => setUserRequest(e.target.value)}
              placeholder="I want to customize this prompt for..."
              className="min-h-[120px] resize-none"
              data-testid="textarea-ai-edit-request"
            />
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center space-x-4">
                <span>💡 Be specific about your use case for better results</span>
              </div>
              <span data-testid="text-character-count-request">
                {userRequest.length} characters
              </span>
            </div>
          </div>

          {/* Examples */}
          <div className="bg-muted/20 rounded-lg p-4">
            <h4 className="text-sm font-medium text-foreground mb-3">Example requests:</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>• "Make this more suitable for technical documentation"</div>
              <div>• "Add steps for social media marketing specifically"</div>
              <div>• "Simplify the language for non-technical users"</div>
              <div>• "Include more creative writing examples"</div>
              <div>• "Focus on B2B rather than B2C scenarios"</div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-border bg-muted/20">
          <div className="flex items-center justify-end space-x-3">
            <Button 
              variant="outline"
              onClick={handleCancel}
              disabled={editPromptMutation.isPending}
              data-testid="button-cancel-ai-edit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!userRequest.trim() || editPromptMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-submit-ai-edit"
            >
              {editPromptMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Editing...
                </>
              ) : (
                <>
                  <i className="fas fa-magic mr-2"></i>
                  Edit with AI
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
