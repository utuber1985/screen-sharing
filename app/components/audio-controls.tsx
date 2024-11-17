import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Volume2, VolumeX } from "lucide-react";

interface AudioControlsProps {
    volume: number;
    isMuted: boolean;
    onVolumeChange: (value: number) => void;
    onToggleMute: () => void;
}

export function AudioControls({ volume, isMuted, onVolumeChange, onToggleMute }: AudioControlsProps) {
    return (
        <div className="flex items-center gap-2">
            <Button variant="secondary" size="icon" onClick={onToggleMute}>
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Slider className="w-24" value={[volume]} max={1} step={0.1} onValueChange={(value) => onVolumeChange(value[0])} />
        </div>
    );
}
