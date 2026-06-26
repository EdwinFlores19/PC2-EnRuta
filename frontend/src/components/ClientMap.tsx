import { useEffect, useRef, useState } from 'react';
import type { LatLngExpression } from 'leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPinIcon,
  SearchIcon,
  StarIcon,
  PhoneIcon,
  LightningIcon,
  ExclamationIcon,
} from './SemaforoIcons.js';

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

const LIMA_CENTER: LatLngExpression = [-12.0464, -77.0428];

export default function ClientMap(): React.JSX.Element {
  // Mock data of workers in Lima, Peru
  const [workers] = useState<Worker[]>([
    {
      id: 'w1',
      name: 'Pedro Gómez',
      specialty: 'Electricista Certificado',
      rating: 4.9,
      reviewsCount: 42,
      lat: -12.045,
      lng: -77.041,
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
      lat: -12.0485,
      lng: -77.0445,
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
      lat: -12.044,
      lng: -77.046,
      pricePerHour: 30,
      phone: '+51 999 888 777',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(workers[0]);
  const [hired, setHired] = useState(false);

  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const filteredWorkers = workers.filter(
    (w) =>
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Initialize Leaflet map once
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    const map = L.map(mapRef.current, {
      center: LIMA_CENTER,
      zoom: 15,
      zoomControl: false,
    });

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }
    ).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // "You are here" marker
    L.marker(LIMA_CENTER, {
      icon: L.divIcon({
        className: 'custom-user-marker',
        html: `<div class="relative flex h-5 w-5 items-center justify-center"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3B82F6] opacity-50"></span><span class="relative inline-flex rounded-full h-5 w-5 bg-[#3B82F6] shadow-md"></span></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      }),
    })
      .addTo(map)
      .bindPopup('Tú estás aquí');

    leafletMapRef.current = map;

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  // Update worker markers when filtered selection changes
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    // Clear existing worker markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    filteredWorkers.forEach((worker) => {
      const icon = L.divIcon({
        className: 'custom-worker-marker',
        html: `
          <div class="flex flex-col items-center group cursor-pointer">
            <div class="bg-[#1A202C]/95 text-white text-[10px] font-bold px-2.5 py-1 rounded-xl border border-[#3B82F6]/40 shadow-md whitespace-nowrap mb-1.5">
              <span class="inline-flex items-center gap-1"><svg viewBox="0 0 24 24" width="10" height="10" fill="#F6AD55"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg> ${worker.rating}</span>
              <span class="text-[#A0AEC0] font-normal"> | ${worker.specialty.split(' ')[0]}</span>
            </div>
            <div class="relative flex h-10 w-10 items-center justify-center">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3B82F6] opacity-35"></span>
              <div class="relative rounded-full h-10 w-10 bg-[#0F1117] border-2 border-[#3B82F6] flex items-center justify-center overflow-hidden">
                <img src="${worker.image}" alt="${worker.name}" class="h-full w-full object-cover" />
              </div>
            </div>
          </div>
        `,
        iconSize: [120, 70],
        iconAnchor: [60, 55],
      });

      const marker = L.marker([worker.lat, worker.lng], { icon })
        .addTo(map)
        .on('click', () => {
          setSelectedWorker(worker);
          setHired(false);
        });

      markersRef.current.push(marker);
    });
  }, [filteredWorkers]);

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
      <div className="p-5 md:p-6 bg-[#1A202C] border-b border-[#2D3748] sticky top-0 z-[1000] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <span className="text-[#3B82F6] uppercase text-[11px] tracking-[0.1em] font-mono font-bold inline-flex items-center gap-1.5 mb-1">
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
      <div className="flex-grow relative min-h-[500px] bg-[#0F1117] border-b border-[#2D3748]">
        <div ref={mapRef} className="absolute inset-0 z-0" />

        {/* Floating legend / helper */}
        <div className="absolute top-4 left-4 z-[500] bg-[#171923]/90 backdrop-blur border border-[#2D3748] rounded-xl px-4 py-3 shadow-xl max-w-[240px]">
          <p className="text-[11px] text-[#A0AEC0] leading-relaxed">
            <span className="text-[#3B82F6] font-bold">Toca un marcador</span> para ver al trabajador. Los puntos azules son personal verificado disponible ahora.
          </p>
        </div>

        {filteredWorkers.length === 0 && (
          <div className="absolute inset-0 z-[500] flex items-center justify-center pointer-events-none">
            <div className="text-center bg-[#1A202C] border border-[#2D3748] rounded-xl p-8 max-w-sm shadow-xl mx-4 animate-fadeIn pointer-events-auto">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-[#1A202C] text-[#A0AEC0] mb-2">
                <ExclamationIcon size="lg" />
              </div>
              <h4 className="font-bold text-white text-base">No se encontraron trabajadores</h4>
              <p className="text-xs text-[#A0AEC0] mt-2 leading-relaxed">
                Intenta ajustando tu búsqueda para encontrar personal calificado en otras intersecciones.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* WORKER QUICK PANEL */}
      <div className="bg-[#171923] border-t border-[#2D3748] px-5 md:px-8 py-5">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#A0AEC0] font-mono mb-4 flex items-center gap-1.5">
            <SearchIcon size="xs" /> Resultados cercanos
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#2D3748]">
            {filteredWorkers.map((worker) => (
              <button
                key={worker.id}
                onClick={() => handleSelectWorker(worker)}
                className={`flex items-center gap-3 min-w-[260px] p-4 rounded-xl border text-left transition-all ${
                  selectedWorker?.id === worker.id
                    ? 'bg-[#3B82F6]/10 border-[#3B82F6]/40'
                    : 'bg-[#0F1117] border-[#2D3748] hover:border-[#3B82F6]/50'
                }`}
              >
                <div className="h-12 w-12 rounded-full border-2 border-[#3B82F6] overflow-hidden shrink-0">
                  <img src={worker.image} alt={worker.name} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{worker.name}</h4>
                  <p className="text-xs text-[#A0AEC0] truncate">{worker.specialty}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#F6AD55]">
                      <StarIcon size="xs" /> {worker.rating}
                    </span>
                    <span className="text-[10px] text-[#A0AEC0]">({worker.reviewsCount})</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SLIDE DETAIL SHEET */}
      {selectedWorker && (
        <div
          className="bg-[#171923] border-t border-[#2D3748] p-6 md:p-8 shadow-2xl backdrop-blur-md"
          data-testid="map-slide-sheet"
        >
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
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
                  <span
                    className="bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/30 text-xs px-2.5 py-0.5 rounded-full font-black inline-flex items-center gap-1"
                    data-testid="sheet-worker-rating"
                  >
                    <StarIcon size="xs" /> {selectedWorker.rating}
                  </span>
                </div>
                <p className="text-[#3B82F6] text-sm font-bold mt-1">{selectedWorker.specialty}</p>
                <div className="flex items-center gap-3 text-xs text-[#A0AEC0] mt-2 font-semibold font-mono">
                  <span className="inline-flex items-center gap-1">
                    <MapPinIcon size="xs" /> A 150m de ti
                  </span>
                  <span>•</span>
                  <span>{selectedWorker.reviewsCount} recomendaciones</span>
                </div>
              </div>
            </div>

            {/* Price & CTA */}
            <div className="flex flex-col md:items-end gap-3 w-full md:w-auto border-t md:border-t-0 border-[#2D3748]/80 pt-4 md:pt-0">
              <div className="flex justify-between md:block text-right">
                <span className="text-[10px] text-[#A0AEC0] block font-bold font-mono uppercase tracking-wide">
                  TARIFA SUGERIDA
                </span>
                <span className="text-2xl font-black font-mono text-white">
                  S/. {selectedWorker.pricePerHour}.00 <span className="text-xs text-[#A0AEC0] font-normal">/ hora</span>
                </span>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                {hired ? (
                  <div className="bg-[#48BB78]/10 text-[#48BB78] border border-[#48BB78]/30 font-bold rounded-xl px-6 py-3.5 text-sm text-center flex-grow flex items-center justify-center gap-2">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#48BB78]" /> ¡Trabajador contratado! Se dirige a tu ubicación.
                    </span>
                  </div>
                ) : (
                  <>
                    <a
                      href={`tel:${selectedWorker.phone}`}
                      className="bg-[#1A202C] hover:bg-[#1A202C]/80 text-[#F7FAFC] font-extrabold px-5 py-3.5 rounded-xl border border-[#2D3748] text-sm flex items-center justify-center shrink-0 shadow-sm min-h-[44px]"
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
