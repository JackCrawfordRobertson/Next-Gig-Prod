"use client";

import { useEffect, useState, useRef } from "react";
import { db, collection, getDocs, doc, updateDoc } from "@/lib/firebase";
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
  List
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

// Helper function to format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export default function WorkablePage() {
  const { data: session, status } = useSession();
  const [jobs, setJobs] = useState([]);
  const [jobStats, setJobStats] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const isDev = process.env.NODE_ENV === "development";
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const lastClickTimeRef = useRef(null);
  const selectedJobRef = useRef(null);
  const [activeTab, setActiveTab] = useState("jobs");

  // Handle visibility change (user returns from external link)
  const handleVisibilityChange = () => {
    console.log('Visibility changed:', document.visibilityState);
    console.log('Last click time:', lastClickTimeRef.current);
    console.log('Selected job:', selectedJobRef.current);
    
    if (document.visibilityState === 'visible' && lastClickTimeRef.current) {
      const timeAway = Date.now() - lastClickTimeRef.current;
      console.log('Time away (ms):', timeAway);
      
      // If they spent enough time on the job page (15+ seconds), probably viewed it in detail
      if (timeAway > 5000 && selectedJobRef.current) { // Using 5 seconds for testing
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
        console.log('Fetching jobs');
        let jobsData = [];
        
        if (isDev) {
          // In development, fetch from our mock API
          const response = await fetch('/api/user');
          if (!response.ok) throw new Error('Failed to fetch user data');
          const userData = await response.json();
          
          // Extract Workable jobs from mock user data
          jobsData = userData.workable || [];
          console.log('Fetched jobs from mock API:', jobsData.length);
        } else {
          // In production, use Firestore directly
          const querySnapshot = await getDocs(collection(db, "jobs_workable"));
          jobsData = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            has_applied: doc.data().has_applied ?? false,
          }));
          console.log('Fetched jobs from Firestore:', jobsData.length);
        }

        setJobs(jobsData);

        // Aggregate jobs by weekday
        const jobCountByWeekday = {
          Monday: 0,
          Tuesday: 0,
          Wednesday: 0,
          Thursday: 0,
          Friday: 0,
          Saturday: 0,
          Sunday: 0,
        };

        jobsData.forEach((job) => {
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
        console.error("Error fetching Workable jobs:", error);
      } finally {
        setLoading(false);
      }
    }

    if (status !== "loading") {
      fetchJobs();
    }
  }, [currentWeek, status, isDev]);

  // Handle job card click to open URL
  const handleJobClick = (job) => {
    console.log('Job clicked:', job.title);
    
    if (job.url) {
      console.log('Opening URL:', job.url);
      selectedJobRef.current = job;
      lastClickTimeRef.current = Date.now();
      console.log('Set lastClickTime:', lastClickTimeRef.current);
      window.open(job.url, "_blank");
    } else {
      console.log('No URL found for job');
    }
  };

  // Handle marking job as applied
  const handleMarkApplied = async (applied) => {
    if (!selectedJob) {
      console.log('No selected job to mark as applied');
      return;
    }
    
    console.log('Marking job as applied:', selectedJob.title, applied);
    
    try {
      // Update the local state
      const updatedJobs = jobs.map(job => 
        job.id === selectedJob.id ? { ...job, has_applied: applied } : job
      );
      setJobs(updatedJobs);
      console.log('Updated local state');
      
      // Update Firestore if in production
      if (!isDev && selectedJob.id) {
        console.log('Updating Firestore document:', selectedJob.id);
        await updateDoc(doc(db, "jobs_workable", selectedJob.id), {
          has_applied: applied
        });
        console.log('Firestore updated successfully');
      } else {
        console.log('Not updating Firestore (dev mode or no job ID)');
      }
    } catch (error) {
      console.error("Error updating application status:", error);
    } finally {
      setShowApplyDialog(false);
      setSelectedJob(null);
      console.log('Dialog closed and selected job cleared');
    }
  };

  // Navigation Functions for Weekly View
  const goToPreviousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const goToNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // Desktop layout (unchanged)
  const DesktopLayout = () => (
    <div className="hidden md:flex h-full w-full flex-row gap-6">
      {/* Left: Workable Jobs Column */}
      <div className="w-1/3 h-full">
        <JobColumn 
          title="Workable Jobs" 
          jobs={jobs} 
          onJobClick={handleJobClick}
        />
      </div>

      {/* Right: Job Postings Chart */}
      <div className="w-2/3 h-full">
        <Card className="h-full flex flex-col">
          <CardHeader className="py-3 px-4 flex flex-row justify-between items-center">
            <div>
              <CardTitle>Workable Job Listings Per Day</CardTitle>
              <p className="text-muted-foreground text-sm">
                {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), "MMM d")} -{" "}
                {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), "MMM d")}
              </p>
            </div>

            {/* Navigation Arrows */}
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
            <div className="absolute inset-0 p-4">
              <ChartContainer config={chartConfig} className="h-full">
                <ResponsiveContainer width="100%" height="100%" aspect={undefined}>
                  <BarChart 
                    data={jobStats}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="day" tickLine={false} tickMargin={10} axisLine={false} />
                    <YAxis stroke="hsl(var(--foreground))" />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
                    <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Mobile layout (optimised with tabs)
  const MobileLayout = () => (
    <div className="md:hidden h-full w-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
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
        
        <TabsContent value="jobs" className="flex-1 m-0 h-[calc(100vh-120px)]">
          <Card className="h-full border-0 shadow-none">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-lg">Workable Jobs</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-2 h-[calc(100vh-170px)]">
              <ScrollArea className="h-full pb-8">
                <div className="flex flex-col gap-3 px-3 pb-16">
                  {jobs.length > 0 ? (
                    jobs.map((job, index) => (
                      <MobileJobCard 
                        key={index} 
                        job={job} 
                        onClick={() => handleJobClick(job)}
                      />
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-32 bg-muted/50 rounded-lg">
                      <p className="text-muted-foreground">No jobs available</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stats" className="h-[calc(100vh-120px)] m-0">
          <Card className="h-full flex flex-col border-0 shadow-none">
            <CardHeader className="py-2 px-3 flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-lg">Workable Job Listings</CardTitle>
                <p className="text-muted-foreground text-xs">
                  {format(startOfWeek(currentWeek, {weekStartsOn: 1}), "MMM d")} -{" "}
                  {format(endOfWeek(currentWeek, {weekStartsOn: 1}), "MMM d")}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={goToPreviousWeek}
                  className="p-1.5 rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={goToNextWeek}
                  className="p-1.5 rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 relative p-0">
              <div className="absolute inset-0 p-2">
                <ChartContainer config={chartConfig} className="h-full">
                  <ResponsiveContainer width="100%" height="100%" aspect={undefined}>
                    <BarChart data={jobStats} margin={{top: 15, right: 20, left: 0, bottom: 5}}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="day" tickLine={false} tickMargin={10} axisLine={false} tick={{fontSize: 10}} />
                      <YAxis stroke="hsl(var(--foreground))" tick={{fontSize: 10}} />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dashed" />}
                      />
                      <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <div className="h-screen w-full p-2 sm:p-4 md:p-8 overflow-hidden">
      {/* Render desktop or mobile layout based on screen size */}
      <DesktopLayout />
      <MobileLayout />

      {/* Application Status Dialog (shared between layouts) */}
      <AlertDialog open={showApplyDialog} onOpenChange={(open) => {
        console.log('Dialog open state changed:', open);
        setShowApplyDialog(open);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Did you apply for this job?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedJob?.title} at {selectedJob?.company || "Company Not Specified"}
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
  );
}

// Reusable Job Column Component (desktop)
function JobColumn({ title, jobs, onJobClick }) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-2 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-3 pr-4">
            {jobs.length > 0 ? (
              jobs.map((job, index) => (
                <Card 
                  key={index} 
                  className="hover:shadow-md transition-shadow bg-white cursor-pointer"
                  onClick={() => onJobClick(job)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-medium w-[70%]">{job.title}</h3>
                      <Badge variant="outline">Workable</Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 mb-3">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Building className="h-4 w-4 mr-1" /> {job.company || "Not specified"}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1" /> {job.location || "Not specified"}
                      </div>
                      {job.date_added && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" /> {formatDate(job.date_added)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/40">
                      <div className={`flex items-center text-sm ${job.has_applied ? "text-green-500" : "text-red-500"}`}>
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
              <div className="flex items-center justify-center h-32 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">No jobs available</p>
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
      className="hover:shadow-sm active:shadow-inner transition-shadow bg-white cursor-pointer touch-manipulation"
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-sm leading-tight w-[75%]">{job.title}</h3>
          <Badge variant="outline" className="text-xs py-0 h-5">Workable</Badge>
        </div>
        
        <div className="grid grid-cols-1 gap-1.5 mb-2">
          <div className="flex items-center text-xs text-muted-foreground">
            <Building className="h-3 w-3 mr-1 flex-shrink-0" /> 
            <span className="truncate">{job.company || "Not specified"}</span>
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" /> 
            <span className="truncate">{job.location || "Not specified"}</span>
          </div>
          {job.date_added && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1 flex-shrink-0" /> {formatDate(job.date_added)}
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center pt-1.5 border-t border-border/40">
          <div className={`flex items-center text-xs ${job.has_applied ? "text-green-500" : "text-red-500"}`}>
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
    color: "hsl(var(--chart-2))",
  },
};
