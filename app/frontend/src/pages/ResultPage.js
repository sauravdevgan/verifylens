import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";
import axios from "axios";
import {
  ArrowLeft, Share2, Copy, Check, AlertTriangle, CheckCircle2,
  Minus, Loader2, ExternalLink, Trash2, Download, ScanEye
} from "lucide-react";
import html2canvas from "html2canvas";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const dataURLtoFile = (dataurl, filename) => {
  try {
    const arr = dataurl.split(',');
    const match = arr[0].match(/:(.*?);/);
    if (!match) return null;
    const mime = match[1];
    const bstr = atob(arr[arr.length - 1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  } catch (e) {
    console.error("Failed to convert dataURL to file", e);
    return null;
  }
};

function ScoreCircle({ score, verdict }) {
  const isReal = verdict === "Likely Real";
  const color = isReal ? "hsl(var(--brand-real))" : "hsl(var(--brand-fake))";
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="score-circle" data-testid="score-circle">
      <svg width="140" height="140" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
        <circle
          cx="60" cy="60" r={radius} fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono-data text-3xl font-bold" style={{ color }}>
          {score.toFixed(1)}
        </span>
        <span className="text-xs text-muted-foreground mt-0.5">confidence</span>
      </div>
    </div>
  );
}

function ShareableScorecard({ analysis }) {
  if (!analysis) return null;
  const isReal = analysis.verdict === "Likely Real";
  const confidence = analysis.confidence_score.toFixed(1);

  return (
    <div 
      id="fancy-snapshot" 
      className="relative w-[1080px] h-[1080px] flex flex-col justify-end overflow-hidden bg-black font-sans"
    >
      {/* Background Image */}
      <img 
        src={analysis.file_preview} 
        alt="Analyzed media" 
        className="absolute inset-0 w-full h-full object-cover"
        crossOrigin="anonymous"
      />
      
      {/* Heavy Bottom Gradient for Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80" />

      {/* Top Header Logo */}
      <div className="absolute top-12 left-12 flex items-center gap-4 z-10 text-white">
        <ScanEye className="w-16 h-16 drop-shadow-xl" />
        <span className="font-serif font-black text-5xl tracking-tighter drop-shadow-xl">VerifyLens</span>
      </div>

      {/* Top Right Score Circle */}
      <div className="absolute top-12 right-12 flex flex-col items-end z-10">
        <div className="flex items-center justify-center w-36 h-36 rounded-full border-[6px] backdrop-blur-md bg-black/40 shadow-2xl" 
          style={{ borderColor: isReal ? '#16a34a' : '#e11d48' }}>
            <div className="text-center mt-1">
              <span className="block text-5xl font-black text-white">{confidence}%</span>
              <span className="block text-sm font-bold text-white/80 uppercase tracking-widest mt-1">
                {isReal ? 'Real' : 'AI'}
              </span>
            </div>
        </div>
      </div>

      {/* Content Area - Constrained to bottom */}
      <div className="relative z-10 p-12 pb-16 w-full mt-auto flex flex-col justify-end">
        <div>
          {/* News Badge */}
          <div className="inline-block bg-white text-black font-black text-2xl px-5 py-1.5 mb-4 uppercase tracking-tight shadow-2xl">
            {analysis.verdict}
          </div>
          
          {/* Headline (Reasoning) */}
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white drop-shadow-2xl mb-6 font-serif max-w-[950px]">
            {analysis.reasoning}
          </h1>
        </div>
        
        {/* Footer Meta */}
        <div className="flex items-center gap-4 text-white/60 font-sans text-xl mt-6 font-bold tracking-wide uppercase">
          <span className="truncate max-w-[500px]">{analysis.original_filename}</span>
          <span>•</span>
          <span>{new Date(analysis.created_at).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

function AnalysisCategory({ category, finding, indicator }) {
  const getIndicatorInfo = (ind) => {
    switch (ind) {
      case "ai": return { icon: AlertTriangle, color: "text-[hsl(var(--brand-fake))]", bg: "bg-[hsl(var(--brand-fake)/0.1)]", label: "AI Signal" };
      case "real": return { icon: CheckCircle2, color: "text-[hsl(var(--brand-real))]", bg: "bg-[hsl(var(--brand-real)/0.1)]", label: "Authentic" };
      default: return { icon: Minus, color: "text-muted-foreground", bg: "bg-secondary", label: "Neutral" };
    }
  };

  const info = getIndicatorInfo(indicator);
  const Icon = info.icon;

  return (
    <div className="flex items-start gap-4 p-4 rounded-sm border bg-card hover:shadow-sm transition-shadow" data-testid={`analysis-category-${category}`}>
      <div className={`w-8 h-8 rounded-sm ${info.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <Icon className={`w-4 h-4 ${info.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">{category}</span>
          <Badge variant="outline" className={`text-xs rounded-sm ${info.color}`}>
            {info.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{finding}</p>
      </div>
    </div>
  );
}

export default function ResultPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API}/analyses/${id}`, {
          headers: { authorization: `Bearer ${token}` }
        });
        setAnalysis(res.data);
      } catch {
        toast.error("Failed to load analysis");
        navigate("/dashboard");
      }
      setLoading(false);
    };
    fetch();
  }, [id, token, navigate]);

  const handleNativeShare = async () => {
    if (!analysis) return;
    const url = `${window.location.origin}/share/${analysis.share_id}`;
    
    // Fallback if Web Share API is not supported at all
    if (!navigator.share) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Share link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
      return;
    }

    try {
      const shareData = {
        title: 'VerifyLens Analysis Result',
        text: `Check out this media analysis by VerifyLens!\nVerdict: ${analysis.verdict} (${analysis.confidence_score.toFixed(1)}% Confidence)\n\nOriginal file: ${analysis.original_filename}\nView full report: ${url}`,
        url: url
      };

      try {
        const element = document.getElementById("fancy-snapshot");
        if (element && navigator.canShare) {
            const canvas = await html2canvas(element, { useCORS: true, backgroundColor: '#09090b', scale: 2 });
            const dataUrl = canvas.toDataURL("image/png");
            const file = dataURLtoFile(dataUrl, `VerifyLens_${analysis.original_filename || "analysis"}.png`);
            if (file && navigator.canShare({ files: [file] })) {
                shareData.files = [file];
            }
        }
      } catch (captureErr) {
        console.error("Failed to capture for share", captureErr);
      }

      await navigator.share(shareData);
      toast.success("Shared successfully!");
    } catch (err) {
      if (err.name !== 'AbortError') {
         console.error("Error sharing:", err);
         navigator.clipboard.writeText(url);
         setCopied(true);
         toast.success("Share link copied to clipboard!");
         setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleDownload = async () => {
    if (!analysis) return;
    try {
      toast.loading("Capturing result...", { id: "capture-toast" });
      const element = document.getElementById("fancy-snapshot");
      if (!element) throw new Error("Snapshot element not found");
      
      const canvas = await html2canvas(element, { useCORS: true, backgroundColor: '#09090b', scale: 2 });
      const dataUrl = canvas.toDataURL("image/png");
      
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `VerifyLens_Analysis_${analysis.original_filename || "media"}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.dismiss("capture-toast");
      toast.success("Saved composite image to device");
    } catch (err) {
      console.error("Failed to capture image", err);
      toast.dismiss("capture-toast");
      toast.error("Failed to capture result");
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/analyses/${id}`, {
        headers: { authorization: `Bearer ${token}` }
      });
      toast.success("Analysis deleted");
      navigate("/history");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleMouseMove = (e) => {
    if (!showComparison) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, x)));
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pt-20">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );

  if (!analysis) return null;

  const isReal = analysis.verdict === "Likely Real";

  return (
    <>
      {/* Hidden scorecard for off-screen capturing */}
      <div className="absolute top-[-9999px] left-[-9999px]">
        <ShareableScorecard analysis={analysis} />
      </div>

      <div className="min-h-screen pt-24 pb-16 px-4" data-testid="result-page">
        <div className="max-w-5xl mx-auto">
          {/* Top bar */}
          <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Button variant="ghost" onClick={() => navigate(-1)} className="rounded-sm gap-2" data-testid="back-button">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload} className="rounded-sm gap-2" data-testid="download-button">
              <Download className="w-4 h-4" /> Save
            </Button>
            <Button variant="outline" size="sm" onClick={handleNativeShare} className="rounded-sm gap-2" data-testid="share-button">
              {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              {copied ? "Copied!" : "Share"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDelete} className="rounded-sm gap-2 text-destructive hover:text-destructive" data-testid="delete-button">
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          </div>
        </motion.div>

        {/* Main result */}
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left: Image & Comparison */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            <Card className="rounded-sm overflow-hidden">
              <div className="relative">
                {/* Toggle comparison */}
                <div className="absolute top-3 right-3 z-10">
                  <Button
                    variant={showComparison ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowComparison(!showComparison)}
                    className="rounded-sm text-xs backdrop-blur-sm"
                    data-testid="toggle-comparison-button"
                  >
                    {showComparison ? "Original View" : "Comparison View"}
                  </Button>
                </div>

                {showComparison ? (
                  /* Comparison slider */
                  <div
                    className="relative cursor-col-resize select-none"
                    onMouseMove={handleMouseMove}
                    data-testid="comparison-slider"
                  >
                    {/* Original */}
                    <img
                      src={analysis.file_preview}
                      alt="Original"
                      className="w-full max-h-[500px] object-contain"
                    />
                    {/* Overlay with grayscale + tint */}
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                    >
                      <img
                        src={analysis.file_preview}
                        alt="Analyzed"
                        className="w-full max-h-[500px] object-contain"
                        style={{
                          filter: isReal
                            ? "saturate(1.2) brightness(1.05)"
                            : "saturate(0.3) sepia(0.3) hue-rotate(300deg)"
                        }}
                      />
                      {/* Scan overlay */}
                      <div
                        className="absolute inset-0"
                        style={{
                          background: isReal
                            ? "linear-gradient(135deg, hsla(160, 84%, 39%, 0.1), transparent)"
                            : "linear-gradient(135deg, hsla(330, 81%, 60%, 0.1), transparent)"
                        }}
                      />
                    </div>
                    {/* Slider line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-foreground z-10"
                      style={{ left: `${sliderPos}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-foreground flex items-center justify-center">
                        <span className="text-background text-xs font-bold">||</span>
                      </div>
                    </div>
                    {/* Labels */}
                    <div className="absolute bottom-3 left-3 px-2 py-1 rounded-sm bg-background/80 backdrop-blur-sm text-xs font-medium">
                      Original
                    </div>
                    <div className="absolute bottom-3 right-3 px-2 py-1 rounded-sm bg-background/80 backdrop-blur-sm text-xs font-medium">
                      Analysis
                    </div>
                  </div>
                ) : (
                  <img
                    src={analysis.file_preview}
                    alt={analysis.original_filename}
                    className="w-full max-h-[500px] object-contain bg-secondary/20"
                    data-testid="result-image"
                  />
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground font-mono-data">{analysis.original_filename}</span>
                  <span className="text-xs text-muted-foreground font-mono-data">
                    {new Date(analysis.created_at).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right: Score & Verdict */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Score card */}
            <Card className={`rounded-sm ${isReal ? "animate-pulse-glow" : "animate-pulse-glow-pink"}`}>
              <CardContent className="p-8 flex flex-col items-center text-center">
                <ScoreCircle score={analysis.confidence_score} verdict={analysis.verdict} />
                <Badge
                  className={`mt-6 text-sm px-4 py-1.5 rounded-sm ${
                    isReal
                      ? "bg-[hsl(var(--brand-real)/0.15)] text-[hsl(var(--brand-real))] border-[hsl(var(--brand-real)/0.3)]"
                      : "bg-[hsl(var(--brand-fake)/0.15)] text-[hsl(var(--brand-fake))] border-[hsl(var(--brand-fake)/0.3)]"
                  }`}
                  data-testid="result-verdict-badge"
                >
                  {analysis.verdict}
                </Badge>
                <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                  {analysis.reasoning}
                </p>
              </CardContent>
            </Card>

          </motion.div>
        </div>

        {/* Detailed Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-10"
        >
          <h2 className="text-xl font-bold tracking-tight mb-6">Detailed Analysis</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {analysis.detailed_analysis.map((item, i) => (
              <AnalysisCategory
                key={i}
                category={item.category}
                finding={item.finding}
                indicator={item.indicator}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
    </>
  );
}
