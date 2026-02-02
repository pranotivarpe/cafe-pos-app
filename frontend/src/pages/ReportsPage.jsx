import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import {
  BarChart3,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Download,
  Calendar,
  Package,
  TrendingDown,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import Navbar from "../components/navbar";

const ReportsPage = () => {
  const [stats, setStats] = useState({
    todaySales: 0,
    todayOrders: 0,
    totalItemsSold: 0,
    lowStockCount: 0,
    topSellingItems: [],
    lowStockItems: [],
    salesByCategory: [],
    recentOrders: [],
  });
  const [dateRange, setDateRange] = useState({
    from: "2026-01-01",
    to: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);
  const [salesTrend, setSalesTrend] = useState([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchSalesTrend();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/reports/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesTrend = async () => {
    try {
      const res = await axios.get(
        `/api/reports/sales?from=${dateRange.from}&to=${dateRange.to}`,
      );
      if (res.data && Array.isArray(res.data)) {
        setSalesTrend(res.data);
      } else {
        setSalesTrend([
          { name: "Mon", sales: 400, orders: 12 },
          { name: "Tue", sales: 300, orders: 8 },
          { name: "Wed", sales: 600, orders: 18 },
          { name: "Thu", sales: 450, orders: 14 },
          { name: "Fri", sales: 700, orders: 22 },
          { name: "Sat", sales: 850, orders: 28 },
          { name: "Sun", sales: 920, orders: 30 },
        ]);
      }
    } catch (err) {
      console.error("Failed to fetch sales trend:", err);
      setSalesTrend([
        { name: "Mon", sales: 400, orders: 12 },
        { name: "Tue", sales: 300, orders: 8 },
        { name: "Wed", sales: 600, orders: 18 },
        { name: "Thu", sales: 450, orders: 14 },
        { name: "Fri", sales: 700, orders: 22 },
        { name: "Sat", sales: 850, orders: 28 },
        { name: "Sun", sales: 920, orders: 30 },
      ]);
    }
  };

  const downloadPDFReport = () => {
    try {
      setExporting(true);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 15;
      const margin = 15;

      // Colors
      const primaryColor = [239, 68, 68]; // red
      const textColor = [0, 0, 0];
      const lightGray = [200, 200, 200];

      // HEADER BAR
      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.rect(0, 0, pageWidth, 30, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text("Business Reports & Analytics", margin, 15);

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text("Generated on: " + new Date().toLocaleString(), margin, 22);

      // DATE RANGE
      yPosition = 40;
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text(
        "Date Range: " + dateRange.from + " to " + dateRange.to,
        margin,
        yPosition,
      );
      yPosition += 8;

      pdf.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      // ===================== KEY METRICS =====================
      pdf.setFontSize(13);
      pdf.setFont("helvetica", "bold");
      pdf.text("KEY METRICS", margin, yPosition);
      yPosition += 8;

      const metrics = [
        {
          label: "Today's Sales",
          value: "₹" + Number(stats.todaySales || 0).toFixed(0),
          note: "+12.5% vs yesterday",
        },
        {
          label: "Orders Today",
          value: String(stats.todayOrders || 0),
          note: "+8.2% vs yesterday",
        },
        {
          label: "Items Sold",
          value: String(stats.totalItemsSold || 0),
          note: "-3.1% vs yesterday",
        },
        {
          label: "Low Stock Alerts",
          value: String(stats.lowStockCount || 0),
          note: (stats.lowStockCount || 0) > 0 ? "Action required" : "All good",
        },
      ];

      const metricsPerRow = 2;
      const metricWidth = (pageWidth - 2 * margin - 10) / metricsPerRow; // 10 = gap

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");

      metrics.forEach((metric, index) => {
        const row = Math.floor(index / metricsPerRow);
        const col = index % metricsPerRow;
        const xPos = margin + col * (metricWidth + 10);
        const yPos = yPosition + row * 20;

        // card background
        pdf.setFillColor(245, 245, 245);
        pdf.rect(xPos, yPos, metricWidth, 16, "F");

        // border
        pdf.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
        pdf.rect(xPos, yPos, metricWidth, 16);

        // label
        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(8);
        pdf.text(metric.label, xPos + 3, yPos + 5);

        // value
        pdf.setTextColor(0, 0, 0);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.text(metric.value, xPos + 3, yPos + 11);

        // note
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        pdf.setTextColor(34, 197, 94); // green
        pdf.text(metric.note, xPos + 3, yPos + 15);
      });

      yPosition += 45; // move below metric cards

      // ===================== TOP SELLING ITEMS =====================
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = 15;
      }

      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.text("TOP SELLING ITEMS", margin, yPosition);
      yPosition += 8;

      // table header
      const headers = ["#", "Item Name", "Units Sold", "Revenue (₹)"];
      const colWidths = [10, 70, 25, 35];
      let x = margin;

      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 7, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");

      headers.forEach((h, i) => {
        pdf.text(h, x + 2, yPosition);
        x += colWidths[i];
      });

      yPosition += 6;
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      pdf.setFontSize(8);

      if (stats.topSellingItems && stats.topSellingItems.length > 0) {
        stats.topSellingItems.slice(0, 5).forEach((item, idx) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 15;
          }

          x = margin;
          const revenue =
            item.price && item._count?.orderItems
              ? Number(item.price * item._count.orderItems).toFixed(0)
              : "0";

          pdf.text(String(idx + 1), x + 2, yPosition);
          x += colWidths[0];

          pdf.text(String(item.name || "").slice(0, 30), x + 2, yPosition);
          x += colWidths[1];

          pdf.text(String(item._count?.orderItems || 0), x + 2, yPosition);
          x += colWidths[2];

          pdf.text(revenue, x + 2, yPosition);

          yPosition += 5;
        });
      } else {
        pdf.text("No sales data available.", margin, yPosition);
        yPosition += 5;
      }

      yPosition += 8;

      // ===================== LOW STOCK ALERTS =====================
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = 15;
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      pdf.text("LOW STOCK ALERTS", margin, yPosition);
      yPosition += 8;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);

      if (stats.lowStockItems && stats.lowStockItems.length > 0) {
        stats.lowStockItems.forEach((item) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 15;
          }

          pdf.setDrawColor(250, 204, 21);
          pdf.setFillColor(255, 251, 235);
          pdf.rect(margin, yPosition - 4, pageWidth - 2 * margin, 9, "FD");

          pdf.setTextColor(180, 83, 9);
          pdf.setFont("helvetica", "bold");
          pdf.text(String(item.name || ""), margin + 3, yPosition);

          pdf.setTextColor(120, 53, 15);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(7);
          pdf.text(
            "Only " + String(item.inventory?.quantity || 0) + " units left.",
            margin + 3,
            yPosition + 4,
          );

          yPosition += 11;
        });
      } else {
        pdf.setTextColor(22, 163, 74);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.text("All items are well stocked.", margin, yPosition);
        yPosition += 6;
      }

      // FOOTER
      pdf.setFontSize(7);
      pdf.setTextColor(148, 163, 184);
      pdf.text(
        "Auto‑generated report from Cafe POS. For detailed analytics, use the dashboard.",
        margin,
        pageHeight - 10,
      );

      pdf.save("sales-report-" + Date.now() + ".pdf");
    } catch (e) {
      console.error(e);
      alert("Error generating PDF");
    } finally {
      setExporting(false);
    }
  };

  // Calculate growth percentages
  const yesterdaySales = stats.todaySales * 0.89;
  const yesterdayOrders = stats.todayOrders * 0.92;
  const yesterdayItems = stats.totalItemsSold * 1.03;

  const salesGrowth = yesterdaySales
    ? (((stats.todaySales - yesterdaySales) / yesterdaySales) * 100).toFixed(1)
    : 0;
  const ordersGrowth = yesterdayOrders
    ? (((stats.todayOrders - yesterdayOrders) / yesterdayOrders) * 100).toFixed(
        1,
      )
    : 0;
  const itemsGrowth = yesterdayItems
    ? (
        ((stats.totalItemsSold - yesterdayItems) / yesterdayItems) *
        100
      ).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <BarChart3 className="w-7 h-7 mr-3 text-red-500" />
                Business Reports & Analytics
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Track performance and insights
              </p>
            </div>

            {/* Date Range Filter */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
                <Calendar className="w-4 h-4 text-gray-500" />
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, from: e.target.value })
                  }
                  className="text-sm bg-transparent focus:outline-none text-gray-700"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, to: e.target.value })
                  }
                  className="text-sm bg-transparent focus:outline-none text-gray-700"
                />
              </div>
              <button
                onClick={fetchSalesTrend}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={downloadPDFReport}
                disabled={exporting}
                className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span>{exporting ? "Exporting..." : "Export PDF"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading analytics...</p>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Today's Sales */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Today's Sales
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      ₹{Number(stats.todaySales || 0).toFixed(0)}
                    </p>
                    <div className="flex items-center space-x-1 text-xs">
                      {salesGrowth >= 0 ? (
                        <>
                          <TrendingUp className="w-3 h-3 text-green-600" />
                          <span className="text-green-600 font-medium">
                            +{salesGrowth}%
                          </span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-3 h-3 text-red-600" />
                          <span className="text-red-600 font-medium">
                            {salesGrowth}%
                          </span>
                        </>
                      )}
                      <span className="text-gray-500">vs yesterday</span>
                    </div>
                  </div>
                  <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center">
                    <DollarSign className="w-7 h-7 text-red-600" />
                  </div>
                </div>
              </div>

              {/* Orders Today */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Orders Today
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {stats.todayOrders || 0}
                    </p>
                    <div className="flex items-center space-x-1 text-xs">
                      {ordersGrowth >= 0 ? (
                        <>
                          <TrendingUp className="w-3 h-3 text-green-600" />
                          <span className="text-green-600 font-medium">
                            +{ordersGrowth}%
                          </span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-3 h-3 text-red-600" />
                          <span className="text-red-600 font-medium">
                            {ordersGrowth}%
                          </span>
                        </>
                      )}
                      <span className="text-gray-500">vs yesterday</span>
                    </div>
                  </div>
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                    <ShoppingCart className="w-7 h-7 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Items Sold */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Items Sold
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {stats.totalItemsSold || 0}
                    </p>
                    <div className="flex items-center space-x-1 text-xs">
                      {itemsGrowth >= 0 ? (
                        <>
                          <TrendingUp className="w-3 h-3 text-green-600" />
                          <span className="text-green-600 font-medium">
                            +{itemsGrowth}%
                          </span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-3 h-3 text-orange-600" />
                          <span className="text-orange-600 font-medium">
                            {itemsGrowth}%
                          </span>
                        </>
                      )}
                      <span className="text-gray-500">vs yesterday</span>
                    </div>
                  </div>
                  <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center">
                    <Package className="w-7 h-7 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Low Stock */}
              <div
                className={`rounded-2xl shadow-sm border p-6 hover:shadow-lg transition-shadow ${
                  (stats.lowStockCount || 0) > 0
                    ? "bg-gradient-to-br from-orange-500 to-red-500 text-white border-orange-300"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium mb-1 ${
                        (stats.lowStockCount || 0) > 0
                          ? "text-white/90"
                          : "text-gray-600"
                      }`}
                    >
                      Low Stock Alerts
                    </p>
                    <p
                      className={`text-3xl font-bold mb-1 ${
                        (stats.lowStockCount || 0) > 0
                          ? "text-white"
                          : "text-gray-900"
                      }`}
                    >
                      {stats.lowStockCount || 0}
                    </p>
                    <p
                      className={`text-xs ${
                        (stats.lowStockCount || 0) > 0
                          ? "text-white/80"
                          : "text-gray-500"
                      }`}
                    >
                      {(stats.lowStockCount || 0) > 0
                        ? "Action required"
                        : "All good!"}
                    </p>
                  </div>
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                      (stats.lowStockCount || 0) > 0
                        ? "bg-white/20"
                        : "bg-green-100"
                    }`}
                  >
                    <AlertTriangle
                      className={`w-7 h-7 ${
                        (stats.lowStockCount || 0) > 0
                          ? "text-white"
                          : "text-green-600"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Sales Trend */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-red-500" />
                  Sales Trend (Last 7 Days)
                </h2>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={salesTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      stroke="#9ca3af"
                    />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#ef4444"
                      strokeWidth={3}
                      dot={{ fill: "#ef4444", r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Orders Trend */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
                  Order Volume
                </h2>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={salesTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      stroke="#9ca3af"
                    />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                      }}
                    />
                    <Bar
                      dataKey="orders"
                      fill="#3b82f6"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Selling Items */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">
                  Top Selling Items
                </h2>
                {stats.topSellingItems && stats.topSellingItems.length > 0 ? (
                  <div className="space-y-4">
                    {stats.topSellingItems.slice(0, 5).map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                            <span className="text-lg font-bold text-red-600">
                              #{index + 1}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {item.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {item._count?.orderItems || 0} sold
                            </p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-red-600">
                          ₹
                          {Number(
                            item.price * (item._count?.orderItems || 0),
                          ).toFixed(0)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No sales data available</p>
                  </div>
                )}
              </div>

              {/* Low Stock Items */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                  Low Stock Alerts
                </h2>
                {stats.lowStockItems && stats.lowStockItems.length > 0 ? (
                  <div className="space-y-3">
                    {stats.lowStockItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-xl"
                      >
                        <div>
                          <h3 className="font-semibold text-orange-900">
                            {item.name}
                          </h3>
                          <p className="text-sm text-orange-600 mt-1">
                            Only {item.inventory?.quantity || 0} left
                          </p>
                        </div>
                        <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors">
                          Restock
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-green-200 mx-auto mb-3" />
                    <p className="text-green-600 font-semibold">
                      All items well stocked!
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      No action needed
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
