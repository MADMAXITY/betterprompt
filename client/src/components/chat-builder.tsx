import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface ChatBuilderProps {
  onComplete: (prompt: string, metadata: {
    title: string;
    category: string;
    description: string;
    conversation: ChatMessage[];
  }) => void;
}

export function ChatBuilder({ onComplete }: ChatBuilderProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "👋 Hi! I'm here to help you create the perfect prompt through conversation. What would you like to accomplish with AI?",
      timestamp: new Date(),
      suggestions: [
        "I want to write better marketing copy",
        "I need help with coding problems", 
        "I want to create creative stories",
        "I need analysis and research help"
      ]
    }
  ]);
  
  const [currentInput, setCurrentInput] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [finalPrompt, setFinalPrompt] = useState('');
  const [promptMetadata, setPromptMetadata] = useState({
    title: '',
    category: '',
    description: ''
  });
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  // Focus input on component mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const chatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      // Trim message payload to only role and content for efficiency
      const trimmedMessages = [...messages, { role: 'user', content: userMessage }].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await apiRequest('POST', '/api/ai/chat-prompt-builder', {
        messages: trimmedMessages,
        isComplete: false
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        suggestions: data.suggestions
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Check if conversation is complete
      if (data.isComplete) {
        setIsComplete(true);
        setFinalPrompt(data.finalPrompt);
        setPromptMetadata({
          title: data.title,
          category: data.category,
          description: data.description
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Communication Error",
        description: "Sorry, I had trouble processing that. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSendMessage = () => {
    if (!currentInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user', 
      content: currentInput.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(currentInput.trim());
    setCurrentInput('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    setCurrentInput(suggestion);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleComplete = () => {
    onComplete(finalPrompt, {
      title: promptMetadata.title,
      category: promptMetadata.category,
      description: promptMetadata.description,
      conversation: messages
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Chat Interface */}
      <div className="space-y-6">
        <Card className="h-[600px]">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <CardTitle className="text-lg">AI Conversation</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col h-[calc(100%-80px)]">
            <ScrollArea className="flex-1 pr-4 mb-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground ml-4' 
                        : 'bg-muted text-foreground mr-4'
                    }`}>
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      {message.role === 'assistant' && (
                        <div className="text-xs opacity-60 mt-1">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                      
                      {/* Quick suggestions */}
                      {message.suggestions && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {message.suggestions.map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleSuggestionClick(suggestion)}
                              data-testid={`button-suggestion-${index}`}
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {chatMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-muted text-foreground mr-4 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-primary rounded-full border-t-transparent"></div>
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t pt-4">
              {!isComplete ? (
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your response..."
                    disabled={chatMutation.isPending}
                    className="flex-1"
                    data-testid="input-chat-message"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!currentInput.trim() || chatMutation.isPending}
                    data-testid="button-send-message"
                  >
                    <i className="fas fa-paper-plane"></i>
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Badge variant="secondary" className="mb-3">
                    <i className="fas fa-check mr-2"></i>Prompt Ready!
                  </Badge>
                  <Button 
                    onClick={handleComplete}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    data-testid="button-use-prompt"
                  >
                    <i className="fas fa-magic mr-2"></i>Use This Prompt
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prompt Preview */}
      <div className="space-y-6">
        {!isComplete ? (
          <Card className="h-full">
            <CardContent className="flex flex-col items-center justify-center h-[600px] text-center">
              <i className="fas fa-comments text-6xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Building Your Prompt...
              </h3>
              <p className="text-muted-foreground max-w-md">
                Keep chatting with me! I'll ask questions to understand exactly what you need, 
                then create a perfect prompt for you.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <i className="fas fa-sparkles text-primary"></i>
                  <CardTitle>Your Custom Prompt</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Title</label>
                    <p className="text-sm font-medium">{promptMetadata.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Category</label>
                    <Badge variant="secondary" className="text-xs">{promptMetadata.category}</Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm">{promptMetadata.description}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Generated Prompt</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={finalPrompt}
                  readOnly
                  className="min-h-[300px] text-sm font-mono"
                  data-testid="textarea-final-prompt"
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}