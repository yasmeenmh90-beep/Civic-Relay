import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Sparkles, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/my-issues';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      toast.success('Welcome back!', 'Successfully signed in to CivicRelay.');
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
      toast.error('Authentication Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickCitizen = () => {
    setEmail('sarah.jenkins@example.com');
    setPassword('citizen1234');
  };

  const handleQuickStaff = () => {
    setEmail('marcus.vance@citygov.org');
    setPassword('staff1234');
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 text-left shadow-soft-lg border-border">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 mx-auto flex items-center justify-center text-neon-cyan mb-3 shadow-soft">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              Sign In to CivicRelay
            </h1>
            <p className="text-xs text-foreground-secondary mt-1">
              Access your autonomous civic resolution cases
            </p>
          </div>

          {error && (
            <div className="p-3.5 mb-6 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-600 font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="sarah@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              variant="neon"
              size="lg"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full mt-2"
            >
              Sign In
            </Button>
          </form>

          {/* Demo Login Shortcuts for Hackathon Evaluation */}
          <div className="mt-6 pt-5 border-t border-border space-y-2">
            <span className="text-[10px] uppercase font-bold text-foreground-muted tracking-wider block text-center">
              Quick Demo Accounts
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleQuickCitizen}
                className="p-2 text-xs rounded-xl bg-surface-raised hover:bg-surface-elevated border border-border font-medium text-foreground flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-neon-cyan" />
                Citizen Demo
              </button>
              <button
                type="button"
                onClick={handleQuickStaff}
                className="p-2 text-xs rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 font-medium text-purple-700 dark:text-purple-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                Staff Demo
              </button>
            </div>
          </div>

          <div className="text-center mt-6 text-xs text-foreground-secondary">
            Don't have an account?{' '}
            <Link to="/signup" className="font-bold text-cyan-700 hover:underline">
              Create account
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
