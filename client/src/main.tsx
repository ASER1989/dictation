import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./modules/app";
import "./root.styl";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <HashRouter>
    <App />
  </HashRouter>,
);
