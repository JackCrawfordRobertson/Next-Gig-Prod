"use client";

import { useAnimatedTitle } from "@/hooks/useAnimatedTitle";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AnimationsDemo() {
  const [animation, setAnimation] = useState("arrow-bounce");
  const [enabled, setEnabled] = useState(true);
  const [interval, setInterval] = useState(500);
  const [onlyWhenHidden, setOnlyWhenHidden] = useState(false);

  useAnimatedTitle({
    enabled,
    animation,
    interval,
    onlyWhenHidden,
  });

  const animations = [
    {
      name: "arrow-bounce",
      label: "Arrow Bounce",
      description: "Arrow bounces across the title - subtle and professional",
      emoji: "→",
      recommended: true,
    },
    {
      name: "arrow-move",
      label: "Arrow Move",
      description: "Smooth arrow movement from left to right",
      emoji: "→",
    },
    {
      name: "notification",
      label: "Notification",
      description: "Perfect for new job alerts!",
      emoji: "⚡",
      recommended: true,
    },
    {
      name: "loading",
      label: "Loading",
      description: "Great for search and loading states",
      emoji: "⏳",
    },
    {
      name: "pulse",
      label: "Pulse",
      description: "Attention-grabbing pulse effect",
      emoji: "💫",
    },
    {
      name: "typewriter",
      label: "Typewriter",
      description: "Types out the name letter by letter",
      emoji: "⌨️",
    },
    {
      name: "scroll",
      label: "Scroll",
      description: "Scrolls a longer message across the tab",
      emoji: "📜",
    },
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Browser Tab Title Animations 🎬
        </h1>
        <p className="text-muted-foreground">
          Look at your browser tab to see the animation in action! 👆
        </p>
      </div>

      {/* Status Banner */}
      <Card className="mb-6 border-blue-500 bg-blue-50 dark:bg-blue-950">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${enabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <p className="font-semibold">
              Current Animation: <span className="text-blue-600 dark:text-blue-400">{animation}</span>
            </p>
            {onlyWhenHidden && (
              <Badge variant="outline" className="ml-2">
                Tab-Hidden Mode
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Animation Enabled</span>
              <Button
                variant={enabled ? "default" : "outline"}
                size="sm"
                onClick={() => setEnabled(!enabled)}
              >
                {enabled ? "ON" : "OFF"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Only When Tab Hidden</span>
              <Button
                variant={onlyWhenHidden ? "default" : "outline"}
                size="sm"
                onClick={() => setOnlyWhenHidden(!onlyWhenHidden)}
              >
                {onlyWhenHidden ? "ON" : "OFF"}
              </Button>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Speed: {interval}ms
              </label>
              <input
                type="range"
                min="200"
                max="2000"
                step="100"
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Fast (200ms)</span>
                <span>Slow (2000ms)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage Tip</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              To see the <strong>"Only When Tab Hidden"</strong> feature:
            </p>
            <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
              <li>Enable that option</li>
              <li>Choose "notification" animation</li>
              <li>Switch to another tab/window</li>
              <li>Look at the Next Gig tab - it's animating!</li>
              <li>Come back - animation stops</li>
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* Animation Options */}
      <h2 className="text-2xl font-bold mb-4">Choose Animation</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {animations.map((anim) => (
          <Card
            key={anim.name}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              animation === anim.name
                ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950"
                : "hover:bg-gray-50 dark:hover:bg-gray-900"
            }`}
            onClick={() => setAnimation(anim.name)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{anim.emoji}</span>
                  <CardTitle className="text-lg">{anim.label}</CardTitle>
                </div>
                {anim.recommended && (
                  <Badge variant="default" className="text-xs">
                    ⭐ Recommended
                  </Badge>
                )}
              </div>
              <CardDescription className="text-sm">
                {anim.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Code Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Code to Use This Animation</CardTitle>
          <CardDescription>
            Copy this into any page component (must be "use client")
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <pre>{`"use client";

import { useAnimatedTitle } from "@/hooks/useAnimatedTitle";

export default function YourPage() {
  useAnimatedTitle({
    enabled: ${enabled},
    animation: "${animation}",
    interval: ${interval},
    onlyWhenHidden: ${onlyWhenHidden},
  });

  return <div>Your content</div>;
}`}</pre>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>💡 Recommendations for Next Gig</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Homepage</h3>
            <p className="text-sm text-muted-foreground">
              Use <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">arrow-bounce</code> with interval of 800ms (slow and subtle)
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Jobs Dashboard</h3>
            <p className="text-sm text-muted-foreground">
              Use <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">notification</code> animation
              with <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">onlyWhenHidden: true</code> when user has new jobs
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Search/Loading States</h3>
            <p className="text-sm text-muted-foreground">
              Use <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">loading</code> animation while searching for jobs
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Other Pages</h3>
            <p className="text-sm text-muted-foreground">
              No animation - keep it clean and professional
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Documentation Link */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          For more details, see{" "}
          <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            ANIMATED_TITLE_GUIDE.md
          </code>
        </p>
      </div>
    </div>
  );
}
