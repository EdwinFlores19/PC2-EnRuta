import React from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import CandidateView from './components/CandidateView';
import EmployerView from './components/EmployerView';
import WorkerDashboard from './components/WorkerDashboard';
import ClientMap from './components/ClientMap';
import FintechView from './components/FintechView';

export default function App(): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();

  // Simulación rápida de logout para mantener la consistencia
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const getLinkClass = (path: string, accentColorClass: string) => {
    return `flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
      isActive(path)
        ? `bg-slate-800 text-white shadow-sm ring-1 ring-white/10 ${accentColorClass}`
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
    }`;
  };

  return (
    <div className="min-h-screen bg-[#070A13] text-slate-100 flex flex-col font-sans antialiased">
      {/* HEADER / NAVBAR GLOBAL */}
      <header className="bg-[#0B0F19]/90 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="bg-gradient-to-tr from-brand-blue to-brand-purple p-2 rounded-xl shadow-glow-green">
                <span className="text-xl">🚦</span>
              </div>
              <span className="text-xl font-black text-white tracking-tight group-hover:text-blue-400 transition-colors">
                En<span className="text-blue-500">Ruta</span>
              </span>
            </Link>
            
            <nav className="hidden xl:flex items-center gap-2">
              <Link to="/dashboard" className={getLinkClass('/dashboard', 'text-blue-400')}>
                🏠 Panel Admin
              </Link>
              <Link to="/candidate" className={getLinkClass('/candidate', 'text-purple-400')}>
                🧹 CV IA Coach
              </Link>
              <Link to="/employer" className={getLinkClass('/employer', 'text-indigo-400')}>
                💼 Búsqueda RAG
              </Link>
              <Link to="/chambea-ahora" className={getLinkClass('/chambea-ahora', 'text-emerald-400 border-l border-slate-800 pl-4')}>
                💚 Chambea Ahora!
              </Link>
              <Link to="/buscar" className={getLinkClass('/buscar', 'text-amber-400')}>
                📍 Buscar Servicios
              </Link>
              <Link to="/payments" className={getLinkClass('/payments', 'text-cyan-400')}>
                📶 POS & Pagos
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-bold text-slate-400 hover:text-white px-4 py-2 rounded-xl hover:bg-slate-900 transition-all"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-all"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* COMPACT MOBILE MENU DE ADVERTENCIA */}
      <div className="xl:hidden bg-slate-900/80 border-b border-slate-800 py-2.5 px-4 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-2">
        <Link to="/dashboard" className={getLinkClass('/dashboard', 'text-blue-400')}>Panel Admin</Link>
        <Link to="/candidate" className={getLinkClass('/candidate', 'text-purple-400')}>CV IA Coach</Link>
        <Link to="/employer" className={getLinkClass('/employer', 'text-indigo-400')}>Búsqueda RAG</Link>
        <Link to="/chambea-ahora" className={getLinkClass('/chambea-ahora', 'text-emerald-400')}>Chambea Ahora!</Link>
        <Link to="/buscar" className={getLinkClass('/buscar', 'text-amber-400')}>Buscar</Link>
        <Link to="/payments" className={getLinkClass('/payments', 'text-cyan-400')}>POS & Pagos</Link>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex flex-col justify-center">
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/login" element={<LoginPlaceholder />} />
          <Route path="/dashboard" element={<DashboardPlaceholder />} />
          <Route path="/candidate" element={<CandidateView />} />
          <Route path="/employer" element={<EmployerView />} />
          <Route path="/chambea-ahora" element={<WorkerDashboard />} />
          <Route path="/buscar" element={<ClientMap />} />
          <Route path="/payments" element={<FintechView />} />
        </Routes>
      </main>

      {/* FOOTER GLOBAL */}
      <footer className="bg-[#0B0F19] border-t border-slate-950 py-8 text-center text-sm text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <p className="font-semibold text-slate-400">🚦 EnRuta — Transformación Social Vial con IA & Fintech</p>
          <p>&copy; {new Date().getFullYear()} — PC2 Boilerplate Full-Stack. Ecosistema Agéntico SRE. Fiscalización MINTRA/MIMP.</p>
        </div>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPONENTES VISTA INTERNOS (REDDISEÑADOS)
