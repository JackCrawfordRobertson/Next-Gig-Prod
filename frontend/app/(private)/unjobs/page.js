"use client";

import { useEffect, useState, useRef } from "react";
import { db, collection, getDocs, doc, updateDoc } from "@/lib/data/firebase";
import { updateJobAppliedStatus } from "@/lib/utils/updateJobApplied";
import { openJobLink } from "@/lib/utils/openJobLink";

import { useSession } from "next-auth/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  ChevronLeft,
  ChevronRight,
  Building,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
  List,
  DollarSign,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { startOfWeek, endOfWeek, format, subWeeks, addWeeks } from "date-fns";
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isDevelopmentMode } from "@/lib/utils/environment";


// Helper function to format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export default function UNJobsPage() {
  const { data: session, status } = useSession();
  const [jobs, setJobs] = useState([]);
  const [jobStats, setJobStats] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const isDev = isDevelopmentMode();
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const lastClickTimeRef = useRef(null);
  const selectedJobRef = useRef(null);
  const [activeTab, setActiveTab] = useState("jobs");
  const [appliedFilter, setAppliedFilter] = useState("all");

  // Handle visibility change (user returns from external link)
  const handleVisibilityChange = () => {
    console.log('Visibility changed:', document.visibilityState);
    console.log('Last click time:', lastClickTimeRef.current);
    console.log('Selected job:', selectedJobRef.current);
    
    if (document.visibilityState === 'visible' && lastClickTimeRef.current) {
      const timeAway = Date.now() - lastClickTimeRef.current;
      console.log('Time away (ms):', timeAway);
      
      // If they spent enough time on the job page (5+ seconds), probably viewed it in detail
      if (timeAway > 5000 && selectedJobRef.current) {
        console.log('Showing apply dialog');
        setSelectedJob(selectedJobRef.current);
        setShowApplyDialog(true);
      } else {
        console.log('Not showing dialog - time threshold not met or no job selected');
      }
      
      lastClickTimeRef.current = null;
    }
  };

  useEffect(() => {
    console.log('Setting up visibility change listener');
    // Monitor visibility changes to detect when user returns from a job link
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      console.log('Cleaning up visibility change listener');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    async function fetchJobs() {
      try {
        console.log('Fetching UN jobs');
        let jobsData = [];
        
        if (isDev) {
          // In development, fetch from our mock API
          const response = await fetch('/api/user');
          if (!response.ok) throw new Error('Failed to fetch user data');
          const userData = await response.json();
          
          // Extract UN jobs from mock user data
          jobsData = userData.unjobs || [];
          console.log('Fetched jobs from mock API:', jobsData.length);
        } else {
          // In production, use the new utility functions
          const userEmail = session?.user?.email;
    
          if (userEmail) {
            const { getUserByEmail, getUserJobs } = await import("@/lib/data/jobDataUtils");
            const user = await getUserByEmail(userEmail);

            if (user) {
              // Get only UN jobs
              jobsData = await getUserJobs(user.id, { source: "unjobs" });
              console.log(`Found ${jobsData.length} UN jobs`);
            }
          }
        }
    
        setJobs(jobsData);

        // Filter jobs by current week
        const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

        const jobsInCurrentWeek = jobsData.filter((job) => {
          if (!job.date_added) return false;
          const jobDate = new Date(job.date_added);
          return jobDate >= weekStart && jobDate <= weekEnd;
        });

        // Process job statistics for current week only
        const jobCountByWeekday = {
          Monday: 0,
          Tuesday: 0,
          Wednesday: 0,
          Thursday: 0,
          Friday: 0,
          Saturday: 0,
          Sunday: 0,
        };

        jobsInCurrentWeek.forEach((job) => {
          if (job.date_added) {
            const jobDate = new Date(job.date_added);
            const weekday = format(jobDate, "EEEE");
            if (jobCountByWeekday[weekday] !== undefined) {
              jobCountByWeekday[weekday]++;
            }
          }
        });

        // Convert into chart format
        const chartData = Object.keys(jobCountByWeekday).map((day) => ({
          day,
          count: jobCountByWeekday[day],
        }));

        setJobStats(chartData);
      } catch (error) {
        console.error("Error fetching UN jobs:", error);
      } finally {
        setLoading(false);
      }
    }

    if (status !== "loading") {
      fetchJobs();
    }
  }, [currentWeek, status, isDev, session]);
  
  // Handle job card click to open URL
  const handleJobClick = (job) => {
    console.log('Job clicked:', job.title);

    if (job.url) {
      console.log('Opening URL:', job.url);

      openJobLink(job.url, {
        onBeforeOpen: () => {
          selectedJobRef.current = job;
          lastClickTimeRef.current = Date.now();
          console.log('Set lastClickTime:', lastClickTimeRef.current);
        }
      });
    } else {
      console.log('No URL found for job');
    }
  };

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
  

  // Filter jobs based on applied status
  const getFilteredJobs = () => {
    return jobs.filter((job) => {
      if (appliedFilter === "all") return true;
      if (appliedFilter === "applied") return job.has_applied;
      if (appliedFilter === "not-applied") return !job.has_applied;
      return true;
    });
  };

  // Navigation Functions for Weekly View
  const goToPreviousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const goToNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));

  if (loading) {
    return <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2">
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
        </div>
        <p className="text-muted-foreground animate-pulse">Loading your jobs...</p>
      </div>
    </div>;
  }

  function FixedSizeChart({ data, height = 200, width = 350 }) {
    return (
      <div style={{ 
        width: '100%', 
        height: `${height}px`, 
        position: 'relative',
        minHeight: `${height}px` // Enforce minimum height
      }}>
        <ChartContainer config={chartConfig}>
          <BarChart
            width={typeof width === "number" ? width : parseInt(width, 10) || 350}
            height={height}
            data={data}
            margin={{ top: 10, right: 10, left: -5, bottom: 5 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.4} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 9 }}
              tickFormatter={(day) => day.substring(0, 3)}
            />
            <YAxis stroke="hsl(var(--foreground))" tick={{ fontSize: 9 }} width={25} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar dataKey="count" fill="hsl(var(--chart-4))" radius={3} />
          </BarChart>
        </ChartContainer>
      </div>
    );
  }

  // Desktop layout with added stats widgets
  const DesktopLayout = () => {
    const filteredJobs = getFilteredJobs();
    return (
    <div className="hidden md:flex h-full w-full flex-row gap-6">
      <div className="w-1/3 h-full">
        <Card className="h-full flex flex-col">
          <CardHeader className="py-2 px-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">UN Jobs</CardTitle>
              <div className="flex gap-1 bg-muted rounded-md p-1">
                <button
                  onClick={() => setAppliedFilter("all")}
                  className={`px-2 py-1 rounded text-xs transition ${
                    appliedFilter === "all"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setAppliedFilter("applied")}
                  className={`px-2 py-1 rounded text-xs transition ${
                    appliedFilter === "applied"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Applied
                </button>
                <button
                  onClick={() => setAppliedFilter("not-applied")}
                  className={`px-2 py-1 rounded text-xs transition ${
                    appliedFilter === "not-applied"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Not Applied
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 pl-2 pr-0 pb-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="flex flex-col gap-3 pr-4 pb-2">
                {filteredJobs.length > 0 ? (
                  filteredJobs.map((job, index) => (
                    <Card
                      key={index}
                      className="hover:shadow-md transition-shadow bg-card cursor-pointer"
                      onClick={() => handleJobClick(job)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-medium w-[70%]">{job.title}</h3>
                          <Badge variant="outline">UN Jobs</Badge>
                        </div>

                        <div className="grid grid-cols-1 gap-2 mb-3">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Building className="h-4 w-4 mr-1" />{" "}
                            {job.company || "United Nations"}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 mr-1" />{" "}
                            {job.location || "Not specified"}
                          </div>
                          {job.date_added && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="h-4 w-4 mr-1" />{" "}
                              {formatDate(job.date_added)}
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/40">
                          <div
                            className={`flex items-center text-sm ${
                              job.has_applied ? "text-green-500" : "text-red-500"
                            }`}
                          >
                            {job.has_applied ? (
                              <span className="flex items-center">
                                <CheckCircle2 className="h-4 w-4 mr-1" /> Applied
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <XCircle className="h-4 w-4 mr-1" /> Not Applied
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-primary hover:underline">
                            Click to view details
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-auto min-h-40 bg-muted/50 rounded-lg p-6">
                    <div className="text-center max-w-sm">
                      <h3 className="font-semibold text-base mb-3">
                        No jobs available yet
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        As a new account holder, your first jobs will be added
                        within 8 hours of account creation.
                      </p>
                      <div className="mt-4 pt-3 border-t border-border">
                        <p className="text-sm text-muted-foreground italic">
                          If you don't see any jobs within 24 hours, consider widening your job queries and/or location search.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="w-2/3 h-full flex flex-col gap-6">
        {/* Top row stats cards */}
        <div className="grid grid-cols-2 gap-6 h-28">
          <Card className="flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Building className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Jobs</p>
                <p className="text-3xl font-semibold">{jobs.length}</p>
              </div>
            </div>
          </Card>

          <Card className="flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Applied</p>
                <p className="text-3xl font-semibold">{jobs.filter(job => job.has_applied).length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Application rate card */}
        <Card className="flex-shrink-0 h-24">
          <CardHeader className="py-3 px-6">
            <CardTitle className="text-base">Application Progress</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pt-0 pb-3">
            {jobs.length > 0 ? (
              <>
                <div className="w-full h-3 bg-muted rounded-full mb-2">
                  <div
                    className="h-3 bg-chart-4 rounded-full"
                    style={{
                      width: `${
                        (jobs.filter((job) => job.has_applied).length /
                          jobs.length) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>
                    {Math.round(
                      (jobs.filter((job) => job.has_applied).length /
                        jobs.length) *
                        100
                    )}
                    % applied
                  </span>
                  <span>
                    {jobs.length -
                      jobs.filter((job) => job.has_applied).length}{" "}
                    remaining
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                No job application data yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Main chart */}
        <Card className="flex-1 flex flex-col">
          <CardHeader className="py-3 px-6 flex flex-row justify-between items-center">
            <div>
              <CardTitle>UN Job Listings Per Day</CardTitle>
              <p className="text-muted-foreground text-sm">
                {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), "MMM d")}{" "}
                - {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), "MMM d")}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={goToPreviousWeek}
                className="p-2 rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goToNextWeek}
                className="p-2 rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 relative p-0">
            <div className="absolute inset-0 p-2">
              <ChartContainer config={chartConfig} className="h-full">
                <ResponsiveContainer width="100%" height="100%" aspect={undefined}>
                  <BarChart data={jobStats} margin={{top: 15, right: 20, left: 0, bottom: 5}}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="day" 
                      tickLine={false} 
                      tickMargin={10} 
                      axisLine={false} 
                      tick={{fontSize: 10}} 
                    />
                    <YAxis stroke="hsl(var(--foreground))" tick={{fontSize: 10}} />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dashed" />}
                    />
                    <Bar dataKey="count" fill="hsl(var(--chart-4))" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
  };

  // Mobile layout (optimised with tabs)
  const MobileLayout = () => (
<div className="md:hidden max-h-[calc(100vh-100px)] w-full flex flex-col flex-grow">
<Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="h-full flex flex-col"
      >
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            <span>Jobs ({jobs.length})</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Stats</span>
          </TabsTrigger>
        </TabsList>
  
        <TabsContent value="jobs" className="flex-1">
          <Card className="h-full border-0 shadow-none">
            <CardHeader className="py-2 px-3">
              <div className="flex justify-between items-center mb-2">
                <CardTitle className="text-lg">UN Jobs</CardTitle>
              </div>
              <div className="flex gap-1 bg-muted rounded-md p-1">
                <button
                  onClick={() => setAppliedFilter("all")}
                  className={`px-2 py-1 rounded text-xs transition ${
                    appliedFilter === "all"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setAppliedFilter("applied")}
                  className={`px-2 py-1 rounded text-xs transition ${
                    appliedFilter === "applied"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Applied
                </button>
                <button
                  onClick={() => setAppliedFilter("not-applied")}
                  className={`px-2 py-1 rounded text-xs transition ${
                    appliedFilter === "not-applied"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Not Applied
                </button>
              </div>
            </CardHeader>
            <CardContent className="flex-1  p-0 pt-2">
              <ScrollArea className="h-full pb-8">
                <div className="flex flex-col gap-3 px-3 pb-16">
                  {getFilteredJobs().length > 0 ? (
                    getFilteredJobs().map((job, index) => (
                      <MobileJobCard
                        key={index}
                        job={job}
                        onClick={() => handleJobClick(job)}
                      />
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-auto min-h-40 bg-muted/50 rounded-lg p-6">
                      <div className="text-center max-w-sm">
                        <h3 className="font-semibold text-base mb-3">
                          No jobs available yet
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          As a new account holder, your first jobs will be added
                          within 8 hours of account creation.
                        </p>
                        <div className="mt-4 pt-3 border-t border-border">
                          <p className="text-sm text-muted-foreground italic">
                            If you don't see any jobs within 24 hours, consider widening your job queries and/or location search.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
  
        <TabsContent value="stats" className="h-[calc(100vh-120px)] m-0">
          <div className="grid grid-cols-1 gap-4">
            {/* Job Activity Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-card shadow-sm">
                <CardContent className="p-3 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-1">
                    <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-2xl font-semibold">{jobs.length}</p>
                  <p className="text-xs text-muted-foreground text-center">
                    Total Jobs
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card shadow-sm">
                <CardContent className="p-3 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-1">
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-2xl font-semibold">
                    {jobs.filter((job) => job.has_applied).length}
                  </p>
                  <p className="text-xs text-muted-foreground text-center">
                    Applied
                  </p>
                </CardContent>
              </Card>
            </div>
  
            {/* Weekly Chart */}
            <Card className="flex flex-col shadow-sm">
              <CardHeader className="py-2 px-3 flex flex-row justify-between items-center">
                <div>
                  <CardTitle className="text-sm">
                    Job Listings This Week
                  </CardTitle>
                  <p className="text-muted-foreground text-xs">
                    {format(
                      startOfWeek(currentWeek, { weekStartsOn: 1 }),
                      "MMM d"
                    )}{" "}
                    -{" "}
                    {format(
                      endOfWeek(currentWeek, { weekStartsOn: 1 }),
                      "MMM d"
                    )}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={goToPreviousWeek}
                    className="p-1.5 rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={goToNextWeek}
                    className="p-1.5 rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </CardHeader>

              <CardContent className="p-3 overflow-x-auto">
                <div className="w-full" style={{ height: '180px', minWidth: '350px' }}>
                  <BarChart
                    width={350}
                    height={180}
                    data={jobStats}
                    margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#009EDB" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#009EDB" stopOpacity={0.5}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      vertical={false} 
                      strokeDasharray="3 3" 
                      opacity={0.4} 
                      stroke="hsl(var(--border))" 
                    />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(day) => day.substring(0, 3)}
                    />
                    <YAxis 
                      width={25}
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} 
                      stroke="hsl(var(--border))"
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                      contentStyle={{
                        background: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        padding: '8px 12px',
                        fontSize: '12px'
                      }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                      formatter={(value) => [`${value} jobs`, 'Added']}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="url(#colorBar)"
                      radius={[4, 4, 0, 0]} 
                      barSize={30}
                      animationDuration={750}
                    />
                  </BarChart>
                </div>
              </CardContent>
            </Card>
  
            {/* Application Rate */}
            <Card className="shadow-sm">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm">Application Rate</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 pt-0">
                {jobs.length > 0 ? (
                  <>
                    <div className="w-full h-3 bg-muted rounded-full mb-2">
                      <div
                        className="h-3 bg-primary rounded-full"
                        style={{
                          width: `${
                            (jobs.filter((job) => job.has_applied).length /
                              jobs.length) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>
                        {Math.round(
                          (jobs.filter((job) => job.has_applied).length /
                            jobs.length) *
                            100
                        )}
                        % applied
                      </span>
                      <span>
                        {jobs.length -
                          jobs.filter((job) => job.has_applied).length}{" "}
                        remaining
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No job application data yet
                  </p>
                )}
              </CardContent>
            </Card>
  
            {/* Recent Activity */}
            <Card className="shadow-sm">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-3 pt-0">
                <div className="max-h-32 overflow-auto">
                  {jobs.length > 0 ? (
                    <div className="space-y-1">
                      {jobs.slice(0, 3).map((job, index) => (
                        <div
                          key={index}
                          className="px-3 py-1.5 hover:bg-muted/50"
                        >
                          <div className="flex justify-between items-start">
                            <div className="text-xs font-medium truncate w-3/4">
                              {job.title}
                            </div>
                            <Badge
                              variant="outline"
                              className="text-[10px] py-0 h-4"
                            >
                              {job.has_applied ? "Applied" : "New"}
                            </Badge>
                          </div>
                          <div className="flex items-center text-[10px] text-muted-foreground">
                            <Building className="h-2.5 w-2.5 mr-1 flex-shrink-0" />
                            <span className="truncate">
                              {job.company || "United Nations"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No recent activity
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <div className="h-screen w-full p-4 sm:p-4 md:p-8">
      {/* Render desktop or mobile layout based on screen size */}
      <DesktopLayout />
      <MobileLayout />

      {/* Application Status Dialog (shared between layouts) */}
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
              {selectedJob?.company || "United Nations"}
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
          <AlertDialogFooter className="sm:justify-start">
          <AlertDialogCancel
                onClick={() => {
                  console.log("Ask me later clicked");
                  setShowApplyDialog(false);
                }}
              >
                Ask me later
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
}

// Reusable Job Column Component (desktop)
function JobColumn({ title, jobs, onJobClick }) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pl-2 pr-0 pb-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-3 pr-4 pb-2">
            {jobs.length > 0 ? (
              jobs.map((job, index) => (
                <Card
                  key={index}
                  className="hover:shadow-md transition-shadow bg-card cursor-pointer"
                  onClick={() => onJobClick(job)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-medium w-[70%]">{job.title}</h3>
                      <Badge variant="outline">UN Jobs</Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-2 mb-3">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Building className="h-4 w-4 mr-1" />{" "}
                        {job.company || "United Nations"}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1" />{" "}
                        {job.location || "Not specified"}
                      </div>
                      {job.date_added && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />{" "}
                          {formatDate(job.date_added)}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/40">
                      <div
                        className={`flex items-center text-sm ${
                          job.has_applied ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {job.has_applied ? (
                          <span className="flex items-center">
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Applied
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <XCircle className="h-4 w-4 mr-1" /> Not Applied
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-primary hover:underline">
                        Click to view details
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="flex items-center justify-center h-auto min-h-40 bg-muted/50 rounded-lg p-6">
                <div className="text-center max-w-sm">
                  <h3 className="font-semibold text-base mb-3">
                    No jobs available yet
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    As a new account holder, your first jobs will be added
                    within 8 hours of account creation.
                  </p>
                  <div className="mt-4 pt-3 border-t border-border">
                    <p className="text-sm text-muted-foreground italic">
                      If you don't see any jobs within 24 hours, consider widening your job queries and/or location search.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Mobile optimised job card
function MobileJobCard({ job, onClick }) {
  return (
    <Card
      className="hover:shadow-sm active:shadow-inner transition-shadow bg-card cursor-pointer touch-manipulation"
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-sm leading-tight w-[75%]">
            {job.title}
          </h3>
          <Badge variant="outline" className="text-xs py-0 h-5">
            UN Jobs
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-1.5 mb-2">
          <div className="flex items-center text-xs text-muted-foreground">
            <Building className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">{job.company || "United Nations"}</span>
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">{job.location || "Not specified"}</span>
          </div>
          {job.date_added && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1 flex-shrink-0" />{" "}
              {formatDate(job.date_added)}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-1.5 border-t border-border/40">
          <div
            className={`flex items-center text-xs ${
              job.has_applied ? "text-green-500" : "text-red-500"
            }`}
          >
            {job.has_applied ? (
              <span className="flex items-center">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Applied
              </span>
            ) : (
              <span className="flex items-center">
                <XCircle className="h-3 w-3 mr-1" /> Not Applied
              </span>
            )}
          </div>
          <div className="text-xs text-primary">View</div>
        </div>
      </CardContent>
    </Card>
  );
}

// Chart Configuration for ShadCN
const chartConfig = {
  count: {
    label: "Jobs Added",
    color: "hsl(var(--chart-4))",
  },
};