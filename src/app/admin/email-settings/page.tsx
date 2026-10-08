"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, Send } from "lucide-react";

type ProcessRow = {
  processKey: string;
  label: string;
  fromEmail: string;
  fromName: string;
  replyTo: string;
  enabled: boolean;
  sortOrder: number;
};

type SettingsPayload = {
  transport: {
    transport: string;
    preferred: string;
    googleConfigured: boolean;
    resendConfigured: boolean;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
  };
  settings: {
    defaultFromEmail: string;
    defaultFromName: string;
    defaultReplyTo: string;
  };
  processes: ProcessRow[];
};

export default function EmailSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [payload, setPayload] = useState<SettingsPayload | null>(null);
  const [testTo, setTestTo] = useState("");
  const [testProcess, setTestProcess] = useState("auth");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/email-settings");
      if (!response.ok) {
        throw new Error("Could not load email settings");
      }
      const data = (await response.json()) as SettingsPayload;
      setPayload(data);
      if (data.processes[0]) setTestProcess(data.processes[0].processKey);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!payload) return;
    setSaving(true);
    try {
      const response = await fetch("/api/admin/email-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultFromEmail: payload.settings.defaultFromEmail,
          defaultFromName: payload.settings.defaultFromName,
          defaultReplyTo: payload.settings.defaultReplyTo,
          processes: payload.processes,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Save failed");
      }
      toast.success("Email settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function sendTest() {
    setTesting(true);
    try {
      const response = await fetch("/api/admin/email-settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testTo, process: testProcess }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Test send failed");
      }
      toast.success(`Test sent via ${data.transport || "email"}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Test send failed");
    } finally {
      setTesting(false);
    }
  }

  function updateProcess(key: string, patch: Partial<ProcessRow>) {
    setPayload((current) => {
      if (!current) return current;
      return {
        ...current,
        processes: current.processes.map((row) =>
          row.processKey === key ? { ...row, ...patch } : row
        ),
      };
    });
  }

  if (loading || !payload) {
    return (
      <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading email settings…
      </div>
    );
  }

  const transportLabel =
    payload.transport.transport === "google_workspace"
      ? "Google Workspace SMTP"
      : payload.transport.transport === "resend"
        ? "Resend (fallback)"
        : "Mock / not configured";

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Email settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Per-function From names for Google Workspace. SMTP credentials stay in env vars, never in
          the database.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transport</CardTitle>
          <CardDescription>
            Active engine: {transportLabel}. Preferred provider env: {payload.transport.preferred}.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            Workspace SMTP: {payload.transport.googleConfigured ? "configured" : "not set"}
            {payload.transport.smtpUser ? ` (${payload.transport.smtpUser})` : ""}
          </div>
          <div>Resend fallback: {payload.transport.resendConfigured ? "available" : "not set"}</div>
          <div>
            Relay: {payload.transport.smtpHost}:{payload.transport.smtpPort}
          </div>
          <div>
            Rollback: set EMAIL_PROVIDER=resend and keep RESEND_API_KEY until Workspace is proven.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Defaults</CardTitle>
          <CardDescription>
            Used when a process row leaves From / Reply-To blank. Must be a Workspace-verified
            sanative.com.au address.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="defaultFromEmail">Default from email</Label>
            <Input
              id="defaultFromEmail"
              value={payload.settings.defaultFromEmail}
              onChange={(event) =>
                setPayload({
                  ...payload,
                  settings: { ...payload.settings, defaultFromEmail: event.target.value },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultFromName">Default from name</Label>
            <Input
              id="defaultFromName"
              value={payload.settings.defaultFromName}
              onChange={(event) =>
                setPayload({
                  ...payload,
                  settings: { ...payload.settings, defaultFromName: event.target.value },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultReplyTo">Default reply-to</Label>
            <Input
              id="defaultReplyTo"
              value={payload.settings.defaultReplyTo}
              onChange={(event) =>
                setPayload({
                  ...payload,
                  settings: { ...payload.settings, defaultReplyTo: event.target.value },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Per-function From</CardTitle>
          <CardDescription>
            Blank From uses the defaults above. Disable a row to stop that class of mail without
            changing code.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {payload.processes.map((row) => (
            <div key={row.processKey} className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium">{row.label}</div>
                  <div className="text-xs text-muted-foreground">{row.processKey}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`enabled-${row.processKey}`} className="text-sm">
                    Enabled
                  </Label>
                  <Switch
                    id={`enabled-${row.processKey}`}
                    checked={row.enabled}
                    onCheckedChange={(checked) =>
                      updateProcess(row.processKey, { enabled: checked })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Input
                  placeholder="From email"
                  value={row.fromEmail}
                  onChange={(event) =>
                    updateProcess(row.processKey, { fromEmail: event.target.value })
                  }
                />
                <Input
                  placeholder="From name"
                  value={row.fromName}
                  onChange={(event) =>
                    updateProcess(row.processKey, { fromName: event.target.value })
                  }
                />
                <Input
                  placeholder="Reply-to"
                  value={row.replyTo}
                  onChange={(event) =>
                    updateProcess(row.processKey, { replyTo: event.target.value })
                  }
                />
              </div>
            </div>
          ))}
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Send a test</CardTitle>
          <CardDescription>
            Sends one message through the live transport using the selected process identity.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="testTo">Recipient</Label>
            <Input
              id="testTo"
              type="email"
              value={testTo}
              onChange={(event) => setTestTo(event.target.value)}
              placeholder="you@sanative.com.au"
            />
          </div>
          <div className="w-full space-y-2 sm:w-64">
            <Label>Process</Label>
            <Select value={testProcess} onValueChange={setTestProcess}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {payload.processes.map((row) => (
                  <SelectItem key={row.processKey} value={row.processKey}>
                    {row.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => void sendTest()} disabled={testing || !testTo}>
            {testing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send test
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
