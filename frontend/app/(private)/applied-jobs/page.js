"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building,
  MapPin,
  Clock,
  Archive,
  ArchiveRestore,
  Briefcase,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/utils/toast";
import { unarchiveJob } from "@/lib/utils/archiveJob";
import { getArchivedJobs } from "@/lib/data/jobDataUtils";
import { isDevelopmentMode } from "@/lib/utils/environment";
import { openJobLink } from "@/lib/utils/openJobLink";

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

// Get badge color based on source
const getSourceBadge = (source) => {
  const badgeMap = {
    linkedin: { label: "LinkedIn", variant: "default" },
    ifyoucould: { label: "If You Could", variant: "secondary" },
    unjobs: { label: "UN Jobs", variant: "outline" },
  };

  return badgeMap[source] || { label: source, variant: "default" };
};

export default function AppliedJobsPage() {
  const { data: session, status } = useSession();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const isDev = isDevelopmentMode();
  const [unarchiving, setUnarchiving] = useState(null);

  useEffect(() => {
    async function fetchArchivedJobs() {
      try {
        console.log("Fetching archived jobs");
        let archivedJobsData = [];

        if (isDev) {
          // In development, fetch from mock API
          const response = await fetch("/api/user");
          if (!response.ok) throw new Error("Failed to fetch user data");
          const userData = await response.json();

          // Get all jobs and filter archived ones
          const allJobs = [
            ...(userData.linkedin || []),
            ...(userData.ifyoucould || []),
            ...(userData.unjobs || []),
          ];
          archivedJobsData = allJobs.filter((job) => job.archived === true);
          console.log("Fetched archived jobs from mock API:", archivedJobsData.length);
        } else {
          // In production, fetch archived jobs directly
          const userEmail = session?.user?.email;

          if (userEmail) {
            const { getUserByEmail } = await import("@/lib/data/jobDataUtils");
            const user = await getUserByEmail(userEmail);

            if (user) {
              archivedJobsData = await getArchivedJobs(user.id);
              console.log(`Found ${archivedJobsData.length} archived jobs`);
            }
          }
        }

        setJobs(archivedJobsData);
      } catch (error) {
        console.error("Error fetching archived jobs:", error);
        showToast({
          title: "Error Loading Jobs",
          description: "Could not load archived jobs. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    if (status === "authenticated") {
      fetchArchivedJobs();
    }
  }, [session, status, isDev]);

  const handleUnarchive = async (job, e) => {
    e.stopPropagation(); // Prevent card click

    setUnarchiving(job.id);

    try {
      const userId = session?.user?.id;

      if (!userId) {
        throw new Error("User ID not found");
      }

      const success = await unarchiveJob(userId, job.id, showToast);

      if (success) {
        // Remove from local state
        setJobs((prevJobs) => prevJobs.filter((j) => j.id !== job.id));
      }
    } catch (error) {
      console.error("Error unarchiving job:", error);
    } finally {
      setUnarchiving(null);
    }
  };

  const handleJobClick = (job) => {
    if (job.url) {
      openJobLink(job.url);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
          </div>
          <p className="text-muted-foreground animate-pulse">
            Loading your applied jobs...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-4 md:p-6">
      <div className="h-full flex flex-col gap-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Archived Jobs</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Jobs you've saved for later review
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {jobs.length} {jobs.length === 1 ? "Job" : "Jobs"}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Jobs List */}
        <Card className="flex-1 flex flex-col min-h-0">
          <CardContent className="p-0 flex-1 flex flex-col min-h-0">
            <ScrollArea className="h-full">
              <div className="flex flex-col gap-3 p-4">
                {jobs.length > 0 ? (
                  jobs.map((job, index) => {
                    const sourceBadge = getSourceBadge(job.source);

                    return (
                      <Card
                        key={index}
                        className="hover:shadow-md transition-shadow bg-card cursor-pointer relative"
                        onClick={() => handleJobClick(job)}
                      >
                        <CardContent className="p-4">
                          {/* Archive indicator ribbon */}
                          <div className="absolute top-0 right-0 bg-primary/10 px-3 py-1 rounded-bl-lg rounded-tr-lg">
                            <div className="flex items-center gap-1 text-xs text-primary font-medium">
                              <Archive className="h-3 w-3" />
                              Archived
                            </div>
                          </div>

                          <div className="flex justify-between items-start mb-3 pr-20">
                            <h3 className="font-medium w-full">{job.title}</h3>
                          </div>

                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant={sourceBadge.variant}>
                              {sourceBadge.label}
                            </Badge>
                            {job.has_applied && (
                              <Badge variant="success" className="bg-green-500/10 text-green-700 border-green-500/20">
                                Applied
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-1 gap-2 mb-3">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Building className="h-4 w-4 mr-2" />
                              {job.company || "Not specified"}
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 mr-2" />
                              {job.location || "Not specified"}
                            </div>
                            {job.date_added && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Clock className="h-4 w-4 mr-2" />
                                Added {formatDate(job.date_added)}
                              </div>
                            )}
                            {job.archivedAt && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Archive className="h-4 w-4 mr-2" />
                                Archived {formatDate(job.archivedAt)}
                              </div>
                            )}
                          </div>

                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/40">
                            <div className="text-xs text-primary hover:underline">
                              Click to view job posting
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => handleUnarchive(job, e)}
                              disabled={unarchiving === job.id}
                              className="gap-2"
                            >
                              {unarchiving === job.id ? (
                                <>Restoring...</>
                              ) : (
                                <>
                                  <ArchiveRestore className="h-4 w-4" />
                                  Restore
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <div className="flex items-center justify-center h-auto min-h-[400px] bg-muted/50 rounded-lg p-6">
                    <div className="text-center max-w-md">
                      <div className="mx-auto mb-4 p-3 bg-muted rounded-full w-fit">
                        <Archive className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">
                        No Archived Jobs
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        You haven't archived any jobs yet. Use the archive feature to
                        save jobs you're interested in, declutter your main job boards,
                        or organize jobs you want to review later.
                      </p>
                      <p className="text-xs text-muted-foreground italic">
                        Archived jobs won't appear in your main job lists but will
                        still count toward your statistics.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
