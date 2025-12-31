import React from 'react';
import { Clock } from 'lucide-react';
import useStore from '../store';

const Filters = () => {
    const { filters, setFilters, fetchData } = useStore();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters({ [name]: value });
        fetchData();
    };

    return (
        <div className="filters-container">
            <h3 className="sidebar-title">Filters</h3>
            <div className="filter-group">
                <label className="filter-label"><Clock size={16} /> Time Range</label>
                <select name="timeRange" value={filters.timeRange} onChange={handleChange} className="filter-select">
                    <option value="12h">Last 12 Hours</option>
                    <option value="24h">Last 24 Hours</option>
                    <option value="custom">Custom Range</option>
                </select>
            </div>
            {filters.timeRange === 'custom' && (
                <div className="custom-date-range">
                    <label className="filter-label">Start Date</label>
                    <input type="date" name="startDate" value={filters.startDate} onChange={handleChange} className="filter-input" />
                    <label className="filter-label">End Date</label>
                    <input type="date" name="endDate" value={filters.endDate} onChange={handleChange} className="filter-input" />
                </div>
            )}
        </div>
    );
};
export default Filters;
