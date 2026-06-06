"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  Zap,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Check
} from "lucide-react";
import { toast } from "sonner";

interface RecommendationTemplate {
  id: string;
  name: string;
  biomarkerId: string;
  biomarkerName: string;
  condition: "above" | "below" | "in_range" | "out_of_range";
  thresholdValue?: number;
  thresholdMax?: number;
  priority: "low" | "medium" | "high" | "critical";
  category: "lifestyle" | "diet" | "exercise" | "supplement" | "medical";
  title: string;
  recommendation: string;
  actionItems: string[];
  isActive: boolean;
  usageCount: number;
  lastTriggered?: string;
}

const mockTemplates: RecommendationTemplate[] = [
  {
    id: "rt1",
    name: "High ALT - Reduce Alcohol",
    biomarkerId: "alt",
    biomarkerName: "ALT",
    condition: "above",
    thresholdValue: 40,
    priority: "high",
    category: "lifestyle",
    title: "Reduce Alcohol Intake",
    recommendation: "Your ALT levels are elevated, which may indicate liver stress. Reducing alcohol consumption can significantly help lower these levels and improve liver function.",
    actionItems: [
      "Limit alcohol to 1-2 drinks per week",
      "Consider alcohol-free days",
      "Stay hydrated with water",
      "Monitor for improvement in 4-6 weeks"
    ],
    isActive: true,
    usageCount: 45,
    lastTriggered: "2024-01-15"
  },
  {
    id: "rt2",
    name: "High GGT - Liver Support",
    biomarkerId: "ggt",
    biomarkerName: "GGT",
    condition: "above",
    thresholdValue: 45,
    priority: "high",
    category: "supplement",
    title: "Liver Support Protocol",
    recommendation: "Elevated GGT suggests your liver may benefit from additional support. Consider liver-supporting supplements and dietary changes.",
    actionItems: [
      "Consider milk thistle supplement (150-300mg daily)",
      "Increase cruciferous vegetables",
      "Reduce processed foods",
      "Avoid unnecessary medications"
    ],
    isActive: true,
    usageCount: 38,
    lastTriggered: "2024-01-14"
  },
  {
    id: "rt3",
    name: "High Triglycerides - Diet Change",
    biomarkerId: "triglycerides",
    biomarkerName: "Triglycerides",
    condition: "above",
    thresholdValue: 150,
    priority: "medium",
    category: "diet",
    title: "Reduce Triglycerides Through Diet",
    recommendation: "High triglycerides can be effectively managed through dietary modifications. Focus on reducing refined carbs and increasing omega-3 intake.",
    actionItems: [
      "Reduce sugar and refined carbohydrates",
      "Increase fatty fish intake (2-3 times/week)",
      "Add omega-3 rich foods like walnuts and flaxseed",
      "Limit fruit juice and sugary beverages"
    ],
    isActive: true,
    usageCount: 62,
    lastTriggered: "2024-01-15"
  },
  {
    id: "rt4",
    name: "Low HDL - Exercise Program",
    biomarkerId: "hdl_cholesterol",
    biomarkerName: "HDL Cholesterol",
    condition: "below",
    thresholdValue: 50,
    priority: "medium",
    category: "exercise",
    title: "Boost HDL Through Exercise",
    recommendation: "Your HDL (good cholesterol) is below optimal. Regular aerobic exercise is one of the most effective ways to raise HDL levels.",
    actionItems: [
      "Aim for 150 minutes of moderate aerobic exercise weekly",
      "Include activities like brisk walking, swimming, or cycling",
      "Add resistance training 2-3 times per week",
      "Consider high-intensity interval training (HIIT)"
    ],
    isActive: true,
    usageCount: 29,
    lastTriggered: "2024-01-13"
  },
  {
    id: "rt5",
    name: "High Uric Acid - Purine Reduction",
    biomarkerId: "uric_acid",
    biomarkerName: "Uric Acid",
    condition: "above",
    thresholdValue: 7.0,
    priority: "high",
    category: "diet",
    title: "Reduce Purine-Rich Foods",
    recommendation: "Elevated uric acid can lead to gout and kidney issues. Reducing purine-rich foods and staying hydrated can help normalize levels.",
    actionItems: [
      "Limit red meat and organ meats",
      "Reduce shellfish consumption",
      "Drink 8-10 glasses of water daily",
      "Limit alcohol, especially beer",
      "Consider cherry extract supplement"
    ],
    isActive: true,
    usageCount: 18,
    lastTriggered: "2024-01-12"
  }
];

