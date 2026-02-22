import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, Shirt, Wrench, Sparkles, Zap, Droplets, Wind, Hammer, Bug, ShoppingCart, Plus, ChevronRight } from "lucide-react";
import logo from "@/assets/laundry_girl.png";
import { CartProvider, useCart } from "@/components/customer/CartContext";
import CartSheet from "@/components/customer/CartSheet";

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

const CustomerHomeContent = () => {
  const navigate = useNavigate();
  const { addItem, itemCount, total } = useCart();
  const [profile, setProfile] = useState<{ name: string } | null>(null);
  const [services, setServices] = useState<AddonService[]>([]);
  const [features, setFeatures] = useState<LaundryFeature[]>([]);
  const [tab, setTab] = useState<"laundry" | "services">("laundry");
  const [cartOpen, setCartOpen] = useState(false);

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

  const addLaundryItem = (feature: LaundryFeature, serviceType: "wash" | "iron" | "wash_iron", price: number) => {
    addItem({
      type: "laundry",
      name: feature.name,
      serviceType,
      unitPrice: price,
      quantity: 1,
      laundryFeatureId: feature.id,
    });
    toast.success(`${feature.name} (${serviceType === "wash_iron" ? "Wash+Iron" : serviceType === "wash" ? "Wash" : "Iron"}) added to cart`);
  };

  const addAddonItem = (service: AddonService) => {
    addItem({
      type: "addon",
      name: service.name,
      unitPrice: service.booking_charge,
      quantity: 1,
      addonServiceId: service.id,
    });
    toast.success(`${service.name} added to cart`);
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
        <div className="flex items-center gap-3">
          <button onClick={() => setCartOpen(true)} className="relative opacity-90 hover:opacity-100 transition-opacity">
            <ShoppingCart className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>
          <button onClick={handleSignOut} className="opacity-80 hover:opacity-100 transition-opacity">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-muted border-b border-border">
        <button
          onClick={() => setTab("laundry")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === "laundry" ? "border-primary text-primary bg-background" : "border-transparent text-muted-foreground"
          }`}
        >
          <Shirt className="w-4 h-4" /> Laundry
        </button>
        <button
          onClick={() => setTab("services")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === "services" ? "border-primary text-primary bg-background" : "border-transparent text-muted-foreground"
          }`}
        >
          <Wrench className="w-4 h-4" /> Add-ons
        </button>
      </div>

      <div className="flex-1 p-4 overflow-auto pb-24">
        {/* Laundry Features */}
        {tab === "laundry" && (
          <div>
            <p className="text-sm text-muted-foreground mb-4">Tap a price to add to your cart</p>
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
                  <div className="flex gap-2 flex-wrap">
                    {f.price_wash != null && (
                      <button
                        onClick={() => addLaundryItem(f, "wash", f.price_wash!)}
                        className="bg-primary/10 hover:bg-primary/20 text-primary rounded-lg px-3 py-1.5 text-center transition-colors group"
                      >
                        <div className="text-xs opacity-70">Wash</div>
                        <div className="font-bold text-sm flex items-center gap-1">
                          ₹{f.price_wash}
                          <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    )}
                    {f.price_iron != null && (
                      <button
                        onClick={() => addLaundryItem(f, "iron", f.price_iron!)}
                        className="bg-accent/10 hover:bg-accent/20 text-accent-foreground rounded-lg px-3 py-1.5 text-center transition-colors group"
                      >
                        <div className="text-xs opacity-70">Iron</div>
                        <div className="font-bold text-sm flex items-center gap-1">
                          ₹{f.price_iron}
                          <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    )}
                    {f.price_wash_iron != null && (
                      <button
                        onClick={() => addLaundryItem(f, "wash_iron", f.price_wash_iron!)}
                        className="bg-secondary/10 hover:bg-secondary/20 text-secondary-foreground rounded-lg px-3 py-1.5 text-center transition-colors group"
                      >
                        <div className="text-xs opacity-70">Wash+Iron</div>
                        <div className="font-bold text-sm flex items-center gap-1">
                          ₹{f.price_wash_iron}
                          <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
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
            <p className="text-sm text-muted-foreground mb-4">Tap to add home services to your order</p>
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
                        <p className="text-xs text-muted-foreground">Charge</p>
                        <p className="font-bold text-secondary">₹{s.booking_charge}</p>
                      </div>
                      <button
                        onClick={() => addAddonItem(s)}
                        className="bg-primary text-primary-foreground rounded-xl px-3 py-2 text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" /> Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Cart Bar */}
      {itemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full max-w-lg mx-auto flex items-center justify-between bg-primary text-primary-foreground rounded-2xl px-5 py-4 shadow-lg hover:opacity-95 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary-foreground/20 rounded-lg px-2.5 py-1 text-sm font-bold">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </div>
              <span className="font-medium text-sm">View Cart</span>
            </div>
            <span className="font-bold text-lg">₹{total}</span>
          </button>
        </div>
      )}

      <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
};

const CustomerHome = () => (
  <CartProvider>
    <CustomerHomeContent />
  </CartProvider>
);

export default CustomerHome;
