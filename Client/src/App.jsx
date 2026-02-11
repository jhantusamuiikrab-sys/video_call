// import { useEffect, useState } from "react";
// import axios from "axios";
// import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
// import Dashboard from "./components/Dashboard/Dashboard";
// import socketInstance from "./socket.js";
// import Login from "./components/Login.jsx";
// import Navbar from "./components/Navbar/Navbar.jsx";
// import Home from "./components/Home.jsx";
// import VideoCall from "./components/VideoCall/VideoCall.jsx";

// function App() {
//   const [onlineIds, setOnlineIds] = useState([]);
//   const [user, setUser] = useState(null);
//   const [isAuthenticated, setIsAuthenticated] = useState(true);
//   const [incomingCall, setIncomingCall] = useState(null);

//   const socket = socketInstance.getSocket();
//   const navigate = useNavigate();

//   // ✅ Check auth on load
//   useEffect(() => {
//     const checkAuth = async () => {
//       try {
//         const res = await axios.post(
//           "http://localhost:5000/api/v1/verifyUser",
//           {},
//           { withCredentials: true },
//         );

//         if (res.status === 200) {
//           setIsAuthenticated(true);
//           setUser(res.data.data);
//         }
//       } catch {
//         setIsAuthenticated(false);
//         setUser(null);
//       }
//     };

//     checkAuth();
//   }, []);

//   // ✅ Listen online list ONLY ONCE
//   useEffect(() => {
//     const handleOnlineList = (users) => {
//       setOnlineIds(users.map((u) => u.userId));
//     };

//     socket.on("online:list", handleOnlineList);

//     return () => {
//       socket.off("online:list", handleOnlineList);
//     };
//   }, [socket]);

//   // ✅ Join when user logs in
//   useEffect(() => {
//     if (!user) return;

//     if (!socket.connected) {
//       socket.connect();
//     }

//     socket.emit("join", {
//       id: user._id,
//       username: user.username,
//     });
//   }, [user, socket]);

//   //Handle Incoming Call
//   useEffect(() => {
//     const socket = socketInstance.getSocket();

//     socket.on("call:incoming", (data) => {
//       console.log("📲 Incoming call:", data);
//       setIncomingCall(data);
//     });

//     return () => {
//       socket.off("call:incoming");
//     };
//   }, []);

//   // Handle Incoming Call accept
//   const handleAccept = () => {
//     if (!incomingCall || !user) return;

//     socket.emit("call:accept", {
//       to: incomingCall.from,
//       from: user._id,
//     });

//     setIncomingCall(null); // ✅ remove popup
//     navigate(`/video/${incomingCall.from}`);
//   };

//   // Handle Incoming Call reject
//   const handleReject = () => {
//     if (!incomingCall) return;

//     socket.emit("call:reject", {
//       to: incomingCall.from,
//     });

//     setIncomingCall(null); // ✅ remove popup
//   };

//   // caller side listeners
//   useEffect(() => {
//     socket.on("call:accepted", (data) => {
//       console.log("✅ Call accepted by receiver", data);
//       navigate(`/video/${data.from}`);
//     });

//     socket.on("call:rejected", () => {
//       console.log("❌ Call rejected");
//       alert("Call rejected");
//     });

//     return () => {
//       socket.off("call:accepted");
//       socket.off("call:rejected");
//     };
//   }, [socket, navigate]);

//   return (
//     <>
//       <Navbar
//         user={user}
//         setUser={setUser}
//         setIsAuthenticated={setIsAuthenticated}
//       />

//       <Routes>
//         <Route
//           path="/login"
//           element={
//             <Login setUser={setUser} setIsAuthenticated={setIsAuthenticated} />
//           }
//         />

//         <Route path="/" element={<Home />} />

//         <Route
//           path="/dashboard"
//           element={
//             isAuthenticated ? (
//               <Dashboard onlineIds={onlineIds} user={user} />
//             ) : (
//               <Navigate to="/login" />
//             )
//           }
//         />
//         <Route
//           path="/video/:id"
//           element={
//             isAuthenticated ? (
//               <VideoCall user={user} />
//             ) : (
//               <Navigate to="/login" />
//             )
//           }
//         />
//       </Routes>
//       {incomingCall && (
//         <div className="call-popup">
//           <h3>Incoming call from {incomingCall.fromName}</h3>

//           <button onClick={handleAccept}>Accept</button>
//           <button onClick={handleReject}>Reject</button>
//         </div>
//       )}
//     </>
//   );
// }

// export default App;

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

  // =========================
  // AUTH CHECK
  // =========================
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.post(
          "http://localhost:5000/api/v1/verifyUser",
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
      // console.log("✅ Call accepted", data);
      navigate(`/video/${data.from}?caller=true`);
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
  }, [socket,navigate]);

  // =========================
  // ACCEPT CALL
  // =========================
  const handleAccept = () => {
    if (!incomingCall || !user) return;

    socket.emit("call:accept", {
      to: incomingCall.from,
      from: user._id,
    });

    setIncomingCall(null);
    navigate(`/video/${incomingCall.from}`);
  };

  // =========================
  // REJECT CALL
  // =========================
  const handleReject = () => {
    if (!incomingCall) return;

    socket.emit("call:reject", {
      to: incomingCall.from,
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
      />

      <Routes>
        <Route
          path="/login"
          element={
            <Login setUser={setUser} setIsAuthenticated={setIsAuthenticated} />
          }
        />

        <Route path="/" element={<Home />} />

        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <Dashboard onlineIds={onlineIds} user={user} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/video/:id"
          element={
            isAuthenticated ? (
              <VideoCall user={user} />
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
            <p>Incoming video call…</p>

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
