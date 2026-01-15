import { useRef, useState, useEffect, useCallback } from 'react';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
import type { Landmark, NormalizedLandmark } from '@mediapipe/tasks-vision';
import { Camera, Box, Activity, Wifi, WifiOff, Zap } from 'lucide-react';
import { calculateAngle, calculateSpineAngle } from '../utils/geometry';
import { createAnalysis } from '../api/analysis';
import type { AnalysisFrame, AnalysisResult, MetricRange } from '../api/analysis';
import SwingCanvas from '../components/SwingCanvas';

export default function VideoAnalyzer3D() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [landmarker, setLandmarker] = useState<PoseLandmarker | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [metrics, setMetrics] = useState({ shoulder: 0, hip: 0, knee: 0, spine: 0, handZ: 0 });
  const [worldLandmarks, setWorldLandmarks] = useState<Landmark[]>([]);
  const [aiResult, setAiResult] = useState<AnalysisResult | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  
  const requestRef = useRef<number>(0);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const analyzingRef = useRef(false);
  const framesRef = useRef<AnalysisFrame[]>([]);
  const lastSampleMsRef = useRef<number | null>(null);
  const lastUiUpdateMsRef = useRef<number | null>(null);

  // 1. WebSocket Connection with Auto-Reconnect
  const connectWebSocket = useCallback(function connectWebSocket() {
      if (socketRef.current?.readyState === WebSocket.OPEN) return;

      const ws = new WebSocket('ws://localhost:8001/ws/pose/');
      
      ws.onopen = () => {
          console.log('WS Connected');
          setWsConnected(true);
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      };
      
      ws.onclose = () => {
          console.log('WS Disconnected, retrying in 3s...');
          setWsConnected(false);
          socketRef.current = null;
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
      };
      
      ws.onerror = (err) => {
          console.error('WS Error', err);
          ws.close(); 
      };

      socketRef.current = ws;
  }, []);

  useEffect(() => {
      connectWebSocket();
      return () => {
          socketRef.current?.close();
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      }
  }, [connectWebSocket]);

  useEffect(() => {
    analyzingRef.current = analyzing;
  }, [analyzing]);

  // 1b. Load MediaPipe PoseLandmarker
  useEffect(() => {
    const createLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        const newLandmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose/pose_landmarker/float16/1/pose_landmarker.task`,
            delegate: "GPU"
            },
            runningMode: "VIDEO",
            numPoses: 1
        });
        setLandmarker(newLandmarker);
      } catch (e) {
          console.error("Failed to load MediaPipe", e);
      }
    };
    createLandmarker();
  }, []);

  // 2. Frame Processing Loop
  const predictWebcam = useCallback(function predictWebcam(timestampMs: number) {
    if (!landmarker || !videoRef.current || !canvasRef.current) return;

    if (videoRef.current.videoWidth > 0) {
        const result = landmarker.detectForVideo(videoRef.current, timestampMs);
        
        if (result.landmarks && result.landmarks.length > 0) {
            drawLandmarks(result.landmarks[0] as NormalizedLandmark[]);
            const nextMetrics = calculateMetrics3D(result.worldLandmarks[0] as Landmark[]);
            // Throttle expensive state updates to keep UI smooth.
            const lastUi = lastUiUpdateMsRef.current;
            if (lastUi === null || timestampMs - lastUi >= 33) {
              lastUiUpdateMsRef.current = timestampMs;
              setWorldLandmarks(result.worldLandmarks[0] as Landmark[]);
            }

            // Sample ~30fps to avoid huge payloads
            if (nextMetrics) {
              const last = lastSampleMsRef.current;
              if (last === null || timestampMs - last >= 33) {
                lastSampleMsRef.current = timestampMs;
                framesRef.current.push({
                  timestamp_ms: timestampMs,
                  shoulder_angle: Math.abs(nextMetrics.shoulder),
                  hip_rotation: Math.abs(nextMetrics.hip),
                  knee_flexion: Math.abs(nextMetrics.knee),
                  spine_angle: Math.abs(nextMetrics.spine),
                });
                // Cap frames buffer (about 20s @ 30fps)
                if (framesRef.current.length > 600) {
                  framesRef.current.splice(0, framesRef.current.length - 600);
                }
              }
            }
            
            // Stream to Backend -> Unreal
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                const packet = {
                    timestamp: timestampMs,
                    landmarks: result.worldLandmarks[0]
                };
                socketRef.current.send(JSON.stringify(packet));
            }
        }
    }

    if (analyzingRef.current) {
        requestRef.current = requestAnimationFrame(predictWebcam);
    }
  }, [landmarker]);

  useEffect(() => {
      if (analyzing && landmarker) {
          requestRef.current = requestAnimationFrame(predictWebcam);
      } else {
          if (requestRef.current) cancelAnimationFrame(requestRef.current);
      }
      return () => {
         if (requestRef.current) cancelAnimationFrame(requestRef.current);
      }
  }, [analyzing, landmarker, predictWebcam]);

  // 3. Drawing (2D Overlay)
  const drawLandmarks = (landmarks: NormalizedLandmark[]) => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx || !canvasRef.current) return;
      
      const width = canvasRef.current.width;
      const height = canvasRef.current.height;
      
      ctx.clearRect(0, 0, width, height);
      
      const connections = PoseLandmarker.POSE_CONNECTIONS;
      const drawingUtils = new DrawingUtils(ctx);
      
      for (const landmark of landmarks) {
          drawingUtils.drawLandmarks([landmark], { 
              radius: (data) => DrawingUtils.lerp(data.from!.z!, -0.15, 0.1, 4, 2),
              color: '#34d399',
              lineWidth: 1
          });
      }
      
      drawingUtils.drawConnectors(landmarks, connections, {
          color: '#10b981',
          lineWidth: 2
      });
  };

  // 4. Metrics Calculation
  const calculateMetrics3D = (landmarks: Landmark[]) => {
      // 11=LeftShoulder, 12=RightShoulder, 23=LeftHip, 24=RightHip, 25=LeftKnee, 27=LeftAnkle, 16=RightWrist
      const leftShoulder = landmarks[11];
      const rightShoulder = landmarks[12];
      const leftHip = landmarks[23];
      const rightHip = landmarks[24];
      const leftKnee = landmarks[25];
      const leftAnkle = landmarks[27];
      const rightWrist = landmarks[16];

      if (!leftShoulder || !rightHip) return;

      const handZ = rightWrist.z * 100;
      const toPoint = (lm: Landmark) => ({ position: { x: lm.x, y: lm.y } });

      const shoulderAng = calculateAngle(
              { position: { x: leftShoulder.x, y: leftShoulder.y - 1 } }, // Vertical
              toPoint(leftShoulder), 
              toPoint(rightShoulder)
      );
      const hipAng = calculateAngle(
              { position: { x: leftHip.x, y: leftHip.y - 1 } },
              toPoint(leftHip),
              toPoint(rightHip)
      );
      const kneeFlex = calculateAngle(toPoint(leftHip), toPoint(leftKnee), toPoint(leftAnkle));
      const spine = calculateSpineAngle(toPoint(leftShoulder), toPoint(rightShoulder), toPoint(leftHip), toPoint(rightHip));

      const next = {
          shoulder: Math.round(90 - shoulderAng),
          hip: Math.round(90 - hipAng),
          knee: Math.round(180 - kneeFlex),
          spine: Math.round(spine),
          handZ: handZ
      };

      setMetrics(next);
      return next;
  };

  const startCamera = async () => {
    try {
      framesRef.current = [];
      lastSampleMsRef.current = null;
      lastUiUpdateMsRef.current = null;
      const constraints = { video: { width: 1280, height: 720 } };
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.play();
        setAnalyzing(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const submitAnalysis = async () => {
       setAnalyzing(false);
       stream?.getTracks().forEach(track => track.stop());
       setStream(null);
       
       try {
           const result = await createAnalysis({
             shoulder_angle: Math.abs(metrics.shoulder),
             hip_rotation: Math.abs(metrics.hip),
             knee_flexion: Math.abs(metrics.knee),
             spine_angle: Math.abs(metrics.spine),
             frames: framesRef.current.length > 0 ? framesRef.current : undefined,
           });
           setAiResult(result);
           framesRef.current = [];
           lastSampleMsRef.current = null;
           lastUiUpdateMsRef.current = null;
       } catch (e) {
           console.error("Analysis submission failed", e);
       }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 font-sans">
        {/* Header */}
        <div className="max-w-7xl mx-auto flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
                <Box className="w-8 h-8 text-emerald-400" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                    GOLF CENTRE <span className="text-emerald-500">PRO</span>
                </span>
            </h1>
            
            <div className="flex items-center gap-4">
                 <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${wsConnected ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                    {wsConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
                    {wsConnected ? "UNREAL ENGINE: CONNECTED" : "UNREAL ENGINE: OFFLINE"}
                 </div>
                 <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold flex items-center gap-2">
                    <Activity size={14} />
                    MEDIAPIPE 3D
                 </div>
            </div>
        </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* 1. Camera Feed (2 cols) */}
            <div className="lg:col-span-2 relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl shadow-black/50 group">
                {!analyzing && !aiResult && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-black/40 backdrop-blur-sm">
                         <button onClick={startCamera} className="group/btn relative px-8 py-4 bg-emerald-600 rounded-full text-white font-bold overflow-hidden transition-all hover:scale-105 hover:bg-emerald-500 hover:shadow-[0_0_40px_rgba(16,185,129,0.4)]">
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                            <span className="relative flex items-center gap-3">
                                <Camera size={24} /> INITIALIZE SCANNER
                            </span>
                        </button>
                    </div>
                )}
                
                <video 
                    ref={videoRef} 
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                    playsInline muted
                />
                <canvas ref={canvasRef} width="1280" height="720" className="absolute inset-0 w-full h-full" />
                
                <div className="absolute top-4 left-4 flex gap-2">
                     <span className="px-2 py-1 bg-black/60 backdrop-blur text-[10px] text-white/70 rounded border border-white/10">RGB SENSOR: ACTIVE</span>
                     <span className="px-2 py-1 bg-black/60 backdrop-blur text-[10px] text-emerald-400 rounded border border-emerald-500/30 animate-pulse">LIVE</span>
                </div>
            </div>

            {/* 2. 3D WebGL Feed (1 col) */}
            <div className="relative aspect-square lg:aspect-auto rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
                 <SwingCanvas landmarks={worldLandmarks} />
            </div>

            {/* 3. Metrics (1 col) */}
            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 flex flex-col h-full shadow-xl">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                    <Zap className={`w-5 h-5 ${analyzing ? 'text-yellow-400' : 'text-slate-500'}`} />
                    TELEMETRY
                </h2>
                
                <div className="space-y-4 flex-1">
                    <MetricCard label="SHOULDER ROTATION" value={metrics.shoulder} target="90°+" />
                    <MetricCard label="HIP ROTATION" value={metrics.hip} target="45°+" />
                    <MetricCard label="KNEE FLEXION" value={metrics.knee} target="25°" />
                    <MetricCard label="HAND DEPTH (Z)" value={metrics.handZ} target="PLANE" is3D />
                </div>

                <div className="mt-6 pt-6 border-t border-slate-800">
                     {analyzing ? (
                        <button onClick={submitAnalysis} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all border border-blue-400/20">
                             GENERATE AI REPORT
                        </button>
                     ) : aiResult ? (
                         <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
                             <div className="flex justify-between items-center mb-3">
                                 <h3 className="font-bold text-blue-400 text-xs tracking-wider uppercase">AI Analysis Ready</h3>
                                 <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">MISTRAL-7B</span>
                             </div>
                             <p className="text-slate-300 text-sm leading-relaxed mb-4">{aiResult.ai_feedback}</p>

                             {aiResult.evaluation && (
                               <div className="mb-4 p-3 rounded-lg bg-slate-950 border border-slate-700">
                                 <div className="flex items-center justify-between mb-2">
                                   <span className="text-[10px] font-bold text-slate-500 tracking-wider">EVALUATION</span>
                                   <span className="text-xs font-black text-emerald-400">
                                     {aiResult.evaluation.overall_score.toFixed(0)}/100
                                   </span>
                                 </div>
                                 <div className="grid grid-cols-3 gap-2 text-center">
                                   <div className="p-2 rounded bg-slate-900 border border-slate-800">
                                     <div className="text-[10px] text-slate-500 font-bold">X-FACTOR</div>
                                     <div className="text-sm font-black text-white">{aiResult.evaluation.components.x_factor_score.toFixed(0)}</div>
                                   </div>
                                   <div className="p-2 rounded bg-slate-900 border border-slate-800">
                                     <div className="text-[10px] text-slate-500 font-bold">TEMPO</div>
                                     <div className="text-sm font-black text-white">{aiResult.evaluation.components.tempo_score.toFixed(0)}</div>
                                   </div>
                                   <div className="p-2 rounded bg-slate-900 border border-slate-800">
                                     <div className="text-[10px] text-slate-500 font-bold">POSTURE</div>
                                     <div className="text-sm font-black text-white">{aiResult.evaluation.components.posture_score.toFixed(0)}</div>
                                   </div>
                                 </div>

                                 {aiResult.evaluation.primary_recommendation && (
                                   <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                                     <div className="text-[10px] font-bold text-emerald-400 tracking-wider mb-1">
                                       TODAY'S ONE THING
                                     </div>
                                     <div className="text-sm font-black text-white mb-1">
                                       {aiResult.evaluation.primary_recommendation.title}
                                     </div>
                                     <div className="text-xs text-slate-300 mb-2">
                                       {aiResult.evaluation.primary_recommendation.reason}
                                     </div>
                                     <div className="text-xs text-slate-200 leading-relaxed">
                                       {aiResult.evaluation.primary_recommendation.drill}
                                     </div>
                                   </div>
                                 )}

                                 <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                                   <div className="p-2 rounded bg-slate-900 border border-slate-800">
                                     <div className="text-[10px] text-slate-500 font-bold">RELEASE</div>
                                     <div className="text-sm font-black text-white">
                                       {(aiResult.evaluation.components.release_score ?? 0).toFixed(0)}
                                     </div>
                                   </div>
                                   <div className="p-2 rounded bg-slate-900 border border-slate-800">
                                     <div className="text-[10px] text-slate-500 font-bold">SEQUENCE</div>
                                     <div className="text-sm font-black text-white">
                                       {(aiResult.evaluation.components.sequence_score ?? 0).toFixed(0)}
                                     </div>
                                   </div>
                                   <div className="p-2 rounded bg-slate-900 border border-slate-800">
                                     <div className="text-[10px] text-slate-500 font-bold">ROT SPEED</div>
                                     <div className="text-sm font-black text-white">
                                       {(aiResult.evaluation.components.rotation_speed_score ?? 0).toFixed(0)}
                                     </div>
                                   </div>
                                 </div>

                                 <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
                                   <div className="p-2 rounded bg-slate-900 border border-slate-800">
                                     <div className="text-[10px] text-slate-500 font-bold mb-1">TEMPO / DOWNSWING</div>
                                     <div className="flex justify-between">
                                       <span>Tempo</span>
                                       <span className="font-mono">{aiResult.evaluation.inputs.swing_tempo_ratio.toFixed(2)}</span>
                                     </div>
                                     <div className="flex justify-between">
                                       <span>Downswing</span>
                                       <span className="font-mono">{(aiResult.downswing_time_s ?? 0).toFixed(2)}s</span>
                                     </div>
                                   </div>
                                   <div className="p-2 rounded bg-slate-900 border border-slate-800">
                                     <div className="text-[10px] text-slate-500 font-bold mb-1">RELEASE / SEQUENCE</div>
                                     <div className="flex justify-between">
                                       <span>Release</span>
                                       <span className="font-mono">{(aiResult.evaluation.inputs.release_rate_rad_s ?? 0).toFixed(2)} rad/s</span>
                                     </div>
                                     <div className="flex justify-between">
                                       <span>Lead</span>
                                       <span className="font-mono">{(aiResult.evaluation.inputs.lead_ms ?? 0).toFixed(0)} ms</span>
                                     </div>
                                   </div>
                                 </div>

                                 {aiResult.evaluation.targets && (
                                   <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                     <TargetRow
                                       label="X-Factor"
                                       value={aiResult.evaluation.inputs.x_factor}
                                       target={aiResult.evaluation.targets.x_factor_deg}
                                     />
                                     <TargetRow
                                       label="Tempo"
                                       value={aiResult.evaluation.inputs.swing_tempo_ratio}
                                       target={aiResult.evaluation.targets.tempo_ratio}
                                     />
                                     <TargetRow
                                       label="Release"
                                       value={aiResult.evaluation.inputs.release_rate_rad_s ?? null}
                                       target={aiResult.evaluation.targets.release_rate_rad_s}
                                     />
                                     <TargetRow
                                       label="Lead"
                                       value={aiResult.evaluation.inputs.lead_ms ?? null}
                                       target={aiResult.evaluation.targets.lead_ms}
                                     />
                                   </div>
                                 )}
                                 {aiResult.evaluation.recommendations?.length > 0 && (
                                   <ul className="mt-3 space-y-1 text-xs text-slate-300 list-disc list-inside">
                                     {aiResult.evaluation.recommendations.slice(0, 3).map((r) => (
                                       <li key={r}>{r}</li>
                                     ))}
                                   </ul>
                                 )}
                               </div>
                             )}

                             <button onClick={() => setAiResult(null)} className="w-full py-2 border border-slate-600 text-slate-400 rounded-lg text-xs font-bold hover:bg-slate-700 hover:text-white transition">
                                DISMISS
                             </button>
                         </div>
                     ) : (
                         <div className="p-4 rounded-xl border border-dashed border-slate-700 text-center">
                             <p className="text-slate-500 text-xs">Waiting for sequence...</p>
                         </div>
                     )}
                </div>
            </div>
      </div>
    </div>
  );
}

function MetricCard({label, value, target, is3D}: {label: string, value: number, target: string, is3D?: boolean}) {
    // Determine color based on simple threshold logic (just for demo)
    // Determine color based on simple threshold logic (just for demo)
    // const isGood = value > 0; // Simplified - removed unused variable
    
    return (
        <div className="flex justify-between items-center p-4 rounded-xl bg-slate-950 border border-slate-800 relative overflow-hidden group">
            {/* Scanning line effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            
            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 tracking-wider mb-1">{label}</span>
                <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-black font-mono ${is3D ? 'text-blue-400' : 'text-white'}`}>
                        {value.toFixed(0)}
                    </span>
                    <span className="text-xs text-slate-600 font-bold">{is3D ? 'cm' : '°'}</span>
                </div>
            </div>
            
            <div className="text-right flex flex-col items-end">
                <span className="text-[10px] text-slate-600 uppercase">Target</span>
                <span className="text-xs font-bold text-emerald-500">{target}</span>
            </div>
        </div>
    )
}

