import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { Check, X, Tag, ArrowLeft, Loader2, Shield, Star, Zap, ScanEye, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import axios from "axios";

const PLANS = {
  vip: {
    id: "vip",
    name: "VIP Plan",
    description: "For professionals and creators",
    basePrice: 500,
    icon: Star,
    iconColor: "text-emerald-400",
    gradient: "from-emerald-500 to-teal-500",
    shadowColor: "shadow-emerald-500/20",
    features: ["20 photos/day", "Higher Accuracy", "Faster Processing", "Priority Support"],
    coupons: { FIRSTTIME: { discount: 300, label: "First-time user discount" } },
  },
  premium: {
    id: "premium",
    name: "Premium Plan",
    description: "For enterprise-grade analysis",
    basePrice: 1000,
    icon: Zap,
    iconColor: "text-violet-400",
    gradient: "from-violet-500 to-purple-600",
    shadowColor: "shadow-violet-500/20",
    features: ["50 photos/day", "Maximum Accuracy", "Lightning-Fast Processing", "24/7 Priority Support", "Custom Models"],
    coupons: {
      FIRSTTIME: { discount: 400, label: "First-time user discount" },
      PREMIUM600: { discount: 400, label: "Premium launch offer" },
    },
  },
};

const RAZORPAY_KEY = "rzp_test_STbClgC9raYEEs";

export default function CheckoutPage() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateUser } = useAuth();
  const plan = PLANS[planId];

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!plan) {
    navigate("/pricing");
    return null;
  }

  const discount = appliedCoupon ? plan.coupons[appliedCoupon]?.discount || 0 : 0;
  const finalPrice = plan.basePrice - discount;

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    if (plan.coupons[code]) {
      setAppliedCoupon(code);
      toast.success(`Coupon applied! You save ₹${plan.coupons[code].discount}`);
    } else {
      setAppliedCoupon(null);
      toast.error("Invalid coupon code. Try FIRSTTIME or PREMIUM600.");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    toast.info("Coupon removed.");
  };

  const handlePay = async () => {
    if (!user) {
      toast.error("You must be logged in.");
      navigate("/auth");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create Razorpay order on backend
      const orderRes = await axios.post(
        "http://localhost:8000/api/payment/create-order",
        { plan_tier: plan.id, amount: finalPrice },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      const order = orderRes.data;

      // Step 2: Open Razorpay checkout
      const options = {
        key: RAZORPAY_KEY,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "VerifyLens",
        description: plan.name,
        order_id: order.id,
        prefill: { name: user.name, email: user.email },
        theme: { color: "#10b981" },
        handler: async function (response) {
          try {
            // Step 3: Verify payment on backend
            await axios.post(
              "http://localhost:8000/api/payment/verify",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            toast.success(`🎉 Welcome to ${plan.name}! Your subscription is now active.`);
            // Immediately update plan in auth context — no async refetch needed
            updateUser({ plan: plan.id, plan_updated_at: new Date().toISOString() });
            navigate("/dashboard");
          } catch (err) {
            toast.error("Payment verification failed. Contact support.");
            console.error(err);
          }
        },
        modal: {
          ondismiss: () => {
            toast.info("Payment cancelled.");
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (resp) {
        toast.error(`Payment failed: ${resp.error.description}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || "Could not initiate payment. Please try again.";
      toast.error(msg);
      setLoading(false);
    }
  };

  const PlanIcon = plan.icon;

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 relative">
      {/* Background */}
      <div className="fixed inset-0 bg-background -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--brand-real)/0.06),transparent_60%)]" />
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/pricing")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Plans
        </motion.button>

        <div className="grid md:grid-cols-5 gap-8 items-start">
          {/* Left: Plan Summary */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="md:col-span-2"
          >
            <Card className={`rounded-sm border bg-card/60 backdrop-blur-xl shadow-xl ${plan.shadowColor}`}>
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-sm bg-secondary flex items-center justify-center mb-4">
                  <PlanIcon className={`w-6 h-6 ${plan.iconColor}`} />
                </div>
                <CardTitle className="text-2xl font-black">{plan.name}</CardTitle>
                <p className="text-muted-foreground text-sm">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm font-medium">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="h-px bg-border" />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-3.5 h-3.5" />
                  Secured by Razorpay. Cancel anytime.
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right: Checkout Form */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="md:col-span-3 space-y-6"
          >
            <div>
              <h1 className="text-3xl font-black tracking-tight mb-1">Complete Your Order</h1>
              <p className="text-muted-foreground text-sm">Apply a coupon and pay securely via Razorpay.</p>
            </div>

            {/* Coupon Section */}
            <Card className="rounded-sm border bg-card/60">
              <CardContent className="pt-6 space-y-4">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-400" />
                  Have a coupon code?
                </Label>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 rounded-sm bg-emerald-500/10 border border-emerald-500/30">
                    <div>
                      <p className="text-sm font-bold text-emerald-400">{appliedCoupon}</p>
                      <p className="text-xs text-muted-foreground">{plan.coupons[appliedCoupon]?.label} — Save ₹{discount}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleRemoveCoupon} className="text-xs text-muted-foreground hover:text-destructive">
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. FIRSTTIME"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                      className="rounded-sm uppercase font-mono text-sm"
                    />
                    <Button variant="outline" onClick={handleApplyCoupon} className="rounded-sm shrink-0">
                      Apply
                    </Button>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Try: <span className="font-mono text-foreground">FIRSTTIME</span>
                  {plan.id === "premium" && <> or <span className="font-mono text-foreground">PREMIUM600</span></>}
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card className="rounded-sm border bg-card/60">
              <CardContent className="pt-6 space-y-3">
                <p className="text-sm font-semibold mb-4">Order Summary</p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{plan.name} (monthly)</span>
                  <span>₹{plan.basePrice}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-emerald-400">
                    <span>Coupon ({appliedCoupon})</span>
                    <span>- ₹{discount}</span>
                  </div>
                )}
                <div className="h-px bg-border" />
                <div className="flex justify-between font-black text-xl">
                  <span>Total</span>
                  <span>₹{finalPrice}<span className="text-sm font-normal text-muted-foreground">/month</span></span>
                </div>
              </CardContent>
            </Card>

            {/* Pay Button */}
            <Button
              onClick={handlePay}
              disabled={loading}
              className={`w-full h-14 text-base font-bold rounded-sm gap-3 bg-gradient-to-r ${plan.gradient} text-white border-0 shadow-lg ${plan.shadowColor} hover:opacity-90 transition-opacity`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Pay ₹{finalPrice} via Razorpay
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              By proceeding, you agree to our terms of service. Your payment is processed securely by Razorpay.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
