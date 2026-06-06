"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  UserPlus,
  Mail,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ArrowUpDown,
  Loader2,
  RefreshCw,
  Upload
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  MEMBER_STATUS_BADGE_STYLES,
  MEMBER_STATUS_LABELS,
  type PortalMemberStatus,
  formatMemberStatus,
  isPortalMemberStatus,
} from "@/lib/member-status";

interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  address: string | null;
  dateOfBirth: string | null;
  gender: string;
  memberStatus: PortalMemberStatus;
  subscriptionStatus: string;
  subscriptionTier: string | null;
  journeyStatus?: string;
  createdAt: string;
  _count?: {
    biomarkerResults: number;
    healthGoals: number;
    labReports: number;
  };
}

const PROGRAM_LABELS: Record<string, { label: string; color: string; bgColor: string }> = {
  weight_management: { label: "Weight", color: "text-green-700", bgColor: "bg-green-50 border-green-200" },
  womens_health: { label: "Women's", color: "text-rose-700", bgColor: "bg-rose-50 border-rose-200" },
  mens_health: { label: "Men's", color: "text-blue-700", bgColor: "bg-blue-50 border-blue-200" },
  hair_loss: { label: "Hair", color: "text-amber-700", bgColor: "bg-amber-50 border-amber-200" },
  fatty_liver: { label: "Liver", color: "text-orange-700", bgColor: "bg-orange-50 border-orange-200" },
  biomarker: { label: "Biomarker", color: "text-purple-700", bgColor: "bg-purple-50 border-purple-200" },
};

export default function CustomersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <MembersPageContent />
    </Suspense>
  );
}

