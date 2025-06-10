import React, { useEffect, useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LanguageContext } from '../../context/LanguageContext';
import { supabase } from '../../services/supabase';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
import { Alert, AlertTitle, AlertDescription } from './alert';
import { Avatar, AvatarFallback } from './avatar';
import { Separator } from './separator';

const translations = {
  es: {
    title: 'Configuración de Perfil',
    personalInfo: 'Información Personal',
    security: 'Seguridad',
    dangerZone: 'Zona Peligrosa',
    phoneLabel: 'Número de teléfono',
    phoneHelper: 'Ingresa tu número sin el código de país (+502)',
    phonePlaceholder: '1234 5678',
    emailLabel: 'Correo electrónico',
    emailHelper: 'Se enviará un correo de confirmación a la nueva dirección',
    currentPassword: 'Contraseña actual',
    newPassword: 'Nueva contraseña',
    confirmPassword: 'Confirmar nueva contraseña',
    passwordHelper: 'La nueva contraseña debe tener al menos 6 caracteres',
    saveButton: 'Guardar Cambios',
    saving: 'Guardando...',
    updateEmail: 'Actualizar Correo',
    changePassword: 'Cambiar Contraseña',
    deleteAccount: 'Eliminar Cuenta',
    deleteWarning: 'Esta acción eliminará permanentemente tu cuenta y todos tus datos. No se puede deshacer.',
    successMessage: 'Cambios guardados correctamente',
    errorMessage: 'Error al guardar los cambios',
    passwordsNoMatch: 'Las contraseñas no coinciden',
    passwordTooShort: 'La contraseña debe tener al menos 6 caracteres',
    backButton: 'Regresar'
  },
  en: {
    title: 'Profile Settings',
    personalInfo: 'Personal Information',
    security: 'Security',
    dangerZone: 'Danger Zone',
    phoneLabel: 'Phone number',
    phoneHelper: 'Enter your number without country code (+502)',
    phonePlaceholder: '1234 5678',
    emailLabel: 'Email address',
    emailHelper: 'A confirmation email will be sent to the new address',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm new password',
    passwordHelper: 'New password must be at least 6 characters',
    saveButton: 'Save Changes',
    saving: 'Saving...',
    updateEmail: 'Update Email',
    changePassword: 'Change Password',
    deleteAccount: 'Delete Account',
    deleteWarning: 'This action will permanently delete your account and all your data. This cannot be undone.',
    successMessage: 'Changes saved successfully',
    errorMessage: 'Error saving changes',
    passwordsNoMatch: 'Passwords do not match',
    passwordTooShort: 'Password must be at least 6 characters',
    backButton: 'Back'
  }
};

