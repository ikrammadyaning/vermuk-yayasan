import { useState } from "react";
import Header from "../Header/Header";
import Sidebar from "../Sidebar/Sidebar";
import "./Layout.css";

/**
 * Layout utama aplikasi: Header + Sidebar (drawer di mobile) + konten.
 */
export default function Layout({ children }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="app-layout__main">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="app-layout__content">{children}</main>
      </div>
    </div>
  );
}
