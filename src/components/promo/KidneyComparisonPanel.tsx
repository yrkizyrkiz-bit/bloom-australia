"use client";

import { useState } from "react";
import { CheckCircle, XCircle, ArrowRight, AlertTriangle, Sparkles } from "lucide-react";

export function KidneyComparisonPanel() {
  const [activeView, setActiveView] = useState<"normal" | "fatty">("normal");

  const normalKidney = {
    title: "Healthy Kidney",
    color: "teal",
    description: "Normal kidney tissue with proper fat distribution and optimal filtration capacity.",
    characteristics: [
      { label: "Fat Content", value: "Minimal (<1%)", status: "good" },
      { label: "eGFR", value: "≥90 mL/min", status: "good" },
      { label: "Filtration", value: "Normal", status: "good" },
      { label: "Inflammation", value: "Low", status: "good" },
    ],
    markers: {
      creatinine: "Normal",
      triglycerides: "Normal",
      insulin: "Normal",
      adiponectin: "Normal/High"
    }
  };

  const fattyKidney = {
    title: "Fatty Kidney",
    color: "amber",
    description: "Ectopic fat accumulation in kidney tissue, often associated with metabolic dysfunction.",
    characteristics: [
      { label: "Fat Content", value: "Elevated (>1.5%)", status: "bad" },
      { label: "eGFR", value: "May decrease", status: "warning" },
      { label: "Filtration", value: "Impaired", status: "warning" },
      { label: "Inflammation", value: "Elevated", status: "bad" },
    ],
    markers: {
      creatinine: "Elevated",
      triglycerides: "High",
      insulin: "High (Resistance)",
      adiponectin: "Low"
    }
  };

  const current = activeView === "normal" ? normalKidney : fattyKidney;

  return (
    <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden">
      {/* Toggle */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="flex rounded-xl bg-gray-200 p-1">
          <button
            onClick={() => setActiveView("normal")}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeView === "normal"
                ? "bg-white text-teal-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Healthy Kidney
          </button>
          <button
            onClick={() => setActiveView("fatty")}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeView === "fatty"
                ? "bg-white text-amber-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Fatty Kidney
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Visual Illustration */}
        <div className={`relative rounded-2xl p-8 mb-6 ${
          activeView === "normal"
            ? "bg-gradient-to-br from-teal-50 to-cyan-50"
            : "bg-gradient-to-br from-amber-50 to-orange-50"
        }`}>
          <div className="flex items-center justify-center">
            {/* Stylized Kidney SVG */}
            <div className="relative">
              <svg viewBox="0 0 200 240" className="w-40 h-48">
                {/* Kidney shape */}
                <path
                  d="M100 20 C60 20, 30 60, 30 100 C30 160, 60 200, 100 220 C140 200, 170 160, 170 100 C170 60, 140 20, 100 20"
                  fill={activeView === "normal" ? "#99f6e4" : "#fde68a"}
                  stroke={activeView === "normal" ? "#14b8a6" : "#f59e0b"}
                  strokeWidth="3"
                />
                {/* Inner detail - hilum */}
                <ellipse
                  cx="65"
                  cy="110"
                  rx="15"
                  ry="30"
                  fill={activeView === "normal" ? "#5eead4" : "#fbbf24"}
                />

                {/* Fat deposits for fatty kidney */}
                {activeView === "fatty" && (
                  <>
                    <circle cx="90" cy="70" r="12" fill="#fcd34d" opacity="0.7" />
                    <circle cx="120" cy="90" r="15" fill="#fcd34d" opacity="0.6" />
                    <circle cx="100" cy="130" r="18" fill="#fcd34d" opacity="0.7" />
                    <circle cx="130" cy="150" r="14" fill="#fcd34d" opacity="0.6" />
                    <circle cx="85" cy="170" r="12" fill="#fcd34d" opacity="0.7" />
                    <circle cx="110" cy="180" r="10" fill="#fcd34d" opacity="0.5" />
                  </>
                )}

                {/* Healthy glow for normal */}
                {activeView === "normal" && (
                  <ellipse
                    cx="110"
                    cy="110"
                    rx="25"
                    ry="40"
                    fill="#14b8a6"
                    opacity="0.15"
                  />
                )}
              </svg>

              {/* Badge */}
              <div className={`absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-bold ${
                activeView === "normal"
                  ? "bg-teal-500 text-white"
                  : "bg-amber-500 text-white"
              }`}>
                {activeView === "normal" ? "Healthy" : "At Risk"}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className={`w-3 h-3 rounded-full ${activeView === "normal" ? "bg-teal-400" : "bg-amber-300"}`} />
              Kidney Tissue
            </div>
            {activeView === "fatty" && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-3 h-3 rounded-full bg-yellow-300" />
                Fat Deposits
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className={`rounded-xl p-4 mb-6 ${
          activeView === "normal" ? "bg-teal-50" : "bg-amber-50"
        }`}>
          <h4 className={`font-semibold mb-2 ${
            activeView === "normal" ? "text-teal-800" : "text-amber-800"
          }`}>
            {current.title}
          </h4>
          <p className="text-sm text-gray-600">{current.description}</p>
        </div>

        {/* Characteristics */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {current.characteristics.map((char) => (
            <div key={char.label} className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">{char.label}</span>
                {char.status === "good" ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : char.status === "warning" ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
              <span className={`text-sm font-medium ${
                char.status === "good" ? "text-green-700" :
                char.status === "warning" ? "text-amber-700" : "text-red-700"
              }`}>
                {char.value}
              </span>
            </div>
          ))}
        </div>

        {/* Biomarker Indicators */}
        <div className={`rounded-xl p-4 border ${
          activeView === "normal" ? "border-teal-200 bg-teal-50/50" : "border-amber-200 bg-amber-50/50"
        }`}>
          <h5 className="text-sm font-medium text-gray-900 mb-3">Associated Biomarker Patterns</h5>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(current.markers).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  activeView === "normal" ? "bg-teal-500" : "bg-amber-500"
                }`} />
                <span className="text-xs text-gray-600">
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>:
                  <span className={`ml-1 font-medium ${
                    activeView === "normal" ? "text-teal-700" : "text-amber-700"
                  }`}>{value}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Connection to MASLD */}
        {activeView === "fatty" && (
          <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-800 mb-1">Connected to Fatty Liver (MASLD)</p>
                <p className="text-xs text-orange-700">
                  Fatty kidney almost never occurs in isolation. It shares the same metabolic root cause as MASLD,
                  and liver fibrosis scores (FIB-4, NFS) can predict kidney risk.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
