import React, { useState, useEffect, useRef } from 'react';
import { productsAPI, gesturesAPI } from '../services/api';

const TryOn = () => {
    const [selectedUpper, setSelectedUpper] = useState(null); // Shirt/Top
    const [selectedLower, setSelectedLower] = useState(null); // Pant/Bottom
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');
    const [currentProductIndex, setCurrentProductIndex] = useState(0);

    // Reset index when category changes
    useEffect(() => {
        setCurrentProductIndex(0);
    }, [activeCategory]);

    // Camera state - Default to true for Backend Stream
    const [cameraActive, setCameraActive] = useState(true);
    const [cameraError, setCameraError] = useState('');
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    // Tutorial and Scanning states
    const [showTutorial, setShowTutorial] = useState(true); // Always show on mount/refresh
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0); // 0-100%
    const [scanComplete, setScanComplete] = useState(false);

    // Gesture Control State - Default to true
    const [gestureMode, setGestureMode] = useState(true);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isClicked, setIsClicked] = useState(false);



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
            } else if (event.data.type === 'CLOSE_SCREEN') {
                window.close();
            }
        };

        const handleUnload = () => {
            // Send multiple messages to ensure the Dashboard catches it
            channel.postMessage({ type: 'SCREEN_CLOSED' });
            channel.postMessage({ type: 'SCREEN_CLOSED' });
        };
        window.addEventListener('unload', handleUnload);

        return () => {
            handleUnload();
            channel.close();
            window.removeEventListener('unload', handleUnload);
        };
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

    // Simplified Camera Management - Handled by Backend
    useEffect(() => {
        // If the view mounts, we assume the backend is already started by the Dashboard
        setCameraActive(true);
        setGestureMode(true);
    }, []);

    // Cleanup camera and gestures on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            // Ensure gestures are stopped when leaving page
            gesturesAPI.stop().catch(console.error);
        };
    }, []);

    // Track mouse position for Virtual Cursor
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (gestureMode) {
                setMousePos({ x: e.clientX, y: e.clientY });
            }
        };

        const handleMouseDown = () => {
            if (gestureMode) setIsClicked(true);
        };

        const handleMouseUp = () => {
            if (gestureMode) setIsClicked(false);
        };

        if (gestureMode) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mousedown', handleMouseDown);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'none';
        } else {
            document.body.style.cursor = 'default';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
        };
    }, [gestureMode]);

    // Handle "Start Capturing Body" button click - NO MORE CAMERA LOGIC, JUST ANIMATION
    const handleStartCapture = () => {
        setIsScanning(true);
        simulateBodyScan();
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


    // Integrated scan completion handler
    const handleTutorialComplete = async () => {
        setShowTutorial(false);
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
        return true;
    });

    const currentProduct = filteredProducts[currentProductIndex];

    const nextProduct = () => {
        setCurrentProductIndex(prev =>
            prev < filteredProducts.length - 1 ? prev + 1 : 0
        );
    };

    const prevProduct = () => {
        setCurrentProductIndex(prev =>
            prev > 0 ? prev - 1 : filteredProducts.length - 1
        );
    };

    // Category counts
    const upperCount = products.filter(isUpperBody).length;
    const lowerCount = products.filter(isLowerBody).length;

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden font-sans">

            {/* ==================== TUTORIAL MODAL ==================== */}
            {showTutorial && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop with blur - Made transparent for gesture visibility */}
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"></div>

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

                            {/* Card 1 - Movement */}
                            <div className="group relative p-6 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/[0.05]">
                                <div className="absolute -top-3 -left-3 size-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center">
                                    <span className="text-sm font-semibold text-white/80">1</span>
                                </div>
                                <div className="size-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <span className="material-symbols-outlined text-emerald-400 text-3xl">pan_tool_alt</span>
                                </div>
                                <h3 className="text-center font-medium text-white mb-2">Move Pointer</h3>
                                <p className="text-center text-sm text-white/40 leading-relaxed">
                                    Raise your <span className="text-emerald-400">Index Finger</span> to move the cursor
                                </p>
                            </div>

                            {/* Card 2 - Stop/Pause */}
                            <div className="group relative p-6 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/[0.05]">
                                <div className="absolute -top-3 -left-3 size-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center">
                                    <span className="text-sm font-semibold text-white/80">2</span>
                                </div>
                                <div className="size-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <span className="material-symbols-outlined text-amber-400 text-3xl">pan_tool</span>
                                </div>
                                <h3 className="text-center font-medium text-white mb-2">Stop Cursor</h3>
                                <p className="text-center text-sm text-white/40 leading-relaxed">
                                    Show <span className="text-amber-400">Two Fingers</span> (Index + Middle) to stop movement
                                </p>
                            </div>

                            {/* Card 3 - Click/Select */}
                            <div className="group relative p-6 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/[0.05]">
                                <div className="absolute -top-3 -left-3 size-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center">
                                    <span className="text-sm font-semibold text-white/80">3</span>
                                </div>
                                <div className="size-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <span className="material-symbols-outlined text-blue-400 text-3xl">ads_click</span>
                                </div>
                                <h3 className="text-center font-medium text-white mb-2">Select Item</h3>
                                <p className="text-center text-sm text-white/40 leading-relaxed">
                                    <span className="text-blue-400">Pinch</span> fingers together to click
                                </p>
                            </div>                        </div>

                        {/* Gesture Hint */}
                        <div className="flex items-center justify-center gap-4 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 mb-10">
                            <span className="material-symbols-outlined text-indigo-400">back_hand</span>
                            <p className="text-sm text-indigo-200/70">
                                <span className="font-medium text-indigo-300">Gesture Control</span> will start automatically when you continue
                            </p>
                        </div>
                        {/* Action Button */}
                        <div className="flex justify-center">
                            <button
                                onClick={handleTutorialComplete}
                                className="group flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold text-lg hover:from-indigo-600 hover:to-violet-700 transition-all duration-300 shadow-2xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105"
                            >
                                <span>OK</span>
                                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">check</span>
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

                    {/* Camera View / Video Feed / Backend Stream */}
                    <div className="absolute inset-0 bg-slate-950">
                        {cameraActive ? (
                            <img
                                src="http://localhost:5000/api/gestures/video_feed"
                                alt="Gesture Feed"
                                className="w-full h-full object-cover"
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

                    {/* Redundant LIVE indicator removed */}

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

                        {/* Gesture Status Indicator */}
                        <div className="flex items-center gap-4">
                            {gestureMode && (
                                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    AI Tracking Active
                                </div>
                            )}
                            <button
                                onClick={async () => {
                                    try {
                                        await gesturesAPI.stop();
                                        window.close();
                                    } catch (err) {
                                        window.close();
                                    }
                                }}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-lg"
                            >
                                <span className="material-symbols-outlined text-lg">cancel</span>
                                Stop & Close
                            </button>
                        </div>
                    </header>
                    {/* Main Camera Area - Spacer */}
                    <div className="flex-1 relative">
                        {/* Camera feed fills this area via absolute positioning */}
                    </div>

                    {/* Bottom Controls */}
                    <div className="relative z-10 p-8">
                        <div className="flex items-center justify-center gap-4">
                            {/* Start Capturing Body Button - STATIC STYLE */}
                            <button
                                onClick={handleStartCapture}
                                disabled={isScanning || scanComplete}
                                className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold transition-all shadow-xl group ${isScanning || scanComplete
                                    ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 cursor-not-allowed'
                                    : 'bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/15 hover:scale-105'
                                    }`}
                            >
                                <span className={`material-symbols-outlined text-2xl ${isScanning ? 'animate-spin' : 'group-hover:animate-pulse'}`}>
                                    {isScanning ? 'progress_activity' : scanComplete ? 'check_circle' : 'body_system'}
                                </span>
                                <span className="text-lg">
                                    {isScanning ? 'Scanning Body...' : scanComplete ? 'Body Scanned' : 'Start Capturing Body'}
                                </span>
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


                        <div className="flex justify-center mt-4">
                            <button
                                onClick={() => {
                                    fetchProducts();
                                    setShowTutorial(true);
                                }}
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

                        {/* Category Dropdown Header */}
                        <div className="p-5 border-b border-white/5">
                            <div className="relative">
                                <select
                                    value={activeCategory}
                                    onChange={(e) => setActiveCategory(e.target.value)}
                                    className="w-full appearance-none bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer text-sm font-medium"
                                >
                                    <option value="all" className="bg-slate-900 text-white">All Categories</option>
                                    <option value="upper" className="bg-slate-900 text-white">Shirts & Tops</option>
                                    <option value="lower" className="bg-slate-900 text-white">Pants & Bottoms</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                                    <span className="material-symbols-outlined">expand_more</span>
                                </div>
                            </div>
                        </div>

                        {/* Carousel Content */}
                        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center text-white/50">
                                    <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
                                    <p className="text-xs mt-3">Loading...</p>
                                </div>
                            ) : filteredProducts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center text-white/40 text-center">
                                    <span className="material-symbols-outlined text-3xl">inventory_2</span>
                                    <p className="text-xs mt-3">No products found</p>
                                </div>
                            ) : currentProduct && (
                                <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-300">

                                    {/* Product Card */}
                                    <button
                                        onClick={() => handleProductSelect(currentProduct)}
                                        className={`w-full aspect-[3/4] max-w-[200px] rounded-2xl overflow-hidden relative group transition-all duration-300 shadow-2xl ${(selectedUpper?.id === currentProduct.id || selectedLower?.id === currentProduct.id)
                                            ? 'ring-2 ring-indigo-500 ring-offset-4 ring-offset-gray-900 grayscale-0'
                                            : 'ring-1 ring-white/10 hover:ring-white/30'
                                            }`}
                                    >
                                        <img
                                            src={getProductImage(currentProduct)}
                                            alt={currentProduct.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>

                                        <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                                            <p className="font-semibold text-white truncate text-lg shadow-black drop-shadow-md">{currentProduct.name}</p>
                                            <p className="text-indigo-400 font-bold mt-1">${currentProduct.price?.toFixed(2)}</p>
                                        </div>

                                        {(selectedUpper?.id === currentProduct.id || selectedLower?.id === currentProduct.id) && (
                                            <div className="absolute top-3 right-3 size-8 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg">
                                                <span className="material-symbols-outlined text-white text-sm">check</span>
                                            </div>
                                        )}
                                    </button>

                                    {/* Navigation Controls */}
                                    <div className="flex items-center gap-6 mt-8">
                                        <button
                                            onClick={prevProduct}
                                            className="size-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-indigo-500 hover:border-indigo-500 transition-all hover:scale-110 active:scale-95 group"
                                        >
                                            <span className="material-symbols-outlined group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
                                        </button>

                                        <div className="text-xs font-medium text-white/30 tracking-widest">
                                            {currentProductIndex + 1} / {filteredProducts.length}
                                        </div>

                                        <button
                                            onClick={nextProduct}
                                            className="size-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-indigo-500 hover:border-indigo-500 transition-all hover:scale-110 active:scale-95 group"
                                        >
                                            <span className="material-symbols-outlined group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                                        </button>
                                    </div>

                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* ==================== VIRTUAL CURSOR ==================== */}
            {gestureMode && (
                <div
                    className="fixed z-[9999] pointer-events-none transition-transform duration-75 ease-out"
                    style={{
                        left: mousePos.x,
                        top: mousePos.y,
                        transform: `translate(-50%, -50%) scale(${isClicked ? 0.8 : 1})`,
                    }}
                >
                    {/* Main glowing dot */}
                    <div className={`relative size-8 rounded-full border-2 border-white flex items-center justify-center transition-all duration-150 ${isClicked ? 'bg-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.8)]' : 'bg-white/20 backdrop-blur-sm shadow-[0_0_15px_rgba(255,255,255,0.5)]'}`}>
                        {/* Target icon */}
                        <div className={`size-1 rounded-full bg-white ${isClicked ? 'scale-0' : 'scale-100'}`}></div>

                        {/* Outer rings */}
                        <div className="absolute inset-[-4px] rounded-full border border-white/20 animate-spin-slow"></div>
                        <div className="absolute inset-[-8px] rounded-full border border-white/10 animate-pulse"></div>
                    </div>

                    {/* Visual label */}
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded bg-black/80 text-[8px] font-bold text-white uppercase tracking-tighter border border-white/10 backdrop-blur-sm">
                        Virtual Pointer
                    </div>
                </div>
            )}
        </div>
    );
};

export default TryOn;
