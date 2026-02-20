import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Lock, ShieldCheck, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/laundry_girl.png";

type AdminType = null | "super_admin" | "admin";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [adminType, setAdminType] = useState<AdminType>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Verify the user has the correct role
      if (data.user) {
        const expectedRole = adminType!;
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", expectedRole)
          .single();

        if (!roleData) {
          await supabase.auth.signOut();
          toast.error("You don't have permission to access this panel");
          return;
        }
      }

      toast.success(adminType === "super_admin" ? "Welcome, Super Admin!" : "Welcome, Admin!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background px-6 py-8">
      <button onClick={() => adminType ? setAdminType(null) : navigate("/landing")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="w-5 h-5" /> Back
      </button>

      <div className="flex flex-col items-center gap-6 flex-1 justify-center max-w-sm mx-auto w-full">
        <img src={logo} alt="Logo" className="w-20 h-20 object-contain" />
        <h2 className="text-2xl font-bold text-foreground">Admin Login</h2>
        <p className="text-sm text-muted-foreground -mt-4">Authorized personnel only</p>

        {!adminType ? (
          <div className="flex flex-col gap-4 w-full mt-2">
            <button
              onClick={() => setAdminType("super_admin")}
              className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-secondary text-secondary-foreground font-semibold text-lg shadow-lg hover:opacity-90 transition-opacity"
            >
              <ShieldCheck className="w-5 h-5" />
              Super Admin
            </button>
            <button
              onClick={() => setAdminType("admin")}
              className="flex items-center justify-center gap-3 w-full py-4 rounded-xl border-2 border-secondary text-secondary font-semibold text-lg hover:bg-secondary/10 transition-colors"
            >
              <Shield className="w-5 h-5" />
              Admin
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            <div className="text-center mb-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-medium">
                {adminType === "super_admin" ? <ShieldCheck className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                {adminType === "super_admin" ? "Super Admin" : "Admin"}
              </span>
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? "Please wait..." : "Login"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;
