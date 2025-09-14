import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import NavigationBar from "@/components/navigation-bar";
import WizardBuilder from "@/components/wizard-builder";
import { ChatBuilder } from "@/components/chat-builder";
import MobileNavigation from "@/components/mobile-navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { localStorageService } from "@/lib/local-storage";
import { TONES, AUDIENCES, CATEGORIES } from "@/lib/constants";
import { type Category } from "@shared/schema";

interface GeneratedPrompt {
  title: string;
  description: string;
  content: string;
  suggestedCategory: string;
}

export default function AIBuilder() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Builder mode state
  const [builderMode, setBuilderMode] = useState<'simple' | 'wizard' | 'chat'>('simple');
  
  // Form state
  const [goal, setGoal] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  
  // Generated prompt state
  const [generatedPrompt, setGeneratedPrompt] = useState<GeneratedPrompt | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");

  // Check for pre-generated prompt from navigation state
  useEffect(() => {
    const state = window.history.state;
    if (state?.generatedPrompt) {
      const prompt = state.generatedPrompt;
      setGeneratedPrompt(prompt);
      setEditedContent(prompt.content);
      setCustomTitle(prompt.title);
      setCustomDescription(prompt.description);
      setSelectedCategory(prompt.suggestedCategory);
      
      // Clear the state
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // AI prompt generation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ai/generate-prompt", {
        goal,
        category: selectedCategory,
        audience,
        tone,
        additionalContext
      });
      return response.json();
    },
    onSuccess: (data: GeneratedPrompt) => {
      setGeneratedPrompt(data);
      setEditedContent(data.content);
      setCustomTitle(data.title);
      setCustomDescription(data.description);
      toast({
        title: "Prompt Generated!",
        description: "Your AI-generated prompt is ready for review and editing.",
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed", 
        description: error instanceof Error ? error.message : "Failed to generate prompt. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Prompt refinement
  const refineMutation = useMutation({
    mutationFn: async (refinementGoal: string) => {
      const response = await apiRequest("POST", "/api/ai/refine-prompt", {
        originalPrompt: editedContent,
        refinementGoal
      });
      return response.json();
    },
    onSuccess: (data) => {
      setEditedContent(data.refinedPrompt);
      toast({
        title: "Prompt Refined!",
        description: "Your prompt has been improved based on your request.",
      });
    },
    onError: (error) => {
      toast({
        title: "Refinement Failed",
        description: error instanceof Error ? error.message : "Failed to refine prompt. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleGenerate = () => {
    if (!goal.trim()) {
      toast({
        title: "Goal Required",
        description: "Please enter what you want to create.",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate();
  };

  const handleSavePrompt = () => {
    if (!generatedPrompt || !editedContent.trim()) {
      toast({
        title: "No Content",
        description: "Please generate a prompt first.",
        variant: "destructive",
      });
      return;
    }

    const selectedCategoryData = categories.find(c => c.name === selectedCategory) || categories[0];
    
    const promptToSave = {
      id: `user-${Date.now()}`,
      title: customTitle || generatedPrompt.title,
      description: customDescription || generatedPrompt.description,
      content: editedContent,
      categoryId: selectedCategoryData?.id || "",
      category: selectedCategoryData || categories[0],
      isFeatured: false,
      views: 0,
      likes: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    localStorageService.saveUserPrompt(promptToSave);
    
    toast({
      title: "Prompt Saved!",
      description: "Your prompt has been saved to your personal collection.",
    });

    navigate("/my-prompts");
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

  const handleWizardComplete = (wizardData: any, generatedContent: string) => {
    // Create a generated prompt from wizard data
    const wizardPrompt = {
      title: `Wizard Prompt: ${wizardData.goal}`,
      description: `AI-generated prompt from wizard: ${wizardData.primaryObjective || wizardData.goal}`,
      content: generatedContent,
      suggestedCategory: "Writing" // Default category
    };
    
    setGeneratedPrompt(wizardPrompt);
    setEditedContent(generatedContent);
    setCustomTitle(wizardPrompt.title);
    setCustomDescription(wizardPrompt.description);
  };

  const handleChatComplete = (prompt: string, metadata: {
    title: string;
    category: string;
    description: string;
    conversation: any[];
  }) => {
    // Create a generated prompt from chat data
    const chatPrompt = {
      title: metadata.title,
      description: metadata.description,
      content: prompt,
      suggestedCategory: metadata.category
    };
    
    setGeneratedPrompt(chatPrompt);
    setEditedContent(prompt);
    setCustomTitle(chatPrompt.title);
    setCustomDescription(chatPrompt.description);
    
    // Set the category properly and switch to simple mode for seamless save flow
    setSelectedCategory(metadata.category);
    setBuilderMode('simple');
    
    // Show success toast
    toast({
      title: "Prompt Generated!",
      description: "Your conversational prompt is ready. You can now save it to your library.",
    });
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

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">AI Prompt Builder</h1>
              <p className="text-muted-foreground">
                {builderMode === 'wizard' 
                  ? 'Build your perfect prompt step-by-step with guided assistance.'
                  : builderMode === 'chat'
                  ? 'Have a natural conversation to build your perfect prompt.'  
                  : 'Describe your goal and let AI create a powerful, detailed prompt for you.'
                }
              </p>
            </div>
            
            {/* Builder Mode Switcher */}
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                variant={builderMode === 'simple' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setBuilderMode('simple')}
                className="rounded-md"
                data-testid="button-simple-mode"
              >
                <i className="fas fa-bolt mr-2"></i>Quick Build
              </Button>
              <Button
                variant={builderMode === 'chat' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setBuilderMode('chat')}
                className="rounded-md"
                data-testid="button-chat-mode"
              >
                <i className="fas fa-comments mr-2"></i>Chat
              </Button>
              <Button
                variant={builderMode === 'wizard' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setBuilderMode('wizard')}
                className="rounded-md"
                data-testid="button-wizard-mode"
              >
                <i className="fas fa-magic mr-2"></i>Wizard
              </Button>
            </div>
          </div>
        </div>

        {/* Conditional Builder Rendering */}
        {builderMode === 'wizard' ? (
          <WizardBuilder onComplete={handleWizardComplete} />
        ) : builderMode === 'chat' ? (
          <ChatBuilder onComplete={handleChatComplete} />
        ) : (

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-wand-magic-sparkles text-primary"></i>
                  <span>Prompt Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="goal" className="text-base font-medium">
                    What do you want to create? *
                  </Label>
                  <Input
                    id="goal"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g., A cold email template for SaaS products"
                    className="mt-1"
                    data-testid="input-goal"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Preferred Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Choose category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(CATEGORIES).map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="audience">Target Audience</Label>
                    <Select value={audience} onValueChange={setAudience}>
                      <SelectTrigger data-testid="select-audience">
                        <SelectValue placeholder="Choose audience" />
                      </SelectTrigger>
                      <SelectContent>
                        {AUDIENCES.map((aud) => (
                          <SelectItem key={aud} value={aud}>
                            {aud}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="tone">Desired Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger data-testid="select-tone">
                      <SelectValue placeholder="Choose tone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TONES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="context">Additional Context (Optional)</Label>
                  <Textarea
                    id="context"
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    placeholder="Any specific requirements, examples, or constraints..."
                    className="mt-1"
                    rows={3}
                    data-testid="textarea-context"
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={!goal.trim() || generateMutation.isPending}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                  size="lg"
                  data-testid="button-generate"
                >
                  <i className={`fas ${generateMutation.isPending ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'} mr-2`}></i>
                  {generateMutation.isPending ? "Generating..." : "Generate Prompt"}
                </Button>
              </CardContent>
            </Card>

            {/* Refinement Controls */}
            {generatedPrompt && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <i className="fas fa-sliders text-primary"></i>
                    <span>Refinement</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="refine-goal">How would you like to improve it?</Label>
                    <div className="flex space-x-2 mt-1">
                      <Input
                        id="refine-goal"
                        placeholder="e.g., Make it more persuasive, Add examples..."
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && e.currentTarget.value.trim()) {
                            refineMutation.mutate(e.currentTarget.value);
                            e.currentTarget.value = "";
                          }
                        }}
                        data-testid="input-refine-goal"
                      />
                      <Button
                        onClick={() => {
                          const input = document.getElementById("refine-goal") as HTMLInputElement;
                          if (input?.value.trim()) {
                            refineMutation.mutate(input.value);
                            input.value = "";
                          }
                        }}
                        disabled={refineMutation.isPending}
                        data-testid="button-refine"
                      >
                        <i className={`fas ${refineMutation.isPending ? 'fa-spinner fa-spin' : 'fa-magic'}`}></i>
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[
                      "Make it more specific",
                      "Add examples",
                      "Make it shorter",
                      "Add more detail",
                      "Improve clarity"
                    ].map((suggestion) => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        onClick={() => refineMutation.mutate(suggestion)}
                        disabled={refineMutation.isPending}
                        data-testid={`button-quick-refine-${suggestion.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Generated Prompt */}
          <div className="space-y-6">
            {generatedPrompt ? (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <i className="fas fa-magic text-primary"></i>
                        <span>Generated Prompt</span>
                      </CardTitle>
                      <Badge className={getCategoryColor(generatedPrompt.suggestedCategory)}>
                        {generatedPrompt.suggestedCategory}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="custom-title">Title</Label>
                      <Input
                        id="custom-title"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        className="mt-1 font-medium"
                        data-testid="input-custom-title"
                      />
                    </div>

                    <div>
                      <Label htmlFor="custom-description">Description</Label>
                      <Textarea
                        id="custom-description"
                        value={customDescription}
                        onChange={(e) => setCustomDescription(e.target.value)}
                        className="mt-1"
                        rows={2}
                        data-testid="textarea-custom-description"
                      />
                    </div>

                    <Separator />

                    <div>
                      <Label htmlFor="prompt-content">Prompt Content</Label>
                      <Textarea
                        id="prompt-content"
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="mt-1 min-h-[300px] font-mono text-sm"
                        data-testid="textarea-prompt-content"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        {editedContent.length} characters
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        onClick={handleCopy}
                        variant="outline"
                        className="flex-1"
                        data-testid="button-copy-prompt"
                      >
                        <i className="fas fa-copy mr-2"></i>Copy
                      </Button>
                      <Button
                        onClick={handleSavePrompt}
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                        data-testid="button-save-prompt"
                      >
                        <i className="fas fa-save mr-2"></i>Save Prompt
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="h-full">
                <CardContent className="flex flex-col items-center justify-center h-[600px] text-center">
                  <i className="fas fa-wand-magic-sparkles text-6xl text-muted-foreground mb-4"></i>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    AI Prompt Builder Ready
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    Fill in your goal and preferences on the left, then click "Generate Prompt" 
                    to create a powerful, customized prompt with AI assistance.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        )}
      </div>

      <MobileNavigation />
    </div>
  );
}
