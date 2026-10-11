import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import UserTopBar from "./topBar";

test("customer logo navigates to the public home page", async () => {
  render(<MemoryRouter initialEntries={["/dashboard"]}><Routes>
    <Route path="/dashboard" element={<UserTopBar toggleSideBar={() => {}} />} />
    <Route path="/" element={<h1>Home page</h1>} />
  </Routes></MemoryRouter>);
  await userEvent.click(screen.getByRole("link", {name:"RapidStylers home"}));
  expect(await screen.findByRole("heading", {name:"Home page"})).toBeInTheDocument();
});
