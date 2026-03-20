import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";
import axios from "axios";
import {
  Upload, ScanEye, Loader2, Image, Film, ArrowRight, Clock, Zap, AlertTriangle,
  BarChart3, Shield, ChevronRight, TrendingUp, Trash2, Sparkles, CheckCircle2, Star
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const PLAN_LABELS = { free: "Free", vip: "VIP", premium: "Premium" };
const PLAN_COLORS = {
  free: "bg-secondary text-secondary-foreground",
  vip: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  premium: "bg-violet-500/10 text-violet-400 border-violet-500/20"
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

export default function DashboardPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [usage, setUsage] = useState(null);

  const fetchUsage = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/auth/usage`, {
        headers: { authorization: `Bearer ${token}` }
      });
      setUsage(res.data);
    } catch { }
  }, [token]);

  const fetchRecent = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/analyses`, {
        headers: { authorization: `Bearer ${token}` }
      });
      setRecentAnalyses(res.data.slice(0, 6));
    } catch { }
    setLoadingRecent(false);
  }, [token]);

  useEffect(() => {
    fetchRecent();
    fetchUsage();
  }, [fetchRecent, fetchUsage]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API}/analyses/${id}`, {
        headers: { authorization: `Bearer ${token}` }
      });
      toast.success("Analysis deleted");
      fetchRecent();
      fetchUsage();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const limitReached = usage && usage.remaining === 0;
  const firstName = user?.name?.split(" ")[0] || "there";
  const aiCount = recentAnalyses.filter(a => a.verdict === "AI-Generated").length;
  const realCount = recentAnalyses.filter(a => a.verdict === "Likely Real").length;

  return (
    <div className="min-h-screen" data-testid="dashboard-page">

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden pt-24 pb-24 px-4">
        {/* Ambient background - transparent so body gradient shows through */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--brand-real)/0.06),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--brand-fake)/0.04),transparent_55%)]" />
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
        </div>

        <div className="relative max-w-6xl mx-auto">
          <motion.div initial="hidden" animate="visible" variants={stagger}
            className="flex flex-col lg:flex-row items-center gap-16"
          >
            {/* Left */}
            <div className="flex-1">
              <motion.div variants={fadeUp}>
                <Badge variant="outline" className="mb-6 px-3 py-1.5 rounded-sm font-mono text-xs gap-1.5 border-foreground/20">
                  <Sparkles className="w-3 h-3" />
                  Welcome back, {firstName}
                </Badge>
              </motion.div>

              <motion.h1 variants={fadeUp}
                className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6"
              >
                Detect{" "}
                <span className="text-[hsl(var(--brand-fake))]">AI fakes</span>
                <br />in seconds
              </motion.h1>

              <motion.p variants={fadeUp} className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-lg">
                Upload any image or video and our Gemini Vision engine examines textures, lighting, edges, and more — delivering a confidence-scored verdict instantly.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-wrap gap-3 mb-12">
                <Button
                  size="lg"
                  onClick={() => navigate("/analyze")}
                  className="rounded-sm gap-2 text-base px-8 h-12 active:scale-95 transition-all"
                  data-testid="hero-analyze-button"
                >
                  <Upload className="w-4 h-4" />
                  Start Analyzing
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate("/history")}
                  className="rounded-sm gap-2 text-base px-8 h-12"
                >
                  <Clock className="w-4 h-4" />
                  View History
                </Button>
              </motion.div>

              {/* Stats row */}
              {usage && (
                <motion.div variants={fadeUp} className="flex gap-10 flex-wrap">
                  <div>
                    <p className={`text-3xl font-black font-mono ${limitReached ? 'text-destructive' : 'text-[hsl(var(--brand-real))]'}`}>
                      {usage.remaining}
                      <span className="text-muted-foreground text-xl font-normal">/{usage.daily_limit}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Analyses left today</p>
                  </div>
                  <div>
                    <p className="text-3xl font-black font-mono">{recentAnalyses.length}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Total scans</p>
                  </div>
                  <div>
                    <Badge className={`px-3 py-1.5 rounded-sm font-mono text-sm ${PLAN_COLORS[usage.plan] || ''}`}>
                      {PLAN_LABELS[usage.plan] || usage.plan} Plan
                    </Badge>
                    {usage.plan === 'free' && (
                      <button
                        onClick={() => navigate("/pricing")}
                        className="block text-xs text-emerald-400 hover:text-emerald-300 mt-1.5 underline underline-offset-2"
                      >
                        Upgrade for more →
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right: Floating card */}
            <motion.div
              initial={{ opacity: 0, x: 60, rotate: 2 }}
              animate={{ opacity: 1, x: 0, rotate: 2 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="hidden lg:block flex-shrink-0 w-80"
            >
              <div className="rounded-sm border bg-card p-6 shadow-xl animate-float">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-sm bg-[hsl(var(--brand-fake)/0.12)] flex items-center justify-center">
                    <ScanEye className="w-5 h-5 text-[hsl(var(--brand-fake))]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Analysis Complete</p>
                    <p className="text-xs text-muted-foreground">portrait_2024.jpg</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Verdict</span>
                    <Badge className="bg-[hsl(var(--brand-fake)/0.1)] text-[hsl(var(--brand-fake))] border-[hsl(var(--brand-fake)/0.2)] rounded-sm text-xs">
                      AI-Generated
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Confidence</span>
                    <span className="font-mono text-sm font-bold">94.7%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '94.7%' }}
                      transition={{ delay: 1, duration: 1.2, ease: "easeOut" }}
                      className="h-full rounded-full bg-[hsl(var(--brand-fake))]"
                    />
                  </div>
                  <div className="pt-3 border-t space-y-2">
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide">Analysis Breakdown</p>
                    {[
                      { cat: "Texture & Patterns", result: "AI", isAI: true },
                      { cat: "Lighting & Shadows", result: "Real", isAI: false },
                      { cat: "Facial Features", result: "AI", isAI: true },
                      { cat: "Edge Quality", result: "AI", isAI: true },
                    ].map(({ cat, result, isAI }) => (
                      <div key={cat} className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isAI ? 'bg-[hsl(var(--brand-fake))]' : 'bg-[hsl(var(--brand-real))]'}`} />
                        <span className="text-xs text-muted-foreground flex-1 truncate">{cat}</span>
                        <span className={`text-xs font-mono font-medium ${isAI ? 'text-[hsl(var(--brand-fake))]' : 'text-[hsl(var(--brand-real))]'}`}>{result}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── LIMIT REACHED BANNER ─── */}
      {limitReached && (
        <div className="px-4 pb-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-sm border border-destructive/30 bg-destructive/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Daily limit reached!</p>
                  <p className="text-xs text-muted-foreground">Upgrade your plan to analyze more media.</p>
                </div>
              </div>
              <Button size="sm" onClick={() => navigate("/pricing")}
                className="rounded-sm gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shrink-0"
              >
                <Zap className="w-4 h-4" /> Upgrade Plan
              </Button>
            </motion.div>
          </div>
        </div>
      )}

      {/* ─── FEATURE CARDS ─── */}
      <section className="px-4 pb-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {[
              {
                icon: Shield,
                title: "6-Point Analysis",
                desc: "Texture, lighting, faces, background, edges & metadata.",
                color: "text-orange-500",
                bg: "bg-orange-100",
                border: "#f97316",
                bgCard: "rgba(249,115,22,0.04)",
              },
              {
                icon: Zap,
                title: "Instant Results",
                desc: "Powered by Gemini Vision — verdict in under 3 seconds.",
                color: "text-violet-500",
                bg: "bg-violet-100",
                border: "#8b5cf6",
                bgCard: "rgba(139,92,246,0.03)",
              },
              {
                icon: BarChart3,
                title: "Confidence Score",
                desc: "Precise percentage with full per-category reasoning.",
                color: "text-rose-500",
                bg: "bg-rose-100",
                border: "#f43f5e",
                bgCard: "rgba(244,63,94,0.03)",
              },
              {
                icon: Star,
                title: "Shareable Reports",
                desc: "Generate a public link to any analysis result.",
                color: "text-amber-500",
                bg: "bg-amber-100",
                border: "#f59e0b",
                bgCard: "rgba(245,158,11,0.04)",
              },
            ].map((item) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                className="rounded-sm border p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-1 group"
                style={{ borderTop: `3px solid ${item.border}`, background: item.bgCard }}
              >
                <div className={`w-10 h-10 rounded-sm ${item.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <h3 className="font-bold mb-1.5 text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Quick action CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-4 rounded-sm border bg-gradient-to-r from-[hsl(var(--brand-real)/0.05)] to-[hsl(var(--brand-fake)/0.05)] p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-sm bg-foreground flex items-center justify-center shrink-0">
                <ScanEye className="w-6 h-6 text-background" />
              </div>
              <div>
                <p className="font-bold">Ready to detect AI media?</p>
                <p className="text-sm text-muted-foreground">Upload any image or video and get results in seconds.</p>
              </div>
            </div>
            <Button
              size="lg"
              onClick={() => navigate("/analyze")}
              className="rounded-sm gap-2 shrink-0 active:scale-95 transition-all"
            >
              <Upload className="w-4 h-4" />
              Analyze Now
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ─── QUICK STATS (if analyses exist) ─── */}
      {!loadingRecent && recentAnalyses.length > 0 && (
        <section className="px-4 pb-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Analyses", value: recentAnalyses.length, icon: BarChart3, color: "text-orange-500", border: "#f97316", bgCard: "rgba(249,115,22,0.04)" },
                { label: "AI-Generated",   value: aiCount,                icon: ScanEye,   color: "text-rose-500",   border: "#f43f5e", bgCard: "rgba(244,63,94,0.04)" },
                { label: "Likely Real",    value: realCount,              icon: CheckCircle2, color: "text-teal-500", border: "#14b8a6", bgCard: "rgba(20,184,166,0.04)" },
                {
                  label: "Avg. Confidence",
                  value: `${(recentAnalyses.reduce((s, a) => s + a.confidence_score, 0) / recentAnalyses.length).toFixed(1)}%`,
                  icon: TrendingUp,
                  color: "text-violet-500",
                  border: "#8b5cf6",
                  bgCard: "rgba(139,92,246,0.04)",
                },
              ].map(({ label, value, icon: Icon, color, border, bgCard }) => (
                <div key={label} className="rounded-sm border p-4 hover:shadow-md transition-all duration-200"
                  style={{ borderTop: `3px solid ${border}`, background: bgCard }}
                >
                  <Icon className={`w-4 h-4 ${color} mb-2`} />
                  <p className={`text-2xl font-black font-mono ${color}`}>{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── RECENT ANALYSES ─── */}
      <section className="px-4 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-orange-400 to-amber-500" />
              <h2 className="text-lg font-bold">Recent Analyses</h2>
            </div>
            {recentAnalyses.length > 0 && (
              <Button
                variant="ghost" size="sm"
                onClick={() => navigate("/history")}
                className="rounded-sm gap-1 text-muted-foreground hover:text-foreground"
                data-testid="view-all-history-button"
              >
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          {loadingRecent ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : recentAnalyses.length === 0 ? (
            <div className="rounded-sm border border-dashed bg-card/50 py-16 text-center">
              <div className="w-14 h-14 rounded-sm bg-secondary flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="font-semibold mb-1">No analyses yet</p>
              <p className="text-sm text-muted-foreground mb-6">Upload your first file to get started</p>
              <Button
                size="sm" variant="outline"
                className="rounded-sm gap-2"
                onClick={() => navigate("/analyze")}
              >
                <Upload className="w-3.5 h-3.5" /> Upload File
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentAnalyses.map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * i }}
                >
                  <Card
                    className="rounded-sm cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden group"
                    style={{ borderTop: '3px solid #f97316', background: 'rgba(249,115,22,0.03)' }}
                    onClick={() => navigate(`/result/${a.id}`)}
                    data-testid={`analysis-card-${a.id}`}
                  >
                    <div className="relative">
                      <Button
                        variant="destructive" size="icon"
                        className="absolute top-2 left-2 w-7 h-7 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onClick={(e) => handleDelete(e, a.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>

                      {a.file_preview ? (
                        <div className="h-40 bg-secondary/30 overflow-hidden">
                          <img
                            src={a.file_preview}
                            alt={a.original_filename}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="h-40 bg-secondary/30 flex items-center justify-center">
                          {a.file_type === 'video'
                            ? <Film className="w-8 h-8 text-muted-foreground/40" />
                            : <Image className="w-8 h-8 text-muted-foreground/40" />
                          }
                        </div>
                      )}

                      {/* Verdict overlay */}
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background/85 to-transparent flex items-end px-3 pb-2">
                        <Badge
                          className={`rounded-sm text-xs ${
                            a.verdict === "Likely Real"
                              ? "bg-[hsl(var(--brand-real)/0.15)] text-[hsl(var(--brand-real))] border-[hsl(var(--brand-real)/0.25)]"
                              : "bg-[hsl(var(--brand-fake)/0.15)] text-[hsl(var(--brand-fake))] border-[hsl(var(--brand-fake)/0.25)]"
                          }`}
                          data-testid={`verdict-badge-${a.id}`}
                        >
                          {a.verdict}
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium truncate max-w-[150px]">{a.original_filename}</p>
                        <span className="font-mono text-sm font-bold">{a.confidence_score.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full ${a.verdict === "Likely Real" ? "bg-[hsl(var(--brand-real))]" : "bg-[hsl(var(--brand-fake))]"}`}
                          style={{ width: `${a.confidence_score}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(a.created_at).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
