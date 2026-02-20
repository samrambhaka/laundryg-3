import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/laundry_girl.png";

const SuperAdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Enter your email"); return; }
    if (!password) { toast.error("Enter your password"); return; }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;

      // Verify super_admin role server-side
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "super_admin")
        .maybeSingle();

      if (!roleData) {
        await supabase.auth.signOut();
        toast.error("Access denied. Super Admin credentials required.");
        return;
      }

      toast.success("Welcome, Super Admin!");
      navigate("/admin");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background px-6 py-8">
      <button
        onClick={() => navigate("/admin-login")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="w-5 h-5" /> Back
      </button>

      <div className="flex flex-col items-center gap-6 flex-1 justify-center max-w-sm mx-auto w-full">
        <img src={logo} alt="Logo" className="w-20 h-20 object-contain" />

        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-secondary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-secondary">Super Admin</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground">Super Admin Login</h2>
          <p className="text-sm text-muted-foreground mt-1">Restricted access — authorised personnel only</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full pl-11 pr-11 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
