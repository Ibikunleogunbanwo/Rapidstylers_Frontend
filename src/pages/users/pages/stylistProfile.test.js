import { render, screen, fireEvent, within } from "@testing-library/react";
import StylistProfile from "./stylistProfile";
// Resolves to the vi.mock() below (hoisted).
import { APIService } from "../../../hooks/remote/apiService";

vi.mock("react-router-dom", () => ({
  useParams: () => ({ stylerId: btoa("S1"), stylerName: btoa("Pro One") }),
  // BackHome and Footer render Links; pageSections and SectionPager stay real.
  Link: ({ to, children }) => <a href={to}>{children}</a>,
}));
vi.mock("../userLayout/functionalEffects", () => ({
  useSingleStylerProfile: vi.fn(),
}));
vi.mock("react-redux", () => ({
  useSelector: () => ({ loading: false }),
  useDispatch: () => vi.fn(),
}));
vi.mock("../../../components/spinner", () => ({ default: () => null }));
vi.mock("../../../components/footer", () => ({ default: () => <footer data-testid="footer" /> }));
vi.mock("../../../components/goBack", () => ({ default: () => <div data-testid="back" /> }));
vi.mock("../../../components/selectService", () => ({ default: () => null }));
vi.mock("../../../utils/constant", () => ({
  // Mirror the real implementations' sessionStorage behavior so tests can
  // drive signed-in/role state by seeding storage directly.
  getAuthToken: () => sessionStorage.getItem("rapidstylers_auth_token"),
  getUserRole: () => sessionStorage.getItem("rapidstylers_user_role") || "",
  showErrorToastMessage: vi.fn(),
  showSuccessToastMessage: vi.fn(),
  // userReducer is in this page's import graph and evaluates
  // retrieveFromLocalStorage(...) at module scope (initialState).
  retrieveFromLocalStorage: () => ({}),
  setAuthToken: vi.fn(),
  setRefreshToken: vi.fn(),
  setUserRole: vi.fn(),
  clearAllSessionTokens: vi.fn(),
  getRefreshToken: () => null,
}));
vi.mock("../../../hooks/remote/apiService", () => ({
  APIService: { listSavedStylists: vi.fn(), saveStylist: vi.fn(), removeSavedStylist: vi.fn() },
}));

import { useSingleStylerProfile } from "../userLayout/functionalEffects";

const portfolio = (n) =>
  Array.from({ length: n }, (_, i) => ({ imageUrl: `https://img.example/${i}.jpg`, name: `img-${i + 1}` }));
const reviews = (n) =>
  Array.from({ length: n }, (_, i) => ({
    userName: `User ${i + 1}`,
    ratingScore: "5",
    message: `msg-${i + 1}`,
  }));

const renderProfile = (overrides = {}) => {
  useSingleStylerProfile.mockReturnValue({
    stylerInformation: { reviewCount: 6, averageRating: "4.5", payoutReady: true },
    stylerPortfolio: portfolio(12),
    stylerReviews: reviews(6),
    availability: [],
    stylerSubService: [],
    ...overrides,
  });
  return render(
    <StylistProfile />
  );
};

