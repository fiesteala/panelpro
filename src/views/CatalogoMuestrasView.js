import React, { useState } from 'react';
import { ExternalLink, Star, Filter } from 'lucide-react';

const MUESTRAS = [
  { id: '1', titulo: 'Keyli Estefanía (3 Años)', categoria: 'Infantil', tematica: 'K-Pop Cyberpunk', url: '/keily-estefania', img: '/keily-estefania/cover.jpg', destacado: true },
  { id: '2', titulo: 'Boda Primavera Vibrante', categoria: 'Boda', tematica: 'Floral / Elegante', url: '/primavera-vibrante', img: '/demos/boda/cover.jpg', destacado: true },
  { id: '3', titulo: 'Mis XV Años', categoria: 'XV Años', tematica: 'Clásica', url: '/demos/xv', img: '/demos/xv/cover.jpg', destacado: false },
  { id: '4', titulo: 'Aventura Minecraft', categoria: 'Infantil', tematica: 'Gamer', url: '/minecraft', img: '/minecraft/cover.jpg', destacado: false },
  { id: '5', titulo: 'Botanical Luxury', categoria: 'Boda', tematica: 'Minimalista', url: '/demos/botanical-luxury', img: '/demos/botanical-luxury/cover.jpg', destacado: true },
  { id: '6', titulo: 'Evento Corporativo', categoria: 'Corporativo', tematica: 'Ejecutivo', url: '/demos/corporativo', img: '/demos/corporativo/cover.jpg', destacado: false },
];

const CATEGORIAS = ['Todas', 'Boda', 'XV Años', 'Infantil', 'Corporativo'];

const CatalogoMuestrasView = () => {
  const [filtro, setFiltro] = useState('Todas');

  const filtradas = filtro === 'Todas' ? MUESTRAS : MUESTRAS.filter(m => m.categoria === filtro);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans py-12 px-4 sm:px-8">
      {/* CABECERA */}
      <div className="max-w-6xl mx-auto text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-black mb-4">Experiencias <span className="text-amber-500">Baulia</span></h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">Explora nuestro catálogo de bóvedas interactivas y descubre el nivel de tecnología y elegancia que le daremos a tu evento.</p>
      </div>

      {/* FILTROS */}
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-3 mb-12">
        <Filter size={18} className="text-slate-500 mr-2" />
        {CATEGORIAS.map(cat => (
          <button 
            key={cat}
            onClick={() => setFiltro(cat)}
            className={`px-6 py-2 rounded-full text-sm font-bold uppercase tracking-widest transition-all ${filtro === cat ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* GRID DE GALERÍA */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtradas.map(muestra => (
          <a 
            key={muestra.id} 
            href={muestra.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block relative rounded-2xl overflow-hidden bg-[#111] border border-white/10 hover:border-amber-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(0,0,0,0.8)]"
          >
            {/* Etiqueta Destacado */}
            {muestra.destacado && (
              <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md border border-amber-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
                <Star size={12} className="text-amber-500 fill-amber-500" />
                <span className="text-[10px] uppercase font-black tracking-widest text-amber-500">Premium</span>
              </div>
            )}
            
            {/* Imagen Portada */}
            <div className="relative h-60 w-full overflow-hidden bg-slate-900">
              <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent z-10"></div>
              {/* Nota: Si no tienes las imágenes de 'cover.jpg' aún, se mostrará un placeholder elegante automático */}
              <img 
                src={muestra.img} 
                alt={muestra.titulo}
                onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/600x400/111111/f59e0b?text=${muestra.categoria}` }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100"
              />
            </div>

            {/* Información */}
            <div className="p-6 relative z-20">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-amber-500 font-bold mb-1">{muestra.tematica}</p>
                  <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">{muestra.titulo}</h3>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-black transition-colors shrink-0">
                  <ExternalLink size={16} />
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default CatalogoMuestrasView;