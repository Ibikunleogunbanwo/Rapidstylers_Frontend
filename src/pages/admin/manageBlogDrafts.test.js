/**
 * Blog drafts (A-14): the admin list reads admin/blog_posts (drafts included),
 * marks each article Draft or Published, saves with an explicit status, and
 * previews the article as readers would see it.
 */
import { render, screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { APIService } from "../../hooks/remote/apiService";
import ManageBlog from "./manageBlog";

vi.mock("../../hooks/remote/apiService", () => ({ APIService: {
  getStylerType: vi.fn(), listBlog: vi.fn(), adminBlogPosts: vi.fn(), adminCreateBlog: vi.fn(), adminUpdateBlog: vi.fn(), adminDeleteBlog: vi.fn(),
} }));

const reply = data => ({ data: { statusCode: "200", data } });
const DRAFT = { id: "11", title: "Winter braids", category: "Braiding", content: "First paragraph.\nSecond paragraph.", imageUrl: "", author: "Ada", dateCreated: "October 10, 2026", status: "DRAFT" };
const LIVE = { id: "12", title: "Summer cuts", category: "Trends", content: "Live body.", imageUrl: "", author: "", dateCreated: "October 1, 2026", status: "PUBLISHED" };
const mount = () => render(<MemoryRouter><ManageBlog /></MemoryRouter>);
const row = title => screen.getByText(title, { selector: "span" }).closest("li");

beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.setItem("rapidstylers_auth_token", "jwt");
  sessionStorage.setItem("rapidstylers_admin_role", "admin");
  APIService.getStylerType.mockResolvedValue(reply([]));
  APIService.adminBlogPosts.mockResolvedValue(reply([DRAFT, LIVE]));
  APIService.adminCreateBlog.mockResolvedValue(reply({}));
  APIService.adminUpdateBlog.mockResolvedValue(reply({}));
});
afterEach(() => { cleanup(); sessionStorage.clear(); });

it("lists drafts from the admin endpoint with a Draft or Published badge", async () => {
  mount();
  await screen.findByText("Winter braids", { selector: "span" });
  expect(APIService.adminBlogPosts).toHaveBeenCalled();
  expect(APIService.listBlog).not.toHaveBeenCalled();
  expect(within(row("Winter braids")).getByText("Draft")).toBeInTheDocument();
  expect(within(row("Summer cuts")).getByText("Published")).toBeInTheDocument();
  // A draft has no public page yet.
  expect(within(row("Winter braids")).queryByRole("link", { name: "View" })).not.toBeInTheDocument();
  expect(within(row("Summer cuts")).getByRole("link", { name: "View" })).toHaveAttribute("href", "/blog/12");
});

it("saves a new article as a draft or publishes it", async () => {
  mount();
  await screen.findByText("Winter braids", { selector: "span" });
  fireEvent.change(screen.getByLabelText("Article title"), { target: { value: "Spring looks" } });
  fireEvent.change(screen.getByLabelText("Article content"), { target: { value: "Body" } });
  fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
  await waitFor(() => expect(APIService.adminCreateBlog).toHaveBeenCalledWith({ title: "Spring looks", category: "", author: "", imageUrl: "", content: "Body", status: "DRAFT" }));
  await waitFor(() => expect(screen.getByLabelText("Article title")).toHaveValue(""));

  fireEvent.change(screen.getByLabelText("Article title"), { target: { value: "Autumn looks" } });
  fireEvent.change(screen.getByLabelText("Article content"), { target: { value: "Body" } });
  fireEvent.click(screen.getByRole("button", { name: "Publish" }));
  await waitFor(() => expect(APIService.adminCreateBlog).toHaveBeenLastCalledWith(expect.objectContaining({ title: "Autumn looks", status: "PUBLISHED" })));
});

it("keeps a draft a draft unless it is published, always sending the status", async () => {
  mount();
  await screen.findByText("Winter braids", { selector: "span" });
  fireEvent.click(within(row("Winter braids")).getByRole("button", { name: "Edit" }));
  expect(screen.queryByRole("button", { name: "Unpublish" })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Edit article title"), { target: { value: "Winter braids, updated" } });
  const editing = screen.getByLabelText("Edit article title").closest("li");
  fireEvent.click(within(editing).getByRole("button", { name: "Save draft" }));
  await waitFor(() => expect(APIService.adminUpdateBlog).toHaveBeenCalledWith(expect.objectContaining({ id: "11", title: "Winter braids, updated", status: "DRAFT" })));

  await screen.findByText("Winter braids", { selector: "span" });
  fireEvent.click(within(row("Winter braids")).getByRole("button", { name: "Edit" }));
  fireEvent.click(within(screen.getByLabelText("Edit article title").closest("li")).getByRole("button", { name: "Publish" }));
  await waitFor(() => expect(APIService.adminUpdateBlog).toHaveBeenLastCalledWith(expect.objectContaining({ id: "11", status: "PUBLISHED" })));
});

it("saves a published article as published, or unpublishes it", async () => {
  mount();
  await screen.findByText("Summer cuts", { selector: "span" });
  fireEvent.click(within(row("Summer cuts")).getByRole("button", { name: "Edit" }));
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(APIService.adminUpdateBlog).toHaveBeenCalledWith(expect.objectContaining({ id: "12", status: "PUBLISHED" })));

  await screen.findByText("Summer cuts", { selector: "span" });
  fireEvent.click(within(row("Summer cuts")).getByRole("button", { name: "Edit" }));
  fireEvent.click(screen.getByRole("button", { name: "Unpublish" }));
  await waitFor(() => expect(APIService.adminUpdateBlog).toHaveBeenLastCalledWith(expect.objectContaining({ id: "12", status: "DRAFT" })));
});

it("previews a draft as readers would see it, before publishing", async () => {
  mount();
  await screen.findByText("Winter braids", { selector: "span" });
  fireEvent.click(within(row("Winter braids")).getByRole("button", { name: "Preview" }));
  const dialog = screen.getByRole("dialog", { name: /Preview · Draft, not visible to readers yet/ });
  expect(within(dialog).getByRole("heading", { level: 1, name: "Winter braids" })).toBeInTheDocument();
  expect(within(dialog).getByText("By Ada · October 10, 2026")).toBeInTheDocument();
  expect(within(dialog).getByText("First paragraph.")).toBeInTheDocument();
  expect(within(dialog).getByText("Second paragraph.")).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole("button", { name: "Close preview" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(APIService.adminUpdateBlog).not.toHaveBeenCalled();
});

it("previews the new-article form, and says what is missing instead of previewing an empty article", async () => {
  mount();
  await screen.findByText("Winter braids", { selector: "span" });
  const form = () => within(screen.getByLabelText("Article title").closest("form"));
  fireEvent.click(form().getByRole("button", { name: "Preview" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Add a title.");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Article title"), { target: { value: "Spring looks" } });
  fireEvent.change(screen.getByLabelText("Article content"), { target: { value: "Fresh colour." } });
  fireEvent.click(form().getByRole("button", { name: "Preview" }));
  const dialog = screen.getByRole("dialog");
  expect(within(dialog).getByRole("heading", { level: 1, name: "Spring looks" })).toBeInTheDocument();
  expect(within(dialog).getByText(/By RapidStylers Team/)).toBeInTheDocument();
  expect(APIService.adminCreateBlog).not.toHaveBeenCalled();
});
