"use client";

import { useEffect, useState } from "react";
import { db, collection, getDocs } from "@/firebase";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { startOfWeek, endOfWeek, format, subWeeks, addWeeks } from "date-fns";

export default function LinkedInPage() {
  const [jobs, setJobs] = useState([]);
  const [jobStats, setJobStats] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  useEffect(() => {
    async function fetchJobs() {
      const querySnapshot = await getDocs(collection(db, "jobs_linkedin"));
      const jobsData = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        has_applied: doc.data().has_applied ?? false, // Ensure default value
      }));

      setJobs(jobsData);

      // ✅ Aggregate jobs by weekday
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
          const weekday = format(jobDate, "EEEE"); // Get day name (Monday, Tuesday, etc.)
          if (jobCountByWeekday[weekday] !== undefined) {
            jobCountByWeekday[weekday]++;
          }
        }
      });

      // ✅ Convert into chart format
      const chartData = Object.keys(jobCountByWeekday).map((day) => ({
        day,
        count: jobCountByWeekday[day],
      }));

      setJobStats(chartData);
    }

    fetchJobs();
  }, [currentWeek]);

  // ✅ Navigation Functions for Weekly View
  const goToPreviousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const goToNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));

  return (
    <div className="h-screen w-full flex p-8 gap-6">
      {/* ✅ Left: LinkedIn Job Column */}
      <div className="w-1/3 h-full">
        <JobColumn title="LinkedIn Jobs" jobs={jobs} />
      </div>

      {/* ✅ Right: Job Postings Chart */}
      <div className="w-2/3 h-full bg-card p-0 rounded-lg shadow">
        <CardHeader className="flex justify-between items-left">
          <div>
            <CardTitle>Job Listings Per Week</CardTitle>
            <p className="text-muted-foreground text-sm">
              {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), "MMM d")} - {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), "MMM d")}
            </p>
          </div>

          {/* ✅ Navigation Arrows */}
          <div className="flex gap-3">
            <button onClick={goToPreviousWeek} className="p-2 rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={goToNextWeek} className="p-2 rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>

        <CardContent> 
  <ChartContainer config={chartConfig}>
    <ResponsiveContainer width="100%" height={600}> {/* Adjust height */}
      <BarChart data={jobStats}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="day" tickLine={false} tickMargin={10} axisLine={false} />
        <YAxis stroke="hsl(var(--foreground))" />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
        <Bar dataKey="count" fill="hsl(var(--primary))" radius={4} />
      </BarChart>
    </ResponsiveContainer>
  </ChartContainer>
</CardContent>
      </div>
    </div>
  );
}

// ✅ Reusable Job Column Component (Same as Dashboard)
function JobColumn({ title, jobs }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[85vh]">
        <ScrollArea className="h-full">
          <div className="space-y-4">
            {jobs.length > 0 ? (
              jobs.map((job, index) => (
                <Card key={index} className="p-4 space-y-2">
                  <p className="font-semibold">{job.title}</p>
                  <p className="text-sm">{job.company} - {job.location}</p>
                  <p className="text-sm">Posted on {job.date_posted} | Added on {job.date_added}</p>
                  <p className={`text-sm ${job.has_applied ? "text-green-500" : "text-red-500"}`}>
                    {job.has_applied ? "✅ Applied" : "❌ Not Applied"}
                  </p>
                  <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">
                    View Job
                  </a>
                </Card>
              ))
            ) : (
              <p className="text-sm">No jobs available.</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// ✅ Chart Configuration for ShadCN
const chartConfig = {
  count: {
    label: "Jobs Added",
    color: "hsl(var(--chart-1))",
  },
};