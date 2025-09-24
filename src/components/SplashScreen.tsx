import { useEffect, useState } from "react";
import { Music, Zap } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onComplete, 500);
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-50 bg-gradient-stage flex flex-col items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      {/* Festival Stage Lights Effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/4 right-1/4 w-24 h-24 bg-accent/20 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute bottom-1/4 left-1/3 w-28 h-28 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Main Logo */}
      <div className="relative z-10 text-center space-y-6 animate-scale-in">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="relative">
            <Zap className="w-16 h-16 text-primary glow-neon animate-pulse" />
            <Music className="w-8 h-8 text-accent absolute -top-2 -right-2 animate-bounce" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            ZKPresence
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Festival Edition
          </p>
        </div>

        {/* Loading Animation */}
        <div className="flex justify-center space-x-2 mt-8">
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-secondary rounded-full animate-bounce delay-100"></div>
          <div className="w-3 h-3 bg-accent rounded-full animate-bounce delay-200"></div>
        </div>
      </div>

      {/* Bottom Glow */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary/10 to-transparent"></div>
    </div>
  );
}