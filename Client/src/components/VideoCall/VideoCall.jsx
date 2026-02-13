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

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  // =====================
  // START MEDIA + PEER
  // =====================

  useEffect(() => {
    if (!user || !peerId) return; // ✅ guard

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        localStreamRef.current = stream;
        localVideoRef.current.srcObject = stream;

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
      //   console.log(
      //     "📡 remote tracks:",
      //     e.streams[0].getTracks().map((t) => t.kind),
      //   );
      remoteVideoRef.current.srcObject = e.streams[0];
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

      await pcRef.current.setRemoteDescription(data.offer);

      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);

      socket.emit("webrtc:answer", {
        to: data.from,
        answer,
      });
    };

    const onAnswer = async (data) => {
      //   console.log("📥 answer received");
      await pcRef.current.setRemoteDescription(data.answer);
    };

    const onIce = async (data) => {
      if (data.candidate) {
        await pcRef.current.addIceCandidate(data.candidate);
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

  // =====================
  // UI
  // =====================

  return (
    <div className="call-container">
      <video ref={remoteVideoRef} autoPlay playsInline className="remote" />
      <video ref={localVideoRef} autoPlay muted playsInline className="local" />

      <div className="controls">
        <button onClick={toggleMic} className="ctrl-btn">
          {micOn ? "Mute" : "Unmute"}
        </button>
        <button onClick={toggleCam} className="ctrl-btn">
          {camOn ? "Camera Off" : "Camera On"}
        </button>
        <button onClick={endCall} className="ctrl-btn end">
          End Call
        </button>
      </div>
    </div>
  );
}
