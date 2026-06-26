import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/axios';
import { Card, Button } from './SemaforoComponents.js';
import { SearchIcon, BotIcon, ExclamationIcon, DocumentTextIcon } from './SemaforoIcons.js';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function EmployerView(): React.JSX.Element {
  // Chat States
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
        const { data } = await apiClient.post('/api/v1/ai/chat/employer', { message: 'Hola' });
        if (data?.data?.history) {
          setMessages(data.data.history);
        }
      } catch (err) {
        console.warn('Could not pre-load chatbot history:', err);
      }
    };
    fetchHistory();
  }, []);

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

  const quickQueries = [
    'Recomiéndame mejores operarios para Car Wash',
    'Busco operarios con Atención al Cliente en Breña',
    '¿Quiénes tienen experiencia en reparto o ruta?',
    'Candidatos que vivan en Comas o La Victoria'
  ];

  return (
    <div className="space-y-10 max-w-7xl mx-auto px-4 sm:px-6">
      {/* HEADER SECTION - Role Empresa Accent Orange (#DD6B20) */}
      <div className="bg-gradient-to-r from-[#171923] via-[#1A202C] to-[#0F1117] border border-[#2D3748] rounded-2xl p-6 md:p-10 text-white shadow-xl">
        <span className="bg-[#DD6B20]/10 text-[#DD6B20] border border-[#DD6B20]/20 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider font-mono inline-flex items-center gap-1.5 mb-3">
          <SearchIcon size="sm" /> BÚSQUEDA DE SELECCIÓN CON INTELIGENCIA ARTIFICIAL (RAG) — EMPRESAS
        </span>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Panel de Reclutamiento RAG & Asistente IA</h1>
        <p className="mt-3 text-[#A0AEC0] max-w-2xl text-sm md:text-base leading-relaxed">
          Encuentra al talento idóneo de forma conversacional. Nuestra IA conecta con tu base de datos en tiempo real, evalúa experiencias informales y las traduce a aptitudes ideales para tu negocio formal.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">

        {/* PARTE IZQUIERDA: CÓMO FUNCIONA EL RAG */}
        <Card className="lg:col-span-1 flex flex-col justify-between space-y-8 bg-[#171923] border border-[#2D3748] p-6 md:p-8">
          <div className="space-y-8">
            <div className="border-b border-[#2D3748] pb-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <SearchIcon size="md" className="text-[#DD6B20]" /> Búsqueda Semántica RAG
              </h2>
              <p className="text-sm text-[#A0AEC0] mt-2 leading-relaxed">
                Cómo optimizamos tu reclutamiento de personal con Inteligencia Semántica.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="bg-[#DD6B20]/10 text-[#DD6B20] border border-[#DD6B20]/20 h-11 w-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 font-mono">
                  1
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Consulta Natural</h3>
                  <p className="text-xs text-[#A0AEC0] mt-1.5 leading-relaxed">
                    Escribe con lenguaje natural lo que necesitas. Buscaremos candidatos por cercanía, aptitudes y equivalencias de trabajo informal.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-[#DD6B20]/10 text-[#DD6B20] border border-[#DD6B20]/20 h-11 w-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 font-mono">
                  2
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Inyección Vectorial</h3>
                  <p className="text-xs text-[#A0AEC0] mt-1.5 leading-relaxed">
                    Extraemos perfiles de candidatos de nuestra base de datos de PostgreSQL de forma 100% segura y los procesamos mediante RAG.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-[#DD6B20]/10 text-[#DD6B20] border border-[#DD6B20]/20 h-11 w-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 font-mono">
                  3
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Recomendación Justificada</h3>
                  <p className="text-xs text-[#A0AEC0] mt-1.5 leading-relaxed">
                    El chatbot te genera un listado de los mejores matches, explicando por qué calzan para el puesto y qué preguntarles.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0F1117] border border-[#2D3748] rounded-xl p-5">
            <h4 className="text-xs font-bold text-[#DD6B20] uppercase mb-2 font-mono tracking-wider inline-flex items-center gap-1.5">
              <DocumentTextIcon size="xs" /> Tip de Selección:
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Los trabajadores de la vía pública tienen habilidades de venta y resiliencia valiosas. Nuestro bot te ayudará a traducir sus antiguas labores en competencias operativas de caja y almacén.
            </p>
          </div>
        </Card>

        {/* PARTE DERECHA: CHATBOT RAG */}
        <Card className="lg:col-span-2 flex flex-col h-[700px] justify-between bg-[#171923] border border-[#2D3748] p-6 md:p-8">
          <div className="flex flex-col h-full justify-between">
            <div className="border-b border-[#2D3748] pb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <BotIcon size="md" className="text-[#DD6B20]" /> Ramiro, tu Asesor de Selección
                </h2>
                <p className="text-sm text-[#A0AEC0] mt-2">
                  Pregunta por perfiles, ubicación, habilidades o rubros. Buscaremos candidatos reales para ti.
                </p>
              </div>
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#DD6B20] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#DD6B20]"></span>
              </span>
            </div>

            {/* MESSAGES */}
            <div className="flex-grow overflow-y-auto space-y-5 p-2 my-5">
              {messages.length === 0 && (
                <div className="text-center text-[#A0AEC0] my-12 space-y-3">
                  <p className="text-sm font-bold text-slate-300">Buscador conversacional activo.</p>
                  <p className="text-xs text-[#A0AEC0] max-w-xs mx-auto">Prueba preguntándole a Ramiro: "Busco personas con experiencia en atención al cliente que vivan en Breña".</p>
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
                        ? 'bg-[#3B82F6] text-white rounded-br-none'
                        : 'bg-[#0F1117] text-slate-200 rounded-bl-none border border-[#2D3748]'
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
                  <div className="bg-[#0F1117] border border-[#2D3748] text-[#A0AEC0] rounded-2xl rounded-bl-none px-5 py-4 text-sm flex items-center gap-3 shadow-md">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 bg-[#DD6B20] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 bg-[#DD6B20] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-1.5 w-1.5 bg-[#DD6B20] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span>Ramiro está consultando la base de datos...</span>
                  </div>
                </div>
              )}

              {chatError && (
                <div className="p-3 bg-[#E53E3E]/10 text-[#E53E3E] text-xs rounded-xl border border-[#E53E3E]/20 text-center font-medium font-mono">
                  <ExclamationIcon size="sm" className="inline" /> {chatError}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* QUICK SUGGESTIONS */}
            <div className="space-y-3 border-t border-[#2D3748] pt-5">
              <p className="text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wide font-mono">Sugerencias de búsqueda:</p>
              <div className="flex flex-wrap gap-2.5">
                {quickQueries.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    disabled={sendingChat}
                    className="bg-[#0F1117] hover:bg-[#1A202C] hover:text-[#F7FAFC] text-[#A0AEC0] text-xs px-3.5 py-2 border border-[#2D3748] rounded-xl transition-all disabled:opacity-50 font-semibold min-h-[40px]"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* INPUT FORM */}
            <div className="pt-5">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputMessage)}
                  placeholder="Busco operarios con experiencia en atención al cliente..."
                  className="flex-grow bg-[#0F1117] border border-[#2D3748] rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-[#3B82F6] outline-none transition-all"
                  disabled={sendingChat}
                />
                <Button
                  onClick={() => handleSendMessage(inputMessage)}
                  disabled={!inputMessage.trim() || sendingChat}
                  className="min-h-[48px] shrink-0"
                >
                  Buscar
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
