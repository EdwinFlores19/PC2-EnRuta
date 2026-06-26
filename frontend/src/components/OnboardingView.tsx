import React, { useState } from 'react';
import apiClient from '../api/axios';
import { Card, Button } from './SemaforoComponents.js';
import { ShieldIcon, ShieldCheckIcon, ExclamationIcon, UploadIcon, LockIcon, CheckIcon, SparklesIcon } from './SemaforoIcons.js';

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
    <div className="max-w-3xl mx-auto py-8 md:py-12 px-4 sm:px-6">
      <Card className="bg-[#171923] border border-[#2D3748] shadow-2xl relative overflow-hidden p-6 md:p-10">
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#3B82F6]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="border-b border-[#2D3748] pb-8 mb-8">
          <span className="text-[#3B82F6] uppercase text-[11px] tracking-[0.1em] font-mono font-bold inline-flex items-center gap-1.5 mb-2">
            <ShieldIcon size="sm" /> VALIDACIÓN LEGAL & ONBOARDING KYC
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-[#F7FAFC] tracking-tight">Estatus de Formalización</h1>
          <p className="text-[#A0AEC0] text-base mt-3 leading-relaxed">
            Completa tus datos de identidad para validar tu perfil laboral. Adolescentes de 14 a 17 años requieren la autorización de MINTRA.
          </p>
        </div>

        {success ? (
          <div
            data-testid="kyc-success-alert"
            className="p-8 bg-[#48BB78]/10 border border-[#48BB78]/30 rounded-2xl text-[#48BB78] space-y-5 animate-fadeIn"
          >
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-[#48BB78]/10 text-[#48BB78] shrink-0">
                <ShieldCheckIcon size="2xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#F7FAFC]">KYC Recibido Exitosamente</h3>
                <p className="text-xs text-[#A0AEC0] font-mono mt-1">Estatus: PENDIENTE DE APROBACIÓN</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-[#A0AEC0]">
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
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="p-4 bg-[#E53E3E]/10 text-[#E53E3E] text-sm rounded-xl border border-[#E53E3E]/20 font-medium flex items-center gap-2">
                <ExclamationIcon size="sm" /> {error}
              </div>
            )}

            {/* Step 1: Birthdate */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-wider text-[#A0AEC0]">
                <span className="h-5 w-5 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] flex items-center justify-center text-[10px]">1</span>
                Verificación de Edad
              </div>
              <label className="block text-[13px] font-bold text-[#A0AEC0] uppercase tracking-[0.05em] font-mono">
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                data-testid="input-birthdate"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                className="w-full bg-[#0F1117] border border-[#2D3748] rounded-xl px-4 py-3.5 text-sm text-[#F7FAFC] focus:ring-2 focus:ring-[#3B82F6] outline-none transition-all"
                required
              />
            </div>

            {/* Age Restriction Lock */}
            {isUnderage && (
              <div
                data-testid="error-age-restriction"
                className="p-6 bg-[#E53E3E]/10 border border-[#E53E3E]/30 text-[#E53E3E] rounded-xl space-y-3 animate-fadeIn"
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <LockIcon size="sm" />
                  <span>Restricción de Edad Legal</span>
                </div>
                <p className="text-xs text-[#A0AEC0] leading-relaxed">
                  El sistema detecta que eres menor de 14 años de edad ({age} años). Según las leyes de protección de la niñez en Perú, está estrictamente prohibido el micro-empleo en vía pública para menores de 14 años.
                </p>
              </div>
            )}

            {/* Step 2: Document Verification */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-wider text-[#A0AEC0]">
                <span className="h-5 w-5 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] flex items-center justify-center text-[10px]">2</span>
                Identidad Oficial
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-[13px] font-bold text-[#A0AEC0] uppercase tracking-[0.05em] font-mono mb-2">
                    Tipo Documento
                  </label>
                  <select
                    data-testid="select-document-type"
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full h-[50px] bg-[#0F1117] border border-[#2D3748] rounded-xl px-4 py-2.5 text-sm text-[#F7FAFC] focus:ring-2 focus:ring-[#3B82F6] outline-none transition-all"
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
                    className="w-full bg-[#0F1117] border border-[#2D3748] rounded-xl px-4 py-3.5 text-sm text-[#F7FAFC] placeholder-slate-600 focus:ring-2 focus:ring-[#3B82F6] outline-none transition-all font-mono"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Step 3: MINTRA upload area for minors (14-17) */}
            {needsMintra && (
              <div className="space-y-3 animate-fadeIn">
                <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-wider text-[#A0AEC0]">
                  <span className="h-5 w-5 rounded-full bg-[#F6AD55]/10 text-[#F6AD55] flex items-center justify-center text-[10px]">3</span>
                  Autorización Adolescente
                </div>
                <div className="p-6 border-2 border-dashed border-[#F6AD55]/40 bg-[#F6AD55]/5 rounded-xl space-y-4">
                  <div className="flex items-center gap-2 text-[#F6AD55] font-bold text-sm">
                    <UploadIcon size="sm" />
                    <span>Permiso de Trabajo MINTRA Requerido</span>
                  </div>
                  <p className="text-xs text-[#A0AEC0] leading-relaxed">
                    Tienes {age} años de edad. Los adolescentes entre 14 y 17 años requieren subir el permiso laboral oficial emitido por el Ministerio de Trabajo y Promoción del Empleo (MINTRA) para su formalización.
                  </p>
                  <input
                    type="file"
                    data-testid="upload-mintra-pdf"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-[#A0AEC0] file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#F6AD55] file:text-[#0F1117] hover:file:bg-[#f59e0b] file:cursor-pointer cursor-pointer"
                    required
                  />
                  {mintraFile && (
                    <p className="text-xs text-[#48BB78] font-semibold flex items-center gap-1">
                      <CheckIcon size="xs" /> Archivo seleccionado: {mintraFile.name}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                data-testid="btn-submit-kyc"
                disabled={!isFormValid || submitting}
                className="w-full min-h-[48px]"
              >
                {submitting ? 'Enviando Datos...' : <><SparklesIcon size="sm" className="inline" /> Enviar Solicitud KYC</>}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
