import React, { useState } from 'react';
import apiClient from '../api/axios';
import SemiChatbot from './SemiChatbot';

interface ParsedProfile {
  formalTitle: string;
  summary: string;
  location: string;
  parsedData: {
    skills: Array<{ name: string; category: string }>;
    experiences: Array<{
      rawInformalText: string;
      formalRole: string;
      duration: string;
      formalResponsibilities: string[];
    }>;
  };
}

export default function CandidateView(): React.JSX.Element {
  // Estado para el Parser de CV
  const [rawText, setRawText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [profile, setProfile] = useState<ParsedProfile | null>(null);
  const [parseError, setParseError] = useState('');

  // Manejar Parseo de CV
  const handleParseCV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;

    setParsing(true);
    setParseError('');
    setProfile(null);

    try {
      const { data } = await apiClient.post('/ai/cv/parse', { rawText });
      if (data?.status === 'success') {
        setProfile(data.data);
      } else {
        setParseError('No se pudo estructurar el perfil. Intenta de nuevo.');
      }
    } catch (err: any) {
      setParseError(err.response?.data?.message || 'Error de conexión al procesar el CV.');
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* SECCIÓN DE TÍTULO */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 md:p-8 text-white shadow-md">
        <h1 className="text-3xl font-extrabold tracking-tight">Portal del Trabajador & Coach Virtual</h1>
        <p className="mt-2 text-blue-100 max-w-2xl text-sm md:text-base">
          Formaliza tu experiencia de trabajo informal en segundos y aprende a gestionar tu platita de forma inteligente con nuestro tutor financiero de IA.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* PARTE IZQUIERDA: MOTOR DE PARSEO DE CV */}
        <div className="bg-[#0f121d] border border-gray-800 rounded-3xl p-6 flex flex-col justify-between shadow-lg">
          <div>
            <div className="border-b border-gray-800 pb-3 mb-4">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                📝 Motor NLP: Estandariza tu CV Informal
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Escribe a qué te dedicabas (ej. limpieza de casas, cobrador, ayudante) y la IA creará tu perfil formal.
              </p>
            </div>

            <form onSubmit={handleParseCV} className="space-y-4">
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Escribe aquí tu experiencia informal, ej: 'Hola, trabajé 2 años vendiendo comida en la calle, llevaba las cuentas del dinero diario y compraba los insumos en el mercado del distrito. También sé atender amablemente a la gente.'"
                className="w-full h-32 bg-[#161a26] border border-gray-800 text-slate-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                required
              />

              <button
                type="submit"
                disabled={parsing || !rawText.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 disabled:bg-blue-300 disabled:opacity-50 select-none"
              >
                {parsing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Procesando con Inteligencia Artificial...
                  </>
                ) : (
                  'Estandarizar Mi Experiencia con IA'
                )}
              </button>
            </form>

            {parseError && (
              <div className="mt-4 p-3 bg-red-950/40 border border-red-800 text-red-400 text-xs rounded-xl">
                {parseError}
              </div>
            )}

            {/* PERFIL GENERADO EN VIVO */}
            {profile && (
              <div className="mt-6 space-y-4 border-2 border-emerald-900 bg-emerald-950/20 rounded-2xl p-5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-800/30 text-xs px-2.5 py-1 rounded-full font-bold">
                    ✨ Perfil Formalizado por IA
                  </span>
                  <span className="text-xs text-slate-400">{profile.location}</span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-100">{profile.formalTitle}</h3>
                  <p className="text-sm text-slate-400 mt-1 italic">"{profile.summary}"</p>
                </div>

                {/* SKILLS */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Habilidades Estandarizadas</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.parsedData?.skills?.map((sk, idx) => (
                      <span
                        key={idx}
                        className="bg-blue-950/40 text-blue-400 border border-blue-900/30 text-xs px-2.5 py-1 rounded-lg font-medium"
                      >
                        {sk.name} • <span className="text-[10px] text-blue-500">{sk.category}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* EXPERIENCIAS TRADUCIDAS */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Experiencia Reestructurada</h4>
                  <div className="space-y-3">
                    {profile.parsedData?.experiences?.map((exp, idx) => (
                      <div key={idx} className="bg-[#121522] p-4 rounded-xl border border-gray-800">
                        <div className="flex justify-between items-start">
                          <h5 className="text-sm font-bold text-slate-200">{exp.formalRole}</h5>
                          <span className="text-xs text-slate-400 font-medium">{exp.duration}</span>
                        </div>
                        <ul className="list-disc list-inside mt-2 text-xs text-slate-400 space-y-1">
                          {exp.formalResponsibilities?.map((resp, rIdx) => (
                            <li key={rIdx}>{resp}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {!profile && !parsing && (
            <div className="mt-8 text-center border border-dashed border-gray-800 rounded-2xl p-8 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">Tu perfil formalizado aparecerá aquí una vez completes tu experiencia.</p>
            </div>
          )}
        </div>

        {/* PARTE DERECHA: CHATBOT COACH FINANCIERO */}
        <div className="h-[600px] lg:h-auto">
          <SemiChatbot role="trabajador" />
        </div>
      </div>
    </div>
  );
}
