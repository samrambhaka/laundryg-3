import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Lock, User, MapPin, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/laundry_girl.png";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [panchayathId, setPanchayathId] = useState("");
  const [wardId, setWardId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [panchayaths, setPanchayaths] = useState<{ id: string; name: string }[]>([]);
  const [wards, setWards] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("panchayaths").select("id, name").order("name").then(({ data }) => {
      if (data) setPanchayaths(data);
    });
  }, []);

  useEffect(() => {
    if (!panchayathId) { setWards([]); return; }
    supabase.from("wards").select("id, name").eq("panchayath_id", panchayathId).order("name").then(({ data }) => {
      if (data) setWards(data);
    });
  }, [panchayathId]);

  const formatPhone = (num: string) => {
    const cleaned = num.replace(/\D/g, "");
    return cleaned.startsWith("91") ? `+${cleaned}` : `+91${cleaned}`;
  };

  // Convert phone to a deterministic email for Supabase email/password auth
  const phoneToEmail = (num: string) => `${formatPhone(num).replace("+", "")}@laundrygirl.admin`;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.replace(/\D/g, "").length < 10) {
      toast.error("Enter a valid mobile number");
      return;
    }
    setLoading(true);
    try {
      const email = phoneToEmail(phone);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Verify admin role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .in("role", ["super_admin", "admin", "staff"])
        .maybeSingle();

      if (!roleData) {
        await supabase.auth.signOut();
        toast.error("You don't have admin access");
        return;
      }

      toast.success("Welcome to Admin Panel!");
      navigate("/admin");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !panchayathId || !wardId) {
      toast.error("Please fill all fields");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      toast.error("Enter a valid mobile number");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const email = phoneToEmail(phone);
      const formattedPhone = formatPhone(phone);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: name.trim(), phone: formattedPhone },
        },
      });
      if (error) throw error;
      if (!data.user) throw new Error("Signup failed");

      // Save admin profile info
      await supabase.from("profiles").update({
        name: name.trim(),
        mobile_number: formattedPhone,
        panchayath_id: panchayathId,
        ward_id: wardId,
      }).eq("user_id", data.user.id);

      toast.success("Admin account created! Awaiting super admin approval.");
      setMode("login");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background px-6 py-8">
      <button
        onClick={() => navigate("/landing")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="w-5 h-5" /> Back
      </button>

      <div className="flex flex-col items-center gap-6 flex-1 justify-center max-w-sm mx-auto w-full">
        <img src={logo} alt="Logo" className="w-20 h-20 object-contain" />

        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-secondary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-secondary">Admin Portal</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            {mode === "login" ? "Admin Login" : "Admin Registration"}
          </h2>
        </div>

        {/* Tab switcher */}
        <div className="flex w-full rounded-xl bg-muted p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === "login" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === "signup" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            Sign Up
          </button>
        </div>

        {mode === "login" && (
          <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="tel"
                placeholder="Mobile Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                maxLength={15}
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
                className="w-full pl-11 pr-11 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        )}

        {mode === "signup" && (
          <form onSubmit={handleSignup} className="flex flex-col gap-4 w-full">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type="text" placeholder="Full Name" value={name}
                onChange={(e) => setName(e.target.value)} required maxLength={100}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type="tel" placeholder="Mobile Number" value={phone}
                onChange={(e) => setPhone(e.target.value)} required maxLength={15}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <select value={panchayathId} onChange={(e) => { setPanchayathId(e.target.value); setWardId(""); }} required
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none">
                <option value="">Select Panchayath</option>
                {panchayaths.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <select value={wardId} onChange={(e) => setWardId(e.target.value)} required disabled={!panchayathId}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none disabled:opacity-50">
                <option value="">Select Ward</option>
                {wards.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type={showPassword ? "text" : "password"} placeholder="Password" value={password}
                onChange={(e) => setPassword(e.target.value)} required minLength={6}
                className="w-full pl-11 pr-11 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type={showConfirm ? "text" : "password"} placeholder="Repeat Password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} required
                className="w-full pl-11 pr-11 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? "Creating account..." : "Create Admin Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;
