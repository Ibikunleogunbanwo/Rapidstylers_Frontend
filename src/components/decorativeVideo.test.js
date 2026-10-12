import { render, act } from "@testing-library/react";
import DecorativeVideo from "./decorativeVideo";
test("resumes playback when scrolling into view and pauses outside it", () => {
  let intersect;
  const disconnect = vi.fn();
  vi.stubGlobal("IntersectionObserver", class { constructor(callback) { intersect = callback; } observe() {} disconnect() { disconnect(); } });
  const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  const {unmount} = render(<DecorativeVideo src="/logo.mp4" />);
  expect(play).not.toHaveBeenCalled();
  act(()=>intersect([{isIntersecting:true}])); expect(play).toHaveBeenCalledTimes(1);
  act(()=>intersect([{isIntersecting:false}])); expect(pause).toHaveBeenCalledTimes(1);
  act(()=>intersect([{isIntersecting:true}])); expect(play).toHaveBeenCalledTimes(2);
  unmount(); expect(disconnect).toHaveBeenCalledTimes(1);
  vi.unstubAllGlobals();vi.restoreAllMocks();
});
