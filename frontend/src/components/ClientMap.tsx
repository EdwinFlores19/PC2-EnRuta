import { useState } from 'react';
import { MapPinIcon, SearchIcon, StarIcon, PhoneIcon, LightningIcon, ExclamationIcon } from './SemaforoIcons.js';

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
  // Mock data of workers in Lima, Peru
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

  // Filter workers based on search term
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
      className="min-h-screen bg-[#0F1117] text-[#F7FAFC] flex flex-col font-sans"
      data-testid="client-map-container"
    >
      {/* SEARCH / MAP CONTROL HEADER */}
      <div className="p-6 bg-[#1A202C] border-b border-[#2D3748] sticky top-0 z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[#3B82F6] uppercase text-xs tracking-widest font-mono font-bold inline-flex items-center gap-1.5 mb-1">
            <MapPinIcon size="sm" /> MAPA DE GEOLOCALIZACIÓN PÚBLICA
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Chambea Ahora! — <span className="text-[#3B82F6]">Buscar Servicios</span>
          </h1>
        </div>
        <div className="relative flex-grow md:max-w-md w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar electricista, gasfitera, carpintero..."
            className="w-full bg-[#0F1117] border border-[#2D3748] rounded-xl px-4 py-3 text-sm text-[#F7FAFC] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all font-sans min-h-[44px]"
            data-testid="map-search-input"
          />
          <SearchIcon size="sm" className="absolute right-4 top-3.5 text-slate-500" />
        </div>
      </div>

      {/* MAP VIEWPORT */}
      <div className="flex-grow relative h-[500px] bg-[#0F1117] overflow-hidden flex items-center justify-center border-b border-[#2D3748]">
        {/* Custom 8px grid map style */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(to_right,#2D3748_1px,transparent_1px),linear-gradient(to_bottom,#2D3748_1px,transparent_1px)] bg-[size:2rem_2rem]"></div>
        
        {/* Glowing route navigation tracks */}
        <div className="absolute w-[450px] h-[450px] rounded-full border border-[#3B82F6]/5 bg-radial-gradient animate-pulse pointer-events-none"></div>

        {/* Worker Pins */}
        {filteredWorkers.map((worker) => (
          <button
            key={worker.id}
            onClick={() => handleSelectWorker(worker)}
            className="absolute transition-all duration-300 hover:scale-110 focus:outline-none z-20"
            style={{ top: `${worker.lat}%`, left: `${worker.lng}%` }}
            data-testid="worker-pin"
          >
            <div className="flex flex-col items-center">
              {/* Overlay rating details */}
              <div className="bg-[#1A202C]/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-xl border border-[#3B82F6]/40 flex items-center gap-1 shadow-md whitespace-nowrap mb-1.5 transition-all">
                <span className="inline-flex items-center gap-1"><StarIcon size="xs" className="text-[#F6AD55]" /> {worker.rating}</span>
                <span className="text-[#A0AEC0] font-normal">| {worker.specialty.split(' ')[0]}</span>
              </div>
              {/* Marker pin */}
              <div className="relative flex h-10 w-10 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3B82F6] opacity-35"></span>
                <div className="relative rounded-full h-10 w-10 bg-[#0F1117] border-2 border-[#3B82F6] flex items-center justify-center overflow-hidden">
                  <img src={worker.image} alt={worker.name} className="h-full w-full object-cover" />
                </div>
              </div>
            </div>
          </button>
        ))}

        {/* Client Marker indicator */}
        <div className="absolute z-10" style={{ top: '55%', left: '48%' }}>
          <div className="flex flex-col items-center">
            <span className="bg-[#3B82F6] text-[#0F1117] font-black text-[9px] px-2 py-0.5 rounded-full mb-1 tracking-wider font-mono inline-flex items-center gap-1"><MapPinIcon size="xs" /> TÚ ESTÁS AQUÍ</span>
            <div className="relative flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3B82F6] opacity-50"></span>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-[#3B82F6] shadow-md"></span>
            </div>
          </div>
        </div>

        {filteredWorkers.length === 0 && (
          <div className="absolute text-center bg-[#1A202C] border border-[#2D3748] rounded-xl p-8 max-w-sm shadow-xl mx-4 animate-fadeIn">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-[#1A202C] text-[#A0AEC0] mb-2">
              <ExclamationIcon size="lg" />
            </div>
            <h4 className="font-bold text-white text-base">No se encontraron trabajadores</h4>
            <p className="text-xs text-[#A0AEC0] mt-2 leading-relaxed">Intenta ajustando tu búsqueda para encontrar personal calificado en otras intersecciones.</p>
          </div>
        )}
      </div>

      {/* SLIDE DETAIL SHEET */}
      {selectedWorker && (
        <div
          className="bg-[#171923] border-t border-[#2D3748] p-6 md:p-8 shadow-2xl backdrop-blur-md"
          data-testid="map-slide-sheet"
        >
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            {/* Avatar & Specialty */}
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 rounded-full border-2 border-[#3B82F6] overflow-hidden shadow-md shrink-0">
                <img src={selectedWorker.image} alt={selectedWorker.name} className="h-full w-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-white" data-testid="sheet-worker-name">
                    {selectedWorker.name}
                  </h3>
                  <span className="bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/30 text-xs px-2.5 py-0.5 rounded-full font-black inline-flex items-center gap-1" data-testid="sheet-worker-rating">
                    <StarIcon size="xs" /> {selectedWorker.rating}
                  </span>
                </div>
                <p className="text-[#3B82F6] text-sm font-bold mt-1">
                  {selectedWorker.specialty}
                </p>
                <div className="flex items-center gap-3 text-xs text-[#A0AEC0] mt-2 font-semibold font-mono">
                  <span className="inline-flex items-center gap-1"><MapPinIcon size="xs" /> A 150m de ti</span>
                  <span>•</span>
                  <span>{selectedWorker.reviewsCount} recomendaciones</span>
                </div>
              </div>
            </div>

            {/* Price & CTA */}
            <div className="flex flex-col md:items-end gap-3 w-full md:w-auto border-t md:border-t-0 border-[#2D3748]/80 pt-4 md:pt-0">
              <div className="flex justify-between md:block text-right">
                <span className="text-[10px] text-[#A0AEC0] block font-bold font-mono uppercase tracking-wide">TARIFA SUGERIDA</span>
                <span className="text-2xl font-black font-mono text-white">
                  S/. {selectedWorker.pricePerHour}.00 <span className="text-xs text-[#A0AEC0] font-normal">/ hora</span>
                </span>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                {hired ? (
                  <div className="bg-[#48BB78]/10 text-[#48BB78] border border-[#48BB78]/30 font-bold rounded-xl px-6 py-3.5 text-sm text-center flex-grow flex items-center justify-center gap-2">
                    <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#48BB78]" /> ¡Trabajador contratado! Se dirige a tu ubicación.</span>
                  </div>
                ) : (
                  <>
                    <a
                      href={`tel:${selectedWorker.phone}`}
                      className="bg-[#1A202C] hover:bg-[#1A202C]/80 text-[#F7FAFC] font-extrabold px-4.5 py-3.5 rounded-xl border border-[#2D3748] text-sm flex items-center justify-center shrink-0 shadow-sm min-h-[44px]"
                    >
                      <PhoneIcon size="sm" /> Llamar
                    </a>
                    <button
                      onClick={handleHire}
                      className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-black px-6 py-3.5 rounded-xl shadow-md hover:scale-[1.01] active:scale-[0.98] transition-all text-sm flex-grow md:flex-initial min-h-[44px]"
                      data-testid="btn-hire-now"
                    >
                      <LightningIcon size="sm" /> Contratar Ahora (Chambea Ya)
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
