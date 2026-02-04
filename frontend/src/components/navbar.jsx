import React from "react";
import { useAuth } from "../context/AuthContext";
import {
  LogOut,
  BarChart3,
  ShoppingCart,
  Menu,
  Home,
  Package,
  Beaker,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo + Page Title */}
          <div className="flex items-center space-x-4">
            <Link to="/dashboard">
              <div className="w-11 h-11 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-md hover:scale-105 transition-transform cursor-pointer">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">EatSy</h1>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>

          {/* Right: Navigation + Actions */}
          <div className="flex items-center space-x-3">
            <Link
              to="/dashboard"
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center space-x-2 ${
                isActive("/dashboard")
                  ? "bg-red-50 text-red-600"
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden md:inline">Dashboard</span>
            </Link>

            <Link
              to="/menu"
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center space-x-2 ${
                isActive("/menu")
                  ? "bg-red-50 text-red-600"
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Menu className="w-4 h-4" />
              <span className="hidden md:inline">Menu</span>
            </Link>

            <Link
              to="/inventory"
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center space-x-2 ${
                isActive("/inventory")
                  ? "bg-red-50 text-red-600"
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Beaker className="w-4 h-4" />
              <span className="hidden md:inline">Inventory</span>
            </Link>

            <Link
              to="/reports"
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center space-x-2 ${
                isActive("/reports")
                  ? "bg-red-50 text-red-600"
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden md:inline">Reports</span>
            </Link>

            <Link
              to="/orders"
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center space-x-2 ${
                isActive("/orders")
                  ? "bg-red-50 text-red-600"
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Package className="w-4 h-4" />
              <span className="hidden md:inline">Orders</span>
            </Link>

            <Link
              to="/billing"
              className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>New Order</span>
            </Link>

            <button
              onClick={logout}
              className="p-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
