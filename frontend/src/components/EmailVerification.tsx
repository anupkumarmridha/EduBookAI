import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthService } from '../hooks/useServices';

export const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email...');
  const authService = useAuthService();

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification token');
        return;
      }

      try {
        await authService.verifyEmail(token);
        setStatus('success');
        setMessage('Email verified successfully!');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Error verifying email');
      }
    };

    verifyEmail();
  }, [searchParams, navigate, authService]);

  const getStatusColor = () => {
    switch (status) {
      case 'verifying':
        return 'bg-blue-100 border-blue-400 text-blue-700';
      case 'success':
        return 'bg-green-100 border-green-400 text-green-700';
      case 'error':
        return 'bg-red-100 border-red-400 text-red-700';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold">Email Verification</h2>
        </div>
        <div className={`border px-4 py-3 rounded ${getStatusColor()}`}>
          <p className="text-center">{message}</p>
        </div>
        {status === 'verifying' && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        )}
        {status !== 'verifying' && (
          <div className="text-center">
            <Link to="/login" className="text-indigo-600 hover:text-indigo-800">
              Back to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
