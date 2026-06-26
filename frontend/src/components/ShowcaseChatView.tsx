import React, { useState } from 'react';
import SemiChatbot, { ChatbotRole } from './SemiChatbot';
import {
  TrafficLightIcon,
  CarIcon,
  ScaleIcon,
  BriefcaseIcon,
  type IconBaseProps,
} from './SemaforoIcons.js';

export default function ShowcaseChatView(): React.JSX.Element {
  const [activeRole, setActiveRole] = useState<ChatbotRole>('trabajador');

  const rolesList: Array<{ id: ChatbotRole; label: string; icon: React.FC<IconBaseProps>; desc: string; color: string }> = [
    {
      id: 'trabajador',
      label: 'Trabajador Vial',
      icon: TrafficLightIcon,
      desc: 'Coach financiero "Fito". Tono empático, cercano y de confianza con Ruti.',
      color: 'border-emerald-500 hover:bg-emerald-950/20 text-emerald-400'
    },
    {
      id: 'cliente',
      label: 'Conductor / Cliente',
      icon: CarIcon,
      desc: 'Asistente de servicios rápidos. Ayuda y soporte de Car Wash.',
      color: 'border-blue-500 hover:bg-blue-950/20 text-blue-400'
    },
    {
      id: 'fiscalizador',
      label: 'Fiscalizador MINTRA',
      icon: ScaleIcon,
      desc: 'Inspección gubernamental. Tono formal, serio e institucional.',
      color: 'border-purple-500 hover:bg-purple-950/20 text-purple-400'
    },
    {
      id: 'employer',
      label: 'Car Wash / RRHH',
      icon: BriefcaseIcon,
      desc: 'Recomendador RAG "Ramiro". Evalúa y empareja perfiles de la BD.',
      color: 'border-orange-500 hover:bg-orange-950/20 text-orange-400'
    }
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* HEADER DE BIENVENIDA */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 md:p-8 text-white border border-gray-800 shadow-xl">
        <h1 className="text-3xl font-extrabold tracking-tight">Centro de Pruebas Semánticas: Semi Chatbot</h1>
        <p className="mt-2 text-slate-400 max-w-2xl text-sm md:text-base">
          Prueba las expresiones, el tono NLP, los acentos de color y el comportamiento conversacional de nuestra mascota inmutable **"Semi"** cambiando de rol con un solo click.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* PANEL DE SELECCIÓN DE ROL */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-[#0f121d] border border-gray-800 rounded-3xl p-6 shadow-lg">
            <h2 className="text-lg font-bold text-slate-100 mb-4 border-b border-gray-800 pb-2 flex items-center gap-2">
              <TrafficLightIcon size="md" />
              Seleccionar Perfil de Chat
            </h2>
            <div className="space-y-3">
              {rolesList.map((r) => {
                const isActive = activeRole === r.id;
                const RoleIcon = r.icon;
                return (
                  <button
                    key={r.id}
                    onClick={() => setActiveRole(r.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all select-none ${
                      isActive
                        ? `bg-slate-900 border-2 font-bold scale-[1.02] ${r.color.split(' ')[0]}`
                        : 'bg-[#141724]/40 border-gray-800 text-slate-400'
                    } ${r.color.split(' ').slice(1).join(' ')}`}
                  >
                    <div className="flex items-center gap-3">
                      <RoleIcon size="2xl" />
                      <div>
                        <div className="text-sm font-bold text-slate-100">{r.label}</div>
                        <div className="text-xs text-slate-400 mt-1 leading-relaxed font-normal">{r.desc}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-950/20 border border-gray-800/40 rounded-2xl p-5 text-xs text-slate-500 leading-relaxed">
            <strong>Nota de Simulación SRE:</strong> Los perfiles de 'Trabajador' y 'Car Wash/RRHH' están conectados con datos de sesión e historiales relacionales en Supabase. Los perfiles de 'Cliente' y 'Fiscalizador' inyectan prompts dinámicos para calibración semántica en tiempo de ejecución.
          </div>
        </div>

        {/* CONTAINER DEL CHATBOT INTEGRADO */}
        <div className="md:col-span-2 h-[600px]">
          <SemiChatbot role={activeRole} />
        </div>
      </div>
    </div>
  );
}
