import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ScanEye, ArrowRight, Loader2, Mail, KeyRound, RefreshCw, Eye, EyeOff } from "lucide-react";
import axios from "axios";

export default function AuthPage() {
  const navigate = useNavigate();
  const { loginWithData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginStep, setLoginStep] = useState(1);
  const [loginOTP, setLoginOTP] = useState("");

  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "", otp: "" });
  const [registerStep, setRegisterStep] = useState(1);

  // Forgot password state
  const [forgotStep, setForgotStep] = useState(0); // 0=hidden, 1=email, 2=otp, 3=newpass
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOTP, setForgotOTP] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);

  const startResendCooldown = () => {
    setResendCooldown(60);
    const timer = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOTP = async (mode) => {
    const email = mode === "reset" ? forgotEmail : mode === "register" ? registerForm.email : loginForm.email;
    setLoading(true);
    try {
      let resp;
      if (mode === "register") {
        resp = await axios.post("http://localhost:8000/api/auth/send-otp", { email });
        if (resp.data.mock_otp) {
          toast.info(`MOCK OTP: ${resp.data.mock_otp}`);
          setRegisterForm(prev => ({ ...prev, otp: resp.data.mock_otp }));
        } else {
          toast.success("New code sent to your email!");
        }
      } else {
        resp = await axios.post("http://localhost:8000/api/auth/resend-otp", { email, mode });
        if (resp.data.mock_otp) {
          toast.info(`MOCK OTP: ${resp.data.mock_otp}`);
          if (mode === "reset") setForgotOTP(resp.data.mock_otp);
          else setLoginOTP(resp.data.mock_otp);
        } else {
          toast.success("New code sent to your email!");
        }
      }
      startResendCooldown();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to resend code");
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const resp = await axios.post("http://localhost:8000/api/auth/login", {
        email: loginForm.email,
        password: loginForm.password
      });
      if (resp.data.mock_otp) {
        toast.info(`MOCK OTP: ${resp.data.mock_otp} (Auto-filled)`);
        setLoginOTP(resp.data.mock_otp);
      } else {
        toast.success("Verification code sent to your email!");
      }
      setLoginStep(2);
      startResendCooldown();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid credentials");
    }
    setLoading(false);
  };

  const handleLoginVerify = async (e) => {
    e.preventDefault();
    if (loginOTP.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const resp = await axios.post("http://localhost:8000/api/auth/login/verify", {
        email: loginForm.email,
        otp: loginOTP
      });
      loginWithData(resp.data.token, resp.data.user);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid or expired code");
    }
    setLoading(false);
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (registerForm.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const resp = await axios.post("http://localhost:8000/api/auth/send-otp", {
        email: registerForm.email
      });
      if (resp.data.mock_otp) {
        toast.info(`MOCK OTP: ${resp.data.mock_otp} (Auto-filled)`);
        setRegisterForm(prev => ({ ...prev, otp: resp.data.mock_otp }));
      } else {
        toast.success("OTP sent to your email!");
      }
      setRegisterStep(2);
      startResendCooldown();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to send OTP");
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerForm.otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const resp = await axios.post("http://localhost:8000/api/auth/register", {
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password,
        otp: registerForm.otp
      });
      loginWithData(resp.data.token, resp.data.user);
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed. Invalid or expired OTP.");
    }
    setLoading(false);
  };

  // ===== FORGOT PASSWORD HANDLERS =====
  const handleForgotSendOTP = async (e) => {
    e.preventDefault();
    if (!forgotEmail) { toast.error("Please enter your email"); return; }
    setLoading(true);
    try {
      const resp = await axios.post("http://localhost:8000/api/auth/forgot-password", { email: forgotEmail });
      if (resp.data.mock_otp) {
        toast.info(`MOCK OTP: ${resp.data.mock_otp} (Auto-filled)`);
        setForgotOTP(resp.data.mock_otp);
      } else {
        toast.success("Reset code sent! Check your email.");
      }
      setForgotStep(2);
      startResendCooldown();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to send reset code");
    }
    setLoading(false);
  };

  const handleForgotVerifyOTP = async (e) => {
    e.preventDefault();
    if (forgotOTP.length !== 6) { toast.error("Enter the 6-digit code"); return; }
    setLoading(true);
    try {
      await axios.post("http://localhost:8000/api/auth/forgot-password/verify", { email: forgotEmail, otp: forgotOTP });
      toast.success("Code verified!");
      setForgotStep(3);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid or expired code");
    }
    setLoading(false);
  };

  const handleForgotReset = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    try {
      const resp = await axios.post("http://localhost:8000/api/auth/forgot-password/reset", {
        email: forgotEmail,
        otp: forgotOTP,
        new_password: newPassword
      });
      loginWithData(resp.data.token, resp.data.user);
      toast.success("Password reset! Logging you in...");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Reset failed");
    }
    setLoading(false);
  };

  const ResendButton = ({ mode }) => (
    <button
      type="button"
      onClick={() => handleResendOTP(mode)}
      disabled={loading || resendCooldown > 0}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-orange-500 transition-colors disabled:opacity-40 mx-auto mt-1"
    >
      <RefreshCw className="w-3 h-3" />
      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
    </button>
  );

  // ===== FORGOT PASSWORD MODAL =====
  if (forgotStep > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10">
        <div className="fixed inset-0 bg-background -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--brand-real)/0.05),transparent_60%)]" />
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-sm bg-foreground flex items-center justify-center">
              <ScanEye className="w-6 h-6 text-background" />
            </div>
            <span className="text-xl font-black tracking-tight font-['Outfit']">VerifyLens</span>
          </div>

          <Card className="rounded-sm border shadow-lg" style={{ borderTop: '3px solid #f97316' }}>
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-orange-500" />
                {forgotStep === 1 ? "Forgot Password" : forgotStep === 2 ? "Enter Reset Code" : "Set New Password"}
              </CardTitle>
              <CardDescription>
                {forgotStep === 1 && "Enter your email to receive a reset code."}
                {forgotStep === 2 && `We sent a 6-digit code to ${forgotEmail}`}
                {forgotStep === 3 && "Choose a strong new password."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {forgotStep === 1 && (
                  <motion.form key="fp1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleForgotSendOTP} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <Input type="email" placeholder="you@example.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} className="rounded-sm" />
                    </div>
                    <Button type="submit" className="w-full rounded-sm gap-2 bg-orange-500 hover:bg-orange-600 text-white" disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      Send Reset Code
                    </Button>
                    <Button type="button" variant="ghost" className="w-full text-xs text-muted-foreground" onClick={() => setForgotStep(0)}>
                      Back to Sign In
                    </Button>
                  </motion.form>
                )}

                {forgotStep === 2 && (
                  <motion.form key="fp2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleForgotVerifyOTP} className="space-y-6">
                    <div className="flex justify-center py-2">
                      <InputOTP maxLength={6} value={forgotOTP} onChange={setForgotOTP}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
                          <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <ResendButton mode="reset" />
                    <div className="flex flex-col gap-2">
                      <Button type="submit" className="w-full rounded-sm gap-2 bg-orange-500 hover:bg-orange-600 text-white" disabled={loading || forgotOTP.length !== 6}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                        Verify Code
                      </Button>
                      <Button type="button" variant="ghost" className="w-full text-xs text-muted-foreground" onClick={() => setForgotStep(1)}>
                        Change email
                      </Button>
                    </div>
                  </motion.form>
                )}

                {forgotStep === 3 && (
                  <motion.form key="fp3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleForgotReset} className="space-y-4">
                    <div className="space-y-2">
                      <Label>New Password</Label>
                      <div className="relative">
                        <Input type={showNewPass ? "text" : "password"} placeholder="Min 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="rounded-sm pr-10" />
                        <button type="button" onClick={() => setShowNewPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Confirm Password</Label>
                      <Input type="password" placeholder="Re-enter password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="rounded-sm" />
                    </div>
                    <Button type="submit" className="w-full rounded-sm gap-2 bg-orange-500 hover:bg-orange-600 text-white" disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                      Reset Password
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10" data-testid="auth-page">
      {/* Background */}
      <div className="fixed inset-0 bg-background -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--brand-real)/0.05),transparent_60%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-sm bg-foreground flex items-center justify-center">
            <ScanEye className="w-6 h-6 text-background" />
          </div>
          <span className="text-xl font-black tracking-tight font-['Outfit']">VerifyLens</span>
        </div>

        <Card className="rounded-sm border shadow-lg">
          <Tabs defaultValue="login">
            <CardHeader className="pb-4">
              <TabsList className="w-full" data-testid="auth-tabs">
                <TabsTrigger value="login" className="flex-1" data-testid="login-tab">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="register" className="flex-1" data-testid="register-tab">
                  Sign Up
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              {/* Login */}
              <TabsContent value="login">
                <AnimatePresence mode="wait">
                  {loginStep === 1 ? (
                    <motion.form 
                      key="login-step1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      onSubmit={handleLogin} 
                      className="space-y-4" 
                      data-testid="login-form"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@example.com"
                          value={loginForm.email}
                          onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                          className="rounded-sm"
                          data-testid="login-email-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="Enter your password"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                          className="rounded-sm"
                          data-testid="login-password-input"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full rounded-sm gap-2"
                        disabled={loading}
                        data-testid="login-submit-button"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                        Continue
                      </Button>
                      {/* Forgot Password Link */}
                      <button
                        type="button"
                        onClick={() => { setForgotEmail(loginForm.email); setForgotStep(1); }}
                        className="w-full text-center text-xs text-muted-foreground hover:text-orange-500 transition-colors mt-1"
                      >
                        Forgot your password?
                      </button>
                    </motion.form>
                  ) : (
                    <motion.form 
                      key="login-step2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      onSubmit={handleLoginVerify} 
                      className="space-y-6"
                    >
                      <div className="text-center space-y-2">
                        <p className="text-sm font-medium">Extra Security</p>
                        <p className="text-xs text-muted-foreground break-all">We sent a login code to {loginForm.email}</p>
                      </div>
                      
                      <div className="flex justify-center py-2">
                        <InputOTP
                          maxLength={6}
                          value={loginOTP}
                          onChange={(value) => setLoginOTP(value)}
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>

                      <ResendButton mode="login" />

                      <div className="flex flex-col gap-2">
                        <Button
                          type="submit"
                          className="w-full rounded-sm gap-2"
                          disabled={loading || loginOTP.length !== 6}
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                          Verify & Sign In
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => setLoginStep(1)}
                          disabled={loading}
                        >
                          Back to credentials
                        </Button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </TabsContent>

              {/* Register */}
              <TabsContent value="register">
                <AnimatePresence mode="wait">
                  {registerStep === 1 ? (
                    <motion.form 
                      key="step1" 
                      initial={{ opacity: 0, x: -20 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      exit={{ opacity: 0, x: 20 }} 
                      onSubmit={handleSendOTP} 
                      className="space-y-4" 
                      data-testid="register-form"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="register-name">Full Name</Label>
                        <Input
                          id="register-name"
                          type="text"
                          placeholder="John Doe"
                          value={registerForm.name}
                          onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                          className="rounded-sm"
                          data-testid="register-name-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-email">Email</Label>
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="you@example.com"
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                          className="rounded-sm"
                          data-testid="register-email-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-password">Password</Label>
                        <Input
                          id="register-password"
                          type="password"
                          placeholder="Min 6 characters"
                          value={registerForm.password}
                          onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                          className="rounded-sm"
                          data-testid="register-password-input"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full rounded-sm gap-2"
                        disabled={loading}
                        data-testid="register-submit-button"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                        Send Verification Code
                      </Button>
                    </motion.form>
                  ) : (
                    <motion.form 
                      key="step2" 
                      initial={{ opacity: 0, x: -20 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      exit={{ opacity: 0, x: 20 }} 
                      onSubmit={handleRegister} 
                      className="space-y-6"
                    >
                      <div className="text-center space-y-2">
                        <p className="text-sm font-medium">Verify your email</p>
                        <p className="text-xs text-muted-foreground break-all">We sent a code to {registerForm.email}</p>
                      </div>
                      
                      <div className="flex justify-center py-2">
                        <InputOTP
                          maxLength={6}
                          value={registerForm.otp}
                          onChange={(value) => setRegisterForm({ ...registerForm, otp: value })}
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>

                      <ResendButton mode="register" />

                      <div className="flex flex-col gap-2">
                        <Button
                          type="submit"
                          className="w-full rounded-sm gap-2"
                          disabled={loading || registerForm.otp.length !== 6}
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                          Verify & Create Account
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => setRegisterStep(1)}
                          disabled={loading}
                        >
                          Back to edit details
                        </Button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our terms of service.
        </p>
      </motion.div>
    </div>
  );
}
