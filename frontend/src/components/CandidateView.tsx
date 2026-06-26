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
    '¿Qué es un colchón de emergencia?',
    '¿Cómo presupuestar mi dinero diario?',
    '¿Me conviene Plin o Yape?'
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* SECCIÓN DE TÍTULO */}
      <div className="bg-gradient-to-r from-[#1D1627] via-[#161D30] to-[#0B0F19] border border-slate-800 rounded-3xl p-6 md:p-8 text-white shadow-xl">
        <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider font-mono inline-block mb-3">
          🎓 TRADUCCIÓN DE HABILIDADES & TUTORÍA FINANCIERA
        </span>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Portal del Trabajador & Coach Virtual</h1>
        <p className="mt-2 text-slate-400 max-w-2xl text-sm md:text-base leading-relaxed">
          Formaliza tu experiencia de trabajo informal en segundos utilizando nuestro motor NLP y aprende a gestionar tu platita de forma inteligente con Fito, tu tutor financiero de IA.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* PARTE IZQUIERDA: MOTOR DE PARSEO DE CV */}
        <div className="bg-[#101625] rounded-3xl border border-slate-800/80 shadow-2xl p-6 md:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                📝 Motor NLP: Estandariza tu CV Informal
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Escribe detalladamente tus labores pasadas (ej. limpieza de casas, cobrador de micro, ayudante de construcción) y la IA creará tu perfil estandarizado ideal para postulaciones formales.
              </p>
            </div>

            <form onSubmit={handleParseCV} className="space-y-4">
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Escribe aquí tu experiencia informal, ej: 'Hola, trabajé 2 años vendiendo comida en la calle, llevaba las cuentas del dinero diario y compraba los insumos en el mercado del distrito. También sé atender amablemente a la gente.'"
                className="w-full h-36 bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all resize-none leading-relaxed"
                required
              />

              <button
                type="submit"
                disabled={parsing || !rawText.trim()}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-purple-500/10 transition-all flex items-center justify-center gap-2 disabled:bg-slate-800 disabled:text-slate-500"
              >
                {parsing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Procesando con Inteligencia Artificial...
                  </>
                ) : (
                  'Estandarizar Mi Experiencia con IA ⚡'
                )}
              </button>
            </form>

            {parseError && (
              <div className="p-4 bg-red-500/10 text-red-400 text-xs rounded-xl border border-red-500/20 font-medium">
                ⚠️ {parseError}
              </div>
            )}

            {/* PERFIL GENERADO EN VIVO */}
            {profile && (
              <div className="space-y-4 border border-emerald-500/20 bg-emerald-500/5 rounded-2xl p-5 md:p-6 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-1 rounded-full font-bold">
                    ✨ Perfil Estandarizado por IA
                  </span>
                  <span className="text-xs text-slate-400 font-mono font-bold">📍 {profile.location}</span>
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-white">{profile.formalTitle}</h3>
                  <p className="text-sm text-slate-300 mt-1.5 italic leading-relaxed">"{profile.summary}"</p>
                </div>

                {/* SKILLS */}
                <div className="pt-2 border-t border-slate-800/60">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Habilidades Estandarizadas</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.parsedData?.skills?.map((sk, idx) => (
                      <span
                        key={idx}
                        className="bg-slate-900 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 font-semibold"
                      >
                        {sk.name} • <span className="text-[10px] text-[#06b6d4] font-bold">{sk.category}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* EXPERIENCIAS TRADUCIDAS */}
                <div className="pt-2 border-t border-slate-800/60">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Historial Laboral Traducido</h4>
                  <div className="space-y-3">
                    {profile.parsedData?.experiences?.map((exp, idx) => (
                      <div key={idx} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                        <div className="flex justify-between items-start">
                          <h5 className="text-sm font-extrabold text-white">{exp.formalRole}</h5>
                          <span className="text-xs text-[#06b6d4] font-bold font-mono">{exp.duration}</span>
                        </div>
                        <ul className="list-disc list-inside mt-2.5 text-xs text-slate-400 space-y-1.5 leading-relaxed">
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
            <div className="text-center border-2 border-dashed border-slate-800 rounded-2xl p-8 text-slate-500">
              <svg className="mx-auto h-12 w-12 text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-semibold">Tu perfil formalizado aparecerá aquí en tiempo real.</p>
            </div>
          )}
        </div>

        {/* PARTE DERECHA: CHATBOT COACH FINANCIERO */}
        <div className="bg-[#101625] rounded-3xl border border-slate-800/80 shadow-2xl p-6 md:p-8 flex flex-col h-[650px] justify-between">
          <div className="flex flex-col h-full justify-between">
            <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  💬 Habla con Fito, tu Coach
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Aprende finanzas fáciles, cómo cobrar con Yape/Plin y planificar tu ahorro diario.
                </p>
              </div>
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>

            {/* MENSAJES */}
            <div className="flex-grow overflow-y-auto space-y-4 pr-1 my-4 scrollbar-thin">
              {messages.length === 0 && (
                <div className="text-center text-slate-500 my-12 space-y-2">
                  <span className="text-3xl block">🐸</span>
                  <p className="text-sm font-bold">¡Hola! Soy Fito, tu asesor financiero.</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">Pregúntame cómo presupuestar tu dinero o cómo usar herramientas de cobro digital.</p>
                </div>
              )}

              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-md leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-purple-600 text-white rounded-br-none'
                        : 'bg-slate-900 text-slate-200 rounded-bl-none border border-slate-800'
                    }`}
                    style={{ whiteSpace: 'pre-line' }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {sendingChat && (
                <div className="flex justify-start">
                  <div className="bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl rounded-bl-none px-4 py-3 text-sm flex items-center gap-3 shadow-md">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-1.5 w-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span>Fito está analizando...</span>
                  </div>
                </div>
              )}

              {chatError && (
                <div className="p-3 bg-red-500/10 text-red-400 text-xs rounded-xl border border-red-500/20 text-center font-medium">
                  ⚠️ {chatError}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* SUGGESTED QUESTIONS */}
            <div className="space-y-2 border-t border-slate-800/60 pt-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide font-mono">Preguntas sugeridas:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    disabled={sendingChat}
                    className="bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs px-3 py-2 border border-slate-800 rounded-xl transition-colors disabled:opacity-50 font-medium"
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
                  placeholder="Pregúntale a Fito sobre ahorro, créditos..."
                  className="flex-grow bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  disabled={sendingChat}
                />
                <button
                  onClick={() => handleSendMessage(inputMessage)}
                  disabled={!inputMessage.trim() || sendingChat}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-3 rounded-xl text-sm shadow-md transition-all disabled:bg-slate-800 disabled:text-slate-500 shrink-0"
                >
                  Enviar 🚀
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
