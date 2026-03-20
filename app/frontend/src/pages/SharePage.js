import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import axios from "axios";
import {
  Loader2, AlertTriangle, CheckCircle2, Minus, ScanEye
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function ScoreCircle({ score, verdict }) {
  const isReal = verdict === "Likely Real";
  const color = isReal ? "hsl(var(--brand-real))" : "hsl(var(--brand-fake))";
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="score-circle">
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

export default function SharePage() {
  const { shareId } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API}/share/${shareId}`);
        setAnalysis(res.data);
      } catch {
        setError("Analysis not found or link expired.");
      }
      setLoading(false);
    };
    fetch();
  }, [shareId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pt-20">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center pt-20 px-4">
      <Card className="rounded-sm max-w-md w-full">
        <CardContent className="py-12 text-center">
          <ScanEye className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <p className="font-medium mb-1">Not Found</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    </div>
  );

  const isReal = analysis.verdict === "Likely Real";

  const getIndicatorInfo = (ind) => {
    switch (ind) {
      case "ai": return { icon: AlertTriangle, color: "text-[hsl(var(--brand-fake))]", bg: "bg-[hsl(var(--brand-fake)/0.1)]", label: "AI Signal" };
      case "real": return { icon: CheckCircle2, color: "text-[hsl(var(--brand-real))]", bg: "bg-[hsl(var(--brand-real)/0.1)]", label: "Authentic" };
      default: return { icon: Minus, color: "text-muted-foreground", bg: "bg-secondary", label: "Neutral" };
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4" data-testid="share-page">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <Badge variant="outline" className="mb-4 px-3 py-1 rounded-sm font-mono-data text-xs">
            Shared Analysis Report
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Media Verification Result
          </h1>
        </motion.div>

        <div className="grid md:grid-cols-5 gap-8">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:col-span-3"
          >
            <Card className="rounded-sm overflow-hidden">
              <img
                src={analysis.file_preview}
                alt={analysis.original_filename}
                className="w-full max-h-[500px] object-contain bg-secondary/20"
                data-testid="share-result-image"
              />
              <CardContent className="p-4">
                <span className="text-sm text-muted-foreground font-mono-data">{analysis.original_filename}</span>
              </CardContent>
            </Card>
          </motion.div>

          {/* Score */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:col-span-2"
          >
            <Card className="rounded-sm">
              <CardContent className="p-8 flex flex-col items-center text-center">
                <ScoreCircle score={analysis.confidence_score} verdict={analysis.verdict} />
                <Badge
                  className={`mt-6 text-sm px-4 py-1.5 rounded-sm ${
                    isReal
                      ? "bg-[hsl(var(--brand-real)/0.15)] text-[hsl(var(--brand-real))] border-[hsl(var(--brand-real)/0.3)]"
                      : "bg-[hsl(var(--brand-fake)/0.15)] text-[hsl(var(--brand-fake))] border-[hsl(var(--brand-fake)/0.3)]"
                  }`}
                  data-testid="share-verdict-badge"
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
            {analysis.detailed_analysis.map((item, i) => {
              const info = getIndicatorInfo(item.indicator);
              const Icon = info.icon;
              return (
                <div key={i} className="flex items-start gap-4 p-4 rounded-sm border bg-card">
                  <div className={`w-8 h-8 rounded-sm ${info.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon className={`w-4 h-4 ${info.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{item.category}</span>
                      <Badge variant="outline" className={`text-xs rounded-sm ${info.color}`}>
                        {info.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.finding}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-xs text-muted-foreground font-mono-data">
            Analyzed by VerifyLens — Powered by GPT-5.2 Vision
          </p>
        </div>
      </div>
    </div>
  );
}
