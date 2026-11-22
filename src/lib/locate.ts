export type Fix = { lat: number; lng: number; accuracy: number };

// Plain-language reason when the browser can't give a location.
export function explainLocationError(err: GeolocationPositionError | { code: number }): string {
  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
  const inApp = /FBAN|FBAV|Instagram|WhatsApp|Snapchat|Line\/|MiuiBrowser.*MicroMessenger|; wv\)/i.test(ua);
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "Your browser only shares location on secure (https) pages. Open the live site address and try again.";
  }
  if (err.code === 1) {
    return inApp
      ? "This in-app browser blocks location. Open the site in Chrome or Safari, then try again."
      : "Location is blocked for this site. Tap the lock icon next to the address, choose Permissions, allow Location, then try again.";
  }
  if (err.code === 2) return "Your phone couldn't work out where you are. Turn on Location (GPS) in your phone settings and try again, ideally near a window or outdoors.";
  return "Finding your location took too long. Check that Location is on, then try again.";
}

// Starts watching the device position and keeps the most accurate reading.
// Phones usually begin with a rough fix and improve within a few seconds, so we
// wait for a good one (50 m or better) or give up waiting after `waitMs`.
// Returns a function that stops everything.
export function locate(handlers: {
  onUpdate: (fix: Fix) => void;
  onDone: (fix: Fix) => void;
  onError: (message: string) => void;
}, waitMs = 15000): () => void {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    handlers.onError("Location isn't available on this device or browser.");
    return () => {};
  }
  let best: Fix | null = null;
  let finished = false;
  let id = -1;

  const timer = setTimeout(() => {
    if (best) finish();
    else if (!finished) {
      finished = true;
      stop();
      handlers.onError(explainLocationError({ code: 3 }));
    }
  }, waitMs);

  const stop = () => {
    navigator.geolocation.clearWatch(id);
    clearTimeout(timer);
  };
  const finish = () => {
    if (finished) return;
    finished = true;
    stop();
    if (best) handlers.onDone(best);
  };

  id = navigator.geolocation.watchPosition(
    (pos) => {
      const fix = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
      if (!best || fix.accuracy < best.accuracy) best = fix;
      handlers.onUpdate(best);
      if (best.accuracy <= 50) finish();
    },
    (err) => {
      if (finished) return;
      if (best) return finish();
      finished = true;
      stop();
      handlers.onError(explainLocationError(err));
    },
    { enableHighAccuracy: true, timeout: waitMs, maximumAge: 0 },
  );
  return () => {
    finished = true;
    stop();
  };
}