function MembersPageContent() {
  const searchParams = useSearchParams();
  const initialMemberStatus = searchParams.get("memberStatus");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [memberStatusFilter, setMemberStatusFilter] = useState<string>(
    initialMemberStatus && isPortalMemberStatus(initialMemberStatus)
      ? initialMemberStatus
      : "all"
  );
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [programFilter, setProgramFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "created" | "results">("created");
  const [sendingBulkEmails, setSendingBulkEmails] = useState(false);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/users?role=MEMBER&limit=100");
      if (!response.ok) throw new Error("Failed to fetch members");
      const data = await response.json();
      setCustomers(
        (data.users || []).map((user: Customer) => ({
          ...user,
          memberStatus: user.memberStatus || "POTENTIAL_MEMBER",
        }))
      );
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Failed to load members");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (initialMemberStatus && isPortalMemberStatus(initialMemberStatus)) {
      setMemberStatusFilter(initialMemberStatus);
    }
  }, [initialMemberStatus]);

  const filteredCustomers = useMemo(() => {
    return customers
      .filter(customer => {
        const matchesSearch = searchQuery === "" ||
          customer.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.email.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesMemberStatus = memberStatusFilter === "all" ||
          customer.memberStatus === memberStatusFilter;

        const matchesTier = tierFilter === "all" ||
          (customer.subscriptionTier?.toLowerCase() || "free") === tierFilter.toLowerCase();

        const matchesProgram = programFilter === "all" ||
          (customer.subscriptionTier?.toLowerCase() || "") === programFilter.toLowerCase();

        return matchesSearch && matchesMemberStatus && matchesTier && matchesProgram;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "name":
            return a.firstName.localeCompare(b.firstName);
          case "results":
            return (b._count?.biomarkerResults || 0) - (a._count?.biomarkerResults || 0);
          default:
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
  }, [customers, searchQuery, memberStatusFilter, tierFilter, programFilter, sortBy]);

  const getMemberStatusBadge = (status: PortalMemberStatus | string) => {
    const normalized = isPortalMemberStatus(status) ? status : "POTENTIAL_MEMBER";
    return (
      <Badge variant="outline" className={MEMBER_STATUS_BADGE_STYLES[normalized]}>
        {formatMemberStatus(normalized)}
      </Badge>
    );
  };

  const getSubscriptionBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    const styles: Record<string, string> = {
      active: "bg-green-500/10 text-green-600 border-green-500/30",
      inactive: "bg-gray-500/10 text-gray-600 border-gray-500/30",
      trial: "bg-blue-500/10 text-blue-600 border-blue-500/30",
      cancelled: "bg-red-500/10 text-red-600 border-red-500/30",
      expired: "bg-orange-500/10 text-orange-600 border-orange-500/30",
    };
    return (
      <Badge variant="outline" className={styles[statusLower] || styles.inactive}>
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  const getTierBadge = (tier: string | null) => {
    const tierLower = (tier || "free").toLowerCase();
    const styles: Record<string, string> = {
      free: "bg-gray-500/10 text-gray-600",
      basic: "bg-blue-500/10 text-blue-600",
      premium: "bg-purple-500/10 text-purple-600",
      enterprise: "bg-orange-500/10 text-orange-600"
    };
    return <Badge className={styles[tierLower] || styles.free}>{tier || "free"}</Badge>;
  };

  const getProgramBadge = (tier: string | null) => {
    const tierLower = (tier || "").toLowerCase().replace(/-/g, "_");
    const programInfo = PROGRAM_LABELS[tierLower];

    if (!programInfo) {
      return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">General</Badge>;
    }

    return (
      <Badge variant="outline" className={`${programInfo.bgColor} ${programInfo.color}`}>
        {programInfo.label}
      </Badge>
    );
  };

  const handleDelete = async (customerId: string, customerName: string) => {
    if (!confirm(`Are you sure you want to delete ${customerName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${customerId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete customer");
      }

      toast.success("Customer deleted successfully");
      fetchCustomers();
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete customer");
    }
  };

  const handleSendRecoveryEmail = async (customer: Customer) => {
    try {
      const response = await fetch("/api/email/abandoned-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: customer.id, includeDiscount: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send recovery email");
      }

      toast.success("Recovery email sent!", {
        description: `Sent to ${customer.email} with discount code ${data.discountCode}`,
      });
    } catch (error) {
      console.error("Error sending recovery email:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send email");
    }
  };

  const handleSendBulkRecoveryEmails = async () => {
    const potentialMembers = filteredCustomers.filter(c => c.memberStatus === "POTENTIAL_MEMBER");

    if (potentialMembers.length === 0) {
      toast.error("No potential members to email");
      return;
    }

    if (!confirm(`Send recovery emails to ${potentialMembers.length} potential members?`)) {
      return;
    }

    setSendingBulkEmails(true);
    let sent = 0;
    let failed = 0;

    for (const customer of potentialMembers) {
      try {
        const response = await fetch("/api/email/abandoned-cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: customer.id, includeDiscount: true }),
        });

        if (response.ok) {
          sent++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    setSendingBulkEmails(false);
    toast.success(`Sent ${sent} recovery emails`, {
      description: failed > 0 ? `${failed} failed to send` : undefined,
    });
  };

  // Calculate stats
  const stats = useMemo(() => ({
    total: customers.length,
    potential: customers.filter(c => c.memberStatus === "POTENTIAL_MEMBER").length,
    members: customers.filter(c => c.memberStatus === "MEMBER").length,
    cancelled: customers.filter(c => c.memberStatus === "CANCELLED").length,
  }), [customers]);

  // Calculate program stats
  const programStats = useMemo(() => ({
    weight: customers.filter(c => c.subscriptionTier?.toLowerCase() === "weight_management").length,
    womens: customers.filter(c => c.subscriptionTier?.toLowerCase() === "womens_health").length,
    mens: customers.filter(c => c.subscriptionTier?.toLowerCase() === "mens_health").length,
    hair: customers.filter(c => c.subscriptionTier?.toLowerCase() === "hair_loss").length,
    liver: customers.filter(c => c.subscriptionTier?.toLowerCase() === "fatty_liver").length,
  }), [customers]);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-foreground">Members</h1>
          <p className="text-muted-foreground mt-1">{customers.length} total records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchCustomers}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Link href="/admin/crm/customers/new">
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" />
              Add Member
            </Button>
          </Link>
        </div>
      </div>

      {/* Member Status Cards */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card
          className={`cursor-pointer hover:border-primary/50 ${memberStatusFilter === "all" ? "border-primary ring-1 ring-primary/20" : ""}`}
          onClick={() => setMemberStatusFilter("all")}
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-serif font-bold">{stats.total}</p>
              </div>
              <Badge variant="outline">All</Badge>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer hover:border-amber-500/50 ${memberStatusFilter === "POTENTIAL_MEMBER" ? "border-amber-500 ring-1 ring-amber-500/20 bg-amber-50/30" : "border-amber-200 bg-amber-50/20"}`}
          onClick={() => setMemberStatusFilter("POTENTIAL_MEMBER")}
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700">Potential Members</p>
                <p className="text-2xl font-serif font-bold text-amber-600">{stats.potential}</p>
              </div>
              {getMemberStatusBadge("POTENTIAL_MEMBER")}
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer hover:border-green-500/50 ${memberStatusFilter === "MEMBER" ? "border-green-500 ring-1 ring-green-500/20" : ""}`}
          onClick={() => setMemberStatusFilter("MEMBER")}
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Members</p>
                <p className="text-2xl font-serif font-bold text-green-600">{stats.members}</p>
              </div>
              {getMemberStatusBadge("MEMBER")}
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer hover:border-red-500/50 ${memberStatusFilter === "CANCELLED" ? "border-red-500 ring-1 ring-red-500/20" : ""}`}
          onClick={() => setMemberStatusFilter("CANCELLED")}
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cancelled</p>
                <p className="text-2xl font-serif font-bold text-red-600">{stats.cancelled}</p>
              </div>
              {getMemberStatusBadge("CANCELLED")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Program Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="cursor-pointer hover:border-green-500/50" onClick={() => setProgramFilter("weight_management")}>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Weight</p>
                <p className="text-lg font-bold text-green-700">{programStats.weight}</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-rose-500/50" onClick={() => setProgramFilter("womens_health")}>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Women's</p>
                <p className="text-lg font-bold text-rose-700">{programStats.womens}</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-rose-500"></div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-blue-500/50" onClick={() => setProgramFilter("mens_health")}>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Men's</p>
                <p className="text-lg font-bold text-blue-700">{programStats.mens}</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-amber-500/50" onClick={() => setProgramFilter("hair_loss")}>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Hair</p>
                <p className="text-lg font-bold text-amber-700">{programStats.hair}</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-orange-500/50" onClick={() => setProgramFilter("fatty_liver")}>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Liver</p>
                <p className="text-lg font-bold text-orange-700">{programStats.liver}</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={memberStatusFilter} onValueChange={setMemberStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Member Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="POTENTIAL_MEMBER">{MEMBER_STATUS_LABELS.POTENTIAL_MEMBER}</SelectItem>
                <SelectItem value="MEMBER">{MEMBER_STATUS_LABELS.MEMBER}</SelectItem>
                <SelectItem value="CANCELLED">{MEMBER_STATUS_LABELS.CANCELLED}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <Select value={programFilter} onValueChange={setProgramFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                <SelectItem value="weight_management">Weight Management</SelectItem>
                <SelectItem value="womens_health">Women's Health</SelectItem>
                <SelectItem value="mens_health">Men's Health</SelectItem>
                <SelectItem value="hair_loss">Hair Loss</SelectItem>
                <SelectItem value="fatty_liver">Fatty Liver</SelectItem>
                <SelectItem value="biomarker">Biomarker</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as "name" | "created" | "results")}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">Newest First</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="results">Most Results</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Incomplete Filter Action Banner */}
      {memberStatusFilter === "POTENTIAL_MEMBER" && stats.potential > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-amber-900">
                    {stats.potential} potential members haven't completed payment
                  </p>
                  <p className="text-sm text-amber-700">
                    Send recovery emails with a $50 discount code to encourage completion
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSendBulkRecoveryEmails}
                disabled={sendingBulkEmails}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {sendingBulkEmails ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send All Recovery Emails
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Member List */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Member Status</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Results</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map(customer => {
                const initials = `${customer.firstName[0]}${customer.lastName[0]}`.toUpperCase();

                return (
                  <TableRow key={customer.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {customer.firstName} {customer.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getProgramBadge(customer.subscriptionTier)}</TableCell>
                    <TableCell>{getMemberStatusBadge(customer.memberStatus)}</TableCell>
                    <TableCell>{getSubscriptionBadge(customer.subscriptionStatus)}</TableCell>
                    <TableCell>
                      <span className="text-sm">{customer._count?.biomarkerResults || 0} results</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(customer.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/crm/customers/${customer.id}`} className="flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/upload?member=${customer.id}`} className="flex items-center gap-2">
                              <Upload className="w-4 h-4" />
                              Upload Results
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Send Email
                          </DropdownMenuItem>
                          {customer.memberStatus === "POTENTIAL_MEMBER" && customer.subscriptionTier && (
                            <DropdownMenuItem
                              className="flex items-center gap-2 text-amber-600"
                              onClick={() => handleSendRecoveryEmail(customer)}
                            >
                              <Mail className="w-4 h-4" />
                              Send Recovery Email
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="flex items-center gap-2">
                            <Edit className="w-4 h-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex items-center gap-2 text-red-600"
                            onClick={() => handleDelete(customer.id, `${customer.firstName} ${customer.lastName}`)}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No members found</p>
              <Link href="/admin/crm/customers/new">
                <Button variant="outline" className="mt-4">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add First Customer
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
