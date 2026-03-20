import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Pricing from "@/components/Pricing";
import { ScanEye, Shield, Zap, BarChart3, Share2, Clock, ArrowRight, ChevronDown, Upload } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } }
};

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" data-testid="landing-page">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background - transparent so body gradient shows through */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--brand-real)/0.05),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--brand-fake)/0.04),transparent_50%)]" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="max-w-3xl"
          >
            <motion.div variants={fadeUp}>
              <Badge variant="outline" className="mb-8 px-4 py-1.5 rounded-sm font-mono-data text-xs">
                AI Detection Engine v2.0
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-8"
            >
              Separate{" "}
              <span className="text-[hsl(var(--brand-real))]">reality</span>
              {" "}from{" "}
              <span className="text-[hsl(var(--brand-fake))]">fabrication</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-base md:text-lg text-muted-foreground leading-relaxed mb-12 max-w-xl"
            >
              Upload any image or video. Our advanced AI analysis engine examines
              textures, lighting, edges, and patterns to determine if media is
              AI-generated or authentic — with detailed reasoning.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="rounded-sm gap-2 text-base px-8 h-12 active:scale-95 transition-all"
                data-testid="hero-get-started-button"
              >
                Start Analyzing
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="rounded-sm gap-2 text-base px-8 h-12"
                data-testid="hero-learn-more-button"
              >
                How It Works
                <ChevronDown className="w-4 h-4" />
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div variants={fadeUp} className="mt-16 flex gap-12 flex-wrap">
              {[
                { value: "99.2%", label: "Detection Rate" },
                { value: "< 5s", label: "Analysis Time" },
                { value: "6", label: "Analysis Categories" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-black font-mono-data text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Floating preview card */}
          <motion.div
            initial={{ opacity: 0, x: 60, rotate: 2 }}
            animate={{ opacity: 1, x: 0, rotate: 2 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 w-80"
          >
            <div className="rounded-sm border bg-card p-6 shadow-lg animate-float">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-sm bg-[hsl(var(--brand-fake)/0.1)] flex items-center justify-center">
                  <ScanEye className="w-5 h-5 text-[hsl(var(--brand-fake))]" />
                </div>
                <div>
                  <p className="text-sm font-medium">Analysis Complete</p>
                  <p className="text-xs text-muted-foreground">portrait_v3.png</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Verdict</span>
                  <Badge className="bg-[hsl(var(--brand-fake)/0.1)] text-[hsl(var(--brand-fake))] border-[hsl(var(--brand-fake)/0.2)] rounded-sm">
                    AI-Generated
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Confidence</span>
                  <span className="font-mono-data text-sm font-medium">94.7%</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-[hsl(var(--brand-fake))]" style={{ width: '94.7%' }} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <motion.p variants={fadeUp} className="text-sm font-mono-data text-muted-foreground mb-4 uppercase tracking-widest">
              Process
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-black tracking-tight mb-16">
              Three steps to truth
            </motion.h2>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  icon: Upload,
                  title: "Upload Media",
                  desc: "Drag and drop any image or video file. We support JPEG, PNG, WebP, MP4, and more.",
                  color: "text-orange-500",
                  bg: "bg-orange-100",
                  badge: "bg-orange-500",
                  bgCard: "rgba(249,115,22,0.04)",
                  border: "#f97316",
                },
                {
                  step: "02",
                  icon: ScanEye,
                  title: "AI Analysis",
                  desc: "Our engine examines textures, lighting, shadows, edges, and patterns across 6 categories.",
                  color: "text-violet-500",
                  bg: "bg-violet-100",
                  badge: "bg-violet-500",
                  bgCard: "rgba(139,92,246,0.04)",
                  border: "#8b5cf6",
                },
                {
                  step: "03",
                  icon: BarChart3,
                  title: "Get Results",
                  desc: "Receive a detailed verdict with confidence score, reasoning, and sharable report.",
                  color: "text-amber-500",
                  bg: "bg-amber-100",
                  badge: "bg-amber-500",
                  bgCard: "rgba(245,158,11,0.04)",
                  border: "#f59e0b",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  variants={fadeUp}
                  className="group"
                >
                  <div
                    className="rounded-sm border p-8 h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                    style={{ borderTop: `3px solid ${item.border}`, background: item.bgCard }}
                  >
                    <span className={`inline-block text-xs font-bold text-white px-2 py-0.5 rounded-sm mb-4 ${item.badge}`}>{item.step}</span>
                    <div className={`w-12 h-12 rounded-sm ${item.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200`}>
                      <item.icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <h3 className="text-lg font-bold mb-3">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-32 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <motion.p variants={fadeUp} className="text-sm font-mono-data text-muted-foreground mb-4 uppercase tracking-widest">
              Capabilities
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-black tracking-tight mb-16">
              Built for precision
            </motion.h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Shield,   title: "6-Point Analysis",  desc: "Texture, lighting, facial features, background, edges, and metadata artifacts.", color: "text-orange-500",  bg: "bg-orange-100",  border: "#f97316", bgCard: "rgba(249,115,22,0.04)" },
                { icon: Zap,      title: "Instant Results",   desc: "Get detailed analysis in under 3 seconds with GPT-5.2 vision.",               color: "text-violet-500", bg: "bg-violet-100", border: "#8b5cf6", bgCard: "rgba(139,92,246,0.03)" },
                { icon: BarChart3,title: "Confidence Score",  desc: "Precise percentage score with detailed reasoning for the verdict.",           color: "text-rose-500",   bg: "bg-rose-100",   border: "#f43f5e", bgCard: "rgba(244,63,94,0.03)" },
                { icon: Share2,   title: "Share Reports",     desc: "Generate shareable links for any analysis result.",                           color: "text-amber-500",  bg: "bg-amber-100",  border: "#f59e0b", bgCard: "rgba(245,158,11,0.04)" },
                { icon: Clock,    title: "Analysis History",  desc: "Full history of all your past analyses, searchable and filterable.",           color: "text-teal-500",   bg: "bg-teal-100",   border: "#14b8a6", bgCard: "rgba(20,184,166,0.03)" },
                { icon: ScanEye,  title: "Comparison View",   desc: "Side-by-side comparison highlighting detected anomalies.",                    color: "text-indigo-500", bg: "bg-indigo-100", border: "#6366f1", bgCard: "rgba(99,102,241,0.03)" },
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  variants={fadeUp}
                  className="rounded-sm border p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 group"
                  style={{ borderTop: `3px solid ${feature.border}`, background: feature.bgCard }}
                >
                  <div className={`w-10 h-10 rounded-sm ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    <feature.icon className={`w-5 h-5 ${feature.color}`} />
                  </div>
                  <h3 className="font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <Pricing />

      {/* CTA */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-black tracking-tight mb-6">
              Ready to verify?
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground mb-10 max-w-md mx-auto">
              Start detecting AI-generated media today. Free to get started.
            </motion.p>
            <motion.div variants={fadeUp}>
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="rounded-sm gap-2 text-base px-10 h-12 active:scale-95 transition-all"
                data-testid="cta-get-started-button"
              >
                Create Free Account
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScanEye className="w-4 h-4" />
            <span className="text-sm font-medium font-['Outfit']">VerifyLens</span>
          </div>
          <p className="text-xs text-muted-foreground">Powered by GPT-5.2 Vision</p>
        </div>
      </footer>
    </div>
  );
}
