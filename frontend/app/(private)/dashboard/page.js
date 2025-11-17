// app/(private)/dashboard/page.js
"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Icons
import {
  Search,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// Utility functions
import { isDevelopmentMode } from "@/lib/utils/environment";

// Custom components
import MiniStat from "@/components/dashboard/MiniStat";
import JobCard from "@/components/dashboard/JobCard";

export default function DashboardPage() {
  console.log("Dashboard component rendering started");
  
  // Session and router
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State variables
  const [userData, setUserData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDev, setIsDev] = useState(process.env.NODE_ENV === "development");
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const lastClickTimeRef = useRef(null);
  const selectedJobRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("recent");
  const [loadError, setLoadError] = useState(null);

  // Check for subscription success flag
  useEffect(() => {
    console.log("Checking subscription status");
    // Check if we're coming from a successful subscription
    const subscriptionSuccess = typeof window !== "undefined" 
      ? localStorage.getItem('subscriptionSuccess') 
      : null;
    
    if (status === 'unauthenticated' && !subscriptionSuccess) {
      console.log("Not authenticated, redirecting to login");
      // No session and no successful subscription, redirect to login
      router.push('/login');
    } else if (subscriptionSuccess) {
      console.log("Subscription success, clearing flag");
      // Clear the subscription success flag
      localStorage.removeItem('subscriptionSuccess');
    }
  }, [status, router]);

  // Set development mode
  useEffect(() => {
    setIsDev(isDevelopmentMode());
  }, []);

  // Get jobs from the last 24 hours
  const getRecentJobs = () => {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    return jobs.filter((job) => {
      const jobDate = job.date ? new Date(job.date) : new Date();
      return jobDate >= oneDayAgo;
    });
  };

  // Filter jobs based on search query
  const getFilteredJobs = () => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase().trim();
    return jobs.filter(
      (job) =>
        job.title?.toLowerCase().includes(query) ||
        job.company?.toLowerCase().includes(query) ||
        job.description?.toLowerCase().includes(query) ||
        job.location?.toLowerCase().includes(query)
    );
  };

  // Handle visibility change (user returns from external link)
  const handleVisibilityChange = () => {
    console.log("Visibility changed:", document.visibilityState);
    console.log("Last click time:", lastClickTimeRef.current);
    console.log("Selected job:", selectedJobRef.current);

    if (document.visibilityState === "visible" && lastClickTimeRef.current) {
      const timeAway = Date.now() - lastClickTimeRef.current;
      console.log("Time away (ms):", timeAway);

      // If they spent enough time on the job page (5+ seconds), probably viewed it in detail
      if (timeAway > 5000 && selectedJobRef.current) {
        console.log("Showing apply dialog");
        setSelectedJob(selectedJobRef.current);
        setShowApplyDialog(true);
      } else {
        console.log(
          "Not showing dialog - time threshold not met or no job selected"
        );
      }

      lastClickTimeRef.current = null;
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      const filteredResults = getFilteredJobs();

      // Open the first job if results exist
      if (filteredResults.length > 0) {
        handleJobClick(filteredResults[0]);
        setShowSearchResults(false);

        // Optional: Clear search input after opening first result
        setSearchQuery("");
        searchInputRef.current?.blur();
      }
    }
  };

  // Set up visibility change listener
  useEffect(() => {
    console.log("Setting up visibility change listener");
    // Monitor visibility changes to detect when user returns from a job link
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      console.log("Cleaning up visibility change listener");
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Fetch user data and jobs
useEffect(() => {
  async function fetchUserData() {
    try {
      if (status === "loading") return;
      
      if (isDev) {
        // Development mode
        const response = await fetch("/api/user");
        if (!response.ok) throw new Error("Failed to fetch user data");
        const userData = await response.json();
        setUserData(userData);
        
        // Use transformed jobs directly
        setJobs(userData.transformedJobs || []);
      } else {
        // Production mode
        const userEmail = session?.user?.email;
        if (userEmail) {
          const { getUserByEmail, getUserJobs } = await import("@/lib/data/jobDataUtils");
          const user = await getUserByEmail(userEmail);
          
          if (!user) {
            setJobs([]);
            setLoading(false);
            return;
          }
          
          setUserData(user);
          const allJobs = await getUserJobs(user.id);
          setJobs(allJobs);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoadError("Error loading data. Please refresh.");
    } finally {
      setLoading(false);
    }
  }

  fetchUserData();
}, [status, isDev, session]);

  // Log jobs data for debugging
  useEffect(() => {
    if (jobs.length > 0) {
      console.log("Jobs loaded:", jobs.length);
    } else {
      console.log("No jobs found after setting state");
    }
  }, [jobs]);

  // Handle job card click to open URL
  const handleJobClick = (job) => {
    console.log("Job clicked:", job.title);

    if (job.url) {
      console.log("Opening URL:", job.url);
      selectedJobRef.current = job;
      lastClickTimeRef.current = Date.now();
      console.log("Set lastClickTime:", lastClickTimeRef.current);
      window.open(job.url, "_blank");
    } else {
      console.log("No URL found for job");
    }
  };

  // Handle marking job as applied
  const handleMarkApplied = async (applied) => {
    if (!selectedJob) {
      console.log("No selected job to mark as applied");
      return;
    }
  
    console.log("Marking job as applied:", selectedJob.title, applied);
  
    try {
      // Update the local state
      const updatedJobs = jobs.map((job) =>
        job.id === selectedJob.id ? { ...job, has_applied: applied } : job
      );
      setJobs(updatedJobs);
      console.log("Updated local state");
  
      // Update Firestore if in production
      if (!isDev && selectedJob.id) {
        const { updateJobAppliedStatus } = await import("@/lib/utils/updateJobApplied");
        await updateJobAppliedStatus({
          email: session.user.email,
          jobId: selectedJob.id,
          applied
        });
        console.log("Firestore updated successfully");
      }
    } catch (error) {
      console.error("Error updating application status:", error);
    } finally {
      setShowApplyDialog(false);
      setSelectedJob(null);
    }
  };

  // Calculate job counts by source
  const jobCounts = {
    linkedin: jobs.filter((job) => 
      job.source?.toLowerCase() === "linkedin").length,
    workable: jobs.filter((job) => 
      job.source?.toLowerCase() === "workable").length,
    ifyoucould: jobs.filter((job) => 
      job.source?.toLowerCase() === "ifyoucould").length,
    unjobs: jobs.filter((job) => 
      job.source?.toLowerCase() === "unjobs").length,
  };

  // Get filtered job lists
  const recentJobs = getRecentJobs();
  const filteredJobs = getFilteredJobs();

  console.log("Rendering dashboard with state:", { 
    loading, 
    loadError, 
    jobsCount: jobs.length,
    recentJobsCount: recentJobs.length,
    filteredJobsCount: filteredJobs.length
  });

  // Final render
  return (
    <div className="h-screen w-full flex flex-col bg-transparent p-2 sm:p-4 overflow-auto md:overflow-hidden">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
            </div>
            <p className="text-muted-foreground animate-pulse">
              Loading your jobs...
            </p>
          </div>
        </div>
      ) : loadError ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-red-500">{loadError}</p>
        </div>
      ) : (
        <div className="flex flex-col h-full space-y-3 sm:space-y-4">
          {/* Stats Row - Scrollable on mobile, grid on desktop */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MiniStat title="LinkedIn" count={jobCounts.linkedin} />
            {/* <MiniStat title="Workable" count={jobCounts.workable} /> */}
            <MiniStat title="If You Could" count={jobCounts.ifyoucould} />
            <MiniStat title="UN Jobs" count={jobCounts.unjobs} />
          </div>

          {/* Search Bar with Dropdown */}
          <div className="relative">
            <div className="relative bg-background border border-input rounded-md h-[3rem]">
              <Search className="absolute left-2.5 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search all jobs..."
                className="pl-9 h-[3rem] flex items-center"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(e.target.value.trim() !== "");
                }}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => {
                  if (searchQuery.trim() !== "") {
                    setShowSearchResults(true);
                  }
                }}
              />
            </div>

            {showSearchResults && (
              <Card className="absolute z-10 w-full mt-1 shadow-lg max-h-64 overflow-hidden">
                <CardContent className="p-0">
                  <Command>
                    <CommandList>
                      <CommandEmpty>No results found.</CommandEmpty>
                      <CommandGroup>
                        <ScrollArea className="h-64">
                          {filteredJobs.map((job, index) => (
                            <CommandItem
                              key={index}
                              className="p-0 cursor-pointer"
                              onSelect={() => {
                                handleJobClick(job);
                                setShowSearchResults(false);
                              }}
                            >
                              <div className="w-full p-2">
                                <div className="flex justify-between items-center mb-1">
                                  <h4 className="font-medium text-sm">
                                    {job.title}
                                  </h4>
                                  <Badge variant="outline" className="text-xs">
                                    {job.source}
                                  </Badge>
                                </div>
                                <div className="flex items-center text-xs text-muted-foreground">
                                  {job.company}
                                  <span className="mx-1">•</span>
                                  {job.location}
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </ScrollArea>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Desktop: Main Content with Grid Layout */}
          <div className="hidden md:grid md:grid-cols-3 md:gap-4 md:flex-1 md:w-full md:overflow-hidden">
            {/* Recent Jobs Column */}
            <Card className="flex flex-col h-full md:overflow-hidden bg-muted/20 md:col-span-2">
              <CardHeader className="py-4 px-3">
                <CardTitle className="flex items-center justify-between">
                  <span>Last 24 Hours</span>
                  <Badge variant="outline">{recentJobs.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 pl-2 pr-0 pb-0 md:overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="flex flex-col gap-3 pr-4 pb-2">
                    {recentJobs.length > 0 ? (
                      recentJobs.map((job, index) => (
                        <JobCard
                          key={index}
                          job={job}
                          onClick={() => handleJobClick(job)}
                        />
                      ))
                    ) : (
                      <div className="flex items-center justify-center h-32 bg-muted/50 rounded-lg">
                        <p className="text-muted-foreground">
                          No new jobs in the last 24 hours
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* All Jobs Column */}
            <Card className="flex flex-col h-full md:overflow-hidden bg-muted/20">
              <CardHeader className="py-4 px-3">
                <CardTitle className="flex items-center justify-between">
                  <span>All Jobs</span>
                  <Badge variant="outline">{jobs.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 pl-2 pr-0 pb-0 md:overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="flex flex-col gap-3 pr-4 pb-2">
                    {jobs.length > 0 ? (
                      jobs.map((job, index) => (
                        <JobCard
                          key={index}
                          job={job}
                          compact
                          onClick={() => handleJobClick(job)}
                        />
                      ))
                    ) : (
                      <div className="flex items-center justify-center h-32 bg-muted/50 rounded-lg">
                        <p className="text-muted-foreground">No jobs found</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Mobile: Tabbed Layout for job lists */}
          <div className="flex-1 md:hidden flex flex-col overflow-auto">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col"
            >
              <TabsList className="w-full h-auto grid grid-cols-2 mb-2">
                <TabsTrigger value="recent" className="text-sm py-1">
                  Last 24 Hours ({recentJobs.length})
                </TabsTrigger>
                <TabsTrigger value="all" className="text-sm py-1">
                  All Jobs ({jobs.length})
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-auto">
                <TabsContent
                  value="recent"
                  className="mt-0 h-full overflow-auto"
                >
                  <Card className="flex flex-col h-full bg-muted/20 border-0">
                    <CardContent className="p-2 pb-16 flex-1 overflow-auto">
                      {recentJobs.length > 0 ? (
                        <div className="flex flex-col gap-3">
                          {recentJobs.map((job, index) => (
                            <JobCard
                              key={index}
                              job={job}
                              onClick={() => handleJobClick(job)}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-32 bg-muted/50 rounded-lg">
                          <p className="text-muted-foreground">
                            No new jobs in the last 24 hours
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="all" className="mt-0 h-full overflow-auto">
                  <Card className="flex flex-col h-full bg-muted/20 border-0">
                    <CardContent className="p-2 pb-16 flex-1 overflow-auto">
                      {jobs.length > 0 ? (
                        <div className="flex flex-col gap-3">
                          {jobs.map((job, index) => (
                            <JobCard
                              key={index}
                              job={job}
                              compact
                              onClick={() => handleJobClick(job)}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-32 bg-muted/50 rounded-lg">
                          <p className="text-muted-foreground">No jobs found</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Application Status Dialog */}
          <AlertDialog
            open={showApplyDialog}
            onOpenChange={(open) => {
              console.log("Dialog open state changed:", open);
              setShowApplyDialog(open);
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Did you apply for this job?</AlertDialogTitle>
                <AlertDialogDescription>
                  {selectedJob?.title} at{" "}
                  {selectedJob?.company || "Company Not Specified"}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex justify-center gap-6 py-4">
                <Button
                  onClick={() => handleMarkApplied(true)}
                  className="flex items-center gap-2"
                  variant="default"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  Yes, I applied
                </Button>
                <Button
                  onClick={() => handleMarkApplied(false)}
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  <XCircle className="h-5 w-5" />
                  Not yet
                </Button>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}