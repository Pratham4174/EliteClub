// components/transactions/TransactionFilters.tsx
import type { FilterState } from "@/types";
import { Calendar, User } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  onFilter: (filters: FilterState) => void;
}

export default function TransactionFilters({ onFilter }: Props) {
  const [filters, setFilters] = useState<FilterState>({});
  
  // Apply filters after a delay (debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilter(filters);
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timer);
  }, [filters, onFilter]);
  
  const handleInputChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.keys(filters).some(key => 
    filters[key as keyof FilterState] !== undefined
  );

  return (
    <div className="filters-container">
      <div className="filters-header">
        <h3 className="filters-title">
          
        </h3>
        
        {hasActiveFilters && (
          <button 
            onClick={clearFilters}
            className="clear-filters-btn"
          >
            Clear All Filters
          </button>
        )}
      </div>
      
      <div className="filters-grid">
        {/* User ID */}
        <div className="filter-group">
          <label className="filter-label">
            <User size={16} />
            User ID
          </label>
          <input
            type="number"
            min="1"
            value={filters.userId || ''}
            onChange={(e) => handleInputChange('userId', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="Enter user ID"
            className="filter-input"
          />
        </div>

        {/* Admin Name */}
        <div className="filter-group">
          <label className="filter-label">
            <User size={16} />
            Admin Name
          </label>
          <input
            type="text"
            value={filters.adminName || ''}
            onChange={(e) => handleInputChange('adminName', e.target.value)}
            placeholder="Enter admin name"
            className="filter-input"
          />
        </div>

        {/* Transaction Type */}
        <div className="filter-group">
          <label className="filter-label">Type</label>
          <select 
            value={filters.type || ''}
            onChange={(e) => handleInputChange('type', e.target.value)}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value="ADD">Add Balance</option>
            <option value="DEDUCT">Deduct Balance</option>
            <option value="NEW_USER">New User</option>
          </select>
        </div>

        {/* Start Date */}
        <div className="filter-group">
          <label className="filter-label">
            <Calendar size={16} />
            Start Date
          </label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
            className="filter-input"
          />
        </div>

        {/* End Date */}
        <div className="filter-group">
          <label className="filter-label">
            <Calendar size={16} />
            End Date
          </label>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => handleInputChange('endDate', e.target.value)}
            className="filter-input"
          />
        </div>
      </div>
      
      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="active-filters">
          <span className="active-filters-label">Active Filters:</span>
          {filters.userId && (
            <span className="filter-tag">
              User ID: {filters.userId}
              <button onClick={() => handleInputChange('userId', undefined)}>×</button>
            </span>
          )}
          {filters.adminName && (
            <span className="filter-tag">
              Admin: {filters.adminName}
              <button onClick={() => handleInputChange('adminName', undefined)}>×</button>
            </span>
          )}
          {filters.type && (
            <span className="filter-tag">
              Type: {filters.type}
              <button onClick={() => handleInputChange('type', undefined)}>×</button>
            </span>
          )}
          {filters.startDate && (
            <span className="filter-tag">
              From: {filters.startDate}
              <button onClick={() => handleInputChange('startDate', undefined)}>×</button>
            </span>
          )}
          {filters.endDate && (
            <span className="filter-tag">
              To: {filters.endDate}
              <button onClick={() => handleInputChange('endDate', undefined)}>×</button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}