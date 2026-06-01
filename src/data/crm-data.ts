import type {
  CustomerAccount,
  SubscriptionPlan,
  Invoice,
  Communication,
  EmailTemplate,
  Task,
  Activity,
  CRMStats,
  PaymentHistory,
  Deal
} from "@/types/crm";

// Subscription Plans
export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "plan_free",
    name: "Free Trial",
    tier: "free",
    price: 0,
    billingCycle: "monthly",
    features: ["5 biomarker tracking", "Basic reports", "Email support"],
    biomarkerLimit: 5,
    isActive: true
  },
  {
    id: "plan_basic",
    name: "Basic",
    tier: "basic",
    price: 29,
    billingCycle: "monthly",
    features: ["20 biomarker tracking", "Trend analysis", "PDF reports", "Email support"],
    biomarkerLimit: 20,
    isActive: true
  },
  {
    id: "plan_premium",
    name: "Premium",
    tier: "premium",
    price: 79,
    billingCycle: "monthly",
    features: ["Unlimited biomarkers", "AI insights", "Priority support", "API access", "Custom reports"],
    biomarkerLimit: -1,
    isActive: true
  },
  {
    id: "plan_enterprise",
    name: "Enterprise",
    tier: "enterprise",
    price: 199,
    billingCycle: "monthly",
    features: ["Everything in Premium", "Dedicated account manager", "Custom integrations", "SLA guarantee", "Training sessions"],
    biomarkerLimit: -1,
    isActive: true
  }
];

// Customer Accounts
export const customerAccounts: CustomerAccount[] = [
  {
    id: "cust_1",
    userId: "user_1",
    phone: "+61 412 345 678",
    address: "123 Health Street",
    city: "Sydney",
    state: "NSW",
    postalCode: "2000",
    country: "Australia",
    status: "active",
    tier: "premium",
    assignedTo: "admin_1",
    tags: ["high-value", "engaged", "referral-program"],
    source: "Google Ads",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-03-01T14:30:00Z",
    lastContactedAt: "2024-03-01T14:30:00Z",
    lifetimeValue: 948,
    notes: "Very engaged customer, interested in enterprise features for family."
  },
  {
    id: "cust_2",
    userId: "user_2",
    companyName: "Chen Wellness Co",
    industry: "Healthcare",
    website: "https://chenwellness.com.au",
    phone: "+61 423 456 789",
    address: "456 Wellness Ave",
    city: "Melbourne",
    state: "VIC",
    postalCode: "3000",
    country: "Australia",
    status: "active",
    tier: "enterprise",
    assignedTo: "admin_1",
    tags: ["enterprise", "multi-user", "partner"],
    source: "Referral",
    createdAt: "2024-02-20T14:30:00Z",
    updatedAt: "2024-03-05T09:00:00Z",
    lastContactedAt: "2024-03-05T09:00:00Z",
    lifetimeValue: 2388,
    notes: "Business account with 5 team members. Potential for expansion."
  },
  {
    id: "cust_3",
    userId: "user_3",
    phone: "+61 434 567 890",
    city: "Brisbane",
    state: "QLD",
    postalCode: "4000",
    country: "Australia",
    status: "active",
    tier: "basic",
    tags: ["new-customer"],
    source: "Organic Search",
    createdAt: "2024-03-01T08:00:00Z",
    updatedAt: "2024-03-01T08:00:00Z",
    lifetimeValue: 29,
    notes: "New customer, onboarding in progress."
  },
  {
    id: "cust_4",
    userId: "user_4",
    phone: "+61 445 678 901",
    city: "Perth",
    state: "WA",
    postalCode: "6000",
    country: "Australia",
    status: "churned",
    tier: "basic",
    tags: ["churned", "price-sensitive"],
    source: "Facebook Ads",
    createdAt: "2023-10-15T10:00:00Z",
    updatedAt: "2024-02-15T10:00:00Z",
    lastContactedAt: "2024-02-10T10:00:00Z",
    lifetimeValue: 145,
    notes: "Cancelled due to budget constraints. Consider win-back campaign."
  },
  {
    id: "cust_5",
    userId: "user_5",
    phone: "+61 456 789 012",
    city: "Adelaide",
    state: "SA",
    postalCode: "5000",
    country: "Australia",
    status: "pending",
    tier: "free",
    tags: ["trial", "lead"],
    source: "Webinar",
    createdAt: "2024-03-10T12:00:00Z",
    updatedAt: "2024-03-10T12:00:00Z",
    lifetimeValue: 0,
    notes: "Signed up after webinar. Follow up for conversion."
  }
];

