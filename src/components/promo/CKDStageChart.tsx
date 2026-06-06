"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle, Info, ArrowRight } from "lucide-react";

interface Stage {
  stage: string;
  name: string;
  eGFR: string;
  description: string;
  symptoms: string[];
  action: string;
  color: string;
  bgColor: string;
  textColor: string;
}

const ckdStages: Stage[] = [
  {
    stage: "1",
    name: "Normal or High",
    eGFR: "≥90",
    description: "Kidney damage with normal or increased GFR",
    symptoms: ["Usually no symptoms", "May have protein in urine"],
    action: "Monitor and manage risk factors",
    color: "bg-green-500",
    bgColor: "bg-green-50",
    textColor: "text-green-700"
  },
  {
    stage: "2",
    name: "Mildly Decreased",
    eGFR: "60-89",
    description: "Mild reduction in GFR with kidney damage",
    symptoms: ["Usually no symptoms", "May have slightly elevated creatinine"],
    action: "Lifestyle changes and monitoring",
    color: "bg-lime-500",
    bgColor: "bg-lime-50",
    textColor: "text-lime-700"
  },
  {
    stage: "3a",
    name: "Mild-Moderate",
    eGFR: "45-59",
    description: "Mild to moderate reduction in GFR",
    symptoms: ["Fatigue may begin", "Fluid retention possible"],
    action: "More frequent monitoring, dietary changes",
    color: "bg-yellow-500",
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-700"
  },
  {
    stage: "3b",
    name: "Moderate-Severe",
    eGFR: "30-44",
    description: "Moderate to severe reduction in GFR",
    symptoms: ["Increased fatigue", "Swelling in extremities", "Changes in urination"],
    action: "Specialist referral recommended",
    color: "bg-amber-500",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700"
  },
  {
    stage: "4",
    name: "Severely Decreased",
    eGFR: "15-29",
    description: "Severe reduction in GFR",
    symptoms: ["Nausea and poor appetite", "Sleep problems", "Muscle cramps"],
    action: "Prepare for dialysis or transplant",
    color: "bg-orange-500",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700"
  },
  {
    stage: "5",
    name: "Kidney Failure",
    eGFR: "<15",
    description: "Kidney failure requiring treatment",
    symptoms: ["Severe fatigue", "Shortness of breath", "Confusion"],
    action: "Dialysis or transplant required",
    color: "bg-red-500",
    bgColor: "bg-red-50",
    textColor: "text-red-700"
  }
];

export function CKDStageChart() {
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-3xl border border-teal-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-teal-100 bg-gradient-to-r from-teal-50 to-cyan-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
            <Info className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h3 className="text-lg font-serif text-gray-900">CKD Stage Progression</h3>
            <p className="text-sm text-gray-500">Based on eGFR (mL/min/1.73m²)</p>
          </div>
        </div>
      </div>

      {/* Interactive Gauge */}
      <div className="p-6">
        {/* Visual Bar */}
        <div className="relative mb-6">
          <div className="flex h-12 rounded-xl overflow-hidden">
            {ckdStages.map((stage, index) => (
              <button
                key={stage.stage}
                onClick={() => setSelectedStage(stage)}
                onMouseEnter={() => setHoveredStage(stage.stage)}
                onMouseLeave={() => setHoveredStage(null)}
                className={`flex-1 ${stage.color} transition-all duration-200 relative group ${
                  hoveredStage === stage.stage ? "scale-y-110 z-10" : ""
                } ${selectedStage?.stage === stage.stage ? "ring-2 ring-offset-2 ring-gray-900" : ""}`}
                style={{ width: index === 0 || index === 5 ? "12%" : index === 1 ? "18%" : "20%" }}
              >
                <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  Stage {stage.stage}
                </span>
              </button>
            ))}
          </div>

          {/* eGFR Labels */}
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>0</span>
            <span>15</span>
            <span>30</span>
            <span>45</span>
            <span>60</span>
            <span>90</span>
            <span>120+</span>
          </div>
        </div>

        {/* Stage Pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {ckdStages.map((stage) => (
            <button
              key={stage.stage}
              onClick={() => setSelectedStage(stage)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedStage?.stage === stage.stage
                  ? `${stage.bgColor} ${stage.textColor} ring-2 ring-offset-1 ${stage.color.replace("bg-", "ring-")}`
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Stage {stage.stage}: {stage.eGFR}
            </button>
          ))}
        </div>

        {/* Selected Stage Details */}
        {selectedStage ? (
          <div className={`${selectedStage.bgColor} rounded-2xl p-5 border ${selectedStage.color.replace("bg-", "border-")}/30`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-3 h-3 rounded-full ${selectedStage.color}`} />
                  <span className={`font-semibold ${selectedStage.textColor}`}>
                    Stage {selectedStage.stage}: {selectedStage.name}
                  </span>
                </div>
                <p className="text-sm text-gray-600">eGFR: {selectedStage.eGFR} mL/min/1.73m²</p>
              </div>
              <div className={`px-3 py-1 rounded-full ${selectedStage.color} text-white text-xs font-medium`}>
                {parseInt(selectedStage.stage) <= 2 ? "Early" : parseInt(selectedStage.stage) <= 3 ? "Moderate" : "Advanced"}
              </div>
            </div>

            <p className="text-sm text-gray-700 mb-4">{selectedStage.description}</p>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Typical Symptoms</p>
                <ul className="space-y-1">
                  {selectedStage.symptoms.map((symptom, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedStage.color}`} />
                      {symptom}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Recommended Action</p>
                <div className="flex items-start gap-2">
                  {parseInt(selectedStage.stage) <= 2 ? (
                    <CheckCircle className={`w-4 h-4 ${selectedStage.textColor} flex-shrink-0 mt-0.5`} />
                  ) : (
                    <AlertTriangle className={`w-4 h-4 ${selectedStage.textColor} flex-shrink-0 mt-0.5`} />
                  )}
                  <span className="text-sm text-gray-600">{selectedStage.action}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl p-5 text-center">
            <p className="text-gray-500 text-sm">Click on a stage above to see details</p>
          </div>
        )}

        {/* NKF Reference */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            Reference: National Kidney Foundation. CKD is classified based on eGFR and presence of kidney damage.
          </p>
        </div>
      </div>
    </div>
  );
}
