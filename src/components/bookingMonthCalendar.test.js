import { render, screen, fireEvent } from "@testing-library/react";
import BookingMonthCalendar from "./bookingMonthCalendar";

const renderCalendar = (props = {}) => {
  const onSelectDay = vi.fn();
  render(
    <BookingMonthCalendar
      year={2026}
      monthIndex={9}
      today={{ year: 2026, month: 9, day: 22 }}
      selectedDay={null}
      onSelectDay={onSelectDay}
      isWeekdayOpen={(weekday) => weekday !== 1}
      isDateBlocked={(key) => key === "2026-10-30"}
      {...props}
    />
  );
  return onSelectDay;
};

describe("BookingMonthCalendar", () => {
  test("lays out the whole month under weekday headings, starting on the right weekday", () => {
    renderCalendar();
    expect(screen.getAllByRole("button")).toHaveLength(31);
    // 1 October 2026 is a Thursday: four blanks (Sun-Wed) come before it.
    const grid = screen.getByRole("group", { name: "Choose a date" });
    expect([...grid.children].slice(0, 4).every((cell) => cell.tagName === "SPAN")).toBe(true);
    expect(screen.getByRole("button", { name: "Thu, 1st" })).toBeInTheDocument();
  });

  test("past days stay visible but greyed out and cannot be picked", () => {
    const onSelectDay = renderCalendar();
    const past = screen.getByRole("button", { name: "Wed, 21st" });
    expect(past).toBeDisabled();
    expect(past).toHaveAttribute("title", "This date has passed");
    fireEvent.click(past);
    expect(onSelectDay).not.toHaveBeenCalled();
  });

  test("marks today, and lets an open future day be picked", () => {
    const onSelectDay = renderCalendar();
    expect(screen.getByRole("button", { name: "Thu, 22nd · today" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Fri, 23rd" }));
    expect(onSelectDay).toHaveBeenCalledWith(23);
  });

  test("days the professional does not work, or has blocked, cannot be picked", () => {
    renderCalendar();
    expect(screen.getByRole("button", { name: "Mon, 26th" })).toHaveAttribute("title", "The professional does not work this day");
    expect(screen.getByRole("button", { name: "Mon, 26th" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Fri, 30th" })).toHaveAttribute("title", "The professional is unavailable on this date");
    expect(screen.getByRole("button", { name: "Fri, 30th" })).toBeDisabled();
  });

  test("shows the picked day as selected", () => {
    renderCalendar({ selectedDay: 23 });
    expect(screen.getByRole("button", { name: "Fri, 23rd" })).toHaveAttribute("aria-pressed", "true");
  });
});