// Invoices
export const invoices: Invoice[] = [
  {
    id: "inv_001",
    customerId: "cust_1",
    planId: "plan_premium",
    amount: 79,
    tax: 7.9,
    total: 86.9,
    status: "paid",
    paymentMethod: "card",
    dueDate: "2024-03-15",
    paidAt: "2024-03-10T10:30:00Z",
    createdAt: "2024-03-01T00:00:00Z",
    items: [{ description: "Premium Plan - March 2024", quantity: 1, unitPrice: 79, total: 79 }]
  },
  {
    id: "inv_002",
    customerId: "cust_2",
    planId: "plan_enterprise",
    amount: 199,
    tax: 19.9,
    total: 218.9,
    status: "paid",
    paymentMethod: "bank_transfer",
    dueDate: "2024-03-15",
    paidAt: "2024-03-12T14:00:00Z",
    createdAt: "2024-03-01T00:00:00Z",
    items: [{ description: "Enterprise Plan - March 2024", quantity: 1, unitPrice: 199, total: 199 }]
  },
  {
    id: "inv_003",
    customerId: "cust_3",
    planId: "plan_basic",
    amount: 29,
    tax: 2.9,
    total: 31.9,
    status: "pending",
    dueDate: "2024-03-20",
    createdAt: "2024-03-05T00:00:00Z",
    items: [{ description: "Basic Plan - March 2024", quantity: 1, unitPrice: 29, total: 29 }]
  },
  {
    id: "inv_004",
    customerId: "cust_1",
    planId: "plan_premium",
    amount: 79,
    tax: 7.9,
    total: 86.9,
    status: "paid",
    paymentMethod: "card",
    dueDate: "2024-02-15",
    paidAt: "2024-02-14T09:00:00Z",
    createdAt: "2024-02-01T00:00:00Z",
    items: [{ description: "Premium Plan - February 2024", quantity: 1, unitPrice: 79, total: 79 }]
  }
];

// Payment History
export const paymentHistory: PaymentHistory[] = [
  {
    id: "pay_001",
    customerId: "cust_1",
    invoiceId: "inv_001",
    amount: 86.9,
    status: "paid",
    paymentMethod: "card",
    transactionId: "txn_abc123",
    createdAt: "2024-03-10T10:30:00Z"
  },
  {
    id: "pay_002",
    customerId: "cust_2",
    invoiceId: "inv_002",
    amount: 218.9,
    status: "paid",
    paymentMethod: "bank_transfer",
    transactionId: "txn_def456",
    createdAt: "2024-03-12T14:00:00Z"
  }
];

// Communications
export const communications: Communication[] = [
  {
    id: "comm_1",
    customerId: "cust_1",
    type: "email",
    subject: "Welcome to Sanative Premium!",
    content: "Thank you for upgrading to Premium. Here's what you can do now...",
    status: "completed",
    direction: "outbound",
    createdBy: "admin_1",
    createdAt: "2024-01-15T10:30:00Z",
    completedAt: "2024-01-15T10:30:00Z"
  },
  {
    id: "comm_2",
    customerId: "cust_1",
    type: "phone",
    subject: "Onboarding Call",
    content: "Discussed features and setup. Customer very happy with the platform.",
    status: "completed",
    direction: "outbound",
    createdBy: "admin_1",
    createdAt: "2024-01-20T14:00:00Z",
    completedAt: "2024-01-20T14:30:00Z"
  },
  {
    id: "comm_3",
    customerId: "cust_2",
    type: "meeting",
    subject: "Enterprise Demo",
    content: "Presented enterprise features to the team. They want to proceed.",
    status: "completed",
    direction: "outbound",
    createdBy: "admin_1",
    createdAt: "2024-02-15T10:00:00Z",
    completedAt: "2024-02-15T11:00:00Z"
  },
  {
    id: "comm_4",
    customerId: "cust_3",
    type: "email",
    subject: "Getting Started Guide",
    content: "Here's your personalized getting started guide...",
    status: "completed",
    direction: "outbound",
    createdBy: "admin_1",
    createdAt: "2024-03-01T09:00:00Z",
    completedAt: "2024-03-01T09:00:00Z"
  },
  {
    id: "comm_5",
    customerId: "cust_5",
    type: "email",
    subject: "Follow-up: Trial Experience",
    content: "Checking in on your trial experience...",
    status: "scheduled",
    direction: "outbound",
    createdBy: "admin_1",
    createdAt: "2024-03-10T12:00:00Z",
    scheduledAt: "2024-03-15T09:00:00Z"
  },
  {
    id: "comm_6",
    customerId: "cust_4",
    type: "email",
    subject: "We Miss You! Special Offer Inside",
    content: "Win-back email with 30% discount offer.",
    status: "scheduled",
    direction: "outbound",
    createdBy: "admin_1",
    createdAt: "2024-03-05T10:00:00Z",
    scheduledAt: "2024-03-12T10:00:00Z"
  }
];

