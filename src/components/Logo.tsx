import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export const Logo = ({ size = "md", showText = true, className }: LogoProps) => {
  const sizes = {
    sm: { icon: 20, text: "text-lg" },
    md: { icon: 28, text: "text-2xl" },
    lg: { icon: 40, text: "text-4xl" },
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
        <div className="relative bg-primary rounded-xl p-2 shadow-glow">
          <BookOpen size={sizes[size].icon} className="text-primary-foreground" />
        </div>
      </div>
      {showText && (
        <span className={cn("font-bold tracking-tight", sizes[size].text)}>
          Study<span className="text-primary">Bud</span>
        </span>
      )}
    </div>
  );
};
