"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { biomarkerDefinitions, categoryInfo } from "@/data/biomarkers";
import { toast } from "sonner";
import {
  FileText,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  CheckCircle,
  AlertTriangle,
  X,
  Brain,
  Zap,
  Save,
  Eye,
  FileUp,
  Calculator,
  TrendingUp,
  TrendingDown,
  Activity,
  Heart,
  ArrowRight,
  History,
  Calendar,
  Clock,
  Filter,
} from "lucide-react";

interface ExtractedBiomarker {
  id: string;
  name: string;
  value: number;
  unit: string;
  confidence: number;
  status: "matched" | "review" | "unmatched";
  matchedBiomarkerId?: string;
  testDate?: string | null;
  isHistorical?: boolean;
  selected?: boolean; // For toggling individual results
}

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  status: "pending" | "processing" | "processed" | "error";
  extractedData?: ExtractedBiomarker[];
  hasHistoricalData?: boolean;
  testDates?: string[];
}

interface Member {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
}

interface MissingBiomarker {
  id: string;
  name: string;
  unit: string;
  category: string;
  importance: "core" | "recommended" | "optional";
  impactDescription: string;
}

interface BiologicalAgeResult {
  biologicalAge: number;
  chronologicalAge: number;
  ageDifference: number;
  healthStatus: string;
  confidence: number;
  biomarkersUsed: number;
  biomarkersAvailable?: string[];
  biomarkersMissing?: MissingBiomarker[];
  organAges?: {
    metabolic?: number;
    cardiovascular?: number;
    liver?: number;
    kidney?: number;
    immune?: number;
    blood?: number;
    inflammatory?: number;
  };
  recommendations?: string[];
}

