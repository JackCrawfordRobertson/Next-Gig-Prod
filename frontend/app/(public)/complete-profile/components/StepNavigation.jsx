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
    <div className="flex justify-between mt-6 pt-2">
      {currentStep === 0 ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs text-gray-500 hover:text-gray-700"
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
        >
          Previous
        </Button>
      )}
      
      {isLastStep ? (
        <Button
          onClick={onSubmit}
          disabled={!isFormValid || loading}
          className="ml-auto"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </Button>
      ) : (
        <Button
          type="button"
          onClick={onNext}
          disabled={loading}
        >
          Next
        </Button>
      )}
    </div>
  );
}