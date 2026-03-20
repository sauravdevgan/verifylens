import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { motion } from "framer-motion";
import axios from "axios";
import {
  Upload, ScanEye, Loader2, Image, Film, X, Zap, AlertTriangle
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AnalyzePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [usage, setUsage] = useState(null);

  // Prevent browser from opening files when dropped outside the zone
  useEffect(() => {
    const prevent = (e) => { e.preventDefault(); e.stopPropagation(); };
    window.addEventListener('dragover', prevent);
    window.addEventListener('drop', prevent);
    return () => {
      window.removeEventListener('dragover', prevent);
      window.removeEventListener('drop', prevent);
    };
  }, []);

  // Fetch usage on mount
  useEffect(() => {
    axios.get(`${API}/auth/usage`, {
      headers: { authorization: `Bearer ${token}` }
    }).then(r => setUsage(r.data)).catch(() => {});
  }, [token]);

  // Use a counter so dragging over child elements doesn't falsely trigger dragLeave
  const dragCounter = useRef(0);

  const handleFile = (f) => {
    if (!f) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm'];
    if (!validTypes.includes(f.type)) {
      toast.error("Unsupported file type. Use JPEG, PNG, WebP, or MP4.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File too large. Max 10MB.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setDragging(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  }, []);

  const onDragEnter = (e) => {
    e.preventDefault();
    dragCounter.current += 1;
    if (dragCounter.current === 1) setDragging(true);
  };

  const onDragOver = (e) => { e.preventDefault(); };

  const onDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setDragging(false);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("authorization", `Bearer ${token}`);
      const res = await axios.post(`${API}/analyze`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      });
      toast.success("Analysis complete!");
      navigate(`/result/${res.data.id}`);
    } catch (err) {
      const msg = err.response?.data?.detail || "Analysis failed. Please try again.";
      if (err.response?.status === 429) {
        toast.error(msg, { duration: 6000 });
      } else {
        toast.error(msg);
      }
    }
    setAnalyzing(false);
  };

  const clearFile = () => { setFile(null); setPreview(null); };
  const isVideo = file?.type?.startsWith("video/");
  const limitReached = usage && usage.remaining === 0;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4" data-testid="analyze-page">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--brand-real)/0.07),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--brand-fake)/0.05),transparent_60%)]" />
      </div>

      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground mb-4 px-3 py-1.5 rounded-sm border bg-secondary/40">
            <ScanEye className="w-3.5 h-3.5" />
            Gemini Vision · 6-Point Analysis
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-3">
            Analyze <span className="text-[hsl(var(--brand-real))]">Media</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Upload an image or video. Our AI engine detects whether it's AI-generated or authentic.
          </p>

          {/* Usage bar */}
          {usage && (
            <div className="mt-5 inline-flex items-center gap-3 px-4 py-2 rounded-sm border bg-card">
              <span className="text-xs text-muted-foreground">Today</span>
              <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${limitReached ? 'bg-destructive' : 'bg-[hsl(var(--brand-real))]'}`}
                  style={{ width: `${Math.min(100, (usage.today_count / usage.daily_limit) * 100)}%` }}
                />
              </div>
              <span className={`text-xs font-mono font-bold ${limitReached ? 'text-destructive' : ''}`}>
                {usage.today_count}/{usage.daily_limit}
              </span>
            </div>
          )}
        </motion.div>

        {/* Limit Reached Banner */}
        {limitReached && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-sm border border-destructive/30 bg-destructive/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Daily limit reached!</p>
                <p className="text-xs text-muted-foreground">
                  You've used all {usage.daily_limit} analyses today. Upgrade for more.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => navigate("/pricing")}
              className="rounded-sm gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shrink-0"
            >
              <Zap className="w-4 h-4" />
              Upgrade
            </Button>
          </motion.div>
        )}

        {/* Upload Zone / Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {!file ? (
            <div
              onDrop={onDrop}
              onDragEnter={onDragEnter}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={`relative rounded-sm border-2 border-dashed p-20 text-center cursor-pointer transition-all duration-300 group ${
                dragging
                  ? "border-[hsl(var(--brand-real))] bg-[hsl(var(--brand-real)/0.05)]"
                  : "border-border hover:border-[hsl(var(--brand-real)/0.6)] hover:bg-[hsl(var(--brand-real)/0.02)]"
              }`}
              onClick={() => document.getElementById("file-input-analyze").click()}
              data-testid="upload-dropzone"
            >
              {dragging && (
                <div className="absolute inset-0 overflow-hidden rounded-sm">
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[hsl(var(--brand-real))] to-transparent animate-scan-line" />
                </div>
              )}
              <div className="flex flex-col items-center gap-5 pointer-events-none">
                <div className={`w-24 h-24 rounded-sm flex items-center justify-center transition-all duration-300 ${
                  dragging ? 'bg-[hsl(var(--brand-real)/0.15)]' : 'bg-secondary group-hover:bg-[hsl(var(--brand-real)/0.08)]'
                }`}>
                  <Upload className={`w-10 h-10 transition-colors duration-300 ${
                    dragging ? 'text-[hsl(var(--brand-real))]' : 'text-muted-foreground group-hover:text-[hsl(var(--brand-real))]'
                  }`} />
                </div>
                <div>
                  <p className="font-semibold text-xl mb-2">
                    {dragging ? "Drop to analyze" : "Drop your file here"}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">or click to browse from your device</p>
                  <div className="flex gap-2 flex-wrap justify-center">
                    {["JPEG", "PNG", "WebP", "MP4", "Max 10MB"].map(tag => (
                      <span key={tag} className="text-xs px-2.5 py-1 rounded-sm bg-secondary text-muted-foreground font-mono">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <input
                id="file-input-analyze"
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                onChange={(e) => handleFile(e.target.files[0])}
                className="hidden"
                data-testid="file-input"
              />
            </div>
          ) : (
            <Card className="rounded-sm overflow-hidden border">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Preview */}
                  <div className="relative md:w-1/2 bg-secondary/20 flex items-center justify-center min-h-[320px]">
                    {isVideo ? (
                      <video src={preview} className="max-h-[420px] w-full object-contain" controls data-testid="video-preview" />
                    ) : (
                      <img src={preview} alt="Preview" className="max-h-[420px] w-full object-contain" data-testid="image-preview" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-3 right-3 rounded-sm bg-background/80 backdrop-blur-sm"
                      onClick={clearFile}
                      data-testid="clear-file-button"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Analysis details */}
                  <div className="md:w-1/2 p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-6">
                      {isVideo ? <Film className="w-5 h-5 text-muted-foreground" /> : <Image className="w-5 h-5 text-muted-foreground" />}
                      <div>
                        <p className="font-medium text-sm truncate max-w-[250px]">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB · {file.type}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-sm bg-secondary/40 border mb-6">
                      <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Analysis Points</p>
                      <div className="space-y-1.5">
                        {["Texture & Patterns", "Lighting & Shadows", "Facial Features", "Background Consistency", "Edge Quality", "Metadata Artifacts"].map((cat, i) => (
                          <div key={cat} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="w-1 h-1 rounded-full bg-[hsl(var(--brand-real))]" />
                            <span>{cat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={handleAnalyze}
                      disabled={analyzing || limitReached}
                      className="rounded-sm gap-2 h-12 active:scale-95 transition-all text-base"
                      data-testid="analyze-button"
                    >
                      {analyzing ? (
                        <><Loader2 className="w-4 h-4 animate-spin" />Analyzing...</>
                      ) : (
                        <><ScanEye className="w-4 h-4" />Run Analysis</>
                      )}
                    </Button>

                    {analyzing && (
                      <div className="mt-4 p-3 rounded-sm bg-secondary/50 border">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-2 h-2 rounded-full bg-[hsl(var(--brand-real))] animate-pulse" />
                          Processing with Gemini Vision...
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
