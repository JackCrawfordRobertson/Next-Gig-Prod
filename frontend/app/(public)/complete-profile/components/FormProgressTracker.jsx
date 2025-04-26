import { Progress } from "@/components/ui/progress";

export default function FormProgressTracker({ completion, incompleteFields }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">{completion}% Complete</div>
      </div>
      <Progress 
        value={completion} 
        className="h-2 w-full" 
        aria-label={`Form is ${completion}% complete`}
      />
      {incompleteFields.length > 0 && (
        <p className="text-xs text-amber-600 mt-1" aria-live="polite">
          Missing: {incompleteFields.slice(0, 3).join(", ")}
          {incompleteFields.length > 3
            ? ` and ${incompleteFields.length - 3} more`
            : ""}
        </p>
      )}
    </div>
  );
}