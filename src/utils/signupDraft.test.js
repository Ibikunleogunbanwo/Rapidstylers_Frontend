/**
 * What signup remembers across a reload.
 *
 * The flow collects five steps and only commits at the last one, so a refresh used
 * to cost the professional everything they had typed. This is the store that stops
 * that, and it has two halves: text in sessionStorage, photos in IndexedDB.
 *
 * The text half is asserted directly. The photo half cannot be: jsdom implements
 * neither IndexedDB nor the quota it exists to escape, so the tests install a
 * stand-in for the browser's store that follows the parts of the API this module
 * uses, including the ordering that matters (a transaction completes after its
 * requests, not before). What that pins is this module's own behaviour: which keys
 * it writes, that a cleared slot is deleted rather than left behind, and how a
 * stored value becomes a File again. The real store was exercised in a browser.
 *
 * The two things that must never happen are also here: a password reaching the
 * draft, and an unavailable store throwing the page down around the professional.
 */
import {
  DRAFT_KEY,
  clearSignupDraft,
  clearSignupPhotos,
  readSignupDraft,
  readSignupPhotos,
  saveSignupPhotos,
  writeSignupDraft,
} from "./signupDraft";

/**
 * A stand-in for IndexedDB holding one object store in a Map.
 *
 * Requests answer on a microtask and the transaction completes on a macrotask,
 * which is the real ordering: `oncomplete` runs only after every `onsuccess`.
 */
const installFakeIndexedDb = () => {
  const rows = new Map();

  const makeRequest = (settle) => {
    const request = {};
    queueMicrotask(() => {
      const result = settle();
      request.result = result;
      request.onsuccess?.();
    });
    return request;
  };

  const db = {
    objectStoreNames: { contains: () => true },
    transaction: () => {
      const tx = {
        objectStore: () => ({
          put: (value, key) => {
            rows.set(key, value);
          },
          get: (key) => makeRequest(() => rows.get(key)),
          delete: (key) => {
            rows.delete(key);
          },
          clear: () => rows.clear(),
        }),
      };
      setTimeout(() => tx.oncomplete?.(), 0);
      return tx;
    },
  };

  globalThis.indexedDB = {
    open: () => {
      const request = { result: db };
      queueMicrotask(() => {
        request.onupgradeneeded?.();
        request.onsuccess?.();
      });
      return request;
    },
  };

  return {
    rows,
    remove: () => {
      delete globalThis.indexedDB;
    },
  };
};

const photoFile = (name) => new File(["bytes"], name, { type: "image/png" });

describe("the remembered answers", () => {
  afterEach(() => {
    sessionStorage.clear();
    delete globalThis.indexedDB;
  });

  it("has nothing to read before a visitor has answered anything", () => {
    expect(readSignupDraft()).toBeNull();
  });

  it("reads back the answers it stored", () => {
    writeSignupDraft({
      formData: { firstname: "Ada", city: "Calgary", serviceTypeId: 3 },
      emailVerified: true,
    });

    expect(readSignupDraft()).toEqual({
      formData: { firstname: "Ada", city: "Calgary", serviceTypeId: 3 },
      emailVerified: true,
    });
  });

  it("never writes a password, whatever the flow hands it", () => {
    writeSignupDraft({
      formData: { firstname: "Ada", password: "hunter2" },
      emailVerified: false,
    });

    // Not "not stored under that name": gone from the stored text entirely, so a
    // field that later joins the context cannot start leaking by accident.
    expect(sessionStorage.getItem(DRAFT_KEY)).not.toContain("hunter2");
    expect(readSignupDraft().formData).not.toHaveProperty("password");
  });

  it("keeps nothing at all when there is nothing worth keeping", () => {
    writeSignupDraft({ formData: { firstname: "Ada" }, emailVerified: false });
    expect(readSignupDraft()).not.toBeNull();

    // A visitor who cleared the form, or only looked at the page: the draft goes
    // rather than sitting there as an empty shell.
    writeSignupDraft({ formData: { firstname: "", latitude: null, agreeToTerms: false } });

    expect(sessionStorage.getItem(DRAFT_KEY)).toBeNull();
    expect(readSignupDraft()).toBeNull();
  });

  it("treats a draft it cannot parse as one that was never written", () => {
    sessionStorage.setItem(DRAFT_KEY, "{not json");

    // Retyping a form beats a broken page.
    expect(readSignupDraft()).toBeNull();
  });

  it("survives a browser that refuses to answer at all", () => {
    const blocked = () => {
      throw new Error("storage is blocked");
    };
    const spies = ["getItem", "setItem", "removeItem"].map((method) =>
      vi.spyOn(Storage.prototype, method).mockImplementation(blocked)
    );

    // The failure the flow has to stay standing through: nothing to read, and no
    // throw on the way out of it either.
    expect(() => writeSignupDraft({ formData: { firstname: "Ada" } })).not.toThrow();
    expect(readSignupDraft()).toBeNull();
    expect(() => clearSignupDraft()).not.toThrow();

    spies.forEach((spy) => spy.mockRestore());
  });
});

