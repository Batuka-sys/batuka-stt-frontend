"use client";

import {
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { Plus, Upload, Send, Play, Pause, X } from "lucide-react";
// Pause is used in the audio item playback controls

/* ── Static Waveform Bars ── */
function AudioWaveform({
  bars,
  progress = 0,
}: {
  bars: number[];
  progress?: number;
}) {
  return (
    <div className="flex items-center gap-[3px] h-10">
      {bars.map((height, i) => {
        const isPlayed = progress > 0 && i / bars.length <= progress;
        return (
          <div
            key={i}
            className={`w-1 rounded-full transition-colors duration-150 ${
              isPlayed ? "bg-blue-400" : "bg-zinc-500"
            }`}
            style={{ height: `${Math.max(4, height * 36)}px` }}
          />
        );
      })}
    </div>
  );
}

/* ── Generate waveform data from audio blob ── */
async function generateWaveformData(
  blob: Blob,
  barCount = 50,
): Promise<number[]> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioCtx = new AudioContext();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / barCount);
    const bars: number[] = [];

    for (let i = 0; i < barCount; i++) {
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channelData[i * blockSize + j]);
      }
      bars.push(sum / blockSize);
    }

    const max = Math.max(...bars);
    await audioCtx.close();
    return max > 0 ? bars.map((b) => b / max) : bars.map(() => 0.1);
  } catch {
    return Array.from({ length: barCount }, () => Math.random() * 0.5 + 0.2);
  }
}

interface AudioItem {
  id: string;
  url: string;
  blob: Blob;
  type: "recording" | "upload";
  name: string;
  duration?: number;
  waveformData?: number[];
}

export interface ChatHandle {
  toggleRecord: () => void;
}

interface ChatProps {
  onRecordingChange?: (isRecording: boolean) => void;
  onLevelChange?: (level: number) => void;
}

