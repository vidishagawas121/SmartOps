import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, Download } from 'lucide-react';
import { Button } from '../ui/Button';
import { downloadReport } from '../../utils/downloadReport';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortKey?: keyof T;
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchKey?: keyof T;
  filterComponent?: (data: T[]) => T[];
  exportFileName?: string;
  hideExport?: boolean;
  onExport?: () => void;
}

export function Table<T extends { id: string | number }>({
  data,
  columns,
  searchPlaceholder = 'Search records...',
  searchKey,
  filterComponent,
  exportFileName = 'export-data',
  hideExport = false,
  onExport
}: TableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // 1. Handle Search
  const searchedData = useMemo(() => {
    if (!searchQuery || !searchKey) return data;
    return data.filter(row => {
      const val = row[searchKey];
      if (typeof val === 'string') {
        return val.toLowerCase().includes(searchQuery.toLowerCase());
      }
      if (typeof val === 'number') {
        return val.toString().includes(searchQuery);
      }
      return false;
    });
  }, [data, searchQuery, searchKey]);

  // 2. Handle Custom Filters
  const filteredData = useMemo(() => {
    if (filterComponent) {
      return filterComponent(searchedData);
    }
    return searchedData;
  }, [searchedData, filterComponent]);

  // 3. Handle Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    const sorted = [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      
      if (aVal === undefined || bVal === undefined) return 0;
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      return 0;
    });
    return sorted;
  }, [filteredData, sortKey, sortDirection]);

  // 4. Handle Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage]);

  const handleSort = (key?: keyof T) => {
    if (!key) return;
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Export Functionality
  const handleExport = () => {
    if (onExport) {
      onExport();
      return;
    }
    if (sortedData.length === 0) return;
    
    const headers = columns.map(c => c.header);
    const rows = sortedData.map(row => 
      columns.map(col => {
        if (typeof col.accessor === 'function') {
          // If accessor is a function, default to an empty string in raw CSV cells
          return '';
        }
        return String(row[col.accessor] ?? '');
      })
    );

    const name = exportFileName || 'smartops_ledger_export';

    downloadReport({
      fileName: name,
      title: name.toUpperCase().replace(/_/g, ' '),
      format: 'CSV',
      headers,
      rows,
      summary: 'Data ledger export from the SmartOps operational management platform.'
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1E293B] border border-[#E5EEFF] dark:border-[#334155] rounded-[18px] shadow-sm overflow-hidden animate-fade-in">
      {/* Table Header Controls */}
      {(!hideExport || searchKey) && (
        <div className="flex flex-col sm:flex-row items-center justify-between p-6 gap-4 border-b border-[#E5EEFF] dark:border-[#334155] bg-transparent">
          {searchKey ? (
            <div className="relative w-full sm:max-w-[240px]">
              <Search className="search-icon-glow absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none z-10" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder}
                className="navbar-search-input w-full pl-9 pr-3 h-9 text-xs border border-[#E5E7EB] dark:border-[#334155] rounded-full bg-slate-50/50 dark:bg-slate-800/40 text-[#111827] dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#006A6A] focus:border-[#006A6A] transition-all font-medium"
              />
            </div>
          ) : (
            <div />
          )}
          {!hideExport && (
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <Button variant="secondary" size="sm" onClick={handleExport} className="flex items-center gap-2 border border-[#E5EEFF] dark:border-[#334155] shadow-sm hover:shadow text-[#545F73] dark:text-[#CBD5E1]">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-x-auto flex-1 min-h-[300px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#EFF4FF] dark:bg-[#111827] border-b border-[#E5EEFF] dark:border-[#334155] sticky top-0 z-10">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => handleSort(col.sortKey)}
                  className={`px-6 py-4 text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] select-none ${
                    col.sortKey ? 'cursor-pointer hover:bg-[#E5EEFF]/55 dark:hover:bg-[#1E293B]/55 hover:text-[#0B1C30] dark:hover:text-white' : ''
                  } ${col.className || ''}`}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortKey && col.sortKey === sortKey && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 text-[#006A6A] dark:text-[#7DF5F5]" /> : <ChevronDown className="h-4 w-4 text-[#006A6A] dark:text-[#7DF5F5]" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5EEFF] dark:divide-[#334155]">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rIdx) => (
                <tr key={row.id || rIdx} className="hover:bg-[#EFF4FF]/40 dark:hover:bg-[#111827]/40 transition-colors">
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={`px-6 py-4.5 text-[15px] font-medium text-[#0B1C30] dark:text-[#F8FAFC] ${col.className || ''}`}>
                      {typeof col.accessor === 'function'
                        ? col.accessor(row)
                        : (row[col.accessor] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-[15px] text-[#6D7A79] dark:text-[#94A3B8]">
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer / Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-5 border-t border-[#E5EEFF] dark:border-[#334155] bg-transparent">
          <div className="text-[13px] text-[#6D7A79] dark:text-[#94A3B8] font-medium">
            Showing <span className="font-semibold text-[#0B1C30] dark:text-[#F8FAFC]">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
            <span className="font-semibold text-[#0B1C30] dark:text-[#F8FAFC]">
              {Math.min(currentPage * itemsPerPage, sortedData.length)}
            </span>{' '}
            of <span className="font-semibold text-[#0B1C30] dark:text-[#F8FAFC]">{sortedData.length}</span> results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="border border-[#E5EEFF] dark:border-[#334155] bg-white hover:bg-[#F8F9FF] text-[#545F73] dark:text-[#CBD5E1] rounded-xl"
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }).map((_, index) => (
              <Button
                key={index}
                variant={currentPage === index + 1 ? 'primary' : 'outline'}
                size="sm"
                className={`w-9 h-9 p-0 border border-[#E5EEFF] dark:border-[#334155] rounded-xl ${
                  currentPage === index + 1 
                    ? 'bg-gradient-to-r from-[#006A6A] to-[#00A3A3] text-white shadow-md shadow-[#006A6A]/10' 
                    : 'text-[#545F73] dark:text-[#CBD5E1] bg-white hover:bg-[#F8F9FF]'
                }`}
                onClick={() => setCurrentPage(index + 1)}
              >
                {index + 1}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="border border-[#E5EEFF] dark:border-[#334155] bg-white hover:bg-[#F8F9FF] text-[#545F73] dark:text-[#CBD5E1] rounded-xl"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

