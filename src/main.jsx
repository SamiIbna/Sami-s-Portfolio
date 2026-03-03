import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || "Unknown error" };
  }

  componentDidCatch(error) {
    // Keep it in console for debugging while showing a visible message in UI.
    console.error("App crash:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          background: "#040508",
          color: "#e9f0ff",
          padding: "24px",
          fontFamily: "Space Grotesk, sans-serif"
        }}>
          <h1 style={{ marginTop: 0 }}>App runtime error</h1>
          <p>{this.state.message}</p>
          <p>Open DevTools Console for full stack trace.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
);
