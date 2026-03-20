import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Check, X, Shield, Star, Zap, ScanEye, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const tiers = [
  {
    id: "free",
    name: "Free",
    description: "For occasional verifications",
    price: 0,
    priceLabel: "₹0",
    features: [
      { name: "3 photos/day", included: true },
      { name: "Standard Accuracy", included: true },
      { name: "Standard Processing", included: true },
      { name: "Priority Support", included: false },
      { name: "Custom Models", included: false },
    ],
    icon: ScanEye,
    popular: false,
    color: "text-foreground",
  },
  {
    id: "vip",
    name: "VIP",
    description: "For professionals and creators",
    price: 500,
    priceLabel: "₹500",
    couponHint: 'Use code "FIRSTTIME" → ₹200 for first month',
    features: [
      { name: "20 photos/day", included: true },
      { name: "Higher Accuracy", included: true },
      { name: "Faster Processing", included: true },
      { name: "Priority Support", included: true },
      { name: "Custom Models", included: false },
    ],
    icon: Star,
    popular: true,
    color: "text-emerald-400",
  },
  {
    id: "premium",
    name: "Premium",
    description: "For enterprise-grade analysis",
    price: 1000,
    priceLabel: "₹1000",
    couponHint: 'Use code "FIRSTTIME" → ₹600 for first month',
    features: [
      { name: "50 photos/day", included: true },
      { name: "Maximum Accuracy", included: true },
      { name: "Lightning-Fast Processing", included: true },
      { name: "24/7 Priority Support", included: true },
      { name: "Custom Models", included: true },
    ],
    icon: Zap,
    popular: false,
    color: "text-violet-400",
  },
];

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

export default function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const currentPlan = user?.plan || "free";

  const handleSelect = (tier) => {
    if (tier.id === currentPlan) {
      toast.info(`You are already on the ${tier.name} plan!`);
      return;
    }
    if (!user) {
      toast.error("Please sign in first to subscribe.");
      navigate("/auth");
      return;
    }
    navigate(`/checkout/${tier.id}`);
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 relative">
      {/* Background */}
      <div className="fixed inset-0 bg-background -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--brand-real)/0.08),transparent_60%)]" />
        <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none" />
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.div variants={fadeUp}>
            <Badge variant="outline" className="mb-4 px-4 py-1.5 rounded-sm text-xs font-mono">
              Pricing Plans
            </Badge>
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            Choose Your Plan
          </motion.h1>
          <motion.p variants={fadeUp} className="text-muted-foreground text-lg max-w-xl mx-auto">
            Unlock more analyses, higher accuracy, and priority support. Cancel anytime.
          </motion.p>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid md:grid-cols-3 gap-8 items-start"
        >
          {tiers.map((tier) => (
            <motion.div
              key={tier.id}
              variants={fadeUp}
              className={`relative h-full flex flex-col ${tier.popular ? "md:-mt-4 md:mb-4 scale-105 z-10" : "z-0"}`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center z-20">
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none px-4 py-1 rounded-sm text-xs uppercase tracking-wider font-bold shadow-lg shadow-emerald-500/20">
                    Most Popular
                  </Badge>
                </div>
              )}

              <Card className={`h-full flex flex-col rounded-sm border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                tier.popular
                  ? "border-emerald-500/40 shadow-xl shadow-emerald-500/10 bg-card/80 backdrop-blur-xl"
                  : "shadow-sm hover:border-border/80 bg-card/60"
              }`}>
                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 rounded-sm bg-secondary flex items-center justify-center mb-4`}>
                    <tier.icon className={`w-6 h-6 ${tier.color}`} />
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-4xl font-black">{tier.priceLabel}</span>
                    <span className="text-muted-foreground font-medium">/month</span>
                  </div>
                  <CardTitle className="text-xl font-bold">{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  {tier.couponHint && (
                    <div className="mb-4 p-3 rounded-sm bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium">
                      🏷️ {tier.couponHint}
                    </div>
                  )}
                  <div className="h-px bg-border mb-4" />
                  <ul className="space-y-3">
                    {tier.features.map((feature, i) => (
                      <li key={i} className={`flex items-center gap-3 text-sm ${feature.included ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {feature.included
                          ? <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                          : <X className="w-4 h-4 text-muted-foreground/40 shrink-0" />}
                        {feature.name}
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-4">
                  <Button
                    className={`w-full rounded-sm h-12 text-base font-semibold gap-2 group ${
                      tier.id === currentPlan
                        ? "cursor-default opacity-80"
                        : tier.popular
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 shadow-lg shadow-emerald-500/25"
                        : tier.id === "premium"
                        ? "bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white border-0"
                        : ""
                    }`}
                    variant={tier.id === currentPlan ? "secondary" : tier.id === "free" ? "outline" : "default"}
                    onClick={() => handleSelect(tier)}
                  >
                    {tier.id === currentPlan ? (
                      "✓ Current Plan"
                    ) : (
                      <>
                        Select Plan
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-sm text-muted-foreground mt-12"
        >
          All payments are secured via Razorpay. You can cancel at any time.
        </motion.p>
      </div>
    </div>
  );
}
