"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Save,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface BiomarkerCampaign {
  id: string;
  key: string;
  name: string;
  headline: string;
  description: string;
  program: string;
  programPath: string;
  programPrice: string;
  crossSellEnabled: boolean;
  crossSell: string | null;
  crossSellPath: string | null;
  crossSellPrice: string | null;
  thresholdHigh: number;
  thresholdMedium: number;
  thresholdLow: number;
  quizTypes: string[];
  genderFilter: "ALL" | "MALE_ONLY" | "FEMALE_ONLY";
  isEnabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const QUIZ_TYPES = [
  { value: "WEIGHT_MANAGEMENT", label: "Weight Management" },
  { value: "WOMENS_HEALTH", label: "Women's Health" },
  { value: "MENS_HEALTH", label: "Men's Health" },
  { value: "HAIR_LOSS", label: "Hair Loss" },
  { value: "FATTY_LIVER", label: "Fatty Liver" },
];

const GENDER_FILTERS = [
  { value: "ALL", label: "All Genders" },
  { value: "MALE_ONLY", label: "Male Only" },
  { value: "FEMALE_ONLY", label: "Female Only" },
];

const DEFAULT_CAMPAIGN: Partial<BiomarkerCampaign> = {
  key: "",
  name: "",
  headline: "",
  description: "",
  program: "",
  programPath: "",
  programPrice: "",
  crossSellEnabled: false,
  crossSell: "",
  crossSellPath: "",
  crossSellPrice: "",
  thresholdHigh: 60,
  thresholdMedium: 35,
  thresholdLow: 20,
  quizTypes: [],
  genderFilter: "ALL",
  isEnabled: true,
  sortOrder: 0,
};

