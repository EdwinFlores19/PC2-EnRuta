import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import CandidateView from './components/CandidateView';
import EmployerView from './components/EmployerView';
import WorkerDashboard from './components/WorkerDashboard';
import ClientMap from './components/ClientMap';

export default function App(): React.JSX.Element {
  const navigate = useNavigate();

  // Simulación rápida de logout para mantener la consistencia
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* HEADER / NAVBAR GLOBAL */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-xl font-extrabold text-blue-600 tracking-tight">PC2-PFDC3</span>
            <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-gray-600">
              <Link to="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
              <Link to="/candidate" className="hover:text-blue-600 transition-colors">Portal Trabajador</Link>
              <Link to="/employer" className="hover:text-blue-600 transition-colors">Portal Reclutador</Link>
              <Link to="/chambea-ahora" className="hover:text-blue-600 transition-colors font-bold text-teal-600">💼 Chambea Ahora!</Link>
              <Link to="/buscar" className="hover:text-blue-600 transition-colors font-bold text-amber-600">📍 Buscar Servicios</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/login" element={<LoginPlaceholder />} />
          <Route path="/dashboard" element={<DashboardPlaceholder />} />
          <Route path="/candidate" element={<CandidateView />} />
          <Route path="/employer" element={<EmployerView />} />
          <Route path="/chambea-ahora" element={<WorkerDashboard />} />
          <Route path="/buscar" element={<ClientMap />} />
        </Routes>
      </main>

      {/* FOOTER GLOBAL */}
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} — PC2 Boilerplate Full-Stack. Ecosistema Agéntico SRE.</p>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPONENTES VISTA INTERNOS (PLACEHOLDERS)
// ─────────────────────────────────────────────

function HomeView(): React.JSX.Element {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center max-w-3xl mx-auto my-12">
      <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-4">
        Plataforma Semáforo Social
      </h1>
      <p className="text-lg text-gray-500 mb-6">
        Sistema on-demand enfocado en la formalización, capacitación y salud financiera para trabajadores independientes vulnerables en el Perú.
      </p>

      {/* MÓDULOS DE UX/UI & GAMIFICACIÓN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left">
        <Link
          to="/chambea-ahora"
          className="p-5 bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border border-teal-200 hover:border-teal-400 rounded-2xl transition-all block group"
        >
          <span className="text-2xl mb-1 block">💼</span>
          <h3 className="font-bold text-teal-800 text-lg group-hover:text-teal-900">Portal "Chambea Ahora!"</h3>
          <p className="text-xs text-teal-600/80 mt-1">
            Panel de control privado de superación personal con Semáforo de progreso (Rojo/Amarillo/Verde) y capacitaciones.
          </p>
        </Link>
        <Link
          to="/buscar"
          className="p-5 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-200 hover:border-amber-400 rounded-2xl transition-all block group"
        >
          <span className="text-2xl mb-1 block">📍</span>
          <h3 className="font-bold text-amber-800 text-lg group-hover:text-amber-900">Buscar Servicios (Clientes)</h3>
          <p className="text-xs text-amber-600/80 mt-1">
            Mapa de geolocalización pública con pines de los trabajadores de micro-empleo y reputación de 1 a 5 estrellas.
          </p>
        </Link>
      </div>

      <div className="flex justify-center gap-4">
        <Link
          to="/dashboard"
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-sm hover:bg-blue-700 transition-colors"
        >
          Ir al Panel de Control (Admin)
        </Link>
        <a
          href="https://github.com/EdwinFlores19/PC2-Boilerplate-Puente"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
        >
          Ver Repositorio
        </a>
      </div>
    </div>
  );
}

function LoginPlaceholder(): React.JSX.Element {
  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8 my-12">
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">Iniciar Sesión</h2>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
          <input
            type="email"
            placeholder="correo@ejemplo.com"
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            defaultValue="admin@test.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            defaultValue="Admin123!"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold shadow-sm hover:bg-blue-700 transition-all mt-6"
        >
          Ingresar
        </button>
      </form>
    </div>
  );
}

function DashboardPlaceholder(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-extrabold text-gray-900">Panel de Control (Dashboard)</h1>
        <p className="text-sm text-gray-500">Métricas en tiempo real e inspección de tus módulos.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow-sm border border-gray-200 rounded-2xl p-5">
          <dt className="text-sm font-medium text-gray-500 truncate">Estatus del Backend</dt>
          <dd className="mt-1 text-3xl font-semibold text-green-600">🟢 Activo</dd>
        </div>
        <div className="bg-white overflow-hidden shadow-sm border border-gray-200 rounded-2xl p-5">
          <dt className="text-sm font-medium text-gray-500 truncate">Conexión Supabase</dt>
          <dd className="mt-1 text-3xl font-semibold text-blue-600">🟢 Conectado</dd>
        </div>
        <div className="bg-white overflow-hidden shadow-sm border border-gray-200 rounded-2xl p-5">
          <dt className="text-sm font-medium text-gray-500 truncate">Monitoreo SRE</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">100% Saludable</dd>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Información del Examen</h3>
        <p className="text-sm text-gray-600 mb-4">
          Mañana, una vez que ingreses el caso de negocio del examen, este slot será reemplazado con las métricas clave de tus entidades.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">
          <strong>Tip del Tech Lead:</strong> Utiliza el comando `npx tsx scripts/generate_crud.ts &lt;Entidad&gt;` para generar los componentes backend y pégalos en las rutas dinámicas de este componente.
        </div>
      </div>
    </div>
  );
}
