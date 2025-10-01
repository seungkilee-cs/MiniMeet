import React, { useEffect, useRef } from "react";
import { useWebRTCMesh } from "../hooks/useWebRTCMesh";

interface VideoChatMeshProps {
  roomId: string;
  currentUserId: string;
  participants: Array<{ id: string; username: string; email: string }>;
  onLog: (message: string) => void;
  onError: (error: string) => void;
}

const VideoChatMesh: React.FC<VideoChatMeshProps> = ({
  roomId,
  currentUserId,
  participants,
  onLog,
  onError,
}) => {
  const {
    localVideoRef,
    remoteStreamsRef,
    connectedUserIds,
    startMeshCall,
    endMeshCall,
    toggleVideo,
    toggleAudio,
    isCallActive,
    isLocalVideoEnabled,
    isLocalAudioEnabled,
    remoteStreams,
  } = useWebRTCMesh({
    roomId,
    localUserId: currentUserId,
    onLog,
    onError,
  });

  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Update remote video elements when streams change
  useEffect(() => {
    remoteStreams.forEach((stream, userId) => {
      const videoElement = remoteVideoRefs.current.get(userId);
      if (videoElement && videoElement.srcObject !== stream) {
        videoElement.srcObject = stream;
      }
    });
  }, [remoteStreams]);

  const others = participants.filter((p) => p.id !== currentUserId);
  const totalParticipants = connectedUserIds.length + (isCallActive ? 1 : 0);

  return (
    <div className="video-surface">
      <h3 style={{ margin: 0, fontSize: 14, color: "#9aa3b2" }}>
        Video Chat - Mesh Topology (Up to 4 people)
      </h3>

      {isCallActive && (
        <div className="call-info">
          <span>
            Active call with {connectedUserIds.length} participant
            {connectedUserIds.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      <div className={`video-grid video-grid-${totalParticipants}`}>
        {/* Local video */}
        <div className="video-tile local-video">
          <h4>You</h4>
          <video ref={localVideoRef} autoPlay muted playsInline />
          {!isLocalVideoEnabled && (
            <div className="video-overlay">Video Off</div>
          )}
        </div>

        {/* Remote videos - one per connected participant */}
        {connectedUserIds.map((userId) => {
          const participant = participants.find((p) => p.id === userId);
          return (
            <div key={userId} className="video-tile remote-video">
              <h4>{participant?.username || "User"}</h4>
              <video
                ref={(el) => {
                  if (el) {
                    remoteVideoRefs.current.set(userId, el);
                    const stream = remoteStreams.get(userId);
                    if (stream && el.srcObject !== stream) {
                      el.srcObject = stream;
                    }
                  }
                }}
                autoPlay
                playsInline
              />
            </div>
          );
        })}
      </div>

      <div className="controls-row">
        {!isCallActive && others.length > 0 && (
          <button onClick={startMeshCall} className="btn-primary">
            Start Group Call ({others.length + 1} people)
          </button>
        )}

        {isCallActive && (
          <>
            <button
              onClick={toggleVideo}
              className={isLocalVideoEnabled ? "btn-secondary" : "btn-warning"}
            >
              {isLocalVideoEnabled ? "📹 Video On" : "📹 Video Off"}
            </button>

            <button
              onClick={toggleAudio}
              className={isLocalAudioEnabled ? "btn-secondary" : "btn-warning"}
            >
              {isLocalAudioEnabled ? "🎤 Mic On" : "🎤 Mic Off"}
            </button>

            <button className="btn-danger" onClick={endMeshCall}>
              End Call
            </button>
          </>
        )}

        {!isCallActive && others.length === 0 && (
          <div className="info-message">
            Waiting for other participants to join...
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoChatMesh;
