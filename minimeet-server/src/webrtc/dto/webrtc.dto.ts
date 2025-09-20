export interface WebRTCOffer {
  type: 'offer';
  sdp: string;
  fromUserId: string;
  toUserId: string;
  roomId: string;
}

export interface WebRTCAnswer {
  type: 'answer';
  sdp: string;
  fromUserId: string;
  toUserId: string;
  roomId: string;
}

export interface ICECandidate {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
  fromUserId: string;
  toUserId: string;
  roomId: string;
}

export interface VideoCallRequest {
  fromUserId: string;
  toUserId: string;
  roomId: string;
}

export interface VideoCallResponse {
  fromUserId: string;
  toUserId: string;
  roomId: string;
  accepted: boolean;
}
