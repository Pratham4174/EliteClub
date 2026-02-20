import "@/css/TransactionTable.css";
import type { Transaction } from "@/types";
import {
    Calendar,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    CreditCard,
    DollarSign,
    Filter,
    Info,
    Search,
    TrendingDown,
    TrendingUp,
    User,
    UserPlus
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface TransactionTableProps {
  transactions: Transaction[];
}

type SortField = 'userId' | 'type' | 'amount' | 'balanceAfter' | 'adminName' | 'timestamp';
type SortDirection = 'asc' | 'desc';

export default function TransactionTable({ transactions }: TransactionTableProps) {
  // State for pagination and sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalAdd = transactions
      .filter(t => t.type === "ADD")
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const totalDeduct = transactions
      .filter(t => t.type === "DEDUCT" || t.type === "BOOKING")
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const newUsers = transactions.filter(t => t.type === "NEW_USER").length;
    
    return {
      totalAdd,
      totalDeduct,
      newUsers,
      netBalance: totalAdd - totalDeduct,
      totalTransactions: transactions.length
    };
  }, [transactions]);

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = [...transactions];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.userId.toString().includes(term) ||
        tx.userName && tx.userName.toLowerCase().includes(term)||
        tx.userName?.toLowerCase().includes(term) ||
        tx.adminName?.toLowerCase().includes(term) ||
        tx.description?.toLowerCase().includes(term)
      );
    }
    
    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.filter(tx => tx.type === filterType);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      // Handle undefined values
      if (aValue === undefined) aValue = '';
      if (bValue === undefined) bValue = '';
      
      // Handle different data types
      if (sortField === 'timestamp') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [transactions, searchTerm, filterType, sortField, sortDirection]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredAndSortedTransactions.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, sortField, sortDirection]);

  // Handle sort click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  // Get type display
  const getTypeDisplay = (type: string) => {
    switch (type) {
      case 'ADD': return { label: 'Add', icon: <TrendingUp size={14} />, color: '#10b981' };
      case 'DEDUCT': return { label: 'Deduct', icon: <TrendingDown size={14} />, color: '#ef4444' };
      case 'BOOKING': return { label: 'Booking', icon: <Calendar size={14} />, color: '#ef4444' };
      case 'NEW_USER': return { label: 'New User', icon: <UserPlus size={14} />, color: '#8b5cf6' };
      default: return { label: type, icon: <Info size={14} />, color: '#6b7280' };
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    };
  };

  return (
    <div className="transaction-table-container">
      {/* Statistics Header */}
      <div className="stats-header">
        <div className="stat-box">
          <div className="stat-icon add">
            <TrendingUp size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Added</span>
            <span className="stat-value">{formatCurrency(stats.totalAdd)}</span>
          </div>
        </div>
        
        <div className="stat-box">
          <div className="stat-icon deduct">
            <TrendingDown size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Deducted</span>
            <span className="stat-value">{formatCurrency(stats.totalDeduct)}</span>
          </div>
        </div>
        
        <div className="stat-box">
          <div className="stat-icon net">
            <DollarSign size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Net Balance</span>
            <span className="stat-value" style={{ color: stats.netBalance >= 0 ? '#10b981' : '#ef4444' }}>
              {formatCurrency(stats.netBalance)}
            </span>
          </div>
        </div>
        
        <div className="stat-box">
          <div className="stat-icon users">
            <User size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-label">New Users</span>
            <span className="stat-value">{stats.newUsers}</span>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="controls-bar">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by user, admin, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")}
              className="clear-search"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        
        <div className="filter-group">
          <Filter size={18} />
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="ADD">Add Only</option>
            <option value="DEDUCT">Deduct Only</option>
            <option value="BOOKING">Booking Only</option>
            <option value="NEW_USER">New Users</option>
          </select>
        </div>
        
        <div className="items-per-page">
          <span>Show</span>
          <select 
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="page-select"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>entries</span>
        </div>
      </div>

      {/* Results Info */}
      <div className="results-info">
        <span>
          Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedTransactions.length)} of {filteredAndSortedTransactions.length} transactions
        </span>
        {searchTerm && (
          <span className="search-info">
            (filtered from {transactions.length} total)
          </span>
        )}
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="transaction-table">
          <thead>
            <tr>
              <th 
                className="sortable" 
                onClick={() => handleSort('userId')}
                title="Sort by User ID"
              >
                <div className="th-content">
                  <User size={14} />
                  User
                  {getSortIcon('userId')}
                </div>
              </th>
              
              <th 
                className="sortable" 
                onClick={() => handleSort('type')}
                title="Sort by Type"
              >
                <div className="th-content">
                  Type
                  {getSortIcon('type')}
                </div>
              </th>
              <th 
                className="sortable" 
                onClick={() => handleSort('amount')}
                title="Sort by Amount"
              >
                <div className="th-content">
                  Amount
                  {getSortIcon('amount')}
                </div>
              </th>
              <th 
                className="sortable" 
                onClick={() => handleSort('balanceAfter')}
                title="Sort by Balance"
              >
                <div className="th-content">
                  Balance After
                  {getSortIcon('balanceAfter')}
                </div>
              </th>
              <th>Staff</th>
              <th>Description</th>
              <th 
                className="sortable" 
                onClick={() => handleSort('timestamp')}
                title="Sort by Date"
              >
                <div className="th-content">
                  <Calendar size={14} />
                  Date & Time
                  {getSortIcon('timestamp')}
                </div>
              </th>
            </tr>
          </thead>
          
          <tbody>
            {paginatedTransactions.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={7}>
                  <div className="empty-state">
                    <CreditCard size={32} />
                    <p>No transactions found</p>
                    {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm("")}
                        className="btn-text"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((tx) => {
                const typeDisplay = getTypeDisplay(tx.type);
                const dateFormatted = formatDate(tx.timestamp);
                
                return (
                  <tr key={tx.id} className="transaction-row">
                    <td className="user-cell">
                      <div className="user-info">
                        <div className="user-avatar">
                          <User size={12} />
                        </div>
                        <div>
                          <div className="user-id">#{tx.userId}</div>
                          {tx.userName && (
                            <div className="user-name">{tx.userName}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="type-badge" style={{ backgroundColor: `${typeDisplay.color}15` }}>
                        <span style={{ color: typeDisplay.color }}>
                          {typeDisplay.icon}
                          {typeDisplay.label}
                        </span>
                      </div>
                    </td>
                    <td className="amount-cell">
                      <div className="amount-display">
                        <span className="amount-symbol">₹</span>
                        <span className="amount-value">{tx.amount.toLocaleString()}</span>
                        {tx.previousBalance !== undefined && (
                          <div className="balance-change">
                            {tx.type === 'ADD' ? '+' : tx.type === 'DEDUCT' ? '-' : ''}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="balance-cell">
                      {tx.balanceAfter !== undefined ? (
                        <div className="balance-display">
                          <span className="balance-value">₹{tx.balanceAfter.toLocaleString()}</span>
                          {tx.previousBalance !== undefined && tx.balanceAfter !== undefined && (
                            <div className="balance-change-arrow">
                              <span className="previous-balance">
                                ₹{tx.previousBalance.toLocaleString()}
                              </span>
                              <span className="arrow">→</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="no-balance">N/A</span>
                      )}
                    </td>
                    <td className="admin-cell">
                      {tx.adminName ? (
                        <div className="admin-info">
                          <div className="admin-name">{tx.adminName}</div>
                        </div>
                      ) : (
                        <span className="no-admin">System</span>
                      )}
                    </td>
                    <td className="description-cell">
                      <div className="description-text" title={tx.description}>
                        {tx.description || 'No description'}
                      </div>
                    </td>
                    <td className="date-cell">
                      <div className="date-display">
                        <div className="date">{dateFormatted.date}</div>
                        <div className="time">{dateFormatted.time}</div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          
          <div className="page-numbers">
  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    let pageNum: number;
    
    if (totalPages <= 5) {
      pageNum = i + 1;
    } else if (currentPage <= 3) {
      pageNum = i + 1;
    } else if (currentPage >= totalPages - 2) {
      pageNum = totalPages - 4 + i;
    } else {
      pageNum = currentPage - 2 + i;
    }
              
    return (
        <button
          key={pageNum}
          onClick={() => setCurrentPage(pageNum)}
          className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
        >
          {pageNum}
        </button>
      );
    })}
    
    {totalPages > 5 && currentPage < totalPages - 2 && (
      <>
        <span className="ellipsis">...</span>
        <button
          onClick={() => setCurrentPage(totalPages)}
          className={`page-btn ${currentPage === totalPages ? 'active' : ''}`}
        >
          {totalPages}
        </button>
      </>
    )}
  </div>
          
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next
            <ChevronRight size={16} />
          </button>
          
          <div className="page-info">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      )}
    </div>
  );
}
