import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI, authAPI } from '../../services/api';

const DashboardHome = () => {
    const [channel, setChannel] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const outlet = authAPI.getOutlet();

    useEffect(() => {
        const newChannel = new BroadcastChannel('virtual-fit-app');
        setChannel(newChannel);
        return () => newChannel.close();
    }, []);

    // Fetch products on mount
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await productsAPI.getAll(outlet?.id);
            if (response.success) {
                setProducts(response.data);
            }
        } catch (err) {
            console.error('Failed to load products:', err);
        } finally {
            setLoading(false);
        }
    };

    const openCustomerScreen = () => {
        // Open the Try-On URL in a new popup window
        window.open('/try-on', 'CustomerScreen', 'width=1280,height=720,menubar=no,toolbar=no,location=no');
    };

    const sendToCustomerScreen = (item) => {
        if (channel) {
            channel.postMessage({ type: 'SELECT_ITEM', payload: item });
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-heading">Overview</h1>
                    <p className="text-body mt-1">Welcome back{outlet?.name ? `, ${outlet.name}` : ''}! Here's what's happening at your outlet today.</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        to="/dashboard/inventory"
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-border-gray rounded-lg text-heading font-medium hover:bg-page transition-colors shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        Add Item
                    </Link>
                    <button
                        onClick={openCustomerScreen}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20"
                    >
                        <span className="material-symbols-outlined text-[20px]">smart_display</span>
                        Launch Customer Screen
                    </button>
                </div>
            </div>

            {/* Remote Control Section with REAL Products */}
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl">
                <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined">cast</span>
                    Remote Control - Your Products
                </h3>
                <p className="text-sm text-blue-800 mb-4">
                    Click "Launch Customer Screen" above, drag the new window to your second monitor, then click products below to display on the customer screen.
                </p>

                {loading ? (
                    <div className="flex items-center gap-2 text-blue-600">
                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        Loading products...
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-blue-700">
                        <p className="mb-2">No products registered yet.</p>
                        <Link to="/dashboard/inventory" className="inline-flex items-center gap-1 text-primary font-medium hover:underline">
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            Add your first product
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {products.slice(0, 12).map(product => (
                            <button
                                key={product.id}
                                onClick={() => sendToCustomerScreen({
                                    id: product.id,
                                    name: product.name,
                                    image: product.image_url || `https://via.placeholder.com/150/2D3FE7/FFFFFF?text=${encodeURIComponent(product.name.charAt(0))}`
                                })}
                                className="flex flex-col items-center p-3 bg-white rounded-lg border border-blue-200 hover:border-primary hover:shadow-md transition-all group"
                            >
                                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mb-2 overflow-hidden">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="material-symbols-outlined text-gray-400">checkroom</span>
                                    )}
                                </div>
                                <span className="text-xs font-medium text-heading text-center line-clamp-2 group-hover:text-primary">
                                    {product.name}
                                </span>
                                <span className="text-xs text-body">${product.price.toFixed(2)}</span>
                            </button>
                        ))}
                    </div>
                )}

                {products.length > 12 && (
                    <p className="text-xs text-blue-600 mt-3">
                        Showing 12 of {products.length} products. <Link to="/dashboard/inventory" className="underline">View all in Inventory</Link>
                    </p>
                )}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                <MetricCard
                    title="Total Products"
                    value={products.length.toString()}
                    trend="In inventory"
                    trendUp={true}
                    icon="checkroom"
                    color="text-blue-600"
                    bg="bg-blue-50"
                />
                <MetricCard
                    title="Active Sessions"
                    value="0"
                    trend="Live now"
                    trendUp={true}
                    icon="devices"
                    color="text-teal-600"
                    bg="bg-teal-50"
                />
                <MetricCard
                    title="Items Tried On"
                    value="0"
                    trend="Today"
                    trendUp={true}
                    icon="accessibility_new"
                    color="text-purple-600"
                    bg="bg-purple-50"
                />
                <MetricCard
                    title="Categories"
                    value={[...new Set(products.map(p => p.category))].length.toString()}
                    trend="Product types"
                    trendUp={true}
                    icon="category"
                    color="text-indigo-600"
                    bg="bg-indigo-50"
                />
            </div>

            {/* Recent Activity / Inventory Snapshot */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-xl border border-border-gray shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-bold text-lg text-heading">Quick Actions</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Link
                            to="/dashboard/inventory"
                            className="flex items-center gap-3 p-4 rounded-lg border border-border-gray hover:border-primary hover:bg-blue-50 transition-all"
                        >
                            <span className="material-symbols-outlined text-primary">inventory_2</span>
                            <div>
                                <p className="font-medium text-heading">Manage Inventory</p>
                                <p className="text-xs text-body">{products.length} items</p>
                            </div>
                        </Link>
                        <button
                            onClick={openCustomerScreen}
                            className="flex items-center gap-3 p-4 rounded-lg border border-border-gray hover:border-primary hover:bg-blue-50 transition-all text-left"
                        >
                            <span className="material-symbols-outlined text-primary">cast</span>
                            <div>
                                <p className="font-medium text-heading">Open Try-On</p>
                                <p className="text-xs text-body">Customer screen</p>
                            </div>
                        </button>
                        <Link
                            to="/dashboard/analytics"
                            className="flex items-center gap-3 p-4 rounded-lg border border-border-gray hover:border-primary hover:bg-blue-50 transition-all"
                        >
                            <span className="material-symbols-outlined text-primary">analytics</span>
                            <div>
                                <p className="font-medium text-heading">View Analytics</p>
                                <p className="text-xs text-body">Performance data</p>
                            </div>
                        </Link>
                        <Link
                            to="/dashboard/settings"
                            className="flex items-center gap-3 p-4 rounded-lg border border-border-gray hover:border-primary hover:bg-blue-50 transition-all"
                        >
                            <span className="material-symbols-outlined text-primary">settings</span>
                            <div>
                                <p className="font-medium text-heading">Settings</p>
                                <p className="text-xs text-body">Configure outlet</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Recent Products */}
                <div className="bg-white rounded-xl border border-border-gray shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-bold text-lg text-heading">Recent Products</h2>
                        <Link to="/dashboard/inventory" className="text-sm text-primary font-medium hover:underline">View All</Link>
                    </div>
                    {products.length === 0 ? (
                        <div className="text-center py-8 text-body">
                            <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">inventory_2</span>
                            <p>No products yet</p>
                            <Link to="/dashboard/inventory" className="text-primary hover:underline text-sm">Add products</Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {products.slice(0, 5).map((product, index) => (
                                <div key={product.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-page transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-body w-4">{index + 1}</span>
                                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                                            {product.image_url ? (
                                                <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="material-symbols-outlined text-[16px] text-gray-400">checkroom</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-heading">{product.name}</p>
                                            <p className="text-xs text-body">{product.category}</p>
                                        </div>
                                    </div>
                                    <div className="text-sm text-heading font-semibold">
                                        ${product.price.toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


const MetricCard = ({ title, value, trend, trendUp, icon, color, bg }) => (
    <div className="bg-white p-6 rounded-xl border border-border-gray shadow-sm flex items-start justify-between">
        <div>
            <p className="text-sm font-medium text-body mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-heading mb-1">{value}</h3>
            <span className="text-xs font-medium text-body">
                {trend}
            </span>
        </div>
        <div className={`size-10 rounded-lg flex items-center justify-center ${bg} ${color}`}>
            <span className="material-symbols-outlined">{icon}</span>
        </div>
    </div>
);

export default DashboardHome;
