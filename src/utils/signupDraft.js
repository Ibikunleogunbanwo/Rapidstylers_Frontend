/**
 * What professional signup remembers across a reload.
 *
 * The wizard collects five steps of answers and only commits at the last one, so
 * anything a refresh destroys is work the professional does again: the whole flow
 * used to restart at step 1, and a professional who had picked their photos and
 * reached the password step was sent back to the photos.
 *
 * Two stores, because the answers are of two kinds.
 *
 * The typed answers are text and live in sessionStorage as one JSON blob. They
 * are read synchronously, which is what lets the flow decide on its first render
 * which step a visitor belongs on rather than painting the wrong one first.
 * Session scope rather than local: a finished or abandoned signup should not
 * follow the browser around, and a new tab is entitled to start clean.
 *
 * The two picked photos are binary and are allowed to be 5 MB each, which is past
 * the sessionStorage quota before any encoding overhead, so they go to IndexedDB,
 * the browser's store for blobs. They therefore arrive a moment after the first
 * render, and the steps that cannot be judged without them wait for that read
 * instead of concluding too early.
 *
 * Nothing here is a credential. The password never enters the flow's context,
 * because the last step reads it from its own form state and posts it straight
 * out, so it cannot be written here; and consent is deliberately not remembered
 * either, since the terms are answered on the step that creates the account and
 * "I agreed last time" is not the kind of yes that should be replayed.
 */

/** Where the typed answers live. Exported so a test can assert on the raw key. */
export const DRAFT_KEY = "stylerSignupDraft";

/**
 * The fields a draft never carries, whatever a caller hands in. The password is
 * absent from the context today; this is the fence that keeps it out if that
 * ever changes, rather than a rule someone has to remember.
 */
const NOT_REMEMBERED = ["password"];

/** Whether an answer is something other than blank. */
const holdsSomething = (value) => {
  if (typeof value === "boolean") return value;
  return value !== null && value !== undefined && String(value).trim() !== "";
};

const rememberable = (formData = {}) => {
  const kept = {};
  Object.keys(formData || {}).forEach((key) => {
    if (!NOT_REMEMBERED.includes(key)) kept[key] = formData[key];
  });
  return kept;
};

/**
 * The answers this tab already holds, or null when there are none to read.
 *
 * A draft that cannot be parsed, or storage that refuses to answer, is treated as
 * absent rather than thrown: the professional retypes a form instead of meeting a
 * broken page, and the guard's note explains the order they are being sent to.
 */
export const readSignupDraft = () => {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      formData: parsed.formData && typeof parsed.formData === "object" ? parsed.formData : {},
      emailVerified: parsed.emailVerified === true,
    };
  } catch {
    return null;
  }
};

/**
 * Keep the answers for the next reload.
 *
 * A draft holding nothing is removed rather than written, so a visitor who only
 * looked at the page leaves no trace behind, and clearing a field really does
 * clear it instead of leaving the old value to come back on refresh.
 */
export const writeSignupDraft = ({ formData, emailVerified } = {}) => {
  const remembered = rememberable(formData);
  const worthKeeping = emailVerified === true || Object.values(remembered).some(holdsSomething);

  try {
    if (!worthKeeping) {
      sessionStorage.removeItem(DRAFT_KEY);
      return;
    }
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ formData: remembered, emailVerified: emailVerified === true })
    );
  } catch {
    // Storage blocked or full. The flow carries on from memory, and a refresh
    // starts over with the note the guard already gives for that case.
  }
};

/** Drop the remembered answers, leaving nothing for the next signup in this tab. */
export const clearSignupDraft = () => {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Nothing readable, so nothing to clear.
  }
};

/* ── The picked photos ──────────────────────────────────────────────────── */

const DB_NAME = "rapidstylers-signup";
const DB_VERSION = 1;
const PHOTO_STORE = "photos";

/** The two photos the flow picks, and the keys they are stored under. */
export const PHOTO_KEYS = ["profileImageFile", "identificationImageFile"];

/**
 * A storage call must never hold the wizard open. A browser that never answers an
 * IndexedDB request (a version change blocked by another tab is the usual cause)
 * would otherwise leave the last step waiting on it forever, so the read gives up
 * and reports what it has: no photos, which keeps the professional on the step
 * that needs them rather than stranding them on a spinner.
 */
const OPEN_TIMEOUT_MS = 800;

const openPhotoDb = () =>
  new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(null);

    let settled = false;
    let timer;
    const settle = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    timer = setTimeout(() => settle(null), OPEN_TIMEOUT_MS);

    let request;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      return settle(null);
    }

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PHOTO_STORE)) db.createObjectStore(PHOTO_STORE);
    };
    request.onsuccess = () => settle(request.result);
    request.onerror = () => settle(null);
    request.onblocked = () => settle(null);
  });

/**
 * The photos picked before the reload, keyed the way the flow holds them.
 *
 * A photo that comes back as a bare Blob rather than a File is still usable, so it
 * is wrapped with a name and type instead of being dropped.
 */
export const readSignupPhotos = async () => {
  const db = await openPhotoDb();
  if (!db) return {};

  return new Promise((resolve) => {
    const found = {};
    let tx;
    try {
      tx = db.transaction(PHOTO_STORE, "readonly");
    } catch {
      return resolve({});
    }

    const store = tx.objectStore(PHOTO_STORE);
    PHOTO_KEYS.forEach((key) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const value = request.result;
        if (value instanceof File) found[key] = value;
        else if (value instanceof Blob) {
          found[key] = new File([value], `${key}.png`, { type: value.type || "image/png" });
        }
      };
    });

    // A transaction that fails or aborts leaves the step without its photos, which
    // is the truth about what this browser can offer the professional.
    tx.oncomplete = () => resolve(found);
    tx.onerror = () => resolve(found);
    tx.onabort = () => resolve(found);
  });
};

/** Keep the currently picked photos, deleting any slot that was cleared. */
export const saveSignupPhotos = async (files = {}) => {
  const db = await openPhotoDb();
  if (!db) return false;

  return new Promise((resolve) => {
    let tx;
    try {
      tx = db.transaction(PHOTO_STORE, "readwrite");
    } catch {
      return resolve(false);
    }

    const store = tx.objectStore(PHOTO_STORE);
    PHOTO_KEYS.forEach((key) => {
      const file = files?.[key];
      if (file instanceof Blob) store.put(file, key);
      else store.delete(key);
    });

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => resolve(false);
    tx.onabort = () => resolve(false);
  });
};

/** Drop the stored photos, so a finished signup leaves no images behind. */
export const clearSignupPhotos = async () => {
  const db = await openPhotoDb();
  if (!db) return false;

  return new Promise((resolve) => {
    let tx;
    try {
      tx = db.transaction(PHOTO_STORE, "readwrite");
    } catch {
      return resolve(false);
    }

    tx.objectStore(PHOTO_STORE).clear();
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => resolve(false);
    tx.onabort = () => resolve(false);
  });
};
