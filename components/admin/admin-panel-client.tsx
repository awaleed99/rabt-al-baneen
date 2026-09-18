'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Shield, User, ToggleLeft, ToggleRight, Trash2, Edit, X } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar-custom'
import { Badge } from '@/components/ui/badge-custom'
import { Button } from '@/components/ui/button-custom'
import { Input } from '@/components/ui/input-custom'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { createUser, updateProfile, toggleUserActive, deleteUser } from '@/lib/actions/users'
import { formatDate } from '@/lib/utils'
import type { Profile, UserRole } from '@/lib/types'
import { useLanguage } from '@/lib/i18n/context'

interface AdminPanelClientProps {
  profiles: Profile[]
  currentUserId: string
}

export function AdminPanelClient({ profiles: initial, currentUserId }: AdminPanelClientProps) {
  const { t, language } = useLanguage()
  const [profiles, setProfiles] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [createError, setCreateError] = useState('')

  const [newUser, setNewUser] = useState({ full_name: '', email: '', password: '', role: 'user' as UserRole })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError('')
    startTransition(async () => {
      const result = await createUser({ ...newUser, is_active: true })
      if (!result.success) { setCreateError(result.error ?? ''); return }
      toast.success(language === 'ar' ? `تم إنشاء حساب ${newUser.full_name} بنجاح!` : `User ${newUser.full_name} created!`)
      setShowCreateModal(false)
      setNewUser({ full_name: '', email: '', password: '', role: 'user' })
      window.location.reload()
    })
  }

  async function handleToggleActive(id: string, current: boolean) {
    if (id === currentUserId) {
      toast.error(language === 'ar' ? 'لا يمكنك تعطيل حسابك الخاص.' : "You can't deactivate your own account.")
      return
    }
    startTransition(async () => {
      const result = await toggleUserActive(id, !current)
      if (!result.success) { toast.error(result.error); return }
      toast.success(current
        ? (language === 'ar' ? 'تم تعطيل الحساب.' : 'User deactivated.')
        : (language === 'ar' ? 'تم تنشيط الحساب.' : 'User activated.')
      )
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p))
    })
  }

  async function handleRoleChange(id: string, role: UserRole) {
    if (id === currentUserId) {
      toast.error(language === 'ar' ? 'لا يمكنك تغيير صلاحيتك بنفسك.' : "You can't change your own role.")
      return
    }
    startTransition(async () => {
      const result = await updateProfile(id, { role })
      if (!result.success) { toast.error(result.error); return }
      toast.success(language === 'ar' ? 'تم تحديث الدور بنجاح.' : 'Role updated.')
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, role } : p))
      setEditingId(null)
    })
  }

  async function handleDelete(id: string) {
    if (id === currentUserId) {
      toast.error(language === 'ar' ? 'لا يمكنك حذف حسابك الخاص.' : "You can't delete your own account.")
      return
    }
    startTransition(async () => {
      const result = await deleteUser(id)
      if (!result.success) { toast.error(result.error); return }
      toast.success(language === 'ar' ? 'تم حذف المستخدم بنجاح.' : 'User deleted.')
      setProfiles(prev => prev.filter(p => p.id !== id))
      setDeleteTarget(null)
    })
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
            <Shield className="w-7 h-7 text-primary" />
            <span>{t('admin_title')}</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {profiles.length} {language === 'ar' ? 'مستخدمين مسجلين' : 'registered users'}
          </p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
          {t('add_new_user')}
        </Button>
      </div>

      {/* Users Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-start">
                <th className="text-start px-6 py-3.5 font-semibold text-muted-foreground">{t('col_user')}</th>
                <th className="text-start px-6 py-3.5 font-semibold text-muted-foreground hidden sm:table-cell">{t('col_created')}</th>
                <th className="text-start px-6 py-3.5 font-semibold text-muted-foreground">{t('col_role')}</th>
                <th className="text-start px-6 py-3.5 font-semibold text-muted-foreground">{t('col_status')}</th>
                <th className="text-end px-6 py-3.5 font-semibold text-muted-foreground">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {profiles.map(p => (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={p.full_name} size="sm" />
                      <div>
                        <p className="font-semibold text-foreground">{p.full_name}</p>
                        <p className="text-xs text-muted-foreground" dir="ltr">{p.email}</p>
                      </div>
                      {p.id === currentUserId && (
                        <Badge variant="default" className="ms-2">
                          {language === 'ar' ? 'أنت' : 'You'}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground hidden sm:table-cell">
                    {formatDate(p.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === p.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          className="text-xs border border-input rounded-lg px-2.5 py-1 bg-card text-foreground"
                          defaultValue={p.role}
                          onChange={e => handleRoleChange(p.id, e.target.value as UserRole)}
                        >
                          <option value="user">{t('role_user')}</option>
                          <option value="admin">{t('role_admin')}</option>
                        </select>
                        <button type="button" onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge variant={p.role === 'admin' ? 'default' : 'outline'}>
                          {p.role === 'admin' ? <Shield className="w-3 h-3 me-1" /> : <User className="w-3 h-3 me-1" />}
                          {p.role === 'admin' ? t('role_admin') : t('role_user')}
                        </Badge>
                        {p.id !== currentUserId && (
                          <button
                            type="button"
                            onClick={() => setEditingId(p.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors p-1"
                            title={t('edit')}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(p.id, p.is_active)}
                      disabled={p.id === currentUserId || isPending}
                      className="flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={p.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {p.is_active ? (
                        <>
                          <ToggleRight className="w-5 h-5 text-emerald-500" />
                          <Badge variant="success">{t('status_active')}</Badge>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                          <Badge variant="danger">{t('status_inactive')}</Badge>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-end">
                    {p.id !== currentUserId && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(p.id)}
                        disabled={isPending}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-lg hover:bg-destructive/10"
                        aria-label={`Delete ${p.full_name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-7 animate-slide-up">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 end-4 text-muted-foreground hover:text-foreground p-1"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-xl font-bold text-foreground mb-5">{t('add_new_user')}</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label={t('full_name_label')}
                id="new-name"
                value={newUser.full_name}
                required
                onChange={e => setNewUser(p => ({ ...p, full_name: e.target.value }))}
              />
              <Input
                label={t('email')}
                id="new-email"
                type="email"
                dir="ltr"
                value={newUser.email}
                required
                onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))}
              />
              <Input
                label={t('password')}
                id="new-password"
                type="password"
                dir="ltr"
                value={newUser.password}
                required
                onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))}
              />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{t('col_role')}</label>
                <select
                  className="w-full text-sm border border-input rounded-xl px-3.5 py-2.5 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  value={newUser.role}
                  onChange={e => setNewUser(p => ({ ...p, role: e.target.value as UserRole }))}
                >
                  <option value="user">{t('role_user')}</option>
                  <option value="admin">{t('role_admin')}</option>
                </select>
              </div>
              {createError && <p className="text-sm text-destructive">{createError}</p>}
              <div className="flex gap-3 justify-end pt-3 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                  {t('cancel')}
                </Button>
                <Button type="submit" isLoading={isPending}>
                  {t('create')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget) }}
        title={t('delete_user_confirm')}
        description={language === 'ar'
          ? 'سيتم حذف حساب هذا المستخدم نهائياً مع الاحتفاظ بسجلات الزيارات التي قام بتسجيلها مسبقاً.'
          : 'This will permanently delete this user account. Their visit records will remain. This cannot be undone.'}
        confirmLabel={t('delete')}
        isLoading={isPending}
      />
    </div>
  )
}
