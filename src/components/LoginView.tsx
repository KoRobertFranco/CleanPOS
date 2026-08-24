import { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, Store, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

export function LoginView() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const success = login(email, password);
      if (!success) {
        setError('Invalid email or password. Try the demo accounts below.');
      }
      setLoading(false);
    }, 400);
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('minimart123');
    setError('');
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
          <h2 className="mb-1 text-lg font-bold text-stone-900">Sign In</h2>
          <p className="mb-6 text-sm text-stone-500">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Email</label>
              <div className="relative">
                <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cashier@minimart.mm"
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
                  placeholder="Enter password"
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
                  Signing in...
                </span>
              ) : (
                <>
                  Sign In <ArrowRight size={18} />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 border-t border-stone-100 pt-5">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-stone-400">
              Demo Accounts
            </p>
            <div className="space-y-2">
              {[
                { email: 'cashier@minimart.mm', label: 'Cashier', name: 'Alex Morgan' },
                { email: 'admin@minimart.mm', label: 'Manager', name: 'Sarah Lee' },
              ].map((demo) => (
                <button
                  key={demo.email}
                  onClick={() => fillDemo(demo.email)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-2.5 text-left transition hover:border-stone-300 hover:bg-stone-50',
                  )}
                >
                  <div>
                    <p className="text-sm font-medium text-stone-900">{demo.label} — {demo.name}</p>
                    <p className="text-xs text-stone-400">{demo.email} · minimart123</p>
                  </div>
                  <span className="rounded-lg bg-stone-200 px-2.5 py-1 text-xs font-medium text-stone-600">
                    Use
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-stone-400">
          This is a demo. No real authentication is performed.
        </p>
      </div>
    </div>
  );
}
