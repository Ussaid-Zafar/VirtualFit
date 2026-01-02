import React, { useState, useEffect } from 'react';
import { productsAPI } from '../services/api';

const TryOn = () => {
    const [selectedItem, setSelectedItem] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

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
            console.log('Received message:', event.data);
            if (event.data.type === 'SELECT_ITEM') {
                setSelectedItem(event.data.payload);
            }
        };

        return () => {
            channel.close();
        };
    }, []);

    // Prevent Back Navigation
    useEffect(() => {
        // Push current state to history stack
        window.history.pushState(null, null, window.location.href);

        // Trap back button
        const handlePopState = () => {
            window.history.pushState(null, null, window.location.href);
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // Generate placeholder image for products without images
    const getProductImage = (product) => {
        if (product.image_url) return product.image_url;
        const colors = ['2D3FE7', '14B8A6', 'F59E0B', '64748B', 'EC4899', '8B5CF6'];
        const color = colors[product.id % colors.length];
        return `https://via.placeholder.com/150/${color}/FFFFFF?text=${encodeURIComponent(product.name.charAt(0))}`;
    };

    return (
        <div className="fixed inset-0 bg-black text-white overflow-hidden flex flex-col">
            {/* Camera View (Mockup) */}
            <div className="absolute inset-0 bg-gray-900 z-0">
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                    <span className="material-symbols-outlined text-9xl">person</span>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <p className="text-xl font-medium text-white/80">Step into the frame</p>
                </div>
            </div>

            {/* Top Bar */}
            <header className="relative z-10 p-6 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                        <span className="material-symbols-outlined">view_in_ar</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight">VirtualFit</span>
                </div>
                <div className="text-sm text-white/60">
                    {products.length} items available
                </div>
            </header>

            {/* Main Content Area (Empty for camera view) */}
            <div className="flex-1 relative z-10 pointer-events-none">
                {/* AR Overlay Mockup */}
                {selectedItem && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-96 border-2 border-primary rounded-xl flex flex-col items-center justify-center bg-primary/20 backdrop-blur-sm">
                        <div className="w-32 h-32 rounded-lg overflow-hidden mb-4">
                            <img
                                src={selectedItem.image || getProductImage(selectedItem)}
                                alt={selectedItem.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <span className="font-bold text-white drop-shadow-md text-center px-4">{selectedItem.name}</span>
                        <span className="text-sm text-white/80 mt-1">Try-on preview</span>
                    </div>
                )}
            </div>

            {/* Bottom Controls */}
            <div className="relative z-10 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-12 pb-8 px-6">
                <div className="max-w-4xl mx-auto">
                    <p className="text-center text-white/80 text-sm mb-4">
                        {loading ? 'Loading products...' : `Select an item to try on (${products.length} available)`}
                    </p>

                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar justify-center">
                        {loading ? (
                            <div className="flex items-center gap-2 text-white/60">
                                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                Loading...
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center text-white/60 py-4">
                                <span className="material-symbols-outlined text-4xl mb-2">inventory_2</span>
                                <p>No products available</p>
                                <p className="text-sm">Add products from the dashboard</p>
                            </div>
                        ) : (
                            products.map((product) => (
                                <button
                                    key={product.id}
                                    onClick={() => setSelectedItem({
                                        id: product.id,
                                        name: product.name,
                                        image: getProductImage(product),
                                        price: product.price
                                    })}
                                    className={`snap-center flex-shrink-0 w-24 h-32 rounded-xl overflow-hidden border-2 transition-all duration-200 relative group ${selectedItem?.id === product.id
                                            ? 'border-primary ring-4 ring-primary/30 scale-105'
                                            : 'border-white/30 hover:border-white/60'
                                        }`}
                                >
                                    <img
                                        src={getProductImage(product)}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center justify-end p-2">
                                        <span className="text-xs font-medium truncate w-full text-center">{product.name}</span>
                                        <span className="text-xs text-white/60">${product.price.toFixed(2)}</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    <div className="flex items-center justify-center gap-6 mt-6">
                        <button className="size-14 rounded-full bg-white text-gray-900 flex items-center justify-center shadow-lg hover:scale-105 transition-transform active:scale-95">
                            <span className="material-symbols-outlined text-3xl">camera</span>
                        </button>
                        <button
                            onClick={fetchProducts}
                            className="size-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                            title="Refresh products"
                        >
                            <span className="material-symbols-outlined text-2xl">refresh</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TryOn;
