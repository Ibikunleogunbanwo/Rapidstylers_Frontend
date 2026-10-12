import { useEffect, useRef } from "react";

/** Restart muted decorative playback when it enters the viewport (Safari pauses offscreen video). */
export default function DecorativeVideo(props) {
  const ref = useRef(null);
  const visible = useRef(false);
  const playVisible = () => {
    const video = ref.current;
    if (!video || !visible.current) return;
    video.muted = true;
    video.play()?.catch(() => {});
  };
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (!window.IntersectionObserver) {
      visible.current = true;
      playVisible();
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting;
      if (visible.current) playVisible();
      else video.pause();
    });
    observer.observe(video);
    return () => observer.disconnect();
  }, []);
  return <video {...props} ref={ref} autoPlay loop muted playsInline preload="metadata" onLoadedData={playVisible} />;
}
