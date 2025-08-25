"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  IconDashboard,
  IconListDetails,
  IconChartBar,
  IconFolder,
  IconUsers,
  IconBook2,
  IconPresentation,
  IconIdBadge2,
  IconCards,
  IconArrowRight,
  IconSparkles,
  IconFileText,
  IconPhoto,
  IconCertificate,
  IconTrendingUp,
  IconClock,
  IconStar,
  IconBell,
} from "@tabler/icons-react";
import Link from "next/link";

// Tool data with descriptions and features
const tools = [
  {
    id: "mcq",
    title: "MCQ Generator",
    description: "Create multiple-choice questions instantly",
    icon: IconListDetails,
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    features: ["AI-powered", "Export options", "Difficulty levels"],
    url: "/mcq-generator",
    badge: "Popular",
  },
  {
    id: "ppt",
    title: "PPT Generator",
    description: "Generate professional presentations in minutes",
    icon: IconPresentation,
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    features: ["Templates", "Auto-layout", "Media integration"],
    url: "/ppt-generator",
    badge: "New",
  },
  {
    id: "flashcards",
    title: "Flashcards",
    description: "Create study cards for effective learning",
    icon: IconCards,
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    features: ["Image support", "Spaced repetition", "Printable"],
    url: "/flashcards",
  },
  {
    id: "certificate",
    title: "Certificate Maker",
    description: "Design and issue certificates of achievement",
    icon: IconIdBadge2,
    color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    features: ["Custom templates", "QR codes", "Bulk generation"],
    url: "/certificate-maker",
  },
  {
    id: "analytics",
    title: "Analytics",
    description: "Track student performance and engagement",
    icon: IconChartBar,
    color:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    features: ["Detailed reports", "Progress tracking", "Insights"],
    url: "/analytics",
  },
  {
    id: "resources",
    title: "Resource Library",
    description: "Organize and access teaching materials",
    icon: IconFolder,
    color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
    features: ["Cloud storage", "Sharing", "Categorization"],
    url: "/resources",
  },
];

// Recent activity data
const recentActivity = [
  {
    id: 1,
    title: "Created MCQ set for Biology",
    time: "2 hours ago",
    icon: IconFileText,
  },
  {
    id: 2,
    title: "Generated presentation on Photosynthesis",
    time: "Yesterday",
    icon: IconPhoto,
  },
  {
    id: 3,
    title: "Issued 15 certificates",
    time: "2 days ago",
    icon: IconCertificate,
  },
];

// Upcoming events
const upcomingEvents = [
  {
    id: 1,
    title: "Parent-Teacher Meeting",
    date: "Tomorrow, 10:00 AM",
    icon: IconUsers,
  },
  {
    id: 2,
    title: "Science Fair Preparation",
    date: "May 15, 2:00 PM",
    icon: IconBook2,
  },
  {
    id: 3,
    title: "Staff Training Session",
    date: "May 20, 9:00 AM",
    icon: IconPresentation,
  },
];

export default function DashboardPage() {
  const [userName] = useState("Teacher");

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Welcome Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {userName}!
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your teaching tools today.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <IconBell className="mr-2 h-4 w-4" />
              Notifications
            </Button>
            <Button size="sm">
              <IconSparkles className="mr-2 h-4 w-4" />
              New Tool
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="tools" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="tools">Teaching Tools</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="events">Upcoming Events</TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm">
            View All Tools
          </Button>
        </div>

        <TabsContent value="tools" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tools.map((tool) => (
              <Card
                key={tool.id}
                className="group transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${tool.color}`}>
                      <tool.icon className="h-5 w-5" />
                    </div>
                    {tool.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {tool.badge}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{tool.title}</CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      {tool.features.slice(0, 2).map((feature, idx) => (
                        <div
                          key={idx}
                          className="flex items-center text-xs text-muted-foreground"
                        >
                          <div className="mr-2 h-1 w-1 rounded-full bg-current" />
                          {feature}
                        </div>
                      ))}
                    </div>
                    <Button asChild size="sm" className="w-full">
                      <Link href={tool.url}>
                        Use Tool
                        <IconArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest teaching activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center">
                      <div className="mr-4 rounded-md bg-muted p-2">
                        <activity.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">
                          {activity.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>
                Your scheduled activities and meetings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center">
                      <div className="mr-4 rounded-md bg-muted p-2">
                        <event.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">
                          {event.title}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center">
                          <IconClock className="mr-1 h-3 w-3" />
                          {event.date}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Details
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
