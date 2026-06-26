import React, { useState } from 'react';

interface Worker {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviewsCount: number;
  lat: number;
  lng: number;
  pricePerHour: number;
  phone: string;
  image: string;
}

export default function ClientMap(): React.JSX.Element {
  // Datos simulados de trabajadores en Lima, Perú
  const [workers] = useState<Worker[]>([
    {
      id: 'w1',
      name: 'Pedro Gómez',
      specialty: 'Electricista Certificado',
      rating: 4.9,
      reviewsCount: 42,
      lat: 40,
      lng: 35,
      pricePerHour: 25,
      phone: '+51 987 654 321',
      image: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=120&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    },
    {
      id: 'w2',
      name: 'María Alva',
      specialty: 'Plomero / Gasfitera',
      rating: 4.7,
      reviewsCount: 28,
      lat: 60,
      lng: 25,
      pricePerHour: 22,
      phone: '+51 912 345 678',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    },
    {
      id: 'w3',
      name: 'Carlos Ruiz',
      specialty: 'Carpintero a Domicilio',
      rating: 4.5,
      reviewsCount: 19,
      lat: 75,
      lng: 55,
      pricePerHour: 30,
      phone: '+51 999 888 777',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(workers[0]);
  const [hired, setHired] = useState(false);

  // Filtrado de trabajadores
  const filteredWorkers = workers.filter(
    (w) =>
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectWorker = (worker: Worker) => {
    setSelectedWorker(worker);
    setHired(false);
  };

  const handleHire = () => {
    setHired(true);
  };

  return (
    <div
      className="min-h-screen bg-[#070A13] text-slate-100 flex flex-col font-sans"
      data-testid="client-map-container"
    >
      {/* MAP CONTROLLER / BARRA BÚSQUEDA FLOTANTE */}
      <div className="p-5 md:p-6 bg-slate-950/80 border-b border-slate-800/60 backdrop-blur-md sticky top-0 z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[#fbbf24] uppercase text-xs tracking-widest font-mono font-bold block mb-1">
            📍 MAPA DE GEOLOCALIZACIÓN PÚBLICA
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Chambea Ahora! — <span className="text-[#fbbf24]">Buscar Servicios</span>
          </h1>
        </div>
        <div className="relative flex-grow md:max-w-md w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar electricista, gasfitera, carpintero..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]/45 transition-all font-sans"
            data-testid="map-search-input"
          />
          <span className="absolute right-4 top-3.5 text-slate-500 text-sm">🔍</span>
        </div>
      </div>

      {/* MAP WORKSPACE */}
      <div className="flex-grow relative h-[500px] bg-[#090d1f] overflow-hidden flex items-center justify-center border-b border-slate-800">
        {/* Simulación del mapa con líneas de rejilla futuristas */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        
        {/* Radar pulsing effect around map center */}
        <div className="absolute w-[400px] h-[400px] rounded-full border border-[#06b6d4]/5 bg-radial-gradient animate-pulse pointer-events-none"></div>

        {/* Pines de los trabajadores */}
        {filteredWorkers.map((worker) => (
          <button
            key={worker.id}
            onClick={() => handleSelectWorker(worker)}
            className="absolute transition-all duration-300 hover:scale-110 focus:outline-none z-20"
            style={{ top: `${worker.lat}%`, left: `${worker.lng}%` }}
            data-testid="worker-pin"
          >
            <div className="flex flex-col items-center">
              {/* Etiqueta flotante */}
              <div className="bg-slate-950/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-xl border border-[#fbbf24]/40 flex items-center gap-1 shadow-2xl whitespace-nowrap mb-1.5 transition-all hover:border-[#fbbf24]">
                <span>⭐ {worker.rating}</span>
                <span className="text-slate-400 font-normal">| {worker.specialty.split(' ')[0]}</span>
              </div>
              {/* Pin Físico */}
              <div className="relative flex h-10 w-10 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fbbf24] opacity-35"></span>
                <div className="relative rounded-full h-10 w-10 bg-slate-900 border-2 border-[#fbbf24] shadow-glow-yellow flex items-center justify-center overflow-hidden">
                  <img src={worker.image} alt={worker.name} className="h-full w-full object-cover" />
                </div>
              </div>
            </div>
          </button>
        ))}

        {/* Indicador de tu ubicación */}
        <div className="absolute z-10" style={{ top: '55%', left: '48%' }}>
          <div className="flex flex-col items-center">
            <span className="bg-[#06b6d4] text-[#020617] font-black text-[9px] px-2 py-0.5 rounded-full mb-1 tracking-wider font-mono">TÚ ESTÁS AQUÍ</span>
            <div className="relative flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#06b6d4] opacity-50"></span>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-[#06b6d4] shadow-glow-green"></span>
            </div>
          </div>
        </div>

        {filteredWorkers.length === 0 && (
          <div className="absolute text-center bg-slate-950/95 border border-slate-800 rounded-3xl p-8 max-w-sm shadow-2xl mx-4">
            <span className="text-3xl block mb-2">😢</span>
            <h4 className="font-extrabold text-white text-base">No se encontraron trabajadores</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">Intenta ajustando tu búsqueda para encontrar personal calificado en otras intersecciones.</p>
          </div>
        )}
      </div>

      {/* DETALLES DESLIZANTES EN GLASSMORPHISM */}
      {selectedWorker && (
        <div
          className="bg-[#101625]/95 border-t border-slate-800 p-6 md:p-8 shadow-2xl backdrop-blur-xl"
          data-testid="map-slide-sheet"
        >
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Información del Trabajador */}
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 rounded-full border-2 border-[#fbbf24] overflow-hidden shadow-xl shrink-0">
                <img src={selectedWorker.image} alt={selectedWorker.name} className="h-full w-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-extrabold text-white" data-testid="sheet-worker-name">
                    {selectedWorker.name}
                  </h3>
                  <span className="bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/30 text-xs px-2.5 py-0.5 rounded-full font-black flex items-center gap-1" data-testid="sheet-worker-rating">
                    ★ {selectedWorker.rating}
                  </span>
                </div>
                <p className="text-[#06b6d4] text-sm font-bold mt-1">
                  {selectedWorker.specialty}
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-2 font-semibold font-mono">
                  <span>📍 A 150m de ti</span>
                  <span>•</span>
                  <span>{selectedWorker.reviewsCount} recomendaciones</span>
                </div>
              </div>
            </div>

            {/* Precio, Teléfono y Acción */}
            <div className="flex flex-col md:items-end gap-3 w-full md:w-auto border-t md:border-t-0 border-slate-800/80 pt-4 md:pt-0">
              <div className="flex justify-between md:block text-right">
                <span className="text-[10px] text-slate-400 block font-bold font-mono uppercase tracking-wide">TARIFA SUL SUGERIDA</span>
                <span className="text-2xl font-black font-mono text-white">
                  S/. {selectedWorker.pricePerHour}.00 <span className="text-xs text-slate-400 font-normal">/ hora</span>
                </span>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                {hired ? (
                  <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold rounded-xl px-6 py-3.5 text-sm text-center flex-grow flex items-center justify-center gap-2">
                    <span>✔️</span> ¡Trabajador contratado! Se dirige a tu ubicación.
                  </div>
                ) : (
                  <>
                    <a
                      href={`tel:${selectedWorker.phone}`}
                      className="bg-slate-800 hover:bg-slate-700 text-white font-extrabold px-4.5 py-3.5 rounded-xl border border-slate-700 text-sm flex items-center justify-center shrink-0 shadow-md"
                    >
                      📞 Llamar
                    </a>
                    <button
                      onClick={handleHire}
                      className="bg-[#fbbf24] hover:bg-[#f59e0b] text-[#070A13] font-black px-6 py-3.5 rounded-xl shadow-glow-yellow hover:scale-[1.01] active:scale-[0.98] transition-all text-sm flex-grow md:flex-initial"
                      data-testid="btn-hire-now"
                    >
                      ⚡ Contratar Ahora (Chambea Ya)
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
