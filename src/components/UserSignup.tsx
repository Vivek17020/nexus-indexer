import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, Mail, Phone, User, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface UserSignupProps {
  onComplete: () => void;
}

export default function UserSignup({ onComplete }: UserSignupProps) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSignup = async (anonymous: boolean = false) => {
    setLoading(true);
    
    try {
      const { error } = await signUp(
        anonymous ? undefined : email || undefined,
        anonymous ? undefined : phone || undefined,
        displayName || undefined
      );

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Account created! Wallet generated securely.");
        onComplete();
      }
    } catch (err) {
      toast.error("Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold">Create Your Account</h2>
              <p className="text-muted-foreground">
                We'll generate a secure anonymous wallet for you automatically
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">
                  <User className="w-4 h-4 inline mr-2" />
                  Display Name (Optional)
                </Label>
                <Input
                  id="displayName"
                  placeholder="How should we call you?"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email (Optional)
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Phone (Optional)
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => handleSignup(false)}
                disabled={loading}
                className="w-full"
                variant="gradient"
              >
                {loading ? "Creating Account..." : "Create Account"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <Button 
                onClick={() => handleSignup(true)}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                Continue Anonymously
              </Button>
            </div>

            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p>🔒 Your wallet keypair is generated locally and stored securely on your device</p>
              <p>✨ Zero-knowledge proofs protect your privacy</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}