import React, { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { APIService } from "../../hooks/remote/apiService";
import {
  getAuthToken,
  isAdminRole,
  clearAuthToken,
  clearAdminRole,
  showSuccessToastMessage,
} from "../../utils/constant";

const ManageCategories = () => {
  document.title = "Manage Categories | RapidStylers";
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editItem, setEditItem] = useState(null); // { id, serviceName, description } while editing
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const loadServices = () => {
    APIService.getStylerType()
      .then((res) => setServices(res.data?.data || []))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadServices();
  }, []);

  if (!getAuthToken() || !isAdminRole()) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      await APIService.adminCreateService({
        serviceName: newName.trim(),
        description: newDescription.trim(),
      });
      showSuccessToastMessage("Category created");
      setNewName("");
      setNewDescription("");
      loadServices();
    } catch (error) {
      // Error toasts are handled in APIService
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (item) => {
    if (!editName.trim()) return;
    try {
      await APIService.adminUpdateService({
        id: item.id,
        serviceName: editName.trim(),
        description: editDescription.trim(),
      });
      showSuccessToastMessage("Category updated");
      setEditItem(null);
      setEditName("");
      setEditDescription("");
      loadServices();
    } catch (error) {
      // Error toasts are handled in APIService
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.serviceTypeName || item.serviceName || item.name}"?`)) return;
    try {
      await APIService.adminDeleteService(item.id);
      showSuccessToastMessage("Category deleted");
      loadServices();
    } catch (error) {
      // Error toasts are handled in APIService
    }
  };

  const displayName = (item) => item.serviceTypeName || item.serviceName || item.name || "(unnamed)";

  return (
    <div className="min-h-screen bg-[#f5f5f5] px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <p className="text-2xl font-bold text-gray-900">Manage Categories</p>
          <button
            onClick={() => { clearAuthToken(); clearAdminRole(); window.location.href = "/admin/login"; }}
            className="text-sm text-gray-500 hover:text-gray-800 font-semibold"
          >
            Sign out
          </button>
        </div>

        <div className="flex gap-4 mb-6 text-sm font-semibold">
          <span className="text-brand underline">Categories</span>
          <Link to="/admin/blog" className="text-gray-500 hover:text-gray-800">Blog</Link>
          <Link to="/admin/stylers" className="text-gray-500 hover:text-gray-800">Stylist verification</Link><Link to="/admin/operations" className="text-gray-500 hover:text-gray-800">Operations</Link><Link to="/admin/recovery" className="text-gray-500 hover:text-gray-800">Recovery</Link>
        </div>

        {/* Create */}
        <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <p className="font-semibold text-gray-900 mb-3">Add a new category</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="Category name (e.g. Nails)"
            />
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="Description (optional)"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-4 py-3 px-6 bg-brand rounded-md text-sm text-white font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Adding…" : "Add Category"}
          </button>
        </form>

        {/* List */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <p className="font-semibold text-gray-900 mb-3">Existing categories</p>
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : services.length === 0 ? (
            <p className="text-sm text-gray-500">No categories yet. Add your first one above.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {services.map((item) => (
                <li key={item.id} className="py-3 flex items-center justify-between gap-3">
                  {editItem && editItem.id === item.id ? (
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                        placeholder="Category name"
                      />
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                        placeholder="Description (optional)"
                      />
                      <button
                        onClick={() => handleUpdate(item)}
                        className="py-1.5 px-4 bg-brand rounded-md text-xs text-white font-semibold hover:opacity-90"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setEditItem(null); setEditName(""); setEditDescription(""); }}
                        className="py-1.5 px-3 rounded-md text-xs text-gray-500 font-semibold hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{displayName(item)}</p>
                        {item.description && (
                          <p className="text-xs text-gray-500 truncate">{item.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => { setEditItem({ id: item.id }); setEditName(displayName(item)); setEditDescription(item.description || ""); }}
                          className="py-1.5 px-3 rounded-md text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="py-1.5 px-3 rounded-md text-xs font-semibold text-red-600 hover:text-red-800 border border-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-6 text-center">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-800 font-semibold">
            ← Home
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ManageCategories;
