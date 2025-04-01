"use client";

import { useEffect, useState, useRef } from "react";
import { db, collection, getDocs, doc, updateDoc } from "@/lib/firebase";
import { updateJobAppliedStatus } from "@/lib/updateJobApplied";

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
        console.log('Fetching Workable jobs');
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
          console.log("Fetching jobs from Firestore");
          const userEmail = session?.user?.email;

          if (userEmail) {
            console.log(`Fetching user data for: ${userEmail}`);
            
            try {
              console.log("Fetching users collection");
              const usersSnapshot = await getDocs(collection(db, "users"));
              console.log(`Found ${usersSnapshot.docs.length} user documents`);
              
              const userDoc = usersSnapshot.docs.find(doc => doc.data().email === userEmail);
              
              if (!userDoc) {
                console.log("No user document found with this email");
                jobsData = [];
              } else {
                const userData = userDoc.data();
                console.log("User data found:", userData);
                
                // Check if jobs exist in the user document
                if (userData.jobs?.workable) {
                  console.log("Workable jobs found in user document");

                  jobsData = userData.jobs.workable.map((job) => ({
                    ...job,
                    id: `workable-${job.id || Math.random().toString(36).substring(2, 9)}`,
                    source: "workable",
                  }));
                } else {
                  console.log("No Workable jobs found in user document");
                  jobsData = [];
                }
              }
            } catch (error) {
              console.error("Error querying users:", error);
              
              // Fall back to the original approach
              console.log("Falling back to original collection approach");
              const querySnapshot = await getDocs(collection(db, "jobs_workable"));
              jobsData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                has_applied: doc.data().has_applied ?? false,
              }));
            }
          } else {
            // Fallback if no user email
            const querySnapshot = await getDocs(collection(db, "jobs_workable"));
            jobsData = querySnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              has_applied: doc.data().has_applied ?? false,
            }));
          }
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
  }, [currentWeek, status, isDev, session]);

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

  const handleMarkApplied = async (applied) => {
    if (!selectedJob || !session?.user?.email) return;
  
    console.log("Marking job as applied:", selectedJob.title, applied);
  
    try {
      // 1. Update local state
      const updatedJobs = jobs.map((job) =>
        job.id === selectedJob.id ? { ...job, has_applied: applied } : job
      );
      setJobs(updatedJobs);
  
      // 2. Firestore update
      if (!isDev && selectedJob?.source) {
        await updateJobAppliedStatus({
          email: session.user.email,
          jobId: selectedJob.id,
          applied,
          source: selectedJob.source,
        });
      }
    } catch (error) {
      console.error("Error updating application status:", error);
    } finally {
      setShowApplyDialog(false);
      setSelectedJob(null);
    }
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
            <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={3} />
          </BarChart>
        </ChartContainer>
      </div>
    );
  }

  // Desktop layout with added stats widgets
  const DesktopLayout = () => (
    <div className="hidden md:flex h-full w-full flex-row gap-6">
      <div className="w-1/3 h-full">
        <JobColumn
          title="Workable Jobs"
          jobs={jobs}
          onJobClick={handleJobClick}
        />
      </div>

      <div className="w-2/3 h-full flex flex-col gap-6">
        {/* Top row stats cards */}
        <div className="grid grid-cols-2 gap-6 h-28">
          <Card className="flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Building className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Jobs</p>
                <p className="text-3xl font-semibold">{jobs.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
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
                <div className="w-full h-3 bg-gray-100 rounded-full mb-2">
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
              <CardTitle>Workable Job Listings Per Day</CardTitle>
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
                    <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg p-4">
                      <div className="text-center">
                        <p className="text-muted-foreground mb-2">
                          No jobs available yet
                        </p>
                        <p className="text-sm text-muted-foreground">
                          As a new account holder, your first jobs will be added
                          within 8 hours of account creation.
                        </p>
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
              <Card className="bg-white shadow-sm">
                <CardContent className="p-3 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mb-1">
                    <Building className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-2xl font-semibold">{jobs.length}</p>
                  <p className="text-xs text-muted-foreground text-center">
                    Total Jobs
                  </p>
                </CardContent>
              </Card>
  
              <Card className="bg-white shadow-sm">
                <CardContent className="p-3 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mb-1">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
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
                        <stop offset="5%" stopColor="#50C878" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#50C878" stopOpacity={0.5}/>
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
                    <div className="w-full h-3 bg-gray-100 rounded-full mb-2">
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
                              {job.company || "Not specified"}
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
                        <Building className="h-4 w-4 mr-1" />{" "}
                        {job.company || "Not specified"}
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
              <div className="text-center">
                <p className="text-muted-foreground mb-2">
                  No jobs available yet
                </p>
                <p className="text-sm text-muted-foreground">
                  As a new account holder, your first jobs will be added within
                  8 hours of account creation.
                </p>
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
          <h3 className="font-medium text-sm leading-tight w-[75%]">
            {job.title}
          </h3>
          <Badge variant="outline" className="text-xs py-0 h-5">
            Workable
          </Badge>
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
    color: "hsl(var(--chart-2))",
  },
};