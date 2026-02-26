import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import socketInstance from "../../socket";
import "./VideoCall.css";

const pcConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoCall({ user }) {
  const { id: peerId } = useParams();
  const [params] = useSearchParams();
  const isCaller = params.get("caller") === "true";

  const navigate = useNavigate();
  const socket = socketInstance.getSocket();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  // Low balance and zero balance reminder

  // useEffect(() => {
  //   const socket = socketInstance.getSocket();

  //   socket.on("call:lowBalance", (data) => {
  //     alert(`⚠ Low Balance! Only ${data.remaining} seconds left.`);
  //   });

  //   socket.on("call:noBalance", () => {
  //     alert("❌ Your balance is finished!");
  //     navigate("/dashboard"); // redirect if needed
  //   });

  //   return () => {
  //     socket.off("call:lowBalance");
  //     socket.off("call:noBalance");
  //   };
  // }, []);

  // =====================
  // START MEDIA + PEER
  // =====================
  const callType = params.get("type") || "video";
  useEffect(() => {
    if (!user || !peerId) return; // ✅ guard

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: callType === "video",
          audio: true,
        });

        localStreamRef.current = stream;
        if (callType === "video") {
          localVideoRef.current.srcObject = stream;
        }

        createPeer(stream);

        if (isCaller) {
          await makeOffer();
        }
      } catch (err) {
        console.error("media error", err);
      }
    };

    start();

    return cleanup;
  }, [user, peerId]);

  // =====================
  // PEER CONNECTION
  // =====================

  const createPeer = (stream) => {
    const pc = new RTCPeerConnection(pcConfig);
    pcRef.current = pc;

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (e) => {
      const remoteStream = e.streams[0];

      if (callType === "video") {
        remoteVideoRef.current.srcObject = remoteStream;
      } else {
        remoteAudioRef.current.srcObject = remoteStream; // 🔥 audio attach
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("webrtc:ice", {
          to: peerId,
          candidate: e.candidate,
        });
      }
    };
  };

  // =====================
  // OFFER (CALLER ONLY)
  // =====================

  const makeOffer = async () => {
    if (!pcRef.current || !user) {
      console.log("offer blocked — pc or user missing");
      return;
    }

    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);

    socket.emit("webrtc:offer", {
      to: peerId,
      from: user._id,
      offer,
    });

    // console.log("📤 offer sent");
  };

  // =====================
  // SOCKET EVENTS
  // =====================

  useEffect(() => {
    const onOffer = async (data) => {
      if (!pcRef.current) return;

      try {
        await pcRef.current.setRemoteDescription(data.offer);

        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);

        socket.emit("webrtc:answer", {
          to: data.from,
          answer,
        });
      } catch (err) {
        console.log("Offer error:", err.message);
      }
    };

    const onAnswer = async (data) => {
      //   console.log("📥 answer received");
      if (!pcRef.current) return;

      try {
        await pcRef.current.setRemoteDescription(data.answer);
      } catch (err) {
        console.log("Answer error:", err.message);
      }
    };

    const onIce = async (data) => {
      if (!pcRef.current) return; // ✅ prevent crash

      if (data.candidate) {
        try {
          await pcRef.current.addIceCandidate(data.candidate);
        } catch (err) {
          console.log("ICE error after disconnect:", err.message);
        }
      }
    };

    const onEnded = () => {
      cleanup();
      navigate("/dashboard");
    };

    socket.on("webrtc:offer", onOffer);
    socket.on("webrtc:answer", onAnswer);
    socket.on("webrtc:ice", onIce);
    socket.on("call:end", onEnded);

    return () => {
      socket.off("webrtc:offer", onOffer);
      socket.off("webrtc:answer", onAnswer);
      socket.off("webrtc:ice", onIce);
      socket.off("call:end", onEnded);
    };
  }, []);

  useEffect(() => {
    const onRemoteEnd = () => {
      //   console.log("📴 Remote user ended call");

      cleanup();
      //   alert("Call ended by other user");
      navigate("/dashboard");
    };

    socket.on("call:ended", onRemoteEnd);

    return () => socket.off("call:ended", onRemoteEnd);
  }, []);

  // =====================
  // CONTROLS
  // =====================

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  };

  const toggleCam = () => {
    if (callType !== "video") return;
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
  };

  const endCall = () => {
    socket.emit("call:end", {
      to: peerId,
      from: user._id,
      endTime: new Date().toISOString(),
      callType,
    }); // ✅ notify other user

    cleanup();
    navigate("/dashboard");
  };

  // =====================
  // CLEANUP
  // =====================
  const cleanup = () => {
    // stop tracks
    localStreamRef.current?.getTracks().forEach((t) => t.stop());

    // close peer
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    // clear video
    if (localVideoRef.current) localVideoRef.current.srcObject = null;

    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  const handleForceDisconnect = () => {
    // 1️⃣ Close peer connection
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    // 2️⃣ Stop local stream tracks (camera + mic)
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    // 3️⃣ Stop remote stream tracks
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    // 5️⃣ Navigate away
    navigate("/dashboard");
  };

  useEffect(() => {
    socket.on("call:forceEnd", () => {
      console.log("Minutes exhausted. Auto disconnecting...");

      handleForceDisconnect();
    });

    return () => {
      socket.off("call:forceEnd");
    };
  }, []);

  // =====================
  // UI
  // =====================

  return (
    <div className="call-container">
      {callType === "video" && (
        <>
          <video ref={remoteVideoRef} autoPlay playsInline className="remote" />
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="local"
          />
        </>
      )}
      {callType === "audio" && (
        <div className="audio-ui">
          <audio ref={remoteAudioRef} autoPlay playsInline />

          <div className="audio-avatar">{peerId?.charAt(0).toUpperCase()}</div>

          <div className="audio-name">Audio Call Connected</div>
          <div className="audio-status">Live Voice Call</div>

          <div className="audio-wave">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}
      <div className="controls">
        <button onClick={toggleMic} className="ctrl-btn">
          {micOn ? "Mute" : "Unmute"}
        </button>

        {callType === "video" && (
          <button onClick={toggleCam} className="ctrl-btn">
            {camOn ? "Camera Off" : "Camera On"}
          </button>
        )}

        <button onClick={endCall} className="ctrl-btn end">
          End Call
        </button>
      </div>
    </div>
  );
}
