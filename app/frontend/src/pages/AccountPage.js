import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { User, Shield, CreditCard, Trash2, Loader2, Check, AlertTriangle, ArrowRight, Mail, Key } from "lucide-react";
import axios from "axios";
import {
  REGEXP_ONLY_DIGITS_AND_CHARS,
} from "input-otp"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AccountPage() {
  const { user, token, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);

  // Profile Form
  const [profileData, setProfileData] = useState({ name: user?.name || "", email: user?.email || "" });
  // Email Change Flow
  const [emailStep, setEmailStep] = useState(1); // 1: Initial, 2: OTP Current, 3: OTP New
  const [emailOtpCurr, setEmailOtpCurr] = useState("");
  const [emailOtpNew, setEmailOtpNew] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // Password Form
  const [passwordData, setPasswordData] = useState({ current_password: "", new_password: "", confirm_password: "" });
  // Usage & Plan
  const [usage, setUsage] = useState(null);
  // Deletion Flow
  const [deleteStep, setDeleteStep] = useState(1); // 1: Initial, 2: OTP, 3: Success
  const [deleteOtp, setDeleteOtp] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Cancellation State
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (token) {
        fetchUsage();
    }
  }, [token]);

  useEffect(() => {
    if (user) {
        setProfileData({ name: user.name, email: user.email });
    }
  }, [user]);

  const fetchUsage = async () => {
    try {
      const res = await axios.get(`${API}/auth/usage`, {
        headers: { authorization: `Bearer ${token}` }
      });
      setUsage(res.data);
    } catch (err) {
      console.error("Failed to fetch usage", err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (profileData.email.toLowerCase() !== user.email.toLowerCase()) {
      // Identity verification required for email change
      return initiateEmailChange();
    }
    
    setLoading(true);
    try {
      await axios.put(`${API}/auth/profile`, { name: profileData.name }, {
        headers: { authorization: `Bearer ${token}` }
      });
      toast.success("Profile updated successfully");
      await refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update profile");
    }
    setLoading(false);
  };

  const initiateEmailChange = async () => {
    setEmailLoading(true);
    try {
      await axios.post(`${API}/auth/email-otp-current`, {}, {
        headers: { authorization: `Bearer ${token}` }
      });
      setEmailStep(2);
      toast.success("Identity verification code sent to your current email");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to initiate email change");
    }
    setEmailLoading(false);
  };

  const verifyOldEmail = async () => {
    if (emailOtpCurr.length !== 6) {
      toast.error("Please enter 6-digit code");
      return;
    }
    setEmailLoading(true);
    try {
      await axios.post(`${API}/auth/email-otp-new`, {
        new_email: profileData.email,
        current_otp: emailOtpCurr
      }, {
        headers: { authorization: `Bearer ${token}` }
      });
      setEmailStep(3);
      toast.success("Now verify your new email address");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Verification failed");
    }
    setEmailLoading(false);
  };

  const finalizeEmailChange = async () => {
    if (emailOtpNew.length !== 6) {
      toast.error("Please enter 6-digit code");
      return;
    }
    setEmailLoading(true);
    try {
      // Also update name in the same go if it was changed
      await axios.put(`${API}/auth/profile`, { name: profileData.name }, {
        headers: { authorization: `Bearer ${token}` }
      });
      
      await axios.put(`${API}/auth/email-update`, {
        new_email: profileData.email,
        new_otp: emailOtpNew
      }, {
        headers: { authorization: `Bearer ${token}` }
      });
      toast.success("Email updated successfully");
      setEmailStep(1);
      await refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Final verification failed");
    }
    setEmailLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("New passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await axios.put(`${API}/auth/password`, {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      }, {
        headers: { authorization: `Bearer ${token}` }
      });
      toast.success("Password changed successfully");
      setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to change password");
    }
    setLoading(false);
  };

  const handleCancelSubscription = async () => {
    if (!showCancelConfirm) {
      setShowCancelConfirm(true);
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/payment/cancel`, {}, {
        headers: { authorization: `Bearer ${token}` }
      });
      toast.success("Subscription scheduled for cancellation. Your plan remains active until the end of the billing cycle.");
      setShowCancelConfirm(false);
      await refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to cancel subscription");
    }
    setLoading(false);
  };

  const requestDelete = async () => {
    setDeleteLoading(true);
    try {
      await axios.post(`${API}/auth/delete-request`, {}, {
        headers: { authorization: `Bearer ${token}` }
      });
      setDeleteStep(2);
      toast.success("Verification code sent to your email");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to initiate account deletion");
    }
    setDeleteLoading(false);
  };

  const confirmDelete = async () => {
    if (!deleteOtp || deleteOtp.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }
    setDeleteLoading(true);
    try {
      await axios.delete(`${API}/auth/delete-confirm`, {
        headers: { authorization: `Bearer ${token}` },
        data: { otp: deleteOtp }
      });
      toast.success("Account deleted successfully");
      logout();
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid code or deletion failed");
    }
    setDeleteLoading(false);
  };

  const sidebarItems = [
    { id: "profile", label: "Profile", icon: User },
    { id: "subscription", label: "Subscription", icon: CreditCard },
    { id: "security", label: "Security", icon: Shield },
  ];

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="glass-card rounded-sm border p-2 flex flex-row md:flex-col gap-1 overflow-x-auto">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-sm text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? "bg-orange-500 text-white shadow-md"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1">
          <AnimatePresence mode="wait">
            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <Card className="rounded-sm border shadow-sm" style={{ borderTop: '3px solid #f97316', background: 'rgba(249,115,22,0.03)' }}>
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold">Profile Settings</CardTitle>
                    <CardDescription>Update your personal information and email address.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {emailStep === 1 ? (
                      <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Full Name</label>
                          <Input
                            value={profileData.name}
                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                            placeholder="Your name"
                            className="rounded-sm"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Email Address</label>
                          <Input
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                            placeholder="email@example.com"
                            className="rounded-sm"
                            required
                          />
                        </div>
                        <Button type="submit" disabled={loading || emailLoading} className="rounded-sm gap-2">
                          {(loading || emailLoading) && <Loader2 className="w-4 h-4 animate-spin" />}
                          Save Changes
                        </Button>
                      </form>
                    ) : emailStep === 2 ? (
                      <div className="space-y-6 flex flex-col items-center py-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
                            <Shield className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div className="text-center space-y-1">
                            <h3 className="font-bold text-lg">Verify Current Email</h3>
                            <p className="text-sm text-muted-foreground max-w-xs">
                                Enter the 6-digit code sent to <span className="text-foreground font-medium">{user.email}</span>
                            </p>
                        </div>
                        
                        <div className="space-y-4 w-full flex flex-col items-center">
                            <InputOTP
                                maxLength={6}
                                pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                                value={emailOtpCurr}
                                onChange={(val) => setEmailOtpCurr(val)}
                            >
                                <InputOTPGroup className="gap-2">
                                    {[0, 1, 2, 3, 4, 5].map((i) => (
                                        <InputOTPSlot key={i} index={i} className="w-10 h-12 text-lg rounded-sm border-2" />
                                    ))}
                                </InputOTPGroup>
                            </InputOTP>

                            <div className="flex gap-3 w-full max-w-xs pt-2">
                                <Button 
                                    variant="outline" 
                                    onClick={() => setEmailStep(1)}
                                    className="flex-1 rounded-sm"
                                    disabled={emailLoading}
                                >
                                    Back
                                </Button>
                                <Button 
                                    onClick={verifyOldEmail}
                                    className="flex-1 rounded-sm bg-emerald-500 hover:bg-emerald-600 text-white border-0"
                                    disabled={emailLoading}
                                >
                                    {emailLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify identity"}
                                </Button>
                            </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6 flex flex-col items-center py-4">
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                            <Mail className="w-6 h-6 text-blue-500" />
                        </div>
                        <div className="text-center space-y-1">
                            <h3 className="font-bold text-lg">Verify New Email</h3>
                            <p className="text-sm text-muted-foreground max-w-xs">
                                Enter the 6-digit code sent to <span className="text-foreground font-medium">{profileData.email}</span>
                            </p>
                        </div>
                        
                        <div className="space-y-4 w-full flex flex-col items-center">
                            <InputOTP
                                maxLength={6}
                                pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                                value={emailOtpNew}
                                onChange={(val) => setEmailOtpNew(val)}
                            >
                                <InputOTPGroup className="gap-2">
                                    {[0, 1, 2, 3, 4, 5].map((i) => (
                                        <InputOTPSlot key={i} index={i} className="w-10 h-12 text-lg rounded-sm border-2" />
                                    ))}
                                </InputOTPGroup>
                            </InputOTP>

                            <div className="flex gap-3 w-full max-w-xs pt-2">
                                <Button 
                                    variant="outline" 
                                    onClick={() => setEmailStep(2)}
                                    className="flex-1 rounded-sm"
                                    disabled={emailLoading}
                                >
                                    Change email
                                </Button>
                                <Button 
                                    onClick={finalizeEmailChange}
                                    className="flex-1 rounded-sm bg-blue-500 hover:bg-blue-600 text-white border-0"
                                    disabled={emailLoading}
                                >
                                    {emailLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm & Update"}
                                </Button>
                            </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-sm border shadow-sm" style={{ borderTop: '3px solid #8b5cf6', background: 'rgba(139,92,246,0.03)' }}>
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold">Change Password</CardTitle>
                    <CardDescription>Ensure your account is using a long, random password to stay secure.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Current Password</label>
                        <Input
                          type="password"
                          value={passwordData.current_password}
                          onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                          placeholder="••••••••"
                          className="rounded-sm"
                          required
                        />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">New Password</label>
                          <Input
                            type="password"
                            value={passwordData.new_password}
                            onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                            placeholder="••••••••"
                            className="rounded-sm"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Confirm New Password</label>
                          <Input
                            type="password"
                            value={passwordData.confirm_password}
                            onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                            placeholder="••••••••"
                            className="rounded-sm"
                            required
                          />
                        </div>
                      </div>
                      <Button type="submit" disabled={loading} className="rounded-sm gap-2">
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Update Password
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "subscription" && (
              <motion.div
                key="subscription"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <Card className="rounded-sm border shadow-sm" style={{ borderTop: '3px solid #f59e0b', background: 'rgba(245,158,11,0.03)' }}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl font-bold">Your Subscription</CardTitle>
                        <CardDescription>Manage your current plan and usage.</CardDescription>
                      </div>
                      <Badge variant="outline" className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 rounded-sm font-mono uppercase">
                        {user?.plan || "free"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {user?.plan !== 'free' && (
                      <div className="flex flex-wrap gap-x-8 gap-y-2 pb-2 border-b">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                            {user?.cancelled_at ? "Subscription will cancel at" : "Next Billing Date"}
                          </span>
                          <span className="text-sm font-bold font-mono">
                            {user?.plan_updated_at ? new Date(new Date(user.plan_updated_at).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    )}
                    {usage && (
                      <div className="p-4 rounded-sm bg-orange-500/10 border border-orange-500/20 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground font-medium">Daily Usage</span>
                          <span className="font-mono">{usage.today_count} / {usage.daily_limit} analyses</span>
                        </div>
                        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(usage.today_count / usage.daily_limit) * 100}%` }}
                            className={`h-full rounded-full ${usage.remaining === 0 ? 'bg-destructive' : 'bg-orange-500'}`}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {usage.remaining > 0 
                            ? `You have ${usage.remaining} analyses left for today.`
                            : "You have reached your daily limit. Limits reset every 24 hours."}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-sm border text-center space-y-2" style={{ borderTop: '3px solid #f59e0b' }}>
                            <h4 className="text-sm font-medium text-muted-foreground">Current Status</h4>
                            <p className="font-bold text-lg capitalize">{user?.plan} Plan</p>
                        </div>
                        <div className="p-4 rounded-sm border text-center space-y-2" style={{ borderTop: '3px solid #f97316' }}>
                            <h4 className="text-sm font-medium text-muted-foreground">Next Reset</h4>
                            <p className="font-bold text-lg">Daily at Midnight</p>
                        </div>
                    </div>

                    {showCancelConfirm && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-sm border border-destructive/20 bg-destructive/5 space-y-4"
                      >
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-destructive">Cancel Subscription?</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Your subscription will cancel at <span className="text-foreground font-medium">
                                {user?.plan_updated_at ? new Date(new Date(user.plan_updated_at).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString() : 'the end of billing cycle'}
                              </span>.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="rounded-sm flex-1"
                            onClick={handleCancelSubscription}
                            disabled={loading}
                          >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Cancellation"}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-sm flex-1"
                            onClick={() => setShowCancelConfirm(false)}
                            disabled={loading}
                          >
                            Keep Plan
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                  <CardFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                    <Button 
                      onClick={() => navigate("/pricing")}
                      variant="default"
                      className="rounded-sm gap-2 w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white border-0"
                    >
                      <ArrowRight className="w-4 h-4" />
                      Manage Plan
                    </Button>
                    {(user?.plan === "vip" || user?.plan === "premium") && !showCancelConfirm && !user?.cancelled_at && (
                        <Button 
                           onClick={() => setShowCancelConfirm(true)}
                           disabled={loading}
                           variant="outline"
                           className="rounded-sm text-destructive hover:bg-destructive/5 w-full sm:w-auto"
                        >
                            Cancel Subscription
                        </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            )}

            {activeTab === "security" && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <Card className="rounded-sm border border-destructive/20 shadow-sm overflow-hidden">
                  <div className="h-2 bg-destructive/60" />
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold flex items-center gap-2 text-destructive">
                        <Trash2 className="w-5 h-5" />
                        Danger Zone
                    </CardTitle>
                    <CardDescription>Permanently delete your account and all associated data.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {deleteStep === 1 ? (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Deleting your account is permanent. This will remove all your analysis history, 
                          saved scorecards, and subscription data.
                        </p>
                        <Button 
                          onClick={requestDelete} 
                          disabled={deleteLoading}
                          variant="destructive" 
                          className="rounded-sm gap-2"
                        >
                          {deleteLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                          Delete Account
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex flex-col items-center justify-center p-6 border rounded-sm bg-secondary/20 dashed-border">
                            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                                <Mail className="w-6 h-6 text-destructive" />
                            </div>
                            <h3 className="font-bold mb-1 text-lg">Verify Your Identity</h3>
                            <p className="text-sm text-muted-foreground text-center max-w-xs mb-6">
                                We've sent a 6-digit confirmation code to <span className="text-foreground font-medium">{user?.email}</span>
                            </p>
                            
                            <div className="space-y-4 w-full flex flex-col items-center">
                                <InputOTP
                                    maxLength={6}
                                    pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                                    value={deleteOtp}
                                    onChange={(val) => setDeleteOtp(val)}
                                >
                                    <InputOTPGroup className="gap-2">
                                        <InputOTPSlot index={0} className="w-12 h-14 text-xl rounded-sm border-2" />
                                        <InputOTPSlot index={1} className="w-12 h-14 text-xl rounded-sm border-2" />
                                        <InputOTPSlot index={2} className="w-12 h-14 text-xl rounded-sm border-2" />
                                        <InputOTPSlot index={3} className="w-12 h-14 text-xl rounded-sm border-2" />
                                        <InputOTPSlot index={4} className="w-12 h-14 text-xl rounded-sm border-2" />
                                        <InputOTPSlot index={5} className="w-12 h-14 text-xl rounded-sm border-2" />
                                    </InputOTPGroup>
                                </InputOTP>

                                <div className="flex gap-3 w-full max-w-xs pt-4">
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setDeleteStep(1)}
                                        className="flex-1 rounded-sm"
                                        disabled={deleteLoading}
                                    >
                                        Back
                                    </Button>
                                    <Button 
                                        variant="destructive" 
                                        onClick={confirmDelete}
                                        className="flex-1 rounded-sm shadow-lg shadow-destructive/20"
                                        disabled={deleteLoading}
                                    >
                                        {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Final Delete"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