export const Chat = forwardRef<ChatHandle, ChatProps>(function Chat(
  { onRecordingChange, onLevelChange },
  ref,
) {
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); // ✅ Added canvas ref for animation

  const [open, setOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [level, setLevel] = useState(0);
  const [audioItems, setAudioItems] = useState<AudioItem[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [pendingItem, setPendingItem] = useState<AudioItem | null>(null);
  const [pendingPlaying, setPendingPlaying] = useState(false);
  const [pendingProgress, setPendingProgress] = useState(0);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const recordingRef = useRef(recording);
  const onLevelChangeRef = useRef(onLevelChange);
  const pendingAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    recordingRef.current = recording;
  }, [recording]);

  useEffect(() => {
    onLevelChangeRef.current = onLevelChange;
  }, [onLevelChange]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
      if (pendingAudioRef.current) {
        pendingAudioRef.current.pause();
        pendingAudioRef.current = null;
      }
    };
  }, []);

  // Notify parent of recording state changes
  useEffect(() => {
    onRecordingChange?.(recording);
  }, [recording, onRecordingChange]);

  // Sync pending item audio element when pendingItem changes
  useEffect(() => {
    if (pendingAudioRef.current) {
      pendingAudioRef.current.pause();
      pendingAudioRef.current = null;
      setPendingPlaying(false);
      setPendingProgress(0);
    }
    if (pendingItem) {
      const audio = new Audio(pendingItem.url);
      audio.ontimeupdate = () => {
        if (audio.duration) {
          setPendingProgress(audio.currentTime / audio.duration);
        }
      };
      audio.onended = () => {
        setPendingPlaying(false);
        setPendingProgress(0);
      };
      pendingAudioRef.current = audio;
    }
  }, [pendingItem]);

  // RECORD
  const toggleRecord = useCallback(async () => {
    if (!recordingRef.current) {
      try {
        if (audioCtxRef.current || streamRef.current) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        streamRef.current = stream;

        // MediaRecorder
        mediaRecorder.current = new MediaRecorder(stream);
        chunks.current = [];

        mediaRecorder.current.ondataavailable = (e) =>
          chunks.current.push(e.data);

        mediaRecorder.current.onstop = async () => {
          const blob = new Blob(chunks.current, { type: "audio/webm" });
          const url = URL.createObjectURL(blob);
          const id = Date.now().toString();
          const waveformData = await generateWaveformData(blob);
          setPendingItem({
            id,
            url,
            blob,
            type: "recording",
            name: `Recording ${new Date().toLocaleTimeString()}`,
            waveformData,
          });
          chunks.current = [];
        };

        mediaRecorder.current.start();

        // AudioContext for visualization
        const audioCtx = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
        audioCtxRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256; // 128 frequency bins

        source.connect(analyser);
        analyserRef.current = analyser;

        const timeDataArray = new Uint8Array(analyser.fftSize);
        const freqDataArray = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          const analyserNode = analyserRef.current;
          if (!analyserNode) return;

          // 1. Calculate RMS for level (optional, if you still use it)
          analyserNode.getByteTimeDomainData(timeDataArray);
          let sum = 0;
          for (let i = 0; i < timeDataArray.length; i++) {
            const v = (timeDataArray[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / timeDataArray.length);
          setLevel(rms);
          onLevelChangeRef.current?.(rms);

          // 2. ✅ Draw waveform animation on canvas
          analyserNode.getByteFrequencyData(freqDataArray);
          const canvas = canvasRef.current;

          if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              const barWidth = 4;
              const gap = 3;
              const barCount = Math.floor(canvas.width / (barWidth + gap));
              const step = Math.floor(freqDataArray.length / barCount);

              ctx.fillStyle = "#71717a"; // Tailwind zinc-500 color for the bars

              for (let i = 0; i < barCount; i++) {
                let freqSum = 0;
                for (let j = 0; j < step; j++) {
                  freqSum += freqDataArray[i * step + j];
                }
                const average = freqSum / step;

                // Map frequency (0-255) to bar height
                // Math.max guarantees a minimum 4px bar height for silence
                const barHeight = Math.max(4, (average / 255) * canvas.height);

                const x = i * (barWidth + gap);
                const y = (canvas.height - barHeight) / 2; // Centers the bar vertically

                ctx.beginPath();
                ctx.roundRect(x, y, barWidth, barHeight, 2); // 2px border radius like the image
                ctx.fill();
              }
            }
          }

          rafRef.current = requestAnimationFrame(tick);
        };

        tick();

        setRecording(true);
        setRecordingTime(0);

        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      } catch (error) {
        console.error("Error accessing microphone:", error);
        alert("Could not access microphone. Please check permissions.");
      }
    } else {
      mediaRecorder.current?.stop();
      setRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      setLevel(0);

      // Clear the canvas on stop
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }

      analyserRef.current = null;
    }
  }, []);

  // Expose toggleRecord to parent via ref
  useImperativeHandle(ref, () => ({ toggleRecord }), [toggleRecord]);

  // FILE UPLOAD
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      alert("Only audio files allowed");
      return;
    }

    const url = URL.createObjectURL(file);
    const id = Date.now().toString();
    const waveformData = await generateWaveformData(file);
    setPendingItem({
      id,
      url,
      blob: file,
      type: "upload",
      name: file.name,
      waveformData,
    });
    setOpen(false);
  };

  // PLAYBACK
  const togglePlayback = (id: string) => {
    if (playingId === id) {
      audioRefs.current[id]?.pause();
      setPlayingId(null);
      setPlaybackProgress(0);
      return;
    }

    if (playingId && audioRefs.current[playingId]) {
      audioRefs.current[playingId].pause();
      audioRefs.current[playingId].currentTime = 0;
    }

    const item = audioItems.find((a) => a.id === id);
    if (!item) return;

    if (!audioRefs.current[id]) {
      audioRefs.current[id] = new Audio(item.url);
    }

    const audio = audioRefs.current[id];
    audio.currentTime = 0;
    audio.ontimeupdate = () => {
      if (audio.duration) {
        setPlaybackProgress(audio.currentTime / audio.duration);
      }
    };
    audio.onended = () => {
      setPlayingId(null);
      setPlaybackProgress(0);
    };

    audio.play().catch(console.error);
    setPlayingId(id);
    setPlaybackProgress(0);
  };

  // REMOVE AUDIO ITEM
  const removeAudioItem = (id: string) => {
    if (playingId === id) {
      audioRefs.current[id]?.pause();
      setPlayingId(null);
      setPlaybackProgress(0);
    }
    if (audioRefs.current[id]) {
      delete audioRefs.current[id];
    }
    setAudioItems((prev) => prev.filter((a) => a.id !== id));
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const togglePendingPlayback = () => {
    if (!pendingAudioRef.current) return;
    if (pendingPlaying) {
      pendingAudioRef.current.pause();
      setPendingPlaying(false);
    } else {
      pendingAudioRef.current.play().catch(console.error);
      setPendingPlaying(true);
    }
  };

  const handleSend = () => {
    if (!pendingItem) return;
    setAudioItems((prev) => [...prev, pendingItem]);
    setPendingItem(null);
    // TODO: trigger transcription
  };

  return (
    <div className="w-full flex justify-end z-20 pt-24 pr-6">
      <div className="relative w-[1100px] h-[700px] bg-zinc-800/50 backdrop-blur-md rounded-md overflow-hidden">
        {/* CHAT CONTENT AREA */}
        <div className="h-full overflow-y-auto p-6 pb-24">
          {audioItems.length === 0 && (
            <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
              Record or upload audio to get started
            </div>
          )}

          {audioItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 bg-zinc-700/40 backdrop-blur-sm
                border border-zinc-600/30 rounded-xl mb-3 group animate-slide-up"
            >
              {/* Play/Pause */}
              <button
                onClick={() => togglePlayback(item.id)}
                className="flex-shrink-0 p-2.5 rounded-full bg-blue-500/20
                  hover:bg-blue-500/30 transition text-blue-400"
              >
                {playingId === item.id ? (
                  <Pause size={16} />
                ) : (
                  <Play size={16} />
                )}
              </button>

              {/* Info + Waveform */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-300 mb-1.5 truncate">
                  {item.name}
                </p>
                {item.waveformData ? (
                  <AudioWaveform
                    bars={item.waveformData}
                    progress={playingId === item.id ? playbackProgress : 0}
                  />
                ) : (
                  <div className="h-10 flex items-center">
                    <div className="text-xs text-zinc-500">
                      Loading waveform...
                    </div>
                  </div>
                )}
              </div>

              {/* Duration */}
              {item.duration ? (
                <span className="text-xs text-zinc-400 flex-shrink-0">
                  {formatDuration(item.duration)}
                </span>
              ) : null}

              {/* Delete */}
              <button
                onClick={() => removeAudioItem(item.id)}
                className="flex-shrink-0 p-2 rounded-full hover:bg-white/10
                  transition opacity-0 group-hover:opacity-100 text-zinc-400
                  hover:text-red-400"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* BOTTOM BAR */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <div
            className="relative flex items-center gap-3 px-4 py-3
            bg-blue-500/10 backdrop-blur-xl border border-blue-300/20
            rounded-full shadow-xl w-[650px]"
          >
            {/* PLUS */}
            <button
              onClick={() => setOpen(!open)}
              className="p-3 rounded-full hover:bg-white/10 transition"
            >
              <Plus size={20} />
            </button>

            {/* DROPDOWN */}
            {open && (
              <div
                className="absolute bottom-16 left-2
                bg-[#0b1220]/95 backdrop-blur-xl border border-white/10
                rounded-xl shadow-xl w-48 overflow-hidden"
              >
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-white/10 text-sm"
                >
                  <Upload size={18} />
                  Upload Audio
                </button>
                <button className="flex items-center gap-3 w-full px-4 py-3 hover:bg-white/10 text-sm">
                  Service
                </button>
              </div>
            )}

            {/* DYNAMIC MIDDLE SECTION */}
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              {recording ? (
                <div className="flex items-center gap-4 w-full justify-center">
                  <span className="text-red-400 text-sm font-medium animate-pulse">
                    {formatTime(recordingTime)}
                  </span>
                  <canvas
                    ref={canvasRef}
                    width={200}
                    height={40}
                    className="w-[200px] h-10"
                  />
                </div>
              ) : pendingItem ? (
                <div className="flex items-center gap-2 w-full px-1">
                  {/* Preview play/pause */}
                  <button
                    onClick={togglePendingPlayback}
                    className="flex-shrink-0 p-2 rounded-full bg-blue-500/20
                      hover:bg-blue-500/30 transition text-blue-400"
                  >
                    {pendingPlaying ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-400 truncate mb-1">
                      {pendingItem.name}
                    </p>
                    {pendingItem.waveformData && (
                      <AudioWaveform
                        bars={pendingItem.waveformData}
                        progress={pendingProgress}
                      />
                    )}
                  </div>
                  <button
                    onClick={() => setPendingItem(null)}
                    className="flex-shrink-0 p-1.5 rounded-full hover:bg-white/10
                      text-zinc-400 hover:text-red-400 transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <span className="text-zinc-400 text-sm w-full text-left pl-4">
                  Click the mic to start recording...
                </span>
              )}
            </div>

            {/* SEND BUTTON — active only when a pending item is staged */}
            <button
              onClick={handleSend}
              disabled={!pendingItem}
              className={`ml-auto p-3 rounded-full transition shadow-lg ${
                pendingItem
                  ? "bg-blue-500/70 hover:bg-blue-500 cursor-pointer"
                  : "bg-zinc-700/50 cursor-not-allowed opacity-40"
              }`}
            >
              <Send size={20} />
            </button>

            <input
              ref={fileRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFile}
            />
          </div>
        </div>
      </div>
    </div>
  );
});
