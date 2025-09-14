import NavigationBar from "@/components/navigation-bar";
import MobileNavigation from "@/components/mobile-navigation";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/context/AuthContext";
import TypingBadge from "@/components/typing-badge";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />
      <main className="relative">
        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-[18rem] w-[18rem] rounded-full bg-muted/40 blur-2xl" />
        </div>

        {/* Hero */}
        <section className="relative z-10 min-h-[calc(100vh-4rem)] flex items-center justify-center px-6">
          <div className="max-w-5xl mx-auto text-center">
            <TypingBadge
              className="mb-6"
              phrases={[
                "Design powerful prompts, faster",
                "Build with AI, refine with control",
                "Save, organize, and iterate effortlessly",
                "Ship content with confidence",
                "Supercharge your workflow",
              ]}
            />
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground">
              Level Up Your Prompt Workflow
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
              Curated prompt library, an AI-powered builder, and a clean workspace for saving and refining your creations.
            </p>

            {/* Primary CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild className="h-12 px-6 text-base bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow">
                <Link href="/library">
                  <i className="fas fa-book mr-2" /> Prompt Library
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-12 px-6 text-base rounded-full">
                <Link href="/ai-builder">
                  <i className="fas fa-wand-magic-sparkles mr-2" /> AI Prompt Builder
                </Link>
              </Button>
            </div>

            {/* Secondary sections */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
              <Link href="/my-prompts" className="group">
                <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 text-left transition hover:border-primary/40 hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <i className="fas fa-bookmark" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">Saved Prompts</div>
                      <div className="text-sm text-muted-foreground">Your personal collection</div>
                    </div>
                  </div>
                </div>
              </Link>
              <Link href="/my-prompts?tab=created" className="group">
                <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 text-left transition hover:border-primary/40 hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <i className="fas fa-pen-nib" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">My Creations</div>
                      <div className="text-sm text-muted-foreground">Edit and refine your prompts</div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {!user && (
              <p className="mt-6 text-xs text-muted-foreground">Sign in from the top-right to sync your saved prompts.</p>
            )}
          </div>
        </section>
      </main>

      <MobileNavigation />
    </div>
  );
}