// ─────────────────────────────────────────────

function HomeView(): React.JSX.Element {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto py-8">
      {/* HERO SECTION */}
      <div className="text-center space-y-6 mb-16">
        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider font-mono">
          🚀 TECNOLOGÍA CON IMPACTO SOCIAL REAL
        </span>
        <h1 className="text-5xl font-black text-white tracking-tight sm:text-6xl bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Plataforma EnRuta
        </h1>
        <p className="text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
          Un sistema on-demand inteligente enfocado en la **formalización, capacitación y salud financiera** para asistentes viales independientes en el Perú, garantizando la erradicación del trabajo infantil.
        </p>
        <div className="flex justify-center gap-4 pt-2">
          <Link
            to="/dashboard"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all text-sm"
          >
            🛡️ Ir al Panel de Control (Admin)
          </Link>
          <a
            href="https://github.com/EdwinFlores19/PC2-Boilerplate-Puente"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-6 py-3.5 rounded-xl transition-all text-sm"
          >
            Ver Código Fuente
          </a>
        </div>
      </div>

      {/* METRICAS DE CONFIANZA / IMPACTO */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
        <div className="bg-[#101625] border border-slate-800/80 p-5 rounded-2xl text-center">
          <span className="text-3xl block mb-1">🧹</span>
          <span className="text-3xl font-black text-white font-mono block">350+</span>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wide">Trabajadores Activos</span>
        </div>
        <div className="bg-[#101625] border border-slate-800/80 p-5 rounded-2xl text-center">
          <span className="text-3xl block mb-1">🛡️</span>
          <span className="text-3xl font-black text-emerald-400 font-mono block">0%</span>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wide">Trabajo Infantil</span>
        </div>
        <div className="bg-[#101625] border border-slate-800/80 p-5 rounded-2xl text-center">
          <span className="text-3xl block mb-1">🎓</span>
          <span className="text-3xl font-black text-purple-400 font-mono block">4,200+</span>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wide">Cursos Completados</span>
        </div>
        <div className="bg-[#101625] border border-slate-800/80 p-5 rounded-2xl text-center">
          <span className="text-3xl block mb-1">💳</span>
          <span className="text-3xl font-black text-cyan-400 font-mono block">S/. 12.5K</span>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wide">Procesado POS</span>
        </div>
      </div>

      {/* CARDS VISUALES SEGMENTADAS POR ROL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD TRABAJADOR */}
        <div 
          onClick={() => navigate('/chambea-ahora')}
          className="bg-gradient-to-b from-[#132321] to-[#101625] border border-emerald-500/20 hover:border-emerald-500/40 rounded-3xl p-6 shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer group flex flex-col justify-between h-72"
        >
          <div>
            <div className="bg-emerald-500/10 text-emerald-400 h-12 w-12 rounded-2xl flex items-center justify-center text-2xl font-bold mb-4">
              🧹
            </div>
            <h3 className="font-extrabold text-white text-xl group-hover:text-emerald-400 transition-colors">
              Soy Trabajador Vial
            </h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Accede a tu panel "Chambea Ahora!", sube tu semáforo de formalización con cursos y obtén micro-créditos.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-4">
            Ir a Chambea Ahora! &rarr;
          </span>
        </div>

        {/* CARD CLIENTE */}
        <div 
          onClick={() => navigate('/buscar')}
          className="bg-gradient-to-b from-[#211E15] to-[#101625] border border-amber-500/20 hover:border-amber-500/40 rounded-3xl p-6 shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer group flex flex-col justify-between h-72"
        >
          <div>
            <div className="bg-amber-500/10 text-amber-400 h-12 w-12 rounded-2xl flex items-center justify-center text-2xl font-bold mb-4">
              📍
            </div>
            <h3 className="font-extrabold text-white text-xl group-hover:text-amber-400 transition-colors">
              Necesito Asistencia
            </h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Encuentra asistentes viales de confianza geolocalizados en semáforos cerca de ti y califícalos con estrellas.
            </p>
          </div>
          <span className="text-xs font-bold text-amber-400 flex items-center gap-1 mt-4">
            Buscar Trabajadores &rarr;
          </span>
        </div>

        {/* CARD RECLUTADOR */}
        <div 
          onClick={() => navigate('/employer')}
          className="bg-gradient-to-b from-[#1E1627] to-[#101625] border border-purple-500/20 hover:border-purple-500/40 rounded-3xl p-6 shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer group flex flex-col justify-between h-72"
        >
          <div>
            <div className="bg-purple-500/10 text-purple-400 h-12 w-12 rounded-2xl flex items-center justify-center text-2xl font-bold mb-4">
              💼
            </div>
            <h3 className="font-extrabold text-white text-xl group-hover:text-purple-400 transition-colors">
              Soy Empresa / Car Wash
            </h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Busca talento calificado conversacionalmente mediante nuestro motor NLP de traducción de habilidades informales.
            </p>
          </div>
          <span className="text-xs font-bold text-purple-400 flex items-center gap-1 mt-4">
            Reclutar Personal &rarr;
          </span>
        </div>

      </div>
    </div>
  );
}

