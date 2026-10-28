import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import pennybloomLogo from "../assets/pennybloom-logo.png";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

const Header = ({ view, onChangeView }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleShowLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const selectView = (nextView) => {
    onChangeView(nextView);
    setMenuOpen(false);
  };

  return (
    <>
      <button
        className="mobile-menu-toggle"
        type="button"
        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? <CloseRoundedIcon /> : <MenuRoundedIcon />}
      </button>
      {menuOpen && (
        <button
          className="sidebar-backdrop"
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside className={`app-sidebar${menuOpen ? " is-open" : ""}`}>
        <div className="brand-lockup">
          <img className="brand-mark" src={pennybloomLogo} alt="" />
          <span className="brand-copy">
            <span className="brand-name">PennyBloom</span>
            <span className="brand-tagline">Grow better money habits.</span>
          </span>
        </div>

        <div className="sidebar-section-label">Workspace</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          <button
            type="button"
            className={`sidebar-link${view === "table" ? " active" : ""}`}
            aria-current={view === "table" ? "page" : undefined}
            onClick={() => selectView("table")}
          >
            <DashboardRoundedIcon />
            <span>Overview</span>
          </button>
          <button
            type="button"
            className={`sidebar-link${view === "chart" ? " active" : ""}`}
            aria-current={view === "chart" ? "page" : undefined}
            onClick={() => selectView("chart")}
          >
            <BarChartRoundedIcon />
            <span>Analytics</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-profile">
            <div className="profile-avatar">
              {user?.avatarImage ? (
                <img src={user.avatarImage} alt="" />
              ) : (
                (user?.name || "Y").charAt(0).toUpperCase()
              )}
            </div>
            <div className="profile-copy">
              <strong>{user?.name || "Your account"}</strong>
              <span>Personal workspace</span>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-link sidebar-logout"
            onClick={handleShowLogout}
          >
            <LogoutRoundedIcon />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Header;
