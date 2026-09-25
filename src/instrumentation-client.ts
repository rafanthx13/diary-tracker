function reportBrowserError(code: "window_error" | "unhandled_promise_rejection") {
  try {
    void fetch("/api/diagnostics/client-error", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      keepalive: true,
    });
  } catch {
    // A instrumentação deve ser invisível para a pessoa usuária.
  }
}

window.addEventListener("error", () => reportBrowserError("window_error"));
window.addEventListener("unhandledrejection", () => reportBrowserError("unhandled_promise_rejection"));
