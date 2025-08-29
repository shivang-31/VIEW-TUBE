import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

function Layout() {
  return (
    <div className="app-layout">
      <Header />

      <div style={{ display: "flex" }}>
        <Sidebar />


        <main style={{ flex: 1, padding: "1rem" }}>
          <Outlet /> {/* This is where page content will load */}
        </main>
      </div>
    </div>
  );
}

export default Layout;