function LoginPlaceholder(): React.JSX.Element {
  return (
    <div className="max-w-md w-full mx-auto bg-[#101625] rounded-3xl border border-slate-800 shadow-2xl p-8 my-12">
      <div className="text-center mb-6">
        <span className="text-4xl">🔐</span>
        <h2 className="text-2xl font-black text-white mt-3">Iniciar Sesión</h2>
        <p className="text-slate-400 text-xs mt-1">Ingresa tus credenciales autorizadas del sistema</p>
      </div>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Correo Electrónico</label>
          <input
            type="email"
            placeholder="correo@ejemplo.com"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            defaultValue="admin@test.com"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Contraseña</label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            defaultValue="Admin123!"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-bold shadow-md hover:shadow-blue-500/10 transition-all mt-6"
        >
          Ingresar al Sistema
        </button>
      </form>
    </div>
  );
}

function DashboardPlaceholder(): React.JSX.Element {
  return (
    <div className="space-y-8">
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-3xl font-black text-white tracking-tight">Panel de Control General (Admin)</h1>
        <p className="text-sm text-slate-400 mt-1">Métricas operacionales y monitoreo fiscalizador MINTRA.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-[#101625] shadow-xl border border-slate-800/80 rounded-2xl p-6">
          <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estatus del Servidor REST</dt>
          <dd className="mt-2 text-2xl font-black text-emerald-400 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            Express Activo
          </dd>
        </div>
        <div className="bg-[#101625] shadow-xl border border-slate-800/80 rounded-2xl p-6">
          <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider">Conexión Supabase</dt>
          <dd className="mt-2 text-2xl font-black text-blue-400 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse inline-block" />
            DB Sincronizada
          </dd>
        </div>
        <div className="bg-[#101625] shadow-xl border border-slate-800/80 rounded-2xl p-6">
          <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prevención Infantil</dt>
          <dd className="mt-2 text-2xl font-black text-purple-400">100% Seguro</dd>
        </div>
      </div>

      <div className="bg-[#101625] border border-slate-800 rounded-3xl p-6 md:p-8 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          📋 Datos de Control y Fiscalización
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          Este módulo está diseñado para la fiscalización del cumplimiento de regulaciones viales de superación de trabajadores informales en Perú.
        </p>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-300">
          <strong>Tip de Administración:</strong> Usa el generador dinámico `npx tsx scripts/generate_crud.ts &lt;Entidad&gt;` para automatizar nuevas tablas y pegarlas directamente aquí.
        </div>
      </div>
    </div>
  );
}
