import { createContext, useContext, useState, ReactNode } from "react";

export interface CartItem {
  id: string;
  type: "laundry" | "addon";
  name: string;
  serviceType?: "wash" | "iron" | "wash_iron";
  unitPrice: number;
  quantity: number;
  laundryFeatureId?: string;
  addonServiceId?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (item: Omit<CartItem, "id">) => {
    // Check if same item+serviceType already in cart
    const existingIdx = items.findIndex(
      (i) =>
        i.type === item.type &&
        i.name === item.name &&
        i.serviceType === item.serviceType &&
        i.laundryFeatureId === item.laundryFeatureId &&
        i.addonServiceId === item.addonServiceId
    );
    if (existingIdx >= 0) {
      setItems((prev) =>
        prev.map((i, idx) =>
          idx === existingIdx ? { ...i, quantity: i.quantity + item.quantity } : i
        )
      );
    } else {
      setItems((prev) => [...prev, { ...item, id: crypto.randomUUID() }]);
    }
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) return removeItem(id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
};
