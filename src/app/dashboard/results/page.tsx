"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
} from "lucide-react";

interface BiomarkerHistory {
  date: string;
  value: number;
  status: string;
}

interface BiomarkerResult {
  name: string;
  category: string;
  latestValue: number;
  unit: string;
  referenceRange: string;
  status: "NORMAL" | "BORDERLINE" | "ELEVATED" | "LOW";
  trend: "up" | "down" | "stable";
  testedAt: string;
  labName: string | null;
  history: BiomarkerHistory[];
}

const biomarkerExplanations: Record<string, string> = {
  eGFR: "eGFR (estimated Glomerular Filtration Rate) measures how well your kidneys filter waste from your blood. A value below 90 may indicate early kidney function decline.",
  Creatinine: "Creatinine is a waste product produced by muscles and filtered by the kidneys. Higher levels may indicate reduced kidney function.",
  ALT: "ALT (Alanine Aminotransferase) is an enzyme primarily found in the liver. Elevated levels may indicate liver inflammation or damage.",
  AST: "AST (Aspartate Aminotransferase) is an enzyme found in the liver and heart. Elevated levels may indicate tissue damage.",
  HbA1c: "HbA1c measures your average blood sugar over the past 2-3 months. Values between 5.7-6.4% indicate prediabetes.",
  "Total Cholesterol": "Total cholesterol measures all cholesterol in your blood. Keeping it below 5.5 mmol/L is ideal for heart health.",
  LDL: "LDL ('bad' cholesterol) can build up in arteries. Lower levels are generally better for heart health.",
  HDL: "HDL ('good' cholesterol) helps remove other forms of cholesterol from your blood. Higher levels are protective.",
  Triglycerides: "Triglycerides are a type of fat in your blood. High levels increase the risk of heart disease.",
};