const biomarkers = [
  { id: "alt", name: "ALT", unit: "U/L" },
  { id: "ast", name: "AST", unit: "U/L" },
  { id: "ggt", name: "GGT", unit: "U/L" },
  { id: "triglycerides", name: "Triglycerides", unit: "mg/dL" },
  { id: "hdl_cholesterol", name: "HDL Cholesterol", unit: "mg/dL" },
  { id: "ldl_cholesterol", name: "LDL Cholesterol", unit: "mg/dL" },
  { id: "glucose", name: "Fasting Glucose", unit: "mg/dL" },
  { id: "hba1c", name: "HbA1c", unit: "%" },
  { id: "uric_acid", name: "Uric Acid", unit: "mg/dL" },
  { id: "crp", name: "CRP", unit: "mg/L" },
  { id: "albumin", name: "Albumin", unit: "g/dL" },
  { id: "bilirubin", name: "Bilirubin", unit: "mg/dL" },
];

const categories = [
  { id: "lifestyle", name: "Lifestyle", color: "blue" },
  { id: "diet", name: "Diet", color: "green" },
  { id: "exercise", name: "Exercise", color: "purple" },
  { id: "supplement", name: "Supplement", color: "amber" },
  { id: "medical", name: "Medical", color: "red" },
];

export function AIRecommendationsManager() {
  const [templates, setTemplates] = useState<RecommendationTemplate[]>(mockTemplates);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RecommendationTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    biomarkerId: "",
    condition: "above" as RecommendationTemplate["condition"],
    thresholdValue: "",
    priority: "medium" as RecommendationTemplate["priority"],
    category: "lifestyle" as RecommendationTemplate["category"],
    title: "",
    recommendation: "",
    actionItems: [""]
  });

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.biomarkerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getPriorityBadge = (priority: RecommendationTemplate["priority"]) => {
    switch (priority) {
      case "critical": return <Badge className="bg-red-600">Critical</Badge>;
      case "high": return <Badge className="bg-orange-600">High</Badge>;
      case "medium": return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Medium</Badge>;
      case "low": return <Badge variant="secondary">Low</Badge>;
    }
  };

  const getCategoryBadge = (category: RecommendationTemplate["category"]) => {
    const cat = categories.find(c => c.id === category);
    const colorClasses: Record<string, string> = {
      blue: "border-blue-500 text-blue-600",
      green: "border-green-500 text-green-600",
      purple: "border-purple-500 text-purple-600",
      amber: "border-amber-500 text-amber-600",
      red: "border-red-500 text-red-600"
    };
    return <Badge variant="outline" className={colorClasses[cat?.color || "blue"]}>{cat?.name}</Badge>;
  };

  const getConditionIcon = (condition: RecommendationTemplate["condition"]) => {
    switch (condition) {
      case "above": return <TrendingUp className="w-4 h-4 text-red-500" />;
      case "below": return <TrendingDown className="w-4 h-4 text-blue-500" />;
      case "in_range": return <Check className="w-4 h-4 text-green-500" />;
      case "out_of_range": return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    }
  };

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.biomarkerId || !newTemplate.title || !newTemplate.recommendation) {
      toast.error("Please fill all required fields");
      return;
    }

    const biomarker = biomarkers.find(b => b.id === newTemplate.biomarkerId);

    const template: RecommendationTemplate = {
      id: `rt_${Date.now()}`,
      name: newTemplate.name,
      biomarkerId: newTemplate.biomarkerId,
      biomarkerName: biomarker?.name || "",
      condition: newTemplate.condition,
      thresholdValue: parseFloat(newTemplate.thresholdValue) || undefined,
      priority: newTemplate.priority,
      category: newTemplate.category,
      title: newTemplate.title,
      recommendation: newTemplate.recommendation,
      actionItems: newTemplate.actionItems.filter(item => item.trim() !== ""),
      isActive: true,
      usageCount: 0
    };

    setTemplates([template, ...templates]);
    setIsCreateDialogOpen(false);
    resetForm();
    toast.success("Recommendation template created");
  };

  const resetForm = () => {
    setNewTemplate({
      name: "",
      biomarkerId: "",
      condition: "above",
      thresholdValue: "",
      priority: "medium",
      category: "lifestyle",
      title: "",
      recommendation: "",
      actionItems: [""]
    });
  };

  const handleToggleActive = (templateId: string) => {
    setTemplates(templates.map(t =>
      t.id === templateId ? { ...t, isActive: !t.isActive } : t
    ));
    toast.success("Template status updated");
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter(t => t.id !== templateId));
    toast.success("Template deleted");
  };

  const handleDuplicateTemplate = (template: RecommendationTemplate) => {
    const duplicate: RecommendationTemplate = {
      ...template,
      id: `rt_${Date.now()}`,
      name: `${template.name} (Copy)`,
      usageCount: 0,
      lastTriggered: undefined
    };
    setTemplates([duplicate, ...templates]);
    toast.success("Template duplicated");
  };

  const addActionItem = () => {
    setNewTemplate({
      ...newTemplate,
      actionItems: [...newTemplate.actionItems, ""]
    });
  };

  const updateActionItem = (index: number, value: string) => {
    const items = [...newTemplate.actionItems];
    items[index] = value;
    setNewTemplate({ ...newTemplate, actionItems: items });
  };

  const removeActionItem = (index: number) => {
    const items = newTemplate.actionItems.filter((_, i) => i !== index);
    setNewTemplate({ ...newTemplate, actionItems: items });
  };

  const stats = {
    total: templates.length,
    active: templates.filter(t => t.isActive).length,
    totalUsage: templates.reduce((sum, t) => sum + t.usageCount, 0),
    categories: categories.map(c => ({
      ...c,
      count: templates.filter(t => t.category === c.id).length
    }))
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Templates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalUsage}</p>
                <p className="text-xs text-muted-foreground">Times Triggered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-1">
              {stats.categories.map(c => (
                <Badge key={c.id} variant="secondary" className="text-xs">
                  {c.name}: {c.count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Recommendation Templates
              </CardTitle>
              <CardDescription>Configure automated recommendations based on biomarker conditions</CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Create Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map(template => (
                  <TableRow key={template.id} className={!template.isActive ? "opacity-50" : ""}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{template.name}</p>
                        <p className="text-xs text-muted-foreground">{template.title}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getConditionIcon(template.condition)}
                        <div className="text-sm">
                          <span className="font-medium">{template.biomarkerName}</span>
                          <span className="text-muted-foreground ml-1">
                            {template.condition === "above" && `> ${template.thresholdValue}`}
                            {template.condition === "below" && `< ${template.thresholdValue}`}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getCategoryBadge(template.category)}</TableCell>
                    <TableCell>{getPriorityBadge(template.priority)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">{template.usageCount}x</p>
                        {template.lastTriggered && (
                          <p className="text-xs text-muted-foreground">Last: {template.lastTriggered}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={template.isActive}
                        onCheckedChange={() => handleToggleActive(template.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicateTemplate(template)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Template Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Create Recommendation Template
            </DialogTitle>
            <DialogDescription>
              Define conditions and recommendations for automated AI suggestions
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label>Template Name *</Label>
              <Input
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                placeholder="e.g., High ALT - Reduce Alcohol"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Biomarker *</Label>
                <Select
                  value={newTemplate.biomarkerId}
                  onValueChange={(v) => setNewTemplate({...newTemplate, biomarkerId: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select biomarker" />
                  </SelectTrigger>
                  <SelectContent>
                    {biomarkers.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name} ({b.unit})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Condition</Label>
                <Select
                  value={newTemplate.condition}
                  onValueChange={(v: RecommendationTemplate["condition"]) => setNewTemplate({...newTemplate, condition: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="above">Above Threshold</SelectItem>
                    <SelectItem value="below">Below Threshold</SelectItem>
                    <SelectItem value="out_of_range">Out of Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Threshold Value</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={newTemplate.thresholdValue}
                  onChange={(e) => setNewTemplate({...newTemplate, thresholdValue: e.target.value})}
                  placeholder="e.g., 40"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={newTemplate.category}
                  onValueChange={(v: RecommendationTemplate["category"]) => setNewTemplate({...newTemplate, category: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select
                  value={newTemplate.priority}
                  onValueChange={(v: RecommendationTemplate["priority"]) => setNewTemplate({...newTemplate, priority: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Recommendation Title *</Label>
              <Input
                value={newTemplate.title}
                onChange={(e) => setNewTemplate({...newTemplate, title: e.target.value})}
                placeholder="e.g., Reduce Alcohol Intake"
              />
            </div>

            <div>
              <Label>Recommendation Text *</Label>
              <Textarea
                value={newTemplate.recommendation}
                onChange={(e) => setNewTemplate({...newTemplate, recommendation: e.target.value})}
                placeholder="Detailed recommendation message..."
                rows={3}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Action Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addActionItem}>
                  <Plus className="w-3 h-3 mr-1" />
                  Add Item
                </Button>
              </div>
              <div className="space-y-2">
                {newTemplate.actionItems.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => updateActionItem(index, e.target.value)}
                      placeholder={`Action item ${index + 1}`}
                    />
                    {newTemplate.actionItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeActionItem(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate}>
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
