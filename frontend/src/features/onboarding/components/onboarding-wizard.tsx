"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileStep } from "./profile-step";
import { InviteStep } from "./invite-step";
import { GithubStep } from "./github-step";
import { SlackStep } from "./slack-step";
import { UpdatesStep } from "./updates-step";
import { OnboardingCanvas } from "./onboarding-canvas";

export function OnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  const goToNextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handleFinish = () => {
    router.replace("/");
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[var(--bg)] text-[var(--text)]">
      {/* Split Screen Container */}
      <div className="grid flex-1 grid-cols-1 md:grid-cols-2">
        {/* Left Column: Interactive Step Area */}
        <div className="flex flex-col items-center justify-center px-6 py-12 sm:px-12 lg:px-16">
          <div className="w-full max-w-[360px]">
            {currentStep === 1 && (
              <ProfileStep onNext={goToNextStep} onSkip={goToNextStep} />
            )}
            {currentStep === 2 && (
              <InviteStep onNext={goToNextStep} onSkip={goToNextStep} />
            )}
            {currentStep === 3 && (
              <GithubStep onNext={goToNextStep} onSkip={goToNextStep} />
            )}
            {currentStep === 4 && (
              <SlackStep onNext={goToNextStep} onSkip={goToNextStep} />
            )}
            {currentStep === 5 && (
              <UpdatesStep onComplete={handleFinish} />
            )}
          </div>
        </div>

        {/* Right Column: Branded Visual Canvas */}
        <div className="hidden md:flex">
          <OnboardingCanvas step={currentStep} />
        </div>
      </div>

      {/* Bottom Step Indicator Dots (5 steps, dynamically active) */}
      <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-1.5 pointer-events-none">
        {[1, 2, 3, 4, 5].map((stepNum) => (
          <span
            key={stepNum}
            className={`h-1.5 transition-all duration-200 ease-out ${
              stepNum === currentStep
                ? "w-4 rounded-full bg-[var(--text-2)]"
                : "w-1.5 rounded-full bg-[var(--border-strong)]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
