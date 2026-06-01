"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles, Heart, Zap, TrendingUp, ChevronRight, Play,
  Settings, MessageCircle, Shield, Award, Lightbulb,
  Sun, Moon, Pill, Calendar, Camera, Brain, Dumbbell,
  Battery, Flame, Target, Clock, CheckCircle2
} from "lucide-react";
import Link from "next/link";

// Get time-based greeting
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// Motivational messages
const motivations = [
  "Taking charge of your health, one day at a time.",
  "Every healthy choice is a step toward your best self.",
  "Your commitment to wellness is inspiring.",
  "Building better habits for a stronger you.",
  "Real progress starts with showing up.",
];

// Daily tips for men's health
const dailyTips = [
  { title: "Stay Hydrated", content: "Drinking 8 glasses of water daily supports overall vitality and hormone balance.", icon: "hydration" },
  { title: "Quality Sleep", content: "Aim for 7-9 hours of sleep. It's crucial for testosterone production.", icon: "sleep" },
  { title: "Stress Management", content: "High cortisol can impact your health goals. Try 10 minutes of daily meditation.", icon: "stress" },
  { title: "Protein Intake", content: "Adequate protein supports muscle maintenance and overall vitality.", icon: "nutrition" },
  { title: "Stay Active", content: "Regular exercise boosts energy, mood, and supports healthy hormone levels.", icon: "fitness" },
];

