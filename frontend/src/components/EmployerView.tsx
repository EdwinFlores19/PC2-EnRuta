import React from 'react';
import SemiChatbot from './SemiChatbot';

export default function EmployerView(): React.JSX.Element {
  return (
    <div className="space-y-8">
      {/* SECCIÓN DE TÍTULO */}
      <div className="bg-gradient-to-r from-indigo-700 to-purple-800 rounded-3xl p-6 md:p-8 text-white shadow-md">
        <h1 className="text-3xl font-extrabold tracking-tight">Panel de Reclutamiento RAG & Asistente IA</h1>
        <p className="mt-2 text-indigo-100 max-w-2xl text-sm md:text-base">
          Encuentra al talento idóneo de forma conversacional. Nuestra IA conecta con tu base de datos en tiempo real, evalúa experiencias informales y las traduce a aptitudes ideales para tu negocio formal.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* PARTE IZQUIERDA: INSTRUCCIONES Y CÓMO FUNCIONA EL RAG */}
        <div className="bg-[#0f121d] border border-gray-800 rounded-3xl p-6 lg:col-span-1 space-y-6 shadow-lg">
          <div className="border-b border-gray-800 pb-3">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              🔍 Reclutamiento RAG
            </h2>
            <p className="text-xs text-slate-400 mt-1">Cómo optimizamos tu búsqueda con Inteligencia Artificial.</p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="bg-indigo-950 text-indigo-400 border border-indigo-900/30 h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">1</div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">Consulta Semántica</h3>
                <p className="text-xs text-slate-400 mt-0.5">Escribe con lenguaje natural lo que necesitas. Buscamos por cercanía física, aptitudes y equivalencias informales.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="bg-indigo-950 text-indigo-400 border border-indigo-900/30 h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">2</div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">Inyección de Datos (RAG)</h3>
                <p className="text-xs text-slate-400 mt-0.5">Extraemos perfiles de candidatos reales registrados en PostgreSQL (Supabase) y se los proveemos a Gemini de forma segura.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="bg-indigo-950 text-indigo-400 border border-indigo-900/30 h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">3</div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">Recomendaciones Justificadas</h3>
                <p className="text-xs text-slate-400 mt-0.5">El chatbot te genera un listado de los mejores matches, explicando por qué calzan para el puesto y qué preguntarles en la entrevista presencial.</p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-indigo-400 uppercase mb-2">💡 Tip de Selección:</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Los trabajadores informales tienen habilidades valiosas y adaptables. Nuestro bot te ayudará a traducir sus antiguas labores en competencias clave de servicio, caja y operaciones.
            </p>
          </div>
        </div>

        {/* PARTE DERECHA: CHATBOT DE RECOMPENSACIÓN INTELIGENTE (RAG) */}
        <div className="lg:col-span-2 h-[600px] lg:h-auto">
          <SemiChatbot role="employer" />
        </div>
      </div>
    </div>
  );
}
