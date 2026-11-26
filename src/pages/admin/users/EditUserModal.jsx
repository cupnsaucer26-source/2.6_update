import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Edit2 } from 'lucide-react';
import PasswordChecklist from '../../../components/PasswordChecklist';
import PasswordError, { passwordBoxStyle, passwordErrorFrom } from '../../../components/PasswordError';
import { isPasswordValid, passwordPlaceholder } from '../../../utils/passwordRules';
import { profileValueOf } from '../../../shared/profileFieldRules';

/**
 * Modal dialog for inspecting and updating user credentials and profiles.
 * For farmers, displays their customer profile fields in view-only mode.
 * For staff/admins, provides full credential editing.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {object|null} props.user - The user object to view/edit
 * @param {Array} [props.profileFields=[]] - Configured customer profile fields
 * @param {() => void} props.onClose - Dismiss callback
 * @param {() => void} props.onSuccess - Callback on update to refresh user list
 */
export default function EditUserModal({
  isOpen,
  user,
  profileFields = [],
  onClose,
  onSuccess,
}) {
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    role: 'farmer',
    crop: '',
    acreage: 0,
    village: '',
    district: '',
    state: '',
    department: '',
    status: 'active',
  });
  const [passwordError, setPasswordError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const viewOnly = user?.role === 'farmer';

  useEffect(() => {
    if (user && isOpen) {
      setEditForm({
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
        password: '',
        role: user.role || 'farmer',
        crop: user.crop || '',
        acreage: user.acreage || 0,
        village: user.village || '',
        district: user.district || '',
        state: user.state || '',
        department: user.department || '',
        status: user.status || 'active',
      });
      setPasswordError('');
      setSubmitting(false);
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (viewOnly) return;

    try {
      const updates = { ...editForm };
      if (!updates.password) {
        delete updates.password; // keep existing password if blank
      } else if (!isPasswordValid(updates.password, { role: updates.role, phone: updates.phone })) {
        setPasswordError('This password does not meet the rules listed under it.');
        document.getElementById('editUserPassword')?.focus();
        return;
      }

      setSubmitting(true);
      const { data } = await axios.put(`/api/admin/users/${user.id}`, updates);
      if (data.success) {
        toast.success('User credentials and record updated! ✨');
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      const onPassword = passwordErrorFrom(err);
      if (onPassword) {
        setPasswordError(onPassword);
        document.getElementById('editUserPassword')?.focus();
        return;
      }
      const msg = err.response?.data?.message || 'Error updating user';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop admin-user-modal"
      data-view-only={viewOnly}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--dark-800)',
          border: '1px solid var(--dark-700)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '540px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Edit2 size={18} color="var(--brand-400)" />
            {viewOnly ? 'Customer Profile' : `Update User: ${user.name}`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '1.2rem',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {viewOnly && (
          <div className="admin-customer-profile-summary">
            {profileFields.map((field) => (
              <div key={field.id}>
                <span>{field.title}</span>
                <strong>{String(profileValueOf(user, field)) || 'Not provided'}</strong>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Full Name
            </label>
            <input
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'var(--dark-900)',
                border: '1px solid var(--dark-700)',
                color: '#fff',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Mobile Phone
              </label>
              <input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'var(--dark-900)',
                  border: '1px solid var(--dark-700)',
                  color: '#fff',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Email
              </label>
              <input
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'var(--dark-900)',
                  border: '1px solid var(--dark-700)',
                  color: '#fff',
                }}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="editUserPassword"
              style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}
            >
              Reset Login Password (leave empty to keep current)
            </label>
            <input
              id="editUserPassword"
              type="text"
              placeholder={`New password (${passwordPlaceholder(editForm.role)})`}
              value={editForm.password}
              onChange={(e) => {
                setEditForm({ ...editForm, password: e.target.value });
                setPasswordError('');
              }}
              autoComplete="new-password"
              aria-invalid={passwordError ? 'true' : undefined}
              aria-describedby={passwordError ? 'editUserPassword-error' : undefined}
              style={passwordBoxStyle(
                {
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'var(--dark-900)',
                  border: '1px solid var(--dark-700)',
                  color: '#fff',
                },
                passwordError
              )}
            />
            <PasswordError id="editUserPassword" message={passwordError} />
            {editForm.password && (
              <PasswordChecklist
                password={editForm.password}
                role={editForm.role}
                phone={editForm.phone}
              />
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Role
              </label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'var(--dark-900)',
                  border: '1px solid var(--dark-700)',
                  color: '#fff',
                }}
              >
                <option value="farmer">Farmer</option>
                <option value="employee">Employee</option>
                <option value="delivery">Delivery</option>
                <option value="billing">Billing</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Account Status
              </label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'var(--dark-900)',
                  border: '1px solid var(--dark-700)',
                  color: '#fff',
                }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive / Suspended</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={submitting}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            {!viewOnly && (
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ flex: 1 }}
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
