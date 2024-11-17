import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2 } from "lucide-react";
import { RefObject } from "react";
import { AudioControls } from "./audio-controls";

interface VideoPlayerProps {
    videoRef: RefObject<HTMLVideoElement>;
    isFullscreen: boolean;
    onToggleFullscreen: () => void;
    volume: number;
    isMuted: boolean;
    onVolumeChange: (value: number) => void;
    onToggleMute: () => void;
}

export function VideoPlayer({ videoRef, isFullscreen, onToggleFullscreen, volume, isMuted, onVolumeChange, onToggleMute }: VideoPlayerProps) {
    const handleVideoClick = () => {
        if (videoRef.current) {
            videoRef.current.play().catch((error) => {
                console.error("Error playing video:", error);
            });
        }
    };

    return (
        <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden group">
            <video ref={videoRef} className="w-full h-full object-contain" autoPlay playsInline onClick={handleVideoClick} />
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <AudioControls volume={volume} isMuted={isMuted} onVolumeChange={onVolumeChange} onToggleMute={onToggleMute} />
                <Button variant="secondary" size="icon" onClick={onToggleFullscreen}>
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
            </div>
        </div>
    );
}
