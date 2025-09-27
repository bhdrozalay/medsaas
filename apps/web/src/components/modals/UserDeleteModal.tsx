'use client'

import { useState } from 'react'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import Modal from '../ui/Modal'

interface UserDeleteModalProps {
  user: {
    id: string
    email: string
    firstName?: string
    lastName?: string
    tenantName?: string
    role?: string
  }
  onClose: () => void
  onConfirm: () => void
  loading?: boolean
}

export function UserDeleteModal({ 
  user,
  onClose, 
  onConfirm,
  loading = false
}: UserDeleteModalProps) {
  const [confirmText, setConfirmText] = useState('')
  
  const expectedConfirmText = 'SİL'
  const isConfirmValid = confirmText === expectedConfirmText

  const fullName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.email

  const handleDelete = () => {
    if (!isConfirmValid) return
    onConfirm()
  }

  const handleClose = () => {
    setConfirmText('')
    onClose()
  }

  return (
    <Modal
      isOpen={true}
      onClose={handleClose}
      title="Kullanıcıyı Sil"
      size="md"
      showCloseButton={!loading}
    >
      <div className="p-6">
        {/* Warning Icon */}
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>

        {/* Warning Message */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Bu işlem geri alınamaz!
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            <strong>{fullName}</strong> kullanıcısını kalıcı olarak silmek üzeresiniz.
          </p>
          {user.tenantName && (
            <p className="text-sm text-gray-600 mb-4">
              Kurum: <strong>{user.tenantName}</strong>
            </p>
          )}
        </div>

        {/* User Info */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {fullName}
              </p>
              <p className="text-sm text-gray-600 truncate">
                {user.email}
              </p>
              {user.tenantName && (
                <p className="text-xs text-gray-500 mt-1">
                  {user.tenantName}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Confirmation Input */}
        <div className="mb-6">
          <label htmlFor="confirmText" className="block text-sm font-medium text-gray-700 mb-2">
            Silme işlemini onaylamak için <strong>"{expectedConfirmText}"</strong> yazın:
          </label>
          <input
            type="text"
            id="confirmText"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
            placeholder={expectedConfirmText}
            disabled={loading}
          />
        </div>

        {/* Consequences Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Bu işlem sonucunda:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Kullanıcının tüm verileri silinecek</li>
            <li>• Kullanıcının erişimi kalıcı olarak kaldırılacak</li>
            <li>• Bu işlem geri alınamayacak</li>
            <li>• İlişkili veriler de etkilenebilir</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            İptal
          </button>
          <button
            onClick={handleDelete}
            disabled={loading || !isConfirmValid}
            className="inline-flex items-center px-4 py-2 bg-red-600 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Siliniyor...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Kullanıcıyı Sil
              </>
            )}
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Bu işlem sistem yöneticisi tarafından loglanacaktır
          </p>
        </div>
      </div>
    </Modal>
  )
}