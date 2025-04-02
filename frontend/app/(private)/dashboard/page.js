"use client";

import { useEffect, useState, useRef } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useSession } from "next-auth/react";

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
  AlertDialogFooter,
  AlertDialogCancel,
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
import {
  Briefcase,
  Building,
  Palette,
  Globe,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  PoundSterling,
  Search,
} from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const isDev = process.env.NODE_ENV === "development";
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const lastClickTimeRef = useRef(null);
  const selectedJobRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("recent");

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

  useEffect(() => {
    console.log("Setting up visibility change listener");
    // Monitor visibility changes to detect when user returns from a job link
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      console.log("Cleaning up visibility change listener");
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    async function fetchUserData() {
      try {
        if (status === "loading") return;

        console.log("User session:", session?.user?.email);
        console.log("Environment:", process.env.NODE_ENV);
        console.log("Firebase config:", {
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        });

        if (isDev) {
          // In development, fetch from our mock API
          const response = await fetch("/api/user");
          if (!response.ok) throw new Error("Failed to fetch user data");
          const userData = await response.json();
          setUserData(userData);

          // Extract and flatten job data
          const allJobs = [
            ...(userData.linkedin || []).map((job) => ({
              ...job,
              source: "LinkedIn",
              id: `linkedin-${
                job.id || Math.random().toString(36).substring(2, 9)
              }`,
            })),
            ...(userData.ifyoucould || []).map((job) => ({
              ...job,
              source: "If You Could",
              id: `ifyoucould-${
                job.id || Math.random().toString(36).substring(2, 9)
              }`,
            })),
            ...(userData.unjobs || []).map((job) => ({
              ...job,
              source: "UN Jobs",
              id: `unjobs-${
                job.id || Math.random().toString(36).substring(2, 9)
              }`,
            })),
            ...(userData.workable
              ? [
                  {
                    ...userData.workable,
                    source: "Workable",
                    id: `workable-${
                      userData.workable.id ||
                      Math.random().toString(36).substring(2, 9)
                    }`,
                  },
                ]
              : []),
          ];

          setJobs(allJobs);
        } else {
          // In production, use Firestore directly
          console.log("Fetching jobs from Firestore");
          const userEmail = session?.user?.email;

          if (userEmail) {
            console.log(`Fetching user data for: ${userEmail}`);

            // Get the user document using their email - simpler approach without query
            try {
              console.log("Fetching users collection");
              const usersSnapshot = await getDocs(collection(db, "users"));
              console.log(`Found ${usersSnapshot.docs.length} user documents`);

              const userDoc = usersSnapshot.docs.find(
                (doc) => doc.data().email === userEmail
              );

              if (!userDoc) {
                console.log("No user document found with this email");
                setJobs([]);
              } else {
                const userData = userDoc.data();
                console.log("User data found:", userData);

                // Check if jobs exist in the user document
                if (userData.jobs) {
                  console.log("Jobs found in user document:", userData.jobs);

                  // Extract and flatten job data
                  const allJobs = [
                    ...(userData.jobs.linkedin || []).map((job) => ({
                      ...job,
                      source: "LinkedIn",
                      id: `linkedin-${
                        job.id || Math.random().toString(36).substring(2, 9)
                      }`,
                    })),
                    ...(userData.jobs.ifyoucould || []).map((job) => ({
                      ...job,
                      source: "If You Could",
                      id: `ifyoucould-${
                        job.id || Math.random().toString(36).substring(2, 9)
                      }`,
                    })),
                    ...(userData.jobs.unjobs || []).map((job) => ({
                      ...job,
                      source: "UN Jobs",
                      id: `unjobs-${
                        job.id || Math.random().toString(36).substring(2, 9)
                      }`,
                    })),
                    ...(userData.jobs.workable || []).map((job) => ({
                      ...job,
                      source: "Workable",
                      id: `workable-${
                        job.id || Math.random().toString(36).substring(2, 9)
                      }`,
                    })),
                  ];

                  console.log(
                    `Total jobs extracted from user document: ${allJobs.length}`
                  );
                  setJobs(allJobs);
                } else {
                  console.log("No jobs field found in user document");
                  setJobs([]);
                }
              }
            } catch (error) {
              console.error("Error querying users:", error);

              // Fall back to the original approach
              console.log("Falling back to original collection approach");
              const jobSources = [
                "linkedin",
                "ifyoucould",
                "unjobs",
                "workable",
              ];
              let allJobs = [];

              for (const source of jobSources) {
                console.log(`Fetching ${source} jobs from Firestore`);
                const querySnapshot = await getDocs(collection(db, source));
                console.log(
                  `${source} query snapshot:`,
                  querySnapshot.docs.length,
                  "documents found"
                );

                const sourceJobs = querySnapshot.docs.map((doc) => ({
                  ...doc.data(),
                  id: `${source}-${doc.id}`,
                  source: source.charAt(0).toUpperCase() + source.slice(1),
                }));
                allJobs = [...allJobs, ...sourceJobs];
              }

              console.log(
                `Total jobs fetched from Firestore: ${allJobs.length}`
              );
              setJobs(allJobs);
            }
          } else {
            // Original code as fallback if no user email
            const jobSources = ["linkedin", "ifyoucould", "unjobs", "workable"];
            let allJobs = [];

            for (const source of jobSources) {
              console.log(`Fetching ${source} jobs from Firestore`);
              const querySnapshot = await getDocs(collection(db, source));
              console.log(
                `${source} query snapshot:`,
                querySnapshot.docs.length,
                "documents found"
              );

              // Log each document's data for debugging
              querySnapshot.docs.forEach((docSnap, index) => {
                const data = docSnap.data();
                console.log(`${source} job ${index + 1}:`, {
                  id: docSnap.id,
                  title: data.title,
                  company: data.company,
                  email: data.email,
                  firstName: data.firstName,
                  jobTitles: data.jobTitles,
                  jobLocations: data.jobLocations,
                  address: data.address
                    ? {
                        city: data.address.city,
                        firstLine: data.address.firstLine,
                        postcode: data.address.postcode,
                      }
                    : "No address data",
                });
              });

              const sourceJobs = querySnapshot.docs.map((doc) => ({
                ...doc.data(),
                id: `${source}-${doc.id}`,
                source: source.charAt(0).toUpperCase() + source.slice(1),
              }));
              allJobs = [...allJobs, ...sourceJobs];
            }

            console.log(`Total jobs fetched from Firestore: ${allJobs.length}`);
            setJobs(allJobs);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [status, isDev, session]);

  // Additional logging for jobs data
  useEffect(() => {
    if (jobs.length > 0) {
      console.log("First job sample:", jobs[0]);

      // Check specific fields existence across all jobs
      const fieldsCheck = jobs.map((job) => ({
        id: job.id,
        hasEmail: !!job.email,
        hasFirstName: !!job.firstName,
        hasJobTitles: Array.isArray(job.jobTitles) && job.jobTitles.length > 0,
        hasJobLocations:
          Array.isArray(job.jobLocations) && job.jobLocations.length > 0,
        hasAddress: !!job.address,
      }));

      console.log("Fields existence check:", fieldsCheck);

      // Log all emails and firstNames to verify accounts
      console.log("All emails:", jobs.map((job) => job.email).filter(Boolean));
      console.log(
        "All firstNames:",
        jobs.map((job) => job.firstName).filter(Boolean)
      );
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
        // Extract collection name and document ID from the combined ID
        const [collectionName, docId] = selectedJob.id.split("-");
        console.log("Updating Firestore document:", collectionName, docId);

        await updateDoc(doc(db, collectionName, docId), {
          has_applied: applied,
        });
        console.log("Firestore updated successfully");
      } else {
        console.log("Not updating Firestore (dev mode or no job ID)");
      }
    } catch (error) {
      console.error("Error updating application status:", error);
    } finally {
      setShowApplyDialog(false);
      setSelectedJob(null);
      console.log("Dialog closed and selected job cleared");
    }
  };

  const recentJobs = getRecentJobs();
  const filteredJobs = getFilteredJobs();

  // Count jobs by source
  const jobCounts = {
    linkedin: jobs.filter((job) => job.source === "LinkedIn").length,
    workable: jobs.filter((job) => job.source === "Workable").length,
    ifyoucould: jobs.filter((job) => job.source === "If You Could").length,
    unjobs: jobs.filter((job) => job.source === "UN Jobs").length,
  };

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
      ) : (
        <div className="flex flex-col h-full space-y-3 sm:space-y-4">
          {/* Stats Row - Scrollable on mobile, grid on desktop */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MiniStat title="LinkedIn" count={jobCounts.linkedin} />
            <MiniStat title="Workable" count={jobCounts.workable} />
            <MiniStat title="If You Could" count={jobCounts.ifyoucould} />
            <MiniStat title="UN Jobs" count={jobCounts.unjobs} />
          </div>

          {/* Search Bar with Dropdown */}
          <div className="relative">
            <div className="relative bg-white rounded-md h-[3rem]">
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
                                  <Building className="h-3 w-3 mr-1" />{" "}
                                  {job.company}
                                  <span className="mx-1">•</span>
                                  <MapPin className="h-3 w-3 mr-1" />{" "}
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

function MiniStat({ title, count }) {
  // Choose icon based on title
  const getIcon = (title) => {
    switch (title) {
      case "LinkedIn":
        return <Briefcase className="w-4 h-4 text-blue-600" />;
      case "Workable":
        return <Building className="w-4 h-4 text-purple-600" />;
      case "If You Could":
        return <Palette className="w-4 h-4 text-green-600" />;
      case "UN Jobs":
        return <Globe className="w-4 h-4 text-orange-600" />;
      default:
        return <Briefcase className="w-4 h-4 text-blue-600" />;
    }
  };

  // Choose background color based on title
  const getBgColor = (title) => {
    switch (title) {
      case "LinkedIn":
        return "bg-blue-100";
      case "Workable":
        return "bg-purple-100";
      case "If You Could":
        return "bg-green-100";
      case "UN Jobs":
        return "bg-orange-100";
      default:
        return "bg-blue-100";
    }
  };

  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="p-3 flex flex-col items-center justify-center">
        <div
          className={`w-8 h-8 rounded-full ${getBgColor(
            title
          )} flex items-center justify-center mb-1`}
        >
          {getIcon(title)}
        </div>
        <p className="text-2xl font-semibold">{count}</p>
        <p className="text-xs text-muted-foreground text-center">{title}</p>
      </CardContent>
    </Card>
  );
}

// Job Card Component
function JobCard({ job, compact = false, onClick }) {
  const {
    title = "Job Title",
    company = "Company Name",
    location = "Location",
    date = new Date().toISOString(),
    salary = "Competitive",
    source = "Source",
    url = "#",
    description = "Job description goes here...",
    has_applied = false,
  } = job;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  if (compact) {
    return (
      <Card
        className="hover:shadow-md transition-shadow bg-white cursor-pointer"
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-sm line-clamp-1">{title}</h3>
            <Badge variant="outline" className="text-xs">
              {source}
            </Badge>
          </div>
          <div className="flex items-center text-xs text-muted-foreground mb-2">
            <Building className="h-3 w-3 mr-1" /> {company}
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 mr-1" /> {location}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="hover:shadow-md transition-shadow bg-white cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-medium">{title}</h3>
          <Badge variant="outline">{source}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <Building className="h-4 w-4 mr-1" /> {company}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1" /> {location}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" /> {formatDate(date)}
          </div>
        </div>

        <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/40">
          <div className="flex items-center text-sm">
            <PoundSterling className="h-4 w-4 mr-1" /> {salary}
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center text-sm ${
                has_applied ? "text-green-500" : "text-red-500"
              }`}
            >
              {has_applied ? (
                <span className="flex items-center text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Applied
                </span>
              ) : (
                <span className="flex items-center text-xs">
                  <XCircle className="h-3 w-3 mr-1" /> Not Applied
                </span>
              )}
            </div>
            <div className="text-xs text-primary hover:underline ml-4">
              View details
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
