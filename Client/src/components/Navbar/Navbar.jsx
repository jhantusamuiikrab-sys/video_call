import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import socketInstance from "../../socket";
import "./Navbar.css";

const Navbar = ({ user, setUser }) => {
  const socket = socketInstance.getSocket();
  const navigate = useNavigate();
  const url ="https://video-call-server-hiq6.onrender.com"      //"http://localhost:5000"
  const handleLogout = async () => {
    try {
      // Call backend to clear the cookie
      await axios.post(
        `${url}/api/v1/logout`,
        {},
        { withCredentials: true },
      );

      // Clear local state
      setUser(null);
      socket.disconnect();
      // Redirect to home/auth page
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <h3>V-Call</h3>
      </div>
      <div className="nav-links">
        {user ? (
          <div className="user-section">
            <span>
              Welcome, <strong>{user.username}</strong>
            </span>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        ) : (
          <button onClick={() => navigate("/login")} className="btn-login">
            Login
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
