import React, { useState } from 'react';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';
import useStore from '../store';

const Table = () => {
    const { data, filters, setFilters, fetchData, pagination, setPagination, filterOptions } = useStore();
    const [openFilter, setOpenFilter] = useState(null);

    const columns = [
        { label: 'ExternalID', key: 'externalId', path: (row) => row.json_payload?.meta?.externalId },
        { label: 'Insured Name', key: 'insuredName', path: (row) => row.json_payload?.data?.Submission?.Insured?.InsuredName },
        { label: 'State', key: 'state', path: (row) => row.json_payload?.data?.Submission?.Insured?.Address?.State },
        { label: 'Status', key: 'status', path: (row) => row.json_payload?.meta?.status?.State },
        { label: 'Offering Type', key: 'offeringType', path: (row) => row.json_payload?.data?.Request?.Products?.MguOfferingType },
        { label: 'SubmissionID', key: 'submissionId', path: (row) => row.json_payload?.meta?.data?.Submission?.SubmissionID },
        { label: 'Policy Number', key: 'policyNumber', path: (row) => row.json_payload?.meta?.data?.Policy?.PolicyNumber },
        { label: 'Premium', key: 'totalPremium', path: (row) => row.json_payload?.data?.Request?.TotalPremium }
    ];

    const toggleFilter = (key) => {
        setOpenFilter(openFilter === key ? null : key);
    };

    const handleFilterChange = (key, value) => {
        const currentFilters = filters[key] || [];
        const newFilters = currentFilters.includes(value)
            ? currentFilters.filter(v => v !== value)
            : [...currentFilters, value];
        setFilters({ [key]: newFilters });
        fetchData();
    };

    // Use values from backend instead of local data
    const getFilterValues = (key) => {
        return filterOptions[key] || [];
    };

    return (
        <div className="table-wrapper">
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            {columns.map(col => (
                                <th key={col.key}>
                                    <div className="header-cell" onClick={() => toggleFilter(col.key)}>
                                        {col.label}
                                        <Filter size={14} className={filters[col.key]?.length > 0 ? 'active-filter' : ''} />
                                    </div>
                                    {openFilter === col.key && (
                                        <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                                            <div className="filter-dropdown-header">
                                                <span>Select {col.label}</span>
                                                <button className="clear-link" onClick={() => {
                                                    setFilters({ [col.key]: [] });
                                                    fetchData();
                                                }}>Clear All</button>
                                            </div>
                                            <div className="filter-options-list">
                                                {getFilterValues(col.key).map((val, i) => (
                                                    <label key={`${val}-${i}`} className="filter-item">
                                                        <input
                                                            type="checkbox"
                                                            checked={filters[col.key]?.includes(val)}
                                                            onChange={(e) => {
                                                                handleFilterChange(col.key, val);
                                                            }}
                                                        />
                                                        <span>{val}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            {getFilterValues(col.key).length === 0 && <div className="no-values">No options found</div>}
                                        </div>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, idx) => (
                            <tr key={idx}>
                                {columns.map(col => (
                                    <td key={col.key}>{col.path(row) || <span style={{ opacity: 0.3 }}>N/A</span>}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="pagination">
                <button onClick={() => { setPagination({ page: pagination.page - 1 }); fetchData(); }} disabled={pagination.page <= 1}>Prev</button>
                <span>Page {pagination.page} of {pagination.totalPages}</span>
                <button onClick={() => { setPagination({ page: pagination.page + 1 }); fetchData(); }} disabled={pagination.page >= pagination.totalPages}>Next</button>
            </div>
        </div>
    );
};

export default Table;
