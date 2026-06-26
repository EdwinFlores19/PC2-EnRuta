import React, { useState } from 'react';


interface MetricDetail {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  completed: boolean;
}

export default function WorkerDashboard(): React.JSX.Element {
  // Simulamos el progreso interactivo para el MVP
  const [legalMetrics] = useState<MetricDetail[]>([
    { id: 'l1', name: 'Identidad Verificada (DNI + Biometría)', score: 12, maxScore: 12, completed: true },
    { id: 'l2', name: 'Verificación de Antecedentes', score: 12, maxScore: 12, completed: true },
    { id: 'l3', name: 'Recibo de Servicios (Domicilio)', score: 6, maxScore: 6, completed: true },
  ]);

  const [capMetrics, setCapMetrics] = useState<MetricDetail[]>([
    { id: 'c1', name: 'Curso de Finanzas Personales 1', score: 12, maxScore: 12, completed: true },
    { id: 'c2', name: 'Curso de Crédito Responsable 1', score: 12, maxScore: 12, completed: true },
    { id: 'c3', name: 'Seguridad y Salud en el Trabajo', score: 8, maxScore: 8, completed: true },
    { id: 'c4', name: 'Atención al Cliente e Imagen Profesional', score: 0, maxScore: 8, completed: false },
  ]);

  const [finMetrics, setFinMetrics] = useState<MetricDetail[]>([
    { id: 'f1', name: 'Registro Semanal de Flujo de Caja (4 semanas)', score: 10, maxScore: 10, completed: true },
    { id: 'f2', name: 'Meta de Ahorro Activa y Frecuente', score: 10, maxScore: 10, completed: true },
    { id: 'f3', name: 'Historial de Pago Limpio de Micro-crédito', score: 0, maxScore: 10, completed: false },
  ]);

  // Cálculo de puntajes en tiempo real
  const legalScore = legalMetrics.reduce((acc, curr) => acc + curr.score, 0);
  const capScore = capMetrics.reduce((acc, curr) => acc + curr.score, 0);
  const finScore = finMetrics.reduce((acc, curr) => acc + curr.score, 0);
  const totalScore = legalScore + capScore + finScore;

  // Lógica del semáforo
  let trafficLightColor = '🔴';
  let trafficLightLabel = 'Reciente / Perfil Básico';
  let trafficLightBg = 'bg-red-500 shadow-glow-red border-red-400/50';
  let trafficLightText = 'text-red-400';

  if (totalScore >= 75) {
    trafficLightColor = '🟢';
    trafficLightLabel = 'Confiable / Formalizado';
    trafficLightBg = 'bg-emerald-500 shadow-glow-green border-emerald-400/50';
    trafficLightText = 'text-emerald-400';
  } else if (totalScore >= 40) {
    trafficLightColor = '🟡';
    trafficLightLabel = 'Verificado / Capacitándose';
    trafficLightBg = 'bg-amber-500 shadow-glow-yellow border-amber-400/50';
    trafficLightText = 'text-amber-400';
  }

  // Interacción: Completar curso pendiente para subir puntaje
  const handleCompleteCourse = (id: string) => {
    setCapMetrics((prev) =>
      prev.map((m) => (m.id === id ? { ...m, score: m.maxScore, completed: true } : m))
    );
  };

  // Interacción: Simular pago de micro-crédito
  const handlePayLoan = (id: string) => {
    setFinMetrics((prev) =>
      prev.map((m) => (m.id === id ? { ...m, score: m.maxScore, completed: true } : m))
    );
  };

  return (
    <div
      className="min-h-screen bg-[#070A13] text-slate-100 p-6 md:p-8 flex flex-col font-sans"
      data-testid="worker-dashboard-container"
    >
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-800 pb-6">
        <div>
          <span className="text-[#06b6d4] uppercase text-xs tracking-widest font-mono font-bold block mb-1">
            ✨ METAS Y AUTOSUPERACIÓN PERSONAL
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Chambea Ahora! — <span className="text-[#06b6d4]">Mi Progreso</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
            Esta sección es 100% privada. Tu semáforo interno te ayuda a capacitarte, organizar tus finanzas y acceder a mejores beneficios económicos.
          </p>
        </div>
        <div className="bg-[#101625]/60 border border-slate-800 px-4 py-2.5 rounded-2xl flex items-center gap-3 self-start md:self-center">
          <div className="relative flex h-3 w-3">
            <div className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${trafficLightBg.split(' ')[0]}`}></div>
            <div className={`relative inline-flex rounded-full h-3 w-3 ${trafficLightBg.split(' ')[0]}`}></div>
          </div>
          <span className="text-xs font-mono font-bold text-slate-300">MODO GAMIFICACIÓN ACTIVO</span>
        </div>
      </div>

      {/* SECCIÓN DEL SEMÁFORO PRINCIPAL */}
      <div className="bg-[#101625] border border-slate-800 rounded-3xl shadow-2xl p-6 md:p-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          
          {/* Luz de Semáforo */}
          <div className="flex flex-col items-center justify-center text-center md:border-r md:border-slate-800/80 py-4 md:pr-8">
            <div className="flex flex-col gap-4 bg-[#070A13] p-5 rounded-[2.5rem] border border-slate-800/60 w-28 items-center shadow-inner">
              {/* Luz Roja */}
              <div className={`w-11 h-11 rounded-full transition-all duration-300 ${totalScore < 40 ? 'bg-[#ef4444] shadow-glow-red border-2 border-red-400/40' : 'bg-red-950/20 border border-red-950/10'}`}></div>
              {/* Luz Amarilla */}
              <div className={`w-11 h-11 rounded-full transition-all duration-300 ${totalScore >= 40 && totalScore < 75 ? 'bg-[#f59e0b] shadow-glow-yellow border-2 border-amber-400/40' : 'bg-amber-950/20 border border-amber-950/10'}`}></div>
              {/* Luz Verde */}
              <div className={`w-11 h-11 rounded-full transition-all duration-300 ${totalScore >= 75 ? 'bg-[#10b981] shadow-glow-green border-2 border-emerald-400/40' : 'bg-emerald-950/20 border border-emerald-950/10'}`}></div>
            </div>
            <div className="mt-5 space-y-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${trafficLightText}`}>
                Mi Nivel Actual
              </span>
              <h3 className="text-lg font-extrabold text-white block" data-testid="worker-traffic-light">
                {trafficLightColor} {trafficLightLabel}
              </h3>
            </div>
          </div>

          {/* Barra de Progreso y Puntaje */}
          <div className="md:col-span-2 space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wide font-mono">Meta de Formalización</span>
                  <h2 className="text-4xl font-extrabold font-mono tracking-tight text-white mt-1" data-testid="worker-score">
                    {totalScore} <span className="text-lg text-slate-500">/ 100 pts</span>
                  </h2>
                </div>
                <span className={`text-sm font-bold font-mono ${trafficLightText}`}>
                  {totalScore}% Completado
                </span>
              </div>
              <div className="w-full bg-slate-800/55 h-4 rounded-full overflow-hidden border border-white/5 shadow-inner">
                <div
                  className={`h-full transition-all duration-500 ease-out rounded-full ${totalScore >= 75 ? 'bg-emerald-500' : totalScore >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${totalScore}%` }}
                ></div>
              </div>
            </div>

            {/* Tres Pilares Resumen */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="bg-[#070A13] p-4 rounded-2xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider font-mono">Validación Legal</span>
                <span className="text-lg font-black font-mono mt-1.5 block text-slate-200" data-testid="meta-legal-progress">
                  {legalScore}/30 pts
                </span>
              </div>
              <div className="bg-[#070A13] p-4 rounded-2xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider font-mono">Capacitación</span>
                <span className="text-lg font-black font-mono mt-1.5 block text-[#8b5cf6]" data-testid="meta-capacitacion-progress">
                  {capScore}/40 pts
                </span>
              </div>
              <div className="bg-[#070A13] p-4 rounded-2xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider font-mono">Salud Financiera</span>
                <span className="text-lg font-black font-mono mt-1.5 block text-[#06b6d4]" data-testid="meta-finanzas-progress">
                  {finScore}/30 pts
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* DOS COLUMNAS DETALLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* COLUMNA IZQUIERDA: CURSOS Y CAPACITACIONES */}
        <div className="bg-[#101625] border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
              <h3 className="text-xl font-bold flex items-center gap-2 text-[#8b5cf6]">
                🎓 Cursos de Capacitación (40%)
              </h3>
              <span className="text-[10px] bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/20 px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wider font-mono">
                Subir Semáforo
              </span>
            </div>

            <div className="space-y-4">
              {capMetrics.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-950/40 rounded-2xl border border-slate-800 p-4.5 flex items-center justify-between hover:border-slate-700 transition-colors"
                  data-testid={item.completed ? 'course-card-completed' : 'course-card-active'}
                >
                  <div className="pr-4">
                    <h4 className="text-sm font-extrabold text-white leading-tight">{item.name}</h4>
                    <div className="flex items-center gap-2.5 mt-2">
                      <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded ${
                        item.completed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {item.completed ? 'COMPLETO (+8 pts)' : 'PENDIENTE (+8 pts)'}
                      </span>
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider font-mono">Capacitación</span>
                    </div>
                  </div>
                  {!item.completed && (
                    <button
                      onClick={() => handleCompleteCourse(item.id)}
                      className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-black text-xs py-2.5 px-4 rounded-xl hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all shrink-0"
                    >
                      Estudiar Curso
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: METAS FINANCIERAS Y CRÉDITO */}
        <div className="bg-[#101625] border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
              <h3 className="text-xl font-bold flex items-center gap-2 text-[#06b6d4]">
                💰 Salud Financiera & Crédito (30%)
              </h3>
              <span className="text-[10px] bg-[#06b6d4]/10 text-[#06b6d4] border border-[#06b6d4]/20 px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wider font-mono">
                Finanzas Clave
              </span>
            </div>

            {/* Ahorros */}
            <div className="bg-[#070A13] p-5 rounded-2xl border border-slate-800 mb-6" data-testid="saving-goal-progress">
              <div className="flex justify-between text-[10px] font-mono font-bold mb-2 text-slate-400 uppercase tracking-wider">
                <span>META DE AHORRO ACTIVA</span>
                <span className="text-[#06b6d4]">60%</span>
              </div>
              <div className="flex justify-between items-end mb-3">
                <span className="text-sm font-extrabold text-white">Comprar herramientas eléctricas</span>
                <span className="text-sm font-mono font-bold text-[#06b6d4]">S/. 120 / S/. 200</span>
              </div>
              <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#06b6d4] h-full" style={{ width: '60%' }}></div>
              </div>
            </div>

            {/* Lista Financiera */}
            <div className="space-y-4">
              {finMetrics.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-950/40 rounded-2xl border border-slate-800 p-4.5 flex items-center justify-between hover:border-slate-700 transition-colors"
                >
                  <div className="pr-4">
                    <h4 className="text-sm font-extrabold text-white leading-tight">{item.name}</h4>
                    <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-[#070A13] text-slate-300 mt-2 inline-block">
                      {item.completed ? 'COMPLETO (+10 pts)' : 'PENDIENTE DE PAGO (+10 pts)'}
                    </span>
                  </div>
                  {!item.completed && (
                    <button
                      onClick={() => handlePayLoan(item.id)}
                      className="bg-[#06b6d4] hover:bg-[#0891b2] text-[#070A13] font-black text-xs py-2.5 px-4 rounded-xl hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all shrink-0"
                    >
                      Pagar Cuota
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* BENEFICIOS DEL SEMÁFORO EN VERDE */}
          <div className="bg-[#10b981]/5 border border-emerald-500/20 rounded-2xl p-5 flex items-start gap-4">
            <span className="text-3xl">🎉</span>
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-emerald-400">¡Beneficios Nivel Verde Desbloqueados!</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Al consolidar tu Semáforo en **Verde**, desbloqueas de inmediato micro-créditos de hasta S/. 500 con tasa de interés preferencial (4.5%) y micro-seguros gratuitos respaldados por MINTRA.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* BOTÓN PARA REVISAR TU PERFIL PÚBLICO */}
      <div className="mt-10 text-center text-xs text-slate-500 font-mono font-bold tracking-wide">
        🛡️ Recuerda: Tu Semáforo es una herramienta de uso interno privado de formalización. Los peatones y conductores calificados no ven el color de tu semáforo personal.
      </div>
    </div>
  );
}
