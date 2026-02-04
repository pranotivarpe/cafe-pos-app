import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Printer,
  Search,
  ChefHat,
  DollarSign,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  RefreshCw,
} from "lucide-react";
import Navbar from "../components/navbar";

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchOrders();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterOrders();
    // eslint-disable-next-line
  }, [orders, selectedStatus, searchTerm]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/orders");
      setOrders(res.data);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (order) => order.status?.toLowerCase() === selectedStatus.toLowerCase(),
      );
    }

    // Filter by search (bill number or table)
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.billNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.table?.number?.toString().includes(searchTerm),
      );
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`/api/orders/${orderId}/status`, {
        status: newStatus.toUpperCase(),
      });
      alert(`✅ Order status updated to ${newStatus.toUpperCase()}`);
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus.toUpperCase() });
      }
    } catch (err) {
      alert("❌ Failed to update order status");
      console.error(err);
    }
  };

  const handlePayment = (order) => {
    setPaymentOrder(order);
    setPaymentMode("cash");
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    setProcessingPayment(true);

    try {
      // Update order status to paid
      await axios.put(`/api/orders/${paymentOrder.id}/status`, {
        status: "paid",
        paymentMode: paymentMode,
      });

      alert(
        `✅ Payment collected successfully!\n\n` +
          `Bill: ${paymentOrder.billNumber}\n` +
          `Amount: ₹${Number(paymentOrder.total).toFixed(2)}\n` +
          `Method: ${paymentMode.toUpperCase()}\n\n` +
          `Table ${paymentOrder.table?.number} is now free.`,
      );

      // Close modal and refresh
      setShowPaymentModal(false);
      setPaymentOrder(null);
      await fetchOrders();

      // Ask to print
      if (window.confirm("Print receipt?")) {
        const updatedOrder = {
          ...paymentOrder,
          paymentMode: paymentMode,
          status: "paid",
          paidAt: new Date().toISOString(),
        };
        printBill(updatedOrder);
      }
    } catch (err) {
      alert("❌ Payment failed: " + err.message);
      console.error(err);
    } finally {
      setProcessingPayment(false);
    }
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const printBill = (order) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Bill #${order.billNumber}</title>
          <style>
            body { font-family: monospace; padding: 20px; max-width: 400px; margin: 0 auto; }
            h1 { text-align: center; margin-bottom: 5px; font-size: 20px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { padding: 8px 4px; text-align: left; }
            th { border-bottom: 1px solid #000; font-weight: bold; }
            .item-row { border-bottom: 1px dashed #ccc; }
            .totals { border-top: 2px solid #000; margin-top: 10px; padding-top: 10px; }
            .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
            .grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #000; margin-top: 5px; padding-top: 5px; }
            .footer { text-align: center; margin-top: 20px; border-top: 2px dashed #000; padding-top: 10px; font-size: 12px; }
            .info { font-size: 12px; margin: 3px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🍽️ CAFE POS PRO</h1>
            <div class="info">123 Restaurant Street, City</div>
            <div class="info">Phone: +91 98765 43210</div>
            <div class="info">GSTIN: 27XXXXX1234X1ZX</div>
          </div>
          
          <div class="info"><strong>Bill No:</strong> ${order.billNumber}</div>
          <div class="info"><strong>Table:</strong> ${order.table?.number}</div>
          <div class="info"><strong>Date:</strong> ${new Date(
            order.createdAt,
          ).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
          })}</div>
          <div class="info"><strong>Payment:</strong> ${
            order.paymentMode?.toUpperCase() || "PENDING"
          }</div>
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items
                ?.map(
                  (item) => `
                <tr class="item-row">
                  <td>${item.menuItem?.name || "Item"}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">₹${Number(item.price).toFixed(
                    2,
                  )}</td>
                  <td style="text-align: right;">₹${(
                    Number(item.price) * item.quantity
                  ).toFixed(2)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          
          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>₹${Number(order.subtotal).toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>GST (5%):</span>
              <span>₹${Number(order.tax).toFixed(2)}</span>
            </div>
            <div class="total-row grand-total">
              <span>TOTAL:</span>
              <span>₹${Number(order.total).toFixed(2)}</span>
            </div>
          </div>
          
          <div class="footer">
            <div>Thank you for dining with us!</div>
            <div>Please visit again 😊</div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Helper to normalize status for comparisons
  const getStatusLower = (status) => String(status || "").toLowerCase();

  const getStatusColor = (status) => {
    switch (getStatusLower(status)) {
      case "paid":
        return "bg-green-100 text-green-700 border-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "preparing":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "served":
        return "bg-purple-100 text-purple-700 border-purple-300";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getStatusIcon = (status) => {
    switch (getStatusLower(status)) {
      case "paid":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "preparing":
        return <ChefHat className="w-4 h-4" />;
      case "served":
        return <CheckCircle className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPaymentIcon = (mode) => {
    switch (mode) {
      case "cash":
        return <Banknote className="w-4 h-4" />;
      case "card":
        return <CreditCard className="w-4 h-4" />;
      case "upi":
        return <Smartphone className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const statusOptions = [
    { value: "all", label: "All Orders", count: orders.length },
    {
      value: "pending",
      label: "Pending",
      count: orders.filter((o) => getStatusLower(o.status) === "pending")
        .length,
    },
    {
      value: "preparing",
      label: "Preparing",
      count: orders.filter((o) => getStatusLower(o.status) === "preparing")
        .length,
    },
    {
      value: "served",
      label: "Served",
      count: orders.filter((o) => getStatusLower(o.status) === "served").length,
    },
    {
      value: "paid",
      label: "Paid",
      count: orders.filter((o) => getStatusLower(o.status) === "paid").length,
    },
    {
      value: "cancelled",
      label: "Cancelled",
      count: orders.filter((o) => getStatusLower(o.status) === "cancelled")
        .length,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Orders Management
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                View and manage all restaurant orders
              </p>
            </div>
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by bill number or table..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-red-300 focus:outline-none text-sm"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center space-x-2 overflow-x-auto">
              {statusOptions.map((status) => (
                <button
                  key={status.value}
                  onClick={() => setSelectedStatus(status.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center space-x-2 ${
                    selectedStatus === status.value
                      ? "bg-red-500 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span>{status.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      selectedStatus === status.value
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {status.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        {loading && filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">No orders found</p>
            <p className="text-gray-400 text-sm mt-1">
              {searchTerm || selectedStatus !== "all"
                ? "Try adjusting your filters"
                : "Orders will appear here"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 hover:shadow-lg hover:border-red-300 transition-all p-6"
              >
                {/* Order Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {order.billNumber}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Table {order.table?.number}
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 flex items-center space-x-1 ${getStatusColor(
                      order.status,
                    )}`}
                  >
                    {getStatusIcon(order.status)}
                    <span className="uppercase">{order.status}</span>
                  </div>
                </div>

                {/* Order Items Summary */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">
                    {order.items?.length || 0} items
                  </p>
                  <div className="space-y-1">
                    {order.items?.slice(0, 3).map((item, idx) => (
                      <p key={idx} className="text-xs text-gray-500 truncate">
                        • {item.menuItem?.name} × {item.quantity}
                      </p>
                    ))}
                    {order.items?.length > 3 && (
                      <p className="text-xs text-gray-400 italic">
                        +{order.items.length - 3} more items
                      </p>
                    )}
                  </div>
                </div>

                {/* Order Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold text-gray-900">
                      ₹{Number(order.subtotal).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Tax (5%):</span>
                    <span className="font-semibold text-gray-900">
                      ₹{Number(order.tax).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-lg font-bold pt-2 border-t border-gray-200">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-red-600">
                      ₹{Number(order.total).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Payment & Time Info */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {order.paymentMode && (
                  <div className="flex items-center space-x-2 mb-4 text-sm">
                    {getPaymentIcon(order.paymentMode)}
                    <span className="text-gray-600">
                      Paid via{" "}
                      <span className="font-semibold uppercase">
                        {order.paymentMode}
                      </span>
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => viewOrderDetails(order)}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => printBill(order)}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print</span>
                  </button>
                </div>

                {/* Status Update Buttons */}
                {getStatusLower(order.status) !== "cancelled" &&
                  getStatusLower(order.status) !== "paid" && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-2 font-medium">
                        Update Status:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {getStatusLower(order.status) === "pending" && (
                          <button
                            onClick={() =>
                              updateOrderStatus(order.id, "preparing")
                            }
                            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors"
                          >
                            🔥 Start Preparing
                          </button>
                        )}

                        {getStatusLower(order.status) === "preparing" && (
                          <button
                            onClick={() =>
                              updateOrderStatus(order.id, "served")
                            }
                            className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-medium transition-colors"
                          >
                            ✅ Mark as Served
                          </button>
                        )}

                        {getStatusLower(order.status) === "served" && (
                          <button
                            onClick={() => handlePayment(order)}
                            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-colors"
                          >
                            💳 Collect Payment
                          </button>
                        )}

                        {order.status !== "paid" && (
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Cancel order ${order.billNumber}?`,
                                )
                              ) {
                                updateOrderStatus(order.id, "cancelled");
                              }
                            }}
                            className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors"
                          >
                            ❌ Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedOrder.billNumber}
                </h2>
                <p className="text-sm text-gray-500">
                  Table {selectedOrder.table?.number} •{" "}
                  {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <XCircle className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Order Items */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Order Items
                </h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {item.menuItem?.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          ₹{Number(item.price).toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        ₹{(Number(item.price) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-gray-50 rounded-xl p-6 space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span className="font-semibold">
                    ₹{Number(selectedOrder.subtotal).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>GST (5%):</span>
                  <span className="font-semibold">
                    ₹{Number(selectedOrder.tax).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t border-gray-300">
                  <span>Total:</span>
                  <span className="text-red-600">
                    ₹{Number(selectedOrder.total).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Info */}
              {selectedOrder.paymentMode && (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center space-x-3">
                    {getPaymentIcon(selectedOrder.paymentMode)}
                    <div>
                      <p className="text-sm text-gray-600">Payment Method</p>
                      <p className="font-semibold text-gray-900 uppercase">
                        {selectedOrder.paymentMode}
                      </p>
                    </div>
                  </div>
                  {selectedOrder.paidAt && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Paid At</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {new Date(selectedOrder.paidAt).toLocaleTimeString()}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => printBill(selectedOrder)}
                  className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <Printer className="w-5 h-5" />
                  <span>Print Bill</span>
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && paymentOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Collect Payment</h2>
                  <p className="text-green-100 text-sm mt-1">
                    Bill #{paymentOrder.billNumber}
                  </p>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Table:</span>
                  <span className="font-semibold text-gray-900">
                    {paymentOrder.table?.number}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Items:</span>
                  <span className="font-semibold text-gray-900">
                    {paymentOrder.items?.length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold text-gray-900">
                    ₹{Number(paymentOrder.subtotal).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">GST (5%):</span>
                  <span className="font-semibold text-gray-900">
                    ₹{Number(paymentOrder.tax).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xl font-bold pt-3 border-t-2 border-gray-200">
                  <span className="text-gray-900">Total Amount:</span>
                  <span className="text-green-600">
                    ₹{Number(paymentOrder.total).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {/* Cash */}
                  <button
                    onClick={() => setPaymentMode("cash")}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center space-y-2 ${
                      paymentMode === "cash"
                        ? "border-green-500 bg-green-50 shadow-md"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <Banknote
                      className={`w-8 h-8 ${
                        paymentMode === "cash"
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    />
                    <span
                      className={`text-sm font-semibold ${
                        paymentMode === "cash"
                          ? "text-green-700"
                          : "text-gray-600"
                      }`}
                    >
                      Cash
                    </span>
                    {paymentMode === "cash" && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </button>

                  {/* Card */}
                  <button
                    onClick={() => setPaymentMode("card")}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center space-y-2 ${
                      paymentMode === "card"
                        ? "border-green-500 bg-green-50 shadow-md"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <CreditCard
                      className={`w-8 h-8 ${
                        paymentMode === "card"
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    />
                    <span
                      className={`text-sm font-semibold ${
                        paymentMode === "card"
                          ? "text-green-700"
                          : "text-gray-600"
                      }`}
                    >
                      Card
                    </span>
                    {paymentMode === "card" && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </button>

                  {/* UPI */}
                  <button
                    onClick={() => setPaymentMode("upi")}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center space-y-2 ${
                      paymentMode === "upi"
                        ? "border-green-500 bg-green-50 shadow-md"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <Smartphone
                      className={`w-8 h-8 ${
                        paymentMode === "upi"
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    />
                    <span
                      className={`text-sm font-semibold ${
                        paymentMode === "upi"
                          ? "text-green-700"
                          : "text-gray-600"
                      }`}
                    >
                      UPI
                    </span>
                    {paymentMode === "upi" && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Payment Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">
                      Payment Gateway Integration
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      {paymentMode === "cash" &&
                        "Collect cash from customer and mark as paid."}
                      {paymentMode === "card" &&
                        "Card payment gateway will be integrated here."}
                      {paymentMode === "upi" &&
                        "UPI payment gateway will be integrated here."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  disabled={processingPayment}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={processPayment}
                  disabled={processingPayment}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {processingPayment ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Confirm Payment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
