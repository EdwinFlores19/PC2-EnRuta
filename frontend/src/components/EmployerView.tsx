import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/axios';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function EmployerView(): React.JSX.Element {
  // Estado para el Chat de Reclutamiento RAG
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [chatError, setChatError] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat al final
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cargar historial inicial de Reclutamiento (si existe) al montar
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await apiClient.post('/ai/chat/employer', { message: 'Hola' });
        if (data?.data?.history) {
          setMessages(data.data.history);
        }
      } catch (err) {
        console.warn('No se pudo precargar historial de reclutamiento:', err);
      }
    };
    fetchHistory();
  }, []);

  // Manejar envío de Mensaje a Ramiro
  const handleSendMessage = async (messageText: string) => {
    const textToSend = messageText.trim();
    if (!textToSend || sendingChat) return;

    setInputMessage('');
    setChatError('');
    setSendingChat(true);

    // Optimistic update
    setMessages((prev) => [...prev, { role: 'user', text: textToSend }]);

    try {
      const { data } = await apiClient.post('/api/v1/ai/chat/employer', { message: textToSend });
      if (data?.status === 'success' && data?.data) {
        setMessages(data.data.history);
      } else {
        setChatError('Error al procesar la recomendación.');
      }
    } catch (err: any) {
      setChatError(err.response?.data?.message || 'No se pudo conectar con Ramiro.');
    } finally {
      setSendingChat(false);
    }
  };

  // Consultas rápidas recomendadas
  const quickQueries = [
    'Recomiéndame mejores operarios para Car Wash',
    'Busco operarios con Atención al Cliente en Breña',
    '¿Quiénes tienen experiencia en reparto o ruta?',
    'Candidatos que vivan en Comas o La Victoria'
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* SECCIÓN DE TÍTULO */}
      <div className="bg-gradient-to-r from-[#1E1627] via-[#101625] to-[#0B0F19] border border-slate-800 rounded-3xl p-6 md:p-8 text-white shadow-xl">
        <span className="bg-brand-purple/10 text-purple-400 border border-brand-purple/20 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider font-mono inline-block mb-3">
          🔎 COBERTURA DE SELECCIÓN CON INTELIGENCIA ARTIFICIAL (RAG)
        </span>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Panel de Reclutamiento RAG & Asistente IA</h1>
        <p className="mt-2 text-slate-400 max-w-2xl text-sm md:text-base leading-relaxed">
          Encuentra al talento idóneo de forma conversacional. Nuestra IA conecta con tu base de datos en tiempo real, evalúa experiencias informales y las traduce a aptitudes ideales para tu negocio formal.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* PARTE IZQUIERDA: INSTRUCCIONES Y CÓMO FUNCIONA EL RAG */}
        <div className="bg-[#101625] rounded-3xl border border-slate-800/80 shadow-2xl p-6 md:p-8 lg:col-span-1 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                🔍 Búsqueda Inteligente RAG
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Cómo optimizamos tu reclutamiento de personal con Inteligencia Artificial Semántica.
              </p>
            </div>

            <div className="space-y-5">
              <div className="flex gap-4">
                <div className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 font-mono">
                  1
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Consulta Semántica</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Escribe con lenguaje natural lo que necesitas. Buscaremos candidatos por cercanía, aptitudes y equivalencias de trabajo informal.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 font-mono">
                  2
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Inyección de Datos (RAG)</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Extraemos perfiles de candidatos de nuestra base de datos de PostgreSQL de forma 100% segura y los proveemos a Gemini.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 font-mono">
                  3
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Recomendaciones Justificadas</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    El chatbot te genera un listado de los mejores matches, explicando por qué calzan para el puesto y qué preguntarles.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#171E31] border border-slate-800 rounded-2xl p-5">
            <h4 className="text-xs font-bold text-[#06b6d4] uppercase mb-2 font-mono tracking-wider">💡 Tip de Selección:</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Los trabajadores informales tienen habilidades valiosas y adaptables. Nuestro bot te ayudará a traducir sus antiguas labores en competencias clave de servicio, caja y operaciones.
            </p>
          </div>
        </div>

        {/* PARTE DERECHA: CHATBOT DE RECOMPENSACIÓN INTELIGENTE (RAG) */}
        <div className="bg-[#101625] rounded-3xl border border-slate-800/80 shadow-2xl p-6 md:p-8 lg:col-span-2 flex flex-col h-[620px] justify-between">
          <div className="flex flex-col h-full justify-between">
            <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  🤖 Ramiro, tu Asesor de Selección
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Pregunta por perfiles, ubicación, habilidades o rubros. Buscaremos candidatos reales para ti.
                </p>
              </div>
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
              </span>
            </div>

            {/* MENSAJES DE CHAT */}
            <div className="flex-grow overflow-y-auto space-y-4 pr-1 my-4 scrollbar-thin">
              {messages.length === 0 && (
                <div className="text-center text-slate-500 my-12 space-y-3">
                  <svg className="mx-auto h-12 w-12 text-slate-700 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                  <p className="text-sm font-bold text-slate-300">Buscador conversacional activo.</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">Prueba preguntándole a Ramiro: "Busco personas con experiencia en atención al cliente que vivan en Breña".</p>
                </div>
              )}

              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-5 py-4 text-sm shadow-md leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-slate-900 text-slate-200 rounded-bl-none border border-slate-800'
                    }`}
                    style={{ whiteSpace: 'pre-line' }}
                  >
                    <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}

              {sendingChat && (
                <div className="flex justify-start">
                  <div className="bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl rounded-bl-none px-5 py-4 text-sm flex items-center gap-3 shadow-md">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span>Ramiro está analizando la base de datos...</span>
                  </div>
                </div>
              )}

              {chatError && (
                <div className="p-3 bg-red-500/10 text-red-400 text-xs rounded-xl border border-red-500/20 text-center font-medium font-mono">
                  ⚠️ {chatError}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* CONSULTAS RÁPIDAS */}
            <div className="space-y-2 border-t border-slate-800/60 pt-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide font-mono">Sugerencias de búsqueda:</p>
              <div className="flex flex-wrap gap-2">
                {quickQueries.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    disabled={sendingChat}
                    className="bg-slate-900 hover:bg-indigo-900/40 hover:text-indigo-400 hover:border-indigo-500/30 text-slate-300 text-xs px-3 py-2 border border-slate-800 rounded-xl transition-all disabled:opacity-50 font-semibold"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* INPUT FORM */}
            <div className="pt-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputMessage)}
                  placeholder="Busco operarios con experiencia en atención al cliente..."
                  className="flex-grow bg-slate-900 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  disabled={sendingChat}
                />
                <button
                  onClick={() => handleSendMessage(inputMessage)}
                  disabled={!inputMessage.trim() || sendingChat}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3.5 rounded-xl text-sm shadow-md transition-all disabled:bg-slate-800 disabled:text-slate-500 shrink-0"
                >
                  Buscar Talentos
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
