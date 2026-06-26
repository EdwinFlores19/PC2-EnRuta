import React from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import CandidateView from './components/CandidateView';
import EmployerView from './components/EmployerView';
import WorkerDashboard from './components/WorkerDashboard';
import ClientMap from './components/ClientMap';
import FintechView from './components/FintechView';
import OnboardingView from './components/OnboardingView';
import { MetricCard, RoleCard, Button, Card } from './components/SemaforoComponents.js';
import SemiChatbot, { ChatbotRole } from './components/SemiChatbot';

export default function App(): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  // Navbar link classes conforming to design system (uppercase, 13px font size equivalent to text-[13px])
  const getLinkClass = (path: string, activeColor: string) => {
    return `flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold uppercase tracking-wider transition-all duration-150 ${
      isActive(path)
        ? `bg-[#1A202C] text-[#F7FAFC] shadow-sm border border-[#2D3748] ${activeColor}`
        : 'text-[#A0AEC0] hover:text-[#F7FAFC]'
    }`;
  };

  // Detectar el rol del usuario logueado en caliente para Ruti
  let detectedRole: ChatbotRole = 'cliente'; // Por defecto es conductor/cliente (invitado)
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed.role === 'CANDIDATE' || parsed.role === 'WORKER') {
        detectedRole = 'trabajador';
      } else if (parsed.role === 'EMPLOYER') {
        detectedRole = 'employer';
      } else if (parsed.role === 'ADMIN') {
        detectedRole = 'fiscalizador';
      }
    }
  } catch (err) {
    console.warn('Error al parsear el rol del usuario para Ruti:', err);
  }

  return (
    <div className="min-h-screen bg-[#0F1117] text-[#F7FAFC] flex flex-col font-sans antialiased relative">
      {/* 1. MANDATORY Navbar COMPONENT */}
      <header className="bg-[#1A202C] border-b border-[#2D3748] sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-[#3B82F6] hover:bg-[#2563EB] p-2.5 rounded-xl shadow-md transition-all">
                <span className="text-xl">🛣️</span>
              </div>
              <span className="text-2xl font-bold text-[#F7FAFC] tracking-tight">
                En<span className="text-[#3B82F6]">Ruta</span>
              </span>
            </Link>
            
            {/* Center navigation with EXACT gap-6 (24px) */}
            <nav className="hidden xl:flex items-center gap-6">
              <Link to="/dashboard" className={getLinkClass('/dashboard', 'border-[#3B82F6]/40 text-[#3B82F6]')}>
                🏠 Dashboard
              </Link>
              <Link to="/candidate" className={getLinkClass('/candidate', 'border-emerald-500/40 text-emerald-400')}>
                🧹 Coach CV
              </Link>
              <Link to="/employer" className={getLinkClass('/employer', 'border-indigo-500/40 text-indigo-400')}>
                💼 Buscar RAG
              </Link>
              <Link to="/chambea-ahora" className={getLinkClass('/chambea-ahora', 'border-[#48BB78]/40 text-[#48BB78]')}>
                💚 Chambea Ahora!
              </Link>
              <Link to="/buscar" className={getLinkClass('/buscar', 'border-[#F6AD55]/40 text-[#F6AD55]')}>
                📍 Mapa Vial
              </Link>
              <Link to="/payments" className={getLinkClass('/payments', 'border-cyan-500/40 text-cyan-400')}>
                📶 POS & Pagos
              </Link>
              <Link to="/onboarding" className={getLinkClass('/onboarding', 'border-purple-500/40 text-purple-400')}>
                🛡️ KYC Registro
              </Link>
            </nav>
          </div>

          {/* Action buttons with minimum 44px height */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="min-h-[44px] text-[13px] font-semibold uppercase tracking-wider text-[#A0AEC0] hover:text-[#F7FAFC] px-4 rounded-xl transition-all"
            >
              Ingresar
            </button>
            <Button
              variant="secondary"
              onClick={handleLogout}
              className="text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 min-h-[44px]"
            >
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* COMPACT MOBILE MENU */}
      <div className="xl:hidden bg-[#171923] border-b border-[#2D3748] py-2 px-4 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-6">
        <Link to="/dashboard" className={getLinkClass('/dashboard', 'text-[#3B82F6]')}>Dashboard</Link>
        <Link to="/candidate" className={getLinkClass('/candidate', 'text-emerald-400')}>Coach CV</Link>
        <Link to="/employer" className={getLinkClass('/employer', 'text-indigo-400')}>Buscar RAG</Link>
        <Link to="/chambea-ahora" className={getLinkClass('/chambea-ahora', 'text-[#48BB78]')}>Chambea Ahora!</Link>
        <Link to="/buscar" className={getLinkClass('/buscar', 'text-[#F6AD55]')}>Mapa Vial</Link>
        <Link to="/payments" className={getLinkClass('/payments', 'text-cyan-400')}>POS & Pagos</Link>
        <Link to="/onboarding" className={getLinkClass('/onboarding', 'text-purple-400')}>KYC Registro</Link>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-grow max-w-7xl mx-auto px-6 py-12 w-full flex flex-col justify-center">
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/login" element={<LoginPlaceholder />} />
          <Route path="/dashboard" element={<DashboardPlaceholder />} />
          <Route path="/candidate" element={<CandidateView />} />
          <Route path="/employer" element={<EmployerView />} />
          <Route path="/chambea-ahora" element={<WorkerDashboard />} />
          <Route path="/buscar" element={<ClientMap />} />
          <Route path="/payments" element={<FintechView />} />
          <Route path="/onboarding" element={<OnboardingView />} />
        </Routes>
      </main>

      {/* FOOTER GLOBAL */}
      <footer className="bg-[#1A202C] border-t border-[#2D3748] py-8 text-center text-xs text-[#A0AEC0]">
        <div className="max-w-7xl mx-auto px-6 space-y-3">
          <p className="font-semibold text-[#F7FAFC]">🛣️ EnRuta — Transformación Social Vial con IA & Fintech</p>
          <p>&copy; {new Date().getFullYear()} — PC2 Boilerplate Full-Stack. Ecosistema Agéntico SRE. Fiscalización MINTRA/MIMP.</p>
        </div>
      </footer>

      {/* BURBUJA FLOTANTE GLOBAL DE LA MASCOTA RUTI */}
      <SemiChatbot role={detectedRole} isFloating={true} />
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPONENTES VISTA INTERNOS (REDDISEÑADOS)
// ─────────────────────────────────────────────

function HomeView(): React.JSX.Element {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* HERO SECTION */}
      <div className="text-center space-y-6 relative py-4">
        {/* Route glowing effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-[#3B82F6]/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <span className="bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20 px-4 py-1.5 rounded-full text-[13px] font-semibold uppercase tracking-wider font-mono inline-block">
          🚀 TECNOLOGÍA CON IMPACTO SOCIAL REAL
        </span>
        <h1 className="text-[48px] font-extrabold text-[#F7FAFC] tracking-tight leading-none">
          Plataforma <span className="text-[#3B82F6]">EnRuta</span>
        </h1>
        <p className="text-[16px] text-[#A0AEC0] max-w-3xl mx-auto leading-[1.6]">
          Un sistema inteligente on-demand de micro-empleo y fintech enfocado en la **formalización, capacitación y salud financiera** de trabajadores independientes en Perú, con control estricto contra el trabajo infantil.
        </p>
        <div className="flex justify-center gap-6 pt-4">
          <Button
            onClick={() => navigate('/chambea-ahora')}
            className="font-bold min-h-[44px]"
          >
            💼 ¡Chambea Ahora!
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/buscar')}
            className="min-h-[44px]"
          >
            📍 Buscar Servicios
          </Button>
        </div>
      </div>

      {/* 3. MANDATORY MetricCard GRID (No HTML Table) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <MetricCard
          icon="🧹"
          value="350+"
          label="Trabajadores Activos"
        />
        <MetricCard
          icon="🛡️"
          value="0%"
          label="Trabajo Infantil"
        />
        <MetricCard
          icon="🎓"
          value="4,200+"
          label="Cursos Completados"
        />
        <MetricCard
          icon="💳"
          value="S/. 12.5K"
          label="Procesado POS"
        />
      </div>

      {/* 4. MANDATORY RoleCard GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RoleCard
          icon="🧹"
          title="Soy Trabajador Vial"
          description="Accede a tu panel 'Chambea Ahora!', sube tu semáforo de formalización con cursos y obtén micro-créditos."
          onClick={() => navigate('/chambea-ahora')}
          ctaText="Ir a Chambea Ahora"
        />
        <RoleCard
          icon="📍"
          title="Necesito Asistencia"
          description="Encuentra asistentes viales de confianza geolocalizados en semáforos cerca de ti y califícalos con estrellas."
          onClick={() => navigate('/buscar')}
          ctaText="Buscar Trabajadores"
        />
        <RoleCard
          icon="📶"
          title="POS Virtual & Fintech"
          description="Gestiona cobros sin contacto mediante NFC Tap-to-Pay y códigos QR Yape/Plin con split automático de comisiones."
          onClick={() => navigate('/payments')}
          ctaText="Abrir POS & Billetera"
        />
      </div>
    </div>
  );
}

function LoginPlaceholder(): React.JSX.Element {
  return (
    <div className="max-w-md mx-auto my-8">
      <Card className="relative overflow-hidden bg-[#171923] border border-[#2D3748]">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#3B82F6]/5 rounded-full blur-2xl pointer-events-none" />
        <h2 className="text-[24px] font-semibold text-[#F7FAFC] text-center mb-2 tracking-tight">Iniciar Sesión</h2>
        <p className="text-[13px] text-[#A0AEC0] text-center mb-6 leading-[1.6]">Accede a la ruta de formalización de EnRuta</p>
        
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-[13px] font-mono font-bold text-[#A0AEC0] uppercase tracking-[0.05em] mb-1.5">Correo Electrónico</label>
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              className="w-full bg-[#0F1117] border border-[#2D3748] rounded-xl px-4 py-3 text-sm text-[#F7FAFC] placeholder-slate-600 focus:ring-2 focus:ring-[#3B82F6] outline-none transition-all"
              defaultValue="admin@test.com"
            />
          </div>
          <div>
            <label className="block text-[13px] font-mono font-bold text-[#A0AEC0] uppercase tracking-[0.05em] mb-1.5">Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full bg-[#0F1117] border border-[#2D3748] rounded-xl px-4 py-3 text-sm text-[#F7FAFC] placeholder-slate-600 focus:ring-2 focus:ring-[#3B82F6] outline-none transition-all"
              defaultValue="Admin123!"
            />
          </div>
          <Button
            type="submit"
            className="w-full min-h-[44px] mt-6"
          >
            Ingresar
          </Button>
        </form>
      </Card>
    </div>
  );
}

function DashboardPlaceholder(): React.JSX.Element {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-[#2D3748] pb-6">
        <span className="text-[#3B82F6] uppercase text-[13px] tracking-[0.05em] font-mono font-bold block mb-1">
          📊 MÉTRICAS GENERALES DE PLATAFORMA
        </span>
        <h1 className="text-[36px] font-bold text-[#F7FAFC] tracking-tight">Panel de Control (Dashboard)</h1>
        <p className="text-[16px] text-[#A0AEC0] mt-1">Inspección de operatividad y estadísticas fiscales en tiempo real.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card className="flex flex-col justify-between">
          <span className="text-[13px] font-mono font-bold text-[#A0AEC0] uppercase tracking-[0.05em]">Estatus del Backend</span>
          <span className="mt-2 text-[24px] font-bold text-[#48BB78]">🟢 Activo</span>
        </Card>
        <Card className="flex flex-col justify-between">
          <span className="text-[13px] font-mono font-bold text-[#A0AEC0] uppercase tracking-[0.05em]">Conexión Supabase</span>
          <span className="mt-2 text-[24px] font-bold text-[#3B82F6]">🟢 Conectado</span>
        </Card>
        <Card className="flex flex-col justify-between">
          <span className="text-[13px] font-mono font-bold text-[#A0AEC0] uppercase tracking-[0.05em]">Monitoreo SRE</span>
          <span className="mt-2 text-[24px] font-bold text-[#F7FAFC]">100% Saludable</span>
        </Card>
      </div>

      <Card className="space-y-4">
        <h3 className="text-[20px] font-bold text-[#F7FAFC] border-b border-[#2D3748] pb-3">
          📋 Datos de Control y Fiscalización
        </h3>
        <p className="text-[16px] text-[#A0AEC0] leading-[1.6]">
          Este módulo está diseñado para la fiscalización del cumplimiento de regulaciones viales de superación de trabajadores independientes en Perú.
        </p>
        <div className="bg-[#F6AD55]/10 border border-[#F6AD55]/20 rounded-xl p-4 text-[13px] text-[#F6AD55] font-mono leading-relaxed">
          <strong>Tip de Administración:</strong> Usa el generador dinámico `npx tsx scripts/generate_crud.ts &lt;Entidad&gt;` para automatizar nuevas tablas y pegarlas directamente aquí.
        </div>
      </Card>
    </div>
  );
}
