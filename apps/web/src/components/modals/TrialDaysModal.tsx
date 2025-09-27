'use client'

import { useState, useEffect } from 'react'
import { Clock, Plus, Minus, Calendar, Save, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface TrialDaysModalProps {
  user: {
    id: string
    email: string
    firstName?: string
    lastName?: string
    tenantName?: string
    trialStartDate?: string
    trialEndDate?: string
    extraTrialDays: number
  }
  onClose: () => void
  onSave: (userId: string, days: number, action: 'add' | 'subtract' | 'set') => void
  loading?: boolean
}

export function TrialDaysModal({ 
  user,
  onClose, 
  onSave,
  loading = false
}: TrialDaysModalProps) {
  const [days, setDays] = useState(0)
  const [action, setAction] = useState<'add' | 'subtract' | 'set'>('add')
  
  const fullName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.email

  // Mevcut deneme süresini hesapla
  const getCurrentTrialDays = () => {
    if (!user.trialStartDate || !user.trialEndDate) return null
    const startDate = new Date(user.trialStartDate)
    const endDate = new Date(user.trialEndDate)
    const diffTime = endDate.getTime() - startDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Kalan günleri hesapla
  const getRemainingDays = () => {
    if (!user.trialEndDate) return null
    const endDate = new Date(user.trialEndDate)
    const now = new Date()
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const currentTotalDays = getCurrentTrialDays()
  const remainingDays = getRemainingDays()

  // Yeni bitiş tarihini hesapla
  const calculateNewEndDate = () => {
    if (!user.trialEndDate) return null
    const currentEndDate = new Date(user.trialEndDate)
    const newEndDate = new Date(currentEndDate)
    
    switch (action) {
      case 'add':
        newEndDate.setDate(currentEndDate.getDate() + days)
        break
      case 'subtract':
        newEndDate.setDate(currentEndDate.getDate() - days)
        break
      case 'set':
        const originalStartDate = new Date(user.trialStartDate!)
        const newEndDateFromStart = new Date(originalStartDate)
        newEndDateFromStart.setDate(originalStartDate.getDate() + 15 + days)
        return newEndDateFromStart
      default:
        return currentEndDate
    }
    return newEndDate
  }

  const handleSave = () => {
    if (days > 0 || action === 'set') {
      onSave(user.id, days, action)
    }
  }

  const handlePresetClick = (presetDays: number, presetAction: 'add' | 'subtract') => {
    setDays(presetDays)
    setAction(presetAction)
  }

  const newEndDate = calculateNewEndDate()

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold">{fullName}</DialogTitle>
              <DialogDescription className="text-xs">
                {user.tenantName || 'Şirket bilgisi yok'}
              </DialogDescription>
            </div>
            <Badge 
              variant={remainingDays !== null && remainingDays > 0
                ? remainingDays <= 3 
                  ? 'destructive'
                  : 'default'
                : 'destructive'
              }
            >
              {remainingDays !== null ? (
                remainingDays > 0 ? `${remainingDays} gün` : 'Süresi doldu'
              ) : 'Deneme süresi yok'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-xl font-bold text-green-600">{currentTotalDays || 0}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Toplam</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-xl font-bold text-orange-600">{user.extraTrialDays}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Ek</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-xl font-bold text-blue-600">
                  {remainingDays !== null ? Math.max(0, remainingDays) : 0}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Kalan</div>
              </CardContent>
            </Card>
          </div>

          {/* Action Type Buttons */}
          <div>
            <div className="flex gap-2">
              {[
                { key: 'add', label: 'Ekle', icon: Plus },
                { key: 'subtract', label: 'Azalt', icon: Minus },
                { key: 'set', label: 'Ayarla', icon: Calendar }
              ].map(({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  onClick={() => setAction(key as any)}
                  variant={action === key ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                >
                  <Icon className="w-3 h-3 mr-1" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[1, 3, 7, 14].map((presetDays) => (
                <Button
                  key={presetDays}
                  onClick={() => setDays(presetDays)}
                  variant={days === presetDays ? "default" : "outline"}
                  size="sm"
                >
                  {presetDays}G
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[30, 60, 90, 365].map((presetDays) => (
                <Button
                  key={presetDays}
                  onClick={() => setDays(presetDays)}
                  variant={days === presetDays ? "default" : "outline"}
                  size="sm"
                >
                  {presetDays === 30 ? '1A' : presetDays === 60 ? '2A' : presetDays === 90 ? '3A' : '1Y'}
                </Button>
              ))}
            </div>
          </div>

          {/* Manual Input */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setDays(Math.max(0, days - 1))}
              disabled={days <= 0}
              variant="outline"
              size="sm"
            >
              <Minus className="w-3 h-3" />
            </Button>
            <Input
              type="number"
              value={days.toString()}
              onChange={(e) => setDays(Math.max(0, parseInt(e.target.value) || 0))}
              min="0"
              max="365"
              className="text-center text-lg font-bold"
            />
            <Button
              onClick={() => setDays(Math.min(365, days + 1))}
              variant="outline"
              size="sm"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              İptal
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || days === 0}
            >
              {loading ? (
                <>
                  <div className="w-3 h-3 mr-1 border border-white border-t-transparent rounded-full animate-spin" />
                  Uygula
                </>
              ) : (
                <>
                  <Save className="w-3 h-3 mr-1" />
                  Uygula
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