export default function DashboardResultsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [results, setResults] = useState<BiomarkerResult[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedCategory !== "All") params.set("category", selectedCategory);
      if (selectedStatus !== "All") params.set("status", selectedStatus);

      const res = await fetch(`/api/patient/results?${params}`);
      const data = await res.json();

      if (data.success) {
        setResults(data.data.results);
        setCategories(["All", ...data.data.categories]);
      } else {
        setError(data.message || "Failed to load results");
      }
    } catch (err) {
      console.error("Error fetching results:", err);
      setError("Failed to load results");
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedStatus]);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchResults();
    }
  }, [sessionStatus, fetchResults]);

  const filteredResults = results.filter((result) =>
    result.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: BiomarkerResult["status"]) => {
    const styles = {
      NORMAL: "bg-green-100 text-green-700",
      BORDERLINE: "bg-amber-100 text-amber-700",
      ELEVATED: "bg-red-100 text-red-700",
      LOW: "bg-blue-100 text-blue-700",
    };
    const labels = {
      NORMAL: "Normal",
      BORDERLINE: "Borderline",
      ELEVATED: "Elevated",
      LOW: "Low",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  const getTrendIcon = (trend: BiomarkerResult["trend"]) => {
    const icons = {
      up: <TrendingUp className="w-4 h-4 text-amber-500" />,
      down: <TrendingDown className="w-4 h-4 text-green-500" />,
      stable: <Minus className="w-4 h-4 text-gray-400" />,
    };
    return icons[trend];
  };

  if (sessionStatus === "loading" || isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1D9E75]" />
      </div>
    );
  }

  if (sessionStatus === "unauthenticated") {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-[#5c7a52] mb-4">Please log in to view results</p>
          <Link href="/login" className="text-[#1D9E75] hover:underline">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchResults}
            className="text-[#1D9E75] hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-serif text-[#34412f]">
            Biomarker Results
          </h1>
          <p className="text-[#5c7a52]">View and track all your test results</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm hover:bg-[#178a64] transition-colors">
          <Download className="w-4 h-4" />
          Download full report
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#e6ebe3] p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search biomarkers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#e6ebe3] focus:outline-none focus:border-[#1D9E75] text-sm"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 rounded-lg border border-[#e6ebe3] focus:outline-none focus:border-[#1D9E75] text-sm bg-white"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 rounded-lg border border-[#e6ebe3] focus:outline-none focus:border-[#1D9E75] text-sm bg-white"
            >
              <option value="All">All</option>
              <option value="Flagged">Flagged</option>
              <option value="Normal">Normal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {filteredResults.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e6ebe3] p-12 text-center">
          <p className="text-[#5c7a52]">
            {results.length === 0
              ? "No biomarker results yet. Complete your first test to see results here."
              : "No results match your search criteria."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#e6ebe3] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-[#5c7a52] uppercase tracking-wider border-b border-[#e6ebe3] bg-[#fdfbf7]">
                  <th className="px-6 py-4">Biomarker</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Latest Value</th>
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Trend</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((result) => (
                  <>
                    <tr
                      key={result.name}
                      className="border-b border-[#e6ebe3] hover:bg-[#fdfbf7] cursor-pointer"
                      onClick={() =>
                        setExpandedResult(
                          expandedResult === result.name ? null : result.name
                        )
                      }
                    >
                      <td className="px-6 py-4 font-medium text-[#34412f]">
                        {result.name}
                      </td>
                      <td className="px-6 py-4 text-[#5c7a52]">
                        {result.category}
                      </td>
                      <td className="px-6 py-4 text-[#34412f]">
                        {result.latestValue} {result.unit}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#5c7a52]">
                        {result.referenceRange}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(result.status)}</td>
                      <td className="px-6 py-4">{getTrendIcon(result.trend)}</td>
                      <td className="px-6 py-4 text-sm text-[#5c7a52]">
                        {new Date(result.testedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {expandedResult === result.name ? (
                          <ChevronUp className="w-4 h-4 text-[#5c7a52]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#5c7a52]" />
                        )}
                      </td>
                    </tr>
                    {expandedResult === result.name && (
                      <tr key={`${result.name}-expanded`} className="bg-[#fdfbf7]">
                        <td colSpan={8} className="px-6 py-6">
                          <div className="grid md:grid-cols-2 gap-6">
                            {/* History Chart */}
                            <div className="bg-white rounded-xl p-4 border border-[#e6ebe3]">
                              <h4 className="font-medium text-[#34412f] mb-3">
                                History
                              </h4>
                              {result.history.length > 0 ? (
                                <div className="h-40 flex items-end gap-2">
                                  {result.history.slice(0, 6).map((point, index) => {
                                    const maxVal = Math.max(
                                      ...result.history.map((h) => h.value)
                                    );
                                    const height = (point.value / maxVal) * 100;
                                    return (
                                      <div
                                        key={index}
                                        className="flex-1 flex flex-col items-center gap-1"
                                      >
                                        <div
                                          className="w-full bg-[#1D9E75] rounded-t"
                                          style={{ height: `${height}%` }}
                                        />
                                        <span className="text-[10px] text-[#5c7a52]">
                                          {new Date(point.date).toLocaleDateString(
                                            "en-AU",
                                            { month: "short" }
                                          )}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-sm text-[#5c7a52]">
                                  No historical data available
                                </p>
                              )}
                            </div>

                            {/* Explanation */}
                            <div className="bg-white rounded-xl p-4 border border-[#e6ebe3]">
                              <h4 className="font-medium text-[#34412f] mb-3">
                                What this means
                              </h4>
                              <p className="text-sm text-[#5c7a52] leading-relaxed">
                                {biomarkerExplanations[result.name] ||
                                  `${result.name} is a biomarker that helps assess your health. Your care partner can provide more detailed information about what this result means for you.`}
                              </p>
                              {result.labName && (
                                <p className="text-xs text-[#5c7a52] mt-3">
                                  Tested at: {result.labName}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
