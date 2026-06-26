import React, { useState } from 'react';
import apiClient from '../api/axios';
import { Card, Button } from './SemaforoComponents.js';

export default function OnboardingView(): React.JSX.Element {
  const [birthdate, setBirthdate] = useState('');
  const [documentType, setDocumentType] = useState('DNI');
  const [documentNumber, setDocumentNumber] = useState('');
  const [mintraFile, setMintraFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Calculate age based on birthdate
  const getAge = (dateString: string): number => {
    if (!dateString) return 0;
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = getAge(birthdate);
  const isUnderage = birthdate !== '' && age < 14;
  const needsMintra = birthdate !== '' && age >= 14 && age <= 17;

  // Determine if form is submittable
  const isFormValid =
    birthdate !== '' &&
    !isUnderage &&
    documentNumber.trim().length >= 8 &&
    (!needsMintra || mintraFile !== null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setMintraFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || submitting) return;

    setSubmitting(true);
    setError('');

    try {
      // Simulate file upload or submit directly to API
      const payload = {
        documentType,
        documentNumber,
        birthdate,
        hasMintraPermission: needsMintra,
      };

      await apiClient.post('/api/v1/formalization/kyc', payload);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al enviar el formulario KYC. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Card className="bg-[#171923] border border-[#2D3748] shadow-2xl relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#3B82F6]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="border-b border-[#2D3748] pb-6 mb-6">
          <span className="text-[#3B82F6] uppercase text-[13px] tracking-[0.05em] font-mono font-bold block mb-1">
            🛡️ VALIDACIÓN LEGAL & ONBOARDING KYC
          </span>
          <h1 className="text-[32px] font-bold text-[#F7FAFC] tracking-tight">Estatus de Formalización</h1>
          <p className="text-[#A0AEC0] text-[16px] mt-2 leading-[1.6]">
            Completa tus datos de identidad para validar tu perfil laboral. Adolescentes de 14 a 17 años requieren la autorización de MINTRA.
          </p>
        </div>

        {success ? (
          <div
            data-testid="kyc-success-alert"
            className="p-6 bg-[#48BB78]/10 border border-[#48BB78]/30 rounded-xl text-[#48BB78] space-y-4 animate-fadeIn"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎉</span>
              <div>
                <h3 className="text-[18px] font-bold text-[#F7FAFC]">KYC Recibido Exitosamente</h3>
                <p className="text-xs text-[#A0AEC0] font-mono mt-1">Estatus: PENDIENTE DE APROBACIÓN</p>
              </div>
            </div>
            <p className="text-[14px] leading-[1.6] text-[#A0AEC0]">
              Tu documentación está siendo evaluada manualmente por el personal de fiscalización vial y MINTRA. Te notificaremos a la brevedad.
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                setSuccess(false);
                setBirthdate('');
                setDocumentNumber('');
                setMintraFile(null);
              }}
              className="mt-2"
            >
              Volver a empezar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-[#E53E3E]/10 text-[#E53E3E] text-xs rounded-xl border border-[#E53E3E]/20 font-medium">
                ⚠️ {error}
              </div>
            )}

            {/* Birthdate input */}
            <div>
              <label className="block text-[13px] font-bold text-[#A0AEC0] uppercase tracking-[0.05em] font-mono mb-2">
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                data-testid="input-birthdate"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                className="w-full bg-[#0F1117] border border-[#2D3748] rounded-xl px-4 py-3 text-sm text-[#F7FAFC] focus:ring-2 focus:ring-[#3B82F6] outline-none transition-all"
                required
              />
            </div>

            {/* Age Restriction Lock */}
            {isUnderage && (
              <div
                data-testid="error-age-restriction"
                className="p-5 bg-[#E53E3E]/10 border border-[#E53E3E]/30 text-[#E53E3E] rounded-xl space-y-2 animate-fadeIn"
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <span>🚫</span>
                  <span>Restricción de Edad Legal</span>
                </div>
                <p className="text-xs text-[#A0AEC0] leading-relaxed">
                  El sistema detecta que eres menor de 14 años de edad ({age} años). Según las leyes de protección de la niñez en Perú, está estrictamente prohibido el micro-empleo en vía pública para menores de 14 años.
                </p>
              </div>
            )}

            {/* Document Verification */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-[13px] font-bold text-[#A0AEC0] uppercase tracking-[0.05em] font-mono mb-2">
                  Tipo Documento
                </label>
                <select
                  data-testid="select-document-type"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full h-[46px] bg-[#0F1117] border border-[#2D3748] rounded-xl px-4 py-2.5 text-sm text-[#F7FAFC] focus:ring-2 focus:ring-[#3B82F6] outline-none transition-all"
                >
                  <option value="DNI">DNI (Perú)</option>
                  <option value="CE">C.E. (Extranjería)</option>
                  <option value="PASAPORTE">Pasaporte</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[13px] font-bold text-[#A0AEC0] uppercase tracking-[0.05em] font-mono mb-2">
                  Número de Documento
                </label>
                <input
                  type="text"
                  data-testid="input-document-number"
                  placeholder="Ingresa número de documento"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value.replace(/\D/g, ''))}
                  maxLength={12}
                  className="w-full bg-[#0F1117] border border-[#2D3748] rounded-xl px-4 py-3 text-sm text-[#F7FAFC] placeholder-slate-600 focus:ring-2 focus:ring-[#3B82F6] outline-none transition-all font-mono"
                  required
                />
              </div>
            </div>

            {/* MINTRA upload area for minors (14-17) */}
            {needsMintra && (
              <div
                data-testid="upload-mintra-pdf"
                className="p-5 border-2 border-dashed border-[#F6AD55]/40 bg-[#F6AD55]/5 rounded-xl space-y-3 animate-fadeIn"
              >
                <div className="flex items-center gap-2 text-[#F6AD55] font-bold text-sm">
                  <span>📄</span>
                  <span>Permiso de Trabajo MINTRA Requerido</span>
                </div>
                <p className="text-xs text-[#A0AEC0] leading-relaxed">
                  Tienes {age} años de edad. Los adolescentes entre 14 y 17 años requieren subir el permiso laboral oficial emitido por el Ministerio de Trabajo y Promoción del Empleo (MINTRA) para su formalización.
                </p>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-[#A0AEC0] file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#F6AD55] file:text-[#0F1117] hover:file:bg-[#f59e0b] file:cursor-pointer cursor-pointer"
                  required
                />
                {mintraFile && (
                  <p className="text-xs text-[#48BB78] font-semibold flex items-center gap-1">
                    <span>✓</span> Archivo seleccionado: {mintraFile.name}
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                data-testid="btn-submit-kyc"
                disabled={!isFormValid || submitting}
                className="w-full min-h-[44px]"
              >
                {submitting ? 'Enviando Datos...' : 'Enviar Solicitud KYC ⚡'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
