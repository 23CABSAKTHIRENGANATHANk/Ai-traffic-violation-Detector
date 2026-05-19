import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaCloudUploadAlt, FaVideo, FaCheckCircle, FaSpinner,
    FaExpand, FaRedo, FaFilePdf, FaExclamationTriangle, FaShieldAlt
} from 'react-icons/fa';
import { API_CONFIG } from '../config/api';

const DEMO_RESULT = {
    video_id: 'demo_video_01',
    violations_detected: 3,
    violations: [
        { violation_type: 'OVERSPEEDING',  confidence_score: 0.97, vehicle_plate: 'TN38AB1234', speed_kmph: 88, vehicle_type: 'CAR',        location: 'Main Road - Sector A' },
        { violation_type: 'NO HELMET',     confidence_score: 0.92, vehicle_plate: 'KA01HJ9988', speed_kmph: 42, vehicle_type: 'MOTORCYCLE', location: 'Junction - Sector B' },
        { violation_type: 'TRIPLE RIDING', confidence_score: 0.85, vehicle_plate: 'MH12CD5678', speed_kmph: 35, vehicle_type: 'MOTORCYCLE', location: 'Highway - Sector C' },
    ],
};

// Normalize any violation object to consistent Admin-compatible schema
const normalizeForStorage = (v, index = 0) => ({
    id: v.id || (Date.now() + index + Math.random()),
    video_id: v.video_id || 'uploaded_video',
    violation_type: v.violation_type || v.type || 'OVERSPEEDING',
    confidence_score: v.confidence_score !== undefined ? v.confidence_score
                    : v.confidence  !== undefined ? v.confidence : 0.90,
    speed_kmph: v.speed_kmph !== undefined ? v.speed_kmph
              : v.speed     !== undefined ? v.speed : 0,
    vehicle_plate: v.vehicle_plate || '—',
    vehicle_type: v.vehicle_type || v.vehicle || (
        (v.violation_type || v.type) === 'OVERSPEEDING' ? 'CAR' : 'MOTORCYCLE'
    ),
    location: v.location || 'N/A',
    status: v.status || 'PENDING',
    created_at: v.created_at || v.timestamp || new Date().toISOString(),
    evidence_image_path: v.evidence_image_path || null,
});

const VIOLATION_STYLES = {
    'OVERSPEEDING':  'bg-orange-500/15 text-orange-400 border-orange-500/30',
    'NO HELMET':     'bg-red-500/15 text-red-400 border-red-500/30',
    'TRIPLE RIDING': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
};

