import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Check, X, Shield, Star, Zap, ScanEye, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import axios from "axios";

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // States for coupons
  const [vipCoupon, setVipCoupon] = useState("");
  const [premiumCoupon, setPremiumCoupon] = useState("");
  
  // Loading states for checkout
  const [checkoutLoading, setCheckoutLoading] = useState(null);

  const calculateVipPrice = () => {
    if (vipCoupon.trim().toUpperCase() === "FIRSTTIME") return 200;
    return 500;
  };

  const calculatePremiumPrice = () => {
    // Both FIRSTTIME and PREMIUM600 are valid for premium discount, per instructions loosely interpreted
    const code = premiumCoupon.trim().toUpperCase();
    if (code === "FIRSTTIME" || code === "PREMIUM600") return 600;
    return 1000;
  };

  const handleSubscribe = async (tier) => {
    if (!user) {
      toast("Please sign in to subscribe.", { description: "Redirecting to login..." });
      navigate("/auth");
      return;
    }

    if (tier.id === "free") {
      toast.success("You are already on the free tier!");
      return;
    }

    setCheckoutLoading(tier.id);
    try {
      const currentPrice = tier.calculatePrice ? tier.calculatePrice() : tier.price;
      
      // 1. Create order on backend
      const orderRes = await axios.post("/api/payment/create-order", {
        plan_tier: tier.id,
        amount: currentPrice
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      const order = orderRes.data;

      // 2. Open Razorpay checkout modal
      const options = {
        key: "rzp_test_STbClgC9raYEEs",
        amount: order.amount,
        currency: order.currency,
        name: "VerifyLens",
        description: `${tier.name} Plan Subscription`,
        order_id: order.id,
        handler: async function (response) {
          try {
            // 3. Verify payment on backend
            await axios.post("/api/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            }, {
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            toast.success(`Successfully subscribed to ${tier.name} Plan!`);
          } catch (err) {
            toast.error("Payment verification failed.");
            console.error(err);
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: "#09090B" // matching dark theme
        }
      };
      
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        toast.error("Payment failed. Please try again.");
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error("Could not initiate checkout. Please try again later.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const tiers = [
    {
      id: "free",
      name: "Free",
      description: "For occasional verifications",
      price: 0,
      features: [
        { name: "3 photos/day", included: true },
        { name: "Standard Accuracy", included: true },
        { name: "Standard Processing", included: true },
        { name: "Priority Support", included: false },
        { name: "Custom Models", included: false },
      ],
      icon: ScanEye,
      popular: false,
    },
    {
      id: "vip",
      name: "VIP",
      description: "For professionals and creators",
      originalPrice: 500,
      couponState: vipCoupon,
      setCouponState: setVipCoupon,
      calculatePrice: calculateVipPrice,
      features: [
        { name: "20 photos/day", included: true },
        { name: "Higher Accuracy", included: true },
        { name: "Faster Processing", included: true },
        { name: "Priority Support", included: true },
        { name: "Custom Models", included: false },
      ],
      icon: Star,
      popular: true,
    },
    {
      id: "premium",
      name: "Premium",
      description: "For enterprise-grade analysis",
      originalPrice: 1000,
      couponState: premiumCoupon,
      setCouponState: setPremiumCoupon,
      calculatePrice: calculatePremiumPrice,
      features: [
        { name: "50 photos/day", included: true },
        { name: "Maximum Accuracy", included: true },
        { name: "Lightning-Fast Processing", included: true },
        { name: "24/7 Priority Support", included: true },
        { name: "Custom Models", included: true },
      ],
      icon: Zap,
      popular: false,
    }
  ];

  return (
    <div className="py-24 relative" id="pricing" style={{ background: "linear-gradient(180deg, rgba(254,243,199,0.25) 0%, rgba(255,237,213,0.2) 100%)" }}>
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-96 h-96 rounded-full blur-[100px] -translate-y-1/2" style={{ background: "rgba(249,115,22,0.05)" }} />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 rounded-full blur-[100px] -translate-y-1/2" style={{ background: "rgba(245,158,11,0.05)" }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-1.5 rounded-sm font-mono-data text-xs">
            Simple Pricing
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
            Invest in truth.
          </h2>
          <p className="text-muted-foreground text-lg">
            Choose the plan that fits your detection needs. Unlock more analyses, higher accuracy, and priority support.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          {tiers.map((tier) => {
            const currentPrice = tier.calculatePrice ? tier.calculatePrice() : tier.price;
            const hasDiscount = tier.originalPrice && currentPrice < tier.originalPrice;

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5 }}
                className={`relative h-full flex flex-col ${tier.popular ? "md:-mt-4 md:mb-4 scale-105 z-10" : "z-0"}`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center z-20">
                    <Badge className="bg-[hsl(var(--brand-real))] hover:bg-[hsl(var(--brand-real)/0.9)] text-white shadow-md border-none px-4 py-1 rounded-sm text-xs uppercase tracking-wider font-bold">
                      Most Popular
                    </Badge>
                  </div>
                )}

              <Card
                className={`h-full flex flex-col rounded-sm border transition-all duration-300 hover:shadow-lg`}
                style={{
                  borderTop: tier.popular ? '3px solid #f97316' : tier.id === 'premium' ? '3px solid #8b5cf6' : '3px solid #f59e0b',
                  background: tier.popular
                    ? 'rgba(249,115,22,0.04)'
                    : tier.id === 'premium'
                    ? 'rgba(139,92,246,0.03)'
                    : 'rgba(245,158,11,0.03)',
                  boxShadow: tier.popular ? '0 8px 32px rgba(249,115,22,0.08)' : undefined,
                }}
              >
                  <CardHeader>
                    <div className="w-12 h-12 rounded-sm bg-secondary flex items-center justify-center mb-4">
                      <tier.icon className={`w-6 h-6 ${tier.popular ? "text-[hsl(var(--brand-real))]" : "text-foreground"}`} />
                    </div>
                    <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                    <CardDescription>{tier.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col gap-6">
                    {/* Price Section */}
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black">₹{currentPrice}</span>
                        <span className="text-muted-foreground font-medium">/month</span>
                      </div>
                      
                      {/* Original Price Strikethrough if discounted */}
                      {tier.originalPrice && (
                        <AnimatePresence>
                          {hasDiscount && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="text-sm font-medium text-green-500 mt-1"
                            >
                              <span className="line-through text-muted-foreground mr-2">₹{tier.originalPrice}</span>
                              Discount Applied!
                            </motion.div>
                          )}
                        </AnimatePresence>
                      )}
                    </div>

                    {/* Coupon Input Area */}
                    {tier.setCouponState && (
                      <div className="space-y-2 mt-2 p-3 bg-secondary/30 rounded-sm border border-border/50">
                        <Label className="text-xs text-muted-foreground">Have a coupon code?</Label>
                        <Input
                          placeholder="e.g. FIRSTTIME"
                          value={tier.couponState}
                          onChange={(e) => tier.setCouponState(e.target.value)}
                          className="h-8 text-xs font-mono-data rounded-sm uppercase bg-background"
                        />
                      </div>
                    )}

                    {/* Divider */}
                    <div className="h-px w-full bg-border" />

                    {/* Features List */}
                    <ul className="space-y-3 flex-1 flex flex-col justify-start">
                      {tier.features.map((feature, i) => (
                        <li key={i} className={`flex items-start gap-3 text-sm ${feature.included ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                          {feature.included ? (
                            <Check className="w-5 h-5 text-green-500 shrink-0" />
                          ) : (
                            <X className="w-5 h-5 text-muted-foreground/50 shrink-0" />
                          )}
                          <span>{feature.name}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button 
                      onClick={() => handleSubscribe(tier)}
                      disabled={checkoutLoading === tier.id}
                      className={`w-full rounded-sm h-12 text-base font-semibold group ${
                        tier.popular 
                          ? "bg-[hsl(var(--brand-real))] text-white hover:bg-[hsl(var(--brand-real)/0.9)]" 
                          : ""
                      }`}
                      variant={tier.popular ? "default" : "outline"}
                    >
                      {checkoutLoading === tier.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          {tier.id === "free" ? "Get Started" : "Select Plan"}
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
