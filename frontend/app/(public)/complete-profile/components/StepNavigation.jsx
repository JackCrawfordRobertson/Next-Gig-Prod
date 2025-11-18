import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react"; // Make sure to import this

export default function StepNavigation({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSubmit,
  isLastStep,
  isFormValid,
  loading 
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between mt-6 pt-2">
      {currentStep === 0 ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs text-gray-500 hover:text-gray-700 w-full sm:w-auto"
          onClick={() => window.location.href = "/login"}
          aria-label="Back to login page"
        >
          <ArrowLeft className="w-3 h-3 mr-1" />
          Back to Login
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          Previous
        </Button>
      )}

      {isLastStep ? (
        <Button
          onClick={onSubmit}
          disabled={!isFormValid || loading}
          className="sm:ml-auto w-full sm:w-auto"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </Button>
      ) : (
        <Button
          type="button"
          onClick={onNext}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          Next
        </Button>
      )}
    </div>
  );
}