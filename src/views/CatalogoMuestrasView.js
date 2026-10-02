import React, { useState, useEffect } from 'react';
import { ExternalLink, Smartphone, X, Maximize, ChevronRight } from 'lucide-react';

const MUESTRAS = [
  { id: '1', titulo: 'Keyli Estefanía (3 Años)', categoria: 'Infantil', url: '/keily-estefania', img: '/keily-estefania/cover.jpg' },
  { id: '2', titulo: 'Boda Primavera Vibrante', categoria: 'Boda', url: '/primavera-vibrante', img: '/demos/boda/cover.jpg' },
  { id: '3', titulo: 'Botanical Luxury', categoria: 'Boda', url: '/demos/botanical-luxury', img: '/demos/botanical-luxury/cover.jpg' },
  { id: '4', titulo: 'Mis XV Años', categoria: 'XV Años', url: '/demos/xv', img: '/demos/xv/cover.jpg' },
  { id: '5', titulo: 'Aventura Minecraft', categoria: 'Infantil', url: '/minecraft', img: '/minecraft/cover.jpg' },
  { id: '6', titulo: 'Evento Corporativo', categoria: 'Corporativo', url: '/demos/corporativo', img: '/demos/corporativo/cover.jpg' },
];

const CatalogoMuestrasView = () => {
  const [demoActivo, setDemoActivo] = useState(MUESTRAS[0]);
  const [isMobileFullscreen, setIsMobileFullscreen] = useState(false);

  // Prevenir scroll del fondo cuando el modal móvil está abierto
  useEffect(() => {
    if (isMobileFullscreen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isMobileFullscreen]);

  const seleccionarDemo = (demo) => {
    setDemoActivo(demo);
    // Si la pantalla es pequeña (móvil), abrimos el modal inmersivo
    if (window.innerWidth < 768) {
      setIsMobileFullscreen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col relative">
      
      {/* CABECERA SHOWROOM */}
      <div className="w-full bg-[#111] border-b border-white/10 py-6 px-4 md:px-8 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black">Showroom <span className="text-amber-500">Baulia</span></h1>
            <p className="text-slate-400 text-sm mt-1">Experimenta la tecnología de nuestras bóvedas interactivas.</p>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
            <Smartphone size={16} className="text-amber-500" />
            <span className="text-xs uppercase tracking-widest font-bold text-slate-300">Simulador Interactivo</span>
          </div>
        </div>
      </div>

      {/* ÁREA DE TRABAJO: 2 COLUMNAS EN ESCRITORIO, 1 EN MÓVIL */}
      <div className="flex-1 max-w-7xl mx-auto w-full flex flex-col md:flex-row">
        
        {/* COLUMNA IZQUIERDA: LISTA DE DEMOS */}
        <div className="w-full md:w-1/3 lg:w-2/5 p-4 md:p-8 border-r border-white/5 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4">Selecciona una experiencia</p>
          <div className="flex flex-col gap-3">
            {MUESTRAS.map(muestra => (
              <button 
                key={muestra.id}
                onClick={() => seleccionarDemo(muestra)}
                className={`w-full text-left flex items-center gap-4 p-3 rounded-2xl border transition-all duration-300 group ${demoActivo.id === muestra.id ? 'bg-[#1a1a1a] border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]' : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/10'}`}
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-black relative">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10"></div>
                  <img 
                    src={muestra.img} 
                    alt={muestra.titulo}
                    onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/150x150/111111/f59e0b?text=${muestra.categoria}` }}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${demoActivo.id === muestra.id ? 'text-amber-500' : 'text-slate-500'}`}>{muestra.categoria}</p>
                  <h3 className={`text-sm md:text-base font-bold ${demoActivo.id === muestra.id ? 'text-white' : 'text-slate-300'}`}>{muestra.titulo}</h3>
                </div>
                <ChevronRight size={18} className={`shrink-0 transition-transform ${demoActivo.id === muestra.id ? 'text-amber-500 translate-x-1' : 'text-slate-600'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* COLUMNA DERECHA: TELÉFONO VIRTUAL (SOLO ESCRITORIO) */}
        <div className="hidden md:flex flex-1 items-center justify-center p-8 relative bg-gradient-to-br from-[#0a0a0a] to-[#050505]">
          
          <div className="flex flex-col items-center gap-6">
            
            {/* Controles Superiores */}
            <div className="flex justify-between items-center w-[320px]">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{demoActivo.titulo}</span>
              <a 
                href={demoActivo.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 p-2 rounded-full transition-colors flex items-center justify-center gap-2"
                title="Abrir en pestaña nueva"
              >
                <Maximize size={16} />
              </a>
            </div>

            {/* Mockup iPhone */}
            <div className="relative w-[320px] h-[650px] bg-black rounded-[3rem] border-[10px] border-[#1f1f1f] shadow-2xl overflow-hidden ring-1 ring-white/10 shadow-black/50">
              {/* Dynamic Island / Notch */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-7 bg-black rounded-full z-20"></div>
              
              {/* Iframe que carga la web real */}
              <iframe 
                src={demoActivo.url} 
                title={demoActivo.titulo}
                className="w-full h-full border-none bg-[#0a0514] animate-in fade-in duration-700"
              />
            </div>
            
            <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center flex items-center gap-2">
               Interactúa directamente con la pantalla
            </p>
          </div>
        </div>
      </div>

      {/* OVERLAY PANTALLA COMPLETA PARA MÓVILES */}
      {isMobileFullscreen && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col md:hidden animate-in slide-in-from-bottom-4 duration-300">
          
          {/* Barra de navegación nativa del modal */}
          <div className="bg-[#111] border-b border-white/10 px-4 py-3 flex justify-between items-center shrink-0 shadow-lg relative z-20">
            <div className="flex-1 truncate pr-4">
              <p className="text-[9px] uppercase tracking-widest text-amber-500 font-bold mb-0.5">Muestra en vivo</p>
              <h3 className="text-sm font-bold text-white truncate">{demoActivo.titulo}</h3>
            </div>
            <button 
              onClick={() => setIsMobileFullscreen(false)}
              className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-slate-300 hover:text-white transition-colors shrink-0 flex items-center gap-2"
            >
              <span className="text-xs uppercase font-bold tracking-widest">Volver</span>
              <X size={16} />
            </button>
          </div>

          {/* Iframe Ocupando todo el sobrante del celular */}
          <div className="flex-1 w-full bg-[#0a0514] relative">
             <iframe 
                src={demoActivo.url} 
                title={demoActivo.titulo}
                className="absolute inset-0 w-full h-full border-none"
              />
          </div>
        </div>
      )}

    </div>
  );
};

export default CatalogoMuestrasView;