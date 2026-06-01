"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Scale, Users, TrendingDown, Target, Search, ChevronRight,
  Loader2, Award, Calendar, MessageCircle, ClipboardCheck, AlertTriangle
} from "lucide-react";
import Link from "next/link";

interface MemberSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  journeyStatus: string;
  currentWeight: number | null;
  weightChange: number | null;
  lastLogDate: string | null;
  lastCheckIn: string | null;
  hasActiveGoal: boolean;
  targetWeight: number | null;
  onTrack: boolean | null;
  daysSinceActivity: number | null;
  needsAttention: boolean;
}

interface Stats {
  totalMembers: number;
  activeGoals: number;
  avgWeightLoss: number;
  checkInsThisWeek: number;
  needingAttention: number;
}

export default function AdminWeightManagementPage() {
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalMembers: 0,
    activeGoals: 0,
    avgWeightLoss: 0,
    checkInsThisWeek: 0,
    needingAttention: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/admin/weight-management/members");
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Weight Management</h1>
        <p className="text-muted-foreground">Monitor and support member weight loss journeys</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold">{stats.totalMembers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active Goals</p>
                <p className="text-2xl font-bold">{stats.activeGoals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Weight Loss</p>
                <p className="text-2xl font-bold">{stats.avgWeightLoss} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Check-ins (7d)</p>
                <p className="text-2xl font-bold">{stats.checkInsThisWeek}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Need Attention</p>
                <p className="text-2xl font-bold">{stats.needingAttention}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/weight-management/approvals">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <ClipboardCheck className="w-4 h-4 mr-2" /> Patient Approvals
          </Button>
        </Link>
        <Link href="/admin/weight-management/content">
          <Button variant="outline">
            <Award className="w-4 h-4 mr-2" /> Manage Content
          </Button>
        </Link>
        <Link href="/admin/weight-management/coaching">
          <Button variant="outline">
            <MessageCircle className="w-4 h-4 mr-2" /> Coaching Messages
          </Button>
        </Link>
      </div>

      {/* Member Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Member Progress</CardTitle>
          <CardDescription>View and manage individual member weight journeys</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {filteredMembers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No members found</p>
          ) : (
            <div className="space-y-3">
              {filteredMembers.map((member) => (
                <Link key={member.id} href={`/admin/crm/customers/${member.id}`}>
                  <Card className={`hover:shadow-md transition-shadow cursor-pointer ${member.needsAttention ? 'border-amber-300' : ''}`}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {member.firstName[0]}{member.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{member.firstName} {member.lastName}</p>
                            {member.needsAttention && (
                              <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                                No activity {member.daysSinceActivity}d
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {member.currentWeight ? (
                          <div className="text-right">
                            <p className="font-semibold flex items-center gap-1">
                              <Scale className="w-4 h-4 text-muted-foreground" />
                              {member.currentWeight} kg
                            </p>
                            {member.weightChange !== null && (
                              <p className={`text-xs ${member.weightChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {member.weightChange > 0 ? '+' : ''}{member.weightChange} kg
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No data</span>
                        )}
                        {member.hasActiveGoal && (
                          <Badge variant="secondary" className={member.onTrack ? 'bg-green-100 text-green-700' : ''}>
                            {member.onTrack ? 'On Track' : 'Active Goal'}
                          </Badge>
                        )}
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
