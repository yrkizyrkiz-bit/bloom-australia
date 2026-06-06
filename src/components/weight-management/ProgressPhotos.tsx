"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Camera, Plus, Calendar, Trash2, ChevronLeft, ChevronRight,
  ImageIcon, Sparkles, ArrowLeftRight, X
} from "lucide-react";
import { toast } from "sonner";

interface ProgressPhoto {
  id: string;
  date: string;
  imageData: string;
  weight?: number;
  note?: string;
}

export function ProgressPhotos() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [compareIndices, setCompareIndices] = useState<[number, number]>([0, 0]);
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("progressPhotos");
    if (saved) {
      setPhotos(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("progressPhotos", JSON.stringify(photos));
  }, [photos]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      const newPhoto: ProgressPhoto = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        imageData,
      };
      setPhotos(prev => [...prev, newPhoto]);
      setShowUpload(false);
      toast.success("Photo added!");
    };
    reader.readAsDataURL(file);
  };

  const deletePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
    setSelectedPhoto(null);
    toast.success("Photo deleted");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const sortedPhotos = [...photos].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Camera className="w-5 h-5 text-pink-500" />
            Progress Photos
          </CardTitle>
          <div className="flex gap-2">
            {photos.length >= 2 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCompareIndices([0, photos.length - 1]);
                  setShowCompare(true);
                }}
              >
                <ArrowLeftRight className="w-4 h-4 mr-1" /> Compare
              </Button>
            )}
            <Button size="sm" className="bg-pink-600 hover:bg-pink-700" onClick={() => setShowUpload(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {photos.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center">
              <Camera className="w-8 h-8 text-pink-400" />
            </div>
            <h3 className="font-medium mb-1">Track your transformation</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Take progress photos to see how far you've come
            </p>
            <Button onClick={() => setShowUpload(true)} variant="outline">
              <Camera className="w-4 h-4 mr-2" /> Take first photo
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Photo Grid */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {sortedPhotos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer group"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <img
                    src={photo.imageData}
                    alt={`Progress ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-1 left-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-white truncate">
                      {formatDate(photo.date)}
                    </p>
                  </div>
                  {index === 0 && (
                    <Badge className="absolute top-1 left-1 text-[10px] bg-emerald-500">Start</Badge>
                  )}
                  {index === sortedPhotos.length - 1 && sortedPhotos.length > 1 && (
                    <Badge className="absolute top-1 left-1 text-[10px] bg-pink-500">Latest</Badge>
                  )}
                </div>
              ))}
            </div>

            {/* Timeline hint */}
            {photos.length >= 2 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>{formatDate(sortedPhotos[0].date)}</span>
                <div className="flex-1 mx-3 h-px bg-gradient-to-r from-emerald-300 via-pink-300 to-pink-500" />
                <span>{formatDate(sortedPhotos[sortedPhotos.length - 1].date)}</span>
              </div>
            )}
          </div>
        )}

        {/* Upload Dialog */}
        <Dialog open={showUpload} onOpenChange={setShowUpload}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-pink-500" />
                Add Progress Photo
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div
                className="border-2 border-dashed border-pink-200 dark:border-pink-800 rounded-xl p-8 text-center cursor-pointer hover:border-pink-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="w-12 h-12 mx-auto mb-3 text-pink-300" />
                <p className="font-medium text-pink-800 dark:text-pink-200">Click to upload</p>
                <p className="text-sm text-muted-foreground">JPG, PNG up to 5MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div className="flex items-start gap-2 p-3 bg-pink-50 dark:bg-pink-950/20 rounded-lg">
                <Sparkles className="w-4 h-4 text-pink-500 mt-0.5 shrink-0" />
                <p className="text-xs text-pink-700 dark:text-pink-300">
                  Tip: For best results, take photos in the same pose, lighting, and location each time.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Photo View Dialog */}
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-lg">
            {selectedPhoto && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-pink-500" />
                    {formatDate(selectedPhoto.date)}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <img
                    src={selectedPhoto.imageData}
                    alt="Progress"
                    className="w-full rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deletePhoto(selectedPhoto.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Photo
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Compare Dialog */}
        <Dialog open={showCompare} onOpenChange={setShowCompare}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-pink-500" />
                Compare Progress
              </DialogTitle>
            </DialogHeader>
            {sortedPhotos.length >= 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Before */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-emerald-500">Before</Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setCompareIndices([Math.max(0, compareIndices[0] - 1), compareIndices[1]])}
                          disabled={compareIndices[0] === 0}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setCompareIndices([Math.min(sortedPhotos.length - 2, compareIndices[0] + 1), compareIndices[1]])}
                          disabled={compareIndices[0] >= compareIndices[1] - 1}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                      <img
                        src={sortedPhotos[compareIndices[0]]?.imageData}
                        alt="Before"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-sm text-center text-muted-foreground">
                      {formatDate(sortedPhotos[compareIndices[0]]?.date)}
                    </p>
                  </div>

                  {/* After */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-pink-500">After</Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setCompareIndices([compareIndices[0], Math.max(compareIndices[0] + 1, compareIndices[1] - 1)])}
                          disabled={compareIndices[1] <= compareIndices[0] + 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setCompareIndices([compareIndices[0], Math.min(sortedPhotos.length - 1, compareIndices[1] + 1)])}
                          disabled={compareIndices[1] === sortedPhotos.length - 1}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                      <img
                        src={sortedPhotos[compareIndices[1]]?.imageData}
                        alt="After"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-sm text-center text-muted-foreground">
                      {formatDate(sortedPhotos[compareIndices[1]]?.date)}
                    </p>
                  </div>
                </div>

                <div className="text-center p-3 bg-pink-50 dark:bg-pink-950/20 rounded-lg">
                  <p className="text-sm font-medium text-pink-800 dark:text-pink-200">
                    {Math.round((new Date(sortedPhotos[compareIndices[1]]?.date).getTime() -
                      new Date(sortedPhotos[compareIndices[0]]?.date).getTime()) / (1000 * 60 * 60 * 24))} days apart
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
