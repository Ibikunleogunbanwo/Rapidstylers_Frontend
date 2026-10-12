import { useAdminList, AdminListControls, AdminNoMatches } from "./adminList";
import React, { useState, useEffect, useRef } from "react";
import { Navigate, Link } from "react-router-dom";
import { APIService } from "../../hooks/remote/apiService";
import { AdminPage, AdminCard, AdminInput } from "./adminShell";
import {
  getAuthToken,
  isAdminRole,
  showSuccessToastMessage,
} from "../../utils/constant";

const nameOf = (item) => item.serviceTypeName || item.serviceName || item.name || "";

/**
 * The backend's category-name rule (contract 11): trimmed, 2-50 characters,
 * and no other category with the same name ignoring case. Returns the trimmed
 * name, or throws the message to show.
 */
export const categoryName = (value, services, exceptId) => {
  const name = String(value || "").trim();
  if (name.length < 2 || name.length > 50) throw new Error("Category name must be 2 to 50 characters.");
  if (services.some((item) => item.id !== exceptId && nameOf(item).trim().toLowerCase() === name.toLowerCase())) {
    throw new Error("A category with this name already exists");
  }
  return name;
};

const ManageCategories = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const writeLock = useRef(false);
  const [actionError, setActionError] = useState("");
  const [editItem, setEditItem] = useState(null); // { id, serviceName, description } while editing
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const loadServices = () => {
    setLoading(true);
    setLoadError("");
    APIService.getStylerType()
      .then((res) => setServices(res.data?.data || []))
      .catch(() => setLoadError("Unable to load categories."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadServices();
  }, []);

  const list = useAdminList(services, item => [item.serviceTypeName, item.serviceName, item.name, item.description].filter(Boolean).join(" "));

  if (!getAuthToken() || !isAdminRole()) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    if (writeLock.current) return;
    setActionError("");
    let serviceName;
    try { serviceName = categoryName(newName, services); } catch (error) { setActionError(error.message); return; }
    writeLock.current = true;
    setSubmitting(true);
    try {
      await APIService.adminCreateService({
        serviceName,
        description: newDescription.trim(),
      });
      showSuccessToastMessage("Category created");
      setNewName("");
      setNewDescription("");
      loadServices();
    } catch (error) {
      setActionError(error?.response?.data?.message || error?.message || "Unable to save changes.");
    } finally {
      writeLock.current = false;
      setSubmitting(false);
    }
  };

  const handleUpdate = async (item) => {
    if (writeLock.current) return;
    setActionError("");
    let serviceName;
    try { serviceName = categoryName(editName, services, item.id); } catch (error) { setActionError(error.message); return; }
    writeLock.current = true;
    setSubmitting(true);
    try {
      await APIService.adminUpdateService({
        id: item.id,
        serviceName,
        description: editDescription.trim(),
      });
      showSuccessToastMessage("Category updated");
      setEditItem(null);
      setEditName("");
      setEditDescription("");
      loadServices();
    } catch (error) {
      setActionError(error?.response?.data?.message || error?.message || "Unable to save changes.");
    } finally {
      writeLock.current = false;
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    if (writeLock.current) return;
    if (!window.confirm(`Delete "${item.serviceTypeName || item.serviceName || item.name}"?`)) return;
    writeLock.current = true;
    setSubmitting(true);
    setActionError("");
    try {
      await APIService.adminDeleteService(item.id);
      showSuccessToastMessage("Category deleted");
      loadServices();
    } catch (error) {
      setActionError(error?.response?.data?.message || error?.message || "Unable to save changes.");
    } finally {
      writeLock.current = false;
      setSubmitting(false);
    }
  };

  const displayName = (item) => item.serviceTypeName || item.serviceName || item.name || "(unnamed)";

  return (
    <AdminPage eyebrow="Admin" title="Manage Categories" pageTitle="Categories">
      {/* Create */}
      {actionError && <p role="alert" className="mb-4 text-sm text-red-700">{actionError}</p>}
      <form onSubmit={handleCreate}>
        <AdminCard className="mb-6">
          <p className="font-semibold text-gray-900 mb-3">Add a new category</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm text-gray-700">Category name
              <AdminInput
                type="text"
                required
                minLength={2}
                maxLength={50}
                disabled={submitting}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Category name (e.g. Nails)"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-gray-700">Description
              <AdminInput
                type="text"
                disabled={submitting}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Description (optional)"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-4 py-3 px-6 bg-brand rounded-md text-sm text-white font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Working…" : "Add Category"}
          </button>
        </AdminCard>
      </form>

      {/* List */}
      <AdminCard>
          <p className="font-semibold text-gray-900 mb-3">Existing categories</p>
          <AdminListControls list={list} label="Search categories" />
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : loadError ? (
            <div role="alert">{loadError} <button type="button" onClick={loadServices}>Retry</button></div>
          ) : list.filteredCount === 0 ? (
            services.length ? <AdminNoMatches list={list} noun="categories" /> : <p className="text-sm text-gray-500">No categories yet. Add your first one above.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {list.visibleItems.map((item) => (
                <li key={item.id} className="py-3 flex items-center justify-between gap-3">
                  {editItem && editItem.id === item.id ? (
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 flex-1">
                      <label className="flex flex-col gap-1 text-sm text-gray-700">Edit category name
                        <AdminInput
                          variant="inline"
                          type="text"
                          maxLength={50}
                          disabled={submitting}
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Category name"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm text-gray-700">Edit description
                        <AdminInput
                          variant="inline"
                          type="text"
                          disabled={submitting}
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Description (optional)"
                        />
                      </label>
                      <button
                        disabled={submitting}
                        onClick={() => handleUpdate(item)}
                        className="py-1.5 px-4 bg-brand rounded-md text-xs text-white font-semibold hover:opacity-90"
                      >
                        Save
                      </button>
                      <button
                        disabled={submitting}
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
                          disabled={submitting}
                          onClick={() => { setEditItem({ id: item.id }); setEditName(displayName(item)); setEditDescription(item.description || ""); }}
                          className="py-1.5 px-3 rounded-md text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-200"
                        >
                          Edit
                        </button>
                        <button
                          disabled={submitting}
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
      </AdminCard>

      <p className="mt-6 text-center">
        <Link to="/admin" className="text-sm text-gray-500 hover:text-gray-800 font-semibold">
          ← Admin dashboard
        </Link>
      </p>
    </AdminPage>
  );
};

export default ManageCategories;