describe("the remembered photos", () => {
  afterEach(() => {
    sessionStorage.clear();
    delete globalThis.indexedDB;
  });

  it("reports no photos, and no failure, where the browser has no store", async () => {
    // The honest answer: nothing to restore, so the photos step stays the step the
    // professional is on rather than the flow pretending it has their files.
    expect(globalThis.indexedDB).toBeUndefined();
    await expect(readSignupPhotos()).resolves.toEqual({});
    await expect(saveSignupPhotos({ profileImageFile: photoFile("me.png") })).resolves.toBe(false);
    await expect(clearSignupPhotos()).resolves.toBe(false);
  });

  it("reads a stored photo back as a File the flow can upload", async () => {
    const fake = installFakeIndexedDb();
    await saveSignupPhotos({ profileImageFile: photoFile("me.png") });

    const restored = await readSignupPhotos();

    expect(restored.profileImageFile).toBeInstanceOf(File);
    expect(restored.profileImageFile.name).toBe("me.png");
    expect(restored.profileImageFile.type).toBe("image/png");
    // Only the photo that was picked, not a slot filled in to make the shape work.
    expect(restored).not.toHaveProperty("identificationImageFile");
    expect(fake.rows.size).toBe(1);
  });

  it("stores bytes rather than the file, because WebKit cannot store a Blob", async () => {
    // Measured in WebKit 27.2, the Safari engine, at a desktop and an iPhone
    // viewport: putting a Blob or File into IndexedDB aborts the transaction with
    // "Error preparing Blob/File data to be stored in object store", so a Safari
    // professional's photos were lost on every reload while Chromium kept them.
    // Bytes are storable on every engine the flow claims to support.
    const fake = installFakeIndexedDb();
    await saveSignupPhotos({ profileImageFile: photoFile("me.png") });

    const stored = fake.rows.get("profileImageFile");
    expect(stored).not.toBeInstanceOf(Blob);
    expect(ArrayBuffer.isView(stored.bytes)).toBe(true);
    expect(stored.bytes.byteLength).toBeGreaterThan(0);
    expect(stored.name).toBe("me.png");
    expect(stored.type).toBe("image/png");

    const restored = await readSignupPhotos();
    expect(restored.profileImageFile).toBeInstanceOf(File);
    expect(restored.profileImageFile.name).toBe("me.png");
    expect(restored.profileImageFile.type).toBe("image/png");
  });

  it("wraps a bare Blob rather than dropping the bytes", async () => {
    const fake = installFakeIndexedDb();
    fake.rows.set("identificationImageFile", new Blob(["bytes"], { type: "image/jpeg" }));

    const restored = await readSignupPhotos();

    expect(restored.identificationImageFile).toBeInstanceOf(File);
    expect(restored.identificationImageFile.type).toBe("image/jpeg");
  });

  it("deletes a slot that was cleared instead of keeping the old photo", async () => {
    const fake = installFakeIndexedDb();
    await saveSignupPhotos({
      profileImageFile: photoFile("me.png"),
      identificationImageFile: photoFile("id.png"),
    });

    await saveSignupPhotos({ identificationImageFile: photoFile("id-2.png") });

    // What is stored is what the flow is holding: a replaced photo is replaced, not
    // left for a later reload to resurrect.
    expect(fake.rows.size).toBe(1);
    expect((await readSignupPhotos()).profileImageFile).toBeUndefined();
    expect((await readSignupPhotos()).identificationImageFile.name).toBe("id-2.png");
  });

  it("clears every stored photo when the signup is over", async () => {
    const fake = installFakeIndexedDb();
    await saveSignupPhotos({ profileImageFile: photoFile("me.png") });

    await expect(clearSignupPhotos()).resolves.toBe(true);

    expect(fake.rows.size).toBe(0);
    await expect(readSignupPhotos()).resolves.toEqual({});
  });
});

it('does not write or restore password, confirmation, or consent', () => {
  writeSignupDraft({ formData: { firstname: 'Ada', password: 'secret', confirmPassword: 'secret', agreeToTerms: true } });
  expect(readSignupDraft().formData).toEqual({ firstname: 'Ada' });
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ formData: { firstname: 'Ada', password: 'secret', agreeToTerms: true } }));
  expect(readSignupDraft().formData).toEqual({ firstname: 'Ada' });
});

