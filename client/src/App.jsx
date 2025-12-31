import React, { useEffect } from 'react';
import { RefreshCcw } from 'lucide-react';
import useStore from './store';
import Table from './components/Table';
import Filters from './components/Filters';
import Chart from './components/Chart';

const App = () => {
    const { loading, fetchData, fetchFilterOptions } = useStore();

    useEffect(() => {
        fetchFilterOptions();
        fetchData();
    }, []); // Only fetch on mount, components will trigger refresh on change

    return (
        <div className="dashboard-container">
            <header className="header">
                <h1 className="logo">Report<span>Dash</span></h1>
                <div className="header-actions">
                    <button className="btn-primary" onClick={fetchData} disabled={loading}>
                        <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>
            </header>
            <aside className="sidebar">
                <Filters />
            </aside>
            <main className="main-content">
                {loading && (
                    <div className="loading-spinner-overlay">
                        <div className="spinner"></div>
                        <p>Updating Data...</p>
                    </div>
                )}
                <div className="glass-card chart-section">
                    <Chart />
                </div>
                <div className="glass-card table-section">
                    <Table />
                </div>
            </main>
        </div>
    );
};
export default App;
