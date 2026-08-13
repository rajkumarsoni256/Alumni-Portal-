import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export const ForgotPasswordPage = () => {
  const { sendForgotPasswordLink } = useApp();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await sendForgotPasswordLink(email);
      setIsSuccess(true);
    } catch (err) {
      setError(err.message || 'Unable to process password reset. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/75 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
        
        {!isSuccess ? (
          <>
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6" />
              </div>

              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Forgot your password?
              </h1>
              
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Enter the email address associated with your JECRC Community account to receive a password reset link.
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="leading-snug">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Email address
                </label>
                <input
                  type="email"
                  autoFocus
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="name@jecrc.edu.in or personal email"
                  autoComplete="email"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-md px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full py-2.5 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-2xs"
              >
                {isLoading ? (
                  <span>Sending Reset Link...</span>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Footer Back Link */}
            <div className="pt-2 border-t border-slate-100 text-center">
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </>
        ) : (
          /* Success Screen */
          <div className="text-center space-y-4 py-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">Check your email</h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                If an account exists for <strong className="text-slate-800">{email}</strong>, we've sent instructions to reset your password.
              </p>
            </div>

            <div className="pt-3 space-y-2">
              <Link
                to="/reset-password"
                className="w-full py-2.5 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors block text-center shadow-2xs"
              >
                Proceed to Reset Password (Demo)
              </Link>

              <Link
                to="/login"
                className="w-full py-2 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 block text-center"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
