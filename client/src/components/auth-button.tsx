import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AuthButton() {
  const { user, signInWithGoogle, signOut } = useAuth();

  if (!user) {
    return (
      <Button
        onClick={signInWithGoogle}
        size="sm"
        className="inline-flex items-center gap-2 h-9 px-3 rounded-full font-medium bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
      >
        <i className="fab fa-google"></i>
        <span className="hidden sm:inline">Sign in</span>
        <span className="sm:hidden">Login</span>
      </Button>
    );
  }

  const initial = (user.email || user.user_metadata?.name || "U").charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Account menu"
          className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow hover:opacity-90 transition"
        >
          {initial}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
          <i className="fas fa-right-from-bracket"></i>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
