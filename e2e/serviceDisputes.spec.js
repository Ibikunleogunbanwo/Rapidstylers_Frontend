const { test, expect } = require("@playwright/test");

// Drive the service-dispute flows against the production build with every
// external call intercepted. These prove the UI contract only; they do not
// establish live backend, payout or refund correctness.
const appointment = (overrides = {}) => ({
  appointmentId: "completed-1",
  statusCode: "0",
  status: "COMPLETED",
  appointmentDate: "2026-10-09",
  arrivalTime: "12:30",
  price: "60.00",
  stylerData: { businessName: "Test Salon", timeZone: "America/Edmonton", province: "Alberta" },
  subServiceData: { name: "Test Haircut" },
  ...overrides,
});

const disputeRow = {
  appointmentId: "dispute-1",
  userId: "customer-1",
  stylerId: "stylist-1",
  appointmentDate: "2026-10-09",
  arrivalTime: "12:30",
  completedAt: "2026-10-09T13:30",
  disputedAt: "2026-10-09T14:00",
  reason: "Service never happened",
  paymentStatus: "CAPTURED",
};

test.beforeEach(async ({ page }) => {
  await page.route("**/*", route => {
    const url = new URL(route.request().url());
    if (url.origin === "http://127.0.0.1:4173") return route.continue();
    if (url.origin !== "https://api.rapidstylers.ca") return route.abort();
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204 });
    const path = url.pathname.split("/rapid_stylers")[1];
    let data = [];
    let extra = {};
    if (path === "/sign_in") {
      const email = route.request().postDataJSON().emailAddress;
      const role = email.startsWith("admin") ? "ADMIN" : email.startsWith("styler") ? "STYLER" : "CUSTOMER";
      data = { role, account: { userId: "test-customer", firstname: "Test", emailAddress: email } };
      extra = { token: `functional-${role}`, refreshToken: "functional-refresh" };
    } else if (path === "/user_data") {
      data = { userData: { userId: "test-customer", firstname: "Test", lastname: "Client" } };
    }
    return route.fulfill({ status: 200, json: { statusCode: "200", data, ...extra } });
  });
});

const signIn = async (page, email) => {
  await page.goto("/login");
  await page.getByLabel("Email address", { exact: false }).fill(email);
  await page.getByLabel("Password:", { exact: true }).fill("TestPassword123!");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
};

test("customer reports a completed appointment, which sends once and shows under review", async ({ page }) => {
  await page.route("**/user_appointments", route => route.fulfill({ status: 200, json: { statusCode: "200", data: [appointment({ disputeWindowEndsAt: "2030-01-01T12:00:00" })] } }));
  const sent = [];
  await page.route("**/dispute_service", route => {
    sent.push(route.request().postDataJSON());
    return route.fulfill({ status: 200, json: { statusCode: "200", data: [] } });
  });
  await signIn(page, "customer@example.test");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("Did this appointment happen?")).toBeVisible();
  await page.getByRole("button", { name: "Report a problem" }).click();
  await page.getByLabel("What went wrong?").fill("Stylist never arrived");
  await page.getByRole("button", { name: "Send report" }).click();
  await expect(page.getByRole("status")).toContainText("under review");
  expect(sent).toEqual([{ appointmentId: "completed-1", reason: "Stylist never arrived" }]);
  await expect(page.getByRole("button", { name: "Report a problem" })).toHaveCount(0);
});

test("customer sees the resolution note and date for a resolved dispute", async ({ page }, info) => {
  await page.route("**/user_appointments", route => route.fulfill({
    status: 200,
    json: {
      statusCode: "200",
      data: [appointment({
        disputeWindowEndsAt: null,
        serviceDisputeStatus: "RESOLVED",
        serviceDisputeReason: "Stylist never arrived",
        serviceDisputeResolutionNote: "Refunded you in full and reviewed the professional.",
        serviceDisputeResolvedAt: "2026-10-09",
      })],
    },
  }));
  await signIn(page, "customer@example.test");
  await expect(page).toHaveURL(/\/dashboard$/);
  const panel = page.getByRole("status");
  await expect(panel).toContainText("Your service dispute has been resolved.");
  await expect(panel).toContainText("What you told us: Stylist never arrived");
  await expect(panel).toContainText("Our response: Refunded you in full and reviewed the professional.");
  await expect(panel).toContainText("Resolved on 2026-10-09");
  await page.screenshot({ path: info.outputPath(`dispute-resolved-${info.project.name}.png`), fullPage: true });
});

test("admin resolves a service dispute from the queue and the queue refreshes", async ({ page }) => {
  let listCalls = 0;
  await page.route("**/admin/service_disputes", route => {
    listCalls += 1;
    return route.fulfill({ status: 200, json: { statusCode: "200", data: listCalls === 1 ? [disputeRow] : [] } });
  });
  const resolved = [];
  await page.route("**/admin/resolve_service_dispute", route => {
    resolved.push(route.request().postDataJSON());
    return route.fulfill({ status: 200, json: { statusCode: "200", data: { appointmentId: "dispute-1" } } });
  });
  await signIn(page, "admin@example.test");
  await expect(page).toHaveURL(/\/admin\/categories$/);
  await page.goto("/admin/payments");
  await page.getByRole("button", { name: "Disputes" }).click();
  await expect(page.getByText("Service never happened")).toBeVisible();
  await page.getByRole("button", { name: "Resolve dispute" }).click();
  await page.getByLabel("Resolution note").fill("Refunded and resolved.");
  await page.getByLabel("Any refund owed to the customer has been completed").check();
  await page.getByRole("button", { name: "Confirm resolve" }).click();
  await expect(page.getByText("No service disputes.")).toBeVisible();
  expect(resolved).toEqual([{ appointmentId: "dispute-1", note: "Refunded and resolved." }]);
  expect(listCalls).toBe(2);
});

test("admin sends an unpaid payout from the queue and sees the backend hold reply", async ({ page }) => {
  const payoutRow = { appointmentId: "payout-1", stylerId: "stylist-1", businessName: "Test Salon", completedAt: "2026-10-08T10:00", stylistShare: "$40.00", reason: "NO_PAYOUT_ACCOUNT", connectStatus: "PENDING", canReceivePayouts: false };
  let listCalls = 0;
  await page.route("**/admin/unpaid_payouts", route => {
    listCalls += 1;
    return route.fulfill({ status: 200, json: { statusCode: "200", data: [payoutRow] } });
  });
  const paid = [];
  await page.route("**/admin/pay_stylist_now", route => {
    paid.push(route.request().postDataJSON());
    return route.fulfill({ status: 200, json: { statusCode: "200", message: "The stylist has no payout account yet; it will be sent once they finish payout setup", data: { appointmentId: "payout-1" } } });
  });
  await signIn(page, "admin@example.test");
  await expect(page).toHaveURL(/\/admin\/categories$/);
  await page.goto("/admin/payments");
  await page.getByRole("button", { name: "Unpaid payouts" }).click();
  await expect(page.getByText("Test Salon")).toBeVisible();
  await expect(page.getByText("No payout account yet")).toBeVisible();
  await page.getByRole("button", { name: "Pay now" }).click();
  await page.getByRole("button", { name: "Confirm payout" }).click();
  await expect(page.getByRole("status")).toContainText("it will be sent once they finish payout setup");
  expect(paid).toEqual([{ appointmentId: "payout-1" }]);
  expect(listCalls).toBe(2);
});
