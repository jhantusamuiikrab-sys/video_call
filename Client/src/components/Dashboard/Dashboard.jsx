import { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";
// import { useNavigate } from "react-router-dom";
import socketInstance from "../../socket";

const Dashboard = ({ onlineIds, user, url }) => {
  const [allusers, setAllUsers] = useState([]);
  const socket = socketInstance.getSocket();
  const [busyIds, setBusyIds] = useState([]);

  useEffect(() => {
    socket.on("users:busy", (busyList) => {
      setBusyIds(busyList);
    });

    return () => {
      socket.off("users:busy");
    };
  }, [socket]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${url}/api/v1/user`, {
          withCredentials: true,
        });
        setAllUsers(res.data.data);
      } catch (err) {
        console.log(err);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="vc-dashboard">
      <h2 className="vc-title">Video Call Lobby</h2>

      <div className="vc-grid">
        {allusers.map((u) => {
          const online = onlineIds.includes(u._id);
          const busy = busyIds.includes(u._id);

          return (
            <div key={u._id} className="vc-card">
              {/* Avatar */}
              <div className="vc-avatar">
                {u.username?.charAt(0).toUpperCase()}
              </div>

              {/* User Info */}
              <div className="vc-info">
                <div className="vc-name">{u.username}</div>
                <div className="vc-email">{u.email}</div>
              </div>

              {/* Status */}
              <div
                className={`vc-status ${
                  !online ? "offline" : busy ? "busy" : "online"
                }`}
              >
                {!online ? "Offline" : busy ? "Busy" : "Online"}
              </div>

              {/* Call Button */}
              <button
                className="vc-call-btn"
                disabled={!online || busy}
                onClick={() => {
                  // console.log("📞 emitting call request");
                  socket.emit("call:request", {
                    to: u._id,
                    from: user._id,
                    fromName: user.username,
                  });
                }}
              >
                📞 Call
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
