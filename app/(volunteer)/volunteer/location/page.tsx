"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { startSharingLocation, stopSharingLocation, updateMyLocation, getMySharingStatus } from "@/actions/locations";
import { MapPin, Navigation } from "lucide-react";

const MIN_UPDATE_INTERVAL_MS = 15_000;

export default function VolunteerLocationPage() {
  const [isSharing, setIsSharing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const lastSentAtRef = useRef(0);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    getMySharingStatus()
      .then((status) => {
        setIsSharing(!!status?.is_sharing);
        setLastUpdated(status?.updated_at ?? null);
      })
      .finally(() => setLoading(false));

    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  function handleStart() {
    if (!("geolocation" in navigator)) {
      const msg = "Geolocation is not supported on this device/browser.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setStarting(true);
    setError(null);
    hasStartedRef.current = false;

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now();
        if (hasStartedRef.current && now - lastSentAtRef.current < MIN_UPDATE_INTERVAL_MS) return;
        lastSentAtRef.current = now;

        try {
          if (!hasStartedRef.current) {
            await startSharingLocation();
            hasStartedRef.current = true;
            setIsSharing(true);
            setStarting(false);
            toast.success("Location sharing started");
          }
          await updateMyLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
          setLastUpdated(new Date().toISOString());
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Failed to update location";
          setError(message);
          toast.error(message);
        }
      },
      (geoError) => {
        const msg = geoError.message || "Unable to access your location. Check location permissions.";
        setError(msg);
        toast.error(msg);
        setStarting(false);
        if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 }
    );
  }

  async function handleStop() {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    try {
      await stopSharingLocation();
      setIsSharing(false);
      toast.success("Location sharing stopped");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to stop sharing";
      setError(message);
      toast.error(message);
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FBF7EC" }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>Volunteer Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Location</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>Share your live location with tour admins during travel</p>
        </div>

        <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: 24 }}>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{ width: 44, height: 44, borderRadius: "50%", background: isSharing ? "rgba(42,94,58,0.1)" : "rgba(90,82,71,0.08)" }}
            >
              {isSharing ? <Navigation size={20} style={{ color: "#2A5E3A" }} /> : <MapPin size={20} style={{ color: "#9B9188" }} />}
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#19140F", margin: 0 }}>
                {isSharing ? "Sharing your location" : "Not sharing"}
              </p>
              <p style={{ fontSize: 12, color: "#9B9188", margin: 0 }}>
                {isSharing && lastUpdated
                  ? `Last updated ${new Date(lastUpdated).toLocaleTimeString()}`
                  : "Admins can only see your location while sharing is on"}
              </p>
            </div>
          </div>

          {error && (
            <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#DC2626" }}>
              {error}
            </div>
          )}

          {loading ? (
            <p style={{ fontSize: 13, color: "#9B9188" }}>Loading...</p>
          ) : isSharing ? (
            <button
              onClick={handleStop}
              style={{ background: "#DC2626", color: "white", fontSize: 13, fontWeight: 600, padding: "10px 20px", borderRadius: 6, border: "none", cursor: "pointer" }}
            >
              Stop Sharing
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={starting}
              style={{ background: "#2A5E3A", color: "white", fontSize: 13, fontWeight: 600, padding: "10px 20px", borderRadius: 6, border: "none", cursor: starting ? "not-allowed" : "pointer", opacity: starting ? 0.7 : 1 }}
            >
              {starting ? "Starting..." : "Start Sharing"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
