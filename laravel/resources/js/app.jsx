import "./bootstrap";
import "../css/app.css";

import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { createInertiaApp, usePage } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import * as Sentry from "@sentry/react";
import ReactGA4 from "react-ga4";
ReactGA4.initialize("G-2KTSFPN6HG");

function useTrackPageView() {
  const { url } = usePage().props;
  useEffect(() => {
    ReactGA4.send("pageview", url);
  }, [url]);
}

const appName =
  window.document.getElementsByTagName("title")[0]?.innerText || "Laravel";

createInertiaApp({
  title: (title) => `${title} - ${appName}`,
  resolve: (name) =>
    resolvePageComponent(
      `./Pages/${name}.jsx`,
      import.meta.glob("./Pages/**/*.jsx")
    ),
  setup({ el, App, props }) {
    // google analytics
    if (import.meta.env.VITE_APP_ENV === "production") {
      useTrackPageView();

      // Sentry
      Sentry.init({
        dsn: "https://6be2c2b04c884bba843a65c847bc9f2b@o466285.ingest.sentry.io/4505171611418624",
        integrations: [new Sentry.BrowserTracing(), new Sentry.Replay()],
        // Performance Monitoring
        tracesSampleRate: 1.0, // Capture 100% of the transactions, reduce in production!
        // Session Replay
        replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
        replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
      });
    }
    // render
    const root = createRoot(el);
    root.render(<App {...props} />);
  },
  progress: {
    color: "#4B5563",
  },
});
