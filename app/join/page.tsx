"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Users } from "lucide-react";
import Peer from "peerjs";
import { useEffect, useRef, useState } from "react";
import { VideoPlayer } from "../components/video-player";

export default function JoinPage() {
    const [roomId, setRoomId] = useState("");
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isRoomOwner] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const { toast } = useToast();
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFullscreenNow = !!(document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement);
            setIsFullscreen(isFullscreenNow);
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
        document.addEventListener("mozfullscreenchange", handleFullscreenChange);
        document.addEventListener("MSFullscreenChange", handleFullscreenChange);

        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
            document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
            document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
        };
    }, []);

    const toggleFullscreen = async () => {
        if (!videoContainerRef.current) return;

        try {
            if (!isFullscreen) {
                if (videoContainerRef.current.requestFullscreen) {
                    await videoContainerRef.current.requestFullscreen();
                } else if ((videoContainerRef.current as any).webkitRequestFullscreen) {
                    await (videoContainerRef.current as any).webkitRequestFullscreen();
                } else if ((videoContainerRef.current as any).msRequestFullscreen) {
                    await (videoContainerRef.current as any).msRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if ((document as any).webkitExitFullscreen) {
                    await (document as any).webkitExitFullscreen();
                } else if ((document as any).msExitFullscreen) {
                    await (document as any).msExitFullscreen();
                }
            }
        } catch (err) {
            console.error("Fullscreen error:", err);
            toast({
                title: "Fullscreen error",
                description: "Could not toggle fullscreen mode",
                variant: "destructive"
            });
        }
    };

    const joinRoom = () => {
        if (!roomId.trim()) {
            toast({
                title: "Room code required",
                description: "Please enter a valid room code",
                variant: "destructive"
            });
            return;
        }

        setIsConnecting(true);
        const peer = new Peer();

        peer.on("open", () => {
            const conn = peer.connect(roomId);

            conn.on("open", () => {
                setIsConnected(true);
                toast({
                    title: "Connected!",
                    description: "Waiting for host to share their screen..."
                });
            });

            peer.on("call", (call) => {
                call.answer();
                call.on("stream", (remoteStream) => {
                    console.log("Received stream from host", {
                        audioTracks: remoteStream.getAudioTracks().length,
                        videoTracks: remoteStream.getVideoTracks().length
                    });

                    if (videoRef.current) {
                        videoRef.current.srcObject = remoteStream;
                        videoRef.current.volume = volume;
                        videoRef.current.muted = isMuted;

                        videoRef.current.autoplay = true;
                        videoRef.current.playsInline = true;

                        const playPromise = videoRef.current.play();
                        if (playPromise) {
                            playPromise.catch((error) => {
                                console.error("Error playing video:", error);
                                toast({
                                    title: "Audio Playback",
                                    description: "Click anywhere to enable audio playback",
                                    variant: "destructive"
                                });
                            });
                        }
                    }
                });
            });

            conn.on("close", () => {
                setIsConnected(false);
                toast({
                    title: "Disconnected",
                    description: "The host has ended the session",
                    variant: "destructive"
                });
            });
        });

        peer.on("error", (err) => {
            console.error("Peer connection error:", err);
            setIsConnecting(false);
            toast({
                title: "Connection failed",
                description: "Could not connect to the room. Please check the room code and try again.",
                variant: "destructive"
            });
        });
    };

    const stopScreenShare = () => {
        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
            setLocalStream(null);
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        }
    };

    const startScreenShare = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100,
                    autoGainControl: false
                }
            });

            const tracks = [...stream.getTracks()];
            if (stream.getAudioTracks().length === 0) {
                try {
                    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    tracks.push(...audioStream.getAudioTracks());
                    stream.addTrack(audioStream.getAudioTracks()[0]);
                } catch (err) {
                    console.error("Could not get audio stream:", err);
                }
            }

            setLocalStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.muted = true;
            }

            stream.getTracks()[0].onended = () => {
                stopScreenShare();
            };

            if (isRoomOwner) {
                const peer = new Peer();

                peer.on("open", (id) => {
                    setRoomId(id);
                    toast({
                        title: "Room Created",
                        description: `Share this code with others: ${id}`
                    });
                });

                peer.on("connection", (conn) => {
                    conn.on("open", () => {
                        const call = peer.call(conn.peer, stream);

                        console.log("Sending stream to peer", {
                            audioTracks: stream.getAudioTracks().length,
                            videoTracks: stream.getVideoTracks().length
                        });
                    });
                });
            }
        } catch (err) {
            console.error("Error sharing screen:", err);
            toast({
                title: "Sharing Error",
                description: "Could not start screen sharing",
                variant: "destructive"
            });
        }
    };

    const handleVolumeChange = (newVolume: number) => {
        setVolume(newVolume);
        if (videoRef.current) {
            videoRef.current.volume = newVolume;
        }
    };

    const handleToggleMute = () => {
        setIsMuted(!isMuted);
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
        }
    };

    useEffect(() => {
        return () => {
            stopScreenShare();
        };
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
            <div className="max-w-2xl mx-auto space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-6 w-6" />
                            Join a Room
                        </CardTitle>
                        <CardDescription>Enter the room code to join and view the shared screen</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {!isConnected ? (
                            <div className="space-y-4">
                                <Input placeholder="Enter room code" value={roomId} onChange={(e) => setRoomId(e.target.value)} disabled={isConnecting} />
                                <Button className="w-full" onClick={joinRoom} disabled={isConnecting || !roomId.trim()}>
                                    {isConnecting ? "Connecting..." : "Join Room"}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4" ref={videoContainerRef}>
                                <VideoPlayer videoRef={videoRef} isFullscreen={isFullscreen} onToggleFullscreen={toggleFullscreen} volume={volume} isMuted={isMuted} onVolumeChange={handleVolumeChange} onToggleMute={handleToggleMute} />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
