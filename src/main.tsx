import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize theme from localStorage before render
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('adele-theme') || 'dark';
  const root = document.documentElement;
  
  let effectiveTheme = savedTheme;
  if (savedTheme === 'system') {
    effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  root.classList.remove('dark', 'light');
  if (effectiveTheme === 'dark') {
    root.classList.add('dark');
  }
};

initializeTheme();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
