import { useEffect, useRef, useState } from 'react';

// ============================================================
// HeroReel: optional looping hero video over a poster image.
//
// Mirrors the pattern already live on the2pmclub.co.uk event pages.
// Three layers stacked in a square container:
//   1. a tiny blurred poster (~5KB) so the hero is never a black box,
//   2. the sharp WebP poster,
//   3. the video, which fades in over the poster once it can play.
//
// The video is NOT part of initial page load. It carries preload="none"
// and no src at all until activation, so an event without a hero video,
// and an event with one that is never scrolled to, costs zero extra bytes.
//
// With no videoUrl the component is a straight no-op: it renders exactly
// the plain poster img the page rendered before, untouched, so no existing
// event page changes in layout, classes or weight.
// ============================================================

// Bunny CDN resize params. Same CDN as the2pmclub, same query contract:
// one source image serves both the sharp WebP poster and the tiny blur.
const cdnParam = (url: string, params: string) =>
  url.includes('b-cdn.net') ? `${url}${url.includes('?') ? '&' : '?'}${params}` : url;

const heroPosterWebp = (url: string) => cdnParam(url, 'width=800&quality=72&format=webp');
const heroPosterBlur = (url: string) => cdnParam(url, 'width=24&quality=30');

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

interface HeroReelProps {
  /** Poster image, shown always. Required. */
  posterUrl: string;
  /** Optional looping MP4. Absent means poster only, no video element at all. */
  videoUrl?: string;
  /** Used for the poster alt text. */
  title: string;
  /** Layout classes, applied to the plain poster or to the video wrapper. */
  className?: string;
}

const HeroReel = ({ posterUrl, videoUrl, title, className = '' }: HeroReelProps) => {
  // Read synchronously so the very first render is already correct for a
  // reduced-motion visitor and the video element is never even mounted.
  const [reduceMotion, setReduceMotion] = useState(prefersReducedMotion);
  const [active, setActive] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  // Boomevents has no master reel to fall back to, so a failed load simply
  // leaves the poster showing. No retry, no second request.
  const [failed, setFailed] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Honour prefers-reduced-motion, and keep honouring it if the visitor
  // changes the setting while the page is open.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(REDUCED_MOTION_QUERY);
    setReduceMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const wantsVideo = Boolean(videoUrl) && !reduceMotion && !failed;

  // Activation: wait for the page load event AND the hero coming near the
  // viewport before attaching the src, so the video never competes with
  // first paint. A timer backstop covers hidden tabs and in-app webviews,
  // where IntersectionObserver delivery can stall.
  useEffect(() => {
    if (!wantsVideo || active) return;
    let cancelled = false;
    let observer: IntersectionObserver | undefined;
    let fallback: number | undefined;

    const activate = () => {
      if (cancelled) return;
      setActive(true);
      observer?.disconnect();
      window.clearTimeout(fallback);
    };

    const arm = () => {
      if (cancelled) return;
      const target = wrapRef.current;
      if (!target || typeof IntersectionObserver === 'undefined') {
        activate();
        return;
      }
      observer = new IntersectionObserver(
        (entries) => { if (entries.some(e => e.isIntersecting)) activate(); },
        { rootMargin: '300px 0px' }
      );
      observer.observe(target);
      fallback = window.setTimeout(activate, 2500);
    };

    if (document.readyState === 'complete') {
      arm();
    } else {
      window.addEventListener('load', arm, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener('load', arm);
      observer?.disconnect();
      window.clearTimeout(fallback);
    };
  }, [wantsVideo, active]);

  // Kick playback once the deferred src lands. The autoplay attribute alone
  // is not reliable when the src is attached after mount, and an immediate
  // play() gets interrupted by the load that the new src triggers.
  useEffect(() => {
    if (!active || !wantsVideo) return;
    const v = videoRef.current;
    if (!v) return;
    const tryPlay = () => { v.play().catch(() => {}); };
    if (v.readyState >= 3) {
      tryPlay();
      return;
    }
    v.addEventListener('canplay', tryPlay, { once: true });
    return () => v.removeEventListener('canplay', tryPlay);
  }, [active, wantsVideo, videoUrl]);

  // No video for this event: render exactly what the page rendered before.
  if (!videoUrl) {
    return (
      <img
        src={posterUrl}
        alt={title}
        className={className}
        width="400"
        height="400"
      />
    );
  }

  return (
    <div
      ref={wrapRef}
      className={`relative aspect-square overflow-hidden bg-black ${className}`}
    >
      {/* Blur-up placeholder: tiny, loads instantly, so the hero is never
          a black box while the sharp poster streams in. */}
      <img
        src={heroPosterBlur(posterUrl)}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl"
      />
      {/* Sharp poster (WebP), paints over the blur when ready. */}
      <img
        src={heroPosterWebp(posterUrl)}
        alt={title}
        width={800}
        height={800}
        decoding="async"
        fetchPriority="high"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Video fades in over the poster once it can play. Omitted entirely
          for reduced-motion visitors and after a load failure. */}
      {wantsVideo && (
        <video
          ref={videoRef}
          src={active ? videoUrl : undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          tabIndex={-1}
          onCanPlayThrough={() => setVideoReady(true)}
          onError={() => { setFailed(true); setVideoReady(false); }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  );
};

export default HeroReel;
