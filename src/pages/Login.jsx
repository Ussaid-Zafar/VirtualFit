import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authAPI.login(email, password);
            if (response.success) {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background text-body min-h-screen flex flex-col antialiased font-sans">
            <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6 sm:p-12">
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-100/80 via-background to-background pointer-events-none"></div>
                <div className="absolute inset-0 z-0 opacity-60 pointer-events-none bg-[radial-gradient(#E2E8F0_1px,transparent_1px)] [background-size:24px_24px]"></div>
                <div className="relative z-10 w-full max-w-[480px] rounded-2xl bg-surface p-8 shadow-xl ring-1 ring-border sm:p-10">
                    <div className="mb-8 flex flex-col items-center justify-center">
                        <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                            <span className="material-symbols-outlined text-[32px]">view_in_ar</span>
                        </div>
                        <div className="text-center">
                            <h2 className="text-2xl font-bold tracking-tight text-heading">Welcome Back</h2>
                            <p className="mt-2 text-sm text-body">Login to your outlet dashboard</p>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-heading" htmlFor="email">
                                Email Address
                            </label>
                            <div className="relative">
                                <input
                                    className="flex h-12 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-heading placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                                    id="email"
                                    placeholder="name@outlet.com"
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <div className="absolute right-3 top-3 text-gray-400 pointer-events-none">
                                    <span className="material-symbols-outlined text-[20px]">mail</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium leading-none text-heading" htmlFor="password">
                                    Password
                                </label>
                            </div>
                            <div className="relative">
                                <input
                                    className="flex h-12 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-heading placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                                    id="password"
                                    placeholder="Enter your password"
                                    required
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <input className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" id="remember" type="checkbox" />
                                <label className="text-sm font-medium leading-none text-body" htmlFor="remember">
                                    Remember me
                                </label>
                            </div>
                            <a className="text-sm font-semibold text-primary hover:text-primary-hover hover:underline" href="#">
                                Forgot password?
                            </a>
                        </div>
                        <button
                            className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-gradient-to-r from-primary to-blue-600 px-8 py-2 text-sm font-bold text-white shadow-md hover:shadow-lg hover:to-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin mr-2 text-[20px]">progress_activity</span>
                                    Logging in...
                                </>
                            ) : (
                                'Log In'
                            )}
                        </button>
                    </form>

                    {/* Demo credentials hint */}
                    <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs">
                        <strong>Demo:</strong> test@store.com / password123
                    </div>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border"></span>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-surface px-2 text-body">Or continue with</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-body hover:bg-gray-50 hover:text-heading focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 transition-all">
                            <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"></path>
                            </svg>
                            Google
                        </button>
                        <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-body hover:bg-gray-50 hover:text-heading focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 transition-all">
                            <span className="material-symbols-outlined text-[18px]">key</span>
                            SSO
                        </button>
                    </div>
                    <div className="mt-8 text-center text-sm text-body">
                        Don't have an account?
                        <Link className="font-bold text-primary hover:text-primary-hover hover:underline transition-colors" to="/register">
                            Register here
                        </Link>
                    </div>
                </div>
                <div className="mt-8 flex gap-6 text-sm text-body">
                    <a className="hover:text-heading transition-colors" href="#">Privacy Policy</a>
                    <a className="hover:text-heading transition-colors" href="#">Terms of Service</a>
                    <a className="hover:text-heading transition-colors" href="#">Help Center</a>
                </div>
            </div>
        </div>
    );
};

export default Login;
