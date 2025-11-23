/**
 * Empty State Component
 * Reusable component for displaying friendly messages when there's no data
 */

import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Search,
  Archive,
  RefreshCw,
  TrendingUp,
  Mail,
  Settings,
  Sparkles,
} from "lucide-react";

/**
 * Main EmptyState component
 */
export function EmptyState({
  icon: Icon = Briefcase,
  title,
  description,
  action,
  secondaryAction,
  variant = "default", // default, primary, subtle
  className = "",
}) {
  const variantStyles = {
    default: "bg-muted/50",
    primary: "bg-primary/5 border-2 border-primary/20",
    subtle: "bg-background",
  };

  return (
    <div
      className={`flex items-center justify-center min-h-[400px] rounded-lg p-6 ${variantStyles[variant]} ${className}`}
    >
      <div className="text-center max-w-md">
        <div className="mx-auto mb-4 p-3 bg-muted rounded-full w-fit">
          <Icon className="h-12 w-12 text-muted-foreground" />
        </div>

        <h3 className="font-semibold text-lg mb-2">{title}</h3>

        {description && (
          <p className="text-sm text-muted-foreground mb-6">{description}</p>
        )}

        {action && (
          <div className="flex gap-3 justify-center">
            <Button onClick={action.onClick} variant={action.variant || "default"}>
              {action.icon && <action.icon className="h-4 w-4 mr-2" />}
              {action.label}
            </Button>

            {secondaryAction && (
              <Button
                onClick={secondaryAction.onClick}
                variant={secondaryAction.variant || "outline"}
              >
                {secondaryAction.icon && (
                  <secondaryAction.icon className="h-4 w-4 mr-2" />
                )}
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Pre-configured empty state variants for common scenarios
 */

// New user with no jobs yet
export function NoJobsYet({ onCustomizePreferences, onLearnMore }) {
  return (
    <EmptyState
      icon={Sparkles}
      title="Welcome to Next Gig!"
      description="Your personalized job board is getting ready. We're gathering your first batch of opportunities and they'll appear here within 8 hours. In the meantime, customize your preferences to get better matches."
      variant="primary"
      action={{
        label: "Customize Preferences",
        onClick: onCustomizePreferences,
        icon: Settings,
      }}
      secondaryAction={
        onLearnMore && {
          label: "Learn How It Works",
          onClick: onLearnMore,
        }
      }
    />
  );
}

// No search results
export function NoSearchResults({ searchQuery, onClearSearch, onClearFilters }) {
  return (
    <EmptyState
      icon={Search}
      title={`No jobs found${searchQuery ? ` for "${searchQuery}"` : ""}`}
      description="Try broadening your search terms, removing some filters, or checking back tomorrow for new listings."
      action={
        onClearSearch && {
          label: "Clear Search",
          onClick: onClearSearch,
          variant: "outline",
        }
      }
      secondaryAction={
        onClearFilters && {
          label: "Clear All Filters",
          onClick: onClearFilters,
          variant: "ghost",
        }
      }
    />
  );
}

// All jobs archived
export function AllJobsArchived({ onViewArchived, onRefresh }) {
  return (
    <EmptyState
      icon={Archive}
      title="All caught up!"
      description="You've archived all available jobs. New opportunities will appear as they're discovered. Check your archived jobs to review past opportunities."
      action={{
        label: "View Archived Jobs",
        onClick: onViewArchived,
        icon: Archive,
      }}
      secondaryAction={
        onRefresh && {
          label: "Refresh Now",
          onClick: onRefresh,
          icon: RefreshCw,
        }
      }
    />
  );
}

// No new jobs in 24 hours
export function NoRecentJobs({ onViewAllJobs }) {
  return (
    <EmptyState
      icon={TrendingUp}
      title="No new jobs in the last 24 hours"
      description="Don't worry! Job postings fluctuate throughout the week. Check the weekly trends chart or browse all available jobs."
      action={
        onViewAllJobs && {
          label: "View All Jobs",
          onClick: onViewAllJobs,
        }
      }
    />
  );
}

// Email notifications disabled
export function EmailNotificationsDisabled({ onEnableNotifications }) {
  return (
    <EmptyState
      icon={Mail}
      title="Email notifications are off"
      description="You won't receive job alerts in your inbox. Enable email notifications to get new opportunities delivered every 8 hours."
      variant="primary"
      action={{
        label: "Enable Notifications",
        onClick: onEnableNotifications,
        icon: Mail,
      }}
    />
  );
}

// No archived jobs
export function NoArchivedJobs({ onBrowseJobs }) {
  return (
    <EmptyState
      icon={Archive}
      title="No Archived Jobs"
      description="You haven't archived any jobs yet. Archive jobs from the LinkedIn, If You Could, or UN Jobs pages to keep track of the ones you've applied to or want to save for later."
      action={
        onBrowseJobs && {
          label: "Browse Jobs",
          onClick: onBrowseJobs,
          icon: Briefcase,
        }
      }
    />
  );
}

// Error state (when data fails to load)
export function ErrorLoadingJobs({ onRetry }) {
  return (
    <EmptyState
      icon={RefreshCw}
      title="Unable to load jobs"
      description="Something went wrong while loading your jobs. Please try again or check back in a moment."
      variant="subtle"
      action={{
        label: "Try Again",
        onClick: onRetry,
        icon: RefreshCw,
      }}
    />
  );
}

// Loading state placeholder (optional)
export function LoadingJobs() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2">
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
        </div>
        <p className="text-muted-foreground animate-pulse">Loading your jobs...</p>
      </div>
    </div>
  );
}

export default EmptyState;
