import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Prevent browser's native PWA install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
});

// Unregister any existing service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
