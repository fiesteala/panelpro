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
          <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] text-[#D4AF37] transition-colors duration-500">
              <Activity size={40} className="animate-pulse mb-4" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Conectando con Recepción...</p>
          </div>
      );
  }

  return (
    <div className="bg-[#141210] p-4 sm:p-6 min-h-[100vh] rounded-3xl text-white font-sans animate-in fade-in transition-colors duration-500">
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 p-5 sm:p-6 bg-[#1C1917] rounded-3xl border border-[#D4AF37]/25 shadow-xl gap-4 transition-colors">
          <div className="flex items-center gap-4">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0">
                  <Activity size={20} />
              </div>
              <div>
                  <div className="flex items-center gap-2 mb-0.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.25em] text-[#D4AF37]">Sincronizado en Vivo</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-editorial font-black text-white tracking-wide leading-none">{eventName || 'Monitor de Recepción'}</h2>
              </div>
          </div>
          <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-4 py-2 rounded-xl flex items-center shadow-sm w-full md:w-auto justify-center transition-colors">
              <ShieldCheck size={16} className="text-[#D4AF37] mr-2" />
              <span className="text-[#D4AF37] font-black text-[10px] uppercase tracking-widest">Protocolo Activo</span>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COLUMNA IZQUIERDA: MÉTRICAS */}
          <div className="lg:col-span-1 space-y-6">
              {/* VELOCÍMETRO / PROGRESO */}
              <div className="bg-[#1C1917] border border-[#D4AF37]/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden transition-colors shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/5 to-transparent pointer-events-none"></div>
                  
                  <div className="relative w-40 h-40 flex items-center justify-center mt-2">
                      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="none" strokeWidth="8" className="stroke-white/5 transition-colors" />
                          <circle cx="50" cy="50" r="45" fill="none" stroke="#D4AF37" strokeWidth="8" strokeDasharray="283" strokeDashoffset={283 - (283 * stats.porcentaje) / 100} className="transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]" />
                      </svg>
                      <div className="absolute flex flex-col items-center mt-1">
                          <span className="text-4xl font-editorial font-black text-white">{stats.porcentaje}%</span>
                          <span className="text-[9px] uppercase tracking-widest text-[#D4AF37] font-bold mt-1">Aforo</span>
                      </div>
                  </div>

                  <div className="mt-8 grid grid-cols-2 w-full gap-4 relative z-10">
                      <div className="bg-[#141210] p-4 rounded-2xl border border-white/5 transition-colors">
                          <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-1">Ingresos</p>
                          <p className="text-2xl font-black text-[#D4AF37]">{stats.ingresados}</p>
                      </div>
                      <div className="bg-[#141210] p-4 rounded-2xl border border-white/5 transition-colors">
                          <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-1">Total Pases</p>
                          <p className="text-2xl font-black text-white">{stats.esperados}</p>
                      </div>
                  </div>
              </div>

              <div className="bg-[#1C1917] border border-white/10 rounded-3xl p-6 transition-colors shadow-xl flex items-center justify-between group hover:border-[#D4AF37]/40">
                  <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                          <Users size={14} className="text-slate-500 group-hover:text-[#D4AF37] transition-colors" />
                          <h4 className="font-bold text-[10px] uppercase tracking-widest text-slate-400 group-hover:text-[#D4AF37] transition-colors">Por llegar</h4>
                      </div>
                      <p className="text-3xl font-black text-white">
                          {stats.esperados - stats.ingresados} <span className="text-xs font-medium text-slate-500 uppercase tracking-widest ml-1">pases</span>
                      </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                     <Clock size={20} className="text-slate-500"/>
                  </div>
              </div>
          </div>

          {/* COLUMNA DERECHA: FLUJO EN VIVO */}
          <div className="lg:col-span-2 bg-[#1C1917] border border-white/10 rounded-3xl overflow-hidden flex flex-col min-h-[400px] shadow-xl transition-colors">
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#141210] transition-colors shrink-0">
                  <h3 className="font-editorial font-bold text-white flex items-center gap-2.5 text-xl tracking-wide">
                      <Activity size={20} className="text-[#D4AF37]" /> 
                      Registro de Accesos
                  </h3>
                  <span className="bg-white/5 text-[#D4AF37] border border-white/10 text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest transition-colors">
                      {llegadas.length} Grupos Adentro
                  </span>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 max-h-[500px]">
                  {llegadas.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-10 text-center transition-colors">
                          <Clock size={48} className="mb-4 opacity-20 text-[#D4AF37]" />
                          <p className="text-sm font-bold text-white">Esperando invitados...</p>
                          <p className="text-[10px] uppercase tracking-widest mt-2">Las lecturas de la puerta aparecerán aquí al instante.</p>
                      </div>
                  ) : (
                      <ul className="space-y-2 p-3">
                          {llegadas.map((llegada) => (
                              <li key={llegada.id} className="bg-[#141210] border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:border-[#D4AF37]/40 transition-colors group animate-in slide-in-from-top-2">
                                  <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 transition-colors shadow-inner">
                                          <CheckCircle size={20} />
                                      </div>
                                      <div>
                                          <p className="font-black text-white text-base leading-none mb-2 transition-colors">{llegada.name}</p>
                                          <div className="flex items-center gap-2">
                                              <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-slate-400 font-bold uppercase tracking-widest border border-white/5 transition-colors">
                                                  {llegada.adentro} de {llegada.de} pases
                                              </span>
                                              {llegada.adentro < llegada.de && (
                                                  <span className="text-[9px] text-amber-500 font-bold uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Incompleto</span>
                                              )}
                                          </div>
                                      </div>
                                  </div>
                                  <ArrowUpRight size={18} className="text-slate-500 group-hover:text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1 group-hover:-translate-y-1" />
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