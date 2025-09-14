import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TONES, AUDIENCES, CATEGORIES } from "@/lib/constants";

interface WizardData {
  // Step 1: Goal & Purpose
  goal: string;
  primaryObjective: string;
  useCase: string;
  
  // Step 2: Context & Background
  targetAudience: string;
  domainContext: string;
  backgroundInfo: string;
  keyTerms: string[];
  
  // Step 3: Style & Tone
  tone: string;
  formality: string;
  perspective: string;
  communicationStyle: string;
  
  // Step 4: Output Format
  outputFormat: string;
  structure: string[];
  includeSections: string[];
  
  // Step 5: Constraints & Requirements
  lengthRequirement: string;
  mustInclude: string[];
  mustAvoid: string[];
  specialRequirements: string;
}

interface WizardBuilderProps {
  onComplete: (promptData: WizardData, generatedPrompt: string) => void;
}

const WIZARD_STEPS = [
  {
    id: 1,
    title: "Goal & Purpose",
    description: "Define what you want to create and why",
    icon: "fa-bullseye"
  },
  {
    id: 2,
    title: "Context & Background", 
    description: "Provide essential context and domain knowledge",
    icon: "fa-info-circle"
  },
  {
    id: 3,
    title: "Style & Tone",
    description: "Choose how your prompt should communicate",
    icon: "fa-palette"
  },
  {
    id: 4,
    title: "Output Format",
    description: "Define the structure and format you want",
    icon: "fa-list-alt"
  },
  {
    id: 5,
    title: "Constraints & Requirements",
    description: "Add specific rules and limitations",
    icon: "fa-shield-alt"
  }
];

const OUTPUT_FORMATS = [
  "Structured response with headers",
  "Step-by-step instructions", 
  "Bullet point list",
  "Paragraph format",
  "Q&A format",
  "Template with placeholders",
  "Code with comments",
  "Creative narrative"
];

const STRUCTURE_OPTIONS = [
  "Introduction/Overview",
  "Main Content/Body", 
  "Examples/Illustrations",
  "Step-by-step breakdown",
  "Key points summary",
  "Call-to-action",
  "Conclusion/Next steps",
  "Additional resources"
];

