import { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, Store, ArrowRight, User as UserIcon, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

type Mode = 'signin' | 'signup';

export function LoginView() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signin') {
      const { error: err } = await signIn(email, password);
      if (err) setError(err);
    } else {
      if (!fullName.trim()) {
        setError('Please enter your full name');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }
      const { error: err } = await signUp(email, password, fullName);
      if (err) setError(err);
    }
    setLoading(false);
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setError('');
    setPassword('');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-stone-100 via-stone-50 to-amber-50/40 px-4">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-900 text-white shadow-lg">
            <Store size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">MiniMart</h1>
          <p className="mt-1 text-sm text-stone-500">Point of Sale System</p>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-white p-7 shadow-xl shadow-stone-200/40">
          <div className="mb-6 inline-flex w-full rounded-xl bg-stone-100 p-1">
            <button
              onClick={() => switchMode('signin')}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition',
                mode === 'signin' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700',
              )}
            >
              <LogIn size={16} /> Sign In
            </button>
            <button
              onClick={() => switchMode('signup')}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition',
                mode === 'signup' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700',
              )}
            >
              <UserPlus size={16} /> Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">Full Name</label>
                <div className="relative">
                  <UserIcon size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-4 text-sm text-stone-900 outline-none transition focus:border-stone-900 focus:bg-white"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Email</label>
              <div className="relative">
                <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@minimart.mm"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-4 text-sm text-stone-900 outline-none transition focus:border-stone-900 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Password</label>
              <div className="relative">
                <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter password'}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-10 text-sm text-stone-900 outline-none transition focus:border-stone-900 focus:bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 transition hover:text-stone-600"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                <>
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={18} />
                </>
              )}
            </Button>
          </form>

          {mode === 'signin' && (
            <div className="mt-6 border-t border-stone-100 pt-5">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-stone-400">
                Demo Accounts
              </p>
              <div className="space-y-2">
                {[
                  { email: 'admin@minimart.mm', label: 'Administrator', name: 'Sarah Lee', color: 'bg-blue-100 text-blue-700' },
                  { email: 'manager@minimart.mm', label: 'Manager', name: 'Jordan Park', color: 'bg-emerald-100 text-emerald-700' },
                  { email: 'cashier@minimart.mm', label: 'Cashier', name: 'Alex Morgan', color: 'bg-stone-100 text-stone-600' },
                ].map((demo) => (
                  <button
                    key={demo.email}
                    onClick={() => { setEmail(demo.email); setPassword('minimart123'); setError(''); }}
                    className="flex w-full items-center justify-between rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-2.5 text-left transition hover:border-stone-300 hover:bg-stone-50"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={cn('rounded-lg px-2 py-0.5 text-xs font-medium', demo.color)}>
                        {demo.label}
                      </span>
                      <p className="text-sm font-medium text-stone-900">{demo.name}</p>
                    </div>
                    <span className="text-xs text-stone-400">minimart123</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <p className="mt-5 text-center text-xs text-stone-400">
              New accounts start as Cashier. An administrator can promote you to Manager or Admin later.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
