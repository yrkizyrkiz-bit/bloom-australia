"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
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

interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  address: string | null;
  dateOfBirth: string | null;
  gender: string;
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [programFilter, setProgramFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "created" | "results">("created");
  const [sendingBulkEmails, setSendingBulkEmails] = useState(false);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/users?role=MEMBER&limit=100");
      if (!response.ok) throw new Error("Failed to fetch customers");
      const data = await response.json();
      setCustomers(data.users || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers
      .filter(customer => {
        const matchesSearch = searchQuery === "" ||
          customer.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.email.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "all" ||
          customer.subscriptionStatus.toLowerCase() === statusFilter.toLowerCase() ||
          // "incomplete" = INACTIVE with a subscription tier (started but didn't pay)
          (statusFilter === "incomplete" &&
           customer.subscriptionStatus === "INACTIVE" &&
           customer.subscriptionTier &&
           customer.subscriptionTier !== "free");

        const matchesTier = tierFilter === "all" ||
          (customer.subscriptionTier?.toLowerCase() || "free") === tierFilter.toLowerCase();

        const matchesProgram = programFilter === "all" ||
          (customer.subscriptionTier?.toLowerCase() || "") === programFilter.toLowerCase();

        return matchesSearch && matchesStatus && matchesTier && matchesProgram;
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
  }, [customers, searchQuery, statusFilter, tierFilter, programFilter, sortBy]);

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    const styles: Record<string, string> = {
      active: "bg-green-500/10 text-green-600 border-green-500/30",
      inactive: "bg-gray-500/10 text-gray-600 border-gray-500/30",
      trial: "bg-blue-500/10 text-blue-600 border-blue-500/30",
      cancelled: "bg-red-500/10 text-red-600 border-red-500/30",
      expired: "bg-orange-500/10 text-orange-600 border-orange-500/30"
    };
    return <Badge variant="outline" className={styles[statusLower] || styles.inactive}>{status}</Badge>;
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
    const incompleteCustomers = filteredCustomers.filter(c =>
      c.subscriptionStatus === "INACTIVE" && c.subscriptionTier && c.subscriptionTier !== "free"
    );

    if (incompleteCustomers.length === 0) {
      toast.error("No incomplete customers to email");
      return;
    }

    if (!confirm(`Send recovery emails to ${incompleteCustomers.length} customers?`)) {
      return;
    }

    setSendingBulkEmails(true);
    let sent = 0;
    let failed = 0;

    for (const customer of incompleteCustomers) {
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
    active: customers.filter(c => c.subscriptionStatus === "ACTIVE").length,
    trial: customers.filter(c => c.subscriptionStatus === "TRIAL").length,
    inactive: customers.filter(c => ["INACTIVE", "CANCELLED", "EXPIRED"].includes(c.subscriptionStatus)).length,
    // Incomplete = INACTIVE with a subscription tier (started quiz but didn't pay)
    incomplete: customers.filter(c =>
      c.subscriptionStatus === "INACTIVE" &&
      c.subscriptionTier &&
      c.subscriptionTier !== "free"
    ).length,
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
          <p className="text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-foreground">Customers</h1>
          <p className="text-muted-foreground mt-1">{customers.length} total customers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchCustomers}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Link href="/admin/crm/customers/new">
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" />
              Add Customer
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => setStatusFilter("all")}>
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
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => setStatusFilter("active")}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-serif font-bold text-green-600">{stats.active}</p>
              </div>
              {getStatusBadge("active")}
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => setStatusFilter("trial")}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Trial</p>
                <p className="text-2xl font-serif font-bold text-blue-600">{stats.trial}</p>
              </div>
              {getStatusBadge("trial")}
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => setStatusFilter("inactive")}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inactive</p>
                <p className="text-2xl font-serif font-bold text-gray-600">{stats.inactive}</p>
              </div>
              {getStatusBadge("inactive")}
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-amber-500/50 border-amber-200 bg-amber-50/30" onClick={() => setStatusFilter("incomplete")}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700">Incomplete</p>
                <p className="text-2xl font-serif font-bold text-amber-600">{stats.incomplete}</p>
              </div>
              <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">No Payment</Badge>
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
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="incomplete">Incomplete (No Payment)</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
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
      {statusFilter === "incomplete" && stats.incomplete > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-amber-900">
                    {stats.incomplete} customers haven't completed payment
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

      {/* Customer List */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tier</TableHead>
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
                    <TableCell>{getStatusBadge(customer.subscriptionStatus)}</TableCell>
                    <TableCell>{getTierBadge(customer.subscriptionTier)}</TableCell>
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
                          {customer.subscriptionStatus === "INACTIVE" && customer.subscriptionTier && (
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
              <p>No customers found</p>
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
