import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Sparkles } from 'lucide-react';

interface RewardScreenProps {
  isOpen: boolean;
  onClose: () => void;
  eventName: string;
  nftImage?: string;
  txHash?: string;
}

export function RewardScreen({ isOpen, onClose, eventName, nftImage, txHash }: RewardScreenProps) {
  const [showAnimation, setShowAnimation] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Trigger animations with delays
      setTimeout(() => setShowAnimation(true), 100);
      setTimeout(() => setShowContent(true), 600);
      
      // Trigger confetti
      if (typeof window !== 'undefined') {
        import('canvas-confetti').then(confetti => {
          const duration = 3000;
          const end = Date.now() + duration;

          const colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

          (function frame() {
            confetti.default({
              particleCount: 3,
              angle: 60,
              spread: 55,
              origin: { x: 0, y: 0.8 },
              colors: colors
            });
            confetti.default({
              particleCount: 3,
              angle: 120,
              spread: 55,
              origin: { x: 1, y: 0.8 },
              colors: colors
            });

            if (Date.now() < end) {
              requestAnimationFrame(frame);
            }
          }());
        });
      }
    } else {
      setShowAnimation(false);
      setShowContent(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md mx-auto text-center border-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5 backdrop-blur-sm">
        <div className="space-y-6 py-6">
          {/* Trophy Animation */}
          <div className={`transform transition-all duration-1000 ${showAnimation ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}`}>
            <div className="relative mx-auto w-24 h-24 mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute inset-2 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                <Trophy className="w-10 h-10 text-primary-foreground" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              </div>
              <div className="absolute -bottom-2 -left-2">
                <Star className="w-5 h-5 text-secondary animate-pulse" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className={`transform transition-all duration-800 delay-300 ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
              Congratulations! 🎉
            </h2>
            <p className="text-lg text-muted-foreground mb-4">
              You earned an NFT badge!
            </p>
            
            <div className="bg-card/50 rounded-lg p-4 border border-border/50 backdrop-blur-sm">
              <Badge variant="secondary" className="mb-3">
                Event Badge
              </Badge>
              
              {nftImage ? (
                <div className="relative w-32 h-32 mx-auto mb-3 rounded-lg overflow-hidden border-2 border-primary/20">
                  <img 
                    src={nftImage} 
                    alt="NFT Badge"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
                </div>
              ) : (
                <div className="w-32 h-32 mx-auto mb-3 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border-2 border-primary/20">
                  <Trophy className="w-16 h-16 text-primary/70" />
                </div>
              )}
              
              <h3 className="font-semibold text-sm text-foreground">
                {eventName}
              </h3>
              
              {txHash && (
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  TX: {txHash.slice(0, 8)}...{txHash.slice(-6)}
                </p>
              )}
            </div>

            <p className="text-sm text-muted-foreground mt-4">
              Your proof has been submitted to the blockchain and your NFT badge has been minted!
            </p>

            <Button 
              onClick={onClose}
              className="mt-6 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-medium px-8"
            >
              Awesome! 🚀
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}