export default function BiomarkerCampaignsPage() {
  const [campaigns, setCampaigns] = useState<BiomarkerCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Partial<BiomarkerCampaign> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/biomarker-campaigns");
      if (!response.ok) throw new Error("Failed to fetch campaigns");
      const data = await response.json();
      setCampaigns(data);
    } catch (err) {
      setError("Failed to load campaigns");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingCampaign) return;

    setIsSaving(true);
    try {
      const method = isCreating ? "POST" : "PUT";
      const response = await fetch("/api/admin/biomarker-campaigns", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCampaign),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to save campaign");
      }

      await fetchCampaigns();
      setEditingCampaign(null);
      setIsCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save campaign");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;

    try {
      const response = await fetch(`/api/admin/biomarker-campaigns?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete campaign");
      await fetchCampaigns();
    } catch (err) {
      setError("Failed to delete campaign");
      console.error(err);
    }
  };

  const handleToggleEnabled = async (campaign: BiomarkerCampaign) => {
    try {
      const response = await fetch("/api/admin/biomarker-campaigns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: campaign.id,
          isEnabled: !campaign.isEnabled,
        }),
      });

      if (!response.ok) throw new Error("Failed to update campaign");
      await fetchCampaigns();
    } catch (err) {
      setError("Failed to update campaign");
      console.error(err);
    }
  };

  const toggleQuizType = (quizType: string) => {
    if (!editingCampaign) return;
    const current = editingCampaign.quizTypes || [];
    const updated = current.includes(quizType)
      ? current.filter((t) => t !== quizType)
      : [...current, quizType];
    setEditingCampaign({ ...editingCampaign, quizTypes: updated });
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[#5c7a52]/30 border-t-[#5c7a52] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-serif text-gray-900 flex items-center gap-2">
              <FlaskConical className="w-6 h-6 text-[#5c7a52]" />
              Campaign Products - Biomarkers
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage biomarker cross-sell campaigns shown at the end of quizzes
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingCampaign(DEFAULT_CAMPAIGN);
            setIsCreating(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#5c7a52] text-white rounded-lg hover:bg-[#4a6343] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Campaign
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Campaign List */}
      <div className="space-y-4">
        {campaigns.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
            <FlaskConical className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No biomarker campaigns configured yet.</p>
            <button
              onClick={() => {
                setEditingCampaign(DEFAULT_CAMPAIGN);
                setIsCreating(true);
              }}
              className="mt-4 text-[#5c7a52] font-medium hover:underline"
            >
              Create your first campaign
            </button>
          </div>
        ) : (
          campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className={`bg-white border rounded-xl overflow-hidden transition-all ${
                campaign.isEnabled ? "border-gray-200" : "border-gray-100 opacity-60"
              }`}
            >
              {/* Campaign Header */}
              <div className="p-4 flex items-center gap-4">
                <button
                  onClick={() => handleToggleEnabled(campaign)}
                  className={`flex-shrink-0 ${
                    campaign.isEnabled ? "text-[#5c7a52]" : "text-gray-400"
                  }`}
                  title={campaign.isEnabled ? "Enabled - Click to disable" : "Disabled - Click to enable"}
                >
                  {campaign.isEnabled ? (
                    <ToggleRight className="w-8 h-8" />
                  ) : (
                    <ToggleLeft className="w-8 h-8" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                      {campaign.key}
                    </span>
                    <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        campaign.genderFilter === "ALL"
                          ? "bg-gray-100 text-gray-600"
                          : campaign.genderFilter === "MALE_ONLY"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-pink-100 text-pink-700"
                      }`}
                    >
                      {GENDER_FILTERS.find((g) => g.value === campaign.genderFilter)?.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate mt-1">{campaign.headline}</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {campaign.quizTypes.map((qt) => (
                    <span
                      key={qt}
                      className="text-xs px-2 py-1 bg-[#e6ebe3] text-[#5c7a52] rounded"
                    >
                      {QUIZ_TYPES.find((t) => t.value === qt)?.label || qt}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedId(expandedId === campaign.id ? null : campaign.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {expandedId === campaign.id ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditingCampaign(campaign);
                      setIsCreating(false);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(campaign.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === campaign.id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Primary Program</p>
                      <p className="text-sm font-medium">{campaign.program}</p>
                      <p className="text-xs text-gray-500">{campaign.programPath}</p>
                      <p className="text-sm text-[#5c7a52] font-medium">{campaign.programPrice}</p>
                    </div>
                    {campaign.crossSellEnabled && campaign.crossSell && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Cross-Sell</p>
                        <p className="text-sm font-medium">{campaign.crossSell}</p>
                        <p className="text-xs text-gray-500">{campaign.crossSellPath}</p>
                        <p className="text-sm text-blue-600 font-medium">{campaign.crossSellPrice}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Description</p>
                    <p className="text-sm text-gray-700">{campaign.description}</p>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">High:</span>{" "}
                      <span className="font-mono text-red-600">{campaign.thresholdHigh}+</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Medium:</span>{" "}
                      <span className="font-mono text-amber-600">{campaign.thresholdMedium}+</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Low:</span>{" "}
                      <span className="font-mono text-gray-600">{campaign.thresholdLow}+</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Edit/Create Modal */}
      {editingCampaign && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {isCreating ? "Create Biomarker Campaign" : "Edit Campaign"}
              </h2>
              <button
                onClick={() => {
                  setEditingCampaign(null);
                  setIsCreating(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Key (unique identifier)
                  </label>
                  <input
                    type="text"
                    value={editingCampaign.key || ""}
                    onChange={(e) =>
                      setEditingCampaign({ ...editingCampaign, key: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "") })
                    }
                    disabled={!isCreating}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5c7a52]/20 focus:border-[#5c7a52] outline-none disabled:bg-gray-100"
                    placeholder="e.g., homaIR"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editingCampaign.name || ""}
                    onChange={(e) =>
                      setEditingCampaign({ ...editingCampaign, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5c7a52]/20 focus:border-[#5c7a52] outline-none"
                    placeholder="e.g., Insulin Resistance (HOMA-IR)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Headline
                </label>
                <input
                  type="text"
                  value={editingCampaign.headline || ""}
                  onChange={(e) =>
                    setEditingCampaign({ ...editingCampaign, headline: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5c7a52]/20 focus:border-[#5c7a52] outline-none"
                  placeholder="e.g., Insulin resistance may be the missing piece"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Why)
                </label>
                <textarea
                  value={editingCampaign.description || ""}
                  onChange={(e) =>
                    setEditingCampaign({ ...editingCampaign, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5c7a52]/20 focus:border-[#5c7a52] outline-none"
                  placeholder="Explanation shown when user expands the card..."
                />
              </div>

              {/* Primary Program */}
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">Primary Program</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Program Name
                    </label>
                    <input
                      type="text"
                      value={editingCampaign.program || ""}
                      onChange={(e) =>
                        setEditingCampaign({ ...editingCampaign, program: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5c7a52]/20 focus:border-[#5c7a52] outline-none"
                      placeholder="Weight Management"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Path
                    </label>
                    <input
                      type="text"
                      value={editingCampaign.programPath || ""}
                      onChange={(e) =>
                        setEditingCampaign({ ...editingCampaign, programPath: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5c7a52]/20 focus:border-[#5c7a52] outline-none"
                      placeholder="/weight-management/assessment"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price
                    </label>
                    <input
                      type="text"
                      value={editingCampaign.programPrice || ""}
                      onChange={(e) =>
                        setEditingCampaign({ ...editingCampaign, programPrice: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5c7a52]/20 focus:border-[#5c7a52] outline-none"
                      placeholder="e.g. From $249"
                    />
                  </div>
                </div>
              </div>

              {/* Cross-Sell */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">Cross-Sell Program</h3>
                  <button
                    onClick={() =>
                      setEditingCampaign({
                        ...editingCampaign,
                        crossSellEnabled: !editingCampaign.crossSellEnabled,
                      })
                    }
                    className={`flex items-center gap-2 text-sm ${
                      editingCampaign.crossSellEnabled ? "text-[#5c7a52]" : "text-gray-400"
                    }`}
                  >
                    {editingCampaign.crossSellEnabled ? (
                      <ToggleRight className="w-6 h-6" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                    {editingCampaign.crossSellEnabled ? "Enabled" : "Disabled"}
                  </button>
                </div>
                {editingCampaign.crossSellEnabled && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Program Name
                      </label>
                      <input
                        type="text"
                        value={editingCampaign.crossSell || ""}
                        onChange={(e) =>
                          setEditingCampaign({ ...editingCampaign, crossSell: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5c7a52]/20 focus:border-[#5c7a52] outline-none"
                        placeholder="Fatty Liver Program"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Path
                      </label>
                      <input
                        type="text"
                        value={editingCampaign.crossSellPath || ""}
                        onChange={(e) =>
                          setEditingCampaign({ ...editingCampaign, crossSellPath: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5c7a52]/20 focus:border-[#5c7a52] outline-none"
                        placeholder="/metabolic-care/fatty-liver"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price
                      </label>
                      <input
                        type="text"
                        value={editingCampaign.crossSellPrice || ""}
                        onChange={(e) =>
                          setEditingCampaign({ ...editingCampaign, crossSellPrice: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5c7a52]/20 focus:border-[#5c7a52] outline-none"
                        placeholder="$199/mo"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Thresholds */}
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">Score Thresholds</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      High Severity (Red)
                    </label>
                    <input
                      type="number"
                      value={editingCampaign.thresholdHigh || 60}
                      onChange={(e) =>
                        setEditingCampaign({ ...editingCampaign, thresholdHigh: parseInt(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5c7a52]/20 focus:border-[#5c7a52] outline-none"
                      min={0}
                      max={100}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medium Severity (Yellow)
                    </label>
                    <input
                      type="number"
                      value={editingCampaign.thresholdMedium || 35}
                      onChange={(e) =>
                        setEditingCampaign({ ...editingCampaign, thresholdMedium: parseInt(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5c7a52]/20 focus:border-[#5c7a52] outline-none"
                      min={0}
                      max={100}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Low / Show Threshold
                    </label>
                    <input
                      type="number"
                      value={editingCampaign.thresholdLow || 20}
                      onChange={(e) =>
                        setEditingCampaign({ ...editingCampaign, thresholdLow: parseInt(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5c7a52]/20 focus:border-[#5c7a52] outline-none"
                      min={0}
                      max={100}
                    />
                  </div>
                </div>
              </div>

              {/* Quiz Types */}
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">Show in Quizzes</h3>
                <div className="flex flex-wrap gap-2">
                  {QUIZ_TYPES.map((qt) => (
                    <button
                      key={qt.value}
                      onClick={() => toggleQuizType(qt.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        editingCampaign.quizTypes?.includes(qt.value)
                          ? "bg-[#5c7a52] text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {qt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gender Filter */}
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">Gender Filter</h3>
                <div className="flex gap-2">
                  {GENDER_FILTERS.map((gf) => (
                    <button
                      key={gf.value}
                      onClick={() =>
                        setEditingCampaign({
                          ...editingCampaign,
                          genderFilter: gf.value as "ALL" | "MALE_ONLY" | "FEMALE_ONLY",
                        })
                      }
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        editingCampaign.genderFilter === gf.value
                          ? "bg-[#5c7a52] text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {gf.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Order & Status */}
              <div className="border-t pt-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={editingCampaign.sortOrder || 0}
                      onChange={(e) =>
                        setEditingCampaign({ ...editingCampaign, sortOrder: parseInt(e.target.value) })
                      }
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5c7a52]/20 focus:border-[#5c7a52] outline-none"
                      min={0}
                    />
                  </div>
                </div>
                <button
                  onClick={() =>
                    setEditingCampaign({
                      ...editingCampaign,
                      isEnabled: !editingCampaign.isEnabled,
                    })
                  }
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                    editingCampaign.isEnabled
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {editingCampaign.isEnabled ? (
                    <>
                      <Check className="w-4 h-4" />
                      Enabled
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      Disabled
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setEditingCampaign(null);
                  setIsCreating(false);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-[#5c7a52] text-white rounded-lg hover:bg-[#4a6343] transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isCreating ? "Create Campaign" : "Save Changes"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
