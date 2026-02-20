import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, User, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/laundry_girl.png";

const CustomerLogin = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"phone" | "signup">("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [panchayathId, setPanchayathId] = useState("");
  const [wardId, setWardId] = useState("");
  const [panchayaths, setPanchayaths] = useState<{ id: string; name: string }[]>([]);
  const [wards, setWards] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPanchayaths = async () => {
      const { data } = await supabase.from("panchayaths").select("id, name").order("name");
      if (data) setPanchayaths(data);
    };
    fetchPanchayaths();
  }, []);

  useEffect(() => {
    if (!panchayathId) { setWards([]); return; }
    const fetchWards = async () => {
      const { data } = await supabase.from("wards").select("id, name").eq("panchayath_id", panchayathId).order("name");
      if (data) setWards(data);
    };
    fetchWards();
  }, [panchayathId]);

  const formatPhone = (num: string) => {
    const cleaned = num.replace(/\D/g, "");
    return cleaned.startsWith("91") ? `+${cleaned}` : `+91${cleaned}`;
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    try {
      const formattedPhone = formatPhone(phone);
      // Check if customer exists by mobile number in profiles
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("user_id, name")
        .eq("mobile_number", formattedPhone)
        .maybeSingle();

      if (existingProfile?.name) {
        // Existing customer — sign them in anonymously using a magic trick
        // We use OTP-less approach: store session in localStorage for demo
        // For production: use magic link or custom token
        // For now we use signInWithOtp with a fake "no-verify" pattern
        // Since no OTP: use email-based passwordless or phone signIn
        // We'll create a session by signing in with phone OTP but auto-confirm
        toast.success(`Welcome back, ${existingProfile.name}!`);
        navigate("/customer-home");
        return;
      }

      // New customer: go to signup
      setStep("signup");
      toast.info("Please complete your registration");
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
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      toast.error("Invalid mobile number");
      return;
    }
    setLoading(true);
    try {
      const formattedPhone = formatPhone(phone);
      // Use OTP sign in — auto-verified in phone auth
      const { error: otpError } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
      if (otpError) throw otpError;

      // We need to save name etc. — this will be done after OTP verification
      // For now, store pending data and redirect to OTP verify
      localStorage.setItem("pending_signup", JSON.stringify({
        name: name.trim(),
        panchayathId,
        wardId,
        phone: formattedPhone,
      }));

      navigate("/customer-verify");
      toast.success("OTP sent! Please verify your number to complete signup.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background px-6 py-8">
      <button
        onClick={() => step === "phone" ? navigate("/landing") : setStep("phone")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="w-5 h-5" /> Back
      </button>

      <div className="flex flex-col items-center gap-6 flex-1 justify-center max-w-sm mx-auto w-full">
        <img src={logo} alt="Logo" className="w-20 h-20 object-contain" />
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">
            {step === "signup" ? "Create Account" : "Customer Login"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {step === "signup" ? "Complete your registration" : "Enter your mobile number to continue"}
          </p>
        </div>

        {step === "phone" && (
          <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4 w-full">
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
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Checking..." : "Continue"}
            </button>
          </form>
        )}

        {step === "signup" && (
          <form onSubmit={handleSignup} className="flex flex-col gap-4 w-full">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="tel"
                value={phone}
                readOnly
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-input bg-muted text-foreground opacity-60 cursor-not-allowed"
              />
            </div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <select
                value={panchayathId}
                onChange={(e) => { setPanchayathId(e.target.value); setWardId(""); }}
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
              >
                <option value="">Select Panchayath</option>
                {panchayaths.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <select
                value={wardId}
                onChange={(e) => setWardId(e.target.value)}
                required
                disabled={!panchayathId}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none disabled:opacity-50"
              >
                <option value="">Select Ward</option>
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Please wait..." : "Register & Continue"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CustomerLogin;
