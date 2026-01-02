import React, { useState, useEffect } from 'react';
import { productsAPI, authAPI } from '../../services/api';

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [saving, setSaving] = useState(false);

    const outlet = authAPI.getOutlet();

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        category: 'T-Shirts',
        price: '',
        stock_status: 'in_stock',
        clothing_type: 'upper',
        image_url: ''
    });

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
            setError('Failed to load products');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const openAddModal = () => {
        setEditingProduct(null);
        setFormData({
            name: '',
            category: 'T-Shirts',
            price: '',
            stock_status: 'in_stock',
            clothing_type: 'upper',
            image_url: ''
        });
        setShowModal(true);
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            category: product.category,
            price: product.price.toString(),
            stock_status: product.stock_status,
            clothing_type: product.clothing_type || 'upper',
            image_url: product.image_url || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const productData = {
                ...formData,
                price: parseFloat(formData.price),
                outlet_id: outlet?.id || 1
            };

            if (editingProduct) {
                // Update existing product
                const response = await productsAPI.update(editingProduct.id, productData);
                if (response.success) {
                    setProducts(prev => prev.map(p =>
                        p.id === editingProduct.id ? response.data : p
                    ));
                }
            } else {
                // Create new product
                const response = await productsAPI.create(productData);
                if (response.success) {
                    setProducts(prev => [response.data, ...prev]);
                }
            }
            setShowModal(false);
        } catch (err) {
            setError(err.message || 'Failed to save product');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (productId) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        try {
            const response = await productsAPI.delete(productId);
            if (response.success) {
                setProducts(prev => prev.filter(p => p.id !== productId));
            }
        } catch (err) {
            setError('Failed to delete product');
        }
    };

    const getStockColor = (status) => {
        switch (status) {
            case 'in_stock': return 'text-green-600 bg-green-50';
            case 'low_stock': return 'text-orange-600 bg-orange-50';
            case 'out_of_stock': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getStockLabel = (status) => {
        switch (status) {
            case 'in_stock': return 'In Stock';
            case 'low_stock': return 'Low Stock';
            case 'out_of_stock': return 'Out of Stock';
            default: return status;
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-heading">Inventory</h1>
                    <p className="text-body mt-1">Manage your outlet's clothing catalog.</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors shadow-sm"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    Add New Item
                </button>
            </div>

            {error && (
                <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                    {error}
                    <button onClick={() => setError('')} className="float-right font-bold">×</button>
                </div>
            )}

            {/* Inventory Table */}
            <div className="bg-white rounded-xl border border-border-gray shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-page border-b border-border-gray text-xs uppercase tracking-wider text-body font-semibold">
                                <th className="px-6 py-4">Item Name</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Price</th>
                                <th className="px-6 py-4">Stock Status</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-gray">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-body">
                                        <span className="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
                                        <p className="mt-2">Loading products...</p>
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-body">
                                        <span className="material-symbols-outlined text-4xl text-gray-300">inventory_2</span>
                                        <p className="mt-2">No products yet. Add your first item!</p>
                                    </td>
                                </tr>
                            ) : (
                                products.map(product => (
                                    <tr key={product.id} className="hover:bg-page/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 overflow-hidden">
                                                    {product.image_url ? (
                                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="material-symbols-outlined text-[20px]">checkroom</span>
                                                    )}
                                                </div>
                                                <span className="font-medium text-heading">{product.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-body">{product.category}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-heading">${product.price.toFixed(2)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockColor(product.stock_status)}`}>
                                                {getStockLabel(product.stock_status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-body capitalize">{product.clothing_type}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(product)}
                                                    className="text-body hover:text-primary transition-colors p-1"
                                                    title="Edit"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="text-body hover:text-red-500 transition-colors p-1"
                                                    title="Delete"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Footer */}
                <div className="bg-white px-6 py-4 border-t border-border-gray flex items-center justify-between">
                    <span className="text-sm text-body">
                        {products.length} {products.length === 1 ? 'item' : 'items'} total
                    </span>
                    <button
                        onClick={fetchProducts}
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-[16px]">refresh</span>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-border-gray flex items-center justify-between">
                            <h2 className="text-xl font-bold text-heading">
                                {editingProduct ? 'Edit Product' : 'Add New Product'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-body hover:text-heading">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-heading mb-1">Product Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-border-gray rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="e.g. Blue Denim Jacket"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-heading mb-1">Category</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-border-gray rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    >
                                        <option value="T-Shirts">T-Shirts</option>
                                        <option value="Shirts">Shirts</option>
                                        <option value="Pants">Pants</option>
                                        <option value="Jeans">Jeans</option>
                                        <option value="Dresses">Dresses</option>
                                        <option value="Outerwear">Outerwear</option>
                                        <option value="Accessories">Accessories</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-heading mb-1">Price ($)</label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleChange}
                                        required
                                        min="0"
                                        step="0.01"
                                        className="w-full px-3 py-2 border border-border-gray rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="29.99"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-heading mb-1">Stock Status</label>
                                    <select
                                        name="stock_status"
                                        value={formData.stock_status}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-border-gray rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    >
                                        <option value="in_stock">In Stock</option>
                                        <option value="low_stock">Low Stock</option>
                                        <option value="out_of_stock">Out of Stock</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-heading mb-1">Clothing Type</label>
                                    <select
                                        name="clothing_type"
                                        value={formData.clothing_type}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-border-gray rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    >
                                        <option value="upper">Upper Body</option>
                                        <option value="lower">Lower Body</option>
                                        <option value="full">Full Body</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-heading mb-1">Image URL (optional)</label>
                                <input
                                    type="url"
                                    name="image_url"
                                    value={formData.image_url}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-border-gray rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-border-gray rounded-lg text-body hover:bg-page transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : (editingProduct ? 'Update' : 'Add Product')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
