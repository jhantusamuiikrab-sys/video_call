import { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";
// import { useNavigate } from "react-router-dom";
import socketInstance from "../../socket";

const Dashboard = ({ onlineIds, user }) => {
  const [allusers, setAllUsers] = useState([]);
  const socket = socketInstance.getSocket();
const url ="https://video-call-server-hiq6.onrender.com"  //"http://localhost:5000"
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
              <div className={`vc-status ${online ? "online" : "offline"}`}>
                {online ? "Online" : "Offline"}
              </div>

              {/* Call Button */}
              <button
                className="vc-call-btn"
                disabled={!online}
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
