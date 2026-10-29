import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Users as UsersIcon,
  UserPlus,
  Shield,
  Sprout,
  Edit2,
  Trash2,
  Eye,
  Phone,
  Mail,
} from 'lucide-react';
import UserFilters from './users/UserFilters';
import CreateUserModal from './users/CreateUserModal';
import EditUserModal from './users/EditUserModal';
import TableLoader from '../../components/common/TableLoader';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDate } from '../../utils/formatters';
import { normalizeProfileFields } from '../../shared/profileFieldRules';

const ROLES = [
  { key: 'all', label: 'All Roles' },
  { key: 'farmer', label: 'Farmers (Customers)' },
  { key: 'employee', label: 'Employees' },
  { key: 'delivery', label: 'Delivery Agents' },
  { key: 'billing', label: 'Billing Staff' },
  { key: 'admin', label: 'Admins' },
];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [profileFields, setProfileFields] = useState([]);

  useEffect(() => {
    fetchUsers();
    axios
      .get('/api/profile-fields')
      .then(({ data }) => setProfileFields(normalizeProfileFields(data.data)))
      .catch(() => {});
  }, [roleFilter, sortBy]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/admin/users', {
        params: { role: roleFilter, sortBy, search },
      });
      if (data.success) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('Failed to load users from database');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const openCreateModal = () => {
    setCreateModalOpen(true);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
  };

  const handleDeleteUser = async (id, name) => {
    if (
      !window.confirm(
        `Are you sure you want to remove user "${name}"? Any assigned products will revert to general catalog.`
      )
    ) {
      return;
    }

    try {
      const { data } = await axios.delete(`/api/admin/users/${id}`);
      if (data.success) {
        toast.success(`User ${name} removed`);
        fetchUsers();
      }
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const farmersCount = users.filter((u) => u.role === 'farmer').length;
  const staffCount = users.filter((u) => u.role !== 'farmer').length;
  const activeCount = users.filter((u) => u.status === 'active').length;

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <StatusBadge
            status="admin"
            color="red"
            label="Admin"
            icon={<Shield size={12} />}
          />
        );
      case 'farmer':
        return (
          <StatusBadge
            status="farmer"
            color="green"
            label="Farmer (Customer)"
            icon={<Sprout size={12} />}
          />
        );
      case 'employee':
        return <StatusBadge status="employee" color="blue" label="Employee" />;
      case 'delivery':
        return <StatusBadge status="delivery" color="yellow" label="Delivery Agent" />;
      case 'billing':
        return <StatusBadge status="billing" color="purple" label="Billing Staff" />;
      default:
        return <StatusBadge status={role} label={role} />;
    }
  };

  return (
    <div className="animate-fade-in admin-users-page" style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div
        className="page-header users-page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UsersIcon size={26} color="var(--brand-400)" />
            Users & Credentials Master
          </h1>
          <p>
            Full database record of customers, farmers & staff. Create login credentials and
            manage permissions.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={openCreateModal}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <UserPlus size={16} /> Create Login Credentials
        </button>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          margin: '20px 0',
        }}
      >
        <div className="stat-card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Total Database Users
          </div>
          <div
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginTop: '6px',
            }}
          >
            {users.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--brand-600)', marginTop: '4px' }}>
            Across all system portals
          </div>
        </div>

        <div className="stat-card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Registered Farmers
          </div>
          <div
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              color: 'var(--brand-600)',
              marginTop: '6px',
            }}
          >
            {farmersCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            E-Commerce buyers & advisory
          </div>
        </div>

        <div className="stat-card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Staff & Logistics
          </div>
          <div
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              color: '#2563eb',
              marginTop: '6px',
            }}
          >
            {staffCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            QC, Delivery & Billing
          </div>
        </div>

        <div className="stat-card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Active Accounts</div>
          <div
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              color: '#15803d',
              marginTop: '6px',
            }}
          >
            {activeCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Can log into Sathyam Agro Mart
          </div>
        </div>
      </div>

      {/* Filter & Live Search Bar */}
      <UserFilters
        search={search}
        setSearch={setSearch}
        handleSearchSubmit={handleSearchSubmit}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        roles={ROLES}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onRefresh={fetchUsers}
      />

      {/* Users Database Table Record */}
      <div
        className="card users-table-card"
        style={{
          background: 'var(--dark-800)',
          borderRadius: '12px',
          border: '1px solid var(--dark-700)',
          overflow: 'hidden',
        }}
      >
        <div className="table-wrap users-table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  borderBottom: '1px solid var(--dark-700)',
                }}
              >
                <th style={{ padding: '14px 16px' }}>User Details</th>
                <th style={{ padding: '14px 16px' }}>Contact & Login</th>
                <th style={{ padding: '14px 16px' }}>Saved Addresses</th>
                <th style={{ padding: '14px 16px' }}>System Role</th>
                <th style={{ padding: '14px 16px' }}>Farm / Department</th>
                <th style={{ padding: '14px 16px' }}>Target Products</th>
                <th style={{ padding: '14px 16px' }}>Status</th>
                <th style={{ padding: '14px 16px' }}>Created</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableLoader colSpan={9} message="Loading database records..." />
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '24px' }}>
                    <EmptyState
                      icon={<UsersIcon size={32} />}
                      title="No users matching criteria in database"
                      description="Click 'Create Login Credentials' to add one!"
                    />
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--dark-700)' }}>
                    {/* User Name & ID */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background:
                              u.role === 'farmer'
                                ? 'rgba(74, 222, 128, 0.15)'
                                : 'rgba(96, 165, 250, 0.15)',
                            color: u.role === 'farmer' ? '#4ade80' : '#60a5fa',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                          }}
                        >
                          {u.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {u.name}
                          </div>
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-muted)',
                              fontFamily: 'monospace',
                            }}
                          >
                            {u.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Saved delivery addresses */}
                    <td
                      style={{
                        padding: '14px 16px',
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {Array.isArray(u.addresses) && u.addresses.length ? (
                        <>
                          <strong>{u.addresses.length} saved</strong>
                          <div style={{ color: 'var(--text-muted)', marginTop: 3 }}>
                            {u.addresses.map((address) => address.label).join(', ')}
                          </div>
                        </>
                      ) : (
                        'None saved'
                      )}
                    </td>

                    {/* Contact & Phone */}
                    <td style={{ padding: '14px 16px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.85rem',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <Phone size={13} color="var(--brand-400)" />
                        <strong>{u.phone || '—'}</strong>
                      </div>
                      {u.email && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            marginTop: '2px',
                          }}
                        >
                          <Mail size={12} />
                          {u.email}
                        </div>
                      )}
                    </td>

                    {/* Role */}
                    <td style={{ padding: '14px 16px' }}>{getRoleBadge(u.role)}</td>

                    {/* Farm Details */}
                    <td style={{ padding: '14px 16px', fontSize: '0.82rem' }}>
                      {u.role === 'farmer' ? (
                        <div>
                          <div style={{ color: 'var(--brand-400)', fontWeight: 600 }}>
                            🌾 {u.crop || 'General Crop'}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {u.acreage ? `${u.acreage} Acres • ` : ''}
                            {u.village || u.district}
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: 'var(--text-secondary)' }}>
                          {u.department || 'Operations Team'}
                        </div>
                      )}
                    </td>

                    {/* Target Products */}
                    <td style={{ padding: '14px 16px' }}>
                      {u.targetProductCount > 0 ? (
                        <span
                          className="badge badge-purple"
                          style={{ cursor: 'pointer' }}
                          title="Products personalized for this user"
                        >
                          🎯 {u.targetProductCount} Assigned
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          0 assigned
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 16px' }}>
                      <StatusBadge
                        status={u.status}
                        color={u.status === 'active' ? 'green' : 'red'}
                        label={u.status === 'active' ? 'Active' : 'Inactive'}
                      />
                    </td>

                    {/* Created */}
                    <td
                      style={{
                        padding: '14px 16px',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <div>{formatDate(u.createdAt)}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        by {u.createdBy || 'system'}
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-outline"
                          style={{
                            padding: '6px 10px',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          onClick={() => openEditModal(u)}
                          title="Edit user credentials or permissions"
                        >
                          {u.role === 'farmer' ? (
                            <>
                              <Eye size={13} /> View
                            </>
                          ) : (
                            <>
                              <Edit2 size={13} /> Edit
                            </>
                          )}
                        </button>
                        <button
                          className="btn btn-outline"
                          style={{
                            padding: '6px 10px',
                            fontSize: '0.75rem',
                            color: '#f87171',
                            borderColor: 'rgba(248, 113, 113, 0.3)',
                          }}
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          title="Delete user"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Login Credentials Modal */}
      <CreateUserModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={fetchUsers}
      />

      {/* Edit User Credentials / View Customer Profile Modal */}
      <EditUserModal
        isOpen={Boolean(selectedUser)}
        user={selectedUser}
        profileFields={profileFields}
        onClose={() => setSelectedUser(null)}
        onSuccess={fetchUsers}
      />
    </div>
  );
}
