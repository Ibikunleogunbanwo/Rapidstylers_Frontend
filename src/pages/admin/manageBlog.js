import { useAdminList, AdminListControls, AdminNoMatches } from "./adminList";
import React, { useState, useEffect, useRef } from "react";
import { Navigate, Link } from "react-router-dom";
import { APIService } from "../../hooks/remote/apiService";
import { AdminPage, AdminCard, AdminInput, AdminTextarea, AdminPill } from "./adminShell";
import AccessibleDialog, { DialogCloseButton } from "../../components/accessibleDialog";
import BlogArticle from "../../components/blogArticle";
import {
  getAuthToken,
  isAdminRole,
  showSuccessToastMessage,
} from "../../utils/constant";

const EMPTY_FORM = { title: "", category: "", author: "", imageUrl: "", content: "" };

/**
 * The same rules the backend enforces (contract 11): a title and content, an
 * https:// image URL when one is given, and a trimmed category. Returns the
 * body to send, or throws the message to show.
 */
export const articleBody = form => {
  const body = {
    title: form.title.trim(),
    category: form.category.trim(),
    author: form.author.trim(),
    imageUrl: form.imageUrl.trim(),
    content: form.content.trim(),
  };
  if (!body.title) throw new Error("Add a title.");
  if (!body.content) throw new Error("Add the article content.");
  if (body.imageUrl) {
    let valid = false;
    try { valid = /^https:\/\//i.test(body.imageUrl) && Boolean(new URL(body.imageUrl).hostname); } catch { valid = false; }
    if (!valid) throw new Error("The image URL must be a full https:// link.");
  }
  return body;
};

/** A post without a status predates drafts and is live, as the backend treats it. */
export const isDraft = item => String(item?.status || "").toUpperCase() === "DRAFT";

const todayLabel = () => new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

/**
 * The article exactly as readers will see it (the public article page's own
 * rendering), in a dialog, before anything is published.
 */
function ArticlePreview({ post, onClose }) {
  return (
    <AccessibleDialog open={Boolean(post)} onClose={onClose} labelledBy="blog-preview-title" portal closeOnOverlayClick
      overlayClassName="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-8"
      className="w-full max-w-4xl rounded-lg bg-white">
      {post && <>
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <p id="blog-preview-title" className="text-sm font-semibold text-gray-900">
            Preview{post.draft ? " · Draft, not visible to readers yet" : ""}
          </p>
          <DialogCloseButton onClick={onClose} label="Close preview" />
        </div>
        <div className="px-5 py-8 md:px-10">
          <BlogArticle post={post} />
        </div>
      </>}
    </AccessibleDialog>
  );
}

const categoryName = item => item.serviceTypeName || item.serviceName || item.name || "";

/** The category picker: the admin Categories list, plus the article's current value if it is no longer listed. */
function CategorySelect({ value, onChange, categories, disabled, label }) {
  const names = categories.map(categoryName).filter(Boolean);
  const options = value && !names.some(name => name.toLowerCase() === value.toLowerCase()) ? [value, ...names] : names;
  return (
    <label className="flex flex-col gap-1 text-sm text-gray-700">{label}
      <select value={value} disabled={disabled} onChange={e => onChange(e.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-60">
        <option value="">No category</option>
        {options.map(name => <option key={name} value={name}>{name}</option>)}
      </select>
    </label>
  );
}

const ManageBlog = () => {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const writeLock = useRef(false);
  const [actionError, setActionError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editItem, setEditItem] = useState(null); // { id } while editing
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [createError, setCreateError] = useState("");
  const [preview, setPreview] = useState(null);

  const loadPosts = () => {
    setLoading(true);
    setLoadError("");
    // The admin list includes drafts; the public list_blog never does.
    APIService.adminBlogPosts()
      .then((res) => setPosts(Array.isArray(res.data?.data) ? res.data.data : []))
      .catch(() => setLoadError("Unable to load articles."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPosts();
    APIService.getStylerType()
      .then((res) => setCategories(Array.isArray(res?.data?.data) ? res.data.data : []))
      .catch(() => setCategories([]));
  }, []);

  const list = useAdminList(posts, item => [item.title, item.category, item.author].filter(Boolean).join(" "));

  if (!getAuthToken() || !isAdminRole()) {
    return <Navigate to="/admin/login" replace />;
  }

  /** New article as a draft (DRAFT) or live straight away (PUBLISHED). */
  const handleCreate = async (status) => {
    if (writeLock.current) return;
    setCreateError("");
    let body;
    try { body = articleBody(form); } catch (error) { setCreateError(error.message); return; }
    writeLock.current = true;
    setActionError("");
    setSubmitting(true);
    try {
      await APIService.adminCreateBlog({ ...body, status });
      showSuccessToastMessage(status === "DRAFT" ? "Draft saved" : "Article published");
      setForm(EMPTY_FORM);
      loadPosts();
    } catch (error) {
      setCreateError(error?.response?.data?.message || error?.message || "Failed to publish article");
    } finally {
      writeLock.current = false;
      setSubmitting(false);
    }
  };

  /**
   * Saves an edit with an explicit status: the backend publishes an update
   * that has none, so a draft must say DRAFT to stay a draft.
   */
  const handleUpdate = async (item, status) => {
    if (writeLock.current) return;
    setActionError("");
    let body;
    try { body = articleBody(editForm); } catch (error) { setActionError(error.message); return; }
    writeLock.current = true;
    setSubmitting(true);
    try {
      await APIService.adminUpdateBlog({
        id: item.id,
        ...body,
        status,
      });
      const wasDraft = isDraft(item);
      showSuccessToastMessage(status === "DRAFT" ? (wasDraft ? "Draft saved" : "Article unpublished") : (wasDraft ? "Article published" : "Article updated"));
      setEditItem(null);
      setEditForm(EMPTY_FORM);
      loadPosts();
    } catch (error) {
      setActionError(error?.response?.data?.message || error?.message || "Failed to update article");
    } finally {
      writeLock.current = false;
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    if (writeLock.current) return;
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    writeLock.current = true;
    setSubmitting(true);
    setActionError("");
    try {
      await APIService.adminDeleteBlog(item.id);
      showSuccessToastMessage("Article deleted");
      loadPosts();
    } catch (error) {
      setActionError(error?.response?.data?.message || error?.message || "Unable to save changes.");
    } finally {
      writeLock.current = false;
      setSubmitting(false);
    }
  };

  /** Opens the preview for form values, or shows why they cannot be previewed. */
  const previewForm = (values, meta, onError) => {
    let body;
    try { body = articleBody(values); } catch (error) { onError(error.message); return; }
    onError("");
    setPreview({ ...body, dateCreated: meta.dateCreated || todayLabel(), draft: meta.draft });
  };

  const startEdit = (item) => {
    setEditItem({ id: item.id });
    setEditForm({
      title: item.title || "",
      category: item.category || "",
      author: item.author || "",
      imageUrl: item.imageUrl || item.img || "",
      content: item.content || "",
    });
  };

  return (
    <AdminPage eyebrow="Admin" title="Manage Blog" pageTitle="Blog">
      {/* Create */}
      {actionError && <p role="alert" className="mb-4 text-sm text-red-700">{actionError}</p>}
      <ArticlePreview post={preview} onClose={() => setPreview(null)} />
      <form onSubmit={(e) => { e.preventDefault(); handleCreate("PUBLISHED"); }}>
        <AdminCard className="mb-6">
          <p className="font-semibold text-gray-900 mb-3">Write a new article</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm text-gray-700 md:col-span-2">Article title
              <AdminInput
                type="text"
                required
                disabled={submitting}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Article title"
              />
            </label>
            <CategorySelect label="Category" categories={categories} disabled={submitting} value={form.category} onChange={(category) => setForm({ ...form, category })} />
            <label className="flex flex-col gap-1 text-sm text-gray-700">Author
              <AdminInput
                type="text"
                disabled={submitting}
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                placeholder="Author (defaults to RapidStylers Team)"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-gray-700 md:col-span-2">Image URL
              <AdminInput
                type="url"
                inputMode="url"
                pattern="https://.+"
                title="A full https:// link"
                disabled={submitting}
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://res.cloudinary.com/…"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-gray-700 md:col-span-2">Article content
              <AdminTextarea
                required
                disabled={submitting}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="min-h-[140px]"
                placeholder="Article content (paragraphs separated by blank lines)"
              />
            </label>
          </div>
          {createError && (
            <div role="alert" className="mt-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              <span>{createError}</span>
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="py-3 px-6 bg-brand rounded-md text-sm text-white font-semibold hover:opacity-90 disabled:opacity-60"
            >
              Publish
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleCreate("DRAFT")}
              className="py-3 px-5 rounded-md border border-gray-300 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
            >
              Save draft
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => previewForm(form, { draft: true }, setCreateError)}
              className="py-3 px-4 rounded-md text-sm font-semibold text-brand hover:underline disabled:opacity-60"
            >
              Preview
            </button>
            {submitting && <span role="status" className="text-xs text-gray-500">Working…</span>}
          </div>
          <p className="mt-2 text-xs text-gray-500">A draft is saved here only; readers see it once you publish it.</p>
        </AdminCard>
      </form>

      {/* List */}
      <AdminCard>
          <p className="font-semibold text-gray-900 mb-3">Articles</p>
          <AdminListControls list={list} label="Search articles" />
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : loadError ? (
            <div role="alert">{loadError} <button type="button" onClick={loadPosts}>Retry</button></div>
          ) : list.filteredCount === 0 ? (
            posts.length ? <AdminNoMatches list={list} noun="articles" /> : <p className="text-sm text-gray-500">No articles yet. Write your first one above.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {list.visibleItems.map((item) => (
                <li key={item.id} className="py-4">
                  {editItem && editItem.id === item.id ? (
                    <div className="flex flex-col gap-2">
                      <label className="flex flex-col gap-1 text-sm text-gray-700">Edit article title
                        <AdminInput
                          type="text"
                          disabled={submitting}
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          placeholder="Article title"
                        />
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <CategorySelect label="Edit category" categories={categories} disabled={submitting} value={editForm.category} onChange={(category) => setEditForm({ ...editForm, category })} />
                        <label className="flex flex-col gap-1 text-sm text-gray-700">Edit author
                          <AdminInput
                            type="text"
                            disabled={submitting}
                            value={editForm.author}
                            onChange={(e) => setEditForm({ ...editForm, author: e.target.value })}
                            placeholder="Author"
                          />
                        </label>
                      </div>
                      <label className="flex flex-col gap-1 text-sm text-gray-700">Edit image URL
                        <AdminInput
                          type="url"
                          inputMode="url"
                          disabled={submitting}
                          value={editForm.imageUrl}
                          onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                          placeholder="Image URL"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm text-gray-700">Edit article content
                        <AdminTextarea
                          disabled={submitting}
                          value={editForm.content}
                          onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                          className="min-h-[120px]"
                          placeholder="Article content"
                        />
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        {isDraft(item) ? <>
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleUpdate(item, "PUBLISHED")}
                            className="py-1.5 px-4 bg-brand rounded-md text-xs text-white font-semibold hover:opacity-90"
                          >
                            Publish
                          </button>
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleUpdate(item, "DRAFT")}
                            className="py-1.5 px-3 rounded-md border border-gray-300 text-xs font-semibold text-gray-800"
                          >
                            Save draft
                          </button>
                        </> : <>
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleUpdate(item, "PUBLISHED")}
                            className="py-1.5 px-4 bg-brand rounded-md text-xs text-white font-semibold hover:opacity-90"
                          >
                            Save changes
                          </button>
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleUpdate(item, "DRAFT")}
                            className="py-1.5 px-3 rounded-md border border-gray-300 text-xs font-semibold text-gray-800"
                          >
                            Unpublish
                          </button>
                        </>}
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => previewForm(editForm, { dateCreated: item.dateCreated, draft: isDraft(item) }, setActionError)}
                          className="py-1.5 px-3 rounded-md text-xs font-semibold text-brand"
                        >
                          Preview
                        </button>
                        <button
                          disabled={submitting}
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
                          <p className="flex min-w-0 items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900 truncate">{item.title}</span>
                            <AdminPill tone={isDraft(item) ? "attention" : "positive"}>{isDraft(item) ? "Draft" : "Published"}</AdminPill>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {item.category || "Uncategorized"} · {item.dateCreated || ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreview({ ...item, imageUrl: item.imageUrl || item.img || "", draft: isDraft(item) })}
                            className="py-1.5 px-3 rounded-md text-xs font-semibold text-brand hover:text-brand-dark"
                          >
                            Preview
                          </button>
                          {!isDraft(item) && <Link
                            to={`/blog/${item.id}`}
                            className="py-1.5 px-3 rounded-md text-xs font-semibold text-brand hover:text-brand-dark"
                          >
                            View
                          </Link>}
                          <button
                            disabled={submitting}
                            onClick={() => startEdit(item)}
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

export default ManageBlog;
