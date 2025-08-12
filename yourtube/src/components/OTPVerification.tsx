import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import axiosInstance from '../lib/axiosinstance';
import { toast } from 'sonner';

interface OTPVerificationProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  otpMethod: 'email' | 'mobile';
  onVerificationSuccess: (user: any, token?: string) => void;
}

const OTPVerification: React.FC<OTPVerificationProps> = ({
  isOpen,
  onClose,
  email,
  otpMethod,
  onVerificationSuccess
}) => {
  const [otp, setOtp] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const verifyOTP = async () => {
    if (!otp.trim()) {
      toast.error('Please enter the OTP');
      return;
    }

    if (otpMethod === 'mobile' && !mobile.trim()) {
      toast.error('Please enter your mobile number');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post('/user/verify-otp', {
        email,
        otp,
        mobile: otpMethod === 'mobile' ? mobile : undefined
      });

      if (response.data.success) {
        toast.success('OTP verified successfully!');
        onVerificationSuccess(response.data.result, response.data.token);
        onClose();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    setResendLoading(true);
    try {
      const response = await axiosInstance.post('/user/resend-otp', {
        email,
        otpMethod,
        mobile: otpMethod === 'mobile' ? mobile : undefined
      });

      if (response.data.success) {
        toast.success('OTP sent successfully!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      verifyOTP();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>OTP Verification</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              We've sent a 6-digit OTP to your {otpMethod === 'email' ? 'email' : 'mobile number'}
            </p>
            <p className="font-medium mt-1">
              {otpMethod === 'email' ? email : '***-***-****'}
            </p>
          </div>

          {otpMethod === 'mobile' && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Mobile Number
              </label>
              <Input
                type="tel"
                placeholder="Enter your mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Enter OTP
            </label>
            <Input
              type="text"
              placeholder="6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyPress={handleKeyPress}
              className="text-center text-lg tracking-widest"
              maxLength={6}
            />
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={verifyOTP}
              disabled={loading || !otp || (otpMethod === 'mobile' && !mobile)}
              className="flex-1"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </Button>
            
            <Button
              variant="outline"
              onClick={resendOTP}
              disabled={resendLoading}
              className="flex-1"
            >
              {resendLoading ? 'Sending...' : 'Resend OTP'}
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500">
            Didn't receive the OTP? Check your spam folder or try resending.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OTPVerification;
