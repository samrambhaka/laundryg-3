import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, Shirt, Wrench, Sparkles, Zap, Droplets, Wind, Hammer, Bug, ChevronRight } from "lucide-react";
import logo from "@/assets/laundry_girl.png";

interface AddonService {
  id: string;
  name: string;
  description: string | null;
  booking_charge: number;
  category: string;
  icon_name: string | null;
}

interface LaundryFeature {
  id: string;
  name: string;
  category: string;
  price_wash: number | null;
  price_iron: number | null;
  price_wash_iron: number | null;
}

const iconMap: Record<string, React.ReactNode> = {
  sparkles: <Sparkles className="w-6 h-6" />,
  zap: <Zap className="w-6 h-6" />,
  droplets: <Droplets className="w-6 h-6" />,
  hammer: <Hammer className="w-6 h-6" />,
  bug: <Bug className="w-6 h-6" />,
  wind: <Wind className="w-6 h-6" />,
  wrench: <Wrench className="w-6 h-6" />,
};

const CustomerHome = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ name: string } | null>(null);
  const [services, setServices] = useState<AddonService[]>([]);
  const [features, setFeatures] = useState<LaundryFeature[]>([]);
  const [tab, setTab] = useState<"laundry" | "services">("laundry");
  const [bookingServiceId, setBookingServiceId] = useState<string | null>(null);
  const [bookingNotes, setBookingNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/customer-login"); return; }

      const { data: p } = await supabase.from("profiles").select("name").eq("user_id", user.id).single();
      if (p) setProfile(p);

      const { data: s } = await supabase.from("addon_services").select("*").eq("is_active", true).order("sort_order");
      if (s) setServices(s as AddonService[]);

      const { data: f } = await supabase.from("laundry_features").select("*").eq("is_active", true).order("sort_order");
      if (f) setFeatures(f as LaundryFeature[]);
    };
    init();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/landing");
  };

  const handleBookService = async (service: AddonService) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      await supabase.from("service_bookings").insert({
        user_id: user.id,
        addon_service_id: service.id,
        booking_charge: service.booking_charge,
        notes: bookingNotes || null,
      });

      toast.success(`${service.name} booked! We'll contact you shortly.`);
      setBookingServiceId(null);
      setBookingNotes("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
          <div>
            <p className="text-xs opacity-80">Welcome back</p>
            <p className="font-bold text-base">{profile?.name || "Customer"}</p>
          </div>
        </div>
        <button onClick={handleSignOut} className="opacity-80 hover:opacity-100 transition-opacity">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-muted border-b border-border">
        <button
          onClick={() => setTab("laundry")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === "laundry" ? "border-primary text-primary bg-background" : "border-transparent text-muted-foreground"
          }`}
        >
          <Shirt className="w-4 h-4" /> Laundry Services
        </button>
        <button
          onClick={() => setTab("services")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === "services" ? "border-primary text-primary bg-background" : "border-transparent text-muted-foreground"
          }`}
        >
          <Wrench className="w-4 h-4" /> Add-on Services
        </button>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        {/* Laundry Features */}
        {tab === "laundry" && (
          <div>
            <p className="text-sm text-muted-foreground mb-4">Our laundry services & pricing</p>
            <div className="space-y-3">
              {features.map((f) => (
                <div key={f.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shirt className="w-5 h-5 text-primary" />
                      <span className="font-semibold text-foreground">{f.name}</span>
                    </div>
                    <span className="text-xs capitalize bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{f.category}</span>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {f.price_wash && (
                      <div className="bg-primary/10 text-primary rounded-lg px-3 py-1.5 text-center">
                        <div className="text-xs opacity-70">Wash</div>
                        <div className="font-bold text-sm">₹{f.price_wash}</div>
                      </div>
                    )}
                    {f.price_iron && (
                      <div className="bg-accent/10 text-accent rounded-lg px-3 py-1.5 text-center">
                        <div className="text-xs opacity-70">Iron</div>
                        <div className="font-bold text-sm">₹{f.price_iron}</div>
                      </div>
                    )}
                    {f.price_wash_iron && (
                      <div className="bg-secondary/10 text-secondary rounded-lg px-3 py-1.5 text-center">
                        <div className="text-xs opacity-70">Wash+Iron</div>
                        <div className="font-bold text-sm">₹{f.price_wash_iron}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add-on Services */}
        {tab === "services" && (
          <div>
            <p className="text-sm text-muted-foreground mb-4">Book home services — ₹30 booking charge applies</p>
            <div className="space-y-3">
              {services.map((s) => (
                <div key={s.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                        {iconMap[s.icon_name ?? "wrench"]}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{s.name}</p>
                        {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Booking</p>
                        <p className="font-bold text-secondary">₹{s.booking_charge}</p>
                      </div>
                      <button
                        onClick={() => setBookingServiceId(s.id)}
                        className="bg-primary text-primary-foreground rounded-xl px-3 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
                      >
                        Book
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {bookingServiceId && (() => {
        const service = services.find(s => s.id === bookingServiceId);
        if (!service) return null;
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
            <div className="bg-background rounded-t-2xl p-6 w-full max-w-lg">
              <h3 className="font-bold text-foreground mb-1">Book {service.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">Booking charge: <span className="font-semibold text-secondary">₹{service.booking_charge}</span></p>
              <textarea
                placeholder="Any specific requirements? (optional)"
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none mb-4"
              />
              <div className="flex gap-3">
                <button onClick={() => { setBookingServiceId(null); setBookingNotes(""); }}
                  className="flex-1 py-3 rounded-xl border border-input text-foreground font-semibold hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button onClick={() => handleBookService(service)} disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50">
                  {loading ? "Booking..." : "Confirm Booking"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default CustomerHome;
