"use client";

import { useState, useEffect } from "react";
import { Download, Loader2, QrCode, RefreshCw } from "lucide-react";

interface QRCodeStats {
  totalScans: number;
  totalEnrolments: number;
  conversionRate: number;
}

interface QRCodeData {
  qrDataUrl: string;
  qrUrl: string;
  clinicName: string;
  qrToken: string;
  stats: QRCodeStats;
}

export function QRCodePanel() {
  const [data, setData] = useState<QRCodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQRCode = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/gp/qr");
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || "Failed to load QR code");
      }
    } catch {
      setError("Failed to load QR code");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQRCode();
  }, []);

  const handleDownloadPNG = async () => {
    try {
      const response = await fetch("/api/gp/qr/download");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sanative-qr-${data?.qrToken || "code"}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      console.error("Download failed");
    }
  };

  const handleDownloadPoster = () => {
    if (!data) return;

    // Create an SVG poster
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="595" height="842" viewBox="0 0 595 842">
        <!-- A5 size in points -->
        <rect width="595" height="842" fill="#fdfbf7"/>

        <!-- Logo -->
        <text x="297.5" y="80" text-anchor="middle" font-family="Georgia, serif" font-size="36" fill="#34412f">sanative</text>

        <!-- Headline -->
        <text x="297.5" y="140" text-anchor="middle" font-family="system-ui, sans-serif" font-size="24" fill="#34412f">Know your health</text>
        <text x="297.5" y="170" text-anchor="middle" font-family="system-ui, sans-serif" font-size="24" fill="#34412f">before symptoms appear</text>

        <!-- QR Code placeholder area -->
        <rect x="147.5" y="220" width="300" height="300" fill="#04342C" rx="16"/>
        <text x="297.5" y="380" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" fill="white">Scan to enrol</text>

        <!-- Clinic name -->
        <text x="297.5" y="570" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" fill="#5c7a52">${data.clinicName}</text>

        <!-- URL -->
        <text x="297.5" y="610" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" fill="#5c7a52">sanative.com.au/join</text>

        <!-- Trust badges -->
        <text x="297.5" y="760" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#5c7a52">AHPRA Registered • NATA-accredited labs</text>
        <text x="297.5" y="780" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#5c7a52">Australian Privacy Act compliant</text>
      </svg>
    `;

    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sanative-poster-${data.qrToken}.svg`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleDownloadDeskCard = () => {
    if (!data) return;

    // Create a smaller SVG for desk card (A6 size)
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="420" height="595" viewBox="0 0 420 595">
        <!-- A6 size in points -->
        <rect width="420" height="595" fill="#fdfbf7"/>

        <!-- Logo -->
        <text x="210" y="50" text-anchor="middle" font-family="Georgia, serif" font-size="28" fill="#34412f">sanative</text>

        <!-- Headline -->
        <text x="210" y="100" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" fill="#34412f">Scan to join your health program</text>

        <!-- QR Code placeholder area -->
        <rect x="85" y="130" width="250" height="250" fill="#04342C" rx="12"/>
        <text x="210" y="265" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" fill="white">Scan with your phone</text>

        <!-- Clinic name -->
        <text x="210" y="420" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" fill="#5c7a52">${data.clinicName}</text>

        <!-- Price -->
        <text x="210" y="470" text-anchor="middle" font-family="system-ui, sans-serif" font-size="20" font-weight="bold" fill="#34412f">$199/year</text>

        <!-- Includes -->
        <text x="210" y="510" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" fill="#5c7a52">80+ biomarkers • Biological Clock</text>
        <text x="210" y="530" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" fill="#5c7a52">Organ health scores • Care partner support</text>

        <!-- Trust -->
        <text x="210" y="570" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#5c7a52">AHPRA Registered • NATA Labs</text>
      </svg>
    `;

    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sanative-deskcard-${data.qrToken}.svg`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-[#e6ebe3]">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#1D9E75]" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-[#e6ebe3]">
        <div className="text-center py-8">
          <QrCode className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-[#5c7a52] mb-4">{error || "No QR code available"}</p>
          <button
            onClick={fetchQRCode}
            className="flex items-center gap-2 px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm mx-auto hover:bg-[#178a64]"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#e6ebe3]">
      <h2 className="text-lg font-semibold text-[#34412f] mb-4">
        Your Clinic QR Code
      </h2>
      <div className="flex flex-col md:flex-row gap-6">
        {/* QR Code Image */}
        <div className="flex-shrink-0">
          <div className="w-40 h-40 rounded-xl overflow-hidden border-2 border-[#e6ebe3]">
            <img
              src={data.qrDataUrl}
              alt="Clinic QR Code"
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-center text-sm text-[#5c7a52] mt-2">
            {data.clinicName}
          </p>
        </div>

        {/* Stats and Downloads */}
        <div className="flex-1">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#34412f]">
                {data.stats.totalScans}
              </p>
              <p className="text-xs text-[#5c7a52]">Total scans</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#34412f]">
                {data.stats.totalEnrolments}
              </p>
              <p className="text-xs text-[#5c7a52]">Enrolments</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#1D9E75]">
                {data.stats.conversionRate}%
              </p>
              <p className="text-xs text-[#5c7a52]">Conversion</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDownloadPNG}
              className="flex items-center gap-2 px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm hover:bg-[#178a64] transition-colors"
            >
              <Download className="w-4 h-4" />
              QR (PNG)
            </button>
            <button
              onClick={handleDownloadPoster}
              className="flex items-center gap-2 px-4 py-2 border border-[#e6ebe3] rounded-lg text-sm hover:border-[#1D9E75] transition-colors text-[#34412f]"
            >
              <Download className="w-4 h-4" />
              A5 Poster
            </button>
            <button
              onClick={handleDownloadDeskCard}
              className="flex items-center gap-2 px-4 py-2 border border-[#e6ebe3] rounded-lg text-sm hover:border-[#1D9E75] transition-colors text-[#34412f]"
            >
              <Download className="w-4 h-4" />
              Desk Card
            </button>
          </div>

          <p className="text-xs text-[#5c7a52] mt-3">
            Share URL: <code className="bg-[#fdfbf7] px-1 rounded">{data.qrUrl}</code>
          </p>
        </div>
      </div>
    </div>
  );
}
