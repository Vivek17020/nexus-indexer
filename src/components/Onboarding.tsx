import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Users, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import heroImage from "@/assets/hero-zk.jpg";

interface OnboardingProps {
  onComplete: () => void;
}

const OnboardingScreen = ({ children, title, description }: {
  children: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="flex flex-col items-center text-center space-y-6 animate-fade-in">
    <div className="w-full max-w-sm aspect-video bg-gradient-dark rounded-2xl p-8 flex items-center justify-center shadow-card">
      {children}
    </div>
    <div className="space-y-3 px-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  </div>
);

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const screens = [
    {
      title: "Welcome to ZKPresence",
      description: "Prove your presence at events without revealing your identity using zero-knowledge proofs.",
      icon: <img src={heroImage} alt="ZKPresence Hero" className="w-full h-full object-cover rounded-xl" />
    },
    {
      title: "Privacy First",
      description: "Generate cryptographic proofs of your attendance while keeping your personal information completely private.",
      icon: <Shield className="w-16 h-16 text-primary" />
    },
    {
      title: "Join Events",
      description: "Discover and participate in events that support zero-knowledge verification. From conferences to meetups.",
      icon: <Users className="w-16 h-16 text-primary" />
    },
    {
      title: "Collect Proofs",
      description: "Build a verifiable record of your participation that you can share without compromising your privacy.",
      icon: <CheckCircle className="w-16 h-16 text-primary" />
    }
  ];

  const nextStep = () => {
    if (currentStep < screens.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <OnboardingScreen
            title={screens[currentStep].title}
            description={screens[currentStep].description}
          >
            {screens[currentStep].icon}
          </OnboardingScreen>
        </div>
      </div>

      <div className="p-6 space-y-4 safe-bottom">
        {/* Progress indicators */}
        <div className="flex justify-center space-x-2 mb-6">
          {screens.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between space-x-4">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={nextStep}
            className="flex-1"
            variant={currentStep === screens.length - 1 ? "gradient" : "gradient"}
          >
            {currentStep === screens.length - 1 ? 'Get Started' : 'Next'}
            {currentStep < screens.length - 1 && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
}