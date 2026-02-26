import { useEffect, useState } from "react";
import axios from "axios";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import "./App.css";
import Dashboard from "./components/Dashboard/Dashboard";
import VideoCall from "./components/VideoCall/VideoCall.jsx";
import Login from "./components/Login.jsx";
import Navbar from "./components/Navbar/Navbar.jsx";
import Home from "./components/Home.jsx";

import socketInstance from "./socket.js";

function App() {
  const [onlineIds, setOnlineIds] = useState([]);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [incomingCall, setIncomingCall] = useState(null);

  const socket = socketInstance.getSocket();
  const navigate = useNavigate();
  const url ="https://video-call-server-kpp3.onrender.com"// "http://localhost:5000"; //"https://video-call-server-kpp3.onrender.com"
  // =========================
  // AUTH CHECK
  // =========================

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.post(
          `${url}/api/v1/verifyUser`,
          {},
          { withCredentials: true },
        );

        if (res.status === 200) {
          setIsAuthenticated(true);
          setUser(res.data.data);
        }
      } catch {
        setIsAuthenticated(false);
        setUser(null);
      }
    };

    checkAuth();
  }, []);

  // =========================
  // ONLINE LIST
  // =========================
  useEffect(() => {
    const handleOnlineList = (users) => {
      setOnlineIds(users.map((u) => u.userId));
    };

    socket.on("online:list", handleOnlineList);
    return () => socket.off("online:list", handleOnlineList);
  }, [socket]);

  // =========================
  // JOIN SOCKET AFTER LOGIN
  // =========================
  useEffect(() => {
    if (!user) return;

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("join", {
      id: user._id,
      username: user.username,
    });
  }, [user]);

  // =========================
  // INCOMING CALL LISTENER
  // =========================
  useEffect(() => {
    const handleIncoming = (data) => {
      // console.log("📲 Incoming call:", data);
      setIncomingCall(data);
    };

    socket.on("call:incoming", handleIncoming);
    return () => socket.off("call:incoming", handleIncoming);
  }, [socket]);

  // =========================
  // CALLER SIDE LISTENERS
  // =========================
  useEffect(() => {
    const onAccepted = (data) => {
      if (!data?.from) return;

      navigate(
        `/call/${data.from}?caller=true&type=${data.callType || "video"}`,
      );
    };

    const onRejected = (data) => {
      // console.log("❌ Call rejected received instantly", data);
      // alert("Call rejected");
    };

    socket.on("call:accepted", onAccepted);
    socket.on("call:rejected", onRejected);

    return () => {
      socket.off("call:accepted", onAccepted);
      socket.off("call:rejected", onRejected);
    };
  }, [socket, navigate]);

  // =========================
  // ACCEPT CALL
  // =========================
  const handleAccept = () => {
    if (!incomingCall || !user) return;

    socket.emit("call:accept", {
      to: incomingCall.from,
      from: user._id,
      callType: incomingCall.callType, // 🔥 IMPORTANT
    });

    navigate(`/call/${incomingCall.from}?type=${incomingCall.callType}`);
    setIncomingCall(null);
  };

  // =========================
  // REJECT CALL
  // =========================
  const handleReject = () => {
    if (!incomingCall) return;

    socket.emit("call:reject", {
      to: incomingCall.from,
      from: user._id,
    });

    setIncomingCall(null);
  };

  // =========================
  // UI
  // =========================
  return (
    <>
      <Navbar
        user={user}
        setUser={setUser}
        setIsAuthenticated={setIsAuthenticated}
        url={url}
      />

      <Routes>
        <Route
          path="/login"
          element={
            <Login
              setUser={setUser}
              setIsAuthenticated={setIsAuthenticated}
              url={url}
            />
          }
        />

        <Route path="/" element={<Home />} />

        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <Dashboard onlineIds={onlineIds} user={user} url={url} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/call/:id"
          element={
            isAuthenticated ? (
              <VideoCall user={user} url={url} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>

      {/* =========================
            INCOMING CALL POPUP
          ========================= */}

      {incomingCall && (
        <div className="call-overlay">
          <div className="call-card">
            <div className="call-avatar">
              {incomingCall.fromName?.charAt(0).toUpperCase()}
            </div>

            <h3>{incomingCall.fromName}</h3>
            <p>
              Incoming {incomingCall.callType === "audio" ? "audio" : "video"}{" "}
              call…
            </p>
            <div className="call-actions">
              <button className="accept" onClick={handleAccept}>
                Accept
              </button>
              <button className="reject" onClick={handleReject}>
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