const DesignProfileSettings: React.FC = () => {
  const { user } = useAuth();
  const { language } = useContext(LanguageContext);
  const navigate = useNavigate();
  const t = translations[language];

  // Form states
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('personal');

  // Extract phone number without +502 prefix
  const extractPhoneNumber = (fullPhone: string) => {
    if (!fullPhone) return '';
    if (fullPhone.startsWith('+502')) {
      return fullPhone.replace('+502', '').trim();
    }
    if (fullPhone.startsWith('502')) {
      return fullPhone.replace('502', '').trim();
    }
    return fullPhone;
  };

  // Format phone number with spaces
  const formatPhoneNumber = (number: string) => {
    const cleanNumber = number.replace(/[^\d]/g, '');
    return cleanNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  // Load user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setLoading(true);
      setError('');
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', user.id)
          .single();
          
        if (error) {
          setError(t.errorMessage);
        } else if (data && data.phone) {
          const phoneNumber = extractPhoneNumber(data.phone);
          setPhone(phoneNumber);
        }
      } catch (err) {
        setError(t.errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, t.errorMessage]);

  // Handle phone number change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleanValue = value.replace(/[^\d\s]/g, '');
    if (cleanValue.replace(/\s/g, '').length <= 8) {
      setPhone(formatPhoneNumber(cleanValue));
    }
  };

  // Handle phone save
  const handlePhoneSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const cleanPhone = phone.replace(/[^\d]/g, '');
    if (cleanPhone.length !== 8) {
      setError('El número debe tener 8 dígitos');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const fullPhone = `+502${cleanPhone}`;
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, phone: fullPhone });

      if (error) {
        setError(t.errorMessage);
      } else {
        setSuccess(t.successMessage);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(t.errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle email update
  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.auth.updateUser({
        email: email
      });

      if (error) {
        setError(`No se pudo actualizar el correo electrónico: ${error.message}`);
      } else {
        setSuccess('Se ha enviado un correo de confirmación a tu nueva dirección. Verifica tu email para completar el cambio.');
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err: any) {
      setError('No se pudo actualizar el correo electrónico');
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || newPassword !== confirmPassword) return;

    if (newPassword.length < 6) {
      setError(t.passwordTooShort);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setError(`No se pudo cambiar la contraseña: ${error.message}`);
      } else {
        setSuccess('Contraseña actualizada correctamente');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError('No se pudo cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!user) return;

    const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.');
    if (!confirmDelete) return;

    const confirmFinal = window.confirm('ÚLTIMA OPORTUNIDAD: ¿Realmente deseas eliminar permanentemente tu cuenta y todos tus datos?');
    if (!confirmFinal) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Delete related data first
      await supabase.from('codex_items').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('id', user.id);
      
      const { error } = await supabase.rpc('delete_user');

      if (error) {
        setError('Para eliminar tu cuenta, contacta al soporte. Tu perfil y datos han sido eliminados, pero la cuenta de acceso requiere eliminación manual.');
      } else {
        setSuccess('Cuenta eliminada correctamente');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    } catch (err: any) {
      setError(`No se pudo eliminar la cuenta: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email;
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="flex items-center space-x-2 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800"
          >
            <span>←</span>
            <span>{t.backButton}</span>
          </Button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16 border-4 border-white/20">
                <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-white">{t.title}</h1>
                <p className="text-blue-100">
                  {user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="personal" className="flex items-center space-x-2">
                  <span>👤</span>
                  <span>{t.personalInfo}</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center space-x-2">
                  <span>🔒</span>
                  <span>{t.security}</span>
                </TabsTrigger>
                <TabsTrigger value="danger" className="flex items-center space-x-2">
                  <span>⚠️</span>
                  <span>{t.dangerZone}</span>
                </TabsTrigger>
              </TabsList>

              {/* Personal Information Tab */}
              <TabsContent value="personal" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Phone Section */}
                  <div className="space-y-4 p-6 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                      <span>📱</span>
                      <span>{t.phoneLabel}</span>
                    </h3>
                    <form onSubmit={handlePhoneSave} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">{t.phoneLabel}</Label>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                            <span className="text-lg">🇬🇹</span>
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">+502</span>
                          </div>
                          <Input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={handlePhoneChange}
                            placeholder={t.phonePlaceholder}
                            disabled={loading}
                            className="flex-1"
                          />
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{t.phoneHelper}</p>
                        {phone && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              Número completo: <strong>+502 {phone}</strong>
                            </p>
                          </div>
                        )}
                      </div>
                      <Button 
                        type="submit" 
                        disabled={loading || !phone}
                        className="w-full"
                      >
                        {loading ? t.saving : t.saveButton}
                      </Button>
                    </form>
                  </div>
                </motion.div>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Email Section */}
                  <div className="space-y-4 p-6 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                      <span>✉️</span>
                      <span>{t.emailLabel}</span>
                    </h3>
                    <form onSubmit={handleEmailUpdate} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">{t.emailLabel}</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={loading}
                        />
                        <p className="text-sm text-slate-600 dark:text-slate-400">{t.emailHelper}</p>
                      </div>
                      <Button 
                        type="submit" 
                        disabled={loading || !email || email === user?.email}
                        className="w-full"
                        variant="outline"
                      >
                        {loading ? t.saving : t.updateEmail}
                      </Button>
                    </form>
                  </div>

                  <Separator />

                  {/* Password Section */}
                  <div className="space-y-4 p-6 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                      <span>🔐</span>
                      <span>Cambiar Contraseña</span>
                    </h3>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">{t.currentPassword}</Label>
                        <Input
                          id="current-password"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">{t.newPassword}</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          disabled={loading}
                        />
                        <p className="text-sm text-slate-600 dark:text-slate-400">{t.passwordHelper}</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">{t.confirmPassword}</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={loading}
                          className={confirmPassword !== '' && newPassword !== confirmPassword ? 'border-red-500' : ''}
                        />
                        {confirmPassword !== '' && newPassword !== confirmPassword && (
                          <p className="text-sm text-red-600">{t.passwordsNoMatch}</p>
                        )}
                      </div>
                      <Button 
                        type="submit" 
                        disabled={loading || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
                        className="w-full"
                        variant="outline"
                      >
                        {loading ? t.saving : t.changePassword}
                      </Button>
                    </form>
                  </div>
                </motion.div>
              </TabsContent>

              {/* Danger Zone Tab */}
              <TabsContent value="danger">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="p-6 border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-xl">
                    <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 flex items-center space-x-2 mb-4">
                      <span>⚠️</span>
                      <span>{t.dangerZone}</span>
                    </h3>
                    <p className="text-red-700 dark:text-red-300 mb-6">
                      {t.deleteWarning}
                    </p>
                    <Button 
                      onClick={handleDeleteAccount}
                      disabled={loading}
                      variant="destructive"
                      className="w-full"
                    >
                      {loading ? t.saving : t.deleteAccount}
                    </Button>
                  </div>
                </motion.div>
              </TabsContent>
            </Tabs>

            {/* Messages */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                  <AlertTitle className="text-green-800 dark:text-green-200">✅ Éxito</AlertTitle>
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    {success}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <Alert variant="destructive">
                  <AlertTitle>❌ Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DesignProfileSettings; 