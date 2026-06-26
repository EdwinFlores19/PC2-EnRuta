import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/axios';

interface Message {
  role: 'user' | 'model';
  text: string;
}

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

  // Estado para el Chat Coach Financiero
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [chatError, setChatError] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat al final
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cargar historial inicial del Coach (si existe) al montar
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await apiClient.post('/ai/chat/candidate', { message: 'Hola' });
        if (data?.data?.history) {
          // Filtramos el mensaje "Hola" inicial del historial para no duplicar si es vacío
          setMessages(data.data.history);
        }
      } catch (err) {
        console.warn('No se pudo precargar historial de chat:', err);
      }
    };
    fetchHistory();
  }, []);

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

  // Manejar envío de Mensaje al Coach
  const handleSendMessage = async (messageText: string) => {
    const textToSend = messageText.trim();
    if (!textToSend || sendingChat) return;

    setInputMessage('');
    setChatError('');
    setSendingChat(true);

    // Optimistic update
    setMessages((prev) => [...prev, { role: 'user', text: textToSend }]);

    try {
      const { data } = await apiClient.post('/ai/chat/candidate', { message: textToSend });
      if (data?.status === 'success' && data?.data) {
        setMessages(data.data.history);
      } else {
        setChatError('Error al generar respuesta.');
      }
    } catch (err: any) {
      setChatError(err.response?.data?.message || 'No se pudo conectar con Fito.');
    } finally {
      setSendingChat(false);
    }
  };

  // Preguntas sugeridas para el Coach Financiero
  const suggestedQuestions = [
    '¿Fito, cómo abro mi Yape sin tarjeta?',
    '¿Qué es un colchón de emergencia y cuánto debo ahorrar?',
    '¿Cómo hago para presupuestar mi dinero diario?',
    '¿Me conviene Plin o Yape para mi negocio?'
  ];

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
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="border-b border-gray-100 pb-3 mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                📝 Motor NLP: Estandariza tu CV Informal
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Escribe a qué te dedicabas (ej. limpieza de casas, cobrador, ayudante) y la IA creará tu perfil formal.
              </p>
            </div>

            <form onSubmit={handleParseCV} className="space-y-4">
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Escribe aquí tu experiencia informal, ej: 'Hola, trabajé 2 años vendiendo comida en la calle, llevaba las cuentas del dinero diario y compraba los insumos en el mercado del distrito. También sé atender amablemente a la gente.'"
                className="w-full h-32 border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                required
              />

              <button
                type="submit"
                disabled={parsing || !rawText.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:bg-blue-300"
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
              <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {parseError}
              </div>
            )}

            {/* PERFIL GENERADO EN VIVO */}
            {profile && (
              <div className="mt-6 space-y-4 border-2 border-green-200 bg-green-50/30 rounded-2xl p-5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full font-bold">
                    ✨ Perfil Formalizado por IA
                  </span>
                  <span className="text-xs text-gray-500">{profile.location}</span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900">{profile.formalTitle}</h3>
                  <p className="text-sm text-gray-600 mt-1 italic">"{profile.summary}"</p>
                </div>

                {/* SKILLS */}
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Habilidades Estandarizadas</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.parsedData?.skills?.map((sk, idx) => (
                      <span
                        key={idx}
                        className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-lg font-medium"
                      >
                        {sk.name} • <span className="text-[10px] text-blue-500">{sk.category}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* EXPERIENCIAS TRADUCIDAS */}
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Experiencia Reestructurada</h4>
                  <div className="space-y-3">
                    {profile.parsedData?.experiences?.map((exp, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100">
                        <div className="flex justify-between items-start">
                          <h5 className="text-sm font-bold text-gray-900">{exp.formalRole}</h5>
                          <span className="text-xs text-gray-500 font-medium">{exp.duration}</span>
                        </div>
                        <ul className="list-disc list-inside mt-1 text-xs text-gray-600 space-y-1">
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
            <div className="mt-8 text-center border border-dashed border-gray-200 rounded-xl p-6 text-gray-400">
              <svg className="mx-auto h-12 w-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">Tu perfil formalizado aparecerá aquí una vez completes tu experiencia.</p>
            </div>
          )}
        </div>

        {/* PARTE DERECHA: CHATBOT COACH FINANCIERO */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col h-[550px]">
          <div className="border-b border-gray-100 pb-3 mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                💬 Habla con Fito, tu Coach
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Aprende finanzas fáciles, cómo cobrar con Yape y ahorrar para tus metas.
              </p>
            </div>
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          </div>

          {/* MENSAJES */}
          <div className="flex-grow overflow-y-auto space-y-4 pr-2 mb-4 scrollbar-thin">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 my-8">
                <p className="text-sm">No hay mensajes anteriores.</p>
                <p className="text-xs">¡Saluda a Fito para empezar a aprender!</p>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-indigo-50 text-gray-800 rounded-bl-none border border-indigo-100/50'
                  }`}
                  style={{ whiteSpace: 'pre-line' }}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {sendingChat && (
              <div className="flex justify-start">
                <div className="bg-indigo-50 border border-indigo-100 text-gray-500 rounded-2xl rounded-bl-none px-4 py-3 text-sm flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  Fito está escribiendo...
                </div>
              </div>
            )}

            {chatError && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 text-center">
                {chatError}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* SUGGESTED QUESTIONS */}
          <div className="flex flex-wrap gap-2 mb-3">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                disabled={sendingChat}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2.5 py-1.5 rounded-lg transition-colors border border-gray-200/50 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          {/* INPUT FORM */}
          <div className="border-t border-gray-100 pt-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputMessage)}
                placeholder="Escribe tu duda a Fito aquí..."
                className="flex-grow border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                disabled={sendingChat}
              />
              <button
                onClick={() => handleSendMessage(inputMessage)}
                disabled={!inputMessage.trim() || sendingChat}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all disabled:bg-blue-300 flex items-center justify-center"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
