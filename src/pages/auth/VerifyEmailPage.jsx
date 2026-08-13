import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Mail, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';

export const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const { pendingRegistration, verifyUserEmail, resendVerificationCode } = useApp();

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(30);

  const inputRefs = useRef([]);

  // Resend timer countdown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleDigitChange = (index, value) => {
    // Only accept numeric
    const cleanVal = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleanVal;
    setDigits(newDigits);
    setErrorMessage('');

    // Auto-advance to next input
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...digits];
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i];
    }
    setDigits(newDigits);

    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const fullCode = digits.join('');
    if (fullCode.length !== 6) {
      setErrorMessage('Please enter all 6 digits of your verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      await verifyUserEmail(fullCode);
      navigate('/onboarding');
    } catch (err) {
      setErrorMessage(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    if (resendCooldown > 0) return;
    resendVerificationCode();
    setResendCooldown(30);
  };

  const handleFillTestCode = () => {
    setDigits(['1', '2', '3', '4', '5', '6']);
    setErrorMessage('');
  };

  const emailDisplay = pendingRegistration?.email || 'student@jecrc.edu.in';

  return (
    <div className="min-h-screen bg-slate-100/75 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
        
        {/* Top Icon & Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center justify-center mx-auto">
            <Mail className="w-6 h-6" />
          </div>

          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Verify your email
          </h1>
          
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            We've sent a 6-digit confirmation code to <strong className="text-slate-800">{emailDisplay}</strong>.
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="leading-snug">{errorMessage}</p>
          </div>
        )}

        {/* 6-Digit OTP Inputs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                autoFocus={idx === 0}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                className="w-12 h-12 text-center text-lg font-bold text-slate-900 bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-lg focus:outline-none transition-colors"
              />
            ))}
          </div>

          {/* Development quick helper */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>Demo code: 123456</span>
            <button
              type="button"
              onClick={handleFillTestCode}
              className="text-red-700 font-semibold hover:underline cursor-pointer"
            >
              Auto-fill code
            </button>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleVerify}
            disabled={isLoading || digits.join('').length !== 6}
            className="w-full py-2.5 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-2xs"
          >
            {isLoading ? (
              <span>Verifying Code...</span>
            ) : (
              <>
                <span>Verify & Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          {/* Resend Code with Cooldown */}
          <div className="text-center text-xs text-slate-500">
            Didn't receive the code?{' '}
            {resendCooldown > 0 ? (
              <span className="text-slate-400 font-medium">
                Resend in {resendCooldown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-red-700 font-semibold hover:underline cursor-pointer"
              >
                Resend code
              </button>
            )}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <Link
            to="/register"
            className="text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Change email</span>
          </Link>

          <Link
            to="/login"
            className="text-red-700 font-semibold hover:underline"
          >
            Back to Sign In
          </Link>
        </div>

      </div>
    </div>
  );
};