// Email Templates
export const emailTemplates: EmailTemplate[] = [
  {
    id: "tpl_1",
    name: "Welcome Email",
    subject: "Welcome to Sanative, {{firstName}}!",
    body: "Hi {{firstName}},\n\nWelcome to Sanative! We're excited to have you on board.\n\nYour {{planName}} plan is now active. Here's what you can do:\n\n{{features}}\n\nIf you have any questions, reply to this email or visit our help center.\n\nBest regards,\nThe Sanative Team",
    category: "onboarding",
    variables: ["firstName", "planName", "features"],
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "tpl_2",
    name: "Payment Received",
    subject: "Payment Confirmation - Invoice #{{invoiceNumber}}",
    body: "Hi {{firstName}},\n\nThank you for your payment of ${{amount}}.\n\nInvoice: #{{invoiceNumber}}\nDate: {{date}}\nPlan: {{planName}}\n\nYou can download your invoice from your account settings.\n\nThank you for being a valued customer!\n\nBest regards,\nThe Sanative Team",
    category: "billing",
    variables: ["firstName", "amount", "invoiceNumber", "date", "planName"],
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "tpl_3",
    name: "Payment Failed",
    subject: "Action Required: Payment Failed",
    body: "Hi {{firstName}},\n\nWe were unable to process your payment of ${{amount}} for your {{planName}} subscription.\n\nPlease update your payment method to avoid service interruption.\n\nUpdate Payment: {{updateLink}}\n\nIf you need assistance, please contact our support team.\n\nBest regards,\nThe Sanative Team",
    category: "billing",
    variables: ["firstName", "amount", "planName", "updateLink"],
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "tpl_4",
    name: "Trial Ending Soon",
    subject: "Your trial ends in {{daysLeft}} days",
    body: "Hi {{firstName}},\n\nYour free trial ends in {{daysLeft}} days. Don't lose access to:\n\n{{features}}\n\nUpgrade now to continue tracking your health biomarkers.\n\nUpgrade: {{upgradeLink}}\n\nBest regards,\nThe Sanative Team",
    category: "retention",
    variables: ["firstName", "daysLeft", "features", "upgradeLink"],
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "tpl_5",
    name: "Win-Back Offer",
    subject: "We miss you, {{firstName}}! Here's {{discount}}% off",
    body: "Hi {{firstName}},\n\nWe noticed you haven't been around lately, and we miss you!\n\nAs a special offer, we'd like to give you {{discount}}% off your next {{months}} months.\n\nUse code: {{promoCode}}\n\nCome back and continue your health journey with us.\n\nBest regards,\nThe Sanative Team",
    category: "retention",
    variables: ["firstName", "discount", "months", "promoCode"],
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  }
];

