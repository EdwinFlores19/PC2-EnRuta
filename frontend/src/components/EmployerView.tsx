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
          // Filtramos el mensaje "Hola" inicial del historial
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
    'Recomiéndame los mejores operarios para Car Wash y detallado de autos',
    'Busco candidatos con habilidades de Atención al Cliente y caja en Breña',
    '¿Quiénes tienen experiencia en reparto o logística de ruta?',
    'Candidatos que sepan trabajar bajo presión y vivan en Comas o La Victoria'
  ];

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
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 lg:col-span-1 space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              🔍 Reclutamiento RAG
            </h2>
            <p className="text-xs text-gray-500 mt-1">Cómo optimizamos tu búsqueda con Inteligencia Artificial.</p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="bg-indigo-100 text-indigo-800 h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">1</div>
              <div>
                <h3 className="text-sm font-bold text-gray-800">Consulta Semántica</h3>
                <p className="text-xs text-gray-600 mt-0.5">Escribe con lenguaje natural lo que necesitas. Buscamos por cercanía física, aptitudes y equivalencias informales.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="bg-indigo-100 text-indigo-800 h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">2</div>
              <div>
                <h3 className="text-sm font-bold text-gray-800">Inyección de Datos (RAG)</h3>
                <p className="text-xs text-gray-600 mt-0.5">Extraemos perfiles de candidatos reales registrados en PostgreSQL (Supabase) y se los proveemos a Gemini de forma segura.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="bg-indigo-100 text-indigo-800 h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">3</div>
              <div>
                <h3 className="text-sm font-bold text-gray-800">Recomendaciones Justificadas</h3>
                <p className="text-xs text-gray-600 mt-0.5">El chatbot te genera un listado de los mejores matches, explicando por qué calzan para el puesto y qué preguntarles en la entrevista presencial.</p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-xl p-4">
            <h4 className="text-xs font-bold text-indigo-900 uppercase mb-2">💡 Tip de Selección:</h4>
            <p className="text-xs text-indigo-800 leading-relaxed">
              Los trabajadores informales tienen habilidades valiosas y adaptables. Nuestro bot te ayudará a traducir sus antiguas labores en competencias clave de servicio, caja y operaciones.
            </p>
          </div>
        </div>

        {/* PARTE DERECHA: CHATBOT DE RECOMPENSACIÓN INTELIGENTE (RAG) */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 lg:col-span-2 flex flex-col h-[600px]">
          <div className="border-b border-gray-100 pb-3 mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                🤖 Ramiro, tu Asesor de Selección
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Pregunta por perfiles, ubicación, habilidades o rubros. Buscaremos candidatos reales para ti.
              </p>
            </div>
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600"></span>
            </span>
          </div>

          {/* MENSAJES DE CHAT */}
          <div className="flex-grow overflow-y-auto space-y-4 pr-2 mb-4 scrollbar-thin">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 my-12">
                <svg className="mx-auto h-12 w-12 text-gray-300 mb-2 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
                <p className="text-sm font-medium">Buscador conversacional activo.</p>
                <p className="text-xs mt-1">Escribe tu primer requerimiento de personal a Ramiro.</p>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-5 py-4 text-sm shadow-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-50 text-gray-800 rounded-bl-none border border-slate-200/50'
                  }`}
                  style={{ whiteSpace: 'pre-line' }}
                >
                  {/* Renderizado básico para markdown simple del bot */}
                  <div className="prose max-w-none text-sm leading-relaxed">
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}

            {sendingChat && (
              <div className="flex justify-start">
                <div className="bg-slate-50 border border-slate-200 text-gray-500 rounded-2xl rounded-bl-none px-5 py-4 text-sm flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  Ramiro está analizando la base de datos...
                </div>
              </div>
            )}

            {chatError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 text-center">
                {chatError}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* CONSULTAS RÁPIDAS */}
          <div className="space-y-1.5 mb-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Sugerencias de búsqueda:</p>
            <div className="flex flex-wrap gap-2">
              {quickQueries.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  disabled={sendingChat}
                  className="bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 text-xs px-3 py-1.5 rounded-lg transition-all border border-slate-200/50 text-left max-w-full truncate disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* INPUT FORM */}
          <div className="border-t border-gray-100 pt-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputMessage)}
                placeholder="Busco operarios con experiencia en atención al cliente..."
                className="flex-grow border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                disabled={sendingChat}
              />
              <button
                onClick={() => handleSendMessage(inputMessage)}
                disabled={!inputMessage.trim() || sendingChat}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-sm transition-all disabled:bg-indigo-300 flex items-center justify-center"
              >
                Buscar Talentos
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
