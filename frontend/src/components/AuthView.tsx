import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axios.js';
import { Card, Button } from './SemaforoComponents.js';
import {
  TrafficLightIcon,
  MailIcon,
  LockIcon,
  UserIcon,
  EyeIcon,
  EyeOffIcon,
  CheckIcon,
  ExclamationIcon,
} from './SemaforoIcons.js';

interface AuthViewProps {
  onAuthSuccess: (user: any) => void;
}

const ROLES = [
  { value: 'USER', label: 'Usuario / Cliente' },
  { value: 'WORKER', label: 'Trabajador Vial' },
  { value: 'EMPLOYER', label: 'Empleador / Car Wash' },
];

export default function AuthView({ onAuthSuccess }: AuthViewProps): React.JSX.Element {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'USER',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [serverSuccess, setServerSuccess] = useState('');

  const clearField = (field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    clearField(field);
    setServerError('');
  };

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePassword = (password: string) => {
    const checks = {
      length: password.length >= 8,
      lower: /[a-z]/.test(password),
      upper: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&_\-+#^()\[\]{}]/.test(password),
    };
    return checks;
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!validateEmail(form.email.trim())) {
      nextErrors.email = 'Ingresa un correo electrónico válido.';
    }

    const passChecks = validatePassword(form.password);
    if (!passChecks.length) nextErrors.password = 'Mínimo 8 caracteres.';
    else if (!passChecks.lower || !passChecks.upper || !passChecks.number || !passChecks.special) {
      nextErrors.password = 'Debe incluir mayúscula, minúscula, número y carácter especial.';
    }

    if (!isLogin) {
      if (form.name.trim().length < 2) {
        nextErrors.name = 'Ingresa tu nombre completo.';
      }
      if (form.password !== form.confirmPassword) {
        nextErrors.confirmPassword = 'Las contraseñas no coinciden.';
      }
      if (!ROLES.some((r) => r.value === form.role)) {
        nextErrors.role = 'Selecciona un rol válido.';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    setServerSuccess('');

    if (!validate()) return;

    setLoading(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin
        ? { email: form.email.trim().toLowerCase(), password: form.password }
        : {
            name: form.name.trim(),
            email: form.email.trim().toLowerCase(),
            password: form.password,
            role: form.role,
          };

      const { data } = await apiClient.post(endpoint, payload);

      if (data?.status === 'success' && data?.data) {
        const { accessToken, user } = data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('user', JSON.stringify(user));
        setServerSuccess(isLogin ? '¡Bienvenido de vuelta a EnRuta!' : 'Cuenta creada exitosamente.');
        onAuthSuccess(user);
        setTimeout(() => navigate('/dashboard'), 800);
      } else {
        setServerError('Respuesta inesperada del servidor.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error de conexión.';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  const passwordChecks = validatePassword(form.password);

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-md">
        <Card className="relative overflow-hidden bg-[#171923] border border-[#2D3748] p-0">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#3B82F6]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="relative p-8 pb-6 text-center border-b border-[#2D3748]">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[#3B82F6] text-white shadow-lg mb-4">
              <TrafficLightIcon size="xl" />
            </div>
            <h1 className="text-2xl font-black text-[#F7FAFC] tracking-tight">
              {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h1>
            <p className="text-sm text-[#A0AEC0] mt-2">
              {isLogin
                ? 'Accede a tu ruta de formalización en EnRuta.'
                : 'Únete a la plataforma de micro-empleo formalizado.'}
            </p>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2 border-b border-[#2D3748]">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setErrors({});
                setServerError('');
                setServerSuccess('');
              }}
              className={`py-3.5 text-sm font-bold uppercase tracking-wider transition-all ${
                isLogin
                  ? 'text-[#3B82F6] border-b-2 border-[#3B82F6] bg-[#3B82F6]/5'
                  : 'text-[#A0AEC0] hover:text-[#F7FAFC]'
              }`}
            >
              Ingresar
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setErrors({});
                setServerError('');
                setServerSuccess('');
              }}
              className={`py-3.5 text-sm font-bold uppercase tracking-wider transition-all ${
                !isLogin
                  ? 'text-[#3B82F6] border-b-2 border-[#3B82F6] bg-[#3B82F6]/5'
                  : 'text-[#A0AEC0] hover:text-[#F7FAFC]'
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="relative p-8 space-y-5">
            {serverError && (
              <div className="p-3 bg-[#E53E3E]/10 border border-[#E53E3E]/30 text-[#E53E3E] rounded-xl text-xs font-semibold flex items-start gap-2">
                <ExclamationIcon size="sm" className="shrink-0 mt-0.5" />
                {serverError}
              </div>
            )}
            {serverSuccess && (
              <div className="p-3 bg-[#48BB78]/10 border border-[#48BB78]/30 text-[#48BB78] rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckIcon size="sm" />
                {serverSuccess}
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-[12px] font-bold text-[#A0AEC0] uppercase tracking-wider mb-1.5">
                  Nombre completo
                </label>
                <div className="relative">
                  <UserIcon size="sm" className="absolute left-4 top-3.5 text-[#A0AEC0]" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Ej. Ana Silva"
                    className="w-full bg-[#0F1117] border border-[#2D3748] rounded-xl pl-11 pr-4 py-3 text-sm text-[#F7FAFC] placeholder-slate-600 focus:ring-2 focus:ring-[#3B82F6] outline-none transition-all"
                  />
                </div>
                {errors.name && <p className="text-[11px] text-[#E53E3E] mt-1.5">{errors.name}</p>}
              </div>
            )}

            <div>
              <label className="block text-[12px] font-bold text-[#A0AEC0] uppercase tracking-wider mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <MailIcon size="sm" className="absolute left-4 top-3.5 text-[#A0AEC0]" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="correo@ejemplo.com"
                  autoComplete="email"
                  className="w-full bg-[#0F1117] border border-[#2D3748] rounded-xl pl-11 pr-4 py-3 text-sm text-[#F7FAFC] placeholder-slate-600 focus:ring-2 focus:ring-[#3B82F6] outline-none transition-all"
                />
              </div>
              {errors.email && <p className="text-[11px] text-[#E53E3E] mt-1.5">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#A0AEC0] uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <LockIcon size="sm" className="absolute left-4 top-3.5 text-[#A0AEC0]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="••••••••"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  className="w-full bg-[#0F1117] border border-[#2D3748] rounded-xl pl-11 pr-11 py-3 text-sm text-[#F7FAFC] placeholder-slate-600 focus:ring-2 focus:ring-[#3B82F6] outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-3 text-[#A0AEC0] hover:text-[#F7FAFC]"
                >
                  {showPassword ? <EyeOffIcon size="sm" /> : <EyeIcon size="sm" />}
                </button>
              </div>
              {errors.password && <p className="text-[11px] text-[#E53E3E] mt-1.5">{errors.password}</p>}

              {!isLogin && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    { key: 'length', label: '8+ caracteres' },
                    { key: 'upper', label: 'Mayúscula' },
                    { key: 'lower', label: 'Minúscula' },
                    { key: 'number', label: 'Número' },
                    { key: 'special', label: 'Carácter especial' },
                  ].map(({ key, label }) => (
                    <div
                      key={key}
                      className={`flex items-center gap-1.5 text-[10px] font-semibold ${
                        (passwordChecks as any)[key] ? 'text-[#48BB78]' : 'text-[#A0AEC0]'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          (passwordChecks as any)[key] ? 'bg-[#48BB78]' : 'bg-[#2D3748]'
                        }`}
                      />
                      {label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="block text-[12px] font-bold text-[#A0AEC0] uppercase tracking-wider mb-1.5">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <LockIcon size="sm" className="absolute left-4 top-3.5 text-[#A0AEC0]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="w-full bg-[#0F1117] border border-[#2D3748] rounded-xl pl-11 pr-4 py-3 text-sm text-[#F7FAFC] placeholder-slate-600 focus:ring-2 focus:ring-[#3B82F6] outline-none transition-all"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-[11px] text-[#E53E3E] mt-1.5">{errors.confirmPassword}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#A0AEC0] uppercase tracking-wider mb-1.5">
                    Tipo de cuenta
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => handleChange('role', e.target.value)}
                    className="w-full h-[46px] bg-[#0F1117] border border-[#2D3748] rounded-xl px-4 py-2.5 text-sm text-[#F7FAFC] focus:ring-2 focus:ring-[#3B82F6] outline-none transition-all"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] text-[15px] mt-2"
            >
              {loading ? (isLogin ? 'Ingresando...' : 'Creando cuenta...') : isLogin ? 'Ingresar' : 'Crear cuenta'}
            </Button>

            <p className="text-center text-[11px] text-[#A0AEC0] pt-2">
              {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                  setServerError('');
                  setServerSuccess('');
                }}
                className="text-[#3B82F6] font-bold hover:underline"
              >
                {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
              </button>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
