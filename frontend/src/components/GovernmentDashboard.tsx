import React, { useEffect, useState } from 'react';
import { SemaforoBadge } from './SemaforoComponents.js';
import {
  AlertOctagonIcon,
  MapPinIcon,
  ShieldIcon,
  UsersIcon,
  DocumentTextIcon,
  CheckIcon,
  ScaleIcon,
} from './SemaforoIcons.js';

interface SOSAlert {
  id: string;
  latitude: number;
  longitude: number;
  status: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

interface WorkerAudit {
  id: string;
  name: string;
  documentType: 'DNI' | 'CE' | 'PTP';
  documentNumber: string;
  age: number;
  status: 'APPROVED' | 'PENDING_APPROVAL' | 'BLOCKED_UNDERAGE';
  district: string;
  mintraDocUrl?: string;
  alertDetails?: string;
}

export default function GovernmentDashboard(): React.JSX.Element {
  // Estado para el Control de Alertas SOS
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [activeSOS, setActiveSOS] = useState<SOSAlert | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Datos para la tabla de Fiscalización MINTRA/MIMP
  const [workers, setWorkers] = useState<WorkerAudit[]>([
    {
      id: 'w-1',
      name: 'María Quispe Rojas',
      documentType: 'DNI',
      documentNumber: '44558899',
      age: 28,
      status: 'APPROVED',
      district: 'Miraflores'
    },
    {
      id: 'w-2',
      name: 'Juan Torres Flores',
      documentType: 'DNI',
      documentNumber: '71552233',
      age: 15,
      status: 'PENDING_APPROVAL',
      district: 'Miraflores',
      mintraDocUrl: 'https://mimp.gob.pe/autorizacion_adolescente_juan_torres.pdf',
      alertDetails: 'Adolescente (15 años) - Esperando verificación de autorización de MINTRA'
    },
    {
      id: 'w-3',
      name: 'Sandro Ruiz Melgar',
      documentType: 'DNI',
      documentNumber: '79885544',
      age: 13,
      status: 'BLOCKED_UNDERAGE',
      district: 'Miraflores',
      alertDetails: 'INTENTO BLOQUEADO: Menor de 14 años detectado. Alerta silenciosa emitida a MIMP (Línea 181) y DEMUNA para la asesora legal.'
    },
    {
      id: 'w-4',
      name: 'Jean Valjean',
      documentType: 'CE',
      documentNumber: '009876543',
      age: 35,
      status: 'APPROVED',
      district: 'San Isidro'
    },
    {
      id: 'w-5',
      name: 'Sofia Benavides',
      documentType: 'PTP',
      documentNumber: 'PTP99882211',
      age: 16,
      status: 'PENDING_APPROVAL',
      district: 'Comas',
      alertDetails: 'Adolescente (16 años) - Falta cargar autorización del MINTRA'
    }
  ]);

  // Filtros de la tabla
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [filterAge, setFilterAge] = useState<string>('TODOS');

  // Conectarse en tiempo real al canal SSE del Backend para Alertas SOS
  useEffect(() => {
    const sseUrl = `${(import.meta.env.VITE_API_URL as string) || 'http://localhost:3001/api/v1'}/services/sos/events`;
    console.log('[SSE] Conectando a:', sseUrl);
    const eventSource = new EventSource(sseUrl);

    eventSource.onopen = () => {
      setIsConnected(true);
      console.log('[SSE] Conectado exitosamente al canal de alertas.');
    };

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'CONNECTED') {
          console.log('[SSE]', payload.message);
        } else if (payload.type === 'SOS_ALERT') {
          console.log('[SSE] Nueva Alerta SOS recibida en vivo:', payload.data);
          const newAlert: SOSAlert = payload.data;
          setAlerts((prev) => [newAlert, ...prev]);
          setActiveSOS(newAlert);
        }
      } catch (err) {
        console.error('[SSE] Error al parsear mensaje de evento:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('[SSE] Error de conexión, intentando reconectar...', err);
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
      console.log('[SSE] Conexión SSE cerrada de forma segura.');
    };
  }, []);

