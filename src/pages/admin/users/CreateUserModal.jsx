import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Key, RefreshCw, Eye, EyeOff } from 'lucide-react';
import PasswordChecklist from '../../../components/PasswordChecklist';
import PasswordError, { passwordBoxStyle, passwordErrorFrom } from '../../../components/PasswordError';
import { generateStrongPassword, isPasswordValid, passwordPlaceholder } from '../../../utils/passwordRules';

const INITIAL_FORM = {
  name: '',
  phone: '',
  email: '',
  password: '',
  role: 'farmer',
  crop: 'Paddy / Rice',
  acreage: 3,
  village: 'Coimbatore',
  district: 'Coimbatore',
  state: 'Tamil Nadu',
  department: 'Customer Care',
};

/**
 * Modal dialog for creating new user credentials in Sathyam Agro Mart.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {() => void} props.onClose - Dismiss callback
 * @param {() => void} props.onSuccess - Callback on successful creation to reload users
 */
export default function CreateUserModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(true);
  const [passwordError, setPasswordError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({
        ...INITIAL_FORM,
        password: generateStrongPassword(),
      });
      setShowPassword(true);
      setPasswordError('');
      setSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || (!form.phone && !form.email)) {
      toast.error('Please provide name and phone/email');
      return;
    }
    if (!form.password) {
      setPasswordError('Please enter a password for this account.');
      document.getElementById('newUserPassword')?.focus();
      return;
    }
    if (!isPasswordValid(form.password, { role: form.role, phone: form.phone })) {
      setPasswordError('This password does not meet the rules listed under it.');
      document.getElementById('newUserPassword')?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await axios.post('/api/admin/users', form);
      if (data.success) {
        toast.success(`User credentials created for ${data.user.name}! 🔐`);
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      const onPassword = passwordErrorFrom(err);
      if (onPassword) {
        setPasswordError(onPassword);
        document.getElementById('newUserPassword')?.focus();
        return;
      }
      const msg = err.response?.data?.message || 'Error creating user credentials';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop admin-user-modal"
      data-view-only={false}
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
            <Key size={20} color="var(--brand-400)" />
            Create New Login Credentials
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

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Create an account with login credentials for Sathyam Agro Mart. The user can immediately
          log in on <code>sathyamagromart.com</code> or staff portals.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Full Name *
            </label>
            <input
              required
              placeholder="e.g. Rameshwar Patel"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                Mobile Number *
              </label>
              <input
                required
                placeholder="e.g. 9876543210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
                Email Address
              </label>
              <input
                type="email"
                placeholder="e.g. farmer@farm.in"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
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
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px',
              }}
            >
              <label htmlFor="newUserPassword" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                Login Password *
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setForm({ ...form, password: generateStrongPassword() });
                    setShowPassword(true);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--brand-400)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <RefreshCw size={12} /> Generate
                </button>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--brand-400)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}{' '}
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <input
              id="newUserPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder={passwordPlaceholder(form.role)}
              value={form.password}
              onChange={(e) => {
                setForm({ ...form, password: e.target.value });
                setPasswordError('');
              }}
              autoComplete="new-password"
              aria-invalid={passwordError ? 'true' : undefined}
              aria-describedby={passwordError ? 'newUserPassword-error' : undefined}
              style={passwordBoxStyle(
                {
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'var(--dark-900)',
                  border: '1px solid var(--dark-700)',
                  color: '#fff',
                  letterSpacing: showPassword ? 'normal' : '2px',
                },
                passwordError
              )}
            />
            <PasswordError id="newUserPassword" message={passwordError} />
            <PasswordChecklist password={form.password} role={form.role} phone={form.phone} />
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Copy this password before saving: it cannot be viewed again afterwards.
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              User System Role
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'var(--dark-900)',
                border: '1px solid var(--dark-700)',
                color: '#fff',
              }}
            >
              <option value="farmer">Farmer (Customer E-Commerce & Advisory)</option>
              <option value="employee">Employee / Agronomist Staff</option>
              <option value="delivery">Delivery Agent (Field Dispatch)</option>
              <option value="billing">Billing Operator (POS GST Invoice)</option>
              <option value="admin">System Administrator</option>
            </select>
          </div>

          {form.role === 'farmer' ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Primary Crop
                  </label>
                  <select
                    value={form.crop}
                    onChange={(e) => setForm({ ...form, crop: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'var(--dark-900)',
                      border: '1px solid var(--dark-700)',
                      color: '#fff',
                    }}
                  >
                    <option value="Paddy / Rice">Paddy / Rice</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Tomato">Tomato / Vegetables</option>
                    <option value="Wheat">Wheat</option>
                    <option value="Sugarcane">Sugarcane</option>
                    <option value="Corn / Maize">Corn / Maize</option>
                    <option value="Grapes / Fruits">Grapes / Fruits</option>
                    <option value="All Crops">All Crops (General)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Land Size (Acres)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.acreage}
                    onChange={(e) => setForm({ ...form, acreage: e.target.value })}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Village / Town
                  </label>
                  <input
                    placeholder="e.g. Karur"
                    value={form.village}
                    onChange={(e) => setForm({ ...form, village: e.target.value })}
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
                    District
                  </label>
                  <input
                    placeholder="e.g. Coimbatore"
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
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
            </>
          ) : (
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Department / Specialty
              </label>
              <input
                placeholder="e.g. Quality Control, Dispatch Hub 1, Agronomy Specialist"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
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
          )}

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
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ flex: 1 }}
            >
              {submitting ? 'Saving...' : 'Save & Issue Credentials'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
