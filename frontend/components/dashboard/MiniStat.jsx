// components/dashboard/MiniStat.jsx
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Building, Palette, Globe } from "lucide-react";

export default function MiniStat({ title, count }) {
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