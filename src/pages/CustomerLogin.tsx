import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, User, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/laundry_girl.png";

const CustomerLogin = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"phone" | "otp" | "signup">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [panchayathId, setPanchayathId] = useState("");
  const [wardId, setWardId] = useState("");
  const [panchayaths, setPanchayaths] = useState<{ id: string; name: string }[]>([]);
  const [wards, setWards] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.replace(/\D/g, "").length < 10) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: formatPhone(phone) });
      if (error) throw error;
      toast.success("OTP sent to your mobile!");
      setStep("otp");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formatPhone(phone),
        token: otp,
        type: "sms",
      });
      if (error) throw error;

      // Check if profile has name filled (new user won't have it)
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("user_id", data.user.id)
          .single();

        if (!profile?.name) {
          setIsNewUser(true);
          setStep("signup");
          return;
        }
      }

      toast.success("Welcome back!");
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
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("profiles").update({
        name: name.trim(),
        panchayath_id: panchayathId,
        ward_id: wardId,
      }).eq("user_id", user.id);

      if (error) throw error;
      toast.success("Account created! Welcome!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background px-6 py-8">
      <button onClick={() => step === "phone" ? navigate("/landing") : setStep("phone")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="w-5 h-5" /> Back
      </button>

      <div className="flex flex-col items-center gap-6 flex-1 justify-center max-w-sm mx-auto w-full">
        <img src={logo} alt="Logo" className="w-20 h-20 object-contain" />
        <h2 className="text-2xl font-bold text-foreground">
          {step === "signup" ? "Complete Your Profile" : "Customer Login"}
        </h2>

        {step === "phone" && (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4 w-full">
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
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4 w-full">
            <p className="text-sm text-muted-foreground text-center">Enter the OTP sent to {phone}</p>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              maxLength={6}
              className="w-full text-center text-2xl tracking-[0.5em] py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground placeholder:text-base placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button type="submit" disabled={loading || otp.length < 6}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button type="button" onClick={() => setStep("phone")} className="text-sm text-primary hover:underline">
              Change number
            </button>
          </form>
        )}

        {step === "signup" && (
          <form onSubmit={handleSignup} className="flex flex-col gap-4 w-full">
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
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? "Please wait..." : "Complete Signup"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CustomerLogin;
