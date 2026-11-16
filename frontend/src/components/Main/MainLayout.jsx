import { Outlet } from "react-router-dom";
import Navbar from "../Navbar/Navbar";

function MainLayout() {
  return (
    <div className="main-layout">
      <Navbar />
      <main className="page-container">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
