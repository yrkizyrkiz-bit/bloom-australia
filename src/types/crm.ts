// CRM Types

// Customer/Account types
export type CustomerStatus = "active" | "inactive" | "pending" | "churned";
export type CustomerTier = "free" | "basic" | "premium" | "enterprise";

export interface CustomerAccount {
  id: string;
  userId: string;
  companyName?: string;
  industry?: string;
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country: string;
  status: CustomerStatus;
  tier: CustomerTier;
  assignedTo?: string;
  tags: string[];
  source: string;
  createdAt: string;
  updatedAt: string;
  lastContactedAt?: string;
  lifetimeValue: number;
  notes?: string;
}

// Billing & Subscription
export type PaymentStatus = "paid" | "pending" | "failed" | "refunded";
export type PaymentMethod = "card" | "bank_transfer" | "paypal";

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: CustomerTier;
  price: number;
  billingCycle: "monthly" | "yearly";
  features: string[];
  biomarkerLimit: number;
  isActive: boolean;
}

export interface Invoice {
  id: string;
  customerId: string;
  planId: string;
  amount: number;
  tax: number;
  total: number;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PaymentHistory {
  id: string;
  customerId: string;
  invoiceId: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  createdAt: string;
}

// Communications
export type CommunicationType = "email" | "phone" | "meeting" | "note" | "task";
export type CommunicationStatus = "completed" | "scheduled" | "cancelled";

export interface Communication {
  id: string;
  customerId: string;
  type: CommunicationType;
  subject: string;
  content: string;
  status: CommunicationStatus;
  direction: "inbound" | "outbound";
  createdBy: string;
  createdAt: string;
  scheduledAt?: string;
  completedAt?: string;
  attachments?: string[];
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Activities & Tasks
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface Task {
  id: string;
  customerId?: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  assignedTo: string;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

export interface Activity {
  id: string;
  customerId: string;
  type: "note" | "call" | "email" | "meeting" | "status_change" | "payment" | "login";
  description: string;
  metadata?: Record<string, string | number | boolean>;
  createdBy: string;
  createdAt: string;
}

// Pipeline & Deals (optional for health business)
export type DealStage = "lead" | "qualified" | "proposal" | "negotiation" | "closed_won" | "closed_lost";

export interface Deal {
  id: string;
  customerId: string;
  title: string;
  value: number;
  stage: DealStage;
  probability: number;
  expectedCloseDate: string;
  assignedTo: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// CRM Dashboard Stats
export interface CRMStats {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  churnedThisMonth: number;
  monthlyRecurringRevenue: number;
  averageLifetimeValue: number;
  openTasks: number;
  overduePayments: number;
}
