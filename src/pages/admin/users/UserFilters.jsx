import React from 'react';
import { Search, RefreshCw } from 'lucide-react';

/**
 * Filter & Live Search Bar for Admin Users & Credentials Master.
 *
 * @param {object} props
 * @param {string} props.search - Current search string
 * @param {(val: string) => void} props.setSearch - Search string updater
 * @param {(e: React.FormEvent) => void} props.handleSearchSubmit - Form submit handler for searching
 * @param {string} props.roleFilter - Currently selected role filter
 * @param {(val: string) => void} props.setRoleFilter - Role filter updater
 * @param {Array<{key: string, label: string}>} [props.roles=[]] - List of available roles
 * @param {string} props.sortBy - Currently selected sort option
 * @param {(val: string) => void} props.setSortBy - Sort option updater
 * @param {() => void} props.onRefresh - Refresh button callback
 */
export default function UserFilters({
  search,
  setSearch,
  handleSearchSubmit,
  roleFilter,
  setRoleFilter,
  roles = [],
  sortBy,
  setSortBy,
  onRefresh,
}) {
  return (
    <div
      className="filter-bar users-filter-bar"
      style={{
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        alignItems: 'center',
        marginBottom: '20px',
      }}
    >
      <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flex: 1, minWidth: '280px' }}>
        <div className="search-box" style={{ width: '100%', position: 'relative' }}>
          <Search
            size={16}
            className="search-icon"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            style={{ width: '100%', paddingLeft: '38px' }}
            placeholder="Search by name, phone, crop, or village..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </form>

      <select
        className="filter-select"
        value={roleFilter}
        onChange={(e) => setRoleFilter(e.target.value)}
      >
        {roles.map((r) => (
          <option key={r.key} value={r.key}>
            {r.label}
          </option>
        ))}
      </select>

      <select
        className="filter-select"
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
      >
        <option value="recent">Sort: Most Recent</option>
        <option value="name">Sort: User Name (A-Z)</option>
      </select>

      <button
        className="btn btn-outline"
        onClick={onRefresh}
        title="Refresh records"
        type="button"
      >
        <RefreshCw size={16} />
      </button>
    </div>
  );
}
