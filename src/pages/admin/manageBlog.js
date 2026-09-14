import React, { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { APIService } from "../../hooks/remote/apiService";
import { AdminPage, AdminCard, AdminInput, AdminTextarea } from "./adminShell";
import {
  getAuthToken,
  isAdminRole,
  clearAllSessionTokens,
  showSuccessToastMessage,
} from "../../utils/constant";

const EMPTY_FORM = { title: "", category: "", author: "", imageUrl: "", content: "" };

const ManageBlog = () => {
  document.title = "Manage Blog | RapidStylers";
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editItem, setEditItem] = useState(null); // { id } while editing
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [createError, setCreateError] = useState("");
  const [editError, setEditError] = useState("");

  const loadPosts = () => {
    APIService.listBlog()
      .then((res) => setPosts(res.data?.data || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPosts();
  }, []);

  if (!getAuthToken() || !isAdminRole()) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setCreateError("");
    setSubmitting(true);
    try {
      await APIService.adminCreateBlog(form);
      showSuccessToastMessage("Article created");
      setForm(EMPTY_FORM);
      loadPosts();
    } catch (error) {
      setCreateError(error?.response?.data?.message || error?.message || "Failed to publish article");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (item) => {
    if (!editForm.title.trim()) return;
    try {
      await APIService.adminUpdateBlog({
        id: item.id,
        ...editForm,
      });
      showSuccessToastMessage("Article updated");
      setEditItem(null);
      setEditForm(EMPTY_FORM);
      loadPosts();
    } catch (error) {
      setEditError(error?.response?.data?.message || error?.message || "Failed to update article");
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    try {
      await APIService.adminDeleteBlog(item.id);
      showSuccessToastMessage("Article deleted");
      loadPosts();
    } catch (error) {
      // Error toasts are handled in APIService
    }
  };

  const startEdit = (item) => {
    setEditItem({ id: item.id });
    setEditError("");
    setEditForm({
      title: item.title || "",
      category: item.category || "",
      author: item.author || "",
      imageUrl: item.imageUrl || item.img || "",
      content: item.content || "",
    });
  };

  return (
    <AdminPage eyebrow="Admin" title="Manage Blog">
      {/* Create */}
      <form onSubmit={handleCreate}>
        <AdminCard className="mb-6">
          <p className="font-semibold text-gray-900 mb-3">Write a new article</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminInput
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="md:col-span-2"
              placeholder="Article title"
            />
            <AdminInput
              type="text"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Category (e.g. Braiding)"
            />
            <AdminInput
              type="text"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              placeholder="Author (defaults to RapidStylers Team)"
            />
            <AdminInput
              type="text"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              className="md:col-span-2"
              placeholder="Image URL"
            />
            <AdminTextarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="md:col-span-2 min-h-[140px]"
              placeholder="Article content (paragraphs separated by blank lines)"
            />
          </div>
          {createError && (
            <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              <span>{createError}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="mt-4 py-3 px-6 bg-brand rounded-md text-sm text-white font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Publishing…" : "Publish Article"}
          </button>
        </AdminCard>
      </form>

      {/* List */}
      <AdminCard>
          <p className="font-semibold text-gray-900 mb-3">Published articles</p>
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-gray-500">No articles yet. Write your first one above.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {posts.map((item) => (
                <li key={item.id} className="py-4">
                  {editItem && editItem.id === item.id ? (
                    <div className="flex flex-col gap-2">
                      <AdminInput
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        placeholder="Article title"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <AdminInput
                          type="text"
                          value={editForm.category}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          placeholder="Category"
                        />
                        <AdminInput
                          type="text"
                          value={editForm.author}
                          onChange={(e) => setEditForm({ ...editForm, author: e.target.value })}
                          placeholder="Author"
                        />
                      </div>
                      <AdminInput
                        type="text"
                        value={editForm.imageUrl}
                        onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                        placeholder="Image URL"
                      />
                      <AdminTextarea
                        value={editForm.content}
                        onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                        className="min-h-[120px]"
                        placeholder="Article content"
                      />
                      {editError && (
                        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                          <span>{editError}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdate(item)}
                          className="py-1.5 px-4 bg-brand rounded-md text-xs text-white font-semibold hover:opacity-90"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => { setEditItem(null); setEditForm(EMPTY_FORM); }}
                          className="py-1.5 px-3 rounded-md text-xs text-gray-500 font-semibold hover:text-gray-800"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {item.category || "Uncategorized"} · {item.dateCreated || ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Link
                            to={`/blog/${item.id}`}
                            className="py-1.5 px-3 rounded-md text-xs font-semibold text-brand hover:text-brand-dark"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => startEdit(item)}
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
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
      </AdminCard>

      <p className="mt-6 text-center">
        <Link to="/" className="text-sm text-gray-500 hover:text-gray-800 font-semibold">
          ← Home
        </Link>
      </p>
    </AdminPage>
  );
};

export default ManageBlog;
