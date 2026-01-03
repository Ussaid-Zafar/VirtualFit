import React from 'react';

const Subscription = () => {
    const billingHistory = [
        { id: 1, date: 'Jan 15, 2025', amount: '$129.00', status: 'Paid' },
        { id: 2, date: 'Dec 15, 2024', amount: '$129.00', status: 'Paid' },
        { id: 3, date: 'Nov 15, 2024', amount: '$129.00', status: 'Paid' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white uppercase tracking-tight">Subscription & Billing</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium italic">Manage your plan and billing information with precision.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Plan Card */}
                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-sm border-2 border-slate-900 dark:border-white shadow-3d">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Current Plan</h3>
                            <div className="mt-2 flex items-center gap-2">
                                <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white uppercase">Professional</h2>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase bg-green-500 text-white border border-slate-900 dark:border-white">
                                    Active
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">$129</p>
                            <p className="text-[10px] font-bold uppercase text-slate-500">per month</p>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t-2 border-slate-900 dark:border-white">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                            <span className="text-slate-500">Next Billing</span>
                            <span className="text-slate-900 dark:text-white">Feb 15, 2025</span>
                        </div>
                    </div>

                    <button className="mt-6 w-full py-3 px-4 bg-primary text-white border-2 border-slate-900 dark:border-white rounded-sm font-bold uppercase text-xs hover:translate-y-1 shadow-3d hover:shadow-3d-hover transition-all">
                        Change Plan
                    </button>
                </div>

                {/* Payment Method Card */}
                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-sm border-2 border-slate-900 dark:border-white shadow-3d">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Payment Method</h3>

                    <div className="flex items-center gap-4 p-4 rounded-sm bg-slate-50 dark:bg-slate-800 border-2 border-slate-900 dark:border-white mb-6">
                        <div className="size-10 bg-white rounded-sm border-2 border-slate-900 flex items-center justify-center p-1">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="w-full h-auto" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white uppercase">Visa ending in 4242</p>
                            <p className="text-[10px] font-medium text-slate-500 italic">Expires 12/26</p>
                        </div>
                    </div>

                    <button className="w-full py-3 px-4 bg-white dark:bg-slate-800 border-2 border-slate-900 dark:border-white text-slate-900 dark:text-white rounded-sm font-bold uppercase text-xs hover:translate-y-1 shadow-3d hover:shadow-3d-hover transition-all">
                        Update Payment
                    </button>
                </div>
            </div>

            {/* Billing History */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-sm border-2 border-slate-900 dark:border-white shadow-3d overflow-hidden">
                <div className="p-6 border-b-2 border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800">
                    <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg uppercase tracking-tight">Billing History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-page text-xs font-semibold text-body uppercase tracking-wider">
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Amount</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Invoice</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-gray">
                            {billingHistory.map((row) => (
                                <tr key={row.id} className="text-sm hover:bg-page/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-heading">{row.date}</td>
                                    <td className="px-6 py-4 text-body">{row.amount}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-primary hover:text-primary-hover font-medium flex items-center gap-1 ml-auto">
                                            <span className="material-symbols-outlined text-[18px]">download</span>
                                            Download
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Subscription;
