import React, { useEffect, useRef } from "react";
import { useWebRTCMesh } from "../hooks/useWebRTCMesh";
import "../style/VideoChat.css";

interface Participant {
  id: string;
  username: string;
  email: string;
}

interface VideoChatMeshProps {
  roomId: string;
  currentUserId: string;
  participants?: Participant[];
  onLog: (message: string) => void;
  onError: (error: string) => void;
}

const VideoChatMesh: React.FC<VideoChatMeshProps> = ({
  roomId,
  currentUserId,
  participants = [],
  onLog,
  onError,
}) => {
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  
  const {
    localVideoRef,
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

  const others = participants.filter((p: Participant) => p.id !== currentUserId);
  const totalParticipants = connectedUserIds.length + (isCallActive ? 1 : 0);

  // Update remote video elements when streams change
  useEffect(() => {
    remoteStreams.forEach((stream: MediaStream, userId: string) => {
      const videoElement = remoteVideoRefs.current.get(userId);
      if (videoElement && stream) {
        videoElement.srcObject = stream;
      }
    });
  }, [remoteStreams]);

  return (
    <div className="video-chat">
      <h2>
        Video Chat - Mesh{isCallActive && `: Active call with ${totalParticipants} participant${totalParticipants !== 1 ? "s" : ""}`}
      </h2>

      {/* Controls Section */}
      <div className="video-controls-section">
        {isCallActive ? (
          <>
            <button
              onClick={toggleVideo}
              className={`toggle-button ${isLocalVideoEnabled ? 'active' : ''}`}
            >
              Video {isLocalVideoEnabled ? "On" : "Off"}
            </button>

            <button
              onClick={toggleAudio}
              className={`toggle-button ${isLocalAudioEnabled ? 'active' : ''}`}
            >
              Mic {isLocalAudioEnabled ? "On" : "Off"}
            </button>

            <button className="end-call-button" onClick={endMeshCall}>
              End Call
            </button>
          </>
        ) : others.length > 0 ? (
          <button onClick={startMeshCall} className="call-button">
            Start Call ({others.length + 1})
          </button>
        ) : (
          <div className="video-waiting-message">
            Waiting for participants to join...
          </div>
        )}
      </div>

      <div className={`video-grid video-grid-${totalParticipants}`}>
        {/* Local video */}
        <div className="video-tile local-video">
          <div className="video-label">You</div>
          <video ref={localVideoRef} autoPlay muted playsInline className="video-element" />
          {!isLocalVideoEnabled && (
            <div className="video-overlay">Video Off</div>
          )}
        </div>

        {/* Remote videos - one per connected participant */}
        {connectedUserIds.map((userId: string) => {
          const participant = participants.find((p) => p.id === userId);
          return (
            <div key={userId} className="video-tile remote-video">
              <div className="video-label">{participant?.username || "User"}</div>
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
                className="video-element"
              />
            </div>
          );
        })}
      </div>
      
      {!isCallActive && others.length === 0 && (
        <div className="video-waiting-message">
          Waiting for other participants...
        </div>
      )}
    </div>
  );
};

export default VideoChatMesh;
