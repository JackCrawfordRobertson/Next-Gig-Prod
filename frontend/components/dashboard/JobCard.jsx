// components/dashboard/JobCard.jsx
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, MapPin, Clock, CheckCircle2, XCircle, PoundSterling } from "lucide-react";

export default function JobCard({ job, compact = false, onClick }) {
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
        className="hover:shadow-md transition-shadow bg-card cursor-pointer"
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-sm line-clamp-1 text-foreground">{title}</h3>
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
      className="hover:shadow-md transition-shadow bg-card cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-medium text-foreground">{title}</h3>
          <Badge variant="outline">{source}</Badge>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 mb-3">
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