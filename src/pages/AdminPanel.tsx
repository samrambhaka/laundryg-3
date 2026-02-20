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
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);

  // Expanded panchayath (to show wards)
  const [expandedPanchayathId, setExpandedPanchayathId] = useState<string | null>(null);

  // Forms
  const [panchayathName, setPanchayathName] = useState("");
  const [panchayathWardCount, setPanchayathWardCount] = useState("");
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
    const wardCount = parseInt(panchayathWardCount) || 0;

    if (editingId) {
      await supabase.from("panchayaths").update({ name: panchayathName.trim() }).eq("id", editingId);
      toast.success("Panchayath updated");
    } else {
      const { data: newPanchayath, error } = await supabase
        .from("panchayaths")
        .insert({ name: panchayathName.trim() })
        .select()
        .single();
      if (error || !newPanchayath) {
        toast.error("Failed to add panchayath");
        return;
      }
      // Auto-create wards 1 to wardCount
      if (wardCount > 0) {
        const wardInserts = Array.from({ length: wardCount }, (_, i) => ({
          name: `Ward ${i + 1}`,
          panchayath_id: newPanchayath.id,
        }));
        await supabase.from("wards").insert(wardInserts);
      }
      toast.success(`Panchayath added${wardCount > 0 ? ` with ${wardCount} wards` : ""}`);
    }
    setPanchayathName(""); setPanchayathWardCount(""); setEditingId(null); setShowPanchayathModal(false);
    fetchData();
  };

  const deletePanchayath = async (id: string) => {
    // Delete wards first, then panchayath
    await supabase.from("wards").delete().eq("panchayath_id", id);
    await supabase.from("panchayaths").delete().eq("id", id);
    toast.success("Panchayath deleted");
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
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> Panchayaths & Wards
              </h3>
              <button
                onClick={() => { setEditingId(null); setPanchayathName(""); setPanchayathWardCount(""); setShowPanchayathModal(true); }}
                className="flex items-center gap-1 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90"
              >
                <Plus className="w-4 h-4" /> Add Panchayath
              </button>
            </div>

            {panchayaths.length === 0 && (
              <p className="text-muted-foreground text-center py-8">No panchayaths added yet</p>
            )}

            <div className="space-y-3">
              {panchayaths.map((p) => {
                const pWards = wards.filter(w => w.panchayath_id === p.id);
                const isExpanded = expandedPanchayathId === p.id;
                return (
                  <div key={p.id} className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="px-4 py-3 flex items-center justify-between">
                      <button
                        className="flex items-center gap-3 flex-1 text-left"
                        onClick={() => setExpandedPanchayathId(isExpanded ? null : p.id)}
                      >
                        <div>
                          <span className="font-medium text-foreground">{p.name}</span>
                          <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {pWards.length} ward{pWards.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <ChevronLeft className={`w-4 h-4 text-muted-foreground ml-auto transition-transform ${isExpanded ? "-rotate-90" : "rotate-180"}`} />
                      </button>
                      <div className="flex gap-2 ml-3">
                        <button onClick={() => { setEditingId(p.id); setPanchayathName(p.name); setPanchayathWardCount(""); setShowPanchayathModal(true); }}
                          className="text-muted-foreground hover:text-primary transition-colors"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => deletePanchayath(p.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-border bg-muted/30 px-4 py-3">
                        {pWards.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No wards</p>
                        ) : (
                          <div className="grid grid-cols-3 gap-1.5">
                            {pWards.map((w) => (
                              <div key={w.id} className="flex items-center justify-between bg-background border border-border rounded-lg px-2 py-1.5">
                                <span className="text-xs text-foreground">{w.name}</span>
                                <button onClick={async () => {
                                  await supabase.from("wards").delete().eq("id", w.id);
                                  toast.success("Ward deleted");
                                  fetchData();
                                }} className="text-muted-foreground hover:text-destructive ml-1"><Trash2 className="w-3 h-3" /></button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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
            <div className="space-y-3 mb-4">
              <input
                type="text" placeholder="Panchayath name" value={panchayathName}
                onChange={(e) => setPanchayathName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {!editingId && (
                <div>
                  <input
                    type="number" placeholder="Number of wards (e.g. 25)" value={panchayathWardCount}
                    onChange={(e) => setPanchayathWardCount(e.target.value)}
                    min="0" max="200"
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {panchayathWardCount && parseInt(panchayathWardCount) > 0 && (
                    <p className="text-xs text-muted-foreground mt-1.5 ml-1">
                      Will auto-create Ward 1 to Ward {panchayathWardCount}
                    </p>
                  )}
                </div>
              )}
            </div>
            <button onClick={savePanchayath}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90">
              {editingId ? "Update" : "Add"} Panchayath
            </button>
          </div>
        </div>
      )}



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
