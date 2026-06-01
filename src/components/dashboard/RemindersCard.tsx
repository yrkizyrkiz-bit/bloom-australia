"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useReminders, apiPost, apiPatch, apiDelete } from "@/hooks/useApi";
import { getRemindersForUser } from "@/data/mock-data";
import type { Reminder, ReminderType, ReminderFrequency } from "@/types";
import { toast } from "sonner";
import {
  Bell,
  Plus,
  Check,
  Clock,
  Pill,
  Stethoscope,
  FlaskConical,
  Trash2,
  Loader2
} from "lucide-react";

interface RemindersCardProps {
  userId: string;
  compact?: boolean;
}

export function RemindersCard({ userId, compact = false }: RemindersCardProps) {
  const { data: apiData, isLoading, refetch } = useReminders({ upcoming: true });
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: "",
    description: "",
    type: "supplement" as ReminderType,
    frequency: "daily" as ReminderFrequency,
    dueDate: ""
  });

  // Update reminders when API data arrives
  useEffect(() => {
    if (apiData?.reminders && apiData.reminders.length > 0) {
      setReminders(apiData.reminders.map((r: any) => ({
        id: r.id,
        userId: r.userId,
        type: r.type?.toLowerCase() || "custom",
        title: r.title,
        description: r.description,
        dueDate: r.dueDate,
        frequency: r.frequency?.toLowerCase() || "once",
        isCompleted: r.isCompleted,
        completedAt: r.completedAt,
        createdAt: r.createdAt,
      })));
    } else if (!isLoading && userId) {
      // Fallback to mock data if no API data
      setReminders(getRemindersForUser(userId));
    }
  }, [apiData, isLoading, userId]);

  const getTypeIcon = (type: ReminderType) => {
    switch (type) {
      case "test": return <FlaskConical className="w-4 h-4" />;
      case "supplement": return <Pill className="w-4 h-4" />;
      case "medication": return <Pill className="w-4 h-4" />;
      case "appointment": return <Stethoscope className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: ReminderType) => {
    switch (type) {
      case "test": return "bg-blue-500/10 text-blue-600";
      case "supplement": return "bg-green-500/10 text-green-600";
      case "medication": return "bg-purple-500/10 text-purple-600";
      case "appointment": return "bg-orange-500/10 text-orange-600";
      default: return "bg-gray-500/10 text-gray-600";
    }
  };

  const completeReminder = async (id: string) => {
    // Optimistic update
    setReminders(prev => prev.map(r =>
      r.id === id ? { ...r, isCompleted: true, completedAt: new Date().toISOString() } : r
    ));

    // API call
    const { error } = await apiPatch("/api/reminders", { id, isCompleted: true });
    if (error) {
      // Revert on error
      setReminders(prev => prev.map(r =>
        r.id === id ? { ...r, isCompleted: false, completedAt: undefined } : r
      ));
      toast.error("Failed to complete reminder");
    } else {
      toast.success("Reminder completed!");
    }
  };

  const deleteReminder = async (id: string) => {
    const reminder = reminders.find(r => r.id === id);

    // Optimistic update
    setReminders(prev => prev.filter(r => r.id !== id));

    // API call
    const { error } = await apiDelete(`/api/reminders?id=${id}`);
    if (error) {
      // Revert on error
      if (reminder) {
        setReminders(prev => [...prev, reminder]);
      }
      toast.error("Failed to delete reminder");
    } else {
      toast.success("Reminder deleted");
    }
  };

  const addReminder = async () => {
    if (!newReminder.title || !newReminder.dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    const { data, error } = await apiPost<{ reminder: any }>("/api/reminders", {
      type: newReminder.type,
      title: newReminder.title,
      description: newReminder.description || undefined,
      dueDate: new Date(newReminder.dueDate).toISOString(),
      frequency: newReminder.frequency,
    });

    setIsSubmitting(false);

    if (error) {
      // Fallback to local state for demo
      const reminder: Reminder = {
        id: `reminder_${Date.now()}`,
        userId,
        type: newReminder.type,
        title: newReminder.title,
        description: newReminder.description || undefined,
        dueDate: new Date(newReminder.dueDate).toISOString(),
        frequency: newReminder.frequency,
        isCompleted: false,
        createdAt: new Date().toISOString()
      };
      setReminders(prev => [...prev, reminder]);
    } else if (data?.reminder) {
      setReminders(prev => [...prev, {
        id: data.reminder.id,
        userId: data.reminder.userId,
        type: data.reminder.type?.toLowerCase() || "custom",
        title: data.reminder.title,
        description: data.reminder.description,
        dueDate: data.reminder.dueDate,
        frequency: data.reminder.frequency?.toLowerCase() || "once",
        isCompleted: data.reminder.isCompleted,
        createdAt: data.reminder.createdAt,
      }]);
    }

    setShowAddDialog(false);
    setNewReminder({ title: "", description: "", type: "supplement", frequency: "daily", dueDate: "" });
    toast.success("Reminder added!");
  };

  const upcomingReminders = reminders
    .filter(r => !r.isCompleted)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, compact ? 3 : 10);

  const formatDueDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 7) return `In ${diffDays} days`;
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Reminders
          </CardTitle>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Reminder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newReminder.type} onValueChange={(v: ReminderType) => setNewReminder(prev => ({ ...prev, type: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="test">Blood Test</SelectItem>
                      <SelectItem value="supplement">Supplement</SelectItem>
                      <SelectItem value="medication">Medication</SelectItem>
                      <SelectItem value="appointment">Appointment</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={newReminder.title}
                    onChange={e => setNewReminder(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Take Vitamin D"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Input
                    value={newReminder.description}
                    onChange={e => setNewReminder(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="e.g., 2000 IU with breakfast"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input
                      type="datetime-local"
                      value={newReminder.dueDate}
                      onChange={e => setNewReminder(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select value={newReminder.frequency} onValueChange={(v: ReminderFrequency) => setNewReminder(prev => ({ ...prev, frequency: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="once">Once</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={addReminder} className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Add Reminder
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {upcomingReminders.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No upcoming reminders</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingReminders.map(reminder => (
              <div
                key={reminder.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTypeColor(reminder.type)}`}>
                    {getTypeIcon(reminder.type)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{reminder.title}</p>
                    {reminder.description && (
                      <p className="text-xs text-muted-foreground">{reminder.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-xs ${
                    formatDueDate(reminder.dueDate) === "Overdue" ? "border-red-500 text-red-600" :
                    formatDueDate(reminder.dueDate) === "Today" ? "border-orange-500 text-orange-600" :
                    ""
                  }`}>
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDueDate(reminder.dueDate)}
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => completeReminder(reminder.id)}>
                    <Check className="w-4 h-4 text-green-600" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => deleteReminder(reminder.id)}>
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!compact && reminders.filter(r => r.isCompleted).length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">Recently Completed</p>
            {reminders.filter(r => r.isCompleted).slice(0, 3).map(reminder => (
              <div key={reminder.id} className="flex items-center gap-2 py-2 text-sm text-muted-foreground line-through">
                <Check className="w-4 h-4 text-green-500" />
                {reminder.title}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
