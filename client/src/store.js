import { create } from 'zustand';

const useStore = create((set, get) => ({
    data: [],
    pagination: { page: 1, totalPages: 1, total: 0 },
    filters: {
        timeRange: '24h',
        startDate: '',
        endDate: '',
        externalId: [],
        insuredName: [],
        state: [],
        status: [],
        offeringType: [],
        submissionId: [],
        policyNumber: [],
    },
    chartDimensions: ['status'], // Default to one dimension (Pie)
    filterOptions: {}, // Store unique values for all columns
    loading: false,

    setData: (data) => set({ data }),
    setPagination: (pagination) => set((state) => ({ pagination: { ...state.pagination, ...pagination } })),
    setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters },
        pagination: { ...state.pagination, page: 1 }
    })),
    setChartDimensions: (dimensions) => set({ chartDimensions: dimensions }),
    setLoading: (loading) => set({ loading }),

    fetchFilterOptions: async () => {
        try {
            const response = await fetch('http://localhost:5000/api/filter-values');
            const result = await response.json();
            set({ filterOptions: result });
        } catch (error) {
            console.error('Error fetching filter options:', error);
        }
    },

    fetchData: async () => {
        const { filters, pagination } = get();
        set({ loading: true });
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('page', pagination.page);
            queryParams.append('timeRange', filters.timeRange);
            if (filters.startDate) queryParams.append('startDate', filters.startDate);
            if (filters.endDate) queryParams.append('endDate', filters.endDate);

            // Add multi-select filters as comma-separated strings or multiple params
            // Backend will need to handle this
            if (filters.externalId.length) queryParams.append('externalId', filters.externalId.join(','));
            if (filters.insuredName.length) queryParams.append('insuredName', filters.insuredName.join(','));
            if (filters.state.length) queryParams.append('state', filters.state.join(','));
            if (filters.status.length) queryParams.append('status', filters.status.join(','));
            if (filters.offeringType.length) queryParams.append('offeringType', filters.offeringType.join(','));
            if (filters.submissionId.length) queryParams.append('submissionId', filters.submissionId.join(','));
            if (filters.policyNumber.length) queryParams.append('policyNumber', filters.policyNumber.join(','));

            const response = await fetch(`http://localhost:5000/api/reports?${queryParams}`);
            const result = await response.json();
            set({
                data: result.data || [],
                pagination: { ...pagination, ...result.pagination }
            });
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            set({ loading: false });
        }
    },
}));

export default useStore;
