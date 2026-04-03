import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { Activity, Users, CheckCircle, Clock, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { db } from '../firebase';

// ==========================================
// --- COMPONENTE: MONITOR EN VIVO BLACK LABEL ---
// ==========================================
const MonitorRecepcionView = ({ eventId, eventName }) => {
  const [stats, setStats] = useState({ esperados: 0, ingresados: 0, porcentaje: 0 });
  const [llegadas, setLlegadas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
          <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] text-amber-500">
              <Activity size={40} className="animate-pulse mb-4" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Conectando con Recepción...</p>
          </div>
      );
  }

  return (
    <div className="bg-[#050505] p-4 sm:p-8 min-h-screen text-white font-sans animate-in fade-in">
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 pb-6 border-b border-white/10 gap-4">
          <div>
              <div className="flex items-center gap-2 mb-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Sincronizado en Vivo</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-editorial font-black">{eventName || 'Monitor de Recepción'}</h2>
              <p className="text-slate-400 text-sm mt-1">Control de aforo Black Label</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl flex items-center shadow-lg">
              <ShieldCheck size={18} className="text-amber-500 mr-2" />
              <span className="text-amber-500 font-black text-xs uppercase tracking-widest">Protocolo Activo</span>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COLUMNA IZQUIERDA: MÉTRICAS */}
          <div className="lg:col-span-1 space-y-6">
              {/* VELOCÍMETRO / PROGRESO */}
              <div className="bg-[#111] border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none"></div>
                  
                  <div className="relative w-40 h-40 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="#222" strokeWidth="8" />
                          <circle cx="50" cy="50" r="45" fill="none" stroke="#f59e0b" strokeWidth="8" strokeDasharray="283" strokeDashoffset={283 - (283 * stats.porcentaje) / 100} className="transition-all duration-1000 ease-out" />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                          <span className="text-4xl font-black text-amber-500">{stats.porcentaje}%</span>
                          <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Aforo</span>
                      </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 w-full gap-4">
                      <div className="bg-black/50 p-4 rounded-2xl border border-white/5">
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Ingresos</p>
                          <p className="text-2xl font-black text-white">{stats.ingresados}</p>
                      </div>
                      <div className="bg-black/50 p-4 rounded-2xl border border-white/5">
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Total Pases</p>
                          <p className="text-2xl font-black text-slate-400">{stats.esperados}</p>
                      </div>
                  </div>
              </div>

              <div className="bg-[#111] border border-white/5 rounded-3xl p-6">
                  <div className="flex items-center gap-3 mb-1">
                      <Users size={16} className="text-sky-500" />
                      <h4 className="font-bold text-sm text-white">Por llegar</h4>
                  </div>
                  <p className="text-3xl font-black text-slate-300 pl-7">{stats.esperados - stats.ingresados} <span className="text-sm font-medium text-slate-600">invitados</span></p>
              </div>
          </div>

          {/* COLUMNA DERECHA: FLUJO EN VIVO */}
          <div className="lg:col-span-2 bg-[#111] border border-white/5 rounded-3xl overflow-hidden flex flex-col min-h-[400px]">
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
                  <h3 className="font-bold text-white flex items-center gap-2">
                      <Activity size={18} className="text-amber-500" /> 
                      Registro de Accesos
                  </h3>
                  <span className="bg-white/10 text-slate-300 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">{llegadas.length} Grupos Adentro</span>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 max-h-[500px]">
                  {llegadas.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-600 p-10 text-center">
                          <Clock size={40} className="mb-4 opacity-20" />
                          <p className="text-sm font-bold">Esperando invitados...</p>
                          <p className="text-xs mt-1">Las lecturas de la puerta aparecerán aquí al instante.</p>
                      </div>
                  ) : (
                      <ul className="space-y-2 p-4">
                          {llegadas.map((llegada) => (
                              <li key={llegada.id} className="bg-black/40 border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-colors group animate-in slide-in-from-top-2">
                                  <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                          <CheckCircle size={20} />
                                      </div>
                                      <div>
                                          <p className="font-black text-white text-sm leading-none mb-1.5">{llegada.name}</p>
                                          <div className="flex items-center gap-2">
                                              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300 font-bold uppercase tracking-widest">
                                                  {llegada.adentro} de {llegada.de} pases
                                              </span>
                                              {llegada.adentro < llegada.de && (
                                                  <span className="text-[10px] text-amber-500 font-bold">Incompleto</span>
                                              )}
                                          </div>
                                      </div>
                                  </div>
                                  <ArrowUpRight size={16} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </li>
                          ))}
                      </ul>
                  )}
              </div>
          </div>

      </div>
    </div>
  );
};

export default MonitorRecepcionView;