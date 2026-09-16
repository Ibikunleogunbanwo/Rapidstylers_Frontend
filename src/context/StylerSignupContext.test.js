/**
 * The signup context is the seam between the wizard's memory and its storage.
 *
 * Every step reads its answers from here and writes them back here, so this is
 * where "the answers survive a reload" is either true or not. These tests hold the
 * four promises the flow depends on: the typed answers are in hand on the very
 * first render (the guard in the shell decides before it paints, so a tick of delay
 * would send a returning professional back to step 1), changes are written as they
 * happen, the two photos come back out of IndexedDB, and a completed signup leaves
 * nothing behind for the next person to sign up in this tab.
 *
 * The photo cases install the same stand-in store the draft tests use, because
 * jsdom has no IndexedDB of its own.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StylerSignupProvider, useStylerSignup } from "./StylerSignupContext";
import { DRAFT_KEY, readSignupDraft, saveSignupPhotos } from "../utils/signupDraft";

/** The same stand-in the draft tests use: one object store, faithful ordering. */
const installFakeIndexedDb = () => {
  const rows = new Map();

  const db = {
    objectStoreNames: { contains: () => true },
    transaction: () => {
      const tx = {
        objectStore: () => ({
          put: (value, key) => {
            rows.set(key, value);
          },
          get: (key) => {
            const request = {};
            queueMicrotask(() => {
              request.result = rows.get(key);
              request.onsuccess?.();
            });
            return request;
          },
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

/**
 * A store that accepts the request and never answers it, which is how a browser
 * behaves when a version change is blocked by another tab.
 */
const installUnresponsiveIndexedDb = () => {
  globalThis.indexedDB = { open: () => ({}) };
};

/**
 * Stands in for a step of the wizard: reads what the flow is holding, and offers a
 * control for each way the flow writes to it.
 */
const Probe = () => {
  const {
    formData,
    updateData,
    imageFiles,
    updateImageFiles,
    emailVerified,
    markEmailVerified,
    restoringPhotos,
    forgetSignupDraft,
  } = useStylerSignup();

  return (
    <div>
      <p data-testid="firstname">{formData.firstname || "(empty)"}</p>
      <p data-testid="emailVerified">{String(emailVerified)}</p>
      <p data-testid="profilePhoto">{imageFiles.profileImageFile?.name || "(none)"}</p>
      <p data-testid="restoringPhotos">{String(restoringPhotos)}</p>
      <button onClick={() => updateData({ firstname: "Ada" })}>answer</button>
      <button onClick={markEmailVerified}>verify</button>
      <button
        onClick={() => updateImageFiles({ profileImageFile: new File(["p"], "me.png") })}
      >
        pick
      </button>
      <button onClick={forgetSignupDraft}>forget</button>
    </div>
  );
};

const renderFlow = () =>
  render(
    <StylerSignupProvider>
      <Probe />
    </StylerSignupProvider>
  );

const settled = () =>
  waitFor(() => expect(screen.getByTestId("restoringPhotos")).toHaveTextContent("false"));

describe("signup answers across a reload", () => {
  afterEach(() => {
    sessionStorage.clear();
    delete globalThis.indexedDB;
  });

  it("starts a returning professional on the answers they already gave", () => {
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        formData: { firstname: "Ada", city: "Calgary" },
        emailVerified: true,
      })
    );

    renderFlow();

    // On the first render, not after an effect: the shell's guard runs before it
    // paints, so anything later than this is a bounce back to step 1.
    expect(screen.getByTestId("firstname")).toHaveTextContent("Ada");
    expect(screen.getByTestId("emailVerified")).toHaveTextContent("true");
  });

  it("gives a draft from an older flow the shape of today's answers", () => {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ formData: { firstname: "Ada" } }));

    renderFlow();

    // A field the draft predates still exists in the context, because the steps read
    // it rather than assuming it, and nothing arrives as undefined.
    expect(screen.getByTestId("emailVerified")).toHaveTextContent("false");
  });

  it("writes each answer as it changes, so the next reload has it", async () => {
    renderFlow();
    await settled();

    fireEvent.click(screen.getByRole("button", { name: "answer" }));
    fireEvent.click(screen.getByRole("button", { name: "verify" }));

    await waitFor(() => expect(readSignupDraft()?.formData.firstname).toBe("Ada"));
    expect(readSignupDraft()?.emailVerified).toBe(true);
  });

  it("leaves no draft behind for a visitor who only looked at the page", async () => {
    renderFlow();
    await settled();

    expect(sessionStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it("restores the photos picked before the reload", async () => {
    const fake = installFakeIndexedDb();
    await saveSignupPhotos({ profileImageFile: new File(["bytes"], "me.png", { type: "image/png" }) });

    renderFlow();

    await waitFor(() => expect(screen.getByTestId("profilePhoto")).toHaveTextContent("me.png"));
    expect(screen.getByTestId("restoringPhotos")).toHaveTextContent("false");
    expect(fake.rows.size).toBe(1);
  });

  it("says it is still restoring rather than judging the step without the photos", () => {
    installUnresponsiveIndexedDb();

    renderFlow();

    // This is the state the shell keys its waiting on: without it the guard would
    // read an empty photo set and send a professional back to the photos step just
    // as their photos were arriving.
    expect(screen.getByTestId("restoringPhotos")).toHaveTextContent("true");
    expect(screen.getByTestId("profilePhoto")).toHaveTextContent("(none)");
  });

  it("gives up on a store that never answers, rather than hanging the wizard", async () => {
    installUnresponsiveIndexedDb();

    renderFlow();

    // A browser that never answers must cost the professional their photos, not the
    // page: the read reports nothing and the photos step stays theirs to redo.
    await waitFor(
      () => expect(screen.getByTestId("restoringPhotos")).toHaveTextContent("false"),
      { timeout: 2500 }
    );
  });

  it("does not wipe the stored photos it is about to restore", async () => {
    const fake = installFakeIndexedDb();
    await saveSignupPhotos({ profileImageFile: new File(["bytes"], "me.png", { type: "image/png" }) });

    renderFlow();
    await settled();

    // The mount render holds no files, so an unguarded write here would have deleted
    // the very photos on their way back.
    expect(fake.rows.size).toBe(1);
  });

  it("forgets a finished signup, in both stores", async () => {
    const fake = installFakeIndexedDb();
    renderFlow();
    await settled();

    fireEvent.click(screen.getByRole("button", { name: "answer" }));
    fireEvent.click(screen.getByRole("button", { name: "pick" }));
    await waitFor(() => expect(sessionStorage.getItem(DRAFT_KEY)).not.toBeNull());
    await waitFor(() => expect(fake.rows.size).toBe(1));

    fireEvent.click(screen.getByRole("button", { name: "forget" }));

    // Nothing left for the next professional to find: no answers, and no ID photo
    // sitting in the browser for the life of the tab.
    await waitFor(() => expect(sessionStorage.getItem(DRAFT_KEY)).toBeNull());
    await waitFor(() => expect(fake.rows.size).toBe(0));
  });
});
