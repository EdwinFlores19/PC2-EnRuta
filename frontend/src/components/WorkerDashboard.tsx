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
  let trafficLightBg = 'bg-[#ef4444] shadow-[0_0_15px_rgba(239,68,68,0.5)]';
  let trafficLightText = 'text-[#ef4444]';

  if (totalScore >= 75) {
    trafficLightColor = '🟢';
    trafficLightLabel = 'Confiable / Formalizado';
    trafficLightBg = 'bg-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.5)]';
    trafficLightText = 'text-[#10b981]';
  } else if (totalScore >= 40) {
    trafficLightColor = '🟡';
    trafficLightLabel = 'Verificado / Capacitándose';
    trafficLightBg = 'bg-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.5)]';
    trafficLightText = 'text-[#f59e0b]';
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
      className="min-h-screen bg-[#020617] text-slate-50 p-6 md:p-8 flex flex-col font-sans"
      data-testid="worker-dashboard-container"
    >
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-white/10 pb-6">
        <div>
          <span className="text-[#06b6d4] uppercase text-xs tracking-widest font-mono font-bold block mb-1">
            Portal del Trabajador
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Chambea Ahora! — <span className="text-[#06b6d4]">Meta Personal</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Esta sección es 100% privada. Tu semáforo interno te ayuda a capacitarte y mejorar tus finanzas.
          </p>
        </div>
        <div className="bg-[#0f172a]/60 border border-white/10 px-4 py-2.5 rounded-xl flex items-center gap-3">
          <div className="relative flex h-3.5 w-3.5">
            <div className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${trafficLightBg.split(' ')[0]}`}></div>
            <div className={`relative inline-flex rounded-full h-3.5 w-3.5 ${trafficLightBg.split(' ')[0]}`}></div>
          </div>
          <span className="text-xs font-mono font-bold text-slate-300">MODO GAMIFICACIÓN ACTIVO</span>
        </div>
      </div>

      {/* SECCIÓN DEL SEMÁFORO PRINCIPAL */}
      <div className="bg-[#0f172a]/45 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.50)] p-6 md:p-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Luz de Semáforo */}
          <div className="flex flex-col items-center justify-center text-center md:border-r md:border-white/10 py-4">
            <div className="flex flex-col gap-3 bg-black/40 p-4 rounded-3xl border border-white/5 w-24 items-center">
              {/* Luz Roja */}
              <div className={`w-10 h-10 rounded-full transition-all duration-300 ${totalScore < 40 ? 'bg-[#ef4444] shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'bg-red-950/40'}`}></div>
              {/* Luz Amarilla */}
              <div className={`w-10 h-10 rounded-full transition-all duration-300 ${totalScore >= 40 && totalScore < 75 ? 'bg-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.8)]' : 'bg-amber-950/40'}`}></div>
              {/* Luz Verde */}
              <div className={`w-10 h-10 rounded-full transition-all duration-300 ${totalScore >= 75 ? 'bg-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.8)]' : 'bg-emerald-950/40'}`}></div>
            </div>
            <div className="mt-4">
              <span className={`text-xs font-bold uppercase tracking-wider font-mono ${trafficLightText}`}>
                Semáforo Personal
              </span>
              <h3 className="text-lg font-extrabold text-white block mt-0.5" data-testid="worker-traffic-light">
                {trafficLightColor} {trafficLightLabel}
              </h3>
            </div>
          </div>

          {/* Barra de Progreso y Puntaje */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <span className="text-sm text-slate-400 font-medium">Meta de Formalización</span>
                  <h2 className="text-4xl font-extrabold font-mono tracking-tight text-white mt-1" data-testid="worker-score">
                    {totalScore} <span className="text-lg text-slate-500">/ 100 pts</span>
                  </h2>
                </div>
                <span className={`text-sm font-bold font-mono ${trafficLightText}`}>
                  {totalScore}% Completado
                </span>
              </div>
              <div className="w-full bg-slate-800 h-4 rounded-full overflow-hidden border border-white/5">
                <div
                  className={`h-full transition-all duration-500 ease-out ${totalScore >= 75 ? 'bg-[#10b981]' : totalScore >= 40 ? 'bg-[#f59e0b]' : 'bg-[#ef4444]'}`}
                  style={{ width: `${totalScore}%` }}
                ></div>
              </div>
            </div>

            {/* Tres Pilares Resumen */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-black/30 p-3 rounded-xl border border-white/5 text-center">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Validación Legal</span>
                <span className="text-base font-extrabold font-mono mt-1 block text-slate-200" data-testid="meta-legal-progress">
                  {legalScore}/30 pts
                </span>
              </div>
              <div className="bg-black/30 p-3 rounded-xl border border-white/5 text-center">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Capacitación</span>
                <span className="text-base font-extrabold font-mono mt-1 block text-[#8b5cf6]" data-testid="meta-capacitacion-progress">
                  {capScore}/40 pts
                </span>
              </div>
              <div className="bg-black/30 p-3 rounded-xl border border-white/5 text-center">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Manejo Financiero</span>
                <span className="text-base font-extrabold font-mono mt-1 block text-[#06b6d4]" data-testid="meta-finanzas-progress">
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
        <div className="bg-[#0f172a]/45 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-[#8b5cf6]">
              🎓 Cursos de Capacitación (Peso: 40%)
            </h3>
            <span className="text-xs bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/20 px-2 py-1 rounded-full font-bold">
              Subir Semáforo
            </span>
          </div>

          <div className="space-y-4">
            {capMetrics.map((item) => (
              <div
                key={item.id}
                className="bg-black/20 rounded-xl border border-white/5 p-4 flex items-center justify-between hover:border-white/10 transition-colors"
                data-testid={item.completed ? 'course-card-completed' : 'course-card-active'}
              >
                <div>
                  <h4 className="text-sm font-semibold text-white">{item.name}</h4>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${item.completed ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[#f59e0b]/20 text-[#f59e0b]'}`}>
                      {item.completed ? 'Completo (+8 pts)' : 'Pendiente (+8 pts)'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Capacitación</span>
                  </div>
                </div>
                {!item.completed && (
                  <button
                    onClick={() => handleCompleteCourse(item.id)}
                    className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-bold text-xs py-2 px-3 rounded-lg hover:shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all duration-300 active:scale-95"
                  >
                    Estudiar Curso
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* COLUMNA DERECHA: METAS FINANCIERAS Y CRÉDITO */}
        <div className="bg-[#0f172a]/45 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2 text-[#06b6d4]">
                💰 Salud Financiera & Crédito (Peso: 30%)
              </h3>
              <span className="text-xs bg-[#06b6d4]/10 text-[#06b6d4] border border-[#06b6d4]/20 px-2 py-1 rounded-full font-bold">
                Finanzas Clave
              </span>
            </div>

            {/* Ahorros */}
            <div className="bg-black/30 p-4 rounded-xl border border-white/5 mb-4" data-testid="saving-goal-progress">
              <div className="flex justify-between text-xs font-mono font-bold mb-1.5 text-slate-400">
                <span>META DE AHORRO ACTIVA</span>
                <span className="text-[#06b6d4]">60%</span>
              </div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-semibold text-white">Comprar herramientas eléctricas</span>
                <span className="text-sm font-mono font-bold text-[#06b6d4]">$120 / $200</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-[#06b6d4] h-full" style={{ width: '60%' }}></div>
              </div>
            </div>

            {/* Lista Financiera */}
            <div className="space-y-4">
              {finMetrics.map((item) => (
                <div
                  key={item.id}
                  className="bg-black/20 rounded-xl border border-white/5 p-4 flex items-center justify-between hover:border-white/10 transition-colors"
                >
                  <div>
                    <h4 className="text-sm font-semibold text-white">{item.name}</h4>
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-black/40 text-slate-300 mt-1.5 inline-block">
                      {item.completed ? 'Completo (+10 pts)' : 'Falta pagar cuota (+10 pts)'}
                    </span>
                  </div>
                  {!item.completed && (
                    <button
                      onClick={() => handlePayLoan(item.id)}
                      className="bg-[#06b6d4] hover:bg-[#0891b2] text-[#020617] font-extrabold text-xs py-2 px-3 rounded-lg hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all duration-300 active:scale-95"
                    >
                      Pagar Cuota
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* BENEFICIOS DEL SEMÁFORO EN VERDE */}
          <div className="mt-6 bg-[#10b981]/5 border border-[#10b981]/20 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <h4 className="text-sm font-bold text-[#10b981]">¡Beneficios Nivel Verde Desbloqueados!</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Al estar en nivel Verde, accedes a micro-créditos de $500 con tasa preferencial del 4.5% y micro-seguros gratis.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BOTÓN PARA REVISAR TU PERFIL PÚBLICO */}
      <div className="mt-8 text-center text-xs text-slate-500 font-mono">
        Recuerda: Tu Semáforo es una herramienta interna de capacitación y financiamiento. Ningún cliente puede ver este color.
      </div>
    </div>
  );
}
