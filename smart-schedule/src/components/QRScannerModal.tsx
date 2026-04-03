import { useEffect, useRef, useState } from "react";
import { API_BASE } from "@/config/api";
import { Html5Qrcode } from "html5-qrcode";
import { motion, AnimatePresence } from "framer-motion";
import { X, QrCode, CheckCircle2, AlertCircle, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ScanStatus = "scanning" | "loading" | "success" | "error";

interface QRScannerProps {
  onClose: () => void;
}

export function QRScannerModal({ onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [status, setStatus] = useState<ScanStatus>("scanning");
  const [errorMsg, setErrorMsg] = useState("");
  const [lastMarked, setLastMarked] = useState<string | null>(null);
  const hasScanned = useRef(false);

  const startScanner = () => {
    const html5QrCode = new Html5Qrcode("qr-reader");
    scannerRef.current = html5QrCode;

    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        if (hasScanned.current) return;
        hasScanned.current = true;
        handleScan(decodedText);
      },
      () => {}
    ).catch((err) => {
      console.error("Scanner start error:", err);
      setStatus("error");
      setErrorMsg("Could not access camera. Please allow camera permissions.");
    });
  };

  useEffect(() => {
    startScanner();
    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  const handleScan = async (qrToken: string) => {
    setStatus("loading");

    // Stop scanner immediately
    await scannerRef.current?.stop().catch(() => {});

    const token = localStorage.getItem("token");

    // DEVICE BINDING (Anti-cheat 1)
    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
       deviceId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
       localStorage.setItem("deviceId", deviceId);
    }

    // GEOLOCATION (Anti-cheat 2)
    let studentLat = null;
    let studentLng = null;
    if ("geolocation" in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000, enableHighAccuracy: true });
        });
        studentLat = position.coords.latitude;
        studentLng = position.coords.longitude;
      } catch (err) {
        toast.warning("Location access denied or failed — skipping geo-check.");
      }
    }

    try {
      const res = await fetch(`${API_BASE}/api/attendance/mark`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ qrToken, studentLat, studentLng, deviceId })
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        const now = new Date();
        setLastMarked(`Today at ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
        toast.success("Attendance marked successfully! ✅");
        // Vibration feedback
        if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);
        setTimeout(onClose, 2500);
      } else {
        setStatus("error");
        if (data.message?.includes("expired")) setErrorMsg("QR Code expired. Ask your teacher to generate a new one.");
        else if (data.message?.includes("already")) setErrorMsg("Attendance already marked for today.");
        else setErrorMsg(data.message || "Invalid QR code.");
        toast.error(errorMsg || data.message);
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Check your connection.");
    }
  };

  const handleRetry = () => {
    hasScanned.current = false;
    setStatus("scanning");
    setErrorMsg("");
    startScanner();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-sm bg-[hsl(var(--background))] border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-primary/20 relative"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">Scan Attendance QR</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera or status view */}
        <div className="relative bg-black">
          {/* html5-qrcode mounts here */}
          <div
            id="qr-reader"
            className={`w-full ${status === "scanning" ? "block" : "hidden"}`}
            style={{ minHeight: "300px" }}
          />

          {/* Scanning overlay with guide frame */}
          {status === "scanning" && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Darkened corners */}
              <div className="absolute inset-0 bg-black/40" />
              {/* Guide frame */}
              <div className="relative w-60 h-60 z-10">
                {/* Corner brackets */}
                {[
                  "top-0 left-0 border-t-4 border-l-4 rounded-tl-xl",
                  "top-0 right-0 border-t-4 border-r-4 rounded-tr-xl",
                  "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-xl",
                  "bottom-0 right-0 border-b-4 border-r-4 rounded-br-xl"
                ].map((cls, i) => (
                  <div key={i} className={`absolute w-10 h-10 border-primary ${cls}`} />
                ))}
                {/* Scanning beam */}
                <motion.div
                  animate={{ y: [0, 200, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_12px_2px_hsl(var(--primary))]"
                />
              </div>
            </div>
          )}

          {/* Loading state */}
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center gap-4 p-12 min-h-[300px]">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center"
              >
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </motion.div>
              <p className="text-sm text-muted-foreground">Marking your attendance...</p>
            </div>
          )}

          {/* Success state */}
          {status === "success" && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center gap-4 p-12 min-h-[300px]"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
                className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center"
              >
                <CheckCircle2 className="w-10 h-10 text-success" />
              </motion.div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-success mb-1">Attendance Marked!</h3>
                {lastMarked && <p className="text-xs text-muted-foreground">Last marked: {lastMarked}</p>}
              </div>
            </motion.div>
          )}

          {/* Error state */}
          {status === "error" && (
            <div className="flex flex-col items-center justify-center gap-4 p-12 min-h-[300px]">
              <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-destructive" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-bold text-destructive mb-2">Scan Failed</h3>
                <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">{errorMsg}</p>
              </div>
              <Button size="sm" variant="outline" onClick={handleRetry} className="gap-2 border-white/20">
                <RotateCcw className="w-4 h-4" /> Try Again
              </Button>
            </div>
          )}
        </div>

        {/* Bottom instruction */}
        {status === "scanning" && (
          <div className="p-4 text-center border-t border-white/10">
            <div className="flex items-center justify-center gap-2 mb-1">
              <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-success"
              />
              <span className="text-xs font-medium text-success">Camera Active</span>
            </div>
            <p className="text-xs text-muted-foreground">Align the QR code within the frame to scan</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
