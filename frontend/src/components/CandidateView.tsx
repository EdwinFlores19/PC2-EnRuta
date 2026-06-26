import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/axios';
import { Card, Button } from './SemaforoComponents.js';

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
  // NLP CV Parser States
  const [rawText, setRawText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [profile, setProfile] = useState<ParsedProfile | null>(null);
  const [parseError, setParseError] = useState('');

  // IA Financial Coach States
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [chatError, setChatError] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load initial chat history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await apiClient.post('/ai/chat/candidate', { message: 'Hola' });
        if (data?.data?.history) {
          setMessages(data.data.history);
        }
      } catch (err) {
        console.warn('Could not pre-load chatbot history:', err);
      }
    };
    fetchHistory();
  }, []);

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

  const suggestedQuestions = [
    '¿Fito, cómo abro mi Yape sin tarjeta?',
    '¿Qué es un colchón de emergencia?',
    '¿Cómo presupuestar mi dinero diario?',
    '¿Me conviene Plin o Yape?'
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4">
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-[#171923] via-[#1A202C] to-[#0F1117] border border-[#2D3748] rounded-[12px] p-6 md:p-8 text-white shadow-xl">
        <span className="bg-[#48BB78]/10 text-[#48BB78] border border-[#48BB78]/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider font-mono inline-block mb-3">
          🎓 TRADUCCIÓN DE HABILIDADES & TUTORÍA FINANCIERA
        </span>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Portal del Trabajador & Coach Virtual</h1>
        <p className="mt-2 text-[#A0AEC0] max-w-2xl text-sm md:text-base leading-relaxed">
          Estandariza tu experiencia informal utilizando procesamiento de lenguaje natural y aprende a organizar tus ahorros con Fito, tu tutor financiero de IA.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* PARTE IZQUIERDA: MOTOR DE PARSEO DE CV */}
        <Card className="flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <div className="border-b border-[#2D3748] pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                📝 Motor NLP: Estandariza tu CV Informal
              </h2>
              <p className="text-xs text-[#A0AEC0] mt-1.5 leading-relaxed">
                Escribe detalladamente tus labores pasadas (ej. venta ambulante, cobrador, lavado de autos) y la IA estructurará tus competencias profesionales.
              </p>
            </div>

            <form onSubmit={handleParseCV} className="space-y-4">
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Escribe aquí tu experiencia informal, ej: 'Trabajé 2 años en el paradero de buses, me encargaba de llamar pasajeros, cobrar los pasajes y dar el vuelto rápido de forma ordenada...'"
                className="w-full h-36 bg-[#0F1117] border border-[#2D3748] rounded-xl p-4 text-sm text-[#F7FAFC] placeholder-slate-600 focus:ring-2 focus:ring-[#3B82F6] outline-none transition-all resize-none leading-relaxed"
                required
              />

              <Button
                type="submit"
                disabled={parsing || !rawText.trim()}
                className="w-full min-h-[44px]"
              >
                {parsing ? 'Procesando con IA...' : 'Estandarizar Mi Experiencia con IA ⚡'}
              </Button>
            </form>

            {parseError && (
              <div className="p-4 bg-[#E53E3E]/10 text-[#E53E3E] text-xs rounded-xl border border-[#E53E3E]/20 font-medium">
                ⚠️ {parseError}
              </div>
            )}

            {/* LIVE PROFILE OUTPUT */}
            {profile && (
              <div className="space-y-4 border border-[#48BB78]/20 bg-[#48BB78]/5 rounded-xl p-5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="bg-[#48BB78]/10 text-[#48BB78] border border-[#48BB78]/20 text-xs px-2.5 py-1 rounded-full font-bold">
                    ✨ Perfil Traducido por IA
                  </span>
                  <span className="text-xs text-[#A0AEC0] font-mono font-bold">📍 {profile.location}</span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">{profile.formalTitle}</h3>
                  <p className="text-sm text-slate-300 mt-1.5 italic leading-relaxed">"{profile.summary}"</p>
                </div>

                {/* SKILLS */}
                <div className="pt-2 border-t border-[#2D3748]">
                  <h4 className="text-xs font-bold text-[#A0AEC0] uppercase tracking-wider mb-2 font-mono">Habilidades Clasificadas</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.parsedData?.skills?.map((sk, idx) => (
                      <span
                        key={idx}
                        className="bg-[#0F1117] text-slate-200 text-xs px-2.5 py-1 rounded-lg border border-[#2D3748] font-semibold"
                      >
                        {sk.name} • <span className="text-[10px] text-[#3B82F6] font-bold">{sk.category}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* WORK EXPERIENCES */}
                <div className="pt-2 border-t border-[#2D3748]">
                  <h4 className="text-xs font-bold text-[#A0AEC0] uppercase tracking-wider mb-2 font-mono">Historial Estandarizado</h4>
                  <div className="space-y-3">
                    {profile.parsedData?.experiences?.map((exp, idx) => (
                      <div key={idx} className="bg-[#0F1117] p-4 rounded-xl border border-[#2D3748]">
                        <div className="flex justify-between items-start">
                          <h5 className="text-sm font-bold text-white">{exp.formalRole}</h5>
                          <span className="text-xs text-[#3B82F6] font-bold font-mono">{exp.duration}</span>
                        </div>
                        <ul className="list-disc list-inside mt-2.5 text-xs text-[#A0AEC0] space-y-1.5 leading-relaxed">
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
            <div className="text-center border-2 border-dashed border-[#2D3748] rounded-xl p-8 text-[#A0AEC0]">
              <p className="text-sm font-semibold">Tu perfil estructurado aparecerá aquí en tiempo real.</p>
            </div>
          )}
        </Card>

        {/* PARTE DERECHA: CHATBOT COACH FINANCIERO */}
        <Card className="flex flex-col h-[650px] justify-between">
          <div className="flex flex-col h-full justify-between">
            <div className="border-b border-[#2D3748] pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  💬 Habla con Fito, tu Coach
                </h2>
                <p className="text-xs text-[#A0AEC0] mt-1">
                  Aprende finanzas sencillas, cómo cobrar y cómo armar tu presupuesto personal.
                </p>
              </div>
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#48BB78] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#48BB78]"></span>
              </span>
            </div>

            {/* MESSAGES LIST */}
            <div className="flex-grow overflow-y-auto space-y-4 pr-1 my-4">
              {messages.length === 0 && (
                <div className="text-center text-[#A0AEC0] my-12 space-y-2">
                  <span className="text-3xl block">🐸</span>
                  <p className="text-sm font-bold">¡Hola! Soy Fito, tu asesor financiero.</p>
                  <p className="text-xs text-[#A0AEC0] max-w-xs mx-auto">Pregúntame cómo presupuestar tu dinero o cómo usar herramientas de cobro digital.</p>
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
                        ? 'bg-[#3B82F6] text-white rounded-br-none'
                        : 'bg-[#0F1117] text-slate-200 rounded-bl-none border border-[#2D3748]'
                    }`}
                    style={{ whiteSpace: 'pre-line' }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {sendingChat && (
                <div className="flex justify-start">
                  <div className="bg-[#0F1117] border border-[#2D3748] text-[#A0AEC0] rounded-2xl rounded-bl-none px-4 py-3 text-sm flex items-center gap-3">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 bg-[#3B82F6] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 bg-[#3B82F6] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-1.5 w-1.5 bg-[#3B82F6] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span>Fito está analizando...</span>
                  </div>
                </div>
              )}

              {chatError && (
                <div className="p-3 bg-[#E53E3E]/10 text-[#E53E3E] text-xs rounded-xl border border-[#E53E3E]/20 text-center font-medium">
                  ⚠️ {chatError}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* SUGGESTED QUESTIONS */}
            <div className="space-y-2 border-t border-[#2D3748] pt-4">
              <p className="text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wide font-mono">Preguntas recomendadas:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    disabled={sendingChat}
                    className="bg-[#0F1117] hover:bg-[#1A202C]/60 text-[#A0AEC0] text-xs px-3 py-2 border border-[#2D3748] rounded-xl transition-colors disabled:opacity-50 font-medium min-h-[36px]"
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
                  className="flex-grow bg-[#0F1117] border border-[#2D3748] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-[#3B82F6] outline-none transition-all"
                  disabled={sendingChat}
                />
                <Button
                  onClick={() => handleSendMessage(inputMessage)}
                  disabled={!inputMessage.trim() || sendingChat}
                  className="min-h-[44px] shrink-0"
                >
                  Enviar 🚀
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
