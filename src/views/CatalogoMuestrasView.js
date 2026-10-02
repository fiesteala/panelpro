import React, { useState, useEffect, useRef } from 'react';
import { PlayCircle, ChevronRight, Smartphone, X, ArrowLeft } from 'lucide-react';

const CatalogoMuestrasView = () => {
  const [activeCategory, setActiveCategory] = useState('boda');
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [fullScreenDemo, setFullScreenDemo] = useState(null);
  
  const macIframeRef = useRef(null);
  const iphoneIframeRef = useRef(null);
  const [activeDevice, setActiveDevice] = useState('iphone'); 

  const demos = {
    boda: { id: 'boda', label: 'Bodas de Lujo', url: '/demos/boda/index.html', desc: 'Elegancia clásica y paletas sobrias. El estándar de alta costura nupcial.', blob1: 'bg-[#D4AF37]', blob2: 'bg-[#FDFBF7]' },
    xv: { id: 'xv', label: 'XV Años Glamour', url: '/demos/xv/index.html', desc: 'Luces neón y energía vibrante para la mejor noche de tu vida.', blob1: 'bg-fuchsia-500', blob2: 'bg-cyan-400' },
    baby_shower: { id: 'baby_shower', label: 'Baby Shower', url: '/demos/baby_shower/index.html', desc: 'Ternura, interactividad y emoción para recibir a la nueva vida.', blob1: 'bg-sky-300', blob2: 'bg-pink-300' },
    cumple_formal: { id: 'cumple_formal', label: 'Cumpleaños', url: '/demos/cumple_formal/index.html', desc: 'Sofisticación pura para celebrar décadas con mucho estilo.', blob1: 'bg-amber-600', blob2: 'bg-slate-800' },
    tematicas: { id: 'tematicas', label: 'Fiestas Temáticas', url: '/demos/infantil/index.html', desc: 'Llevamos cualquier concepto al máximo nivel con inmersión total.', blob1: 'bg-emerald-400', blob2: 'bg-yellow-400' }, 
    bautizo: { id: 'bautizo', label: 'Bautizos', url: '/demos/bautizo/index.html', desc: 'Tonos pastel y diseños angelicales para momentos íntimos en familia.', blob1: 'bg-blue-100', blob2: 'bg-amber-100' },
    corporativo: { id: 'corporativo', label: 'Galas y Eventos', url: '/demos/corporativo/index.html', desc: 'Convenciones, conciertos y lanzamientos de marca con logística blindada.', blob1: 'bg-slate-700', blob2: 'bg-indigo-400' },
    keyli: { id: 'keyli', label: 'K-Pop Cyberpunk', url: '/demos/kpop/index.html', desc: 'Un ejemplo de cómo transformamos ideas en universos inmersivos y vibrantes.', blob1: 'bg-fuchsia-600', blob2: 'bg-cyan-400' }
  };
  const currentDemo = demos[activeCategory];

  useEffect(() => {
    setActiveDevice('iphone');
  }, [activeCategory]);

  const switchFocus = (device) => {
    setActiveDevice(device);
    const inactiveRef = device === 'mac' ? iphoneIframeRef : macIframeRef;
    if (inactiveRef.current && inactiveRef.current.contentWindow) {
      try { inactiveRef.current.contentWindow.postMessage('pause_baulia_audio', '*'); } catch (e) {}
    }
  };

  useEffect(() => {
    const checkDevice = () => setIsMobileDevice(window.innerWidth < 1024);
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050505] font-sans text-slate-900 dark:text-slate-100 transition-colors duration-700 flex flex-col relative overflow-hidden">
      
      {/* BOTÓN SUPERIOR PARA REGRESAR AL INICIO */}
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-6 relative z-50">
         <button onClick={() => window.location.href = '/'} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-amber-500 transition-colors">
            <ArrowLeft size={16} /> Volver a Baulia
         </button>
      </div>

      <section className="flex-1 w-full flex items-center justify-center py-4 md:py-10 relative z-10 transition-colors duration-700">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/5 dark:bg-amber-600/10 hidden md:block blur-[150px] rounded-full pointer-events-none"></div>

        <div className="max-w-[1400px] mx-auto px-4 md:px-8 relative z-10 w-full flex flex-col items-center">

            {!isMobileDevice ? (
                // ==========================================
                // --- VERSIÓN ESCRITORIO ---
                // ==========================================
                <div className="w-full relative bg-slate-100 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/5 rounded-[3rem] overflow-hidden shadow-inner transition-colors duration-700 items-stretch flex group p-12 min-h-[680px] animate-in fade-in zoom-in-95 duration-700">
                    <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white dark:from-[#080808] to-transparent opacity-40 z-0 transition-colors pointer-events-none"></div>
                    <div className="w-5/12 xl:w-1/3 relative z-30 flex flex-col justify-center h-full gap-10 py-6">
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col gap-3">
                                <span className="text-amber-600 dark:text-amber-500 font-bold tracking-widest uppercase text-xs block transition-colors">Showroom Exclusivo</span>
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-editorial font-medium text-slate-900 dark:text-white tracking-tight transition-colors duration-700 leading-tight">
                                    Tu evento es único. <br className="hidden md:block"/> tu diseño también.
                                </h2>
                            </div>
                            <p className="text-base lg:text-lg text-slate-600 dark:text-slate-400 font-light leading-relaxed transition-colors duration-700 max-w-md">
                                {currentDemo.desc} En Baulia no usamos plantillas genéricas; operamos como un estudio de diseño de élite.
                            </p>
                        </div>
                        <div className="flex flex-col gap-8">
                            <div className="relative w-full max-w-[280px] z-10">
                                <select value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)} className="w-full appearance-none bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white py-4 px-6 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-sm focus:outline-none focus:border-amber-500 cursor-pointer transition-colors">
                                    {Object.values(demos).map(demo => (
                                        <option key={demo.id} value={demo.id}>{demo.label}</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-5 pointer-events-none text-amber-500">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-7/12 xl:w-2/3 relative flex items-center justify-end z-20">
                        <div className="relative w-full max-w-[850px] aspect-[16/10] translate-x-[15%]">
                            <div className={`absolute top-0 right-0 w-[90%] h-full bg-black rounded-t-3xl border-[8px] border-slate-800 shadow-[0_30px_60px_rgba(0,0,0,0.5)] flex flex-col transition-all duration-700 ${activeDevice === 'mac' ? 'scale-[1.02] z-30' : 'scale-100 z-10 opacity-70 blur-[1px]'}`}>
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-6 bg-black rounded-b-2xl z-30"></div>
                                <div className="w-full h-full bg-[#111] relative overflow-hidden rounded-t-xl border border-white/5 transition-colors">
                                    <iframe ref={macIframeRef} src={currentDemo.url} className="absolute top-0 left-0 border-0 origin-top-left" style={{ width: '250%', height: '250%', transform: 'scale(0.4)' }} title={`Mac Demo ${currentDemo.label}`}></iframe>
                                    {activeDevice !== 'mac' && (
                                      <div onClick={() => switchFocus('mac')} className="absolute inset-0 z-20 bg-black/10 backdrop-blur-[2px] cursor-pointer flex items-center justify-center group transition-all duration-500">
                                         <div className="bg-slate-900/90 text-white text-xs font-bold px-6 py-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-white/20 shadow-2xl flex items-center transform scale-95 group-hover:scale-100">
                                            <PlayCircle size={18} className="mr-2 text-amber-500"/> Haz clic para explorar en Mac
                                         </div>
                                      </div>
                                    )}
                                </div>
                                <div className="absolute -bottom-4 left-[-2.5%] w-[105%] h-4 bg-slate-400 dark:bg-slate-700 rounded-b-3xl shadow-xl z-30 transition-colors">
                                   <div className="w-40 h-1.5 bg-slate-300 dark:bg-slate-600 mx-auto rounded-b-md"></div>
                                </div>
                            </div>

                            <div className={`absolute bottom-[0%] left-[0%] transition-all duration-700 ease-out origin-bottom ${activeDevice === 'iphone' ? 'z-40 scale-[1.05]' : 'z-20 scale-95 opacity-80 blur-[1px]'}`}>
                                <div style={{ width: '220px', height: '458px' }} className="relative bg-black rounded-[2.5rem] border-[8px] border-slate-800 shadow-[0_30px_80px_rgba(0,0,0,0.8)] overflow-hidden flex-shrink-0">
                                    <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-[30%] h-[16px] bg-black rounded-full z-30 flex justify-end items-center pr-1.5">
                                      <div className="w-1.5 h-1.5 rounded-full bg-slate-800/80 mr-1"></div>
                                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-900/50"></div>
                                    </div>
                                    <div className="absolute inset-0 overflow-hidden rounded-[1.8rem] z-10 bg-[#111]">
                                      <iframe ref={iphoneIframeRef} src={currentDemo.url} className="border-0 absolute top-0 left-0" title={`iPhone Demo ${currentDemo.label}`} style={{ width: '390px', height: '844px', transform: 'scale(0.523)', transformOrigin: 'top left' }}></iframe>
                                      {activeDevice !== 'iphone' && (
                                        <div onClick={() => switchFocus('iphone')} className="absolute inset-0 z-20 bg-black/10 backdrop-blur-[2px] cursor-pointer flex items-center justify-center group transition-all duration-500">
                                           <div className="bg-slate-900/90 text-white text-[10px] font-bold px-4 py-3 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity border border-white/20 shadow-2xl text-center flex flex-col items-center transform scale-95 group-hover:scale-100">
                                              <Smartphone size={24} className="mb-1 text-amber-500"/>
                                              Tocar para usar<br/>en Móvil
                                           </div>
                                        </div>
                                      )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // ==========================================
                // --- VERSIÓN MÓVIL (Altura Estilizada a 90px) ---
                // ==========================================
                <div className="w-full flex flex-col gap-4 px-2 max-w-md mx-auto animate-in fade-in duration-500">
                    
                    <div className="text-center mb-4">
                        <span className="text-amber-600 dark:text-amber-500 font-bold tracking-widest uppercase text-[10px] block mb-2 transition-colors">Showroom Exclusivo</span>
                        <h2 className="text-3xl font-editorial font-medium text-slate-900 dark:text-white tracking-tight leading-tight mb-2">
                            Tu evento es único.<br/>Tu diseño también.
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-light">Toca cualquier diseño para vivir la experiencia interactiva.</p>
                    </div>
                    
                    <div className="flex flex-col gap-3 relative z-50 pb-10">
                        {/* ESTILOS Y ANIMACIONES CSS NATIVAS */}
                        <style>{`
                            @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');
                            @keyframes petalFallMini { 0% { transform: translateY(-10px) rotate(0deg) scale(0.8); opacity: 0; } 20% { opacity: 0.6; } 80% { opacity: 0.6; } 100% { transform: translateY(80px) rotate(360deg) scale(1); opacity: 0; } }
                            @keyframes floatMini { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
                            @keyframes floatCloudMini { 0% { transform: translate(-60px, var(--y-offset)) scale(var(--scale)) rotate(var(--rot)); } 100% { transform: translate(350px, var(--y-offset)) scale(var(--scale)) rotate(var(--rot)); } }
                            @keyframes floatItemMini { 0% { transform: translateY(10px) translateX(0px) rotate(0deg) scale(0.8); opacity: 0; } 20% { opacity: 1; } 50% { transform: translateY(-20px) translateX(10px) rotate(10deg) scale(1); } 80% { opacity: 1; } 100% { transform: translateY(-50px) translateX(-10px) rotate(-10deg) scale(1.1); opacity: 0; } }
                            @keyframes radarPulse { 0% { transform: scale(0.5); opacity: 1; border-width: 2px; } 100% { transform: scale(2.5); opacity: 0; border-width: 0px; } }
                        `}</style>

                        {/* TODOS LOS BOTONES TIENEN EXACTAMENTE h-[90px] y rounded-[1.5rem] PARA SIMETRÍA SLIM */}
                        {Object.values(demos).map(demo => {
                            
                            // 💎 BODA
                            if (demo.id === 'boda') {
                                return (
                                    <button key={demo.id} type="button" onClick={() => setFullScreenDemo(demo.url)} className="w-full h-[90px] bg-[#FDFBF7] border border-[#D4AF37]/30 px-5 rounded-[1.5rem] shadow-[0_5px_15px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group flex items-center justify-between text-left">
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03]"></div>
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-[#8DB580]/10 blur-[20px] rounded-full"></div>
                                        <div className="absolute bottom-0 left-0 w-16 h-16 bg-[#F4AAB9]/10 blur-[20px] rounded-full"></div>
                                        <div className="absolute top-0 left-[20%] w-1.5 h-2.5 bg-[#F4AAB9] opacity-0 pointer-events-none" style={{ animation: 'petalFallMini 4s linear infinite', borderRadius: '50% 0 50% 50%' }}></div>
                                        
                                        <div className="flex flex-col items-start justify-center h-full relative z-10 mt-1">
                                            <div className="absolute -left-2 -top-2 opacity-5 pointer-events-none" style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '2.5rem', lineHeight: '1' }}>I<span style={{ fontFamily: '"Pinyon Script", cursive' }}>&</span>A</div>
                                            <span className="text-[7px] tracking-[0.3em] text-[#8DB580] uppercase mb-0.5 font-bold">Alta Costura</span>
                                            <span className="text-xl text-[#2C3531] font-light tracking-wide group-hover:text-[#D4AF37] transition-colors duration-300 leading-none" style={{ fontFamily: '"Cormorant Garamond", serif' }}>{demo.label}</span>
                                        </div>
                                        
                                        <div className="relative z-10 w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[#D4AF37]/30 shadow-sm text-[#2C3531] group-hover:bg-[#F4AAB9]/10 transition-colors duration-300 shrink-0">
                                            <ChevronRight size={16} className="text-[#D4AF37]" />
                                        </div>
                                    </button>
                                );
                            }

                            // 👑 XV AÑOS
                            if (demo.id === 'xv') {
                                return (
                                    <button key={demo.id} type="button" onClick={() => setFullScreenDemo(demo.url)} className="w-full h-[90px] bg-[#12080a] border border-[#e8a598]/30 px-5 rounded-[1.5rem] shadow-[0_5px_15px_rgba(0,0,0,0.5)] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group flex items-center justify-between text-left">
                                        <div className="absolute -top-5 -right-5 w-24 h-24 bg-[#e8a598]/10 blur-[25px] rounded-full"></div>
                                        
                                        <div className="flex flex-col items-start justify-center h-full relative z-10 mt-1">
                                            <div className="absolute -left-2 -top-2 opacity-[0.05] pointer-events-none text-[#e8a598]" style={{ fontFamily: '"Great Vibes", cursive', fontSize: '2.5rem', lineHeight: '1' }}>V</div>
                                            <span className="text-[7px] tracking-[0.3em] text-[#e8a598] uppercase mb-0.5 font-bold">Mis XV Años</span>
                                            <span className="text-xl text-white font-light tracking-wide group-hover:text-[#e8a598] transition-colors duration-300 leading-none" style={{ fontFamily: '"Cormorant Garamond", serif' }}>{demo.label}</span>
                                        </div>
                                        
                                        <div className="relative z-10 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-[#e8a598]/30 shadow-sm text-white group-hover:bg-[#e8a598] group-hover:text-black transition-colors duration-300 shrink-0">
                                            <ChevronRight size={16} />
                                        </div>
                                    </button>
                                );
                            }

                            // 🍼 BABY SHOWER
                            if (demo.id === 'baby_shower') {
                                return (
                                    <button key={demo.id} type="button" onClick={() => setFullScreenDemo(demo.url)} className="w-full h-[90px] bg-[#FFF0F2] border border-[#C5A059]/30 px-5 rounded-[1.5rem] shadow-[0_5px_15px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group flex items-center justify-between text-left">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-[#D8A7B1]/20 blur-[20px] rounded-full"></div>
                                        
                                        <div className="flex flex-col items-start justify-center h-full relative z-10 mt-1">
                                            <div className="absolute -left-1 -top-3 opacity-[0.07] pointer-events-none text-[#C5A059]" style={{ fontFamily: '"Great Vibes", cursive', fontSize: '3rem', lineHeight: '1' }}>TE</div>
                                            <span className="text-[7px] tracking-[0.3em] text-[#D8A7B1] uppercase mb-0.5 font-bold">Baby Shower de</span>
                                            <span className="text-xl text-[#111827] font-light tracking-wide group-hover:text-[#D8A7B1] transition-colors duration-300 leading-none" style={{ fontFamily: '"Great Vibes", cursive' }}>{demo.label}</span>
                                        </div>
                                        
                                        <div className="relative z-10 w-8 h-8 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center border border-[#C5A059]/30 shadow-sm text-[#4B5563] group-hover:bg-[#D8A7B1] group-hover:text-white transition-colors duration-300 shrink-0">
                                            <ChevronRight size={16} />
                                        </div>
                                    </button>
                                );
                            }

                            // 💎 CUMPLEAÑOS FORMAL
                            if (demo.id === 'cumple_formal') {
                                return (
                                    <button key={demo.id} type="button" onClick={() => setFullScreenDemo(demo.url)} className="w-full h-[90px] bg-[#FDFBF7] border border-[#D4AF37]/30 px-5 rounded-[1.5rem] shadow-[0_5px_15px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group flex items-center justify-between text-left">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#F76C82]/10 blur-[25px] rounded-full"></div>
                                        
                                        <div className="flex flex-col items-start justify-center h-full relative z-10 mt-1">
                                            <div className="absolute -left-1 -top-2 opacity-5 pointer-events-none text-[#D4AF37]" style={{ fontFamily: '"Pinyon Script", cursive', fontSize: '2.5rem', lineHeight: '1' }}>30</div>
                                            <span className="text-[7px] tracking-[0.3em] text-[#8DB580] uppercase mb-0.5 font-bold">Celebrando la vida</span>
                                            <span className="text-xl text-[#1a1a1a] font-light tracking-wide group-hover:text-[#F76C82] transition-colors duration-300 leading-none" style={{ fontFamily: '"Cormorant Garamond", serif' }}>{demo.label}</span>
                                        </div>
                                        
                                        <div className="relative z-10 w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[#D4AF37]/30 shadow-sm text-[#2A2A2A] transition-colors duration-300 shrink-0">
                                            <ChevronRight size={16} className="text-[#D4AF37]" />
                                        </div>
                                    </button>
                                );
                            }

                            // 🎮 TEMÁTICAS (GAMER)
                            if (demo.id === 'tematicas') {
                                return (
                                    <button key={demo.id} type="button" onClick={() => setFullScreenDemo(demo.url)} className="w-full h-[90px] bg-[#5d4037] border-[3px] border-black px-5 rounded-[1.5rem] transition-all relative overflow-hidden group flex items-center justify-between text-left" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%233e2723\' fill-opacity=\'0.4\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M0 0h40v40H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20zM20 0h20v20H20V0z\'/%3E%3C/g%3E%3C/svg%3E")' }}>
                                        <div className="absolute top-0 left-0 w-full h-3 bg-[#388e3c] border-b-[3px] border-[#1b5e20] pointer-events-none"></div>

                                        <div className="flex flex-col items-start justify-center h-full relative z-10 pt-2">
                                            <span className="text-[10px] tracking-[0.2em] text-[#388e3c] drop-shadow-[2px_2px_0_#000] uppercase mb-0.5" style={{ fontFamily: '"VT323", monospace' }}>Mundo Gamer</span>
                                            <span className="text-2xl text-white drop-shadow-[2px_2px_0_#000] group-hover:text-green-400 transition-colors leading-none" style={{ fontFamily: '"VT323", monospace' }}>{demo.label}</span>
                                        </div>
                                        
                                        <div className="relative z-10 w-8 h-8 bg-[#C6C6C6] border-2 border-black flex items-center justify-center text-[#202020] group-hover:bg-green-500 transition-colors duration-200 shrink-0">
                                            <ChevronRight size={16} className="text-black" />
                                        </div>
                                    </button>
                                );
                            }

                            // 🕊️ BAUTIZO
                            if (demo.id === 'bautizo') {
                                return (
                                    <button key={demo.id} type="button" onClick={() => setFullScreenDemo(demo.url)} className="w-full h-[90px] bg-[#FAF9F6] border border-[#D4AF37]/30 px-5 rounded-[1.5rem] shadow-[0_5px_15px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group flex items-center justify-between text-left">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#8A9A86]/10 blur-[20px] rounded-full"></div>
                                        
                                        <div className="flex flex-col items-start justify-center h-full relative z-10 mt-1">
                                            <div className="absolute -left-1 -top-3 opacity-5 pointer-events-none text-[#D4AF37]" style={{ fontFamily: '"Great Vibes", cursive', fontSize: '3rem', lineHeight: '1' }}>JA</div>
                                            <span className="text-[7px] tracking-[0.3em] text-[#8A9A86] uppercase mb-0.5 font-bold">Con la bendición</span>
                                            <span className="text-xl text-[#333333] font-light tracking-wide group-hover:text-[#D4AF37] transition-colors duration-300 leading-none" style={{ fontFamily: '"Cormorant Garamond", serif' }}>{demo.label}</span>
                                        </div>
                                        
                                        <div className="relative z-10 w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[#D4AF37]/30 shadow-sm text-[#333333] transition-colors duration-300 shrink-0">
                                            <ChevronRight size={16} className="text-[#D4AF37]" />
                                        </div>
                                    </button>
                                );
                            }

                            // 🏢 CORPORATIVO
                            if (demo.id === 'corporativo') {
                                return (
                                    <button key={demo.id} type="button" onClick={() => setFullScreenDemo(demo.url)} className="w-full h-[90px] bg-gradient-to-br from-[#002855] to-[#001530] border border-[#00B2E3]/20 px-5 rounded-[1.5rem] shadow-[0_5px_15px_rgba(0,40,85,0.4)] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group flex items-center justify-between text-left">
                                        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
                                        
                                        <div className="flex flex-col items-start justify-center h-full relative z-10 mt-1">
                                            <span className="text-[8px] tracking-widest text-[#00B2E3] uppercase mb-0.5 font-bold">Eventos Corporativos</span>
                                            <span className="text-lg text-white font-bold tracking-tight group-hover:text-[#00B2E3] transition-colors duration-300 leading-none">{demo.label}</span>
                                        </div>
                                        
                                        <div className="relative z-10 w-8 h-8 rounded-full bg-[#00B2E3]/10 flex items-center justify-center border border-[#00B2E3]/30 shadow-sm text-white group-hover:bg-[#00B2E3] group-hover:text-[#002855] transition-colors duration-300 shrink-0">
                                            <ChevronRight size={16} />
                                        </div>
                                    </button>
                                );
                            }

                            // 🎧 KEYLI K-POP CYBERPUNK
                            if (demo.id === 'keyli') {
                                return (
                                    <button key={demo.id} type="button" onClick={() => setFullScreenDemo(demo.url)} className="w-full h-[90px] bg-[#0a0514] border border-[#ff2e93]/40 px-5 rounded-[1.5rem] shadow-[0_5px_15px_rgba(255,46,147,0.15)] hover:shadow-[0_10px_20px_rgba(255,46,147,0.3)] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group flex items-center justify-between text-left">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#00e5ff]/20 blur-[25px] rounded-full"></div>
                                        <div className="absolute bottom-0 left-0 w-16 h-16 bg-[#ff2e93]/20 blur-[20px] rounded-full"></div>
                                        
                                        <div className="absolute inset-0 opacity-10 group-hover:opacity-30 transition-opacity duration-500 bg-[url('/keily-estefania/kpoplogo.svg')] bg-no-repeat bg-[center_right_-20px] bg-[length:100px] mix-blend-screen pointer-events-none"></div>

                                        <div className="flex flex-col items-start justify-center h-full relative z-10 mt-1">
                                            <span className="text-[7px] tracking-[0.3em] text-[#00e5ff] uppercase mb-1 font-bold drop-shadow-[0_0_5px_rgba(0,229,255,0.8)]" style={{ fontFamily: '"Orbitron", sans-serif' }}>Diseño Especial</span>
                                            <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00e5ff] to-[#ff2e93] drop-shadow-[0_0_8px_rgba(255,46,147,0.5)] transition-all duration-300 leading-none" style={{ fontFamily: '"Orbitron", sans-serif', letterSpacing: '1px' }}>{demo.label}</span>
                                        </div>
                                        
                                        <div className="relative z-10 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border border-[#00e5ff]/50 shadow-[0_0_10px_rgba(0,229,255,0.3)] text-white group-hover:bg-[#ff2e93] group-hover:border-[#ff2e93] transition-all duration-300 shrink-0">
                                            <ChevronRight size={16} />
                                        </div>
                                    </button>
                                );
                            }

                            return null;
                        })}
                    </div>
                </div>
            )}
        </div>
      </section>

      {/* 🔴 OVERLAY VISOR PANTALLA COMPLETA (Móviles) */}
      {fullScreenDemo && (
        <div className="fixed inset-0 z-[999999] bg-black flex flex-col h-[100dvh] overscroll-none touch-none">
           <div className="bg-[#050505] border-b border-white/10 px-4 py-4 flex items-center justify-between z-10 shadow-md">
               <div className="flex items-center gap-2 text-white">
                  <span className="text-xs font-editorial font-bold italic tracking-widest text-white">Baulia</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest border-l border-white/20 pl-2 ml-1">Demo en Vivo</span>
               </div>
               <button onClick={() => setFullScreenDemo(null)} className="bg-white/10 hover:bg-rose-500 text-white px-5 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest transition-colors flex items-center border border-white/10 shadow-sm">
                  <X size={14} className="mr-1.5" /> Volver
               </button>
           </div>
           <iframe src={fullScreenDemo} className="w-full flex-1 border-0 bg-white" title="Demo a Pantalla Completa" />
        </div>
      )}
    </div>
  );
};

export default CatalogoMuestrasView;