function TargetRow({
  label,
  value,
  target,
}: {
  label: string;
  value: number | null;
  target: MetricRange;
}) {
  const status = getRangeStatus(value, target.min, target.max);
  const badge =
    status === 'good'
      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
      : status === 'warn'
        ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
        : 'bg-red-500/10 border-red-500/30 text-red-300';

  return (
    <div className="p-2 rounded bg-slate-900 border border-slate-800">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold text-slate-500">{label}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badge}`}>
          {status.toUpperCase()}
        </span>
      </div>
      <div className="flex items-center justify-between text-slate-300">
        <span className="font-mono">{value === null ? 'N/A' : value.toFixed(2)}</span>
        <span className="text-[10px] text-slate-500">
          {target.min.toFixed(0)}–{target.max.toFixed(0)} {target.unit}
        </span>
      </div>
    </div>
  );
}

function getRangeStatus(value: number | null, min: number, max: number): 'good' | 'warn' | 'bad' {
  if (value === null || Number.isNaN(value)) return 'bad';
  if (value >= min && value <= max) return 'good';
  const span = Math.max(1e-6, max - min);
  const dist = value < min ? (min - value) : (value - max);
  // within 20% of the range width => warn, else bad
  return dist <= 0.2 * span ? 'warn' : 'bad';
}
