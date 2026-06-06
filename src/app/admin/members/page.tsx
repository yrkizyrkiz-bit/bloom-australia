"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  Eye,
  Upload,
  Mail,
  Calendar,
  FlaskConical,
  Loader2,
  RefreshCw,
  Users
} from "lucide-react";
import Link from "next/link";

interface Member {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gender: string;
  role: string;
  subscriptionStatus: string;
  createdAt: string;
  _count?: {
    biomarkerResults: number;
    healthGoals: number;
    labReports: number;
  };
}

export default function AdminMembersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/users?role=MEMBER");
      if (!response.ok) throw new Error("Failed to fetch members");
      const data = await response.json();
      setMembers(data.users || []);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const filteredMembers = members.filter(member => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      member.firstName.toLowerCase().includes(query) ||
      member.lastName.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-foreground">
            Members
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage member accounts and view their biomarker data
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchMembers}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-serif font-bold">{members.length}</p>
              <p className="text-xs text-muted-foreground">Total Members</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-serif font-bold">
                {members.filter(m => m.subscriptionStatus === "ACTIVE").length}
              </p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search members by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Biomarkers</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => {
                const initials = `${member.firstName.charAt(0)}${member.lastName.charAt(0)}`.toUpperCase();
                const biomarkerCount = member._count?.biomarkerResults || 0;

                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.firstName} {member.lastName}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          member.subscriptionStatus === "ACTIVE"
                            ? "bg-green-500/10 text-green-600"
                            : "bg-yellow-500/10 text-yellow-600"
                        }
                      >
                        {member.subscriptionStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{biomarkerCount} results</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(member.createdAt).toLocaleDateString('en-AU', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedMember(member)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Member Details</DialogTitle>
                            </DialogHeader>
                            {selectedMember && (
                              <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                  <Avatar className="w-16 h-16">
                                    <AvatarFallback className="text-xl bg-primary/10 text-primary">
                                      {`${selectedMember.firstName.charAt(0)}${selectedMember.lastName.charAt(0)}`}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h3 className="text-lg font-medium">
                                      {selectedMember.firstName} {selectedMember.lastName}
                                    </h3>
                                    <Badge
                                      variant="secondary"
                                      className={
                                        selectedMember.subscriptionStatus === "ACTIVE"
                                          ? "bg-green-500/10 text-green-600"
                                          : "bg-yellow-500/10 text-yellow-600"
                                      }
                                    >
                                      {selectedMember.subscriptionStatus}
                                    </Badge>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                    <span>{selectedMember.email}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    <span>DOB: {selectedMember.dateOfBirth ? new Date(selectedMember.dateOfBirth).toLocaleDateString() : 'Not set'}</span>
                                  </div>
                                </div>

                                <div className="p-4 rounded-lg bg-muted/50">
                                  <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <FlaskConical className="w-4 h-4" />
                                    Biomarker Summary
                                  </h4>
                                  <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                      <p className="text-2xl font-serif font-bold text-foreground">
                                        {selectedMember._count?.biomarkerResults || 0}
                                      </p>
                                      <p className="text-xs text-muted-foreground">Results</p>
                                    </div>
                                    <div>
                                      <p className="text-2xl font-serif font-bold text-foreground">
                                        {selectedMember._count?.healthGoals || 0}
                                      </p>
                                      <p className="text-xs text-muted-foreground">Goals</p>
                                    </div>
                                    <div>
                                      <p className="text-2xl font-serif font-bold text-foreground">
                                        {selectedMember._count?.labReports || 0}
                                      </p>
                                      <p className="text-xs text-muted-foreground">Reports</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  <Link href={`/admin/upload?member=${selectedMember.id}`} className="flex-1">
                                    <Button className="w-full">
                                      <Upload className="w-4 h-4 mr-2" />
                                      Upload Results
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Link href={`/admin/upload?member=${member.id}`}>
                          <Button size="sm">
                            <Upload className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filteredMembers.length === 0 && !isLoading && (
        <Card className="py-12">
          <CardContent className="text-center">
            <p className="text-muted-foreground">No members found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
