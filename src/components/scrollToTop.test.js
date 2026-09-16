import { render, fireEvent, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import ScrollToTop from "./scrollToTop";

// ---------------------------------------------------------------------------
// A small browser model. jsdom has no layout and no scrolling, so these tests
// supply the two behaviours that matter: a scroll offset that CLAMPS to the
// document, and a `scroll` event every time the offset moves. With that in
// place the reported bug reproduces exactly — a restore that lands correctly
// and is then carried away by the layout, with the drifted value recorded as if
// the visitor had scrolled there themselves.
// ---------------------------------------------------------------------------
const VIEWPORT = 800;
const FRAME_MS = 16;
let scrollY = 0;
let docHeight = 5000;
let frames = [];
let clock = 0;

const setScrollY = (next) => {
  const max = Math.max(0, docHeight - VIEWPORT);
  scrollY = Math.min(Math.max(0, next), max);
  window.dispatchEvent(new Event("scroll"));
};

const setDocHeight = (height) => {
  docHeight = height;
};

// Frames advance a controllable clock, so the component's quiet-period rule is
// exercised in milliseconds rather than real time.
const flushFrames = (count = 1) => {
  for (let i = 0; i < count; i += 1) {
    const pending = frames;
    frames = [];
    clock += FRAME_MS;
    act(() => {
      pending.forEach((cb) => cb(clock));
    });
  }
};

beforeEach(() => {
  scrollY = 0;
  docHeight = 5000;
  frames = [];
  clock = 0;
  Object.defineProperty(window.performance, "now", { configurable: true, value: () => clock });

  Object.defineProperty(window, "innerHeight", { configurable: true, value: VIEWPORT });
  Object.defineProperty(window, "scrollY", { configurable: true, get: () => scrollY });
  Object.defineProperty(document.documentElement, "scrollHeight", {
    configurable: true,
    get: () => docHeight,
  });

  window.scrollTo = vi.fn((_x, y) => setScrollY(y));
  Element.prototype.scrollIntoView = vi.fn();
  window.history.scrollRestoration = "auto";

  vi.stubGlobal("requestAnimationFrame", (cb) => {
    frames.push(cb);
    return frames.length;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {
    frames = [];
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const BackControl = () => {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate(-1)}>
      back
    </button>
  );
};

const ForwardControl = () => {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate(1)}>
      forward
    </button>
  );
};

const renderApp = (initialEntry = "/") =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ScrollToTop />
      {/* Chrome that stays mounted on both pages, the way the real app's does. */}
      <BackControl />
      <ForwardControl />
      <Routes>
        <Route
          path="/"
          element={
            <div>
              <div id="blog" />
              <Link to="/stylistProfile/demo/demo">open profile</Link>
            </div>
          }
        />
        <Route path="/stylistProfile/:id/:name" element={<div>profile</div>} />
      </Routes>
    </MemoryRouter>
  );

const scrollToCalls = () => window.scrollTo.mock.calls.map((call) => call[1]);

// Enough frames for the target to be applied and the quiet period to elapse.
const settle = () => flushFrames(60);

describe("ScrollToTop", () => {
  test("disables native scroll restoration so the browser cannot fight it", () => {
    renderApp();
    expect(window.history.scrollRestoration).toBe("manual");
  });

  test("a link click lands the next page at the top", () => {
    const { getByText } = renderApp();
    settle();

    setScrollY(2400);
    fireEvent.click(getByText("open profile"));

    // The next page mounts short; the app must not leave us parked at 2400.
    setDocHeight(1200);
    settle();

    expect(scrollY).toBe(0);
  });

  test("Back restores the exact offset after the page grows underneath it", () => {
    const { getByText } = renderApp();
    settle();

    setScrollY(2400);
    fireEvent.click(getByText("open profile"));
    setDocHeight(1200);
    settle();

    // Back: the homepage starts short, then its images and data arrive and the
    // document grows. Scroll anchoring follows the growth, which is what used
    // to carry the visitor ~600px past the point they left.
    fireEvent.click(getByText("back"));
    flushFrames(2);
    setDocHeight(3200);
    setScrollY(scrollY + 520); // anchored +520 as the content above grows
    flushFrames(2);
    setDocHeight(5000);
    setScrollY(scrollY + 81); // anchored again as it settles
    settle();

    expect(scrollY).toBe(2400);
  });

  test("a document that holds still for a moment and then moves cannot shift the offset", () => {
    const { getByText } = renderApp();
    settle();

    setScrollY(2400);
    fireEvent.click(getByText("open profile"));
    setDocHeight(1200);
    settle();

    fireEvent.click(getByText("back"));
    setDocHeight(5000);
    // ~240ms of an unchanging document: long enough to look settled, short of
    // the quiet period. Chrome re-anchors here, a beat after the restore.
    flushFrames(15);
    setDocHeight(6000);
    setScrollY(scrollY + 524);
    settle();

    expect(scrollY).toBe(2400);
  });

  test("the drifted offset is not recorded, so a second round trip still lands exactly", () => {
    const { getByText } = renderApp();
    settle();

    const roundTrip = () => {
      setScrollY(2400);
      fireEvent.click(getByText("open profile"));
      setDocHeight(1200);
      settle();
      fireEvent.click(getByText("back"));
      flushFrames(2);
      setDocHeight(3200);
      setScrollY(scrollY + 520);
      flushFrames(2);
      setDocHeight(5000);
      setScrollY(scrollY + 81);
      settle();
    };

    roundTrip();
    expect(scrollY).toBe(2400);

    // Before the fix the anchored 3001 was saved as the visitor's position, so
    // every later Back drifted further.
    roundTrip();
    expect(scrollY).toBe(2400);

    roundTrip();
    expect(scrollY).toBe(2400);
  });

  test("a clamp on the outgoing page cannot overwrite the offset Back needs", () => {
    const { getByText } = renderApp();
    settle();

    setScrollY(2400);
    fireEvent.click(getByText("open profile"));

    // The profile page is shorter than the homepage was, so the browser clamps
    // the offset while the router is still on the homepage entry.
    setDocHeight(1200);
    setScrollY(2400);
    settle();

    fireEvent.click(getByText("back"));
    setDocHeight(5000); // the homepage renders at its full height again
    settle();

    expect(scrollY).toBe(2400);
    expect(scrollToCalls()).toContain(2400);
  });

  test("a browser back (popstate) also protects the position being left", () => {
    const { getByText } = renderApp();
    settle();

    setScrollY(2400);
    fireEvent.click(getByText("open profile"));
    setDocHeight(1200);
    settle();

    // On a real back the browser fires popstate before the router swaps pages.
    window.dispatchEvent(new Event("popstate"));
    setDocHeight(600); // the incoming page renders even shorter: browser clamps
    setScrollY(scrollY);
    fireEvent.click(getByText("back"));
    setDocHeight(5000);
    settle();

    expect(scrollY).toBe(2400);
  });

  test("a forward trip restores the position the visitor left that page at", () => {
    const { getByText } = renderApp();
    settle();

    fireEvent.click(getByText("open profile")); // profile entered at the top
    settle();

    fireEvent.click(getByText("back"));
    settle();
    expect(scrollY).toBe(0);

    fireEvent.click(getByText("forward"));
    settle();

    expect(scrollY).toBe(0);
    expect(scrollToCalls()).toContain(0);
  });

  test("user scrolling during the settle window wins over restoration", () => {
    const { getByText } = renderApp();
    settle();

    setScrollY(2400);
    fireEvent.click(getByText("open profile"));
    setDocHeight(1200);
    settle();

    fireEvent.click(getByText("back"));
    setDocHeight(5000); // the homepage renders at its full height again
    flushFrames(1);

    fireEvent.wheel(window, { deltaY: 200 });
    setScrollY(1500);
    const before = window.scrollTo.mock.calls.length;
    settle();

    expect(scrollY).toBe(1500);
    // Once the visitor takes over, the target stops being re-applied.
    expect(window.scrollTo.mock.calls.length).toBe(before);
  });

  test("a hash target is scrolled into view once it renders", () => {
    renderApp("/#blog");
    settle();

    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  test("a modified click is not treated as a same-page navigation", () => {
    const { getByText } = renderApp();
    settle();

    setScrollY(2400);
    const before = window.scrollTo.mock.calls.length;
    fireEvent.click(getByText("open profile"), { metaKey: true });
    settle();

    // No navigation happened, so the visitor's scrolling must keep being kept.
    setScrollY(1800);
    expect(scrollY).toBe(1800);
    expect(scrollToCalls().slice(before)).toEqual([]);
  });
});
