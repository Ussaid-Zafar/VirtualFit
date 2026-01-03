import React, { useState, useEffect, useRef } from 'react';
import { productsAPI } from '../services/api';

const TryOn = () => {
    const [selectedUpper, setSelectedUpper] = useState(null); // Shirt/Top
    const [selectedLower, setSelectedLower] = useState(null); // Pant/Bottom
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Camera state
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    // Tutorial and Scanning states
    const [showTutorial, setShowTutorial] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0); // 0-100%
    const [scanComplete, setScanComplete] = useState(false);



    // Fetch products on mount
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await productsAPI.getAll();
            if (response.success) {
                setProducts(response.data);
            }
        } catch (err) {
            console.error('Failed to load products:', err);
        } finally {
            setLoading(false);
        }
    };

    // Listen for commands from the Dashboard
    useEffect(() => {
        const channel = new BroadcastChannel('virtual-fit-app');
        channel.onmessage = (event) => {
            if (event.data.type === 'SELECT_ITEM') {
                handleProductSelect(event.data.payload);
            }
        };
        return () => channel.close();
    }, []);

    // Prevent Back Navigation
    useEffect(() => {
        window.history.pushState(null, null, window.location.href);
        const handlePopState = () => {
            window.history.pushState(null, null, window.location.href);
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // Start Camera
    const startCamera = async () => {
        try {
            setCameraError('');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            });

            streamRef.current = stream;
            setCameraActive(true);
        } catch (err) {
            console.error('Camera error:', err);
            setCameraError('Unable to access camera. Please allow camera permissions.');
        }
    };

    // Connect stream to video element when camera becomes active
    useEffect(() => {
        if (cameraActive && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play().catch(err => console.error('Video play error:', err));
        }
    }, [cameraActive]);


    // Stop Camera
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setCameraActive(false);
        setIsScanning(false);
        setScanProgress(0);
        setScanComplete(false);
    };

    // Cleanup camera on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Handle "Start Capturing Body" button click
    const handleStartCapture = () => {
        setShowTutorial(true);
    };

    // Handle ESC key to close tutorial
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && showTutorial) {
                handleTutorialComplete();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showTutorial]);


    // After tutorial, start camera and scanning
    const handleTutorialComplete = async () => {
        setShowTutorial(false);
        await startCamera();
        // Start body scanning after camera is active
        setTimeout(() => {
            setIsScanning(true);
            simulateBodyScan();
        }, 500);
    };

    // Simulate body scanning progress (temporary - will be replaced by backend)
    const simulateBodyScan = () => {
        setScanProgress(0);
        const interval = setInterval(() => {
            setScanProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsScanning(false);
                    setScanComplete(true);
                    return 100;
                }
                return prev + 2; // Increase by 2% every 100ms = 5 seconds total
            });
        }, 100);
    };


    const getProductImage = (product) => {
        if (product?.image_url) return product.image_url;
        if (!product) return '';
        const colors = ['6366F1', '14B8A6', 'F59E0B', '64748B', 'EC4899', '8B5CF6'];
        const color = colors[product.id % colors.length];
        return `https://via.placeholder.com/150/${color}/FFFFFF?text=${encodeURIComponent(product.name?.charAt(0) || '?')}`;
    };

    // Determine if product is upper or lower body
    const isUpperBody = (product) => {
        const upperTypes = ['upper', 'top', 'shirt', 'tshirt', 't-shirt'];
        const upperCategories = ['T-Shirts', 'Shirts', 'Outerwear', 'Tops', 'Jackets'];
        return upperTypes.includes(product.clothing_type?.toLowerCase()) ||
            upperCategories.some(cat => product.category?.includes(cat));
    };

    const isLowerBody = (product) => {
        const lowerTypes = ['lower', 'bottom', 'pant', 'pants'];
        const lowerCategories = ['Pants', 'Jeans', 'Shorts', 'Trousers', 'Bottoms'];
        return lowerTypes.includes(product.clothing_type?.toLowerCase()) ||
            lowerCategories.some(cat => product.category?.includes(cat));
    };

    // Handle product selection
    const handleProductSelect = (product) => {
        if (isLowerBody(product)) {
            setSelectedLower(product);
        } else {
            setSelectedUpper(product);
        }
    };

    // Filter products
    const filteredProducts = products.filter(product => {
        // Category filter
        if (activeCategory === 'upper' && !isUpperBody(product)) return false;
        if (activeCategory === 'lower' && !isLowerBody(product)) return false;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return product.name?.toLowerCase().includes(query) ||
                product.category?.toLowerCase().includes(query);
        }
        return true;
    });

    // Category counts
    const upperCount = products.filter(isUpperBody).length;
    const lowerCount = products.filter(isLowerBody).length;

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden font-sans">

            {/* ==================== TUTORIAL MODAL ==================== */}
            {showTutorial && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop with blur */}
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"></div>

                    {/* Ambient glow effects */}
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[150px]"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/15 rounded-full blur-[120px]"></div>

                    {/* Modal Content */}
                    <div className="relative z-10 w-full max-w-3xl mx-8">

                        {/* Header Section */}
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
                                <span className="material-symbols-outlined text-indigo-400 text-sm">info</span>
                                <span className="text-sm text-white/70 tracking-wide">Before you begin</span>
                            </div>
                            <h1 className="text-5xl font-light text-white tracking-tight mb-4">
                                Gesture <span className="font-semibold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Controls</span>
                            </h1>
                            <p className="text-lg text-white/50 max-w-md mx-auto leading-relaxed">
                                Navigate the virtual try-on experience using simple hand movements
                            </p>
                        </div>

                        {/* Gesture Cards Grid */}
                        <div className="grid grid-cols-3 gap-6 mb-12">

                            {/* Card 1 - Show Hands */}
                            <div className="group relative p-6 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/[0.05]">
                                <div className="absolute -top-3 -left-3 size-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center">
                                    <span className="text-sm font-semibold text-white/80">1</span>
                                </div>
                                <div className="size-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <span className="material-symbols-outlined text-emerald-400 text-3xl">front_hand</span>
                                </div>
                                <h3 className="text-center font-medium text-white mb-2">Show Hands</h3>
                                <p className="text-center text-sm text-white/40 leading-relaxed">
                                    Raise your hands in front of the camera to activate gesture detection
                                </p>
                            </div>

                            {/* Card 2 - Scroll Up */}
                            <div className="group relative p-6 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/[0.05]">
                                <div className="absolute -top-3 -left-3 size-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center">
                                    <span className="text-sm font-semibold text-white/80">2</span>
                                </div>
                                <div className="size-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <span className="material-symbols-outlined text-blue-400 text-3xl">swipe_up</span>
                                </div>
                                <h3 className="text-center font-medium text-white mb-2">Swipe Up</h3>
                                <p className="text-center text-sm text-white/40 leading-relaxed">
                                    Move your hand upward to scroll through the product collection
                                </p>
                            </div>

                            {/* Card 3 - Scroll Down */}
                            <div className="group relative p-6 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/[0.05]">
                                <div className="absolute -top-3 -left-3 size-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center">
                                    <span className="text-sm font-semibold text-white/80">3</span>
                                </div>
                                <div className="size-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <span className="material-symbols-outlined text-violet-400 text-3xl">swipe_down</span>
                                </div>
                                <h3 className="text-center font-medium text-white mb-2">Swipe Down</h3>
                                <p className="text-center text-sm text-white/40 leading-relaxed">
                                    Move your hand downward to browse in the opposite direction
                                </p>
                            </div>
                        </div>

                        {/* Coming Soon Notice */}
                        <div className="flex items-center justify-center gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 mb-10">
                            <span className="material-symbols-outlined text-amber-400">schedule</span>
                            <p className="text-sm text-amber-200/70">
                                <span className="font-medium text-amber-300">Product selection gesture</span> will be available in the next update
                            </p>
                        </div>

                        {/* Action Button */}
                        <div className="flex justify-center">
                            <button
                                onClick={handleTutorialComplete}
                                className="group flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold text-lg hover:from-indigo-600 hover:to-violet-700 transition-all duration-300 shadow-2xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105"
                            >
                                <span>Continue to Camera</span>
                                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </button>
                        </div>

                        {/* Skip option */}
                        <p className="text-center mt-6 text-sm text-white/30">
                            Press <span className="font-medium text-white/50">ESC</span> to skip this tutorial
                        </p>
                    </div>
                </div>
            )}


            {/* ==================== BODY SCANNING OVERLAY ==================== */}
            {isScanning && cameraActive && (
                <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center">
                    <div className="relative w-[400px] h-[500px]">

                        {/* Corner Markers - Top Left */}
                        <div className="absolute top-0 left-0 w-20 h-20">
                            <div className={`absolute top-0 left-0 w-full h-1 rounded-full transition-all duration-300 ${scanProgress >= 10 ? 'bg-emerald-400' : 'bg-white/30'}`}></div>
                            <div className={`absolute top-0 left-0 w-1 h-full rounded-full transition-all duration-300 ${scanProgress >= 10 ? 'bg-emerald-400' : 'bg-white/30'}`}></div>
                        </div>

                        {/* Corner Markers - Top Right */}
                        <div className="absolute top-0 right-0 w-20 h-20">
                            <div className={`absolute top-0 right-0 w-full h-1 rounded-full transition-all duration-300 ${scanProgress >= 30 ? 'bg-emerald-400' : 'bg-white/30'}`}></div>
                            <div className={`absolute top-0 right-0 w-1 h-full rounded-full transition-all duration-300 ${scanProgress >= 30 ? 'bg-emerald-400' : 'bg-white/30'}`}></div>
                        </div>

                        {/* Corner Markers - Bottom Left */}
                        <div className="absolute bottom-0 left-0 w-20 h-20">
                            <div className={`absolute bottom-0 left-0 w-full h-1 rounded-full transition-all duration-300 ${scanProgress >= 60 ? 'bg-emerald-400' : 'bg-white/30'}`}></div>
                            <div className={`absolute bottom-0 left-0 w-1 h-full rounded-full transition-all duration-300 ${scanProgress >= 60 ? 'bg-emerald-400' : 'bg-white/30'}`}></div>
                        </div>

                        {/* Corner Markers - Bottom Right */}
                        <div className="absolute bottom-0 right-0 w-20 h-20">
                            <div className={`absolute bottom-0 right-0 w-full h-1 rounded-full transition-all duration-300 ${scanProgress >= 90 ? 'bg-emerald-400' : 'bg-white/30'}`}></div>
                            <div className={`absolute bottom-0 right-0 w-1 h-full rounded-full transition-all duration-300 ${scanProgress >= 90 ? 'bg-emerald-400' : 'bg-white/30'}`}></div>
                        </div>

                        {/* Center Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="text-center">
                                <span className="material-symbols-outlined text-6xl text-emerald-400 animate-pulse">body_system</span>
                                <p className="text-xl font-medium text-white mt-4">Scanning Body...</p>
                                <p className="text-5xl font-bold text-emerald-400 mt-2">{scanProgress}%</p>
                                <p className="text-sm text-white/50 mt-3">Please stand still and face the camera</p>
                            </div>
                        </div>

                        {/* Progress Ring Around Frame */}
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 500">
                            <rect
                                x="10" y="10" width="380" height="480" rx="20"
                                fill="none"
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="2"
                            />
                            <rect
                                x="10" y="10" width="380" height="480" rx="20"
                                fill="none"
                                stroke="rgb(52, 211, 153)"
                                strokeWidth="3"
                                strokeDasharray={`${(scanProgress / 100) * 1720} 1720`}
                                className="transition-all duration-200"
                            />
                        </svg>
                    </div>
                </div>
            )}

            {/* ==================== SCAN COMPLETE MESSAGE ==================== */}
            {scanComplete && cameraActive && !isScanning && (
                <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center">
                    <div className="bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 rounded-3xl p-8 text-center animate-pulse">
                        <span className="material-symbols-outlined text-6xl text-emerald-400">check_circle</span>
                        <p className="text-xl font-bold text-white mt-4">Body Scan Complete!</p>
                        <p className="text-white/60 mt-2">Use hand gestures to browse products</p>
                    </div>
                </div>
            )}

            {/* Ambient Background */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[200px]"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/8 rounded-full blur-[180px]"></div>
            </div>


            {/* Main Layout */}
            <div className="relative z-10 h-full flex p-6 gap-6">

                {/* Left Side - Guidelines Panel */}
                <div className="w-64 flex flex-col rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 overflow-hidden">

                    {/* Header */}
                    <div className="p-6 border-b border-white/5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                                <span className="material-symbols-outlined text-white text-xl">help_outline</span>
                            </div>
                            <span className="font-semibold text-white text-lg">How It Works</span>
                        </div>
                        <p className="text-xs text-white/40 mt-2">Follow these simple steps</p>
                    </div>

                    {/* Steps */}
                    <div className="flex-1 p-5 space-y-4 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>

                        {/* Step 1 */}
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 size-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                                <span className="text-sm font-bold text-indigo-400">1</span>
                            </div>
                            <div>
                                <h4 className="font-medium text-white text-sm">Stand in Frame</h4>
                                <p className="text-xs text-white/50 mt-1 leading-relaxed">Position yourself in front of the camera so your full body is visible</p>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 size-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                                <span className="text-sm font-bold text-indigo-400">2</span>
                            </div>
                            <div>
                                <h4 className="font-medium text-white text-sm">Capture Your Body</h4>
                                <p className="text-xs text-white/50 mt-1 leading-relaxed">Click "Start Capturing Body" to scan your body measurements</p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 size-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                                <span className="text-sm font-bold text-indigo-400">3</span>
                            </div>
                            <div>
                                <h4 className="font-medium text-white text-sm">Select Clothes</h4>
                                <p className="text-xs text-white/50 mt-1 leading-relaxed">Browse shirts & pants from the right panel and tap to select</p>
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 size-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                                <span className="text-sm font-bold text-indigo-400">4</span>
                            </div>
                            <div>
                                <h4 className="font-medium text-white text-sm">Virtual Try-On</h4>
                                <p className="text-xs text-white/50 mt-1 leading-relaxed">Click "Virtual Try On" to see clothes fitted on your body</p>
                            </div>
                        </div>

                        {/* Step 5 */}
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 size-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                                <span className="material-symbols-outlined text-emerald-400 text-sm">check</span>
                            </div>
                            <div>
                                <h4 className="font-medium text-white text-sm">Done!</h4>
                                <p className="text-xs text-white/50 mt-1 leading-relaxed">See how the outfit looks on you before buying</p>
                            </div>
                        </div>
                    </div>

                    {/* Tips Footer */}
                    <div className="p-5 border-t border-white/5 bg-white/[0.02]">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-amber-400 text-lg">lightbulb</span>
                            <div>
                                <h4 className="font-medium text-white text-xs uppercase tracking-wider">Pro Tip</h4>
                                <p className="text-xs text-white/40 mt-1">Stand 2-3 meters from the camera for best results</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Camera/Preview Area */}
                <div className="flex-1 relative flex flex-col rounded-3xl overflow-hidden bg-slate-900/50 backdrop-blur-sm border border-white/5">

                    {/* Camera View / Video Feed */}
                    <div className="absolute inset-0">
                        {cameraActive ? (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover transform scale-x-[-1]"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="text-center">
                                    <span className="material-symbols-outlined text-white/10" style={{ fontSize: '180px' }}>person</span>
                                    <p className="text-xl font-extralight text-white/40 tracking-[0.2em] uppercase mt-4">Step into the frame</p>
                                    {cameraError && (
                                        <p className="text-red-400 text-sm mt-4 max-w-md mx-auto">{cameraError}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Camera Status Indicator */}
                    {cameraActive && (
                        <div className="absolute top-8 right-8 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/90 backdrop-blur-sm">
                            <span className="size-2 rounded-full bg-white animate-pulse"></span>
                            <span className="text-white text-sm font-medium">LIVE</span>
                        </div>
                    )}

                    {/* Top Bar */}
                    <header className="relative z-10 p-8 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                                <span className="material-symbols-outlined text-2xl">view_in_ar</span>
                            </div>
                            <div>
                                <span className="font-semibold text-xl tracking-tight text-white block">VirtualFit</span>
                                <span className="text-xs text-white/40 tracking-wide uppercase">Virtual Try-On</span>
                            </div>
                        </div>
                    </header>

                    {/* Main Camera Area - Spacer */}
                    <div className="flex-1 relative">
                        {/* Camera feed fills this area via absolute positioning */}
                    </div>

                    {/* Bottom Controls */}
                    <div className="relative z-10 p-8">
                        <div className="flex items-center justify-center gap-4">
                            {/* Start/Stop Capturing Body Button */}
                            <button
                                onClick={cameraActive ? stopCamera : handleStartCapture}
                                className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold hover:scale-105 transition-all shadow-lg group ${cameraActive
                                    ? 'bg-red-500/80 backdrop-blur-xl border border-red-400/30 text-white hover:bg-red-600/80'
                                    : 'bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/15'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-2xl group-hover:animate-pulse">
                                    {cameraActive ? 'stop_circle' : 'body_system'}
                                </span>
                                <span className="text-lg">{cameraActive ? 'Stop Camera' : 'Start Capturing Body'}</span>
                            </button>


                            {/* Virtual Try On Button */}
                            <button
                                className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-bold transition-all shadow-xl group ${cameraActive && (selectedUpper || selectedLower)
                                    ? 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 hover:scale-105 shadow-indigo-500/30'
                                    : 'bg-gray-600/50 cursor-not-allowed opacity-50'
                                    }`}
                                disabled={!cameraActive || (!selectedUpper && !selectedLower)}
                            >
                                <span className="material-symbols-outlined text-2xl group-hover:animate-pulse">checkroom</span>
                                <span className="text-lg">Virtual Try On</span>
                            </button>
                        </div>


                        {/* Refresh Button */}
                        <div className="flex justify-center mt-4">
                            <button
                                onClick={fetchProducts}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm hover:bg-white/10 hover:text-white/80 transition-all"
                                title="Refresh products"
                            >
                                <span className="material-symbols-outlined text-lg">refresh</span>
                                <span>Refresh</span>
                            </button>
                        </div>
                    </div>

                </div>

                {/* Right Side Panel */}
                <div className="w-64 flex flex-col gap-4">

                    {/* Selected Items Section */}
                    <div className="rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-5">
                        <h3 className="font-medium text-white/80 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-indigo-400">checkroom</span>
                            Your Selection
                        </h3>

                        <div className="space-y-3">
                            {/* Selected Shirt/Top */}
                            <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${selectedUpper ? 'bg-white/5 border border-white/10' : 'border border-dashed border-white/20'}`}>
                                {selectedUpper ? (
                                    <>
                                        <div className="size-12 rounded-lg overflow-hidden flex-shrink-0">
                                            <img src={getProductImage(selectedUpper)} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{selectedUpper.name}</p>
                                            <p className="text-xs text-indigo-400">${selectedUpper.price?.toFixed(2)}</p>
                                        </div>
                                        <button onClick={() => setSelectedUpper(null)} className="text-white/40 hover:text-white">
                                            <span className="material-symbols-outlined text-lg">close</span>
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2 text-white/30 py-1">
                                        <span className="material-symbols-outlined text-lg">checkroom</span>
                                        <span className="text-xs">No shirt selected</span>
                                    </div>
                                )}
                            </div>

                            {/* Selected Pant/Bottom */}
                            <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${selectedLower ? 'bg-white/5 border border-white/10' : 'border border-dashed border-white/20'}`}>
                                {selectedLower ? (
                                    <>
                                        <div className="size-12 rounded-lg overflow-hidden flex-shrink-0">
                                            <img src={getProductImage(selectedLower)} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{selectedLower.name}</p>
                                            <p className="text-xs text-indigo-400">${selectedLower.price?.toFixed(2)}</p>
                                        </div>
                                        <button onClick={() => setSelectedLower(null)} className="text-white/40 hover:text-white">
                                            <span className="material-symbols-outlined text-lg">close</span>
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2 text-white/30 py-1">
                                        <span className="material-symbols-outlined text-lg">checkroom</span>
                                        <span className="text-xs">No pant selected</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Products Panel */}
                    <div className="flex-1 flex flex-col rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 overflow-hidden">

                        {/* Search Box */}
                        <div className="p-4 border-b border-white/5">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-white/40 text-lg">search</span>
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                                />
                            </div>
                        </div>

                        {/* Category Tabs */}
                        <div className="px-4 py-3 border-b border-white/5">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setActiveCategory('all')}
                                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all ${activeCategory === 'all'
                                        ? 'bg-indigo-500 text-white'
                                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                                        }`}
                                >
                                    All ({products.length})
                                </button>
                                <button
                                    onClick={() => setActiveCategory('upper')}
                                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all ${activeCategory === 'upper'
                                        ? 'bg-indigo-500 text-white'
                                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                                        }`}
                                >
                                    Shirts ({upperCount})
                                </button>
                                <button
                                    onClick={() => setActiveCategory('lower')}
                                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all ${activeCategory === 'lower'
                                        ? 'bg-indigo-500 text-white'
                                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                                        }`}
                                >
                                    Pants ({lowerCount})
                                </button>
                            </div>
                        </div>

                        {/* Products List */}
                        <div
                            className="flex-1 overflow-y-auto p-4 space-y-3"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-12 text-white/50">
                                    <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
                                    <p className="text-xs mt-3">Loading...</p>
                                </div>
                            ) : filteredProducts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-white/40 text-center">
                                    <span className="material-symbols-outlined text-3xl">inventory_2</span>
                                    <p className="text-xs mt-3">No products found</p>
                                </div>
                            ) : (
                                filteredProducts.map((product) => {
                                    const isSelected = selectedUpper?.id === product.id || selectedLower?.id === product.id;
                                    return (
                                        <button
                                            key={product.id}
                                            onClick={() => handleProductSelect({
                                                id: product.id,
                                                name: product.name,
                                                image_url: product.image_url,
                                                price: product.price,
                                                clothing_type: product.clothing_type,
                                                category: product.category
                                            })}
                                            className={`w-full aspect-[4/5] rounded-2xl overflow-hidden transition-all duration-300 relative group ${isSelected
                                                ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900'
                                                : 'ring-1 ring-white/10 hover:ring-white/25'
                                                }`}
                                        >
                                            <img
                                                src={getProductImage(product)}
                                                alt={product.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                            <div className="absolute bottom-0 left-0 right-0 p-3">
                                                <p className="font-medium text-sm text-white truncate">{product.name}</p>
                                                <div className="flex items-center justify-between mt-1">
                                                    <p className="font-bold text-indigo-400 text-sm">${product.price.toFixed(2)}</p>
                                                    <span className="text-xs text-white/40 uppercase">{isUpperBody(product) ? 'Top' : 'Bottom'}</span>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 size-6 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg">
                                                    <span className="material-symbols-outlined text-white text-sm">check</span>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TryOn;
