import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScanEye, Sun, Moon, History, Upload, LogOut, User, Menu, Zap, Home } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLanding = location.pathname === "/" && !user;
  const isShare = location.pathname.startsWith("/share/");

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 glass-card border-b transition-all duration-300 ${
        isLanding ? "bg-transparent border-transparent" : ""
      }`}
      data-testid="main-header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <button
          onClick={() => navigate(user ? "/dashboard" : "/")}
          className="flex items-center gap-2 group"
          data-testid="logo-button"
        >
          <div className="w-8 h-8 rounded-sm bg-foreground flex items-center justify-center group-hover:scale-105 transition-transform">
            <ScanEye className="w-5 h-5 text-background" />
          </div>
          <span className="font-bold text-lg tracking-tight font-['Outfit']">
            VerifyLens
          </span>
        </button>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            data-testid="theme-toggle-button"
            className="rounded-sm"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          {user ? (
            <>
              {/* Desktop nav */}
              <nav className="hidden md:flex items-center gap-1">
                <Button
                  variant={location.pathname === "/dashboard" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => navigate("/dashboard")}
                  data-testid="nav-home-button"
                  className="rounded-sm gap-2"
                >
                  <Home className="w-4 h-4" />
                  Home
                </Button>
                <Button
                  variant={location.pathname === "/analyze" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => navigate("/analyze")}
                  data-testid="nav-dashboard-button"
                  className="rounded-sm gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Analyze
                </Button>
                <Button
                  variant={location.pathname === "/history" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => navigate("/history")}
                  data-testid="nav-history-button"
                  className="rounded-sm gap-2"
                >
                  <History className="w-4 h-4" />
                  History
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate("/pricing")}
                  data-testid="nav-upgrade-button"
                  className="rounded-sm gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 border-0"
                >
                  <Zap className="w-4 h-4" />
                  Upgrade
                </Button>
              </nav>

              {/* User dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-sm gap-2" data-testid="user-menu-button">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline max-w-[100px] truncate">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56" style={{ borderTop: '3px solid #f97316' }}>
                  <div className="px-2 py-1.5" style={{ background: 'rgba(249,115,22,0.05)', borderRadius: '4px', marginBottom: '2px' }}>
                    <p className="text-sm font-bold">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => navigate("/dashboard")}
                    className="md:hidden cursor-pointer"
                    data-testid="mobile-nav-home"
                  >
                    <Home className="w-4 h-4 mr-2" /> Home
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/analyze")}
                    className="md:hidden cursor-pointer"
                    data-testid="mobile-nav-dashboard"
                  >
                    <Upload className="w-4 h-4 mr-2" /> Analyze
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/history")}
                    className="md:hidden cursor-pointer"
                    data-testid="mobile-nav-history"
                  >
                    <History className="w-4 h-4 mr-2" /> History
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/pricing")}
                    className="cursor-pointer font-semibold"
                    style={{ color: '#f97316' }}
                    data-testid="mobile-nav-upgrade"
                  >
                    <Zap className="w-4 h-4 mr-2" style={{ color: '#f97316' }} /> Upgrade Plan
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/account")}
                    className="cursor-pointer"
                    data-testid="nav-account-button"
                  >
                    <User className="w-4 h-4 mr-2" /> Account Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer text-destructive"
                    data-testid="logout-button"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : !isShare ? (
            <Button
              onClick={() => navigate("/auth")}
              size="sm"
              className="rounded-sm"
              data-testid="header-signin-button"
            >
              Get Started
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