describe("StylistProfile portfolio + reviews pagination", () => {
  test("paginates the portfolio at 9 per page", () => {
    renderProfile();

    // Page 1 shows 9 of 12 images, labeled with the visible range.
    expect(screen.getAllByAltText(/^img-/)).toHaveLength(9);
    expect(screen.getByText("Showing 1–9 of 12")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /next/i })[0]);
    expect(screen.getAllByAltText(/^img-/)).toHaveLength(3);
    expect(screen.getByText("Showing 10–12 of 12")).toBeInTheDocument();
    expect(screen.getByAltText("img-12")).toBeInTheDocument();
  });

  test("paginates the reviews at 5 per page", () => {
    renderProfile();

    // Page 1 shows 5 of 6 reviews, labeled with the visible range.
    expect(screen.getAllByText(/^msg-/)).toHaveLength(5);
    expect(screen.getByText("User 1")).toBeInTheDocument();
    expect(screen.getByText("Showing 1–5 of 6")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /next/i })[1]);
    expect(screen.getAllByText(/^msg-/)).toHaveLength(1);
    expect(screen.getByText("msg-6")).toBeInTheDocument();
    expect(screen.getByText("User 6")).toBeInTheDocument();
    expect(screen.getByText("Showing 6–6 of 6")).toBeInTheDocument();
  });

  test("hides the pager when a section fits on one page", () => {
    renderProfile({
      stylerPortfolio: portfolio(5),
      stylerReviews: reviews(3),
    });

    expect(screen.getAllByAltText(/^img-/)).toHaveLength(5);
    expect(screen.getAllByText(/^msg-/)).toHaveLength(3);
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
  });

  test("names the empty portfolio instead of leaving a bare heading", () => {
    renderProfile({ stylerPortfolio: [] });

    expect(screen.getByText("Recent work")).toBeInTheDocument();
    expect(
      screen.getByText("This professional has not published work photos yet.")
    ).toBeInTheDocument();
    expect(screen.queryByAltText(/^img-/)).not.toBeInTheDocument();
  });

  test("opens the lightbox full-size when a portfolio photo is clicked", () => {
    renderProfile();

    // Click the third photo on page 1.
    fireEvent.click(screen.getAllByAltText(/^img-/)[2]);
    const dialog = screen.getByRole("dialog", { name: "Portfolio photo viewer" });
    expect(within(dialog).getByAltText("img-3")).toBeInTheDocument();
    expect(within(dialog).getByText("3 / 12")).toBeInTheDocument();
  });

  test("lightbox next/prev navigates across the whole set and wraps around", () => {
    renderProfile();

    // Open the last photo on page 1 (index 8).
    fireEvent.click(screen.getAllByAltText(/^img-/)[8]);
    let dialog = screen.getByRole("dialog", { name: "Portfolio photo viewer" });
    expect(within(dialog).getByText("9 / 12")).toBeInTheDocument();

    // Next crosses into page 2's first photo without changing the gallery page.
    fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
    dialog = screen.getByRole("dialog", { name: "Portfolio photo viewer" });
    expect(within(dialog).getByAltText("img-10")).toBeInTheDocument();
    expect(within(dialog).getByText("10 / 12")).toBeInTheDocument();
    // The gallery underneath is still on page 1 (only the thumbnails).
    const galleryThumbs = screen
      .getAllByAltText(/^img-/)
      .filter((el) => el.className.includes("aspect-square"));
    expect(galleryThumbs).toHaveLength(9);
    expect(galleryThumbs[8]).toHaveAttribute("alt", "img-9");

    // Prev goes back.
    fireEvent.click(screen.getByRole("button", { name: "Previous photo" }));
    expect(within(screen.getByRole("dialog")).getByAltText("img-9")).toBeInTheDocument();

    // Wrap around: next from the last photo lands on the first.
    fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
    expect(within(screen.getByRole("dialog")).getByText("10 / 12")).toBeInTheDocument();
  });

  test("lightbox closes via close button, Escape, and click-outside", () => {
    renderProfile();

    fireEvent.click(screen.getAllByAltText(/^img-/)[0]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Escape key.
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Re-open, then close via the close button.
    fireEvent.click(screen.getAllByAltText(/^img-/)[0]);
    fireEvent.click(screen.getByRole("button", { name: "Close photo viewer" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Re-open, then click the dark backdrop (outside the image).
    fireEvent.click(screen.getAllByAltText(/^img-/)[0]);
    fireEvent.click(screen.getByRole("dialog"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("lightbox arrow keys navigate photos", () => {
    renderProfile();

    fireEvent.click(screen.getAllByAltText(/^img-/)[0]);
    expect(within(screen.getByRole("dialog")).getByText("1 / 12")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(within(screen.getByRole("dialog")).getByText("2 / 12")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(within(screen.getByRole("dialog")).getByText("1 / 12")).toBeInTheDocument();
  });
});

describe("No-services empty state", () => {
  test("a visitor sees an honest message and a way out, not a dead end", () => {
    sessionStorage.removeItem("rapidstylers_auth_token");
    renderProfile({
      stylerInformation: {
        reviewCount: 0, averageRating: "0", payoutReady: true,
        serviceTypeId: "2", serviceTypeName: "Eyelash Technician",
      },
      stylerSubService: [],
    });

    expect(screen.getByText("Nothing bookable yet")).toBeInTheDocument();
    expect(screen.getByText(/hasn't added services yet/i)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Browse other eyelash technicians/i });
    expect(link.getAttribute("href")).toBe(
      "/search?serviceTypeId=2&serviceTypeName=Eyelash%20Technician"
    );
  });

  test("without a category the card still offers the generic search exit", () => {
    sessionStorage.removeItem("rapidstylers_auth_token");
    renderProfile({
      stylerInformation: { reviewCount: 0, averageRating: "0", payoutReady: true },
      stylerSubService: [],
    });

    const link = screen.getByRole("link", { name: "Browse professionals" });
    expect(link.getAttribute("href")).toBe("/search");
  });

  test("a signed-in stylist sees the owner action instead", () => {
    sessionStorage.setItem("rapidstylers_auth_token", "styler-jwt");
    sessionStorage.setItem("rapidstylers_user_role", "STYLER");
    // With a token present the save-bookmark effect really fires.
    APIService.listSavedStylists.mockResolvedValue({ data: { data: [] } });
    try {
      renderProfile({
        stylerInformation: { reviewCount: 0, averageRating: "0", payoutReady: true, serviceTypeName: "Barber" },
        stylerSubService: [],
      });

      expect(screen.getByText(/You have no services listed/i)).toBeInTheDocument();
      const link = screen.getByRole("link", { name: /Add your first service/i });
      expect(link.getAttribute("href")).toBe("/styler-dashboard/services");
      // The visitor exit must NOT render for the owner view.
      expect(screen.queryByRole("link", { name: /Browse other/i })).not.toBeInTheDocument();
    } finally {
      sessionStorage.clear();
    }
  });
});

describe("StylistProfile names the vendor's time zone on working hours", () => {
  test("the hours card labels its windows with the stylist's zone", () => {
    renderProfile({
      stylerInformation: {
        reviewCount: 6, averageRating: "4.5", payoutReady: true,
        province: "British Columbia", timeZone: "America/Vancouver",
      },
      availability: [{ dayOfWeek: 2, startTime: "09:00", endTime: "17:00" }],
    });

    expect(screen.getByText(/Book during these weekly windows \(Pacific Time\)/)).toBeInTheDocument();
  });

  test("an Alberta stylist (or any default) reads Mountain Time", () => {
    renderProfile({
      stylerInformation: { reviewCount: 6, averageRating: "4.5", payoutReady: true, province: "Alberta" },
      availability: [{ dayOfWeek: 5, startTime: "10:00", endTime: "18:00" }],
    });

    expect(screen.getByText(/Book during these weekly windows \(Mountain Time\)/)).toBeInTheDocument();
  });
});

// A badge is a claim the marketplace makes about a real person, so the header
// renders only what the server proved, and only what the client can explain.
describe("StylistProfile badges", () => {
  const unreviewed = (dateRegistered) => ({
    reviewCount: 0, averageRating: "0", payoutReady: true, dateRegistered,
  });
  const chip = (label) => {
    const row = screen.queryByTestId("profile-badges");
    return row ? within(row).queryByText(label) : null;
  };

  test("is rated when there are reviews, with no badge to add", () => {
    renderProfile();

    expect(screen.getByText("Rated 4.5 out of 5 from 6 reviews")).toBeInTheDocument();
    expect(screen.queryByTestId("profile-badges")).not.toBeInTheDocument();
  });

  test("shows no chips when the server proved nothing", () => {
    renderProfile({ stylerInformation: unreviewed("2026-09-15") });

    expect(screen.getByText("No reviews yet")).toBeInTheDocument();
    expect(screen.queryByTestId("profile-badges")).not.toBeInTheDocument();
  });

  test("renders each earned badge with the reason behind it", () => {
    renderProfile({ badges: ["TOP_RATED", "FIRST_BOOKING"] });

    expect(chip("Top rated")).toBeInTheDocument();
    // The hint is what makes the chip inspectable rather than decorative.
    expect(chip("Top rated").getAttribute("title")).toMatch(/4\.7/);
    expect(chip("First booking completed")).toBeInTheDocument();
    expect(chip("First booking completed").getAttribute("title")).toMatch(/finished a booking/i);
  });

  test("carries the New claim on the chip, not in the rating line", () => {
    renderProfile({ stylerInformation: unreviewed("2026-09-15"), badges: ["NEW"] });

    expect(chip("New")).toBeInTheDocument();
    expect(screen.getByText("No reviews yet")).toBeInTheDocument();
    // The line no longer claims newness, and nothing anywhere claims it twice.
    expect(screen.queryByText("New on RapidStylers")).not.toBeInTheDocument();
  });

  test("drops a code it cannot explain instead of printing it raw", () => {
    renderProfile({ stylerInformation: unreviewed("2026-09-15"), badges: ["MYSTERY_BADGE"] });

    expect(screen.queryByTestId("profile-badges")).not.toBeInTheDocument();
    expect(screen.queryByText("MYSTERY_BADGE")).not.toBeInTheDocument();
  });

  test("survives a badge payload that is not a list", () => {
    renderProfile({ stylerInformation: unreviewed("2026-09-15"), badges: "TOP_RATED" });

    expect(screen.queryByTestId("profile-badges")).not.toBeInTheDocument();
  });

  // The value sits above its label inside each stat cell. Scoped to the stats
  // grid, because "Reviews" is also the heading of the reviews section below.
  const statValue = (label) =>
    within(screen.getByTestId("profile-stats")).getByText(label).parentElement
      .firstElementChild.textContent;

  test("reports no track record as '-' rather than a verdict of zero", () => {
    renderProfile({ stylerInformation: unreviewed("2024-09-15"), ratingPercentage: "0" });

    expect(statValue("Success rate")).toBe("-");
    expect(statValue("Average rating")).toBe("-");
    // "none yet" is what the appointment tally means, so it stays a number.
    expect(statValue("Appointments")).toBe("0");
    expect(statValue("Reviews")).toBe("0");
  });

  test("still shows the real track record once there are reviews", () => {
    renderProfile({ ratingPercentage: "86" });

    expect(statValue("Success rate")).toBe("86%");
    expect(statValue("Average rating")).toBe("4.5");
    expect(statValue("Reviews")).toBe("6");
  });
});

// The profile is where the mismatch was most visible: a page listing Tuesday and
// Saturday hours, with a badge claiming the professional was online. The hours
// win, and presence is said plainly beside them.
describe("StylistProfile open state", () => {
  const vendorNow = () => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Edmonton",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
    const get = (type) => (parts.find((part) => part.type === type) || {}).value;
    const weekday = { Sun: "0", Mon: "1", Tue: "2", Wed: "3", Thu: "4", Fri: "5", Sat: "6" }[get("weekday")];
    return { weekday, minutes: (Number(get("hour")) % 24) * 60 + Number(get("minute")) };
  };
  const hhmm = (minutes) =>
    `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  const unreviewed = { reviewCount: 0, averageRating: "0", payoutReady: true, timeZone: "America/Edmonton" };

  test("is judged on the professional's clock, and says when they close", () => {
    const { weekday, minutes } = vendorNow();
    renderProfile({
      stylerInformation: unreviewed,
      // A window around the professional's own now, so the assertion does not
      // depend on when the suite runs.
      availability: [
        { dayOfWeek: weekday, startTime: hhmm(Math.max(0, minutes - 60)), endTime: hhmm(Math.min(1439, minutes + 60)) },
      ],
    });

    expect(screen.getByText("Open now")).toBeInTheDocument();
    expect(screen.getByText(/Closes /)).toBeInTheDocument();
  });

  test("says they are closed and why, rather than staying silent", () => {
    renderProfile({ stylerInformation: unreviewed });

    expect(screen.getByText("Closed")).toBeInTheDocument();
    expect(screen.getByText("No weekly hours set")).toBeInTheDocument();
  });

  test("keeps a signed-in professional's presence secondary to the hours", () => {
    renderProfile({ stylerInformation: { ...unreviewed, visibilityStatus: "Online" } });

    expect(screen.getByText("Closed")).toBeInTheDocument();
    expect(screen.getByText("Online")).toBeInTheDocument();
    expect(screen.getByTitle("Signed in right now")).toBeInTheDocument();
  });

  test("marks a blocked date as closed even inside working hours", () => {
    const { weekday, minutes } = vendorNow();
    const today = new Date(
      Date.now() - new Date().getTimezoneOffset() * 60000
    );
    renderProfile({
      stylerInformation: unreviewed,
      availability: [
        { dayOfWeek: weekday, startTime: hhmm(Math.max(0, minutes - 60)), endTime: hhmm(Math.min(1439, minutes + 60)) },
      ],
      exceptions: [
        {
          blockedDate: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
            today.getDate()
          ).padStart(2, "0")}`,
        },
      ],
    });

    expect(screen.getByText("Closed")).toBeInTheDocument();
  });
});
