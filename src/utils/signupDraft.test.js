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
