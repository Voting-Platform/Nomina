"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Rocket } from "lucide-react";

import {
  Button,
  BasicInfoForm,
  CandidateEntryForm,
  VotingRulesForm,
  VoterAccessForm,
  StepIndicator,
  SchedulingForm,
  ReviewSummary,
} from "@/components";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { createElection } from "@/lib/api/server";
import type {
  CreateCandidateInput,
  VotingRulesInput,
  VoterAccessInput,
  SchedulingInput,
} from "@/types";

const STEPS = [
  { label: "Basic Info" },
  { label: "Candidates" },
  { label: "Voting Rules" },
  { label: "Voter Access" },
  { label: "Schedule" },
  { label: "Review" },
];

export function WizardContainer() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── Discard changes states ───
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  // ─── Form state ───
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [candidates, setCandidates] = useState<CreateCandidateInput[]>([
    { name: "", description: "" },
    { name: "", description: "" },
  ]);
  const [votingRules, setVotingRules] = useState<VotingRulesInput>({
    maxTotalVotesPerVoter: 1,
    maxVotesPerCandidate: 1,
  });
  const [voterAccess, setVoterAccess] = useState<VoterAccessInput>({
    accessType: "public",
    pinEnabled: false,
    otpRequired: false,
    collectVoterDetails: false,
    revealVoterIdentities: false,
    voters: [],
  });
  const [scheduling, setScheduling] = useState<SchedulingInput>({
    mode: "manual",
  });

  const hasUnsavedChanges =
    title.trim().length > 0 ||
    description.trim().length > 0 ||
    candidates.some((c) => c.name.trim().length > 0);

  // Prompt before unload (refresh, exit tab)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // Intercept Next.js link navigation away from create election flow
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      if (!hasUnsavedChanges) return;

      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (anchor) {
        const href = anchor.getAttribute("href");
        if (href && !href.startsWith("#") && href !== "/elections/create") {
          e.preventDefault();
          e.stopPropagation();
          setPendingHref(href);
          setShowConfirmDiscard(true);
        }
      }
    };

    window.addEventListener("click", handleAnchorClick, true);
    return () => {
      window.removeEventListener("click", handleAnchorClick, true);
    };
  }, [hasUnsavedChanges]);

  // ─── Validation ───
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // Basic Info
        if (!title.trim()) newErrors.title = "Election title is required";
        if (title.trim().length < 3) newErrors.title = "Title must be at least 3 characters";
        break;

      case 1: // Candidates
        const validCandidates = candidates.filter((c) => c.name.trim());
        if (validCandidates.length < 2)
          newErrors.candidates = "At least 2 candidates with names are required";
        break;
      case 2: // Voting Rules
        if (!votingRules.maxTotalVotesPerVoter || votingRules.maxTotalVotesPerVoter < 1)
          newErrors.votingRules = "Max total votes per voter must be at least 1";
        else if (!votingRules.maxVotesPerCandidate || votingRules.maxVotesPerCandidate < 1)
          newErrors.votingRules = "Max votes per candidate must be at least 1";
        else if (votingRules.maxVotesPerCandidate > votingRules.maxTotalVotesPerVoter)
          newErrors.votingRules = "Max per candidate cannot exceed max total votes";
        break;

      case 3: // Voter Access
        if (voterAccess.accessType === "protected" && voterAccess.voters.length === 0)
          newErrors.voterAccess = "Add at least one voter email for a protected election";
        break;

      case 4: // Scheduling
        if (scheduling.mode === "automatic") {
          if (!scheduling.scheduledStartAt) {
            newErrors.scheduling = "Start time is required";
          } else if (!scheduling.scheduledEndAt) {
            newErrors.scheduling = "End time is required";
          } else {
            const startDate = new Date(scheduling.scheduledStartAt);
            const endDate = new Date(scheduling.scheduledEndAt);
            const now = new Date();

            if (startDate.getTime() < now.getTime() - 60 * 1000) {
              newErrors.scheduling = "Start time cannot be in the past";
            } else if (startDate >= endDate) {
              newErrors.scheduling = "Start time must be before end time";
            }
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
    }
  };

  const goBack = () => {
    setErrors({});
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = () => {
    // Clean candidates (remove empty ones)
    const cleanCandidates = candidates.filter((c) => c.name.trim());

    startTransition(async () => {
      try {
        const result = await createElection({
          title: title.trim(),
          description: description.trim(),
          candidates: cleanCandidates,
          votingRules,
          voterAccess,
          scheduling,
        });
        router.push(`/elections/${result._id}`);
      } catch (error) {
        console.error("Failed to create election:", error);
        setErrors({ submit: error instanceof Error ? error.message : "Failed to create election" });
      }
    });
  };

  // ─── Build create input for review ───
  const createInput = {
    title,
    description,
    candidates: candidates.filter((c) => c.name.trim()),
    votingRules,
    voterAccess,
    scheduling,
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Step indicator */}
      <StepIndicator steps={STEPS} currentStep={currentStep} />

      {/* Step content */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-8 shadow-sm">
        {/* Step title */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {STEPS[currentStep].label}
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {currentStep === 0 && "Give your election a title and description"}
            {currentStep === 1 && "Add the candidates voters will choose from"}
            {currentStep === 2 && "Configure how voting works"}
            {currentStep === 3 && "Decide who can vote and how voters are verified"}
            {currentStep === 4 && "Choose when the election opens and closes"}
            {currentStep === 5 && "Review everything before creating your election"}
          </p>
        </div>

        {/* Form content */}
        {currentStep === 0 && (
          <BasicInfoForm
            title={title}
            description={description}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            errors={errors}
          />
        )}
        {currentStep === 1 && (
          <CandidateEntryForm
            candidates={candidates}
            onCandidatesChange={setCandidates}
            errors={errors}
          />
        )}
        {currentStep === 2 && (
          <VotingRulesForm rules={votingRules} onRulesChange={setVotingRules} errors={errors} />
        )}
        {currentStep === 3 && (
          <VoterAccessForm value={voterAccess} onChange={setVoterAccess} errors={errors} />
        )}
        {currentStep === 4 && (
          <SchedulingForm scheduling={scheduling} onSchedulingChange={setScheduling} errors={errors} />
        )}
        {currentStep === 5 && <ReviewSummary data={createInput} />}

        {/* Error display */}
        {errors.submit && (
          <div className="mt-4 rounded-lg bg-[var(--destructive-light)] px-4 py-3 text-sm text-[var(--destructive)]">
            {errors.submit}
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={goBack}
          disabled={currentStep === 0}
          className={currentStep === 0 ? "invisible" : ""}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {currentStep < STEPS.length - 1 ? (
          <Button onClick={goNext}>
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? (
              "Creating..."
            ) : (
              <>
                <Rocket className="h-4 w-4" />
                Create Election
              </>
            )}
          </Button>
        )}
      </div>

      <Dialog open={showConfirmDiscard} onOpenChange={setShowConfirmDiscard}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Discard Election?</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Leaving this page will discard the current election progress.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowConfirmDiscard(false);
                setPendingHref(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[var(--destructive)] text-white hover:bg-[var(--destructive-hover)] border-0"
              onClick={() => {
                setShowConfirmDiscard(false);
                if (pendingHref) {
                  router.push(pendingHref);
                }
              }}
            >
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
