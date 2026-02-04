import React, { useState, useEffect, useCallback } from "react";
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
  const { menuItems } = useMenu();

  // Core states
  const [stats, setStats] = useState({
    todaySales: 0,
    todayOrders: 0,
    lowStockCount: 0,
    totalItemsSold: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dashboard-specific states
  const [selectedSection, setSelectedSection] = useState("All Tables");
  const [tables, setTables] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [reservationData, setReservationData] = useState({
    tableId: "",
    customerName: "",
    customerPhone: "",
    reservedFrom: "",
    reservedUntil: "",
  });

  // Sections shown as filter buttons
  const sections = ["All Tables", "Available", "Occupied", "Reserved"];

  // Helper - normalize status strings so frontend and backend case differences don't break logic
  const getStatus = (status) => String(status || "").toLowerCase();

  const getTableColor = (status) => {
    switch (getStatus(status)) {
      case "occupied":
        return "bg-red-50 border-red-200";
      case "reserved":
        return "bg-yellow-50 border-yellow-300";
      case "available":
      default:
        return "bg-white border-gray-200";
    }
  };

  const getStatusBadge = (status) => {
    switch (getStatus(status)) {
      case "occupied":
        return "bg-red-500";
      case "reserved":
        return "bg-yellow-500";
      case "available":
      default:
        return "bg-gray-400";
    }
  };

  // Fetch dashboard data (tables, orders, stats)
  const fetchDashboardData = useCallback(async () => {
    setRefreshing(true);
    try {
      const results = await Promise.allSettled([
        axios.get("/api/reports/stats"),
        axios.get("/api/tables"),
      ]);

      const [statsRes, tablesRes] = results;

      if (tablesRes.status === "fulfilled") {
        setTables(tablesRes.value.data || []);
        console.log("🪑 RAW TABLES API:", tablesRes.value.data);
      } else {
        console.warn("Tables fetch failed:", tablesRes.reason);
        setTables([]);
      }

      if (statsRes.status === "fulfilled") {
        const statsData = statsRes.value.data || {};
        setStats(statsData);
        // Use recentOrders from the stats response
        setRecentOrders((statsData.recentOrders || []).slice(0, 5));
        console.log("📊 STATS API:", statsData);
      } else {
        console.warn("Stats fetch failed:", statsRes.reason);
        setStats({
          todaySales: 0,
          todayOrders: 0,
          lowStockCount: 0,
          totalItemsSold: 0,
        });
        setRecentOrders([]);
      }
    } catch (err) {
      console.error("Unexpected error fetching dashboard data:", err);
      setTables([]);
      setRecentOrders([]);
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
    const handleOrderUpdated = () => {
      fetchDashboardData();
    };

    window.addEventListener("order-updated", handleOrderUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener("order-updated", handleOrderUpdated);
    };
  }, [fetchDashboardData]);

  // Filter tables according to selectedSection
  const filteredTables = tables.filter((t) => {
    const s = selectedSection;
    if (!t) return false;
    const status = getStatus(t.status);
    if (s === "All Tables") return true;
    if (s === "Available") return status === "available";
    if (s === "Occupied") return status === "occupied";
    if (s === "Reserved") return status === "reserved";
    return true;
  });

  // Quick action: clear table (mark as available)
  const requestClearTable = async (tableId) => {
    try {
      await axios.put(`/api/orders/tables/${tableId}/status`, {
        status: "AVAILABLE",
      });
      fetchDashboardData();
    } catch (err) {
      console.error("Failed to clear table:", err);
    }
  };

  // Create reservation
  const createReservation = async (e) => {
    e.preventDefault();

    const {
      tableId,
      customerName,
      reservedFrom,
      reservedUntil,
    } = reservationData;
    if (!tableId || !customerName || !reservedFrom || !reservedUntil) {
      alert(
        "Please fill table, customer name, start and end times for the reservation.",
      );
      return;
    }

    const from = new Date(reservedFrom);
    const to = new Date(reservedUntil);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      alert("Invalid reservation dates.");
      return;
    }
    if (from >= to) {
      alert("Reservation start must be earlier than end.");
      return;
    }

    try {
      await axios.post("/api/tables/reserve", {
        tableId,
        customerName,
        customerPhone: reservationData.customerPhone,
        reservedFrom,
        reservedUntil,
      });

      setReservationData({
        tableId: "",
        customerName: "",
        customerPhone: "",
        reservedFrom: "",
        reservedUntil: "",
      });
      setShowReservationForm(false);
      fetchDashboardData();
      alert("✅ Reservation created successfully!");
    } catch (err) {
      console.error("Reservation error:", err);
      alert("❌ Failed to create reservation");
    }
  };

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

  // Table occupancy percentage
  const totalTables = tables.length || 1;
  const occupiedCount = tables.filter((t) => getStatus(t.status) === "occupied")
    .length;
  const occupancyPct = Math.round((occupiedCount / totalTables) * 100);

  // Format time remaining for reservation
  const getTimeRemaining = (reservedUntil) => {
    if (!reservedUntil) return null;

    const now = new Date();
    const until = new Date(reservedUntil);
    const diff = until.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m left`;
    }
    return `${minutes}m left`;
  };

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
                  {occupiedCount}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 group hover:shadow-md transition-all p-3 rounded-xl">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.lowStockCount || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
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

                  {getStatus(table.status) === "occupied" && (
                    <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                      <p className="text-xs font-bold text-red-600">
                        ₹{table.currentBill || 0}
                      </p>
                      <p className="text-xs text-gray-500">{table.orderTime}</p>
                    </div>
                  )}

                  {getStatus(table.status) === "reserved" && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-yellow-700">
                        {table.customerName}
                      </p>
                      <p className="text-xs text-yellow-600">
                        {getTimeRemaining(table.reservedUntil)}
                      </p>
                      {table.reservationStatus === "expiring_soon" && (
                        <p className="text-xs text-orange-600 font-semibold animate-pulse">
                          ⚠️ Expiring soon!
                        </p>
                      )}
                      {table.reservationStatus === "expired" && (
                        <p className="text-xs text-red-600 font-semibold">
                          ❌ Expired
                        </p>
                      )}
                    </div>
                  )}

                  {getStatus(table.status) === "available" && (
                    <p className="text-xs text-gray-400 mt-1">Empty</p>
                  )}
                </div>

                {getStatus(table.status) === "occupied" && (
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

        {/* Sidebar */}
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
                        {order.billNumber || order.id}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full font-medium text-white bg-green-500">
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Table {order.table?.number || order.tableId} •{" "}
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-sm text-gray-500">
                  No recent orders
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
                <span className="text-sm text-gray-600">Total Items Sold</span>
                <span className="text-lg font-bold text-gray-900">
                  {stats.totalItemsSold || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Table Occupancy</span>
                <span className="text-lg font-bold text-blue-600">
                  {occupancyPct}%
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowReservationForm(true)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold"
              >
                <Plus className="w-4 h-4" />
                <span>New Reservation</span>
              </button>
            </div>
          </div>

          {/* Reservation modal */}
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

                <form onSubmit={createReservation}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Table ID
                      </label>
                      <input
                        value={reservationData.tableId}
                        onChange={(e) =>
                          setReservationData({
                            ...reservationData,
                            tableId: e.target.value,
                          })
                        }
                        className="w-full p-3 border border-gray-200 rounded-xl"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer Name
                      </label>
                      <input
                        value={reservationData.customerName}
                        onChange={(e) =>
                          setReservationData({
                            ...reservationData,
                            customerName: e.target.value,
                          })
                        }
                        className="w-full p-3 border border-gray-200 rounded-xl"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer Phone
                      </label>
                      <input
                        value={reservationData.customerPhone}
                        onChange={(e) =>
                          setReservationData({
                            ...reservationData,
                            customerPhone: e.target.value,
                          })
                        }
                        className="w-full p-3 border border-gray-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reserved From
                      </label>
                      <input
                        type="datetime-local"
                        value={reservationData.reservedFrom}
                        onChange={(e) =>
                          setReservationData({
                            ...reservationData,
                            reservedFrom: e.target.value,
                          })
                        }
                        className="w-full p-3 border border-gray-200 rounded-xl"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reserved Until
                      </label>
                      <input
                        type="datetime-local"
                        value={reservationData.reservedUntil}
                        onChange={(e) =>
                          setReservationData({
                            ...reservationData,
                            reservedUntil: e.target.value,
                          })
                        }
                        className="w-full p-3 border border-gray-200 rounded-xl"
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
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
