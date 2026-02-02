import React, { useState, useEffect } from "react";
import { useMenu } from "../context/MenuContext";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  X,
  Save,
  Package,
  AlertCircle,
} from "lucide-react";
import Navbar from "../components/navbar";
import axios from "axios";

const MenuPage = () => {
  const { menuItems, loading, setMenuItems } = useMenu(); // Add setMenuItems to context
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: 1,
  });

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get("/api/menu/categories");
      setCategories(res.data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        // UPDATE existing item
        const res = await axios.put(`/api/menu/items/${editingId}`, {
          name: form.name,
          description: form.description,
          price: parseFloat(form.price),
          categoryId: parseInt(form.categoryId),
        });

        // Update local state
        setMenuItems(
          menuItems.map((item) => (item.id === editingId ? res.data : item)),
        );

        alert("✅ Item updated successfully!");
      } else {
        // CREATE new item
        const res = await axios.post("/api/menu/items", {
          name: form.name,
          description: form.description,
          price: parseFloat(form.price),
          categoryId: parseInt(form.categoryId),
        });

        // Add to local state
        setMenuItems([...menuItems, res.data]);

        alert("✅ Item added successfully!");
      }

      // Reset form
      cancelForm();
    } catch (err) {
      alert("❌ Failed: " + (err.response?.data?.error || err.message));
    }
  };

  const handleEdit = (item) => {
    setForm({
      name: item.name,
      description: item.description || "",
      price: item.price.toString(),
      categoryId: item.categoryId,
    });
    setEditingId(item.id);
    setEditMode(true);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) {
      return;
    }

    try {
      await axios.delete(`/api/menu/items/${id}`);

      // Remove from local state
      setMenuItems(menuItems.filter((item) => item.id !== id));

      alert("✅ Item deleted successfully!");
    } catch (err) {
      alert("❌ Delete failed: " + (err.response?.data?.error || err.message));
    }
  };

  const cancelForm = () => {
    setForm({
      name: "",
      description: "",
      price: "",
      categoryId: categories[0]?.id || 1,
    });
    setShowForm(false);
    setEditMode(false);
    setEditingId(null);
  };

  // Filter logic
  const allCategories = ["All", ...categories.map((c) => c.name)];
  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || item.category?.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center p-16">
          <div className="text-gray-500">Loading menu...</div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Menu Management
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {menuItems.length} items • {categories.length} categories
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all ${
                showForm
                  ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  : "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700"
              }`}
            >
              {showForm ? (
                <X className="w-5 h-5" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              <span>{showForm ? "Cancel" : "Add Item"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Package className="w-6 h-6 mr-2 text-red-500" />
              {editMode ? "Edit Menu Item" : "Add New Item"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Item Name *
                  </label>
                  <input
                    placeholder="e.g., Cappuccino"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-300 focus:outline-none text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-300 focus:outline-none text-sm"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={form.categoryId}
                    onChange={(e) =>
                      setForm({ ...form, categoryId: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-300 focus:outline-none text-sm bg-white"
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="Brief description of the item..."
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-300 focus:outline-none text-sm"
                    rows="3"
                  />
                </div>
              </div>

              <div className="flex space-x-4 mt-8">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                >
                  <Save className="w-5 h-5" />
                  <span>{editMode ? "Update Item" : "Add to Menu"}</span>
                </button>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-300 focus:outline-none text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
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

        {/* Menu Items Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {item.name}
                        </p>
                        {item.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {item.category?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-lg font-bold text-red-600">
                        ₹{item.price}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {item.inventory?.lowStock && (
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                        )}
                        <span
                          className={`font-semibold ${
                            item.inventory?.lowStock
                              ? "text-orange-600"
                              : "text-green-600"
                          }`}
                        >
                          {item.inventory?.quantity || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No items found</p>
              <p className="text-gray-400 text-sm mt-1">
                {searchTerm
                  ? "Try different search terms"
                  : "Add your first menu item"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuPage;
