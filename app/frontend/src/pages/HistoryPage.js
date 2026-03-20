import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import axios from "axios";
import { Search, Loader2, Clock, ArrowRight, Image, Film, ScanEye } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function HistoryPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all, ai, real

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API}/analyses`, {
          headers: { authorization: `Bearer ${token}` }
        });
        setAnalyses(res.data);
        setFiltered(res.data);
      } catch {
        console.error("Failed to fetch");
      }
      setLoading(false);
    };
    fetch();
  }, [token]);

  useEffect(() => {
    let result = analyses;
    if (search) {
      result = result.filter(a =>
        a.original_filename.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (filter === "ai") {
      result = result.filter(a => a.verdict !== "Likely Real");
    } else if (filter === "real") {
      result = result.filter(a => a.verdict === "Likely Real");
    }
    setFiltered(result);
  }, [search, filter, analyses]);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4" data-testid="history-page">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
            Analysis History
          </h1>
          <p className="text-muted-foreground">
            Browse all your past media analyses.
          </p>
        </motion.div>

        {/* Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3 mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by filename..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-sm"
              data-testid="search-input"
            />
          </div>
          <div className="flex gap-2">
            {[
              { value: "all", label: "All" },
              { value: "ai", label: "AI-Generated" },
              { value: "real", label: "Authentic" },
            ].map((f) => (
              <Button
                key={f.value}
                variant={filter === f.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f.value)}
                className="rounded-sm"
                data-testid={`filter-${f.value}-button`}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="rounded-sm">
            <CardContent className="py-16 text-center">
              <ScanEye className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
              <p className="font-medium mb-1">No analyses found</p>
              <p className="text-sm text-muted-foreground mb-6">
                {analyses.length === 0
                  ? "Upload your first image to get started."
                  : "No results match your search."}
              </p>
              {analyses.length === 0 && (
                <Button onClick={() => navigate("/dashboard")} className="rounded-sm gap-2" data-testid="go-to-dashboard-button">
                  Upload Media <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filtered.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className="rounded-sm cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden group"
                  onClick={() => navigate(`/result/${a.id}`)}
                  data-testid={`history-card-${a.id}`}
                >
                  {/* Thumbnail */}
                  <div className="h-40 bg-secondary/30 overflow-hidden relative">
                    {a.file_preview ? (
                      <img
                        src={a.file_preview}
                        alt={a.original_filename}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {a.file_type === "video" ? (
                          <Film className="w-8 h-8 text-muted-foreground" />
                        ) : (
                          <Image className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                    )}
                    {/* Score overlay */}
                    <div className="absolute top-2 right-2">
                      <div className={`px-2 py-1 rounded-sm text-xs font-mono-data font-medium backdrop-blur-sm ${
                        a.verdict === "Likely Real"
                          ? "bg-[hsl(var(--brand-real)/0.2)] text-[hsl(var(--brand-real))]"
                          : "bg-[hsl(var(--brand-fake)/0.2)] text-[hsl(var(--brand-fake))]"
                      }`}>
                        {a.confidence_score.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium truncate max-w-[150px]">{a.original_filename}</p>
                      <Badge
                        className={`rounded-sm text-xs ${
                          a.verdict === "Likely Real"
                            ? "bg-[hsl(var(--brand-real)/0.1)] text-[hsl(var(--brand-real))] border-[hsl(var(--brand-real)/0.2)]"
                            : "bg-[hsl(var(--brand-fake)/0.1)] text-[hsl(var(--brand-fake))] border-[hsl(var(--brand-fake)/0.2)]"
                        }`}
                      >
                        {a.verdict}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono-data">
                      {new Date(a.created_at).toLocaleDateString()} at{" "}
                      {new Date(a.created_at).toLocaleTimeString()}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Count */}
        {filtered.length > 0 && (
          <p className="text-center text-sm text-muted-foreground mt-8 font-mono-data">
            Showing {filtered.length} of {analyses.length} analyses
          </p>
        )}
      </div>
    </div>
  );
}
