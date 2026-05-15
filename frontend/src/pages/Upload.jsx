import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCloudUploadAlt, FaVideo, FaCheckCircle, FaSpinner, FaPlayCircle, FaDownload, FaRedo, FaExpand } from 'react-icons/fa';

const Upload = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const videoRef = useRef(null);
    const containerRef = useRef(null);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please select a video file first.");
            return;
        }

        setUploading(true);
        // Simulate progress for UX
        const interval = setInterval(() => {
            setProgress(prev => Math.min(prev + 5, 90));
        }, 300);

        const formData = new FormData();
        formData.append('file', file);

        try {
            // Direct connection to AI Service (No file save on backend required)
            const response = await fetch('http://localhost:8000/detect', {
                method: 'POST',
                body: formData,
            });

            clearInterval(interval);

            if (response.ok) {
                const data = await response.json();
                console.log(data);
                setProgress(100);
                setTimeout(() => {
                    setUploading(false);
                    setResult(data);
                }, 500);
            } else {
                throw new Error("Upload failed");
            }
        } catch (err) {
            clearInterval(interval);
            setUploading(false);
            setError("Failed to upload video. Ensure AI Service (Port 8000) is running.");
        }
    };

    const getVideoUrl = () => {
        if (!result) return "";
        const vidId = result.video_id;
        // Connect directly to AI service stream
        return `http://localhost:8000/video_feed?video_id=${vidId}&t=${Date.now()}`;
    };

    const handleVideoError = () => {
        // If video fails to load (likely because processing isn't done yet),
        // we can just let the user manually refresh.
        console.log("Video not ready or format unsupported.");
    };

    const reloadVideo = () => {
        if (videoRef.current) {
            videoRef.current.src = getVideoUrl();
            videoRef.current.load();
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
            >
                <h1 className="text-4xl font-bold text-white mb-4">Traffic Video Analysis</h1>
                <p className="text-gray-400 text-lg">Upload CCTV footage to detect violations and generate evidence videos.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

                {/* Upload Zone */}
                <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className={`glass-panel p-10 border-2 border-dashed ${file ? 'border-neon-blue' : 'border-gray-600'} flex flex-col items-center justify-center min-h-[400px] transition-colors`}
                >
                    {!result ? (
                        <>
                            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 text-neon-blue text-4xl">
                                {uploading ? <FaSpinner className="animate-spin" /> : <FaCloudUploadAlt />}
                            </div>

                            {uploading ? (
                                <div className="w-full text-center">
                                    <h3 className="text-xl font-semibold text-white mb-4">AI Processing in Progress...</h3>
                                    <p className="text-xs text-gray-500 mb-2">Analyzing objects, calculating speeds, annotating video...</p>
                                    <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-neon-blue transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <p className="text-gray-400 mt-2 font-mono">{progress}%</p>
                                </div>
                            ) : (
                                <>
                                    <input
                                        type="file"
                                        accept="video/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="video-upload"
                                    />
                                    <label
                                        htmlFor="video-upload"
                                        className="btn-primary cursor-pointer mb-4"
                                    >
                                        Select Traffic Video
                                    </label>
                                    <p className="text-gray-500 text-sm">Supported: MP4, AVI (Max 100MB)</p>
                                    {file && (
                                        <div className="mt-6 flex items-center gap-2 text-green-400 bg-green-400/10 px-4 py-2 rounded-lg">
                                            <FaVideo />
                                            <span className="truncate max-w-[200px]">{file.name}</span>
                                        </div>
                                    )}
                                    {error && <p className="text-red-400 mt-4">{error}</p>}

                                    {file && (
                                        <button
                                            onClick={handleUpload}
                                            className="mt-8 bg-neon-blue text-black font-extrabold px-8 py-3 rounded-xl shadow-[0_0_20px_rgba(0,243,255,0.4)] hover:shadow-[0_0_30px_rgba(0,243,255,0.6)] transition-all"
                                        >
                                            ANALYZE & GENERATE
                                        </button>
                                    )}
                                </>
                            )}
                        </>
                    ) : (
                        <div className="text-center w-full">
                            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4 text-green-400 text-3xl mx-auto border border-green-500/50">
                                <FaCheckCircle />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-6">Analysis Complete!</h3>

                            {/* Live Video Stream using MJPEG */}
                            <div ref={containerRef} className="w-full bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 aspect-video relative group flex items-center justify-center">
                                <img
                                    ref={videoRef}
                                    className="w-full h-full object-contain"
                                    src={getVideoUrl()}
                                    alt="Live Analytics Feed"
                                    onError={() => console.log("Stream not ready or ended")}
                                />
                                <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-red-600/80 text-white text-xs font-bold rounded-full animate-pulse z-10">
                                    <span className="w-2 h-2 bg-white rounded-full"></span> LIVE AI FEED
                                </div>
                                <button
                                    onClick={toggleFullScreen}
                                    className="absolute bottom-4 right-4 p-2 bg-black/50 hover:bg-neon-blue/80 hover:text-black text-white rounded-full backdrop-blur-md transition-all z-10 border border-white/20"
                                    title="Full Screen"
                                >
                                    <FaExpand size={18} />
                                </button>
                            </div>

                            <div className="mt-6 flex flex-col gap-4">
                                <button
                                    onClick={reloadVideo}
                                    className="text-neon-blue text-sm hover:underline flex items-center justify-center gap-2"
                                >
                                    <FaRedo /> Result not loading? Click to Refresh
                                </button>

                                <p className="text-xs text-gray-500">
                                    Use "Admin Panel" to view detected violations list.
                                </p>

                                <button
                                    onClick={() => { setResult(null); setFile(null); setProgress(0); }}
                                    className="text-gray-400 hover:text-white underline text-sm mt-4"
                                >
                                    Upload New Video
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Info / Preview Panel */}
                <div className="px-6 text-gray-300 space-y-6">
                    <div className="glass-panel p-6 bg-deep-bg/50">
                        <h3 className="text-lg font-bold text-white mb-4">Supported Violations</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <span className="bg-red-500/20 text-red-500 px-2 py-1 rounded text-xs font-bold mt-1">OVERSPEED</span>
                                <p className="text-sm text-gray-400">Detects vehicles exceeding speed limit based on pixel movement tracking.</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="bg-purple-500/20 text-purple-500 px-2 py-1 rounded text-xs font-bold mt-1">TRIPLE RIDING</span>
                                <p className="text-sm text-gray-400">Flags motorcycles carrying more than 2 passengers.</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="bg-orange-500/20 text-orange-500 px-2 py-1 rounded text-xs font-bold mt-1">NO HELMET</span>
                                <p className="text-sm text-gray-400">Identifies riders without standard safety helmets (Beta).</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                        <h4 className="text-blue-400 font-bold mb-1">Video Annotation</h4>
                        <p className="text-sm text-blue-500/80">The system automatically generates a new video file with bounding boxes and violation labels overlaid.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Upload;