export default function MensHealthPage() {
  const { user } = useAuth();
  const [motivation, setMotivation] = useState("");
  const [dailyTip, setDailyTip] = useState(dailyTips[0]);

  useEffect(() => {
    // Random motivation
    setMotivation(motivations[Math.floor(Math.random() * motivations.length)]);
    // Daily tip based on day
    const dayIndex = new Date().getDate() % dailyTips.length;
    setDailyTip(dailyTips[dayIndex]);
  }, []);

  // Main health modules
  const healthModules = [
    {
      id: "hair-loss",
      title: "Hair Restoration",
      description: "Track progress & manage treatment",
      icon: Sparkles,
      href: "/dashboard/mens-health/hair-loss",
      gradient: "from-violet-600 to-purple-700",
      stats: { label: "Day 45", value: "Treatment" },
      image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=200&h=150&fit=crop"
    },
    {
      id: "vitality",
      title: "Daily Vitality",
      description: "Energy, testosterone & wellness",
      icon: Zap,
      href: "/dashboard/mens-health/vitality",
      gradient: "from-amber-500 to-orange-600",
      stats: { label: "85%", value: "Energy" },
      image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&h=150&fit=crop"
    },
    {
      id: "sexual-health",
      title: "Sexual Wellness",
      description: "Private, personalized care",
      icon: Heart,
      href: "/dashboard/mens-health/sexual-health",
      gradient: "from-rose-500 to-pink-600",
      stats: { label: "Active", value: "Treatment" },
      image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=200&h=150&fit=crop"
    },
  ];

  // Quick actions
  const quickActions = [
    {
      label: "Log Progress",
      description: "Track hair growth",
      icon: Camera,
      href: "/dashboard/mens-health/hair-loss/track",
      color: "bg-violet-600",
    },
    {
      label: "Check-in",
      description: "Daily vitality",
      icon: CheckCircle2,
      href: "/dashboard/mens-health/vitality/check-in",
      color: "bg-amber-500",
    },
    {
      label: "Medication",
      description: "Log doses",
      icon: Pill,
      href: "/dashboard/mens-health/treatment",
      color: "bg-teal-600",
    },
    {
      label: "Care Team",
      description: "Get help",
      icon: MessageCircle,
      href: "/dashboard/mens-health/support",
      color: "bg-slate-600",
    },
  ];

  // Featured content
  const featuredContent = [
    {
      title: "Understanding DHT",
      description: "Learn how DHT affects hair loss",
      duration: "5 min read",
      category: "Hair Loss",
      href: "/dashboard/mens-health/learn/dht",
    },
    {
      title: "Testosterone & Energy",
      description: "Natural ways to optimize levels",
      duration: "7 min read",
      category: "Vitality",
      href: "/dashboard/mens-health/learn/testosterone",
    },
    {
      title: "ED: Causes & Solutions",
      description: "Evidence-based treatments",
      duration: "6 min read",
      category: "Sexual Health",
      href: "/dashboard/mens-health/learn/ed-treatments",
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Personalized Header - Dark Masculine Theme */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 p-6 text-white">
        <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/10 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full translate-y-1/2 -translate-x-1/3" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Sun className="w-4 h-4 text-teal-400" />
            <p className="text-teal-300 text-sm">{getGreeting()}</p>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-semibold mb-2">
            {user?.firstName}
          </h1>
          <p className="text-slate-300 text-sm">{motivation}</p>

          {/* Quick Stats */}
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/20 text-teal-300 text-sm">
              <Shield className="w-4 h-4" />
              <span>3 Active Programs</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-sm">
              <Flame className="w-4 h-4" />
              <span>14 Day Streak</span>
            </div>
          </div>
        </div>
      </div>

      {/* Health Modules - Visual Cards */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Target className="w-5 h-5 text-teal-600" />
          Your Programs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {healthModules.map((module) => (
            <Link key={module.id} href={module.href}>
              <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group h-full border-0 bg-slate-900">
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={module.image}
                    alt={module.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 opacity-60"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${module.gradient} opacity-80`} />
                  <div className="absolute inset-0 flex flex-col justify-end p-4">
                    <module.icon className="w-8 h-8 text-white mb-2 drop-shadow-lg" />
                    <h3 className="text-white font-bold text-lg">{module.title}</h3>
                    <p className="text-white/80 text-sm">{module.description}</p>
                  </div>
                  <Badge className="absolute top-3 right-3 bg-white/20 text-white border-0">
                    {module.stats.label}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <Link key={action.label} href={action.href}>
            <Card className="overflow-hidden hover:shadow-md transition-all cursor-pointer group h-full border-slate-200 dark:border-slate-800">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Today's Focus */}
      <Card className="bg-gradient-to-r from-slate-50 to-teal-50 dark:from-slate-900 dark:to-teal-950/30 border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center shrink-0">
              <Lightbulb className="w-6 h-6 text-teal-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider mb-1">Today&apos;s Tip</p>
              <p className="font-medium text-slate-900 dark:text-white">{dailyTip.title}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{dailyTip.content}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Treatment Overview */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Pill className="w-5 h-5 text-teal-600" />
              Today&apos;s Treatments
            </CardTitle>
            <Link href="/dashboard/mens-health/treatment">
              <Button variant="ghost" size="sm" className="text-teal-600">
                View all <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Sample treatments */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center">
                <Pill className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-sm">Finasteride 1mg</p>
                <p className="text-xs text-muted-foreground">Hair Loss Treatment</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Taken
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-sm">Vitamin D3 + Zinc</p>
                <p className="text-xs text-muted-foreground">Daily Vitality</p>
              </div>
            </div>
            <Badge variant="outline" className="border-amber-400 text-amber-600">
              <Clock className="w-3 h-3 mr-1" /> 6:00 PM
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Progress Overview */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-gradient-to-br from-violet-500 to-purple-600 border-0 text-white">
          <CardContent className="p-4 text-center">
            <Sparkles className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">45</p>
            <p className="text-xs text-white/80">Days on Treatment</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 border-0 text-white">
          <CardContent className="p-4 text-center">
            <Battery className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">85%</p>
            <p className="text-xs text-white/80">Energy Level</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-teal-500 to-cyan-600 border-0 text-white">
          <CardContent className="p-4 text-center">
            <Award className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">14</p>
            <p className="text-xs text-white/80">Day Streak</p>
          </CardContent>
        </Card>
      </div>

      {/* Featured Content */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Play className="w-5 h-5 text-teal-600" />
              Learn & Understand
            </CardTitle>
            <Link href="/dashboard/mens-health/learn">
              <Button variant="ghost" size="sm" className="text-teal-600">
                See all <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {featuredContent.map((content, index) => (
            <Link key={index} href={content.href}>
              <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  <Play className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{content.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{content.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant="secondary" className="text-xs">{content.category}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">{content.duration}</p>
                </div>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Discreet & Secure Banner */}
      <Card className="bg-gradient-to-r from-slate-800 to-slate-900 border-0 text-white">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-teal-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Private & Discreet</p>
            <p className="text-sm text-slate-300">Your health data is encrypted and never shared. All packages ship in plain packaging.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
