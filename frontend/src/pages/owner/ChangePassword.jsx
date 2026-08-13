import { useState } from 'react';
import AppLayout from '../../components/Layout/AppLayout';
import { ownerBottomNav, ownerNavItems } from '../../config/ownerNav';
import AlertMessage from '../../components/common/AlertMessage';
import { changePassword } from '../../services/authService';
import { ApiError } from '../../services/api';

export default function ChangePassword() {
  const [form, setForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setMessage('');
    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setSuccess('');

    const validationErrors = {};
    if (!form.current_password) validationErrors.current_password = 'Current password is required.';
    if (!form.new_password) validationErrors.new_password = 'New password is required.';
    else if (form.new_password.length < 6) validationErrors.new_password = 'Minimum 6 characters required.';
    if (!form.confirm_password) validationErrors.confirm_password = 'Please confirm new password.';
    else if (form.new_password !== form.confirm_password) {
      validationErrors.confirm_password = 'Passwords do not match.';
    }

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(form);
      setSuccess('Password changed successfully.');
      setForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      if (error instanceof ApiError) {
        setMessage(error.message);
        if (error.errors) setErrors(error.errors);
      } else {
        setMessage('Unable to change password. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout title="Change Password" navItems={ownerNavItems} bottomNavItems={ownerBottomNav}>
      <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-2 text-xl font-bold text-slate-900">Change Admin Password</h2>
        <p className="mb-5 text-sm text-slate-500">Update your owner login password.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="current_password" className="label-text">Current Password</label>
            <input
              id="current_password"
              name="current_password"
              type="password"
              autoComplete="current-password"
              className="input-field"
              value={form.current_password}
              onChange={handleChange}
            />
            {errors.current_password && <p className="mt-1 text-sm text-red-600">{errors.current_password}</p>}
          </div>

          <div>
            <label htmlFor="new_password" className="label-text">New Password</label>
            <input
              id="new_password"
              name="new_password"
              type="password"
              autoComplete="new-password"
              className="input-field"
              value={form.new_password}
              onChange={handleChange}
            />
            {errors.new_password && <p className="mt-1 text-sm text-red-600">{errors.new_password}</p>}
          </div>

          <div>
            <label htmlFor="confirm_password" className="label-text">Confirm New Password</label>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              autoComplete="new-password"
              className="input-field"
              value={form.confirm_password}
              onChange={handleChange}
            />
            {errors.confirm_password && <p className="mt-1 text-sm text-red-600">{errors.confirm_password}</p>}
          </div>

          {message && <AlertMessage message={message} />}
          {success && <AlertMessage type="success" message={success} />}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Saving...' : 'Change Password'}
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