// Tasks
export const tasks: Task[] = [
  {
    id: "task_1",
    customerId: "cust_5",
    title: "Follow up on trial conversion",
    description: "Call to discuss upgrade options after webinar signup",
    priority: "high",
    status: "pending",
    dueDate: "2024-03-15",
    assignedTo: "admin_1",
    createdBy: "admin_1",
    createdAt: "2024-03-10T12:00:00Z"
  },
  {
    id: "task_2",
    customerId: "cust_4",
    title: "Win-back campaign",
    description: "Send personalized offer to churned customer",
    priority: "medium",
    status: "in_progress",
    dueDate: "2024-03-12",
    assignedTo: "admin_1",
    createdBy: "admin_1",
    createdAt: "2024-03-05T10:00:00Z"
  },
  {
    id: "task_3",
    customerId: "cust_2",
    title: "Quarterly business review",
    description: "Schedule QBR meeting with Chen Wellness team",
    priority: "medium",
    status: "pending",
    dueDate: "2024-03-30",
    assignedTo: "admin_1",
    createdBy: "admin_1",
    createdAt: "2024-03-01T09:00:00Z"
  },
  {
    id: "task_4",
    title: "Update email templates",
    description: "Review and update onboarding email sequence",
    priority: "low",
    status: "pending",
    dueDate: "2024-03-20",
    assignedTo: "admin_1",
    createdBy: "admin_1",
    createdAt: "2024-03-01T09:00:00Z"
  },
  {
    id: "task_5",
    customerId: "cust_3",
    title: "Payment follow-up",
    description: "Pending invoice - follow up on payment",
    priority: "high",
    status: "pending",
    dueDate: "2024-03-21",
    assignedTo: "admin_1",
    createdBy: "admin_1",
    createdAt: "2024-03-06T09:00:00Z"
  }
];

// Activities
export const activities: Activity[] = [
  {
    id: "act_1",
    customerId: "cust_1",
    type: "payment",
    description: "Payment of $86.90 received",
    metadata: { amount: 86.9, invoiceId: "inv_001" },
    createdBy: "system",
    createdAt: "2024-03-10T10:30:00Z"
  },
  {
    id: "act_2",
    customerId: "cust_1",
    type: "login",
    description: "Customer logged in",
    createdBy: "system",
    createdAt: "2024-03-10T08:00:00Z"
  },
  {
    id: "act_3",
    customerId: "cust_2",
    type: "status_change",
    description: "Upgraded from Premium to Enterprise",
    metadata: { from: "premium", to: "enterprise" },
    createdBy: "admin_1",
    createdAt: "2024-02-20T14:30:00Z"
  },
  {
    id: "act_4",
    customerId: "cust_3",
    type: "note",
    description: "New customer onboarding started",
    createdBy: "admin_1",
    createdAt: "2024-03-01T08:30:00Z"
  },
  {
    id: "act_5",
    customerId: "cust_4",
    type: "status_change",
    description: "Customer churned - cancelled subscription",
    metadata: { reason: "Budget constraints" },
    createdBy: "system",
    createdAt: "2024-02-15T10:00:00Z"
  }
];

// Deals for Sales Pipeline
export const deals: Deal[] = [
  {
    id: "deal_1",
    customerId: "cust_5",
    title: "Trial to Premium Conversion",
    value: 948,
    stage: "qualified",
    probability: 60,
    expectedCloseDate: "2024-03-20",
    assignedTo: "admin_1",
    notes: "Interested after webinar, needs follow-up call",
    createdAt: "2024-03-10T12:00:00Z",
    updatedAt: "2024-03-10T12:00:00Z"
  },
  {
    id: "deal_2",
    customerId: "cust_2",
    title: "Enterprise Expansion - 10 Users",
    value: 23880,
    stage: "proposal",
    probability: 75,
    expectedCloseDate: "2024-04-01",
    assignedTo: "admin_1",
    notes: "Chen Wellness wants to expand to 10 team members",
    createdAt: "2024-02-25T10:00:00Z",
    updatedAt: "2024-03-05T14:00:00Z"
  },
  {
    id: "deal_3",
    customerId: "cust_4",
    title: "Win-back: Premium Plan",
    value: 948,
    stage: "lead",
    probability: 25,
    expectedCloseDate: "2024-03-30",
    assignedTo: "admin_1",
    notes: "Churned customer, sent win-back offer",
    createdAt: "2024-03-05T10:00:00Z",
    updatedAt: "2024-03-05T10:00:00Z"
  },
  {
    id: "deal_4",
    customerId: "cust_3",
    title: "Basic to Premium Upgrade",
    value: 600,
    stage: "negotiation",
    probability: 80,
    expectedCloseDate: "2024-03-15",
    assignedTo: "admin_1",
    notes: "Customer interested in AI insights feature",
    createdAt: "2024-03-01T09:00:00Z",
    updatedAt: "2024-03-08T11:00:00Z"
  },
  {
    id: "deal_5",
    customerId: "cust_1",
    title: "Annual Plan Conversion",
    value: 853,
    stage: "closed_won",
    probability: 100,
    expectedCloseDate: "2024-02-28",
    assignedTo: "admin_1",
    notes: "Converted to annual plan with 10% discount",
    createdAt: "2024-02-15T10:00:00Z",
    updatedAt: "2024-02-28T14:00:00Z"
  },
  {
    id: "deal_6",
    customerId: "cust_4",
    title: "Previous Enterprise Deal",
    value: 2388,
    stage: "closed_lost",
    probability: 0,
    expectedCloseDate: "2024-02-15",
    assignedTo: "admin_1",
    notes: "Lost due to budget constraints",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-02-15T10:00:00Z"
  }
];

