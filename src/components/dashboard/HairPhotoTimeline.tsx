"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Camera, Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HAIR_PHOTO_ANGLES } from "@/lib/hair-health/weekly-check-in";
import {
  formatHairWeekLabel,
  hairComparePhotoSrc,
  type HairTimelinePhoto,
  type HairTimelineWeek,
} from "@/lib/hair-health/compare-photos";

type AngleFilter = "all" | (typeof HAIR_PHOTO_ANGLES)[number]["id"];

function angleLabel(angle: string) {
  return HAIR_PHOTO_ANGLES.find((item) => item.id === angle)?.label || angle;
}

function HairThumb({
  weekKey,
  photo,
  selected,
  onSelect,
}: {
  weekKey: string;
  photo: HairTimelinePhoto;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative w-20 shrink-0 overflow-hidden rounded-xl border text-left transition sm:w-24 ${
        selected
          ? "border-violet-500 ring-2 ring-violet-400"
          : "border-slate-200 hover:border-violet-300 dark:border-slate-800"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={hairComparePhotoSrc(weekKey, photo.id, "thumb")}
        alt={`${angleLabel(String(photo.angle))} on ${formatHairWeekLabel(photo.capturedAt)}`}
        width={96}
        height={96}
        loading="lazy"
        decoding="async"
        className="h-20 w-20 object-cover sm:h-24 sm:w-24"
      />
      <span className="absolute inset-x-0 bottom-0 bg-black/55 px-1 py-0.5 text-[10px] text-white">
        {angleLabel(String(photo.angle))}
      </span>
    </button>
  );
}

function SelectedPhoto({
  weekKey,
  photo,
  label,
  onClear,
}: {
  weekKey: string;
  photo: HairTimelinePhoto;
  label: string;
  onClear: () => void;
}) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-violet-600">{label}</p>
        <button type="button" onClick={onClear} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={hairComparePhotoSrc(weekKey, photo.id, "full")}
          alt={angleLabel(String(photo.angle))}
          width={640}
          height={640}
          decoding="async"
          className="mx-auto max-h-[52vh] w-full object-contain"
        />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {angleLabel(String(photo.angle))} · {formatHairWeekLabel(photo.capturedAt)}
      </p>
    </div>
  );
}

export function HairPhotoTimeline() {
  const [weeks, setWeeks] = useState<HairTimelineWeek[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [angle, setAngle] = useState<AngleFilter>("all");
  const [selected, setSelected] = useState<Array<{ weekKey: string; photo: HairTimelinePhoto }>>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/hair-loss/compare")
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Could not load photos");
        if (!cancelled) setWeeks(Array.isArray(json.weeks) ? json.weeks : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load photos");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleWeeks = useMemo(
    () =>
      weeks
        .map((week) => ({
          ...week,
          photos:
            angle === "all"
              ? week.photos
              : week.photos.filter((photo) => photo.angle === angle),
        }))
        .filter((week) => week.photos.length > 0),
    [weeks, angle]
  );

  const togglePhoto = (weekKey: string, photo: HairTimelinePhoto) => {
    setSelected((current) => {
      const exists = current.some((item) => item.weekKey === weekKey && item.photo.id === photo.id);
      if (exists) {
        return current.filter((item) => !(item.weekKey === weekKey && item.photo.id === photo.id));
      }
      const next = [...current, { weekKey, photo }];
      return next.slice(-2);
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">{error}</CardContent>
      </Card>
    );
  }

  if (weeks.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-violet-100">
            <Camera className="h-7 w-7 text-violet-600" />
          </div>
          <h2 className="font-semibold">No progress photos yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add hairline, crown or side photos in your weekly check-in. They will appear here as a
            light timeline so the page stays fast.
          </p>
          <Button asChild className="mt-4 bg-violet-600 hover:bg-violet-700">
            <Link href="/dashboard/mens-health/hair-loss/check-in">Take this week&apos;s photos</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={angle === "all" ? "default" : "outline"}
          onClick={() => setAngle("all")}
        >
          All angles
        </Button>
        {HAIR_PHOTO_ANGLES.map((item) => (
          <Button
            key={item.id}
            type="button"
            size="sm"
            variant={angle === item.id ? "default" : "outline"}
            onClick={() => setAngle(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {selected.length > 0 && (
        <Card className="border-violet-200">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">
                {selected.length === 1
                  ? "Tap another thumbnail to compare side by side"
                  : "Comparing two photos"}
              </p>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelected([])}>
                Clear
              </Button>
            </div>
            <div className={`grid gap-4 ${selected.length === 2 ? "md:grid-cols-2" : ""}`}>
              {selected.map((item, index) => (
                <SelectedPhoto
                  key={`${item.weekKey}-${item.photo.id}`}
                  weekKey={item.weekKey}
                  photo={item.photo}
                  label={index === 0 ? "Earlier / first" : "Later / second"}
                  onClear={() => togglePhoto(item.weekKey, item.photo)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {visibleWeeks.map((week) => (
          <section
            key={week.weekKey}
            className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800"
            style={{ contentVisibility: "auto", containIntrinsicSize: "120px" }}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">{formatHairWeekLabel(week.checkedInAt)}</h2>
              <Badge variant="secondary">{week.weekKey}</Badge>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {week.photos.map((photo) => (
                <HairThumb
                  key={photo.id}
                  weekKey={week.weekKey}
                  photo={photo}
                  selected={selected.some(
                    (item) => item.weekKey === week.weekKey && item.photo.id === photo.id
                  )}
                  onSelect={() => togglePhoto(week.weekKey, photo)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
