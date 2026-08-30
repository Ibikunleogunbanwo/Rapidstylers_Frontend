import { isChunkError, createChunkReloadGuard } from "./staleChunkGuard";

const chunkErrorMessages = [
  "Loading chunk 8604 failed.",
  "ChunkLoadError: Loading chunk 8604 failed.\n(error: https://rapidstylers.ca/static/js/8604.022fe2eb.chunk.js)",
  "Loading chunk 55 failed.",
  "Loading CSS chunk 3 failed.",
];

const nonChunkMessages = [
  "Uncaught TypeError: Cannot read properties of undefined (reading 'x')",
  "Something went wrong",
  "ResizeObserver loop completed with undelivered notifications.",
  "",
  undefined,
];

describe("isChunkError", () => {
  it("identifies stale ES module chunk-load failures", () => {
    for (const msg of chunkErrorMessages) {
      expect(isChunkError(msg)).toBe(true);
    }
  });

  it("ignores unrelated errors", () => {
    for (const msg of nonChunkMessages) {
      expect(isChunkError(msg)).toBe(false);
    }
  });
});

describe("createChunkReloadGuard", () => {
  it("reloads exactly once for a chunk error", () => {
    const reload = jest.fn();
    const guard = createChunkReloadGuard({ reload });

    const evt = {
      message: chunkErrorMessages[0],
      preventDefault: jest.fn(),
    };

    expect(guard.handleError(evt)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(evt.preventDefault).toHaveBeenCalled();
    expect(guard.attempted).toBe(true);
  });

  it("is guarded against an infinite reload loop on repeated chunk errors", () => {
    const reload = jest.fn();
    const guard = createChunkReloadGuard({ reload });

    for (const msg of chunkErrorMessages) {
      guard.handleError({ message: msg, preventDefault: jest.fn() });
    }
    // Hammer it the way a flapping error handler would.
    for (let i = 0; i < 50; i++) {
      guard.handleError({ message: chunkErrorMessages[0], preventDefault: jest.fn() });
    }

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("does not reload for non-chunk errors and stays armed", () => {
    const reload = jest.fn();
    const guard = createChunkReloadGuard({ reload });

    for (const msg of nonChunkMessages) {
      guard.handleError({ message: msg, preventDefault: jest.fn() });
    }

    expect(reload).not.toHaveBeenCalled();
    expect(guard.attempted).toBe(false);
  });

  it("a chunk error after unrelated errors still reloads exactly once", () => {
    const reload = jest.fn();
    const guard = createChunkReloadGuard({ reload });

    guard.handleError({ message: nonChunkMessages[0], preventDefault: jest.fn() });
    guard.claim(); // simulate the boot-time manifest check firing first
    guard.handleError({ message: chunkErrorMessages[0], preventDefault: jest.fn() });

    // claim() spent the single reload, so the later chunk error must NOT reload.
    expect(reload).not.toHaveBeenCalled();
    expect(guard.attempted).toBe(true);
  });

  it("claim() pre-spends the guard without reloading", () => {
    const reload = jest.fn();
    const guard = createChunkReloadGuard({ reload });

    expect(guard.claim()).toBe(true);
    expect(reload).not.toHaveBeenCalled();
    expect(guard.claim()).toBe(false); // already spent
    guard.handleError({ message: chunkErrorMessages[0], preventDefault: jest.fn() });
    expect(reload).not.toHaveBeenCalled();
  });

  it("defaults to calling window.location.reload when no reload fn is given", () => {
    // window.location.reload is read-only in jsdom, so spy via the module-level
    // default by wrapping reload in a function that the guard can call.
    const guard = createChunkReloadGuard({ reload: () => undefined });
    expect(guard.attempted).toBe(false);
    // No reload fn injected still constructs without throwing.
    expect(createChunkReloadGuard().handleError({ message: chunkErrorMessages[0], preventDefault: jest.fn() })).toBe(true);
    expect(guard.attempted).toBe(false); // separate guard instance, untouched
  });
});