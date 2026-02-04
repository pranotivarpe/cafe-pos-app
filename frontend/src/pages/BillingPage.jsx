import axios from "axios";
import React, { useState, useEffect, useCallback } from "react";
import { useMenu } from "../context/MenuContext";
// Remove or comment out useAuth if user is not used
// import { useAuth } from "../context/AuthContext";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Search,
  X,
  ChefHat,
} from "lucide-react";
import Navbar from "../components/navbar";

const BillingPage = () => {
  const { menuItems } = useMenu();
  // Remove this line since user is not used:
  // const { user } = useAuth();
  const [tables, setTables] = useState([]);
  const [cart, setCart] = useState([]);
  const [tableId, setTableId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(false);

  // normalize status for comparisons
  const getStatus = (s) => String(s || "").toLowerCase();

  // Safe label for a table
  const getTableLabel = (t) => {
    if (!t) return "";
    if (typeof t.number !== "undefined" && t.number !== null) return t.number;
    if (typeof t.name === "string" && t.name.trim() !== "") return t.name;
    if (typeof t.tableNumber !== "undefined" && t.tableNumber !== null)
      return t.tableNumber;
    if (typeof t.label === "string" && t.label.trim() !== "") return t.label;
    return `#${t.id}`;
  };

  // Wrap fetchTables in useCallback
  const fetchTables = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        axios.get("/api/orders/tables"),
        axios.get("/api/tables"),
      ]);
      let chosen = null;
      for (const r of results) {
        if (r.status === "fulfilled" && Array.isArray(r.value.data)) {
          chosen = r.value.data;
          break;
        }
      }
      const raw =
        chosen ||
        results.find((r) => r.status === "fulfilled")?.value?.data ||
        [];
      const normalized = (Array.isArray(raw) ? raw : []).map((t) => ({
        ...t,
        id: typeof t.id === "number" ? t.id : parseInt(t.id, 10),
        status: t.status ?? t.Status ?? t.STATUS ?? "",
      }));
      setTables(normalized);
      const firstAvailable = normalized.find(
        (t) => getStatus(t.status) === "available",
      );
      setTableId(firstAvailable ? Number(firstAvailable.id) : null);
    } catch (err) {
      console.error("Failed to fetch tables:", err);
      setTables([]);
      setTableId(null);
    }
  }, []);

  // Fetch tables on mount
  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 30000);
    const handleOrderUpdated = () => {
      fetchTables();
    };
    window.addEventListener("order-updated", handleOrderUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener("order-updated", handleOrderUpdated);
    };
  }, [fetchTables]);

  // ...rest of the component remains the same

  const addToCart = (item) => {
    if (!item.inventory || item.inventory.quantity <= 0) {
      alert(`❌ ${item.name} is out of stock!`);
      return;
    }

    const existing = cart.find((c) => c.id === item.id);

    if (existing) {
      if (existing.quantity + 1 > item.inventory.quantity) {
        alert(
          `❌ Only ${item.inventory.quantity} ${item.name} available in stock!`,
        );
        return;
      }
      setCart(
        cart.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c,
        ),
      );
    } else {
      setCart([
        ...cart,
        { ...item, quantity: 1, price: parseFloat(item.price) },
      ]);
    }
  };

  const updateQuantity = (itemId, qty) => {
    if (qty <= 0) {
      setCart(cart.filter((c) => c.id !== itemId));
      return;
    }
    const item = menuItems.find((m) => m.id === itemId);
    if (item && item.inventory && qty > item.inventory.quantity) {
      alert(`❌ Only ${item.inventory.quantity} ${item.name} available!`);
      return;
    }
    setCart(cart.map((c) => (c.id === itemId ? { ...c, quantity: qty } : c)));
  };

  const removeFromCart = (itemId) =>
    setCart(cart.filter((c) => c.id !== itemId));

  const clearCart = () => {
    if (window.confirm("Clear entire cart?")) setCart([]);
  };

  const placeOrder = async () => {
    if (cart.length === 0) {
      alert("❌ Cart is empty!");
      return;
    }
    if (!tableId) {
      alert("❌ Please select a table!");
      return;
    }
    const table = tables.find((t) => t.id === tableId);
    if (!table) {
      alert("Invalid table selected");
      return;
    }

    if (getStatus(table.status) === "reserved") {
      const from = table.reservedFrom ? new Date(table.reservedFrom) : null;
      const to = table.reservedUntil ? new Date(table.reservedUntil) : null;
      const now = new Date();
      if (from && to) {
        if (now < from || now > to) {
          alert(
            `❌ Table ${getTableLabel(
              table,
            )} is reserved from ${from.toLocaleString()} to ${to.toLocaleString()}. Orders can be placed only during the reserved window.`,
          );
          return;
        }
      } else {
        // If reserved but no window available, block placing orders to be safe
        alert(
          `❌ Table ${getTableLabel(
            table,
          )} is reserved. You can only place orders during the reservation window.`,
        );
        return;
      }
    }

    setLoading(true);
    try {
      const orderItems = cart.map((item) => ({
        menuItemId: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      const res = await axios.post("/api/orders", { tableId, orderItems });
      const createdOrder = res.data?.order || res.data;
      const billNumber = res.data?.billNumber ?? createdOrder?.billNumber;

      if (!createdOrder || !createdOrder.id) {
        throw new Error("Invalid order response");
      }

      // Move to preparing
      await axios.put(`/api/orders/${createdOrder.id}/status`, {
        status: "preparing",
      });

      alert(
        `✅ Order ${billNumber} sent to kitchen for Table ${getTableLabel(
          table,
        )}`,
      );

      setCart([]);
      fetchTables();
    } catch (err) {
      alert("❌ Order failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const categories = [
    "All",
    ...new Set(menuItems.map((item) => item.category?.name).filter(Boolean)),
  ];
  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || item.category?.name === selectedCategory;
    const isActive = item.isActive !== false;
    return matchesSearch && matchesCategory && isActive;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Billing Header */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">POS Billing</h1>
              <p className="text-sm text-gray-500 mt-1">
                Create and manage orders
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">
                  Table:
                </label>
                <select
                  value={tableId ?? ""}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setTableId(Number.isFinite(val) ? val : null);
                  }}
                  className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-medium focus:border-red-300 focus:outline-none bg-white hover:border-gray-300 transition-colors"
                >
                  <option value="">Select Table</option>
                  {tables.length === 0 && (
                    <option disabled>— No tables available —</option>
                  )}
                  {tables.map((table) => (
                    <option key={table.id} value={table.id}>
                      Table {getTableLabel(table)} -{" "}
                      {String(table.status ?? "").toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={fetchTables}
                className="px-3 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ... rest of UI is unchanged (menu grid + cart) ... */}

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search & Filter */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search menu items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-red-300 focus:outline-none text-sm"
                  />
                </div>
                <div className="flex items-center space-x-2 overflow-x-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                        selectedCategory === cat
                          ? "bg-red-500 text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-4 hover:shadow-lg hover:border-red-300 transition-all cursor-pointer group relative"
                >
                  <div className="aspect-square bg-gray-100 rounded-xl mb-3 flex items-center justify-center group-hover:bg-red-50 transition-colors">
                    <span className="text-4xl">🍽️</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                    {item.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">
                    {item.category?.name}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-red-600">
                      ₹{item.price}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        item.inventory?.quantity === 0
                          ? "bg-red-100 text-red-700"
                          : item.inventory?.lowStock
                          ? "bg-orange-100 text-orange-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {item.inventory?.quantity ?? 0}
                    </span>
                  </div>
                  {item.inventory?.quantity === 0 && (
                    <div className="absolute inset-0 bg-gray-900/50 rounded-2xl flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        OUT OF STOCK
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
                <p className="text-gray-500">No items found</p>
              </div>
            )}
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 sticky top-24">
              {/* Cart Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <ShoppingCart className="w-5 h-5 mr-2 text-red-500" />
                    Current Order
                  </h2>
                  {cart.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center space-x-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {tableId
                    ? `Table ${getTableLabel(
                        tables.find((t) => t.id === tableId),
                      )}`
                    : "No table selected"}{" "}
                  • {cart.length} items
                </p>
              </div>

              {/* Cart Items */}
              <div className="p-6 max-h-96 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">Cart is empty</p>
                    <p className="text-gray-400 text-xs mt-1">
                      Add items from menu
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            ₹{item.price} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3 ml-3">
                          <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-200">
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-l-lg transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center text-sm font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-r-lg transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="font-bold text-gray-900 w-16 text-right">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </p>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="p-6 border-t border-gray-200 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Subtotal</span>
                      <span className="font-medium">
                        ₹{subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>GST (5%)</span>
                      <span className="font-medium">₹{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                      <span>Total</span>
                      <span className="text-red-600">₹{total.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={placeOrder}
                    disabled={!tableId || loading}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all"
                  >
                    <ChefHat className="w-5 h-5" />
                    <span>
                      {loading ? "Sending to Kitchen..." : "Send to Kitchen"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
