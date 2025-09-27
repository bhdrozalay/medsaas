'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Loader2, Building2, Mail, Calendar } from 'lucide-react'
import Modal from '../ui/Modal'

interface UserApprovalModalProps {
  user: {
    id: string
    email: string
    firstName?: string
    lastName?: string
    phone?: string
    tenantName?: string
    createdAt: string
    tenant?: {
      name: string
      slug: string
    }
  }
  onClose: () => void
  onApprove: () => void
  onReject: (reason?: string) => void
  loading?: boolean
}

export function UserApprovalModal({ 
  user,
  onClose, 
  onApprove,
  onReject,
  loading = false
}: UserApprovalModalProps) {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)
  const [note, setNote] = useState('')

  const fullName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.email

  const handleApprove = () => {
    setAction('approve')
    onApprove()
  }

  const handleReject = () => {
    setAction('reject')
    onReject(note.trim() || undefined)
  }

  const handleClose = () => {
    setAction(null)
    setNote('')
    onClose()
  }

  return (
    <Modal
      isOpen={true}
      onClose={handleClose}
      title="Kullanıcı Onayı"
      size="md"
      showCloseButton={!loading}
    >
      <div className="p-4">
        {/* User Info - Compact */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-medium">
                {user.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-medium text-gray-900 truncate">
                {fullName}
              </h3>
              <div className="flex items-center space-x-4 text-xs text-gray-600 mt-1">
                <span className="flex items-center">
                  <Mail className="h-3 w-3 mr-1" />
                  {user.email}
                </span>
                {(user.tenantName || user.tenant?.name) && (
                  <span className="flex items-center">
                    <Building2 className="h-3 w-3 mr-1" />
                    {user.tenantName || user.tenant?.name}
                  </span>
                )}
                <span className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Note/Reason Input - Compact */}
        <div className="mb-4">
          <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
            Not/Açıklama
          </label>
          <textarea
            id="note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Kararınız hakkında kısa bir açıklama..."
            disabled={loading}
          />
        </div>

        {/* Decision Impact - Minimal */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center mb-1">
              <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm font-medium text-green-800">Onayla</span>
            </div>
            <p className="text-xs text-green-700">Sisteme erişim sağlanır</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center mb-1">
              <XCircle className="h-4 w-4 text-red-600 mr-1" />
              <span className="text-sm font-medium text-red-800">Reddet</span>
            </div>
            <p className="text-xs text-red-700">Hesap engellenir</p>
          </div>
        </div>

        {/* Actions - Compact */}
        <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            İptal
          </button>
          <button
            onClick={handleReject}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 bg-red-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading && action === 'reject' ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4 mr-1" />
            )}
            Reddet
          </button>
          <button
            onClick={handleApprove}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 bg-green-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading && action === 'approve' ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-1" />
            )}
            Onayla
          </button>
        </div>
      </div>
    </Modal>
  )
}