// User Registration Component - Missing MVP Feature
import React, { useState } from 'react';
import { apiClient } from '../services/api';

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const UserRegistration: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterFormData> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Note: This would need a backend endpoint for registration
      // Currently only admin panel can create users
      await apiClient.createUser({
        username: formData.username,
        email: formData.email,
        isActive: true,
      });

      setSuccess(true);
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      setErrors({ email: error.message || 'Registration failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof RegisterFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (success) {
    return (
      <div className="card max-w-md mx-auto">
        <div className="card-body text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-xl font-semibold mb-2">Registration Successful!</h2>
          <p className="text-muted mb-4">
            Your account has been created. You can now log in to start chatting.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="btn btn-primary"
          >
            Create Another Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card max-w-md mx-auto">
      <div className="card-header">
        <h2 className="text-xl font-semibold">Create Account</h2>
      </div>

      <form onSubmit={handleSubmit} className="card-body">
        <div className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={handleChange('username')}
              className={`input w-full ${errors.username ? 'border-danger' : ''}`}
              placeholder="Enter your username"
              disabled={isLoading}
            />
            {errors.username && (
              <p className="text-danger text-sm mt-1">{errors.username}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              className={`input w-full ${errors.email ? 'border-danger' : ''}`}
              placeholder="Enter your email"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-danger text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={handleChange('password')}
              className={`input w-full ${errors.password ? 'border-danger' : ''}`}
              placeholder="Enter your password"
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-danger text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium mb-2">Confirm Password</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              className={`input w-full ${errors.confirmPassword ? 'border-danger' : ''}`}
              placeholder="Confirm your password"
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="text-danger text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary w-full mt-6"
        >
          {isLoading ? (
            <>
              <div className="loading-spinner mr-2"></div>
              Creating Account...
            </>
          ) : (
            'Create Account'
          )}
        </button>

        <p className="text-center text-sm text-muted mt-4">
          Already have an account?{' '}
          <button type="button" className="text-primary hover:underline">
            Sign in
          </button>
        </p>
      </form>
    </div>
  );
};

export default UserRegistration;