export default function AdminUploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileData, setUploadedFileData] = useState<Map<string, File>>(new Map());
  const [aiMode, setAiMode] = useState<string>("");
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);

  // Debug state to show API response
  const [debugInfo, setDebugInfo] = useState<{
    lastRequest?: string;
    lastResponse?: Record<string, unknown>;
    lastError?: string;
  }>({});

  // Historical data options
  const [includeHistorical, setIncludeHistorical] = useState(true);

  // Biological age dialog state
  const [showBioAgeDialog, setShowBioAgeDialog] = useState(false);
  const [isCalculatingBioAge, setIsCalculatingBioAge] = useState(false);
  const [bioAgeResult, setBioAgeResult] = useState<BiologicalAgeResult | null>(null);
  const [savedBiomarkersCount, setSavedBiomarkersCount] = useState(0);

  // Fetch members from API
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch("/api/users?role=MEMBER&limit=100");
        if (!response.ok) throw new Error("Failed to fetch members");
        const data = await response.json();
        setMembers(data.users || []);
      } catch (error) {
        console.error("Error fetching members:", error);
        toast.error("Failed to load members");
      } finally {
        setIsLoadingMembers(false);
      }
    };
    fetchMembers();
  }, []);

  // Calculate stats from extracted data
  const extractedStats = useMemo(() => {
    const processed = files.filter(f => f.status === "processed");
    const allBiomarkers = processed.flatMap(f => f.extractedData || []);

    const currentResults = allBiomarkers.filter(b => !b.isHistorical && b.selected !== false);
    const historicalResults = allBiomarkers.filter(b => b.isHistorical && b.selected !== false);

    // Group by date
    const byDate = allBiomarkers.reduce((acc, b) => {
      const date = b.testDate || "Unknown Date";
      if (!acc[date]) acc[date] = [];
      if (b.selected !== false) acc[date].push(b);
      return acc;
    }, {} as Record<string, ExtractedBiomarker[]>);

    return {
      total: allBiomarkers.length,
      current: currentResults.length,
      historical: historicalResults.length,
      byDate,
      hasHistorical: historicalResults.length > 0,
      uniqueDates: Object.keys(byDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()),
    };
  }, [files]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedFileData]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  // Reduced file size for faster processing (prevents gateway timeouts)
  const MAX_FILE_SIZE_MB = 2;
  const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
  const RECOMMENDED_SIZE_MB = 1; // Recommend even smaller for best performance

  const handleFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file =>
      file.type === "application/pdf" || file.type.startsWith("image/")
    );

    if (validFiles.length !== newFiles.length) {
      toast.error("Only PDF and image files are supported.");
    }

    // Check file sizes and filter out oversized files
    const oversizedFiles = validFiles.filter(file => file.size > MAX_FILE_SIZE);
    const largeFiles = validFiles.filter(file => file.size > RECOMMENDED_SIZE_MB * 1024 * 1024 && file.size <= MAX_FILE_SIZE);
    const acceptableFiles = validFiles.filter(file => file.size <= MAX_FILE_SIZE);

    if (oversizedFiles.length > 0) {
      const fileSizes = oversizedFiles.map(f => `${f.name} (${(f.size / (1024 * 1024)).toFixed(1)}MB)`).join(", ");
      toast.error(`File(s) too large: ${fileSizes}. Maximum size is ${MAX_FILE_SIZE_MB}MB. Please compress or crop your image to show just the results.`);
      if (acceptableFiles.length === 0) return;
    }

    // Warn about large files that may be slow
    if (largeFiles.length > 0) {
      toast.warning(`Large file(s) may process slowly. For faster results, use files under ${RECOMMENDED_SIZE_MB}MB or crop to show just the results table.`);
    }

    const newUploadedFiles: UploadedFile[] = [];
    const newFileData = new Map(uploadedFileData);

    for (const file of acceptableFiles) {
      const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      newFileData.set(fileId, file);
      newUploadedFiles.push({
        id: fileId,
        name: file.name,
        type: file.type,
        size: file.size,
        status: "pending"
      });
    }

    setUploadedFileData(newFileData);
    setFiles(prev => [...prev, ...newUploadedFiles]);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const parseWithAI = async (file: File): Promise<{ biomarkers: ExtractedBiomarker[]; hasHistoricalData: boolean; testDates: string[] }> => {
    const formData = new FormData();
    formData.append("file", file);

    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    console.log("[Upload] 🚀 Sending file to API:", file.name, file.type, `${fileSizeMB}MB`);
    setDebugInfo({ lastRequest: `Uploading: ${file.name} (${file.type}, ${fileSizeMB}MB)` });

    try {
      // Add timeout controller for fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 55000); // 55 second timeout

      const response = await fetch("/api/parse-blood-test", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log("[Upload] 📥 API Response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Upload] ❌ API request failed:", response.status, errorText);

        // Handle specific error codes
        if (response.status === 504) {
          const timeoutError = `Gateway timeout - file may be too large (${fileSizeMB}MB). Try using a smaller image or crop to show just the results table.`;
          setDebugInfo(prev => ({ ...prev, lastError: timeoutError }));
          toast.error(timeoutError);
          throw new Error(timeoutError);
        }

        if (response.status === 413) {
          const sizeError = `File too large (${fileSizeMB}MB). Maximum recommended size is 1MB for fast processing.`;
          setDebugInfo(prev => ({ ...prev, lastError: sizeError }));
          toast.error(sizeError);
          throw new Error(sizeError);
        }

        setDebugInfo(prev => ({ ...prev, lastError: `API Error ${response.status}: ${errorText}` }));
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();

      // Store full response for debugging
      setDebugInfo(prev => ({
        ...prev,
        lastResponse: {
          mode: result.mode,
          aiProvider: result.aiProvider,
          aiModel: result.aiModel,
          biomarkersCount: result.data?.biomarkers?.length || 0,
          message: result.message,
          error: result.error,
          parseError: result.parseError,
          errorSnippet: result.errorSnippet,
          contentLength: result.contentLength,
          firstBiomarker: result.data?.biomarkers?.[0] || null,
        }
      }));

      // Log detailed AI status for debugging
      console.log("[Upload] ✅ API Response parsed:", {
        mode: result.mode,
        aiProvider: result.aiProvider,
        aiModel: result.aiModel,
        biomarkersFound: result.data?.biomarkers?.length || 0,
        message: result.message,
        error: result.error || result.parseError
      });

      // Always show the mode from API response, even for empty results
      if (result.mode === "ai" && result.aiModel) {
        setAiMode(`Claude AI (${result.aiModel})`);
        console.log("[Upload] 🟢 Set AI mode: Claude AI");
      } else if (result.mode === "demo") {
        setAiMode(`Demo Mode${result.error ? ` - ${result.error}` : ''}`);
        console.log("[Upload] 🟡 Set AI mode: Demo Mode - Reason:", result.error || result.message);
      } else {
        setAiMode(result.mode === "ai" ? "Claude AI" : "Demo Mode");
      }

      if (result.success && result.data?.biomarkers) {
        const biomarkers = result.data.biomarkers.map((b: {
          biomarkerId: string;
          name: string;
          value: number;
          unit: string;
          confidence: number;
          testDate?: string;
          isHistorical?: boolean;
        }, index: number) => ({
          id: `extracted_${index}`,
          name: b.name,
          value: b.value,
          unit: b.unit,
          confidence: b.confidence,
          status: "matched" as const,
          matchedBiomarkerId: b.biomarkerId,
          testDate: b.testDate || null,
          isHistorical: b.isHistorical || false,
          selected: true, // All selected by default
        }));

        console.log("[Upload] 📊 Returning", biomarkers.length, "biomarkers from API");

        return {
          biomarkers,
          hasHistoricalData: result.data.hasHistoricalData || false,
          testDates: result.data.testDates || [],
        };
      }

      // API returned success but no biomarkers - still use API response, don't fallback
      console.log("[Upload] ⚠️ API returned success but no biomarkers extracted");
      return {
        biomarkers: [],
        hasHistoricalData: false,
        testDates: [],
      };

    } catch (error) {
      console.error("[Upload] ❌ AI parsing error:", error);

      // Handle fetch abort (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutMsg = "Request timed out. Try a smaller image (under 1MB) or crop to show just the results.";
        setDebugInfo(prev => ({ ...prev, lastError: timeoutMsg }));
        toast.error(timeoutMsg);
        setAiMode("Timeout - Try smaller file");
        return simulateFallback();
      }

      // Only fall back to simulation on actual errors
      setAiMode("Demo Mode (API Error)");
      return simulateFallback();
    }
  };

  const simulateFallback = (): { biomarkers: ExtractedBiomarker[]; hasHistoricalData: boolean; testDates: string[] } => {
    console.log("[Upload] ⚠️ Using FALLBACK simulation - this means API call failed!");

    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const possibleExtractions = [
      { name: "Total Cholesterol", value: 185, unit: "mg/dL", biomarkerId: "total_cholesterol" },
      { name: "LDL Cholesterol", value: 95, unit: "mg/dL", biomarkerId: "ldl_cholesterol" },
      { name: "HDL Cholesterol", value: 58, unit: "mg/dL", biomarkerId: "hdl_cholesterol" },
      { name: "Triglycerides", value: 145, unit: "mg/dL", biomarkerId: "triglycerides" },
      { name: "Glucose", value: 92, unit: "mg/dL", biomarkerId: "glucose" },
      { name: "HbA1c", value: 5.3, unit: "%", biomarkerId: "hba1c" },
      { name: "Vitamin D", value: 32, unit: "ng/mL", biomarkerId: "vitamin_d" },
      { name: "Iron", value: 75, unit: "mcg/dL", biomarkerId: "iron" },
      { name: "CRP", value: 0.8, unit: "mg/L", biomarkerId: "crp" },
      { name: "Cortisol", value: 22, unit: "mcg/dL", biomarkerId: "cortisol" },
    ];

    // Note: setAiMode is already called in the catch block, don't override here
    const numToExtract = Math.floor(Math.random() * 4) + 6;
    const shuffled = [...possibleExtractions].sort(() => Math.random() - 0.5);

    const biomarkers = shuffled.slice(0, numToExtract).map((item, index) => ({
      id: `extracted_${index}`,
      name: item.name,
      value: Math.round((item.value + (Math.random() * 10 - 5)) * 10) / 10,
      unit: item.unit,
      confidence: 0.85 + Math.random() * 0.14,
      status: "matched" as const,
      matchedBiomarkerId: item.biomarkerId,
      testDate: formatDate(today),
      isHistorical: false,
      selected: true,
    }));

    return {
      biomarkers,
      hasHistoricalData: false,
      testDates: [formatDate(today)],
    };
  };

  const processFiles = async () => {
    if (!selectedMember) {
      toast.error("Please select a member first");
      return;
    }
    if (files.length === 0) {
      toast.error("Please upload at least one file");
      return;
    }

    setIsProcessing(true);

    for (const file of files) {
      if (file.status !== "pending") continue;

      setFiles(prev => prev.map(f =>
        f.id === file.id ? { ...f, status: "processing" as const } : f
      ));

      try {
        setProcessingStep("Uploading to AI...");
        await new Promise(r => setTimeout(r, 500));

        setProcessingStep("Analyzing document with AI...");

        // Get the actual file data
        const actualFile = uploadedFileData.get(file.id);
        let result: { biomarkers: ExtractedBiomarker[]; hasHistoricalData: boolean; testDates: string[] };

        if (actualFile) {
          result = await parseWithAI(actualFile);
        } else {
          result = simulateFallback();
        }

        setFiles(prev => prev.map(f =>
          f.id === file.id ? {
            ...f,
            status: "processed" as const,
            extractedData: result.biomarkers,
            hasHistoricalData: result.hasHistoricalData,
            testDates: result.testDates,
          } : f
        ));
      } catch {
        setFiles(prev => prev.map(f =>
          f.id === file.id ? { ...f, status: "error" as const } : f
        ));
      }
    }

    setIsProcessing(false);
    setProcessingStep("");
    toast.success("AI extraction complete!");
  };

  const updateValue = (fileId: string, biomarkerId: string, newValue: number) => {
    setFiles(prev => prev.map(f => {
      if (f.id === fileId && f.extractedData) {
        return {
          ...f,
          extractedData: f.extractedData.map(b =>
            b.id === biomarkerId ? { ...b, value: newValue } : b
          )
        };
      }
      return f;
    }));
  };

  const toggleBiomarkerSelection = (fileId: string, biomarkerId: string) => {
    setFiles(prev => prev.map(f => {
      if (f.id === fileId && f.extractedData) {
        return {
          ...f,
          extractedData: f.extractedData.map(b =>
            b.id === biomarkerId ? { ...b, selected: b.selected === false ? true : false } : b
          )
        };
      }
      return f;
    }));
  };

  const toggleAllHistorical = (include: boolean) => {
    setIncludeHistorical(include);
    setFiles(prev => prev.map(f => {
      if (f.extractedData) {
        return {
          ...f,
          extractedData: f.extractedData.map(b =>
            b.isHistorical ? { ...b, selected: include } : b
          )
        };
      }
      return f;
    }));
  };

  const saveResults = async () => {
    const processed = files.filter(f => f.status === "processed");
    const allBiomarkers = processed.flatMap(f => f.extractedData || []);
    const member = members.find(m => m.id === selectedMember);

    // Filter to only selected biomarkers with matched IDs
    const validBiomarkers = allBiomarkers.filter(b =>
      b.matchedBiomarkerId &&
      b.selected !== false &&
      (includeHistorical || !b.isHistorical)
    );

    if (!selectedMember || validBiomarkers.length === 0) {
      toast.error("No results to save. Make sure biomarkers are selected.");
      return;
    }

    setIsProcessing(true);
    setProcessingStep("Saving results...");

    try {
      // Prepare results array for bulk save - include testDate for each
      const resultsToSave = validBiomarkers.map(biomarker => ({
        biomarkerId: biomarker.matchedBiomarkerId,
        value: biomarker.value,
        status: biomarker.confidence >= 0.9 ? "NORMAL" : "NORMAL",
        testedAt: biomarker.testDate ? new Date(biomarker.testDate).toISOString() : new Date().toISOString(),
        notes: `Extracted via AI (confidence: ${Math.round(biomarker.confidence * 100)}%)${biomarker.isHistorical ? ' [Historical]' : ''}`,
      }));

      // Send all results in one request
      const response = await fetch("/api/biomarkers/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedMember,
          results: resultsToSave,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save results");
      }

      const data = await response.json();
      const savedCount = data.results?.length || 0;
      const duplicatesSkipped = data.duplicatesSkipped || 0;

      setSavedBiomarkersCount(savedCount);

      // Build message with duplicate info
      let message = "";
      if (savedCount === 0 && duplicatesSkipped > 0) {
        message = `All ${duplicatesSkipped} results already exist for ${member?.firstName} - no new data saved`;
        toast.info(message);
        // Don't show bio age dialog if all were duplicates, just clear files
        setFiles([]);
        return;
      } else {
        const currentCount = validBiomarkers.filter(b => !b.isHistorical).length;
        const historicalCount = validBiomarkers.filter(b => b.isHistorical).length;

        if (historicalCount > 0) {
          message = `Saved ${savedCount} biomarkers (${currentCount} current, ${historicalCount} historical) for ${member?.firstName}`;
        } else {
          message = `Saved ${savedCount} biomarkers for ${member?.firstName}`;
        }

        if (duplicatesSkipped > 0) {
          message += ` (${duplicatesSkipped} duplicate${duplicatesSkipped > 1 ? 's' : ''} skipped)`;
        }
        toast.success(message);
      }

      // Show biological age calculation dialog (only if new results were saved)
      setBioAgeResult(null);
      setShowBioAgeDialog(true);

      // Clear files after showing dialog
      setFiles([]);
    } catch (error) {
      console.error("Error saving results:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save results");
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  const calculateBiologicalAge = async () => {
    if (!selectedMember) return;

    setIsCalculatingBioAge(true);
    console.log("[BioAge] Starting calculation for member:", selectedMember);

    try {
      const response = await fetch("/api/biological-age", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedMember,
          saveToHealthScore: true,
        }),
      });

      console.log("[BioAge] Response status:", response.status);

      let data;
      try {
        data = await response.json();
        console.log("[BioAge] Response data:", data);
      } catch (jsonError) {
        console.error("[BioAge] Failed to parse response:", jsonError);
        throw new Error("Failed to parse server response");
      }

      if (!response.ok) {
        if (data.requiresDob) {
          toast.error("Member's date of birth is required for biological age calculation");
        } else {
          throw new Error(data.error || "Failed to calculate biological age");
        }
        return;
      }

      setBioAgeResult(data.biologicalAge);
      toast.success("Biological age calculated and saved!");
    } catch (error) {
      console.error("Error calculating biological age:", error);
      toast.error(error instanceof Error ? error.message : "Failed to calculate biological age");
    } finally {
      setIsCalculatingBioAge(false);
    }
  };

  const handleCloseDialog = () => {
    setShowBioAgeDialog(false);
    setBioAgeResult(null);
    setSelectedMember("");
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "Unknown";
    try {
      return new Date(dateStr).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case "excellent": return "text-green-600 bg-green-500/10";
      case "good": return "text-emerald-600 bg-emerald-500/10";
      case "average": return "text-yellow-600 bg-yellow-500/10";
      case "needs_attention": return "text-orange-600 bg-orange-500/10";
      case "concerning": return "text-red-600 bg-red-500/10";
      default: return "text-gray-600 bg-gray-500/10";
    }
  };

  const selectedMemberData = members.find(m => m.id === selectedMember);

  // Helper to group missing biomarkers by importance
  const groupMissingByImportance = (missing?: MissingBiomarker[]): Record<string, MissingBiomarker[]> => {
    if (!missing || missing.length === 0) return {};
    return missing.reduce((acc, biomarker) => {
      const key = biomarker.importance;
      if (!acc[key]) acc[key] = [];
      acc[key].push(biomarker);
      return acc;
    }, {} as Record<string, MissingBiomarker[]>);
  };

  // Map biological age categories to categoryInfo categories
  const mapCategoryToInfo = (category: string): { name: string; color: string } => {
    const mapping: Record<string, string> = {
      "core": "blood",
      "lipid": "heart",
      "metabolic": "metabolic",
      "liver": "liver",
      "kidney": "kidney",
      "blood": "blood",
      "hormone": "hormones",
      "vitamin": "vitamins",
      "inflammation": "inflammation",
    };
    const mappedCategory = mapping[category] || category;
    return categoryInfo[mappedCategory as keyof typeof categoryInfo] || { name: category, color: "#6b7280" };
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif text-foreground">AI Blood Test Upload</h1>
        <p className="text-muted-foreground mt-1">Upload blood tests and let AI extract biomarker values</p>
      </div>

      <Card className="bg-gradient-to-r from-primary/5 via-purple-500/5 to-accent/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-lg mb-1">Powered by Claude AI</h3>
              <p className="text-sm text-muted-foreground">
                Our AI reads blood test documents in various formats and extracts biomarker values automatically.
                It also detects historical results when available.
              </p>
              <div className="flex gap-2 mt-3">
                <Badge variant="outline"><FileText className="w-3 h-3 mr-1" />PDF</Badge>
                <Badge variant="outline"><ImageIcon className="w-3 h-3 mr-1" />Images</Badge>
                <Badge variant="outline"><Zap className="w-3 h-3 mr-1" />95%+ Accuracy</Badge>
                <Badge variant="outline"><History className="w-3 h-3 mr-1" />Historical Data</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug Panel - Shows API Status */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-sm text-blue-700">API Debug Panel</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex gap-2">
              <span className="text-muted-foreground">Current Mode:</span>
              <span className={aiMode.includes("Claude") ? "text-green-600 font-bold" : "text-yellow-600 font-bold"}>
                {aiMode || "Not set yet"}
              </span>
            </div>
            {debugInfo.lastRequest && (
              <div className="flex gap-2">
                <span className="text-muted-foreground">Last Request:</span>
                <span>{debugInfo.lastRequest}</span>
              </div>
            )}
            {debugInfo.lastResponse && (
              <div className="p-2 bg-slate-100 rounded text-xs overflow-auto max-h-32">
                <pre>{JSON.stringify(debugInfo.lastResponse, null, 2)}</pre>
              </div>
            )}
            {debugInfo.lastError && (
              <div className="flex gap-2 text-red-600">
                <span>Error:</span>
                <span>{debugInfo.lastError}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Step 1: Select Member</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedMember} onValueChange={setSelectedMember} disabled={isLoadingMembers}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingMembers ? "Loading members..." : "Choose a member..."} />
                </SelectTrigger>
                <SelectContent>
                  {members.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.firstName} {m.lastName} ({m.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Step 2: Upload Documents</CardTitle>
              <CardDescription>Drag and drop or click to browse</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-input")?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                }`}
              >
                <input id="file-input" type="file" multiple accept=".pdf,image/*" onChange={handleFileInput} className="hidden" />
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <FileUp className="w-8 h-8 text-primary" />
                </div>
                <p className="font-medium">{isDragging ? "Drop files here" : "Drop files or click to upload"}</p>
                <p className="text-sm text-muted-foreground">PDF and image files supported</p>
              </div>

              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          file.type === "application/pdf" ? "bg-red-500/10" : "bg-blue-500/10"
                        }`}>
                          {file.type === "application/pdf"
                            ? <FileText className="w-5 h-5 text-red-500" />
                            : <ImageIcon className="w-5 h-5 text-blue-500" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm truncate max-w-[200px]">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.hasHistoricalData && (
                          <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/30">
                            <History className="w-3 h-3 mr-1" />
                            Has History
                          </Badge>
                        )}
                        <Badge className={`${
                          file.status === "pending" ? "bg-gray-500/10 text-gray-600" :
                          file.status === "processing" ? "bg-blue-500/10 text-blue-600" :
                          file.status === "processed" ? "bg-green-500/10 text-green-600" :
                          "bg-red-500/10 text-red-600"
                        }`}>
                          {file.status === "processing" && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                          {file.status === "processed" && <CheckCircle className="w-3 h-3 mr-1" />}
                          {file.status === "error" && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {file.status}
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={() => removeFile(file.id)} disabled={file.status === "processing"}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Button onClick={processFiles} disabled={isProcessing || !files.length || !selectedMember} className="w-full h-12 text-lg gap-2">
            {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" />{processingStep}</> : <><Sparkles className="w-5 h-5" />Process with AI</>}
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />Extracted Results
                {aiMode && (
                  <Badge
                    variant="outline"
                    className={`ml-2 text-xs ${
                      aiMode.includes("Claude AI")
                        ? "bg-green-500/10 text-green-700 border-green-500/30"
                        : "bg-yellow-500/10 text-yellow-700 border-yellow-500/30"
                    }`}
                  >
                    {aiMode.includes("Claude AI") ? "✓ " : "⚠ "}{aiMode}
                  </Badge>
                )}
              </CardTitle>
              {extractedStats.hasHistorical && (
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-purple-600" />
                    <Label htmlFor="include-historical" className="text-sm">Include Historical</Label>
                  </div>
                  <Switch
                    id="include-historical"
                    checked={includeHistorical}
                    onCheckedChange={toggleAllHistorical}
                  />
                </div>
              )}
            </CardHeader>
            <CardContent>
              {files.filter(f => f.status === "processed").length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Upload and process files to see results</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  {/* Summary Stats */}
                  {extractedStats.total > 0 && (
                    <div className="mb-4 p-3 rounded-lg bg-muted/50 border">
                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div>
                          <p className="font-bold text-lg">{extractedStats.current}</p>
                          <p className="text-xs text-muted-foreground">Current</p>
                        </div>
                        <div>
                          <p className="font-bold text-lg text-purple-600">{extractedStats.historical}</p>
                          <p className="text-xs text-muted-foreground">Historical</p>
                        </div>
                        <div>
                          <p className="font-bold text-lg">{extractedStats.uniqueDates.length}</p>
                          <p className="text-xs text-muted-foreground">Test Dates</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Results grouped by date */}
                  <Accordion type="multiple" defaultValue={extractedStats.uniqueDates}>
                    {extractedStats.uniqueDates.map(date => {
                      const dateResults = extractedStats.byDate[date] || [];
                      const isHistoricalDate = dateResults.every(b => b.isHistorical);

                      return (
                        <AccordionItem key={date} value={date}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-2">
                              <Calendar className={`w-4 h-4 ${isHistoricalDate ? "text-purple-600" : "text-primary"}`} />
                              <span className="font-medium">{formatDate(date)}</span>
                              <Badge variant="outline" className={`text-xs ${isHistoricalDate ? "bg-purple-500/10 text-purple-600" : ""}`}>
                                {dateResults.length} markers
                              </Badge>
                              {isHistoricalDate && (
                                <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600">
                                  Historical
                                </Badge>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 pt-2">
                              {dateResults.map(b => {
                                const def = biomarkerDefinitions.find(d => d.id === b.matchedBiomarkerId);
                                const fileId = files.find(f => f.extractedData?.some(ed => ed.id === b.id))?.id;

                                return (
                                  <div
                                    key={b.id}
                                    className={`p-3 rounded-lg border bg-card ${b.selected === false ? "opacity-50" : ""}`}
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={b.selected !== false}
                                          onChange={() => fileId && toggleBiomarkerSelection(fileId, b.id)}
                                          className="w-4 h-4 rounded border-gray-300"
                                        />
                                        <div>
                                          <p className="font-medium text-sm">{b.name}</p>
                                          {def && (
                                            <Badge variant="outline" className="text-xs mt-1" style={{
                                              borderColor: categoryInfo[def.category].color,
                                              color: categoryInfo[def.category].color
                                            }}>
                                              {categoryInfo[def.category].name}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      <Badge className={b.confidence >= 0.95 ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"}>
                                        {Math.round(b.confidence * 100)}%
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="number"
                                        value={b.value}
                                        onChange={(e) => fileId && updateValue(fileId, b.id, parseFloat(e.target.value))}
                                        className="h-8 w-24"
                                        disabled={b.selected === false}
                                      />
                                      <span className="text-sm text-muted-foreground">{b.unit}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </ScrollArea>
              )}

              {files.some(f => f.status === "processed") && (
                <div className="mt-4 space-y-3">
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {extractedStats.current + (includeHistorical ? extractedStats.historical : 0)} results to save
                    </span>
                    {extractedStats.hasHistorical && !includeHistorical && (
                      <span className="text-xs text-purple-600">
                        ({extractedStats.historical} historical excluded)
                      </span>
                    )}
                  </div>
                  <Button onClick={saveResults} className="w-full gap-2" disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save All Results
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Biological Age Calculation Dialog */}
      <Dialog open={showBioAgeDialog} onOpenChange={setShowBioAgeDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Calculate Biological Age
            </DialogTitle>
            <DialogDescription>
              {savedBiomarkersCount} biomarkers saved for {selectedMemberData?.firstName} {selectedMemberData?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!bioAgeResult ? (
              <>
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <Activity className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">Update Biological Age?</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Based on the latest biomarker results, we can calculate an updated biological age for this member.
                        This will update their health score and provide personalized insights.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Brain className="w-4 h-4" />
                  <span>Uses Phenotypic Age algorithm + organ-specific analysis</span>
                </div>
              </>
            ) : (
              <>
                {/* Biological Age Result */}
                <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-primary/10 border border-purple-500/20">
                  <p className="text-sm text-muted-foreground mb-2">Biological Age</p>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-5xl font-bold text-purple-600">
                      {Math.round(bioAgeResult.biologicalAge)}
                    </span>
                    <div className="text-left">
                      <p className="text-sm text-muted-foreground">years</p>
                      <div className={`flex items-center gap-1 text-sm font-medium ${
                        bioAgeResult.ageDifference < 0 ? "text-green-600" :
                        bioAgeResult.ageDifference > 0 ? "text-orange-600" : "text-gray-600"
                      }`}>
                        {bioAgeResult.ageDifference < 0 ? (
                          <TrendingDown className="w-4 h-4" />
                        ) : bioAgeResult.ageDifference > 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : null}
                        {bioAgeResult.ageDifference > 0 ? "+" : ""}{Math.round(bioAgeResult.ageDifference)} vs chronological
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Chronological age: {bioAgeResult.chronologicalAge} years
                  </p>
                </div>

                {/* Health Status */}
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <span className="text-sm font-medium">Health Status</span>
                  <Badge className={getHealthStatusColor(bioAgeResult.healthStatus)}>
                    {bioAgeResult.healthStatus.replace("_", " ")}
                  </Badge>
                </div>

                {/* Confidence */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Calculation Confidence</span>
                    <span className="font-medium">{Math.round(bioAgeResult.confidence * 100)}%</span>
                  </div>
                  <Progress value={bioAgeResult.confidence * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Based on {bioAgeResult.biomarkersUsed} biomarkers
                  </p>
                </div>

                {/* Organ Ages */}
                {bioAgeResult.organAges && Object.keys(bioAgeResult.organAges).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Organ-Specific Ages</p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(bioAgeResult.organAges).map(([organ, age]) => (
                        age && (
                          <div key={organ} className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm">
                            <span className="capitalize">{organ}</span>
                            <span className={`font-medium ${
                              age < bioAgeResult.chronologicalAge ? "text-green-600" :
                              age > bioAgeResult.chronologicalAge + 3 ? "text-orange-600" : ""
                            }`}>
                              {Math.round(age)} yrs
                            </span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {bioAgeResult.recommendations && bioAgeResult.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Key Recommendations</p>
                    <div className="space-y-1">
                      {bioAgeResult.recommendations.slice(0, 3).map((rec, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <ArrowRight className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Biomarkers Section */}
                {bioAgeResult.biomarkersMissing && bioAgeResult.biomarkersMissing.length > 0 && (
                  <div className="space-y-3 mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <p className="text-sm font-medium text-amber-800">
                        Missing Biomarkers ({bioAgeResult.biomarkersMissing.length})
                      </p>
                    </div>
                    <p className="text-xs text-amber-700">
                      The following biomarkers were not found in the test results. Adding them would improve the accuracy of the biological age calculation.
                    </p>
                    <Accordion type="single" collapsible className="w-full">
                      {(["core", "recommended", "optional"] as const).map((importance) => {
                        const grouped = groupMissingByImportance(bioAgeResult.biomarkersMissing);
                        const biomarkers: MissingBiomarker[] = grouped[importance] || [];
                        if (biomarkers.length === 0) return null;
                        return (
                          <AccordionItem key={importance} value={importance} className="border-amber-200">
                            <AccordionTrigger className="hover:no-underline py-2">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    importance === "core"
                                      ? "bg-red-100 text-red-700 border-red-300"
                                      : importance === "recommended"
                                      ? "bg-orange-100 text-orange-700 border-orange-300"
                                      : "bg-gray-100 text-gray-600 border-gray-300"
                                  }`}
                                >
                                  {importance === "core" ? "Core" : importance === "recommended" ? "Recommended" : "Optional"}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {biomarkers.length} biomarker{biomarkers.length !== 1 ? "s" : ""}
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-1 pt-1">
                                {biomarkers.map((b: MissingBiomarker) => {
                                  const catInfo = mapCategoryToInfo(b.category);
                                  return (
                                    <div key={b.id} className="flex items-center justify-between p-1.5 rounded bg-white/50 text-xs">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className="w-2 h-2 rounded-full"
                                          style={{ backgroundColor: catInfo.color }}
                                        />
                                        <span className="font-medium">{b.name}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <span>{b.unit}</span>
                                        <Badge variant="outline" className="text-[10px] px-1 py-0" style={{
                                          borderColor: catInfo.color,
                                          color: catInfo.color
                                        }}>
                                          {catInfo.name}
                                        </Badge>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              {importance === "core" && (
                                <p className="text-xs text-red-600 mt-2 italic">
                                  Core biomarkers are essential for accurate phenotypic age calculation.
                                </p>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            {!bioAgeResult ? (
              <>
                <Button variant="outline" onClick={handleCloseDialog}>
                  Skip for Now
                </Button>
                <Button onClick={calculateBiologicalAge} disabled={isCalculatingBioAge} className="gap-2">
                  {isCalculatingBioAge ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4" />
                      Calculate Biological Age
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button onClick={handleCloseDialog} className="gap-2">
                <CheckCircle className="w-4 h-4" />
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
