import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function MobileNavigation() {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
      <div className="flex items-center justify-around py-2">
        <Button
          variant="ghost"
          asChild
          className={`flex flex-col items-center p-2 h-auto ${
            isActive("/library") ? "text-primary" : "text-muted-foreground"
          }`}
          data-testid="button-mobile-nav-library"
        >
          <Link href="/library">
            <i className="fas fa-home text-lg"></i>
            <span className="text-xs mt-1">Library</span>
          </Link>
        </Button>
        
        <Button
          variant="ghost"
          asChild
          className={`flex flex-col items-center p-2 h-auto ${
            isActive("/ai-builder") ? "text-primary" : "text-muted-foreground"
          }`}
          data-testid="button-mobile-nav-ai-builder"
        >
          <Link href="/ai-builder">
            <i className="fas fa-magic text-lg"></i>
            <span className="text-xs mt-1">AI Builder</span>
          </Link>
        </Button>
        
        <Button
          variant="ghost"
          asChild
          className={`flex flex-col items-center p-2 h-auto ${
            isActive("/my-prompts") ? "text-primary" : "text-muted-foreground"
          }`}
          data-testid="button-mobile-nav-saved"
        >
          <Link href="/my-prompts">
            <i className="fas fa-bookmark text-lg"></i>
            <span className="text-xs mt-1">Saved</span>
          </Link>
        </Button>
        
        <Button
          variant="ghost"
          className="flex flex-col items-center p-2 h-auto text-muted-foreground"
          data-testid="button-mobile-nav-profile"
        >
          <i className="fas fa-user text-lg"></i>
          <span className="text-xs mt-1">Profile</span>
        </Button>
      </div>
    </div>
  );
}
