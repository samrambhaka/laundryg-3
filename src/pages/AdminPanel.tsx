import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Users, ShieldCheck, MapPin, Shirt, Wrench,
  LogOut, Plus, Pencil, Trash2, ChevronLeft,
  X, Check, Shield, Star, Package
} from "lucide-react";

type Tab = "customers" | "admins" | "locations" | "features" | "services";

interface Profile {
  id: string;
  user_id: string;
  name: string;
  mobile_number: string | null;
  panchayath_id: string | null;
  ward_id: string | null;
  created_at: string;
}

interface AdminUser {
  id: string;
  user_id: string;
  name: string;
  mobile_number: string;
  role?: string;
}

interface Panchayath {
  id: string;
  name: string;
}

interface Ward {
  id: string;
  name: string;
  panchayath_id: string;
}

interface LaundryFeature {
  id: string;
  name: string;
  category: string;
  price_wash: number | null;
  price_iron: number | null;
  price_wash_iron: number | null;
  is_active: boolean;
  sort_order: number;
}

interface AddonService {
  id: string;
  name: string;
  description: string | null;
  category: string;
  booking_charge: number;
  is_active: boolean;
  icon_name: string | null;
}

const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("customers");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Data
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [panchayaths, setPanchayaths] = useState<Panchayath[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [features, setFeatures] = useState<LaundryFeature[]>([]);
  const [services, setServices] = useState<AddonService[]>([]);

  // Modals
  const [showPanchayathModal, setShowPanchayathModal] = useState(false);
  const [showWardModal, setShowWardModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);

  // Forms
  const [panchayathName, setPanchayathName] = useState("");
  const [wardName, setWardName] = useState("");
  const [wardPanchayathId, setWardPanchayathId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [featureForm, setFeatureForm] = useState({ name: "", category: "clothing", price_wash: "", price_iron: "", price_wash_iron: "" });
  const [serviceForm, setServiceForm] = useState({ name: "", description: "", category: "home", booking_charge: "30", icon_name: "wrench" });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (userRole) {
      fetchData();
    }
  }, [activeTab, userRole]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/admin-login"); return; }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["super_admin", "admin", "staff"])
      .maybeSingle();

    if (!roleData) { navigate("/admin-login"); return; }
    setUserRole(roleData.role);
    setLoading(false);
  };

  const fetchData = async () => {
    if (activeTab === "customers") {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setCustomers(data);
    }
    if (activeTab === "locations") {
      const [p, w] = await Promise.all([
        supabase.from("panchayaths").select("*").order("name"),
        supabase.from("wards").select("*").order("name"),
      ]);
      if (p.data) setPanchayaths(p.data);
      if (w.data) setWards(w.data);
    }
    if (activeTab === "features") {
      const { data } = await supabase.from("laundry_features").select("*").order("sort_order");
      if (data) setFeatures(data as LaundryFeature[]);
    }
    if (activeTab === "services") {
      const { data } = await supabase.from("addon_services").select("*").order("sort_order");
      if (data) setServices(data as AddonService[]);
    }
    if (activeTab === "admins") {
      // Get all non-customer users
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["super_admin", "admin", "staff"]);
      if (roles) {
        const userIds = roles.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", userIds);
        if (profiles) {
          setAdmins(profiles.map(p => ({
            ...p,
            role: roles.find(r => r.user_id === p.user_id)?.role,
          })) as AdminUser[]);
        }
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/landing");
  };

  // --- Panchayath CRUD ---
  const savePanchayath = async () => {
    if (!panchayathName.trim()) return;
    if (editingId) {
      await supabase.from("panchayaths").update({ name: panchayathName.trim() }).eq("id", editingId);
      toast.success("Panchayath updated");
    } else {
      await supabase.from("panchayaths").insert({ name: panchayathName.trim() });
      toast.success("Panchayath added");
    }
    setPanchayathName(""); setEditingId(null); setShowPanchayathModal(false);
    fetchData();
  };

  const deletePanchayath = async (id: string) => {
    await supabase.from("panchayaths").delete().eq("id", id);
    toast.success("Panchayath deleted");
    fetchData();
  };

  // --- Ward CRUD ---
  const saveWard = async () => {
    if (!wardName.trim() || !wardPanchayathId) return;
    if (editingId) {
      await supabase.from("wards").update({ name: wardName.trim(), panchayath_id: wardPanchayathId }).eq("id", editingId);
      toast.success("Ward updated");
    } else {
      await supabase.from("wards").insert({ name: wardName.trim(), panchayath_id: wardPanchayathId });
      toast.success("Ward added");
    }
    setWardName(""); setWardPanchayathId(""); setEditingId(null); setShowWardModal(false);
    fetchData();
  };

  const deleteWard = async (id: string) => {
    await supabase.from("wards").delete().eq("id", id);
    toast.success("Ward deleted");
    fetchData();
  };

  // --- Feature CRUD ---
  const saveFeature = async () => {
    if (!featureForm.name.trim()) return;
    const payload = {
      name: featureForm.name.trim(),
      category: featureForm.category,
      price_wash: featureForm.price_wash ? parseFloat(featureForm.price_wash) : null,
      price_iron: featureForm.price_iron ? parseFloat(featureForm.price_iron) : null,
      price_wash_iron: featureForm.price_wash_iron ? parseFloat(featureForm.price_wash_iron) : null,
    };
    if (editingId) {
      await supabase.from("laundry_features").update(payload).eq("id", editingId);
      toast.success("Feature updated");
    } else {
      await supabase.from("laundry_features").insert(payload);
      toast.success("Feature added");
    }
    setFeatureForm({ name: "", category: "clothing", price_wash: "", price_iron: "", price_wash_iron: "" });
    setEditingId(null); setShowFeatureModal(false);
    fetchData();
  };

  const deleteFeature = async (id: string) => {
    await supabase.from("laundry_features").delete().eq("id", id);
    toast.success("Feature deleted");
    fetchData();
  };

  // --- Service CRUD ---
  const saveService = async () => {
    if (!serviceForm.name.trim()) return;
    const payload = {
      name: serviceForm.name.trim(),
      description: serviceForm.description || null,
      category: serviceForm.category,
      booking_charge: parseFloat(serviceForm.booking_charge) || 30,
      icon_name: serviceForm.icon_name,
    };
    if (editingId) {
      await supabase.from("addon_services").update(payload).eq("id", editingId);
      toast.success("Service updated");
    } else {
      await supabase.from("addon_services").insert(payload);
      toast.success("Service added");
    }
    setServiceForm({ name: "", description: "", category: "home", booking_charge: "30", icon_name: "wrench" });
    setEditingId(null); setShowServiceModal(false);
    fetchData();
  };

  const deleteService = async (id: string) => {
    await supabase.from("addon_services").delete().eq("id", id);
    toast.success("Service deleted");
    fetchData();
  };

  const updateAdminRole = async (userId: string, newRole: string) => {
    await supabase.from("user_roles").update({ role: newRole as any }).eq("user_id", userId);
    toast.success("Role updated");
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const tabs = [
    { id: "customers" as Tab, label: "Customers", icon: Users },
    { id: "admins" as Tab, label: "Admins", icon: ShieldCheck },
    { id: "locations" as Tab, label: "Locations", icon: MapPin },
    { id: "features" as Tab, label: "Features", icon: Shirt },
    { id: "services" as Tab, label: "Services", icon: Wrench },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-secondary text-secondary-foreground px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" />
          <span className="font-bold text-lg">Admin Panel</span>
          <span className="text-xs bg-secondary-foreground/20 px-2 py-0.5 rounded-full capitalize">{userRole?.replace("_", " ")}</span>
        </div>
        <button onClick={handleSignOut} className="flex items-center gap-1 text-sm opacity-80 hover:opacity-100">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-muted border-b border-border overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
              activeTab === id
                ? "border-secondary text-secondary bg-background"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">

        {/* === CUSTOMERS TAB === */}
        {activeTab === "customers" && (
          <div>
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Customer Registrations
            </h3>
            {customers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No customers registered yet</p>
            ) : (
              <div className="space-y-3">
                {customers.map((c) => (
                  <div key={c.id} className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{c.name || "—"}</p>
                        <p className="text-sm text-muted-foreground">{c.mobile_number || "No mobile"}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* === ADMINS TAB === */}
        {activeTab === "admins" && (
          <div>
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-secondary" /> Admin Management
            </h3>
            {admins.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No admins found</p>
            ) : (
              <div className="space-y-3">
                {admins.map((a) => (
                  <div key={a.id} className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="font-semibold text-foreground">{a.name}</p>
                        <p className="text-sm text-muted-foreground">{a.mobile_number}</p>
                      </div>
                      {userRole === "super_admin" && (
                        <select
                          value={a.role}
                          onChange={(e) => updateAdminRole(a.user_id, e.target.value)}
                          className="text-sm rounded-lg border border-input bg-background text-foreground px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          <option value="staff">Staff</option>
                          <option value="admin">Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      )}
                      {userRole !== "super_admin" && (
                        <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full capitalize">
                          {a.role?.replace("_", " ")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* === LOCATIONS TAB === */}
        {activeTab === "locations" && (
          <div className="space-y-6">
            {/* Panchayaths */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" /> Panchayaths
                </h3>
                <button
                  onClick={() => { setEditingId(null); setPanchayathName(""); setShowPanchayathModal(true); }}
                  className="flex items-center gap-1 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              <div className="space-y-2">
                {panchayaths.map((p) => (
                  <div key={p.id} className="bg-card rounded-xl border border-border px-4 py-3 flex items-center justify-between">
                    <span className="font-medium text-foreground">{p.name}</span>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingId(p.id); setPanchayathName(p.name); setShowPanchayathModal(true); }}
                        className="text-muted-foreground hover:text-primary transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deletePanchayath(p.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Wards */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-secondary" /> Wards
                </h3>
                <button
                  onClick={() => { setEditingId(null); setWardName(""); setWardPanchayathId(""); setShowWardModal(true); }}
                  className="flex items-center gap-1 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              <div className="space-y-2">
                {wards.map((w) => (
                  <div key={w.id} className="bg-card rounded-xl border border-border px-4 py-3 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-foreground">{w.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {panchayaths.find(p => p.id === w.panchayath_id)?.name}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingId(w.id); setWardName(w.name); setWardPanchayathId(w.panchayath_id); setShowWardModal(true); }}
                        className="text-muted-foreground hover:text-primary transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteWard(w.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* === FEATURES TAB === */}
        {activeTab === "features" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Shirt className="w-5 h-5 text-primary" /> Laundry Features
              </h3>
              <button
                onClick={() => { setEditingId(null); setFeatureForm({ name: "", category: "clothing", price_wash: "", price_iron: "", price_wash_iron: "" }); setShowFeatureModal(true); }}
                className="flex items-center gap-1 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {features.map((f) => (
                <div key={f.id} className="bg-card rounded-xl border border-border px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-foreground">{f.name}</span>
                      <span className="text-xs text-muted-foreground ml-2 capitalize bg-muted px-2 py-0.5 rounded-full">{f.category}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => {
                        setEditingId(f.id);
                        setFeatureForm({ name: f.name, category: f.category, price_wash: f.price_wash?.toString() ?? "", price_iron: f.price_iron?.toString() ?? "", price_wash_iron: f.price_wash_iron?.toString() ?? "" });
                        setShowFeatureModal(true);
                      }} className="text-muted-foreground hover:text-primary transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteFeature(f.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    {f.price_wash && <span>Wash: ₹{f.price_wash}</span>}
                    {f.price_iron && <span>Iron: ₹{f.price_iron}</span>}
                    {f.price_wash_iron && <span>Wash+Iron: ₹{f.price_wash_iron}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === SERVICES TAB === */}
        {activeTab === "services" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Wrench className="w-5 h-5 text-primary" /> Add-on Services
              </h3>
              <button
                onClick={() => { setEditingId(null); setServiceForm({ name: "", description: "", category: "home", booking_charge: "30", icon_name: "wrench" }); setShowServiceModal(true); }}
                className="flex items-center gap-1 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {services.map((s) => (
                <div key={s.id} className="bg-card rounded-xl border border-border px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-foreground">{s.name}</span>
                      <span className="text-xs text-muted-foreground ml-2 capitalize bg-muted px-2 py-0.5 rounded-full">{s.category}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-secondary">₹{s.booking_charge}</span>
                      <button onClick={() => {
                        setEditingId(s.id);
                        setServiceForm({ name: s.name, description: s.description ?? "", category: s.category, booking_charge: s.booking_charge.toString(), icon_name: s.icon_name ?? "wrench" });
                        setShowServiceModal(true);
                      }} className="text-muted-foreground hover:text-primary transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteService(s.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  {s.description && <p className="text-xs text-muted-foreground mt-1">{s.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* === MODALS === */}

      {/* Panchayath Modal */}
      {showPanchayathModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-background rounded-t-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">{editingId ? "Edit" : "Add"} Panchayath</h3>
              <button onClick={() => setShowPanchayathModal(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <input
              type="text" placeholder="Panchayath name" value={panchayathName}
              onChange={(e) => setPanchayathName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring mb-4"
            />
            <button onClick={savePanchayath}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90">
              {editingId ? "Update" : "Add"} Panchayath
            </button>
          </div>
        </div>
      )}

      {/* Ward Modal */}
      {showWardModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-background rounded-t-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">{editingId ? "Edit" : "Add"} Ward</h3>
              <button onClick={() => setShowWardModal(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3 mb-4">
              <select value={wardPanchayathId} onChange={(e) => setWardPanchayathId(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none">
                <option value="">Select Panchayath</option>
                {panchayaths.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="text" placeholder="Ward name" value={wardName}
                onChange={(e) => setWardName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <button onClick={saveWard}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90">
              {editingId ? "Update" : "Add"} Ward
            </button>
          </div>
        </div>
      )}

      {/* Feature Modal */}
      {showFeatureModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-background rounded-t-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">{editingId ? "Edit" : "Add"} Laundry Feature</h3>
              <button onClick={() => setShowFeatureModal(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3 mb-4">
              <input type="text" placeholder="Feature name (e.g. Pants)" value={featureForm.name}
                onChange={(e) => setFeatureForm({ ...featureForm, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              <select value={featureForm.category} onChange={(e) => setFeatureForm({ ...featureForm, category: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none">
                <option value="tops">Tops</option>
                <option value="bottoms">Bottoms</option>
                <option value="traditional">Traditional</option>
                <option value="household">Household</option>
                <option value="clothing">Clothing</option>
              </select>
              <input type="number" placeholder="Wash price (₹)" value={featureForm.price_wash}
                onChange={(e) => setFeatureForm({ ...featureForm, price_wash: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              <input type="number" placeholder="Iron price (₹)" value={featureForm.price_iron}
                onChange={(e) => setFeatureForm({ ...featureForm, price_iron: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              <input type="number" placeholder="Wash + Iron price (₹)" value={featureForm.price_wash_iron}
                onChange={(e) => setFeatureForm({ ...featureForm, price_wash_iron: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <button onClick={saveFeature}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90">
              {editingId ? "Update" : "Add"} Feature
            </button>
          </div>
        </div>
      )}

      {/* Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-background rounded-t-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">{editingId ? "Edit" : "Add"} Add-on Service</h3>
              <button onClick={() => setShowServiceModal(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3 mb-4">
              <input type="text" placeholder="Service name (e.g. Plumber)" value={serviceForm.name}
                onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              <textarea placeholder="Description (optional)" value={serviceForm.description}
                onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              <select value={serviceForm.category} onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none">
                <option value="home">Home</option>
                <option value="utility">Utility</option>
                <option value="appliance">Appliance</option>
              </select>
              <input type="number" placeholder="Booking charge (₹)" value={serviceForm.booking_charge}
                onChange={(e) => setServiceForm({ ...serviceForm, booking_charge: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <button onClick={saveService}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90">
              {editingId ? "Update" : "Add"} Service
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