// CRM Stats
export const getCRMStats = (): CRMStats => {
  const activeCustomers = customerAccounts.filter(c => c.status === "active").length;
  const mrr = customerAccounts
    .filter(c => c.status === "active")
    .reduce((sum, c) => {
      const plan = subscriptionPlans.find(p => p.tier === c.tier);
      return sum + (plan?.price || 0);
    }, 0);

  return {
    totalCustomers: customerAccounts.length,
    activeCustomers,
    newCustomersThisMonth: customerAccounts.filter(c =>
      new Date(c.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length,
    churnedThisMonth: customerAccounts.filter(c =>
      c.status === "churned" &&
      new Date(c.updatedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length,
    monthlyRecurringRevenue: mrr,
    averageLifetimeValue: customerAccounts.reduce((sum, c) => sum + c.lifetimeValue, 0) / customerAccounts.length,
    openTasks: tasks.filter(t => t.status === "pending" || t.status === "in_progress").length,
    overduePayments: invoices.filter(i => i.status === "pending" && new Date(i.dueDate) < new Date()).length
  };
};

// Helper function to get deals by stage
export function getDealsByStage(stage: string): Deal[] {
  return deals.filter(d => d.stage === stage);
}

// Helper function to get pipeline stats
export function getPipelineStats() {
  const stages = ["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"];
  const openStages = ["lead", "qualified", "proposal", "negotiation"];

  const pipelineValue = deals
    .filter(d => openStages.includes(d.stage))
    .reduce((sum, d) => sum + d.value, 0);

  const weightedValue = deals
    .filter(d => openStages.includes(d.stage))
    .reduce((sum, d) => sum + (d.value * d.probability / 100), 0);

  const wonValue = deals
    .filter(d => d.stage === "closed_won")
    .reduce((sum, d) => sum + d.value, 0);

  const lostValue = deals
    .filter(d => d.stage === "closed_lost")
    .reduce((sum, d) => sum + d.value, 0);

  return {
    totalDeals: deals.length,
    openDeals: deals.filter(d => openStages.includes(d.stage)).length,
    pipelineValue,
    weightedValue: Math.round(weightedValue),
    wonValue,
    lostValue,
    winRate: Math.round((deals.filter(d => d.stage === "closed_won").length /
      (deals.filter(d => d.stage === "closed_won" || d.stage === "closed_lost").length || 1)) * 100)
  };
}

// Helper functions
export function getCustomerById(id: string): CustomerAccount | undefined {
  return customerAccounts.find(c => c.id === id);
}

export function getCustomerCommunications(customerId: string): Communication[] {
  return communications.filter(c => c.customerId === customerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getCustomerInvoices(customerId: string): Invoice[] {
  return invoices.filter(i => i.customerId === customerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getCustomerActivities(customerId: string): Activity[] {
  return activities.filter(a => a.customerId === customerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getCustomerTasks(customerId: string): Task[] {
  return tasks.filter(t => t.customerId === customerId)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}
