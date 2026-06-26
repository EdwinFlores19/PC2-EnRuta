import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/axios';
import {
  ChartBarIcon,
  GraduationCapIcon,
  ExclamationIcon,
  ChatIcon,
  MapPinIcon,
  StarIcon,
  InformationCircleIcon,
  CarIcon,
  SearchIcon,
  CheckIcon,
  DocumentTextIcon,
  LightbulbIcon,
  BellIcon,
  TrafficLightIcon,
  XIcon,
  type IconBaseProps,
} from './SemaforoIcons.js';

export type ChatbotRole = 'trabajador' | 'cliente' | 'fiscalizador' | 'employer';

interface SemiChatbotProps {
  role: ChatbotRole;
  isFloating?: boolean;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface QuickReply {
  label: string;
  Icon: React.FC<IconBaseProps>;
}

interface RoleConfig {
  name: string;
  acento: string;
  headerBg: string;
  burbujaBot: string;
  burbujaUser: string;
  expression: string;
  bienvenida: string;
  quickReplies: QuickReply[];
  endpoint: string;
  customSystemPrompt: string | null;
}

// Configuración de los 4 roles del Chatbot "Semi"
const ROLE_CONFIGS: Record<ChatbotRole, RoleConfig> = {
  trabajador: {
    name: 'Fito (Coach de Confianza)',
    acento: '#48BB78', // Verde esperanza
    headerBg: '#1A202C', // Gris oscuro neutro
    burbujaBot: '#2D3748',
    burbujaUser: '#48BB78',
    expression: 'alerta', // Ojos abiertos y brillantes
    bienvenida: '¡Hola, compadrito! Soy Semi, tu tutor de confianza. ¿Te doy una mano con tu progreso de ahorro o a configurar tu Yape hoy?',
    quickReplies: [
      { label: 'Ver mi progreso', Icon: ChartBarIcon },
      { label: 'Capacitaciones de ahorro', Icon: GraduationCapIcon },
      { label: 'Reportar un problema', Icon: ExclamationIcon },
      { label: 'Hablar con soporte', Icon: ChatIcon },
    ],
    endpoint: '/ai/chat/candidate',
    customSystemPrompt: null // Ya está definido de forma rígida en el backend
  },
  cliente: {
    name: 'Asistente de Servicio Express',
    acento: '#3B82F6', // Azul confianza
    headerBg: '#1A202C',
    burbujaBot: '#2D3748',
    burbujaUser: '#3B82F6',
    expression: 'servicial', // Ojos sonrientes ^_^
    bienvenida: '¡Hola! Soy Semi. ¿Buscas un lavado express cerca de ti o deseas saber cómo calificar a nuestros asistentes viales?',
    quickReplies: [
      { label: 'Buscar lavadores cerca', Icon: MapPinIcon },
      { label: '¿Cómo califico el servicio?', Icon: StarIcon },
      { label: '¿Cómo funciona el pago digital?', Icon: InformationCircleIcon },
      { label: 'Tarifas de Car Wash', Icon: CarIcon },
    ],
    endpoint: '/ai/chat',
    customSystemPrompt: 'Eres "Semi, el semáforo inteligente de asistencia al cliente". Tu rol es ayudar a conductores a encontrar lavados rápidos de autos cerca, explicar las tarifas del Car Wash, y cómo calificar con estrellitas a los trabajadores viales de nuestra bolsa de trabajo. Tu tono es veloz, servicial, amigable e inteligente.'
  },
  fiscalizador: {
    name: 'Monitoreo e Inspección Gubernamental (MINTRA)',
    acento: '#6B46C1', // Púrpura institucional
    headerBg: '#171923', // Más oscuro y serio
    burbujaBot: '#2D3748',
    burbujaUser: '#6B46C1',
    expression: 'neutral', // Ojos redondos y boca seria
    bienvenida: 'Asistente de Monitoreo de Seguridad Laboral y Prevención de Riesgos de MINTRA. ¿Necesita revisar alertas o auditoría fiscal?',
    quickReplies: [
      { label: 'Alertas de riesgo activas', Icon: BellIcon },
      { label: 'Reporte de formalización', Icon: ChartBarIcon },
      { label: 'Buscar expediente de menor', Icon: SearchIcon },
      { label: 'Descargar planilla', Icon: DocumentTextIcon },
    ],
    endpoint: '/ai/chat',
    customSystemPrompt: 'Eres "Semi, el Asistente de Monitoreo e Inspección Gubernamental del Ministerio de Trabajo (MINTRA)". Tu rol es serio, profesional, neutro y formal. Ayudas al fiscalizador a revisar alertas de trabajo infantil, verificar autorizaciones y ver estadísticas de formalización viales. Evita jergas, modismos o infantilismos; habla de forma estrictamente corporativa e institucional.'
  },
  employer: {
    name: 'Ramiro (Asesor de Reclutamiento)',
    acento: '#DD6B20', // Naranja profesional
    headerBg: '#1A202C',
    burbujaBot: '#2D3748',
    burbujaUser: '#DD6B20',
    expression: 'profesional', // Ojos determinados
    bienvenida: 'Soy Semi. ¿Buscamos talento de confianza hoy o revisamos perfiles verificados para tu negocio?',
    quickReplies: [
      { label: 'Buscar operarios de Car Wash', Icon: SearchIcon },
      { label: 'Ver candidatos verificados', Icon: CheckIcon },
      { label: 'Ver mis ofertas publicadas', Icon: DocumentTextIcon },
      { label: 'Preguntas de entrevista', Icon: LightbulbIcon },
    ],
    endpoint: '/ai/chat/employer',
    customSystemPrompt: null // Ya está definido de forma rígida en el backend
  }
};

export default function SemiChatbot({ role, isFloating }: SemiChatbotProps): React.JSX.Element {
  const config = ROLE_CONFIGS[role];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat al final
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mensaje de bienvenida inicial según el rol
  useEffect(() => {
    setMessages([
      { role: 'model', text: config.bienvenida }
    ]);
    setError('');
  }, [role]);

  // Manejar el envío de mensajes
  const handleSend = async (messageText: string) => {
    const textToSend = messageText.trim();
    if (!textToSend || loading) return;

    setInput('');
    setError('');
    setLoading(true);

    // Actualización optimista del usuario
    setMessages((prev) => [...prev, { role: 'user', text: textToSend }]);

    try {
      let responseData;
      
      // Si el rol es "cliente" o "fiscalizador", usamos el endpoint general '/ai/chat' y pasamos el prompt correspondiente
      if (role === 'cliente' || role === 'fiscalizador') {
        // Formatear historial al formato del backend
        const formattedHistory = messages.slice(1).map((m) => ({
          role: m.role,
          text: m.text
        }));

        const { data } = await apiClient.post(config.endpoint, {
          message: textToSend,
          history: formattedHistory,
          systemInstruction: config.customSystemPrompt
        });
        responseData = data;
      } else {
        // Roles 'trabajador' o 'employer' usan sus endpoints directos dedicados
        const { data } = await apiClient.post(config.endpoint, {
          message: textToSend
        });
        responseData = data;
      }

      if (responseData?.status === 'success' && responseData?.data) {
        // Si el backend retorna el historial completo actualizado
        if (responseData.data.history) {
          setMessages(responseData.data.history);
        } else {
          // Si retorna solo el texto individual
          setMessages((prev) => [...prev, { role: 'model', text: responseData.data.text }]);
        }
      } else {
        setError('Ocurrió un inconveniente al generar la respuesta. Por favor intenta de nuevo.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error de conexión. Asegúrate de tener sesión activa.');
    } finally {
      setLoading(false);
    }
  };

  // Renderizar la mascota animada de Semi en formato SVG
  const renderMascot = (sizeClass = 'h-12 w-12') => {
    // Determinar qué luz del semáforo brilla según el rol
    const isRedOn = role === 'fiscalizador';
    const isYellowOn = role === 'employer';
    const isGreenOn = role === 'trabajador' || role === 'cliente';

    // Determinar la forma de los ojos según la expresión
    let eyesSvg = (
      <>
        <circle cx="28" cy="18" r="3" fill="#FFFFFF" />
        <circle cx="28" cy="18" r="1.2" fill="#000000" />
        <circle cx="36" cy="18" r="3" fill="#FFFFFF" />
        <circle cx="36" cy="18" r="1.2" fill="#000000" />
      </>
    );

    if (config.expression === 'servicial') {
      // Ojos sonrientes ^_^
      eyesSvg = (
        <>
          <path d="M26 20c1-2 3-2 4 0" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M34 20c1-2 3-2 4 0" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </>
      );
    } else if (config.expression === 'alerta') {
      // Ojos extra abiertos y brillantes
      eyesSvg = (
        <>
          <circle cx="28" cy="18" r="3.5" fill="#FFFFFF" />
          <circle cx="28" cy="18" r="1.8" fill="#48BB78" />
          <circle cx="28" cy="17" r="0.8" fill="#FFFFFF" />
          <circle cx="36" cy="18" r="3.5" fill="#FFFFFF" />
          <circle cx="36" cy="18" r="1.8" fill="#48BB78" />
          <circle cx="36" cy="17" r="0.8" fill="#FFFFFF" />
        </>
      );
    } else if (config.expression === 'profesional') {
      // Ojos inteligentes, decididos
      eyesSvg = (
        <>
          <path d="M25 15h6" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="28" cy="19" r="2.5" fill="#FFFFFF" />
          <circle cx="28" cy="19" r="1.2" fill="#000000" />
          <path d="M33 15h6" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="36" cy="19" r="2.5" fill="#FFFFFF" />
          <circle cx="36" cy="19" r="1.2" fill="#000000" />
        </>
      );
    }

    return (
      <svg viewBox="0 0 64 64" className={`${sizeClass} drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] animate-bounce-slow`}>
        {/* Cuerpo del semáforo */}
        <rect x="20" y="6" width="24" height="48" rx="6" fill="#1E293B" stroke="#334155" strokeWidth="2" />
        <rect x="29" y="54" width="6" height="8" fill="#475569" />
        
        {/* Sombras de luces */}
        <circle cx="32" cy="16" r="5" fill={isRedOn ? '#EF4444' : '#0F172A'} className={isRedOn ? 'animate-pulse' : ''} />
        <circle cx="32" cy="28" r="5" fill={isYellowOn ? '#F59E0B' : '#0F172A'} className={isYellowOn ? 'animate-pulse' : ''} />
        <circle cx="32" cy="40" r="5" fill={isGreenOn ? '#10B981' : '#0F172A'} className={isGreenOn ? 'animate-pulse' : ''} />

        {/* Halo de luz encendida */}
        {isRedOn && <circle cx="32" cy="16" r="7" fill="#EF4444" opacity="0.3" />}
        {isYellowOn && <circle cx="32" cy="28" r="7" fill="#F59E0B" opacity="0.3" />}
        {isGreenOn && <circle cx="32" cy="40" r="7" fill="#10B981" opacity="0.3" />}

        {/* Cara amigable sobre puesta */}
        <g transform="translate(0, 8)">
          {/* Cejas / Ojos */}
          {eyesSvg}

          {/* Boca según la expresión */}
          {config.expression === 'neutral' ? (
            <path d="M29 27h6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          ) : (
            <path d="M28 26q4 3 8 0" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" />
          )}
        </g>
      </svg>
    );
  };

  if (!isFloating) {
    return (
      <div className="flex flex-col h-full bg-[#0F1117] rounded-3xl border border-gray-800 shadow-2xl overflow-hidden animate-fadeIn">
        {/* HEADER DE LA VENTANA */}
        <div
          className="px-6 py-4 flex items-center justify-between border-b border-gray-800 transition-all"
          style={{ backgroundColor: config.headerBg }}
        >
          <div className="flex items-center gap-4">
            <div className="shrink-0">{renderMascot('h-10 w-10')}</div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                {config.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide flex items-center gap-1">
                  <TrafficLightIcon size="xs" className="text-green-500" />
                  Semi Online
                </span>
              </div>
            </div>
          </div>
          <span
            className="text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider"
            style={{ backgroundColor: `${config.acento}15`, color: config.acento, border: `1px solid ${config.acento}30` }}
          >
            {role}
          </span>
        </div>

        {/* BANDEJA DE MENSAJES */}
        <div className="flex-grow overflow-y-auto p-6 space-y-4 scrollbar-thin">
          {messages.map((msg, idx) => {
            const isModel = msg.role === 'model';
            return (
              <div
                key={idx}
                className={`flex ${isModel ? 'justify-start' : 'justify-end'} animate-fadeIn`}
              >
                <div className="flex gap-2 max-w-[85%]">
                  {isModel && (
                    <div className="shrink-0 self-end mb-1">
                      {renderMascot('h-7 w-7')}
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4.5 py-3 text-sm leading-relaxed shadow-md ${
                      isModel
                        ? 'text-[#F7FAFC] bg-[#1A202C]/80 border border-gray-800/40 backdrop-blur-sm rounded-bl-none'
                        : 'text-white rounded-br-none font-medium'
                    }`}
                    style={{
                      backgroundColor: isModel ? undefined : config.burbujaUser,
                      whiteSpace: 'pre-line'
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex justify-start">
              <div className="flex gap-2 max-w-[80%]">
                <div className="shrink-0 self-end mb-1">
                  {renderMascot('h-7 w-7')}
                </div>
                <div className="bg-[#2D3748] rounded-2xl rounded-bl-none px-4.5 py-3 text-sm text-gray-300 flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  Semi está procesando...
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800 text-red-400 text-xs rounded-xl text-center">
              {error}
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* SUGERENCIAS / QUICK REPLIES */}
        <div className="px-6 py-2 flex flex-wrap gap-2 border-t border-gray-800/30 bg-[#0c0d12]/50">
          {config.quickReplies.map((qr, idx) => {
            const QuickIcon = qr.Icon;
            return (
              <button
                key={idx}
                onClick={() => handleSend(qr.label)}
                disabled={loading}
                className="text-left text-xs px-3.5 py-2 rounded-xl transition-all border border-gray-800 hover:bg-[#1a1c24] text-gray-300 hover:text-white disabled:opacity-40 select-none min-h-[44px] flex items-center gap-2 font-medium cursor-pointer"
                style={{
                  borderColor: `${config.acento}20`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${config.acento}10`;
                  e.currentTarget.style.borderColor = config.acento;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = `${config.acento}20`;
                }}
              >
                <QuickIcon size="sm" />
                {qr.label}
              </button>
            );
          })}
        </div>

        {/* INPUT PRINCIPAL */}
        <div className="p-6 border-t border-gray-800 bg-[#0c0d12]">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
              placeholder={
                role === 'trabajador'
                  ? 'Pregúntale a Fito cómo yapear o ahorrar...'
                  : role === 'employer'
                  ? 'Busca candidatos por experiencia o distrito...'
                  : 'Escribe tu mensaje aquí...'
              }
              className="flex-grow bg-[#161822] text-white border border-gray-800 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-opacity-50 outline-none transition-all placeholder-gray-500"
              style={{
                '--tw-ring-color': config.acento
              } as any}
              disabled={loading}
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || loading}
              className="text-white px-6 py-3.5 rounded-2xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-1 min-w-[90px] cursor-pointer"
              style={{
                backgroundColor: config.acento,
                opacity: !input.trim() || loading ? 0.4 : 1
              }}
            >
              Enviar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Floating Mascot Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full glass-panel flex items-center justify-center shadow-[0_8px_30px_rgba(59,130,246,0.35)] hover:scale-110 active:scale-95 transition-all duration-300 bg-[#171923]/90 border border-gray-800 hover:border-[#3B82F6]/50 cursor-pointer"
        aria-label="Abrir asistente inteligente"
        data-testid="btn-floating-chatbot"
      >
        {renderMascot('h-11 w-11')}
      </button>

      {/* Floating Chat window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[420px] h-[580px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-8rem)] shadow-2xl glass-panel flex flex-col rounded-3xl border border-gray-800/80 overflow-hidden animate-slideUp">
          {/* HEADER DE LA VENTANA */}
          <div
            className="px-6 py-4 flex items-center justify-between border-b border-gray-800/60 transition-all"
            style={{ backgroundColor: config.headerBg }}
          >
            <div className="flex items-center gap-4">
              <div className="shrink-0">{renderMascot('h-10 w-10')}</div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  {config.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide flex items-center gap-1">
                    <TrafficLightIcon size="xs" className="text-green-500" />
                    Semi Online
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider"
                style={{ backgroundColor: `${config.acento}15`, color: config.acento, border: `1px solid ${config.acento}30` }}
              >
                {role}
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all cursor-pointer min-h-[30px]"
                aria-label="Cerrar chat"
              >
                <XIcon size="sm" />
              </button>
            </div>
          </div>

          {/* BANDEJA DE MENSAJES */}
          <div className="flex-grow overflow-y-auto p-6 space-y-4 scrollbar-thin">
            {messages.map((msg, idx) => {
              const isModel = msg.role === 'model';
              return (
                <div
                  key={idx}
                  className={`flex ${isModel ? 'justify-start' : 'justify-end'} animate-fadeIn`}
                >
                  <div className="flex gap-2 max-w-[85%]">
                    {isModel && (
                      <div className="shrink-0 self-end mb-1">
                        {renderMascot('h-7 w-7')}
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4.5 py-3 text-sm leading-relaxed shadow-md ${
                        isModel
                          ? 'text-[#F7FAFC] bg-[#1A202C]/80 border border-gray-800/40 backdrop-blur-sm rounded-bl-none'
                          : 'text-white rounded-br-none font-medium'
                      }`}
                      style={{
                        backgroundColor: isModel ? undefined : config.burbujaUser,
                        whiteSpace: 'pre-line'
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-2 max-w-[80%]">
                  <div className="shrink-0 self-end mb-1">
                    {renderMascot('h-7 w-7')}
                  </div>
                  <div className="bg-[#2D3748] rounded-2xl rounded-bl-none px-4.5 py-3 text-sm text-gray-300 flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    Semi está procesando...
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-950/40 border border-red-800 text-red-400 text-xs rounded-xl text-center">
                {error}
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* SUGERENCIAS / QUICK REPLIES */}
          <div className="px-6 py-2 flex flex-wrap gap-2 border-t border-gray-800/30 bg-[#0c0d12]/50 max-h-[120px] overflow-y-auto scrollbar-thin">
            {config.quickReplies.map((qr, idx) => {
              const QuickIcon = qr.Icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSend(qr.label)}
                  disabled={loading}
                  className="text-left text-xs px-3.5 py-2 rounded-xl transition-all border border-gray-800 hover:bg-[#1a1c24] text-gray-300 hover:text-white disabled:opacity-40 select-none min-h-[44px] flex items-center gap-2 font-medium cursor-pointer"
                  style={{
                    borderColor: `${config.acento}20`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${config.acento}10`;
                    e.currentTarget.style.borderColor = config.acento;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = `${config.acento}20`;
                  }}
                >
                  <QuickIcon size="sm" />
                  {qr.label}
                </button>
              );
            })}
          </div>

          {/* INPUT PRINCIPAL */}
          <div className="p-6 border-t border-gray-800 bg-[#0c0d12]">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                placeholder={
                  role === 'trabajador'
                    ? 'Pregúntale a Fito cómo yapear o ahorrar...'
                    : role === 'employer'
                    ? 'Busca candidatos por experiencia o distrito...'
                    : 'Escribe tu mensaje aquí...'
                }
                className="flex-grow bg-[#161822] text-white border border-gray-800 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-opacity-50 outline-none transition-all placeholder-gray-500"
                style={{
                  '--tw-ring-color': config.acento
                } as any}
                disabled={loading}
              />
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || loading}
                className="text-white px-6 py-3.5 rounded-2xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-1 min-w-[90px] cursor-pointer"
                style={{
                  backgroundColor: config.acento,
                  opacity: !input.trim() || loading ? 0.4 : 1
                }}
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
