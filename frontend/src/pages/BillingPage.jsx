import axios from "axios";
import React, { useState, useEffect } from "react";
import { useMenu } from "../context/MenuContext";
import { useAuth } from "../context/AuthContext";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Search,
  X,
  Check,
  AlertCircle,
  CreditCard,
  Banknote,
  Smartphone,
  ChefHat,
} from "lucide-react";
import Navbar from "../components/navbar";

const BillingPage = () => {
  const { menuItems } = useMenu();
  const { user } = useAuth();
  const [tables, setTables] = useState([]);
  const [cart, setCart] = useState([]);
  const [tableId, setTableId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(false);

  // Fetch tables on mount
  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const res = await axios.get("/api/orders/tables");
      setTables(res.data);
      // Auto-select first available table
      const firstAvailable = res.data.find((t) => t.status === "available");
      if (firstAvailable) {
        setTableId(firstAvailable.id);
      }
    } catch (err) {
      console.error("Failed to fetch tables:", err);
    }
  };

  const addToCart = (item) => {
    // Check if item is in stock
    if (!item.inventory || item.inventory.quantity <= 0) {
      alert(`❌ ${item.name} is out of stock!`);
      return;
    }

    const existing = cart.find((c) => c.id === item.id);

    if (existing) {
      // Check if adding one more exceeds stock
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

    // Check stock before updating
    const item = menuItems.find((m) => m.id === itemId);
    if (item && item.inventory && qty > item.inventory.quantity) {
      alert(`❌ Only ${item.inventory.quantity} ${item.name} available!`);
      return;
    }

    setCart(cart.map((c) => (c.id === itemId ? { ...c, quantity: qty } : c)));
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter((c) => c.id !== itemId));
  };

  const clearCart = () => {
    if (window.confirm("Clear entire cart?")) {
      setCart([]);
    }
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

    if (
      !window.confirm(
        `Place order for Table ${
          tables.find((t) => t.id === tableId)?.number
        }?\n\n` +
          `Items: ${cart.length}\n` +
          `Total: ₹${total.toFixed(2)}\n\n` +
          `Order will be sent to kitchen.`,
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const orderItems = cart.map((item) => ({
        menuItemId: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      // Create order - starts as PENDING
      const res = await axios.post("/api/orders", {
        tableId,
        orderItems,
      });

      // Immediately move to PREPARING (kitchen receives order)
      await axios.put(`/api/orders/${res.data.order.id}/status`, {
        status: "preparing",
      });

      alert(
        `✅ Order ${res.data.billNumber} sent to kitchen!\n\n` +
          `📋 Table: ${tables.find((t) => t.id === tableId)?.number}\n` +
          `🍽️ Items: ${cart.length}\n` +
          `💰 Amount: ₹${total.toFixed(2)}\n\n` +
          `🔔 Status: PREPARING\n\n` +
          `Track order progress in Orders page.\n` +
          `Payment will be collected after serving.`,
      );

      // Clear cart and refresh
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
  const tax = subtotal * 0.05; // 5% GST
  const total = subtotal + tax;

  // Filter menu items
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
                  value={tableId || ""}
                  onChange={(e) => setTableId(parseInt(e.target.value))}
                  className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-medium focus:border-red-300 focus:outline-none bg-white hover:border-gray-300 transition-colors"
                >
                  <option value="">Select Table</option>
                  {tables.map((table) => (
                    <option key={table.id} value={table.id}>
                      Table {table.number} - {table.status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

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
                      {item.inventory?.quantity || 0}
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
                    ? `Table ${tables.find((t) => t.id === tableId)?.number}`
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
                  {/* Totals */}
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

                  {/* Place Order Button */}
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
