"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, CheckCircle2, Loader2, Smile, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  HAIR_FEELING_QUESTIONS,
  HAIR_PHOTO_ANGLES,
  type HairCheckInPhoto,
  type HairPhotoAngle,
} from "@/lib/hair-health/weekly-check-in";

type CheckInPayload = {
  weekKey: string;
  checkInNeeded: boolean;
  thisWeek: {
    overallFeeling: number;
    sheddingLevel: number;
    scalpComfort: number;
    confidence: number;
    notes: string | null;
    photos: HairCheckInPhoto[];
    checkedInAt: string;
  } | null;
  history: Array<{
    id: string;
    weekKey: string;
    overallFeeling: number;
    photoCount: number;
    checkedInAt: string;
  }>;
};

async function compressPhoto(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const max = 1280;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read photo");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

export default function HairWeeklyCheckInPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<CheckInPayload | null>(null);
  const [overallFeeling, setOverallFeeling] = useState(3);
  const [sheddingLevel, setSheddingLevel] = useState(3);
  const [scalpComfort, setScalpComfort] = useState(3);
  const [confidence, setConfidence] = useState(3);
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<HairCheckInPhoto[]>([]);
  const [activeAngle, setActiveAngle] = useState<HairPhotoAngle>("hairline");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ratings: Record<string, number> = {
    overallFeeling,
    sheddingLevel,
    scalpComfort,
    confidence,
  };
  const setRating = (key: string, value: number) => {
    if (key === "overallFeeling") setOverallFeeling(value);
    if (key === "sheddingLevel") setSheddingLevel(value);
    if (key === "scalpComfort") setScalpComfort(value);
    if (key === "confidence") setConfidence(value);
  };

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/hair-loss/check-in");
      if (!res.ok) throw new Error("Failed to load");
      const json = (await res.json()) as CheckInPayload;
      setData(json);
      if (json.thisWeek) {
        setOverallFeeling(json.thisWeek.overallFeeling);
        setSheddingLevel(json.thisWeek.sheddingLevel);
        setScalpComfort(json.thisWeek.scalpComfort);
        setConfidence(json.thisWeek.confidence);
        setNotes(json.thisWeek.notes || "");
        setPhotos(Array.isArray(json.thisWeek.photos) ? json.thisWeek.photos : []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not load this week's check-in");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addPhoto = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a photo");
      return;
    }
    if (photos.length >= 3) {
      toast.error("You can add up to 3 photos this week");
      return;
    }
    try {
      const imageData = await compressPhoto(file);
      setPhotos((current) => [
        ...current.filter((photo) => photo.angle !== activeAngle),
        {
          id: `${activeAngle}-${Date.now()}`,
          angle: activeAngle,
          imageData,
          capturedAt: new Date().toISOString(),
        },
      ]);
      toast.success(`${HAIR_PHOTO_ANGLES.find((angle) => angle.id === activeAngle)?.label} photo added`);
    } catch {
      toast.error("Could not read that photo");
    }
  };

  const submit = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/hair-loss/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overallFeeling,
          sheddingLevel,
          scalpComfort,
          confidence,
          notes,
          photos,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Could not save check-in");
      toast.success("Weekly hair check-in saved");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save check-in");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/mens-health/hair-loss">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Weekly Check-in</h1>
          <p className="text-muted-foreground">
            How your hair feels this week, plus progress photos
          </p>
        </div>
        {data?.thisWeek && <Badge className="bg-violet-600">This week done</Badge>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smile className="h-5 w-5 text-violet-600" />
            How do you feel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {HAIR_FEELING_QUESTIONS.map((question) => (
            <div key={question.key} className="space-y-2">
              <Label>{question.label}</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant={ratings[question.key] === value ? "default" : "outline"}
                    size="sm"
                    className="h-10 w-10"
                    onClick={() => setRating(question.key, value)}
                  >
                    {value}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                1 = {question.low} · 5 = {question.high}
              </p>
            </div>
          ))}
          <div className="space-y-2">
            <Label htmlFor="hair-notes">Anything else about your hair this week?</Label>
            <Textarea
              id="hair-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="New growth, itch, dryness, treatment notes…"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Camera className="h-5 w-5 text-violet-600" />
            Weekly photos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Take or upload up to three photos in the same light each week: hairline, crown, and side.
          </p>
          <div className="flex flex-wrap gap-2">
            {HAIR_PHOTO_ANGLES.map((angle) => (
              <Button
                key={angle.id}
                type="button"
                variant={activeAngle === angle.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveAngle(angle.id)}
              >
                {angle.label}
                {photos.some((photo) => photo.angle === angle.id) ? " ✓" : ""}
              </Button>
            ))}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void addPhoto(file);
              event.target.value = "";
            }}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              className="bg-violet-600 hover:bg-violet-700"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="mr-2 h-4 w-4" />
              Take or upload photo
            </Button>
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Choose from library
            </Button>
          </div>
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  className="overflow-hidden rounded-lg border"
                  onClick={() =>
                    setPhotos((current) => current.filter((item) => item.id !== photo.id))
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.imageData} alt={photo.angle} className="h-24 w-full object-cover" />
                  <p className="px-1 py-1 text-[10px] text-muted-foreground">
                    {HAIR_PHOTO_ANGLES.find((angle) => angle.id === photo.angle)?.label || photo.angle} · tap to remove
                  </p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        className="w-full bg-violet-600 hover:bg-violet-700"
        onClick={submit}
        disabled={saving}
      >
        {saving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle2 className="mr-2 h-4 w-4" />
        )}
        {data?.thisWeek ? "Update this week's check-in" : "Save weekly check-in"}
      </Button>

      {data?.history.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Previous weeks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.history.map((row) => (
              <div key={row.id} className="flex items-center justify-between text-sm">
                <span>{row.weekKey}</span>
                <span className="text-muted-foreground">
                  Feeling {row.overallFeeling}/5 · {row.photoCount} photo
                  {row.photoCount === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
