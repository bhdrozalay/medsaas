'use client';

import { useState } from 'react';
import { 
  ShieldX, 
  Calendar, 
  FileText, 
  AlertTriangle, 
  Clock,
  User,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Modal from '../ui/Modal';

interface UserSuspensionModalProps {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role: string;
    status: string;
    createdAt: string;
    tenant?: {
      name: string;
      slug: string;
    };
  };
  onClose: () => void;
  onSuspend: (suspensionData: SuspensionData) => void;
  loading?: boolean;
}

interface SuspensionData {
  reason: string;
  durationType: 'temporary' | 'permanent';
  durationDays?: number;
  suspendedUntil?: string;
  canAppeal: boolean;
  appealDeadlineDays?: number;
}

export function UserSuspensionModal({ 
  user, 
  onClose, 
  onSuspend,
  loading = false 
}: UserSuspensionModalProps) {
  const [suspensionData, setSuspensionData] = useState<SuspensionData>({
    reason: '',
    durationType: 'temporary',
    durationDays: 7,
    canAppeal: true,
    appealDeadlineDays: 3
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const fullName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.email;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!suspensionData.reason.trim()) {
      newErrors.reason = 'Askıya alma nedeni gereklidir';
    } else if (suspensionData.reason.length < 10) {
      newErrors.reason = 'Askıya alma nedeni en az 10 karakter olmalıdır';
    }

    if (suspensionData.durationType === 'temporary') {
      if (!suspensionData.durationDays || suspensionData.durationDays < 1) {
        newErrors.durationDays = 'Askı süresi en az 1 gün olmalıdır';
      } else if (suspensionData.durationDays > 365) {
        newErrors.durationDays = 'Askı süresi en fazla 365 gün olabilir';
      }
    }

    if (suspensionData.canAppeal && suspensionData.appealDeadlineDays) {
      if (suspensionData.appealDeadlineDays < 1) {
        newErrors.appealDeadlineDays = 'İtiraz süresi en az 1 gün olmalıdır';
      } else if (suspensionData.appealDeadlineDays > 30) {
        newErrors.appealDeadlineDays = 'İtiraz süresi en fazla 30 gün olabilir';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const finalSuspensionData: SuspensionData = {
      ...suspensionData,
      suspendedUntil: suspensionData.durationType === 'temporary' && suspensionData.durationDays
        ? new Date(Date.now() + suspensionData.durationDays * 24 * 60 * 60 * 1000).toISOString()
        : undefined
    };

    onSuspend(finalSuspensionData);
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={handleClose}
      title="Kullanıcıyı Askıya Al"
      size="lg"
      showCloseButton={!loading}
    >
      <div className="p-6 max-h-[80vh] overflow-y-auto">
        {/* User Info */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
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
                  <User className="h-3 w-3 mr-1" />
                  {user.email}
                </span>
                <span>Rol: {user.role}</span>
                {user.tenant && (
                  <span>Kurum: {user.tenant.name}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Warning Alert */}
        <Alert className="mb-6 border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Dikkat:</strong> Bu kullanıcı askıya alındığında sistem erişimi tamamen kısıtlanacaktır.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          {/* Suspension Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Askıya Alma Nedeni *
            </label>
            <Textarea
              value={suspensionData.reason}
              onChange={(e) => setSuspensionData(prev => ({
                ...prev,
                reason: e.target.value
              }))}
              placeholder="Kullanıcının neden askıya alındığını detaylı bir şekilde açıklayın..."
              className="min-h-[100px]"
              disabled={loading}
            />
            {errors.reason && (
              <p className="text-sm text-red-600 mt-1">{errors.reason}</p>
            )}
          </div>

          {/* Duration Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Askı Türü *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                suspensionData.durationType === 'temporary' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  value="temporary"
                  checked={suspensionData.durationType === 'temporary'}
                  onChange={(e) => setSuspensionData(prev => ({
                    ...prev,
                    durationType: e.target.value as 'temporary' | 'permanent'
                  }))}
                  className="text-blue-600 focus:ring-blue-500"
                  disabled={loading}
                />
                <div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="font-medium text-gray-900">Geçici Askı</span>
                  </div>
                  <p className="text-sm text-gray-500">Belirli bir süre sonra otomatik olarak kaldırılır</p>
                </div>
              </label>

              <label className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                suspensionData.durationType === 'permanent' 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  value="permanent"
                  checked={suspensionData.durationType === 'permanent'}
                  onChange={(e) => setSuspensionData(prev => ({
                    ...prev,
                    durationType: e.target.value as 'temporary' | 'permanent'
                  }))}
                  className="text-red-600 focus:ring-red-500"
                  disabled={loading}
                />
                <div>
                  <div className="flex items-center">
                    <ShieldX className="h-4 w-4 text-red-600 mr-2" />
                    <span className="font-medium text-gray-900">Kalıcı Askı</span>
                  </div>
                  <p className="text-sm text-gray-500">Manuel olarak kaldırılana kadar devam eder</p>
                </div>
              </label>
            </div>
          </div>

          {/* Duration Days - Only for temporary suspension */}
          {suspensionData.durationType === 'temporary' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Askı Süresi (Gün) *
              </label>
              <Input
                type="number"
                min="1"
                max="365"
                value={suspensionData.durationDays || ''}
                onChange={(e) => setSuspensionData(prev => ({
                  ...prev,
                  durationDays: parseInt(e.target.value) || undefined
                }))}
                placeholder="Örn: 7"
                disabled={loading}
              />
              {errors.durationDays && (
                <p className="text-sm text-red-600 mt-1">{errors.durationDays}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Askı {suspensionData.durationDays || 0} gün sonra otomatik olarak kaldırılacaktır
              </p>
            </div>
          )}

          {/* Appeal Settings */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <input
                type="checkbox"
                id="canAppeal"
                checked={suspensionData.canAppeal}
                onChange={(e) => setSuspensionData(prev => ({
                  ...prev,
                  canAppeal: e.target.checked,
                  appealDeadlineDays: e.target.checked ? prev.appealDeadlineDays : undefined
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={loading}
              />
              <label htmlFor="canAppeal" className="text-sm font-medium text-gray-700">
                Kullanıcı itiraz edebilsin
              </label>
            </div>

            {suspensionData.canAppeal && (
              <div className="ml-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  İtiraz Süresi (Gün)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={suspensionData.appealDeadlineDays || ''}
                  onChange={(e) => setSuspensionData(prev => ({
                    ...prev,
                    appealDeadlineDays: parseInt(e.target.value) || undefined
                  }))}
                  placeholder="Örn: 3"
                  disabled={loading}
                />
                {errors.appealDeadlineDays && (
                  <p className="text-sm text-red-600 mt-1">{errors.appealDeadlineDays}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Kullanıcı {suspensionData.appealDeadlineDays || 0} gün boyunca itiraz edebilecektir
                </p>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Önizleme</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Askı Türü:</span>
                <Badge className={suspensionData.durationType === 'temporary' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}>
                  {suspensionData.durationType === 'temporary' ? 'Geçici' : 'Kalıcı'}
                </Badge>
              </div>
              {suspensionData.durationType === 'temporary' && suspensionData.durationDays && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Süre:</span>
                  <span className="font-medium">{suspensionData.durationDays} gün</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">İtiraz Hakkı:</span>
                <span className={`font-medium ${suspensionData.canAppeal ? 'text-green-600' : 'text-red-600'}`}>
                  {suspensionData.canAppeal ? 'Var' : 'Yok'}
                </span>
              </div>
              {suspensionData.canAppeal && suspensionData.appealDeadlineDays && (
                <div className="flex justify-between">
                  <span className="text-gray-600">İtiraz Süresi:</span>
                  <span className="font-medium">{suspensionData.appealDeadlineDays} gün</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
          <Button
            onClick={handleClose}
            disabled={loading}
            variant="outline"
          >
            İptal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !suspensionData.reason.trim()}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Askıya Alınıyor...
              </>
            ) : (
              <>
                <ShieldX className="h-4 w-4 mr-2" />
                Askıya Al
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}