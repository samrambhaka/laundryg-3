import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "./CartContext";
import { toast } from "sonner";
import { ShoppingCart, Minus, Plus, Trash2, X } from "lucide-react";

interface CartSheetProps {
  open: boolean;
  onClose: () => void;
}

const CartSheet = ({ open, onClose }: CartSheetProps) => {
  const { items, removeItem, updateQuantity, clearCart, total, itemCount } = useCart();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const serviceLabel = (type?: string) => {
    switch (type) {
      case "wash": return "Wash";
      case "iron": return "Iron";
      case "wash_iron": return "Wash+Iron";
      default: return "";
    }
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: total,
          notes: notes || null,
        })
        .select("id")
        .single();

      if (orderErr) throw orderErr;

      const orderItems = items.map((item) => ({
        order_id: order.id,
        item_type: item.type,
        item_name: item.name,
        service_type: item.serviceType || null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.unitPrice * item.quantity,
        laundry_feature_id: item.laundryFeatureId || null,
        addon_service_id: item.addonServiceId || null,
      }));

      const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
      if (itemsErr) throw itemsErr;

      toast.success("Order placed successfully! We'll contact you shortly.");
      clearCart();
      setNotes("");
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background rounded-t-2xl w-full max-w-lg max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-foreground text-lg">Your Cart</h3>
            <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {itemCount}
            </span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-auto px-5 py-3">
          {items.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Your cart is empty</p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.serviceType && (
                        <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          {serviceLabel(item.serviceType)}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">₹{item.unitPrice} each</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-background border border-border flex items-center justify-center hover:bg-muted"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-background border border-border flex items-center justify-center hover:bg-muted"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-right min-w-[50px]">
                    <p className="font-bold text-sm text-foreground">₹{item.unitPrice * item.quantity}</p>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-destructive/60 hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {items.length > 0 && (
            <textarea
              placeholder="Any special instructions? (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full mt-4 px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none text-sm"
            />
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-muted-foreground font-medium">Total</span>
              <span className="text-xl font-bold text-foreground">₹{total}</span>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? "Placing Order..." : "Place Order"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartSheet;
