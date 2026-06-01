"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Play, BookOpen, CheckCircle2, Clock, Apple, Dumbbell, Pill, Brain, ChefHat, Star, Users } from "lucide-react";
import Link from "next/link";

interface ContentItem {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  type: "video" | "article";
  thumbnail: string;
  completed: boolean;
}

const CONTENT_DATA: ContentItem[] = [
  {
    id: "1",
    title: "Getting Started with Your Weight Loss Journey",
    description: "Everything you need to know to begin your transformation",
    duration: "8 min",
    category: "getting_started",
    type: "video",
    thumbnail: "/api/placeholder/320/180",
    completed: false,
  },
  {
    id: "2",
    title: "Understanding How the Program Works",
    description: "Learn about our unique approach to weight loss",
    duration: "5 min",
    category: "getting_started",
    type: "video",
    thumbnail: "/api/placeholder/320/180",
    completed: true,
  },
  {
    id: "3",
    title: "Why Tracking is Important",
    description: "The science behind tracking your progress",
    duration: "4 min",
    category: "getting_started",
    type: "article",
    thumbnail: "/api/placeholder/320/180",
    completed: true,
  },
  {
    id: "4",
    title: "Building a Balanced Plate",
    description: "How to create nutritious, satisfying meals",
    duration: "6 min",
    category: "nutrition",
    type: "video",
    thumbnail: "/api/placeholder/320/180",
    completed: false,
  },
  {
    id: "5",
    title: "Healthy Coffee Swaps",
    description: "Enjoy your coffee without the extra calories",
    duration: "3 min",
    category: "nutrition",
    type: "video",
    thumbnail: "/api/placeholder/320/180",
    completed: false,
  },
  {
    id: "6",
    title: "Meal Prep 101",
    description: "Save time and stay on track with meal prepping",
    duration: "10 min",
    category: "nutrition",
    type: "video",
    thumbnail: "/api/placeholder/320/180",
    completed: false,
  },
  {
    id: "7",
    title: "Starting Your Exercise Routine",
    description: "Gentle exercises to build strength and endurance",
    duration: "12 min",
    category: "exercise",
    type: "video",
    thumbnail: "/api/placeholder/320/180",
    completed: false,
  },
  {
    id: "8",
    title: "Walking for Weight Loss",
    description: "How to maximize the benefits of walking",
    duration: "5 min",
    category: "exercise",
    type: "article",
    thumbnail: "/api/placeholder/320/180",
    completed: false,
  },
  {
    id: "9",
    title: "Understanding Your Medication",
    description: "How weight loss medications work",
    duration: "7 min",
    category: "medication",
    type: "video",
    thumbnail: "/api/placeholder/320/180",
    completed: false,
  },
  {
    id: "10",
    title: "Managing Side Effects",
    description: "Tips for handling common side effects",
    duration: "6 min",
    category: "medication",
    type: "video",
    thumbnail: "/api/placeholder/320/180",
    completed: false,
  },
  {
    id: "11",
    title: "Building Lasting Habits",
    description: "The psychology of sustainable change",
    duration: "8 min",
    category: "mindset",
    type: "video",
    thumbnail: "/api/placeholder/320/180",
    completed: false,
  },
  {
    id: "12",
    title: "Overcoming Plateaus",
    description: "What to do when progress stalls",
    duration: "5 min",
    category: "mindset",
    type: "article",
    thumbnail: "/api/placeholder/320/180",
    completed: false,
  },
];

const CATEGORIES = [
  { id: "all", label: "All", icon: BookOpen },
  { id: "getting_started", label: "Getting Started", icon: Star },
  { id: "nutrition", label: "Nutrition", icon: Apple },
  { id: "exercise", label: "Exercise", icon: Dumbbell },
  { id: "medication", label: "Medication", icon: Pill },
  { id: "mindset", label: "Mindset", icon: Brain },
];

export default function LearnPage() {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredContent = activeCategory === "all"
    ? CONTENT_DATA
    : CONTENT_DATA.filter((item) => item.category === activeCategory);

  const completedCount = CONTENT_DATA.filter((item) => item.completed).length;
  const totalCount = CONTENT_DATA.length;

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/weight-management">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Learn</h1>
          <p className="text-muted-foreground">Educational content to support your journey</p>
        </div>
      </div>

      {/* Progress Card */}
      <Card className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80">Your Progress</p>
              <p className="text-3xl font-bold">{completedCount} / {totalCount}</p>
              <p className="text-sm text-white/80">lessons completed</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <BookOpen className="w-8 h-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.id}
            variant={activeCategory === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(cat.id)}
            className="shrink-0"
          >
            <cat.icon className="w-4 h-4 mr-2" />
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContent.map((item) => (
          <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="relative aspect-video bg-gradient-to-br from-emerald-800 to-teal-900 flex items-center justify-center">
              {item.type === "video" ? (
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 text-white" />
                </div>
              ) : (
                <BookOpen className="w-8 h-8 text-white/60" />
              )}
              {item.completed && (
                <div className="absolute top-2 right-2">
                  <Badge className="bg-green-500">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
                  </Badge>
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  {item.type === "video" ? "Video" : "Article"}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {item.duration}
                </span>
              </div>
              <h3 className="font-semibold mb-1 line-clamp-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Featured Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-orange-500" />
            Healthy Recipes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">Coming soon: A collection of delicious, healthy recipes to support your weight loss journey.</p>
          <Badge variant="outline">Coming Soon</Badge>
        </CardContent>
      </Card>

      {/* Community Stories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Success Stories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">Get inspired by members who have achieved their weight loss goals.</p>
          <Badge variant="outline">Coming Soon</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