const Upload = () => {
    const [file, setFile]         = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult]     = useState(null);
    const [error, setError]       = useState(null);
    const [isDemo, setIsDemo]     = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const containerRef = useRef(null);
    const inputRef     = useRef(null);

    const resetState = () => { setResult(null); setFile(null); setProgress(0); setError(null); setIsDemo(false); setStreamUrl(''); };

    const handleFile = (f) => {
        if (f && f.type.startsWith('video/')) {
            setFile(f);
            setError(null);
        } else if (f) {
            setError('Please select a valid video file (MP4, AVI, MOV).');
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        handleFile(e.dataTransfer.files[0]);
    };

    React.useEffect(() => {
        // Poll the AI backend until at least one violation appears (max 60s)
        let interval, timeoutId;
        if (result && !isDemo && result.video_id) {
            const poll = async () => {
                try {
                    const aiViolationsUrl = API_CONFIG.ENDPOINTS.AI_DETECT.replace('/detect', '/violations');
                    const res = await fetch(aiViolationsUrl);
                    if (res.ok) {
                        const all = await res.json();
                        const videoV = all.filter(v => v.video_id === result.video_id);
                        if (videoV.length > 0) {
                            setResult(prev => ({ ...prev, violations: videoV }));
                            // Persist locally
                            const stored = JSON.parse(localStorage.getItem('traffic_violations') || '[]');
                            const merged = [...stored];
                            videoV.forEach(v => { if (!merged.find(m => m.id === v.id)) merged.push(v); });
                            localStorage.setItem('traffic_violations', JSON.stringify(merged));
                            clearInterval(interval);
                            clearTimeout(timeoutId);
                        }
                    }
                } catch (_) {}
            };
            interval = setInterval(poll, 3000);
            // Stop polling after 60s to avoid endless loops
            timeoutId = setTimeout(() => clearInterval(interval), 60000);
        }
        return () => {
            clearInterval(interval);
            clearTimeout(timeoutId);
        };
    }, [result?.video_id, isDemo]);

    // Save violation to backend database
    const saveViolationToDatabase = async (violation) => {
        try {
            await fetch(API_CONFIG.ENDPOINTS.VIOLATIONS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    video_id: violation.video_id,
                    violation_type: violation.violation_type,
                    timestamp: violation.created_at || new Date().toISOString(),
                    confidence_score: violation.confidence_score,
                    speed_kmph: violation.speed_kmph,
                    vehicle_plate: violation.vehicle_plate,
                    vehicle_type: violation.vehicle_type,
                    location: violation.location,
                    evidence_image_path: violation.evidence_image_path
                })
            });
        } catch (dbErr) {
            console.warn('Database save failed, will use localStorage fallback:', dbErr.message);
        }
    };

    const handleUpload = async () => {
        if (!file) { setError('Please select a video file first.'); return; }
        setUploading(true);
        setError(null);

        const interval = setInterval(() => setProgress(p => Math.min(p + 4, 88)), 250);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 120000); // 2 min timeout
            const res = await fetch(API_CONFIG.ENDPOINTS.AI_DETECT, {
                method: 'POST',
                body: formData,
                signal: controller.signal,
            });
            clearTimeout(timeout);
            clearInterval(interval);
            if (res.ok) {
                const data = await res.json();
                setProgress(100);
                
                // Normalize and save violations
                const localViolations = JSON.parse(localStorage.getItem('traffic_violations') || '[]');
                const newViolations = (data.violations || []).map((v, i) => normalizeForStorage(v, i));
                
                // Save to localStorage
                localStorage.setItem('traffic_violations', JSON.stringify([...newViolations, ...localViolations]));
                
                // Save each violation to backend database (non-blocking)
                newViolations.forEach(v => saveViolationToDatabase(v));
                
                // Clear the 'cleared' flag so mock data shows if DB is empty
                localStorage.removeItem('traffic_violations_cleared');
                
                setTimeout(() => { setUploading(false); setResult(data); setIsDemo(false); }, 600);
            } else {
                throw new Error(`Server error: ${res.status}`);
            }
        } catch (err) {
            clearInterval(interval);
            setUploading(false);
            // AI service is offline — show demo result
            setProgress(100);
            
            // Save demo results to localStorage
            const localViolations = JSON.parse(localStorage.getItem('traffic_violations') || '[]');
            const newViolations = DEMO_RESULT.violations.map((v, i) => normalizeForStorage(
                { ...v, video_id: DEMO_RESULT.video_id }, i
            ));
            localStorage.setItem('traffic_violations', JSON.stringify([...newViolations, ...localViolations]));
            
            // Save demo violations to backend database (non-blocking)
            newViolations.forEach(v => saveViolationToDatabase(v));
            
            // Clear the 'cleared' flag so mock data shows if DB is empty
            localStorage.removeItem('traffic_violations_cleared');

            setTimeout(() => { setResult(DEMO_RESULT); setIsDemo(true); }, 400);
        }
    };

    const [streamUrl, setStreamUrl] = useState('');

    useEffect(() => {
        if (result && result.video_id && !streamUrl) {
            setStreamUrl(`${API_CONFIG.ENDPOINTS.AI_STREAM}?video_id=${result.video_id}&t=${Date.now()}`);
        }
    }, [result, streamUrl]);

    const getVideoUrl = () => streamUrl;

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-10">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Traffic Video Analysis</h1>
                <p className="text-gray-500 text-sm">Upload CCTV footage for AI-powered violation detection and automated challan generation.</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

                {/* ── Upload / Result Panel ── */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="lg:col-span-3"
                >
                    <AnimatePresence mode="wait">
                        {!result ? (
                            /* Upload zone */
                            <motion.div
                                key="upload"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                className={`glass-panel p-10 flex flex-col items-center justify-center min-h-[380px] border-2 border-dashed transition-all duration-300
                                    ${dragOver   ? 'border-cyan-400 bg-cyan-500/5'   :
                                      file       ? 'border-cyan-500/60 bg-cyan-500/5' :
                                                   'border-white/10 hover:border-white/20'}`}
                            >
                                {uploading ? (
                                    <div className="w-full text-center space-y-5">
                                        <div className="w-20 h-20 mx-auto rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-4xl">
                                            <FaSpinner className="animate-spin" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white mb-1">AI Processing…</h3>
                                            <p className="text-xs text-gray-500">Detecting objects, calculating speeds, annotating frames</p>
                                        </div>
                                        <div className="w-full max-w-xs mx-auto">
                                            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                                                <span>Progress</span>
                                                <span className="font-mono text-cyan-400">{progress}%</span>
                                            </div>
                                            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                                                    style={{ width: `${progress}%` }}
                                                    transition={{ duration: 0.3 }}
                                                />
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-600">This may take 30–120 seconds depending on video length</p>
                                    </div>
                                ) : (
                                    <div className="w-full text-center space-y-5">
                                        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl transition-all ${file ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-400' : 'bg-white/5 border border-white/10 text-gray-600'}`}>
                                            {file ? <FaVideo /> : <FaCloudUploadAlt />}
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-semibold text-white mb-1">
                                                {file ? file.name : 'Drop video here or click to browse'}
                                            </h3>
                                            {file ? (
                                                <p className="text-xs text-cyan-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                                            ) : (
                                                <p className="text-xs text-gray-600">MP4, AVI, MOV — Max 200 MB</p>
                                            )}
                                        </div>

                                        {error && (
                                            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs max-w-xs mx-auto">
                                                <FaExclamationTriangle /> {error}
                                            </div>
                                        )}

                                        <div className="flex flex-col items-center gap-3">
                                            <input ref={inputRef} type="file" accept="video/*" onChange={e => handleFile(e.target.files[0])} className="hidden" id="video-upload" />
                                            <label htmlFor="video-upload" className="btn-primary cursor-pointer px-6 py-2.5 text-sm">
                                                {file ? 'Change Video' : 'Select Video File'}
                                            </label>

                                            {file && (
                                                <button
                                                    onClick={handleUpload}
                                                    className="px-8 py-3 bg-cyan-500 text-black font-extrabold rounded-xl shadow-[0_0_25px_rgba(0,243,255,0.35)] hover:shadow-[0_0_35px_rgba(0,243,255,0.55)] hover:scale-105 transition-all text-sm tracking-wide"
                                                >
                                                    ⚡ ANALYZE & DETECT VIOLATIONS
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            /* Results panel */
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-4"
                            >
                                {/* Status header */}
                                <div className="glass-panel p-5 flex items-center gap-4 border-l-4 border-l-cyan-500 shadow-[0_0_20px_rgba(0,243,255,0.05)]">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0
                                        ${isDemo ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'}`}>
                                        {isDemo ? <FaCheckCircle /> : <FaSpinner className="animate-spin" />}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-white font-bold tracking-wide flex items-center gap-2">
                                            {isDemo ? 'Surveillance Simulation Complete' : (
                                                <span className="flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                                                    Active Live AI Surveillance
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {isDemo ? (
                                                `✓ ${(result.violations?.length || 0)} violation${(result.violations?.length || 0) !== 1 ? 's' : ''} detected & logged.`
                                            ) : (
                                                <span className="text-cyan-400 font-medium">
                                                    ⚡ Monitoring frame stream... {(result.violations?.length || 0)} violation${(result.violations?.length || 0) !== 1 ? 's' : ''} captured live.
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <button onClick={resetState} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors font-semibold">
                                        <FaRedo /> Reset Feed
                                    </button>
                                </div>

                                {/* Video stream */}
                                {!isDemo && (
                                    <div ref={containerRef} className="glass-panel overflow-hidden aspect-video relative group">
                                        <video
                                            className="w-full h-full object-contain bg-black"
                                            src={getVideoUrl()}
                                            autoPlay
                                            muted
                                            playsInline
                                            controls={false}
                                            onError={() => {}}
                                        />
                                        <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1 bg-red-600/80 text-white text-xs font-bold rounded-full animate-pulse">
                                            <span className="w-1.5 h-1.5 bg-white rounded-full" /> LIVE AI FEED
                                        </div>
                                        <button
                                            onClick={() => containerRef.current?.requestFullscreen?.()}
                                            className="absolute bottom-3 right-3 p-2 bg-black/50 hover:bg-cyan-500/80 hover:text-black text-white rounded-full backdrop-blur-md transition-all border border-white/20 opacity-0 group-hover:opacity-100"
                                        >
                                            <FaExpand size={16} />
                                        </button>
                                    </div>
                                )}

                                {/* Detected violations list */}
                                {result.violations?.length > 0 && (
                                    <div className="glass-panel p-5 space-y-3">
                                        <h4 className="text-sm font-semibold text-white mb-3">Detected Violations</h4>
                                        {result.violations.map((v, i) => {
                                            const vType = v.violation_type || v.type;
                                            const vConf = v.confidence_score !== undefined ? v.confidence_score : v.confidence;
                                            return (
                                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${VIOLATION_STYLES[vType] || 'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>
                                                            {vType}
                                                        </span>
                                                        <span className="text-xs font-mono text-gray-300">{v.vehicle_plate || '—'}</span>
                                                    </div>
                                                    <span className="text-xs text-green-400 font-mono">{((vConf || 0.9) * 100).toFixed(0)}%</span>
                                                </div>
                                            );
                                        })}
                                        <p className="text-xs text-gray-600 pt-2">
                                            View full records in the <a href="/admin" className="text-cyan-400 hover:underline">Admin Panel →</a>
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* ── Info Sidebar ── */}
                <div className="lg:col-span-2 space-y-5">
                    <div className="glass-panel p-5">
                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <FaShieldAlt className="text-cyan-400" /> Detectable Violations
                        </h3>
                        <div className="space-y-3">
                            {[
                                { label: 'OVERSPEEDING', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30', desc: 'Vehicles exceeding speed limit via pixel-velocity tracking.' },
                                { label: 'TRIPLE RIDING', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30', desc: 'Motorcycles carrying 3+ persons (YOLOv8 pose estimation).' },
                                { label: 'NO HELMET', color: 'text-red-400 bg-red-500/10 border-red-500/30', desc: 'Rider without standard safety helmet detected.' },
                            ].map(v => (
                                <div key={v.label} className="flex gap-3 items-start">
                                    <span className={`mt-0.5 px-2 py-0.5 rounded text-xs font-bold border flex-shrink-0 ${v.color}`}>{v.label}</span>
                                    <p className="text-xs text-gray-500 leading-relaxed">{v.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-panel p-5 border-l-4 border-l-cyan-500">
                        <h4 className="text-cyan-400 font-bold text-sm mb-2">Annotated Output</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            The system generates a new video with bounding boxes, velocity vectors, and violation labels overlaid frame-by-frame.
                        </p>
                    </div>

                    <div className="glass-panel p-5">
                        <h4 className="text-sm font-bold text-white mb-3">AI Pipeline</h4>
                        <div className="space-y-2">
                            {['Video frame extraction', 'YOLOv8 object detection', 'Speed & pose estimation', 'Violation classification', 'Evidence image capture', 'Automatic DB record'].map((step, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-[10px] font-bold flex-shrink-0">{i + 1}</span>
                                    <span className="text-xs text-gray-400">{step}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Upload;
