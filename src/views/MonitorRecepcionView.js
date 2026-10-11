import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { Activity, Users, CheckCircle, Clock, ShieldCheck, ArrowUpRight, Share2, ScanLine, Search, WifiOff, X } from 'lucide-react';
import { db } from '../firebase';

// ==========================================
// --- COMPONENTE: MONITOR EN VIVO BLACK LABEL ---
// ==========================================
const MonitorRecepcionView = ({ eventId, eventName }) => {
  const [stats, setStats] = useState({ esperados: 0, ingresados: 0, porcentaje: 0 });
  const [llegadas, setLlegadas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🔴 ESTADOS PARA EL TUTORIAL MAGAZINE (CONTROL QR)
  const [showTutorial, setShowTutorial] = useState(() => {
    const activeEventId = eventId || (typeof ID_DEL_EVENTO !== 'undefined' ? ID_DEL_EVENTO : 'test');
    const hasSeen = localStorage.getItem(`baulia_tutorial_qr_${activeEventId}`);
    return !hasSeen;
  });

  const handleCloseTutorial = () => {
    const activeEventId = eventId || (typeof ID_DEL_EVENTO !== 'undefined' ? ID_DEL_EVENTO : 'test');
    localStorage.setItem(`baulia_tutorial_qr_${activeEventId}`, 'true');
    setShowTutorial(false);
  };

  useEffect(() => {
    if (!eventId) return;

    // Conexión en TIEMPO REAL a la puerta (Radar activo)
    const unsubscribe = onSnapshot(collection(db, "eventos", eventId, "invitados"), (snapshot) => {
      let totalEsperados = 0;
      let totalAdentro = 0;
      let historial = [];

      snapshot.docs.forEach(doc => {
        const guest = { id: doc.id, ...doc.data() };
        
        // Sumamos los pases originales
        totalEsperados += (guest.originalPasses || guest.passes || 1);
        
        // Calculamos cuántos han entrado de este grupo
        let adentroEsteGrupo = 0;
        if (typeof guest.entered === 'number') {
            adentroEsteGrupo = guest.entered;
        } else if (guest.subGuests) {
            adentroEsteGrupo = guest.subGuests.filter(sg => sg.entered).length;
        }

        totalAdentro += adentroEsteGrupo;

        // Si ya llegó alguien, lo metemos al historial
        if (adentroEsteGrupo > 0) {
            historial.push({
                id: guest.id,
                name: guest.name,
                adentro: adentroEsteGrupo,
                de: guest.originalPasses || guest.passes,
                timestamp: guest.ultimaLlegada?.toMillis() || Date.now() 
            });
        }
      });

      // Ordenamos el historial para ver a los más recientes arriba
      historial.sort((a, b) => b.timestamp - a.timestamp);

      setStats({
          esperados: totalEsperados,
          ingresados: totalAdentro,
          porcentaje: totalEsperados > 0 ? Math.round((totalAdentro / totalEsperados) * 100) : 0
      });
      setLlegadas(historial);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [eventId]);

  if (isLoading) {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-[#050505] text-amber-500 transition-colors duration-500">
              <Activity size={40} className="animate-pulse mb-4" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Conectando con Recepción...</p>
          </div>
      );
  }

  return (
    <div className="bg-slate-50 dark:bg-[#050505] p-4 sm:p-8 min-h-screen text-slate-900 dark:text-white font-sans animate-in fade-in transition-colors duration-500 relative">
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 pb-6 border-b border-slate-200 dark:border-white/10 gap-4 transition-colors">
          <div>
              <div className="flex items-center gap-2 mb-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Sincronizado en Vivo</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-editorial font-black text-slate-900 dark:text-white transition-colors">{eventName || 'Monitor de Recepción'}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 transition-colors">Control de aforo Black Label</p>
          </div>
          <div className="flex items-center gap-3">
              {/* 🔴 BOTÓN DE AYUDA (TUTORIAL QR) */}
              <button onClick={() => setShowTutorial(true)} className="flex items-center justify-center w-8 h-8 bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 rounded-full text-xs font-black hover:bg-indigo-50 dark:hover:bg-amber-500/10 hover:text-indigo-600 dark:hover:text-amber-500 hover:border-indigo-200 dark:hover:border-amber-500/20 shadow-sm transition-colors" title="Ver Guía de Uso">?</button>
              
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-4 py-2 rounded-xl flex items-center shadow-sm dark:shadow-lg transition-colors">
                  <ShieldCheck size={18} className="text-amber-600 dark:text-amber-500 mr-2" />
                  <span className="text-amber-600 dark:text-amber-500 font-black text-xs uppercase tracking-widest">Protocolo Activo</span>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COLUMNA IZQUIERDA: MÉTRICAS */}
          <div className="lg:col-span-1 space-y-6">
              {/* VELOCÍMETRO / PROGRESO */}
              <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-b from-amber-50 dark:from-amber-500/5 to-transparent pointer-events-none"></div>
                  
                  <div className="relative w-40 h-40 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="none" strokeWidth="8" className="stroke-slate-100 dark:stroke-[#222] transition-colors" />
                          <circle cx="50" cy="50" r="45" fill="none" stroke="#f59e0b" strokeWidth="8" strokeDasharray="283" strokeDashoffset={283 - (283 * stats.porcentaje) / 100} className="transition-all duration-1000 ease-out" />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                          <span className="text-4xl font-black text-amber-500">{stats.porcentaje}%</span>
                          <span className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold transition-colors">Aforo</span>
                      </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 w-full gap-4">
                      <div className="bg-slate-50 dark:bg-black/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5 transition-colors">
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold mb-1 transition-colors">Ingresos</p>
                          <p className="text-2xl font-black text-slate-800 dark:text-white transition-colors">{stats.ingresados}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-black/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5 transition-colors">
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold mb-1 transition-colors">Total Pases</p>
                          <p className="text-2xl font-black text-slate-500 dark:text-slate-400 transition-colors">{stats.esperados}</p>
                      </div>
                  </div>
              </div>

              <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/5 rounded-3xl p-6 transition-colors">
                  <div className="flex items-center gap-3 mb-1">
                      <Users size={16} className="text-sky-500" />
                      <h4 className="font-bold text-sm text-slate-800 dark:text-white transition-colors">Por llegar</h4>
                  </div>
                  <p className="text-3xl font-black text-slate-700 dark:text-slate-300 pl-7 transition-colors">
                      {stats.esperados - stats.ingresados} <span className="text-sm font-medium text-slate-500 dark:text-slate-600 transition-colors">invitados</span>
                  </p>
              </div>
          </div>

          {/* COLUMNA DERECHA: FLUJO EN VIVO */}
          <div className="lg:col-span-2 bg-white dark:bg-[#111] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden flex flex-col min-h-[400px] transition-colors">
              <div className="p-6 border-b border-slate-200 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-black/20 transition-colors">
                  <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 transition-colors">
                      <Activity size={18} className="text-amber-500" /> 
                      Registro de Accesos
                  </h3>
                  <span className="bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest transition-colors">
                      {llegadas.length} Grupos Adentro
                  </span>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 max-h-[500px]">
                  {llegadas.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 p-10 text-center transition-colors">
                          <Clock size={40} className="mb-4 opacity-20" />
                          <p className="text-sm font-bold">Esperando invitados...</p>
                          <p className="text-xs mt-1">Las lecturas de la puerta aparecerán aquí al instante.</p>
                      </div>
                  ) : (
                      <ul className="space-y-2 p-4">
                          {llegadas.map((llegada) => (
                              <li key={llegada.id} className="bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 p-4 rounded-2xl flex items-center justify-between hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group animate-in slide-in-from-top-2">
                                  <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-500 shrink-0 transition-colors">
                                          <CheckCircle size={20} />
                                      </div>
                                      <div>
                                          <p className="font-black text-slate-800 dark:text-white text-sm leading-none mb-1.5 transition-colors">{llegada.name}</p>
                                          <div className="flex items-center gap-2">
                                              <span className="text-[10px] bg-slate-200 dark:bg-white/10 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 font-bold uppercase tracking-widest transition-colors">
                                                  {llegada.adentro} de {llegada.de} pases
                                              </span>
                                              {llegada.adentro < llegada.de && (
                                                  <span className="text-[10px] text-amber-500 font-bold">Incompleto</span>
                                              )}
                                          </div>
                                      </div>
                                  </div>
                                  <ArrowUpRight size={16} className="text-slate-400 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </li>
                          ))}
                      </ul>
                  )}
              </div>
          </div>

      </div>

      {/* 🔴 MODAL MAGAZINE: GUÍA EDITORIAL DE CONTROL DE ACCESO */}
      {showTutorial && (
        <div className="fixed inset-0 z-[999999] bg-slate-900/80 dark:bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in transition-colors">
          <div className="bg-[#fcfbf9] dark:bg-[#0a0a0a] rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl border border-transparent dark:border-white/10 animate-in zoom-in-95 duration-500 transition-colors flex flex-col max-h-[90vh]">
            
            {/* CABECERA EDITORIAL */}
            <div className="px-6 sm:px-8 py-5 border-b border-amber-200/50 dark:border-white/5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-amber-500 font-black tracking-[0.2em] text-[10px] uppercase hidden sm:block">Baulia</span>
                <span className="font-editorial text-slate-800 dark:text-white italic text-lg">Magazine</span>
              </div>
              <button onClick={handleCloseTutorial} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center transition-colors">
                Cerrar <span className="hidden sm:inline ml-1">Edición</span> <X size={14} className="ml-2" />
              </button>
            </div>

            {/* CUERPO DEL MAGAZINE */}
            <div className="p-6 sm:p-10 overflow-y-auto custom-scrollbar flex-1 relative">
              {/* TÍTULO GIGANTE */}
              <div className="mb-12">
                <h1 className="font-black text-5xl sm:text-7xl text-slate-900 dark:text-white tracking-tighter leading-[0.8]">
                  Protocolo<br />
                  <span className="font-editorial font-normal italic text-amber-500">de entrada.</span>
                </h1>
                
                {/* MENSAJE DE BIENVENIDA PERSONALIZADO */}
                <div className="mt-8 border-l-[3px] border-amber-500 pl-4 animate-in slide-in-from-left-4 duration-700">
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-light leading-relaxed">
                    Bienvenido a la primera línea de recepción.<br/>
                    La puerta es la primera gran impresión de <strong className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">{eventName || 'tu evento'}</strong>.
                  </p>
                </div>
              </div>

              {/* GRID DE DOS COLUMNAS ESTILO REVISTA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-16">
                
                {/* COLUMNA IZQUIERDA */}
                <div className="space-y-10 sm:space-y-12">
                  
                  {/* SECCIÓN 1: DELEGAR */}
                  <div>
                    <p className="text-amber-500 font-black text-[9px] uppercase tracking-widest mb-4 border-b border-amber-200/50 pb-2">01. DELEGACIÓN OPERATIVA</p>
                    <div className="flex items-center gap-3 mb-3">
                      <Share2 size={24} className="text-indigo-500 dark:text-amber-500" />
                      <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight">Comparte el acceso</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-light leading-relaxed mb-4">
                      Tú no estarás en la puerta recibiendo invitados. Dirígete a la pestaña <b>"Control Puerta (QR)"</b>, copia ese enlace y envíaselo a tus <i>Hostesses</i> o al equipo de seguridad. Ellos podrán abrir esa herramienta desde sus celulares sin tener que acceder al resto de tu panel de administración privado.
                    </p>
                  </div>

                  {/* SECCIÓN 2: ESCANEO */}
                  <div>
                    <p className="text-amber-500 font-black text-[9px] uppercase tracking-widest mb-4 border-b border-amber-200/50 pb-2">02. VERIFICACIÓN INSTANTÁNEA</p>
                    <div className="flex items-center gap-3 mb-3">
                      <ScanLine size={24} className="text-indigo-500 dark:text-amber-500" />
                      <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight">Escáner Dinámico</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                      El equipo solo debe apuntar la cámara al código QR del invitado. En milisegundos, la pantalla destellará confirmando el acceso, mostrará a nombre de quién está el pase, su número de mesa y evitará boletos duplicados mediante una alerta de "Pase ya utilizado".
                    </p>
                  </div>

                </div>

                {/* COLUMNA DERECHA */}
                <div className="space-y-10 sm:space-y-12">

                  {/* SECCIÓN 3: BÚSQUEDA MANUAL */}
                  <div>
                    <p className="text-amber-500 font-black text-[9px] uppercase tracking-widest mb-4 border-b border-amber-200/50 pb-2">03. FLEXIBILIDAD (PLAN B)</p>
                    <div className="flex items-center gap-3 mb-3">
                      <Search size={24} className="text-indigo-500 dark:text-amber-500" />
                      <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight">Modo Manual</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-light leading-relaxed mb-4">
                      ¿Un invitado se quedó sin pila o no encuentra su pase? No hay problema. Utiliza el buscador manual para encontrar su nombre en la lista. Desde ahí, podrás otorgarle el acceso tocando un solo botón, manteniendo la fluidez de la fila intacta.
                    </p>
                  </div>

                  {/* SECCIÓN 4: OFFLINE */}
                  <div>
                    <p className="text-amber-500 font-black text-[9px] uppercase tracking-widest mb-4 border-b border-amber-200/50 pb-2">04. RESILIENCIA TECNOLÓGICA</p>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-2 rounded-full">
                         <WifiOff size={16} />
                      </div>
                      <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight">Tecnología "Offline"</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-light leading-relaxed mb-4">
                      Los eventos de lujo a veces ocurren en haciendas o jardines con señal celular intermitente. <br/><br/>
                      <b>Baulia es a prueba de fallos:</b> El escáner continuará leyendo accesos y registrando horas de entrada aunque se pierda la conexión a internet. En cuanto el dispositivo recupere un poco de señal, los datos se sincronizarán mágicamente con tu <b>Monitor En Vivo</b>.
                    </p>
                  </div>

                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default MonitorRecepcionView;