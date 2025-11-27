'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

export default function SettingsPage() {
  const toast = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [smsCode, setSmsCode] = useState('');
  const [verifyingSMS, setVerifyingSMS] = useState(false);
  const [pendingPhoneNumber, setPendingPhoneNumber] = useState('');
  const [originalPhoneNumber, setOriginalPhoneNumber] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
    city: '',
    postalCode: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      const response = await api.getMe();
      const userData = response.user;
      setUser(userData);
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phoneNumber: userData.phoneNumber || '',
        address: userData.address || '',
        city: userData.city || '',
        postalCode: userData.postalCode || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setOriginalPhoneNumber(userData.phoneNumber || '');
    } catch (err: any) {
      console.error('User load error:', err);
      toast.showToast('Kullanıcı bilgileri yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if phone number changed
    if (formData.phoneNumber !== originalPhoneNumber && formData.phoneNumber) {
      setPendingPhoneNumber(formData.phoneNumber);
      setShowSMSModal(true);
      return;
    }

    await saveProfile();
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
      });
      
      setOriginalPhoneNumber(formData.phoneNumber);
      toast.showToast('Profil bilgileri güncellendi', 'success');
      await loadUser();
    } catch (err: any) {
      toast.showToast(err.message || 'Profil güncellenirken hata oluştu', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifySMS = async () => {
    if (!smsCode.trim()) {
      toast.showToast('SMS kodunu girin', 'warning');
      return;
    }

    setVerifyingSMS(true);
    try {
      const response = await api.verifySMSCode({
        code: smsCode,
        phoneNumber: pendingPhoneNumber,
      });

      if ((response as { verified?: boolean }).verified) {
        toast.showToast('SMS kodu doğrulandı', 'success');
        setShowSMSModal(false);
        setSmsCode('');
        await saveProfile();
      } else {
        toast.showToast('Geçersiz SMS kodu', 'error');
      }
    } catch (err: any) {
      toast.showToast(err.message || 'SMS doğrulanırken hata oluştu', 'error');
    } finally {
      setVerifyingSMS(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.showToast('Yeni şifreler eşleşmiyor', 'error');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.showToast('Şifre en az 6 karakter olmalı', 'error');
      return;
    }

    setSaving(true);
    try {
      await api.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      
      toast.showToast('Şifre başarıyla değiştirildi', 'success');
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      toast.showToast(err.message || 'Şifre değiştirilirken hata oluştu', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="card">Yükleniyor...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Ayarlar
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Hesap ayarlarınızı yönetin
          </p>
        </div>

        {/* Profile Settings */}
        <div className="card">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Profil Bilgileri
          </h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Ad
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Soyad
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="input"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                E-posta
              </label>
              <input
                type="email"
                value={formData.email}
                className="input"
                disabled
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                E-posta adresi değiştirilemez
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Telefon
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="input"
                placeholder="+90 555 123 4567"
              />
              {formData.phoneNumber !== originalPhoneNumber && formData.phoneNumber && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  ⚠️ Telefon numarası değişti. Kaydetmek için SMS doğrulaması gerekecek.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Adres
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="input"
                rows={3}
                placeholder="Adres bilgisi"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Şehir
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="input"
                  placeholder="İstanbul"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Posta Kodu
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="input"
                  placeholder="34000"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>

        {/* Password Settings */}
        <div className="card">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Şifre Değiştir
          </h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Mevcut Şifre
              </label>
              <input
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Yeni Şifre
              </label>
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="input"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Yeni Şifre (Tekrar)
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="input"
                required
                minLength={6}
              />
            </div>
            <div className="flex justify-end">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
              </button>
            </div>
          </form>
        </div>

        {/* Security Settings */}
        <div className="card">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Güvenlik
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  İki Faktörlü Doğrulama (2FA)
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Hesabınızı ekstra güvenlik katmanı ile koruyun
                </p>
              </div>
              <button className="btn-secondary text-sm">
                {user?.mfaEnabled ? 'Devre Dışı Bırak' : 'Etkinleştir'}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Oturum Yönetimi
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Aktif oturumlarınızı görüntüleyin ve yönetin
                </p>
              </div>
              <button className="btn-secondary text-sm">
                Yönet
              </button>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="card">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Bildirimler
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  E-posta Bildirimleri
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  İşlem ve güvenlik bildirimlerini e-posta ile alın
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  SMS Bildirimleri
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Önemli işlemler için SMS bildirimi alın
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* SMS Verification Modal */}
        {showSMSModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                SMS Doğrulama
              </h2>

              <div className="space-y-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">
                    📱 SMS Kodu Gönderildi
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>{pendingPhoneNumber}</strong> numarasına gönderilen SMS kodunu girin.
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    Test için: <strong>1234</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    SMS Kodu
                  </label>
                  <input
                    type="text"
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="1234"
                    className="input w-full text-center text-2xl font-mono tracking-widest"
                    maxLength={4}
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setShowSMSModal(false);
                    setSmsCode('');
                    setPendingPhoneNumber('');
                    setFormData({ ...formData, phoneNumber: originalPhoneNumber });
                  }}
                  className="flex-1 btn-secondary"
                  disabled={verifyingSMS}
                >
                  İptal
                </button>
                <button
                  onClick={handleVerifySMS}
                  className="flex-1 btn-primary"
                  disabled={!smsCode || smsCode.length !== 4 || verifyingSMS}
                >
                  {verifyingSMS ? 'Doğrulanıyor...' : 'Doğrula'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
