import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/theme-toggle";
import { useState } from "react";

export default function NavigationBar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location === path;

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-magic text-primary-foreground text-sm"></i>
              </div>
              <span className="text-xl font-bold text-foreground">Better Prompt</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className={`transition-colors font-medium ${
                isActive("/") 
                  ? "text-primary" 
                  : "text-foreground hover:text-primary"
              }`}
              data-testid="link-library"
            >
              Library
            </Link>
            <Link 
              href="/ai-builder" 
              className={`transition-colors ${
                isActive("/ai-builder") 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-primary"
              }`}
              data-testid="link-ai-builder"
            >
              AI Builder
            </Link>
            <Link 
              href="/my-prompts" 
              className={`transition-colors ${
                isActive("/my-prompts") 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-primary"
              }`}
              data-testid="link-my-prompts"
            >
              My Prompts
            </Link>
            <Button 
              asChild 
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
              data-testid="button-new-prompt"
            >
              <Link href="/ai-builder">
                <i className="fas fa-plus mr-2"></i>New Prompt
              </Link>
            </Button>

            {/* Theme toggle */}
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {/* Mobile theme toggle */}
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-foreground hover:text-primary"
              data-testid="button-mobile-menu"
            >
              <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-lg`}></i>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-4">
              <Link 
                href="/" 
                className={`text-left px-2 py-1 transition-colors ${
                  isActive("/") 
                    ? "text-primary font-medium" 
                    : "text-foreground hover:text-primary"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
                data-testid="link-mobile-library"
              >
                Library
              </Link>
              <Link 
                href="/ai-builder" 
                className={`text-left px-2 py-1 transition-colors ${
                  isActive("/ai-builder") 
                    ? "text-primary font-medium" 
                    : "text-muted-foreground hover:text-primary"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
                data-testid="link-mobile-ai-builder"
              >
                AI Builder
              </Link>
              <Link 
                href="/my-prompts" 
                className={`text-left px-2 py-1 transition-colors ${
                  isActive("/my-prompts") 
                    ? "text-primary font-medium" 
                    : "text-muted-foreground hover:text-primary"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
                data-testid="link-mobile-my-prompts"
              >
                My Prompts
              </Link>
              <Button 
                asChild 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
                data-testid="button-mobile-new-prompt"
              >
                <Link href="/ai-builder">
                  <i className="fas fa-plus mr-2"></i>New Prompt
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
