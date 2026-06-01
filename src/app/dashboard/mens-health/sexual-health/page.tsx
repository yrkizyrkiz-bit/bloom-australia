"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, Heart, Shield, Lock, Pill, ChevronRight,
  CheckCircle2, Clock, MessageCircle, Play, Sparkles,
  Phone, Calendar, TrendingUp, Award, AlertCircle, Info
} from "lucide-react";
import Link from "next/link";

export default function SexualHealthPage() {
  // Treatment status
  const treatmentStatus = {
    active: true,
    medication: "Sildenafil 50mg",
    pillsRemaining: 8,
    lastOrder: "2024-03-15",
    nextRefill: "2024-04-15",
  };

  // Treatment options
  const treatmentOptions = [
    {
      name: "Sildenafil",
      brand: "Generic Viagra",
      dosages: ["25mg", "50mg", "100mg"],
      description: "Fast-acting, works in 30-60 minutes",
      duration: "4-6 hours",
      popular: true,
    },
    {
      name: "Tadalafil",
      brand: "Generic Cialis",
      dosages: ["5mg", "10mg", "20mg"],
      description: "Longer-lasting option",
      duration: "Up to 36 hours",
      popular: false,
    },
    {
      name: "Daily Tadalafil",
      brand: "Low-dose daily",
      dosages: ["2.5mg", "5mg"],
      description: "Continuous coverage, take daily",
      duration: "24/7 readiness",
      popular: false,
    },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/mens-health">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500" />
            Sexual Wellness
          </h1>
          <p className="text-muted-foreground">Private, personalized care</p>
        </div>
      </div>

      {/* Privacy Banner */}
      <Card className="bg-gradient-to-r from-slate-800 to-slate-900 border-0 text-white">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6 text-rose-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">100% Private & Discreet</p>
            <p className="text-sm text-slate-300">Encrypted data, plain packaging, no pharmacy visits</p>
          </div>
          <Shield className="w-8 h-8 text-slate-500" />
        </CardContent>
      </Card>

      {/* Current Treatment Card */}
      {treatmentStatus.active && (
        <Card className="overflow-hidden bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 border-0 text-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-rose-100 text-sm uppercase tracking-wider mb-1">Active Treatment</p>
                <p className="text-2xl font-bold">{treatmentStatus.medication}</p>
                <Badge className="bg-green-500/20 text-green-100 border-0 mt-2">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-rose-100 text-sm">Supply</p>
                <p className="text-3xl font-bold">{treatmentStatus.pillsRemaining}</p>
                <p className="text-rose-200 text-xs">pills remaining</p>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <Link href="/dashboard/mens-health/treatment" className="flex-1">
                <Button className="w-full bg-white/20 hover:bg-white/30 border-0">
                  <Calendar className="w-4 h-4 mr-2" /> Refill Order
                </Button>
              </Link>
              <Link href="/dashboard/mens-health/support">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/dashboard/mens-health/sexual-health/log">
          <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group border-2 border-rose-200 dark:border-rose-900 hover:border-rose-400">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold">Log Use</p>
                  <p className="text-xs text-muted-foreground">Track response</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/mens-health/support">
          <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group border-slate-200 dark:border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <MessageCircle className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                </div>
                <div>
                  <p className="font-semibold">Ask Doctor</p>
                  <p className="text-xs text-muted-foreground">Get advice</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Treatment Options */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Pill className="w-5 h-5 text-rose-500" />
            Treatment Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {treatmentOptions.map((option, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border ${
                option.popular
                  ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{option.name}</p>
                    {option.popular && (
                      <Badge className="bg-rose-500 text-xs">Most Popular</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{option.brand}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{option.duration}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{option.description}</p>
              <div className="flex gap-2">
                {option.dosages.map((dosage, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {dosage}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-rose-500" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { step: 1, title: "Online Consultation", description: "Answer health questions privately online", icon: MessageCircle },
              { step: 2, title: "Doctor Review", description: "Licensed physician reviews your information", icon: Shield },
              { step: 3, title: "Prescription", description: "If appropriate, get a prescription same day", icon: CheckCircle2 },
              { step: 4, title: "Discreet Delivery", description: "Medication shipped in plain packaging", icon: Lock },
            ].map((item, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                  <span className="text-rose-600 font-bold">{item.step}</span>
                </div>
                <div className="flex-1 pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Safety Info */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-900">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-sm text-amber-900 dark:text-amber-100">Important Safety Information</p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Do not take ED medication if you use nitrates for heart conditions. Always consult with a healthcare provider before starting any treatment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learn More */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Play className="w-5 h-5 text-rose-500" />
              Understanding ED
            </CardTitle>
            <Link href="/dashboard/mens-health/learn">
              <Button variant="ghost" size="sm" className="text-rose-600">
                See all <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link href="/dashboard/mens-health/learn/ed-causes">
            <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              <div className="w-12 h-12 rounded-lg bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center shrink-0">
                <Play className="w-5 h-5 text-rose-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Common Causes of ED</p>
                <p className="text-xs text-muted-foreground">Physical & psychological factors</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Link>
          <Link href="/dashboard/mens-health/learn/ed-treatments">
            <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              <div className="w-12 h-12 rounded-lg bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center shrink-0">
                <Play className="w-5 h-5 text-rose-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Treatment Options Explained</p>
                <p className="text-xs text-muted-foreground">Compare medications</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Link>
          <Link href="/dashboard/mens-health/learn/lifestyle">
            <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              <div className="w-12 h-12 rounded-lg bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center shrink-0">
                <Play className="w-5 h-5 text-rose-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Lifestyle Improvements</p>
                <p className="text-xs text-muted-foreground">Natural ways to improve</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Link>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card className="bg-gradient-to-r from-slate-800 to-slate-900 border-0 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0">
                <Phone className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <p className="font-semibold">Questions?</p>
                <p className="text-sm text-slate-300">Speak with a healthcare provider</p>
              </div>
            </div>
            <Link href="/dashboard/mens-health/support">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Contact
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