  const handleResolveSOS = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'RESOLVED' } : a))
    );
    if (activeSOS?.id === id) {
      setActiveSOS(null);
    }
  };

  const simulateSOS = () => {
    const mockAlert: SOSAlert = {
      id: Math.random().toString(),
      latitude: -12.122485 + (Math.random() - 0.5) * 0.01,
      longitude: -77.031023 + (Math.random() - 0.5) * 0.01,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      user: {
        name: 'Carlos Mendoza (Simulado)',
        email: 'carlos@test.com',
      },
    };
    setAlerts((prev) => [mockAlert, ...prev]);
    setActiveSOS(mockAlert);
  };

  // Simular la aprobación manual del MINTRA de un menor pendiente (14-17)
  const handleApproveMintra = (id: string) => {
    setWorkers((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: 'APPROVED', alertDetails: undefined } : w))
    );
  };

  // Filtrado de la tabla de fiscalización
  const filteredWorkers = workers.filter((w) => {
    const matchesStatus = filterStatus === 'TODOS' || w.status === filterStatus;
    const matchesAge =
      filterAge === 'TODOS' ||
      (filterAge === 'CHILD' && w.age < 14) ||
      (filterAge === 'ADOLESCENT' && w.age >= 14 && w.age <= 17) ||
      (filterAge === 'ADULT' && w.age >= 18);
    return matchesStatus && matchesAge;
  });

  // Conteo de incidentes de trabajo infantil
  const blockedUnderageCount = workers.filter(w => w.status === 'BLOCKED_UNDERAGE').length;
  const pendingAdolescentCount = workers.filter(w => w.status === 'PENDING_APPROVAL').length;

  return (
    <div
      className={`min-h-screen bg-[#0F1117] text-[#F7FAFC] p-6 md:p-8 flex flex-col font-sans transition-all duration-300 ${
        activeSOS ? 'ring-4 ring-[#E53E3E]/70 shadow-[inset_0_0_40px_rgba(229,62,98,0.2)]' : ''
      }`}
      style={{ '--accent-color': 'var(--rol-fiscalizador)' } as React.CSSProperties}
    >
      {/* HEADER INSTITUCIONAL (MINTRA / MIMP) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-[#2D3748] pb-6">
        <div>
          <span className="text-[#6B46C1] uppercase text-xs font-mono font-black tracking-widest block mb-1">
            Ministerio de Trabajo y Promoción del Empleo • MINTRA / MIMP
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Mesa de Control de Fiscalización <span className="text-[#6B46C1] text-lg px-2.5 py-0.5 rounded-md bg-[#6B46C1]/10 border border-[#6B46C1]/20 font-mono">B2G</span>
          </h1>
          <p className="text-[#A0AEC0] text-sm mt-1 leading-relaxed">
            Consola oficial de supervisión de trabajo adolescente, prevención del trabajo infantil en la vía pública y control de emergencias SOS.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={simulateSOS}
            className="bg-[#E53E3E] hover:bg-[#E53E3E]/90 text-white font-extrabold text-xs py-3 px-5 rounded-xl shadow-[0_4px_20px_rgba(229,62,62,0.2)] hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
          >
            <AlertOctagonIcon size="sm" />
            Simular Alerta SOS
          </button>

          <div className="bg-[#171923] border border-[#2D3748] px-4 py-2.5 rounded-xl flex items-center gap-3 shadow-md">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-[#48BB78]' : 'bg-[#E53E3E]'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-[#48BB78]' : 'bg-[#E53E3E]'}`}></span>
            </span>
            <span className="text-[10px] font-mono font-bold tracking-wider text-[#A0AEC0]">
              {isConnected ? 'LIVE FEED CONECTADO' : 'LIVE FEED DESCONECTADO'}
            </span>
          </div>
        </div>
      </div>

      {/* SOS ALERTA COMPONENTE EN VIVO */}
      {activeSOS && (
        <div className="bg-[#E53E3E]/10 border border-[#E53E3E] rounded-2xl p-6 shadow-[0_0_30px_rgba(229,62,62,0.15)] mb-8 animate-pulse" data-testid="sos-active-panel">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <AlertOctagonIcon size="2xl" className="text-[#E53E3E] shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-black text-[#E53E3E] tracking-tight">ALERTA DE SEGURIDAD VIAL VIVO</h2>
                <p className="text-[#F7FAFC] font-semibold mt-1">
                  Trabajador en peligro inminente: <span className="underline font-bold text-white">{activeSOS.user?.name || 'Asistente Vial Autorizado'}</span>
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-[#A0AEC0] mt-2.5">
                  <span className="flex items-center gap-1"><MapPinIcon size="xs" /> Latitud: {activeSOS.latitude.toFixed(6)}</span>
                  <span className="flex items-center gap-1"><MapPinIcon size="xs" /> Longitud: {activeSOS.longitude.toFixed(6)}</span>
                  <span>Hora: {new Date(activeSOS.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${activeSOS.latitude},${activeSOS.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#171923] hover:bg-[#1A202C] text-white font-extrabold px-5 py-3 rounded-xl border border-[#2D3748] text-xs flex items-center justify-center gap-2"
              >
                <MapPinIcon size="sm" />
                Localizar en Google Maps
              </a>
              <button
                onClick={() => handleResolveSOS(activeSOS.id)}
                className="bg-[#E53E3E] hover:bg-[#E53E3E]/90 text-white font-black px-6 py-3 rounded-xl text-xs flex-grow md:flex-grow-0 transition-colors shadow-md"
              >
                Marcar como Atendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MÉTRICAS DE FISCALIZACIÓN DESTACADAS (Grid de Cards del Design System) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Card 1: 0% Trabajo Infantil (MAESTRO DS REQUERIDO) */}
        <div className="bg-[#171923] border border-[#2D3748] rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 h-1.5 w-full bg-[#48BB78]"></div>
          <span className="text-[10px] font-bold font-mono text-[#A0AEC0] uppercase tracking-wider block mb-2">INDICE DEL DISTRITO</span>
          <h3 className="text-3xl font-extrabold text-[#48BB78] font-mono leading-none">0%</h3>
          <span className="text-[13px] font-semibold text-white block mt-2">TRABAJO INFANTIL</span>
          <p className="text-xs text-[#A0AEC0] mt-1">
            0 casos activos detectados en semáforos. 100% verificado por KYC biométrico de RENIEC.
          </p>
        </div>

        {/* Card 2: Alertas de Bloqueo de Edad */}
        <div className={`bg-[#171923] border rounded-2xl p-6 shadow-xl relative overflow-hidden transition-all ${
          blockedUnderageCount > 0 ? 'border-[#E53E3E]/50' : 'border-[#2D3748]'
        }`}>
          <div className={`absolute top-0 right-0 h-1.5 w-full ${blockedUnderageCount > 0 ? 'bg-[#E53E3E]' : 'bg-[#2D3748]'}`}></div>
          <span className="text-[10px] font-bold font-mono text-[#A0AEC0] uppercase tracking-wider block mb-2">INCIDENCIAS GRAVES</span>
          <h3 className={`text-3xl font-extrabold font-mono leading-none ${blockedUnderageCount > 0 ? 'text-[#E53E3E]' : 'text-white'}`}>
            {blockedUnderageCount}
          </h3>
          <span className="text-[13px] font-semibold text-white block mt-2">INTENTOS BLOQUEADOS (<span className="text-red-400">&lt;14 años</span>)</span>
          <p className="text-xs text-[#A0AEC0] mt-1">
            Derivados de inmediato al Ministerio de la Mujer (MIMP) y la DEMUNA.
          </p>
        </div>

        {/* Card 3: Adolescentes por Aprobar MINTRA */}
        <div className="bg-[#171923] border border-[#2D3748] rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 h-1.5 w-full bg-[#F6AD55]"></div>
          <span className="text-[10px] font-bold font-mono text-[#A0AEC0] uppercase tracking-wider block mb-2">REGISTRO ADOLESCENTE</span>
          <h3 className="text-3xl font-extrabold text-[#F6AD55] font-mono leading-none">{pendingAdolescentCount}</h3>
          <span className="text-[13px] font-semibold text-white block mt-2">AUTORIZACIONES MINTRA PENDIENTES</span>
          <p className="text-xs text-[#A0AEC0] mt-1">
            Trabajadores de 14 a 17 años que esperan aprobación municipal del permiso legal.
          </p>
        </div>

        {/* Card 4: Total Trabajadores en Distrito */}
        <div className="bg-[#171923] border border-[#2D3748] rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 h-1.5 w-full bg-[#3B82F6]"></div>
          <span className="text-[10px] font-bold font-mono text-[#A0AEC0] uppercase tracking-wider block mb-2">PADRÓN GENERAL</span>
          <h3 className="text-3xl font-extrabold text-[#3B82F6] font-mono leading-none">{workers.length}</h3>
          <span className="text-[13px] font-semibold text-white block mt-2">TRABAJADORES AUDITADOS</span>
          <p className="text-xs text-[#A0AEC0] mt-1">
            Sujetos a georreferenciación y fiscalización activa en semáforos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* PARTE DERECHA: ALERTAS CRÍTICAS DE PROTECCIÓN INFANTIL (Color --semaforo-rojo) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#171923] border border-[#2D3748] rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-[#2D3748] pb-3">
              <ShieldIcon size="md" />
              Alertas de Seguridad Infantil (MIMP/DEMUNA)
            </h3>

            <div className="space-y-4">
              {workers.filter(w => w.status === 'BLOCKED_UNDERAGE' || w.status === 'PENDING_APPROVAL').map((worker) => (
                <div 
                  key={worker.id}
                  className={`p-4 rounded-xl border flex flex-col gap-2.5 ${
                    worker.status === 'BLOCKED_UNDERAGE'
                      ? 'bg-[#E53E3E]/5 border-[#E53E3E]/30 text-white'
                      : 'bg-[#F6AD55]/5 border-[#F6AD55]/30 text-white'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-extrabold text-white">{worker.name}</h4>
                      <p className="text-xs text-[#A0AEC0] font-mono mt-0.5">Doc: {worker.documentType} {worker.documentNumber} ({worker.age} años)</p>
                    </div>
                    <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full ${
                      worker.status === 'BLOCKED_UNDERAGE'
                        ? 'bg-[#E53E3E]/20 text-[#E53E3E]'
                        : 'bg-[#F6AD55]/20 text-[#F6AD55]'
                    }`}>
                      {worker.status === 'BLOCKED_UNDERAGE' ? 'CRÍTICO' : 'REVISIÓN'}
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-300 leading-relaxed bg-[#0F1117]/50 p-2.5 rounded-lg border border-white/5 font-mono">
                    {worker.alertDetails}
                  </p>

                  {worker.status === 'PENDING_APPROVAL' && worker.mintraDocUrl && (
                    <div className="flex gap-2 mt-1">
                      <a
                        href={worker.mintraDocUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-[#171923] hover:bg-[#1A202C] border border-[#2D3748] text-xs font-bold text-slate-300 px-3 py-2 rounded-lg flex-grow text-center flex items-center justify-center gap-1"
                      >
                        <DocumentTextIcon size="xs" />
                        Ver PDF MINTRA
                      </a>
                      <button
                        onClick={() => handleApproveMintra(worker.id)}
                        className="bg-[#6B46C1] hover:bg-[#6B46C1]/90 text-white text-xs font-extrabold px-3 py-2 rounded-lg flex items-center gap-1"
                      >
                        Aprobar
                        <CheckIcon size="xs" />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {workers.filter(w => w.status === 'BLOCKED_UNDERAGE' || w.status === 'PENDING_APPROVAL').length === 0 && (
                <div className="text-center py-8 text-[#A0AEC0] bg-[#0F1117]/30 border border-dashed border-[#2D3748] rounded-xl">
                  <p className="text-sm font-bold">Sin alertas pendientes.</p>
                  <p className="text-xs mt-1">Todo el personal está habilitado o bloqueado conforme a ley.</p>
                </div>
              )}
            </div>
          </div>

          {/* HISTORIAL SOS COMPARTIDO */}
          <div className="bg-[#171923] border border-[#2D3748] rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-[#2D3748] pb-3">
              <DocumentTextIcon size="md" />
              Incidentes SOS en el Distrito
            </h3>
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
              {alerts.length === 0 ? (
                <div className="text-center py-6 text-[#A0AEC0]">
                  <p className="text-xs">No se reportan llamadas de pánico en tiempo real.</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="bg-[#0F1117] p-3 rounded-lg border border-[#2D3748] text-xs flex justify-between items-center">
                    <div>
                      <p className="font-extrabold text-white">{alert.user?.name || 'Vigilante Vial'}</p>
                      <span className="text-[10px] text-[#A0AEC0] font-mono">{new Date(alert.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
                      alert.status === 'ACTIVE' ? 'bg-[#E53E3E]/20 text-[#E53E3E] animate-pulse' : 'bg-[#48BB78]/20 text-[#48BB78]'
                    }`}>
                      {alert.status === 'ACTIVE' ? 'SOS EN CURSO' : 'ATENDIDO'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* PARTE IZQUIERDA: TABLA GENERAL DE TRABAJADORES (Padrón de Fiscalización MINTRA) */}
        <div className="lg:col-span-2 bg-[#171923] border border-[#2D3748] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-[#2D3748] pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UsersIcon size="md" />
                  Padrón de Fiscalización de Trabajadores
                </h3>
                <p className="text-xs text-[#A0AEC0] mt-1">
                  Listado nominal de operarios registrados para control de edad, licencias e identidad.
                </p>
              </div>

              {/* FILTROS INTEGRADOS */}
              <div className="flex flex-wrap gap-2">
                <div className="flex flex-col">
                  <span className="text-[9px] font-mono font-bold text-[#A0AEC0] mb-1">FILTRAR ESTADO</span>
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-[#0F1117] border border-[#2D3748] text-xs text-slate-200 px-3 py-1.5 rounded-lg outline-none font-semibold focus:ring-1 focus:ring-[#6B46C1]"
                  >
                    <option value="TODOS">TODOS</option>
                    <option value="APPROVED">APROBADOS</option>
                    <option value="PENDING_APPROVAL">PENDIENTES</option>
                    <option value="BLOCKED_UNDERAGE">BLOQUEADOS</option>
                  </select>
                </div>

                <div className="flex flex-col">
                  <span className="text-[9px] font-mono font-bold text-[#A0AEC0] mb-1">GRUPO DE EDAD</span>
                  <select 
                    value={filterAge}
                    onChange={(e) => setFilterAge(e.target.value)}
                    className="bg-[#0F1117] border border-[#2D3748] text-xs text-slate-200 px-3 py-1.5 rounded-lg outline-none font-semibold focus:ring-1 focus:ring-[#6B46C1]"
                  >
                    <option value="TODOS">TODOS</option>
                    <option value="ADULT">ADULTOS (18+)</option>
                    <option value="ADOLESCENT">ADOLESCENTES (14-17)</option>
                    <option value="CHILD">NIÑOS (&lt;14)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* TABLA HTML EN FORMATO SERIO INSTITUCIONAL */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#2D3748] text-[#A0AEC0] text-xs font-mono font-bold">
                    <th className="pb-3 pl-2">TRABAJADOR</th>
                    <th className="pb-3">DOCUMENTO</th>
                    <th className="pb-3 text-center">EDAD</th>
                    <th className="pb-3">DISTRITO</th>
                    <th className="pb-3 text-right pr-2">ESTADO SEMÁFORO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D3748]/60">
                  {filteredWorkers.map((worker) => (
                    <tr 
                      key={worker.id}
                      className={`text-sm hover:bg-[#0F1117]/40 transition-colors ${
                        worker.status === 'BLOCKED_UNDERAGE' ? 'text-red-200' : 'text-slate-200'
                      }`}
                    >
                      <td className="py-4 pl-2 font-bold text-white">{worker.name}</td>
                      <td className="py-4 font-mono text-xs text-[#A0AEC0]">{worker.documentType} {worker.documentNumber}</td>
                      <td className="py-4 text-center font-bold font-mono">{worker.age}</td>
                      <td className="py-4 text-slate-300 font-semibold">{worker.district}</td>
                      <td className="py-4 text-right pr-2">
                        {worker.status === 'APPROVED' && <SemaforoBadge status="VERDE" size="sm" />}
                        {worker.status === 'PENDING_APPROVAL' && <SemaforoBadge status="AMARILLO" size="sm" />}
                        {worker.status === 'BLOCKED_UNDERAGE' && <SemaforoBadge status="ROJO" size="sm" />}
                      </td>
                    </tr>
                  ))}

                  {filteredWorkers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-[#A0AEC0] font-bold">
                        Ningún trabajador coincide con los filtros aplicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* MENSAJE DE AUTORIZACIÓN LEGAL */}
          <div className="mt-6 p-4 bg-[#6B46C1]/5 border border-[#6B46C1]/20 rounded-xl flex items-center justify-between text-xs text-slate-300 leading-relaxed font-mono">
            <span className="flex items-center gap-1.5">
              <ScaleIcon size="sm" />
              Auditoría legal regulada por MINTRA, MIMP y Defensoría de Miraflores.
            </span>
            <span className="text-[#6B46C1] font-bold">LEY N° 27337</span>
          </div>
        </div>
      </div>
    </div>
  );
}
