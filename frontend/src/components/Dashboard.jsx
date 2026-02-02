import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useMenu } from "../context/MenuContext";
import {
  DollarSign,
  ShoppingCart,
  Users,
  AlertTriangle,
  Clock,
  Eye,
  RefreshCw,
  Plus,
  CheckCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/navbar";

const Dashboard = () => {
  const { user: _user } = useAuth(); // Prefixed to avoid unused warning
  const { menuItems } = useMenu();
  const [stats, setStats] = useState({
    todaySales: 0,
    todayOrders: 0,
    lowStockCount: 0,
    totalItemsSold: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSection, setSelectedSection] = useState("All Tables");
  const [tables, setTables] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [reservationData, setReservationData] = useState({
    tableId: "",
    customerName: "",
    customerPhone: "",
    reservedUntil: "",
  });
  const [showClearConfirm, setShowClearConfirm] = useState(null);

  const sections = ["All Tables"];

  //  fetchDashboardData function:
  const fetchDashboardData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [statsRes, tablesRes, ordersRes] = await Promise.all([
        axios.get("/api/reports/stats"),
        axios.get("/api/tables"), // ← REAL DATABASE TABLES
        axios.get("/api/reports/recent-orders?limit=5"),
      ]);

      console.log("🪑 RAW TABLES API:", tablesRes.data);
      console.log("📊 STATS API:", statsRes.data);

      // ✅ ONLY REAL DATA - NO FALLBACK
      setStats(statsRes.data);
      setTables(tablesRes.data || []); // Empty array if no tables
      setRecentOrders(ordersRes.data.slice(0, 5) || []);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setTables([]); // ✅ EMPTY - no fake data
      setStats({
        todaySales: 0,
        todayOrders: 0,
        lowStockCount: 0,
        totalItemsSold: 0,
      });
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  // Auto-refresh
  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]); // Fixed dependency array

  // Create reservation
  const createReservation = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/tables/reserve", reservationData);
      setReservationData({
        tableId: "",
        customerName: "",
        customerPhone: "",
        reservedUntil: "",
      });
      setShowReservationForm(false);
      fetchDashboardData();
      alert("✅ Reservation created successfully!");
    } catch (err) {
      alert("❌ Failed to create reservation");
    }
  };

  // Clear table with custom confirmation (NO confirm())
  const requestClearTable = (tableId) => {
    setShowClearConfirm(tableId);
  };

  const confirmClearTable = async () => {
    if (showClearConfirm) {
      try {
        await axios.patch(`/api/tables/${showClearConfirm}/status`, {
          status: "available",
        });
        fetchDashboardData();
      } catch (err) {
        alert("❌ Failed to update table");
      }
    }
    setShowClearConfirm(null);
  };

  const getTableColor = (status) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case "available":
      case "AVAILABLE":
        return "bg-white border-gray-200";
      case "occupied":
      case "OCCUPIED":
        return "bg-red-50 border-red-300";
      case "reserved":
      case "RESERVED":
        return "bg-yellow-50 border-yellow-300";
      default:
        return "bg-white border-gray-200";
    }
  };

  const getStatusBadge = (status) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case "occupied":
      case "OCCUPIED":
        return "bg-red-500";
      case "reserved":
      case "RESERVED":
        return "bg-yellow-500";
      case "available":
      case "AVAILABLE":
      default:
        return "bg-gray-400";
    }
  };

  const filteredTables = tables;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 py-5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Dashboard Overview
            </h2>
            <button
              onClick={fetchDashboardData}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              <span>{refreshing ? "Updating..." : "Refresh"}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center space-x-3 group hover:shadow-md transition-all p-3 rounded-xl">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-red-200 transition-colors">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">
                  Today's Sales
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{Number(stats.todaySales || 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 group hover:shadow-md transition-all p-3 rounded-xl">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">
                  Today's Orders
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.todayOrders || 0}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 group hover:shadow-md transition-all p-3 rounded-xl">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">
                  Active Tables
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {tables.filter((t) => t.status === "occupied").length}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 group hover:shadow-md transition-all p-3 rounded-xl">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  stats.lowStockCount > 0
                    ? "bg-orange-100 group-hover:bg-orange-200"
                    : "bg-green-100 group-hover:bg-green-200"
                }`}
              >
                <AlertTriangle
                  className={`w-6 h-6 transition-colors ${
                    stats.lowStockCount > 0
                      ? "text-orange-600"
                      : "text-green-600"
                  }`}
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Low Stock</p>
                <p
                  className={`text-2xl font-bold transition-colors ${
                    stats.lowStockCount > 0
                      ? "text-orange-600"
                      : "text-green-600"
                  }`}
                >
                  {stats.lowStockCount || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Table Grid */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {sections.map((section) => (
                  <button
                    key={section}
                    onClick={() => setSelectedSection(section)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      selectedSection === section
                        ? "bg-red-500 text-white shadow-md"
                        : "bg-white text-gray-700 border border-gray-200 hover:border-red-300"
                    }`}
                  >
                    {section}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-white border-2 border-gray-300 rounded"></div>
                  <span className="text-gray-600">Available</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-100 border-2 border-red-400 rounded"></div>
                  <span className="text-gray-600">Occupied</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-100 border-2 border-yellow-400 rounded"></div>
                  <span className="text-gray-600">Reserved</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {filteredTables.map((table) => (
                <Link
                  key={table.id}
                  to={`/billing?table=${table.id}`}
                  className={`group relative ${getTableColor(
                    table.status,
                  )} border-2 rounded-2xl p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
                >
                  <div className="text-center">
                    <div
                      className={`w-14 h-14 mx-auto mb-2 rounded-xl flex items-center justify-center shadow-md transition-all duration-300 group-hover:scale-110 ${getStatusBadge(
                        table.status,
                      )} text-white`}
                    >
                      <span className="text-base font-bold">{table.id}</span>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm mb-1">
                      {table.name}
                    </p>

                    {table.status === "occupied" && (
                      <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                        <p className="text-xs font-bold text-red-600">
                          ₹{table.currentBill || 0}
                        </p>
                        <p className="text-xs text-gray-500">
                          {table.orderTime}
                        </p>
                      </div>
                    )}

                    {table.status === "reserved" && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-yellow-700">
                          {table.customerName}
                        </p>
                        <p className="text-xs text-yellow-600">
                          Until {table.reservedUntil}
                        </p>
                      </div>
                    )}

                    {table.status === "available" && (
                      <p className="text-xs text-gray-400 mt-1">Empty</p>
                    )}
                  </div>

                  {table.status === "occupied" && (
                    <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          requestClearTable(table.id);
                        }}
                        className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-md"
                        title="Payment Done - Clear Table"
                      >
                        <CheckCircle className="w-3 h-3" />
                      </button>
                      <div className="p-1 bg-white rounded-lg shadow-md hover:bg-gray-50">
                        <Eye className="w-3 h-3 text-gray-600" />
                      </div>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar - Recent Orders + Quick Stats + Reservation Form */}
          <div className="lg:col-span-1 space-y-6">
            {/* Recent Orders */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-red-500" />
                Recent Orders
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-900">
                          {order.id}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            order.status === "preparing"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">
                        {order.table}
                      </p>
                      <p className="text-xs text-gray-500 mb-2 line-clamp-1">
                        {order.items}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-red-600">
                          ₹{order.amount}
                        </span>
                        <span className="text-xs text-gray-400">
                          {order.time}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No recent orders</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Quick Stats
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Menu Items</span>
                  <span className="text-lg font-bold text-gray-900">
                    {menuItems.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Total Items Sold
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    {stats.totalItemsSold || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Table Occupancy</span>
                  <span className="text-lg font-bold text-blue-600">
                    {Math.round(
                      (tables.filter((t) => t.status === "occupied").length /
                        tables.length) *
                        100,
                    )}
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* NEW RESERVATION BUTTON */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
              <button
                onClick={() => setShowReservationForm(true)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                <span>New Reservation</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Clear Table Confirmation */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Clear Table?
              </h3>
              <p className="text-gray-600">
                Mark Table {showClearConfirm} as available (Payment completed)
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={confirmClearTable}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-4 rounded-xl font-semibold transition-all shadow-md"
              >
                Yes, Clear Table
              </button>
              <button
                onClick={() => setShowClearConfirm(null)}
                className="flex-1 py-3 px-4 text-gray-700 font-semibold rounded-xl border border-gray-200 hover:border-gray-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reservation Modal */}
      {showReservationForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                New Reservation
              </h3>
              <button
                onClick={() => setShowReservationForm(false)}
                className="text-gray-400 hover:text-gray-600 p-1 -m-1 rounded-lg hover:bg-gray-100"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <form onSubmit={createReservation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Table
                </label>
                <select
                  value={reservationData.tableId}
                  onChange={(e) =>
                    setReservationData({
                      ...reservationData,
                      tableId: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                >
                  <option value="">Select available table</option>
                  {tables
                    .filter((t) => t.status === "available")
                    .map((table) => (
                      <option key={table.id} value={table.id}>
                        Table {table.id}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={reservationData.customerName}
                  onChange={(e) =>
                    setReservationData({
                      ...reservationData,
                      customerName: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={reservationData.customerPhone}
                  onChange={(e) =>
                    setReservationData({
                      ...reservationData,
                      customerPhone: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="9876543210"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Until
                </label>
                <input
                  type="time"
                  value={reservationData.reservedUntil}
                  onChange={(e) =>
                    setReservationData({
                      ...reservationData,
                      reservedUntil: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-xl font-semibold transition-all shadow-md"
                >
                  Create Reservation
                </button>
                <button
                  type="button"
                  onClick={() => setShowReservationForm(false)}
                  className="px-6 py-3 text-gray-600 hover:text-gray-900 font-semibold rounded-xl border border-gray-200 hover:border-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
