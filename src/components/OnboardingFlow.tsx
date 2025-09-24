import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { MoProIntegration } from "@/lib/moproIntegration";
import { SecureWallet } from "@/lib/secureWallet";
import { toast } from "sonner";

interface OnboardingFlowProps {
  onComplete: () => void;
}

interface CredentialRequest {
  type: 'age' | 'uniqueness' | 'ticket';
  data: any;
  completed: boolean;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [age, setAge] = useState("");
  const [userSecret, setUserSecret] = useState("");
  const [ticketCode, setTicketCode] = useState("");
  const [credentials, setCredentials] = useState<CredentialRequest[]>([
    { type: 'age', data: null, completed: false },
    { type: 'uniqueness', data: null, completed: false },
    { type: 'ticket', data: null, completed: false }
  ]);
  const [moProAvailable, setMoProAvailable] = useState(false);

  const steps = [
    "Initialize Wallet",
    "Age Verification", 
    "Uniqueness Proof",
    "Ticket Credential",
    "Complete Setup"
  ];

  const initializeWallet = async () => {
    setLoading(true);
    try {
      // Check MoPro availability
      const available = MoProIntegration.isMoProAvailable();
      setMoProAvailable(available);

      if (!available) {
        toast.error("MoPro SDK not available. Using fallback mode.");
      }

      // Initialize MoPro and secure wallet
      await MoProIntegration.initialize();
      await SecureWallet.initializeWallet();

      toast.success("Secure wallet initialized!");
      setCurrentStep(1);
    } catch (error) {
      toast.error("Failed to initialize wallet");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateAgeCredential = async () => {
    if (!age || parseInt(age) < 18) {
      toast.error("Age must be 18 or older");
      return;
    }

    setLoading(true);
    try {
      if (moProAvailable) {
        const credential = await MoProIntegration.generateAgeCredential(parseInt(age));
        if (credential) {
          SecureWallet.addCredential(credential);
          toast.success("Age credential generated!");
        } else {
          throw new Error("Failed to generate age credential");
        }
      } else {
        // Mock credential for fallback
        toast.success("Age verified (fallback mode)");
      }

      const updatedCredentials = [...credentials];
      updatedCredentials[0] = { type: 'age', data: { age }, completed: true };
      setCredentials(updatedCredentials);
      setCurrentStep(2);
    } catch (error) {
      toast.error("Failed to generate age credential");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateUniquenessCredential = async () => {
    if (!userSecret || userSecret.length < 8) {
      toast.error("Secret must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      if (moProAvailable) {
        const credential = await MoProIntegration.generateUniquenessCredential(userSecret);
        if (credential) {
          SecureWallet.addCredential(credential);
          toast.success("Uniqueness credential generated!");
        } else {
          throw new Error("Failed to generate uniqueness credential");
        }
      } else {
        toast.success("Uniqueness verified (fallback mode)");
      }

      const updatedCredentials = [...credentials];
      updatedCredentials[1] = { type: 'uniqueness', data: { secret: userSecret }, completed: true };
      setCredentials(updatedCredentials);
      setCurrentStep(3);
    } catch (error) {
      toast.error("Failed to generate uniqueness credential");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateTicketCredential = async () => {
    if (!ticketCode || ticketCode.length < 6) {
      toast.error("Please enter a valid ticket code");
      return;
    }

    setLoading(true);
    try {
      if (moProAvailable) {
        const credential = await MoProIntegration.generateEventCredential(
          `ticket_${ticketCode}`,
          "Onboarding Ticket",
          "Digital Wallet"
        );
        if (credential) {
          SecureWallet.addCredential(credential);
          toast.success("Ticket credential generated!");
        } else {
          throw new Error("Failed to generate ticket credential");
        }
      } else {
        toast.success("Ticket verified (fallback mode)");
      }

      const updatedCredentials = [...credentials];
      updatedCredentials[2] = { type: 'ticket', data: { code: ticketCode }, completed: true };
      setCredentials(updatedCredentials);
      setCurrentStep(4);
    } catch (error) {
      toast.error("Failed to generate ticket credential");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = () => {
    toast.success("Onboarding completed! Welcome to your secure ZK wallet.");
    onComplete();
  };

  const progress = (currentStep / (steps.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">ZK Wallet Setup</CardTitle>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
            </p>
            <Progress value={progress} className="w-full" />
          </div>
          {!moProAvailable && (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              MoPro SDK not available - using fallback mode
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 0: Initialize Wallet */}
          {currentStep === 0 && (
            <div className="space-y-4 text-center">
              <p className="text-muted-foreground">
                Setting up your secure ZK identity wallet with MoPro integration
              </p>
              <Button 
                onClick={initializeWallet}
                disabled={loading}
                className="w-full"
                variant="gradient"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  "Initialize Secure Wallet"
                )}
              </Button>
            </div>
          )}

          {/* Step 1: Age Verification */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age Verification</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Enter your age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min="18"
                />
                <p className="text-xs text-muted-foreground">
                  Generate a ZK proof that you're over 18 without revealing your exact age
                </p>
              </div>
              <Button 
                onClick={generateAgeCredential}
                disabled={loading || !age}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Proof...
                  </>
                ) : (
                  "Generate Age Credential"
                )}
              </Button>
            </div>
          )}

          {/* Step 2: Uniqueness Proof */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="secret">Uniqueness Secret</Label>
                <Input
                  id="secret"
                  type="password"
                  placeholder="Enter a unique secret (min 8 chars)"
                  value={userSecret}
                  onChange={(e) => setUserSecret(e.target.value)}
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  This proves you're a unique person without revealing identity
                </p>
              </div>
              <Button 
                onClick={generateUniquenessCredential}
                disabled={loading || !userSecret}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Proof...
                  </>
                ) : (
                  "Generate Uniqueness Credential"
                )}
              </Button>
            </div>
          )}

          {/* Step 3: Ticket Credential */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ticket">Ticket Code</Label>
                <Input
                  id="ticket"
                  placeholder="Enter your ticket/access code"
                  value={ticketCode}
                  onChange={(e) => setTicketCode(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Prove you have valid access without revealing the ticket details
                </p>
              </div>
              <Button 
                onClick={generateTicketCredential}
                disabled={loading || !ticketCode}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Proof...
                  </>
                ) : (
                  "Generate Ticket Credential"
                )}
              </Button>
            </div>
          )}

          {/* Step 4: Complete */}
          {currentStep === 4 && (
            <div className="space-y-4 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h3 className="text-lg font-semibold">Setup Complete!</h3>
              <p className="text-muted-foreground">
                Your secure ZK wallet is ready with all credentials
              </p>
              
              <div className="space-y-2">
                {credentials.map((cred, index) => (
                  <div key={cred.type} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <span className="capitalize">{cred.type} Credential</span>
                    <Badge variant={cred.completed ? "default" : "secondary"}>
                      {cred.completed ? "✓ Generated" : "Pending"}
                    </Badge>
                  </div>
                ))}
              </div>

              <Button 
                onClick={completeOnboarding}
                className="w-full"
                variant="gradient"
              >
                Complete Setup
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}