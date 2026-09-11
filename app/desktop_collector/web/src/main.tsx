import ReactDOM from "react-dom/client";
import "uplot/dist/uPlot.min.css";

import { App } from "./App";
import { BridgeClient, consumeLaunchCredentials } from "./api";
import "./styles.css";

const root = ReactDOM.createRoot(document.getElementById("root")!);

declare global {
  interface Window {
    pywebview?: {
      api?: {
        toggle_fullscreen?: () => Promise<boolean>;
      };
    };
  }
}

async function toggleFullscreen(): Promise<void> {
  const hostToggle = window.pywebview?.api?.toggle_fullscreen;
  if (typeof hostToggle === "function") {
    await hostToggle();
    return;
  }

  // Development/standalone fallback when the React client is not hosted by PyWebView.
  if (document.fullscreenElement) {
    await document.exitFullscreen();
  } else {
    await document.documentElement.requestFullscreen();
  }
}

window.addEventListener(
  "keydown",
  (event) => {
    if (event.key !== "F11" || event.repeat) return;
    event.preventDefault();
    event.stopPropagation();
    void toggleFullscreen().catch(() => {
      // Fullscreen failure is non-fatal; leave the current window state unchanged.
    });
  },
  { capture: true },
);

try {
  const bridge = new BridgeClient(consumeLaunchCredentials());
  root.render(<App bridge={bridge} />);
} catch (error) {
  root.render(
    <main className="standalone-error" role="alert">
      <p className="error-wordmark">Dataset Studio</p>
      <h1>Could not validate the desktop session</h1>
      <p>{error instanceof Error ? error.message : String(error)}</p>
    </main>,
  );
}