export default function WizardBuilder({ onComplete }: WizardBuilderProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>({
    // Step 1
    goal: "",
    primaryObjective: "",
    useCase: "",
    
    // Step 2
    targetAudience: "",
    domainContext: "",
    backgroundInfo: "",
    keyTerms: [],
    
    // Step 3
    tone: "",
    formality: "",
    perspective: "",
    communicationStyle: "",
    
    // Step 4
    outputFormat: "",
    structure: [],
    includeSections: [],
    
    // Step 5
    lengthRequirement: "",
    mustInclude: [],
    mustAvoid: [],
    specialRequirements: ""
  });

  const { toast } = useToast();

  // Generate prompt preview based on current wizard data
  const promptPreview = useMemo(() => {
    let preview = "";
    
    if (wizardData.goal) {
      preview += `**Goal**: ${wizardData.goal}\n\n`;
    }
    
    if (wizardData.primaryObjective) {
      preview += `**Objective**: ${wizardData.primaryObjective}\n\n`;
    }
    
    if (wizardData.targetAudience) {
      preview += `**Target Audience**: ${wizardData.targetAudience}\n\n`;
    }
    
    if (wizardData.domainContext) {
      preview += `**Domain Context**: ${wizardData.domainContext}\n\n`;
    }
    
    if (wizardData.tone) {
      preview += `**Tone**: ${wizardData.tone}`;
      if (wizardData.formality) preview += `, ${wizardData.formality}`;
      if (wizardData.communicationStyle) preview += `, ${wizardData.communicationStyle}`;
      preview += "\n\n";
    }
    
    if (wizardData.outputFormat) {
      preview += `**Format**: ${wizardData.outputFormat}\n\n`;
    }
    
    if (wizardData.structure.length > 0) {
      preview += `**Structure**:\n${wizardData.structure.map(s => `- ${s}`).join('\n')}\n\n`;
    }
    
    if (wizardData.mustInclude.length > 0) {
      preview += `**Must Include**: ${wizardData.mustInclude.join(', ')}\n\n`;
    }
    
    if (wizardData.mustAvoid.length > 0) {
      preview += `**Must Avoid**: ${wizardData.mustAvoid.join(', ')}\n\n`;
    }
    
    if (wizardData.specialRequirements) {
      preview += `**Special Requirements**: ${wizardData.specialRequirements}\n\n`;
    }
    
    return preview || "Start filling out the wizard to see your prompt preview...";
  }, [wizardData]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      // Compose comprehensive prompt data for AI generation
      const contextualGoal = `${wizardData.goal}. ${wizardData.primaryObjective}. Use case: ${wizardData.useCase}`;
      const audience = wizardData.targetAudience || "General";
      const tone = wizardData.tone || "Professional";
      
      let additionalContext = "";
      if (wizardData.domainContext) additionalContext += `Domain: ${wizardData.domainContext}. `;
      if (wizardData.backgroundInfo) additionalContext += `Background: ${wizardData.backgroundInfo}. `;
      if (wizardData.outputFormat) additionalContext += `Format: ${wizardData.outputFormat}. `;
      if (wizardData.structure.length > 0) additionalContext += `Structure: ${wizardData.structure.join(', ')}. `;
      if (wizardData.mustInclude.length > 0) additionalContext += `Must include: ${wizardData.mustInclude.join(', ')}. `;
      if (wizardData.mustAvoid.length > 0) additionalContext += `Must avoid: ${wizardData.mustAvoid.join(', ')}. `;
      if (wizardData.specialRequirements) additionalContext += `Requirements: ${wizardData.specialRequirements}`;

      const response = await apiRequest("POST", "/api/ai/generate-prompt", {
        goal: contextualGoal,
        audience,
        tone,
        additionalContext
      });
      return response.json();
    },
    onSuccess: (data) => {
      onComplete(wizardData, data.content);
      toast({
        title: "Prompt Generated!",
        description: "Your wizard-crafted prompt is ready for review.",
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

  const updateWizardData = (field: keyof WizardData, value: any) => {
    setWizardData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return wizardData.goal.trim().length > 0;
      case 2:
        return wizardData.targetAudience.trim().length > 0;
      case 3:
        return wizardData.tone.trim().length > 0;
      case 4:
        return wizardData.outputFormat.trim().length > 0;
      case 5:
        return true; // Last step is optional constraints
      default:
        return false;
    }
  };

  const isLastStep = currentStep === WIZARD_STEPS.length;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="goal" className="text-base font-medium">
                What do you want to create? *
              </Label>
              <Input
                id="goal"
                value={wizardData.goal}
                onChange={(e) => updateWizardData('goal', e.target.value)}
                placeholder="e.g., A cold email template for SaaS products"
                className="mt-2"
                data-testid="wizard-goal"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Be specific about the type of content, document, or response you want to generate.
              </p>
            </div>

            <div>
              <Label htmlFor="objective" className="text-base font-medium">
                Primary objective
              </Label>
              <Input
                id="objective"
                value={wizardData.primaryObjective}
                onChange={(e) => updateWizardData('primaryObjective', e.target.value)}
                placeholder="e.g., Increase demo booking rates by 25%"
                className="mt-2"
                data-testid="wizard-objective"
              />
              <p className="text-sm text-muted-foreground mt-1">
                What specific outcome or goal should this achieve?
              </p>
            </div>

            <div>
              <Label htmlFor="use-case" className="text-base font-medium">
                Use case scenario
              </Label>
              <Textarea
                id="use-case"
                value={wizardData.useCase}
                onChange={(e) => updateWizardData('useCase', e.target.value)}
                placeholder="e.g., When prospects visit our website but don't book a demo..."
                className="mt-2"
                rows={3}
                data-testid="wizard-use-case"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Describe the specific situation where this will be used.
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="audience" className="text-base font-medium">
                Target audience *
              </Label>
              <Select value={wizardData.targetAudience} onValueChange={(value) => updateWizardData('targetAudience', value)}>
                <SelectTrigger className="mt-2" data-testid="wizard-audience">
                  <SelectValue placeholder="Choose target audience" />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCES.map((audience) => (
                    <SelectItem key={audience} value={audience}>
                      {audience}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="domain" className="text-base font-medium">
                Domain/Industry context
              </Label>
              <Input
                id="domain"
                value={wizardData.domainContext}
                onChange={(e) => updateWizardData('domainContext', e.target.value)}
                placeholder="e.g., B2B SaaS, Healthcare, E-commerce, Education"
                className="mt-2"
                data-testid="wizard-domain"
              />
            </div>

            <div>
              <Label htmlFor="background" className="text-base font-medium">
                Background information
              </Label>
              <Textarea
                id="background"
                value={wizardData.backgroundInfo}
                onChange={(e) => updateWizardData('backgroundInfo', e.target.value)}
                placeholder="e.g., Our product helps small businesses manage inventory..."
                className="mt-2"
                rows={3}
                data-testid="wizard-background"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Provide context that helps understand the domain or situation.
              </p>
            </div>

            <div>
              <Label className="text-base font-medium">
                Key terms or concepts to include
              </Label>
              <div className="mt-2 space-y-2">
                <Input
                  placeholder="Add a key term and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      const newTerm = e.currentTarget.value.trim();
                      if (!wizardData.keyTerms.includes(newTerm)) {
                        updateWizardData('keyTerms', [...wizardData.keyTerms, newTerm]);
                      }
                      e.currentTarget.value = '';
                    }
                  }}
                  data-testid="wizard-key-terms-input"
                />
                <div className="flex flex-wrap gap-2">
                  {wizardData.keyTerms.map((term, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => {
                      updateWizardData('keyTerms', wizardData.keyTerms.filter((_, i) => i !== index));
                    }}>
                      {term} <i className="fas fa-times ml-1"></i>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">Tone *</Label>
              <Select value={wizardData.tone} onValueChange={(value) => updateWizardData('tone', value)}>
                <SelectTrigger className="mt-2" data-testid="wizard-tone">
                  <SelectValue placeholder="Choose tone" />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((tone) => (
                    <SelectItem key={tone} value={tone}>
                      {tone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-base font-medium">Formality level</Label>
              <RadioGroup 
                value={wizardData.formality} 
                onValueChange={(value) => updateWizardData('formality', value)}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Very formal" id="formal" />
                  <Label htmlFor="formal">Very formal (academic, legal)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Professional" id="professional" />
                  <Label htmlFor="professional">Professional (business standard)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Conversational" id="conversational" />
                  <Label htmlFor="conversational">Conversational (friendly, approachable)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Casual" id="casual" />
                  <Label htmlFor="casual">Casual (relaxed, informal)</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-base font-medium">Perspective</Label>
              <RadioGroup 
                value={wizardData.perspective} 
                onValueChange={(value) => updateWizardData('perspective', value)}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="First person (I/we)" id="first" />
                  <Label htmlFor="first">First person (I/we)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Second person (you)" id="second" />
                  <Label htmlFor="second">Second person (you)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Third person (they/it)" id="third" />
                  <Label htmlFor="third">Third person (they/it)</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="communication-style" className="text-base font-medium">
                Communication style
              </Label>
              <Select value={wizardData.communicationStyle} onValueChange={(value) => updateWizardData('communicationStyle', value)}>
                <SelectTrigger className="mt-2" data-testid="wizard-communication-style">
                  <SelectValue placeholder="Choose communication style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Direct and concise">Direct and concise</SelectItem>
                  <SelectItem value="Detailed and explanatory">Detailed and explanatory</SelectItem>
                  <SelectItem value="Storytelling">Storytelling</SelectItem>
                  <SelectItem value="Question-based">Question-based</SelectItem>
                  <SelectItem value="Instructional">Instructional</SelectItem>
                  <SelectItem value="Persuasive">Persuasive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">Output format *</Label>
              <Select value={wizardData.outputFormat} onValueChange={(value) => updateWizardData('outputFormat', value)}>
                <SelectTrigger className="mt-2" data-testid="wizard-output-format">
                  <SelectValue placeholder="Choose output format" />
                </SelectTrigger>
                <SelectContent>
                  {OUTPUT_FORMATS.map((format) => (
                    <SelectItem key={format} value={format}>
                      {format}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-base font-medium">
                Structure elements to include
              </Label>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                {STRUCTURE_OPTIONS.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={option}
                      checked={wizardData.structure.includes(option)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateWizardData('structure', [...wizardData.structure, option]);
                        } else {
                          updateWizardData('structure', wizardData.structure.filter(s => s !== option));
                        }
                      }}
                    />
                    <Label htmlFor={option} className="text-sm">{option}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">
                Specific sections to include
              </Label>
              <div className="mt-2 space-y-2">
                <Input
                  placeholder="Add a section name and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      const newSection = e.currentTarget.value.trim();
                      if (!wizardData.includeSections.includes(newSection)) {
                        updateWizardData('includeSections', [...wizardData.includeSections, newSection]);
                      }
                      e.currentTarget.value = '';
                    }
                  }}
                  data-testid="wizard-sections-input"
                />
                <div className="flex flex-wrap gap-2">
                  {wizardData.includeSections.map((section, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => {
                      updateWizardData('includeSections', wizardData.includeSections.filter((_, i) => i !== index));
                    }}>
                      {section} <i className="fas fa-times ml-1"></i>
                    </Badge>
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                e.g., "Pricing details", "Customer testimonials", "Technical specifications"
              </p>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">Length requirement</Label>
              <Select value={wizardData.lengthRequirement} onValueChange={(value) => updateWizardData('lengthRequirement', value)}>
                <SelectTrigger className="mt-2" data-testid="wizard-length">
                  <SelectValue placeholder="Choose length preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Very concise (1-2 sentences)">Very concise (1-2 sentences)</SelectItem>
                  <SelectItem value="Brief (1 paragraph)">Brief (1 paragraph)</SelectItem>
                  <SelectItem value="Moderate (2-3 paragraphs)">Moderate (2-3 paragraphs)</SelectItem>
                  <SelectItem value="Detailed (4-6 paragraphs)">Detailed (4-6 paragraphs)</SelectItem>
                  <SelectItem value="Comprehensive (full article)">Comprehensive (full article)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-base font-medium">
                Must include (specific elements)
              </Label>
              <div className="mt-2 space-y-2">
                <Input
                  placeholder="Add something that must be included and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      const newRequirement = e.currentTarget.value.trim();
                      if (!wizardData.mustInclude.includes(newRequirement)) {
                        updateWizardData('mustInclude', [...wizardData.mustInclude, newRequirement]);
                      }
                      e.currentTarget.value = '';
                    }
                  }}
                  data-testid="wizard-must-include-input"
                />
                <div className="flex flex-wrap gap-2">
                  {wizardData.mustInclude.map((item, index) => (
                    <Badge key={index} variant="default" className="cursor-pointer" onClick={() => {
                      updateWizardData('mustInclude', wizardData.mustInclude.filter((_, i) => i !== index));
                    }}>
                      {item} <i className="fas fa-times ml-1"></i>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">
                Must avoid (things to exclude)
              </Label>
              <div className="mt-2 space-y-2">
                <Input
                  placeholder="Add something to avoid and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      const newAvoid = e.currentTarget.value.trim();
                      if (!wizardData.mustAvoid.includes(newAvoid)) {
                        updateWizardData('mustAvoid', [...wizardData.mustAvoid, newAvoid]);
                      }
                      e.currentTarget.value = '';
                    }
                  }}
                  data-testid="wizard-must-avoid-input"
                />
                <div className="flex flex-wrap gap-2">
                  {wizardData.mustAvoid.map((item, index) => (
                    <Badge key={index} variant="destructive" className="cursor-pointer" onClick={() => {
                      updateWizardData('mustAvoid', wizardData.mustAvoid.filter((_, i) => i !== index));
                    }}>
                      {item} <i className="fas fa-times ml-1"></i>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="special-requirements" className="text-base font-medium">
                Special requirements
              </Label>
              <Textarea
                id="special-requirements"
                value={wizardData.specialRequirements}
                onChange={(e) => updateWizardData('specialRequirements', e.target.value)}
                placeholder="e.g., Must comply with GDPR, Include call-to-action, Use company brand voice..."
                className="mt-2"
                rows={3}
                data-testid="wizard-special-requirements"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Any additional constraints, compliance requirements, or specific instructions.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Prompt Wizard</h1>
        <p className="text-muted-foreground">
          Build your perfect prompt step-by-step with guided assistance and live preview.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Step Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-route text-primary"></i>
                <span>Wizard Steps</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {WIZARD_STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    currentStep === step.id 
                      ? 'border-primary bg-primary/5 text-foreground' 
                      : step.id < currentStep
                      ? 'border-green-500 bg-green-500/5 text-foreground'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                  }`}
                  onClick={() => setCurrentStep(step.id)}
                  data-testid={`wizard-step-${step.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep === step.id
                        ? 'bg-primary text-primary-foreground'
                        : step.id < currentStep
                        ? 'bg-green-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {step.id < currentStep ? (
                        <i className="fas fa-check"></i>
                      ) : (
                        step.id
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{step.title}</h4>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Center: Current Step */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className={`fas ${WIZARD_STEPS[currentStep - 1].icon} text-primary`}></i>
                <span>{WIZARD_STEPS[currentStep - 1].title}</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {WIZARD_STEPS[currentStep - 1].description}
              </p>
            </CardHeader>
            <CardContent>
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              data-testid="wizard-prev"
            >
              <i className="fas fa-arrow-left mr-2"></i>Previous
            </Button>

            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {WIZARD_STEPS.length}
            </div>

            {isLastStep ? (
              <Button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="wizard-generate"
              >
                <i className={`fas ${generateMutation.isPending ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'} mr-2`}></i>
                {generateMutation.isPending ? 'Generating...' : 'Generate Prompt'}
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                data-testid="wizard-next"
              >
                Next <i className="fas fa-arrow-right ml-2"></i>
              </Button>
            )}
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-eye text-primary"></i>
                <span>Live Preview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="text-sm whitespace-pre-wrap text-foreground font-mono bg-muted/30 p-4 rounded-lg">
                  {promptPreview}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}