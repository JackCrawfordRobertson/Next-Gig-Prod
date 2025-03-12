"use client";

import { useEffect, useState } from "react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Briefcase, LineChart } from "lucide-react";

export default function DashboardPage() {
  const [jobs, setJobs] = useState({
    linkedin: [],
    ifyoucould: [],
    unjobs: [],
    workable: [],
  });

  useEffect(() => {
    async function fetchJobs() {
      const jobSources = ["jobs_linkedin", "jobs_ifyoucould", "jobs_unjobs", "jobs_workable"];
      let fetchedJobs = {};

      for (const source of jobSources) {
        const querySnapshot = await getDocs(collection(db, source));
        fetchedJobs[source.replace("jobs_", "")] = querySnapshot.docs.map((doc) => doc.data());
      }

      setJobs(fetchedJobs);
    }

    fetchJobs();
  }, []);

  // ✅ Prepare Chart Data (Total Jobs Per Source)
  const chartData = Object.keys(jobs).map((source) => ({
    name: source.charAt(0).toUpperCase() + source.slice(1),
    count: jobs[source].length,
  }));

  return (
    <div className="h-screen w-full flex flex-col gap-6 p-6">
      {/* ✅ Dashboard Header */}

      {/* ✅ Top Row: Mini Stats (Total Jobs Per Source) */}
      <div className="grid grid-cols-4 gap-4">
        <MiniStat title="LinkedIn" count={jobs.linkedin.length} />
        <MiniStat title="Workable" count={jobs.workable.length} />
        <MiniStat title="If You Could" count={jobs.ifyoucould.length} />
        <MiniStat title="UN Jobs" count={jobs.unjobs.length} />
      </div>

      {/* ✅ Bottom Row: Job Chart */}
      <Card className="w-full p-4 flex-1">
      
        <CardContent className="h-[300px]"> {/* 🔥 Reduced height for compact layout */}
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis stroke="hsl(var(--foreground))" />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// ✅ Mini Stat Card Component (Job Counts)
function MiniStat({ title, count }) {
  return (
    <Card className="flex items-center justify-between p-3 shadow-md">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold">{count}</p>
      </div>
      <Briefcase className="w-6 h-6 text-primary" />
    </Card>
  );
}

// ✅ Chart Configuration for ShadCN
const chartConfig = {
  count: {
    label: "Total Jobs",
    color: "hsl(var(--chart-1))",
  },
};