it('keeps photo database storage separate for each tab and avoids the legacy database', async () => {
  const opened = [];
  const deleted = [];
  const original = globalThis.indexedDB;
  globalThis.indexedDB = { deleteDatabase: name => deleted.push(name), open: (name) => { opened.push(name); throw new Error('unavailable'); } };
  // Two tabs are two documents, so each gets its own module state the way a
  // second tab gets its own page: a fresh import, its own session storage.
  const freshTab = async () => { vi.resetModules(); return import('./signupDraft'); };

  sessionStorage.clear();
  await (await freshTab()).readSignupPhotos();
  const first = opened.at(-1);
  sessionStorage.clear();
  await (await freshTab()).readSignupPhotos();
  const second = opened.at(-1);
  expect(first).not.toBe('rapidstylers-signup');
  expect(second).not.toBe(first);
  expect(deleted).toEqual(['rapidstylers-signup', 'rapidstylers-signup']);
  globalThis.indexedDB = original;
  vi.resetModules();
});

it('remembers an uncertain account creation without remembering credentials', () => {
  writeSignupDraft({ formData: { emailAddress: 'ada@example.com', password: 'secret' }, creationUncertain: true });
  expect(readSignupDraft()).toMatchObject({ creationUncertain: true, formData: { emailAddress: 'ada@example.com' } });
  expect(readSignupDraft().formData.password).toBeUndefined();
});

it('claims one photo namespace however many storage calls and page events follow', async () => {
  // Measured in Chromium and WebKit, with the lock held for the document's
  // lifetime the way the flow holds it: a second `ifAvailable` claim for a name
  // this document already holds is refused, and refused again on every later
  // attempt, for as long as the document lives. Claiming per storage call is
  // therefore refused every time after the first and mints a fresh name, so the
  // read and the write land in different databases and the professional is sent
  // back to the photos step they had just completed. One claim, once.
  const requests = [];
  const held = new Set();
  const previousLocks = navigator.locks;
  Object.defineProperty(navigator, 'locks', { configurable: true, value: { request: (name, options, callback) => {
    requests.push(name);
    if (held.has(name)) return Promise.resolve(callback(null));
    held.add(name);
    return Promise.resolve(callback({ name }));
  } } });

  try {
    const fake = installFakeIndexedDb();
    sessionStorage.clear();
    vi.resetModules();
    const draft = await import('./signupDraft');

    await draft.saveSignupPhotos({ profileImageFile: photoFile('me.png') });
    await draft.readSignupPhotos();
    await draft.saveSignupPhotos({
      profileImageFile: photoFile('me.png'),
      identificationImageFile: photoFile('id.png'),
    });
    expect(requests).toHaveLength(1);

    // Coming back from the back-forward cache is this same document, so it keeps
    // the namespace it was granted instead of asking again and being refused.
    window.dispatchEvent(new Event('pagehide'));
    const shown = new Event('pageshow');
    Object.defineProperty(shown, 'persisted', { value: true });
    window.dispatchEvent(shown);
    await draft.readSignupPhotos();
    expect(requests).toHaveLength(1);

    const restored = await draft.readSignupPhotos();
    expect(restored.profileImageFile.name).toBe('me.png');
    expect(restored.identificationImageFile.name).toBe('id.png');
    fake.remove();
  } finally {
    if (previousLocks === undefined) delete navigator.locks;
    else Object.defineProperty(navigator, 'locks', { configurable: true, value: previousLocks });
    vi.resetModules();
  }
});

it('finds the photos of the previous document in this tab after a reload', async () => {
  // Measured in Chromium and WebKit across a real navigation: the previous
  // document's lock is released at pagehide, so the name it stored is granted to
  // the document that replaces it. Offering that name back rather than minting a
  // new one is what keeps a professional who refreshed from losing the photos
  // they had picked.
  const requests = [];
  const held = new Set();
  const previousLocks = navigator.locks;
  const originalIndexedDb = globalThis.indexedDB;
  Object.defineProperty(navigator, 'locks', { configurable: true, value: { request: (name, options, callback) => {
    requests.push(name);
    if (held.has(name)) return Promise.resolve(callback(null));
    held.add(name);
    window.addEventListener('pagehide', () => held.delete(name), { once: true });
    return Promise.resolve(callback({ name }));
  } } });

  try {
    installFakeIndexedDb();
    sessionStorage.clear();
    vi.resetModules();
    const before = await import('./signupDraft');
    await before.saveSignupPhotos({ profileImageFile: photoFile('me.png') });
    const storedName = sessionStorage.getItem('stylerSignupPhotoTab');
    expect(requests).toHaveLength(1);

    // The reload: this document leaves, a new one takes its place in the tab.
    window.dispatchEvent(new Event('pagehide'));
    vi.resetModules();
    const after = await import('./signupDraft');
    const restored = await after.readSignupPhotos();

    expect(requests).toHaveLength(2);
    expect(sessionStorage.getItem('stylerSignupPhotoTab')).toBe(storedName);
    expect(restored.profileImageFile.name).toBe('me.png');
  } finally {
    if (previousLocks === undefined) delete navigator.locks;
    else Object.defineProperty(navigator, 'locks', { configurable: true, value: previousLocks });
    if (originalIndexedDb === undefined) delete globalThis.indexedDB;
    else globalThis.indexedDB = originalIndexedDb;
    sessionStorage.clear();
    vi.resetModules();
  }
});
