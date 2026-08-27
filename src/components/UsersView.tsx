import { useEffect, useState, useCallback } from 'react';
import { UserPlus, Shield, X, Check, Ban, Pencil, Users as UsersIcon, Mail, Lock, User as UserIcon } from 'lucide-react';
import { useAuth, type Role } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Button, Card } from '@/components/ui';
import { DataGrid, type Column } from '@/components/DataGrid';
import { FilterBar } from '@/components/FilterBar';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

interface StaffRow {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

interface RoleInfo {
  id: Role;
  label: string;
  description: string;
  permissions: string[];
}

interface PermissionInfo {
  id: string;
  label: string;
  category: string;
}

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  cashier: 'Cashier',
};

const ROLE_BADGE: Record<Role, string> = {
  admin: 'bg-blue-100 text-blue-700',
  manager: 'bg-emerald-100 text-emerald-700',
  cashier: 'bg-stone-100 text-stone-600',
};

export function UsersView() {
  const { user, refreshProfile } = useAuth();
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [permissions, setPermissions] = useState<PermissionInfo[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffRow | null>(null);
  const [showPerms, setShowPerms] = useState(false);

  const fetchStaff = useCallback(async () => {
    const { data, error } = await supabase
      .from('staff_profiles')
      .select('id, email, full_name, role, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) return;
    setStaff((data ?? []) as StaffRow[]);
  }, []);

  const fetchRolesAndPerms = useCallback(async () => {
    const [rolesRes, permsRes, rolePermsRes] = await Promise.all([
      supabase.from('roles').select('id, label, description, sort_order').order('sort_order'),
      supabase.from('permissions').select('id, label, category').order('category'),
      supabase.from('role_permissions').select('role_id, permission_id'),
    ]);

    if (rolesRes.error || permsRes.error || rolePermsRes.error) return;

    const rolePermsMap = new Map<string, string[]>();
    (rolePermsRes.data ?? []).forEach((rp: { role_id: string; permission_id: string }) => {
      const arr = rolePermsMap.get(rp.role_id) ?? [];
      arr.push(rp.permission_id);
      rolePermsMap.set(rp.role_id, arr);
    });

    setRoles(
      (rolesRes.data ?? []).map((r: { id: string; label: string; description: string }) => ({
        id: r.id as Role,
        label: r.label,
        description: r.description,
        permissions: rolePermsMap.get(r.id) ?? [],
      })),
    );
    setPermissions(permsRes.data ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      await Promise.all([fetchStaff(), fetchRolesAndPerms()]);
      setLoading(false);
    })();
  }, [fetchStaff, fetchRolesAndPerms]);

  const filtered = staff.filter(
    (s) =>
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()),
  );

  const handleChangeRole = async (targetId: string, newRole: Role) => {
    const { error } = await supabase.rpc('update_staff_role', {
      target_user_id: targetId,
      new_role: newRole,
    });
    if (error) return;
    await fetchStaff();
    if (targetId === user?.id) await refreshProfile();
    setEditingUser(null);
  };

  const handleToggleActive = async (targetId: string, newActive: boolean) => {
    const { error } = await supabase.rpc('toggle_staff_active', {
      target_user_id: targetId,
      new_active: newActive,
    });
    if (error) return;
    await fetchStaff();
  };

  const columns: Column<StaffRow>[] = [
    {
      key: 'name',
      header: 'Staff Member',
      render: (s) => (
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold',
            s.role === 'admin' ? 'bg-blue-100 text-blue-700' : s.role === 'manager' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600',
          )}>
            {s.full_name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-stone-900">
              {s.full_name}
              {s.id === user?.id && <span className="ml-2 text-xs text-stone-400">(you)</span>}
            </p>
            <p className="text-xs text-stone-400">{s.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (s) => (
        <span className={cn('rounded-lg px-2.5 py-1 text-xs font-medium', ROLE_BADGE[s.role])}>
          {ROLE_LABEL[s.role]}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => (
        <span className={cn(
          'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium',
          s.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600',
        )}>
          {s.is_active ? <Check size={12} /> : <Ban size={12} />}
          {s.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      render: (s) => <span className="text-xs text-stone-400">{formatDate(new Date(s.created_at).getTime())}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (s) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setEditingUser(s); }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-900"
            title="Change role"
          >
            <Pencil size={15} />
          </button>
          {s.id !== user?.id && (
            <button
              onClick={(e) => { e.stopPropagation(); handleToggleActive(s.id, !s.is_active); }}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg transition',
                s.is_active
                  ? 'text-stone-400 hover:bg-red-50 hover:text-red-500'
                  : 'text-stone-400 hover:bg-emerald-50 hover:text-emerald-600',
              )}
              title={s.is_active ? 'Deactivate' : 'Activate'}
            >
              {s.is_active ? <Ban size={15} /> : <Check size={15} />}
            </button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-stone-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-stone-900" />
      </div>
    );
  }

  const activeCount = staff.filter((s) => s.is_active).length;
  const adminCount = staff.filter((s) => s.role === 'admin').length;

  return (
    <div className="h-full overflow-y-auto bg-stone-50 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">User Management</h1>
          <p className="text-sm text-stone-500">{staff.length} staff · {activeCount} active · {adminCount} admin{adminCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPerms(true)}>
            <Shield size={16} /> Permissions
          </Button>
          <Button onClick={() => setShowInvite(true)}>
            <UserPlus size={18} /> Invite Staff
          </Button>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-4">
        {roles.map((r) => {
          const count = staff.filter((s) => s.role === r.id).length;
          return (
            <Card key={r.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-400">{r.label}</p>
                  <p className="mt-1 text-xl font-bold text-stone-900">{count}</p>
                </div>
                <div className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-xl',
                  r.id === 'admin' ? 'bg-blue-50 text-blue-600' : r.id === 'manager' ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-500',
                )}>
                  <UsersIcon size={18} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search staff by name or email..."
      />

      <DataGrid
        columns={columns}
        rows={filtered}
        rowKey={(s) => s.id}
        emptyMessage="No staff members found"
      />

      {showInvite && (
        <InviteModal onClose={() => setShowInvite(false)} onCreated={fetchStaff} />
      )}

      {editingUser && (
        <EditRoleModal
          staff={editingUser}
          roles={roles}
          onClose={() => setEditingUser(null)}
          onSave={(newRole) => handleChangeRole(editingUser.id, newRole)}
        />
      )}

      {showPerms && (
        <PermissionsModal
          roles={roles}
          permissions={permissions}
          onClose={() => setShowPerms(false)}
        />
      )}
    </div>
  );
}

// ---------- Invite Modal ----------

function InviteModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('cashier');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!fullName.trim() || !email.trim() || password.length < 6) {
      setError('Fill all fields. Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }
    if (!data.user) {
      setError('Failed to create account.');
      setLoading(false);
      return;
    }

    const { error: rpcError } = await supabase.rpc('create_staff_profile', {
      p_email: email.trim().toLowerCase(),
      p_full_name: fullName.trim(),
      p_role: role,
    });
    if (rpcError) {
      setError(rpcError.message);
      setLoading(false);
      return;
    }

    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm" onClick={onClose}>
      <Card className="w-[460px] max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus size={20} className="text-stone-400" />
            <h3 className="text-lg font-bold text-stone-900">Invite Staff Member</h3>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-900">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">Full Name</label>
            <div className="relative">
              <UserIcon size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Jordan Smith"
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 pl-10 text-sm outline-none focus:border-stone-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">Email</label>
            <div className="relative">
              <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="newstaff@minimart.mm"
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 pl-10 text-sm outline-none focus:border-stone-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">Temporary Password</label>
            <div className="relative">
              <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 pl-10 text-sm outline-none focus:border-stone-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">Role</label>
            <div className="space-y-2">
              {([
                { id: 'cashier' as Role, label: 'Cashier', desc: 'Checkout and returns only' },
                { id: 'manager' as Role, label: 'Manager', desc: 'Products, reports, returns' },
                { id: 'admin' as Role, label: 'Administrator', desc: 'Full access including user management' },
              ]).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition',
                    role === r.id
                      ? 'border-stone-900 bg-stone-50'
                      : 'border-stone-200 hover:border-stone-300',
                  )}
                >
                  <div>
                    <p className="text-sm font-semibold text-stone-900">{r.label}</p>
                    <p className="text-xs text-stone-400">{r.desc}</p>
                  </div>
                  {role === r.id && <Check size={18} className="text-stone-900" />}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{error}</div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        </form>

        <p className="mt-4 text-center text-xs text-stone-400">
          The new staff member can sign in with this email and password.
          {!user && ' You are creating this as an admin.'}
        </p>
      </Card>
    </div>
  );
}

// ---------- Edit Role Modal ----------

function EditRoleModal({
  staff,
  roles,
  onClose,
  onSave,
}: {
  staff: StaffRow;
  roles: RoleInfo[];
  onClose: () => void;
  onSave: (role: Role) => void;
}) {
  const [selectedRole, setSelectedRole] = useState<Role>(staff.role);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm" onClick={onClose}>
      <Card className="w-[400px] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-stone-900">Change Role</h3>
            <p className="text-sm text-stone-500">{staff.full_name}</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-900">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-2">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRole(r.id)}
              className={cn(
                'flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition',
                selectedRole === r.id
                  ? 'border-stone-900 bg-stone-50'
                  : 'border-stone-200 hover:border-stone-300',
              )}
            >
              <div>
                <p className="text-sm font-semibold text-stone-900">{r.label}</p>
                <p className="text-xs text-stone-400">{r.description}</p>
              </div>
              {selectedRole === r.id && <Check size={18} className="text-stone-900" />}
            </button>
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={() => onSave(selectedRole)} className="flex-1">Save Role</Button>
        </div>
      </Card>
    </div>
  );
}

// ---------- Permissions Matrix Modal ----------

function PermissionsModal({
  roles,
  permissions,
  onClose,
}: {
  roles: RoleInfo[];
  permissions: PermissionInfo[];
  onClose: () => void;
}) {
  const categories = [...new Set(permissions.map((p) => p.category))].sort();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm" onClick={onClose}>
      <Card className="w-[640px] max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-stone-400" />
            <h3 className="text-lg font-bold text-stone-900">Permission Matrix</h3>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-900">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-stone-200">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/60">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-400">
                  Permission
                </th>
                {roles.map((r) => (
                  <th key={r.id} className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-stone-400">
                    {r.label}
                  </th>
                ))}
              </tr>
            </thead>
            {categories.map((cat) => (
              <tbody key={`cat-${cat}`}>
                <tr className="border-b border-stone-100 bg-stone-50/30">
                  <td colSpan={roles.length + 1} className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-stone-500">
                    {cat}
                  </td>
                </tr>
                {permissions.filter((p) => p.category === cat).map((p) => (
                  <tr key={p.id} className="border-b border-stone-50">
                    <td className="px-4 py-2.5 text-sm font-medium text-stone-700">{p.label}</td>
                    {roles.map((r) => (
                      <td key={r.id} className="px-3 py-2.5 text-center">
                        {r.permissions.includes(p.id) ? (
                          <Check size={16} className="mx-auto text-emerald-500" />
                        ) : (
                          <X size={16} className="mx-auto text-stone-300" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>

        <p className="mt-4 text-center text-xs text-stone-400">
          Permissions are assigned per role. Admins always have all permissions.
        </p>

        <Button onClick={onClose} className="mt-5 w-full">Close</Button>
      </Card>
    </div>
  );
}
