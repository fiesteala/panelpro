import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase'; 
import { Percent, Save, Power, CheckCircle2, Circle, DollarSign, Tag, Ticket, CreditCard, Plus, X } from 'lucide-react';

const GestorPreciosView = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [config, setConfig] = useState({
    promocion: { activa: false, porcentaje: 50, productos: { basico: true, plata: true, oro: true, diamante: true, social_wall: false, black_label: true } },
    preciosBase: {
      basico: { MXN: 990, USD: 59 }, plata: { MXN: 1490, USD: 79 }, oro: { MXN: 1990, USD: 99 },
      diamante: { MXN: 2990, USD: 159 }, social_wall: { MXN: 1490, USD: 79 }, black_label: { MXN: 1490, USD: 79 }
    },
    anticipos: { activo: false, porcentaje: 10 },
    cupones: []
  });

  const nombresProductos = { basico: 'Plan Básico', plata: 'Plan Plata', oro: 'Plan Oro', diamante: 'Plan Diamante', social_wall: 'Muro Social', black_label: 'Black Label' };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, 'ajustes_baulia', 'precios_publicos');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setConfig(prev => ({
            ...prev,
            ...data,
            anticipos: data.anticipos || { activo: false, porcentaje: 10 },
            cupones: data.cupones || []
          }));
        }
      } catch (error) { console.error("Error al leer configuración:", error); }
      setLoading(false);
    };
    fetchConfig();
  }, []);

  const agregarCupon = () => {
    const nuevoCupon = { id: Date.now().toString(), codigo: '', tipo: 'porcentaje', valor: 15, limite: 100, usados: 0, activo: true };
    setConfig(prev => ({ ...prev, cupones: [nuevoCupon, ...(prev.cupones || [])] }));
  };

  const eliminarCupon = (id) => {
    setConfig(prev => ({ ...prev, cupones: (prev.cupones || []).filter(c => c.id !== id) }));
  };

  const updateCupon = (id, campo, valor) => {
    setConfig(prev => ({ ...prev, cupones: (prev.cupones || []).map(c => c.id === id ? { ...c, [campo]: valor } : c) }));
  };

  const handleGuardar = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'ajustes_baulia', 'precios_publicos'), config);
      // 🔴 AQUÍ DISPARAMOS TU NOTIFICACIÓN FLOTANTE (CAMPANITA)
      window.dispatchEvent(new CustomEvent('mostrarNotificacionBaulia', { 
        detail: { title: 'Ajustes Publicados', message: 'Los precios y promociones ya están en vivo.', type: 'success' } 
      }));
    } catch (error) { 
      window.dispatchEvent(new CustomEvent('mostrarNotificacionBaulia', { 
        detail: { title: 'Error al Guardar', message: 'Hubo un problema de conexión con la nube.', type: 'danger' } 
      }));
    }
    setSaving(false);
  };

  const toggleProductoPromo = (key) => setConfig(prev => ({ ...prev, promocion: { ...prev.promocion, productos: { ...prev.promocion.productos, [key]: !prev.promocion.productos[key] } } }));
  const handlePrecioChange = (key, moneda, valor) => setConfig(prev => ({ ...prev, preciosBase: { ...prev.preciosBase, [key]: { ...prev.preciosBase[key], [moneda]: Number(valor) } } }));

  if (loading) return <div className="p-8 text-center text-[#D4AF37] font-black uppercase tracking-widest text-sm animate-pulse">Cargando Motor Financiero...</div>;

  return (
    <div className="h-full flex flex-col space-y-6 pb-6 relative text-white transition-colors duration-500 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1C1917] p-5 sm:p-6 rounded-3xl border border-[#D4AF37]/25 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0">
            <DollarSign size={20} />
          </div>
          <div>
            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.25em] text-[#D4AF37] block mb-0.5">Control maestro de precios base y descuentos.</span>
            <h2 className="text-2xl sm:text-3xl font-editorial text-white tracking-wide leading-none">Finanzas y Promociones</h2>
          </div>
        </div>
        <button onClick={handleGuardar} disabled={saving} className="w-full md:w-auto px-6 py-3.5 bg-[#D4AF37] text-[#1C1917] rounded-xl font-black text-[10px] uppercase tracking-widest shadow-[0_10px_25px_rgba(212,175,55,0.25)] hover:bg-[#c5a028] hover:scale-[1.02] transition-all flex items-center justify-center disabled:opacity-50 disabled:hover:scale-100 shrink-0">
          <Save size={16} className="mr-2" /> {saving ? 'Guardando...' : 'Publicar Ajustes'}
        </button>
      </div>

      <div className="flex-1 bg-[#1C1917] rounded-3xl border border-white/10 shadow-xl overflow-hidden flex flex-col lg:flex-row z-10 relative">
        <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
          <div className="flex items-center mb-8 pb-4 border-b border-white/5"><Tag size={18} className="text-[#D4AF37] mr-2" /><h3 className="text-sm font-black uppercase tracking-widest text-white">Precios Base (Sin Descuento)</h3></div>
          <div className="space-y-4">
            {Object.keys(config.preciosBase).map((key) => (
              <div key={key} className="bg-[#141210] p-5 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-[#D4AF37]/30 transition-colors">
                <span className="font-bold text-sm text-white w-32">{nombresProductos[key]}</span>
                <div className="flex gap-3">
                  <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">$</span><input type="number" value={config.preciosBase[key].MXN} onChange={(e) => handlePrecioChange(key, 'MXN', e.target.value)} className="w-28 pl-7 pr-3 py-3 bg-[#1C1917] border border-white/10 rounded-xl text-sm font-black text-white outline-none focus:border-[#D4AF37] transition-colors" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-[9px] font-black">MXN</span></div>
                  <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">$</span><input type="number" value={config.preciosBase[key].USD} onChange={(e) => handlePrecioChange(key, 'USD', e.target.value)} className="w-28 pl-7 pr-3 py-3 bg-[#1C1917] border border-white/10 rounded-xl text-sm font-black text-white outline-none focus:border-[#D4AF37] transition-colors" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-[9px] font-black">USD</span></div>
                </div>
              </div>
            ))}
          </div>

          {/* 🟢 MOTOR DE ANTICIPOS */}
          <div className="mt-10 border-t border-white/5 pt-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <CreditCard size={18} className="text-[#D4AF37] mr-2" />
                <h3 className="text-sm font-black uppercase tracking-widest text-white">Sistema de Anticipos (Reserva)</h3>
              </div>
              <button onClick={() => setConfig(prev => ({ ...prev, anticipos: { ...prev.anticipos, activo: !prev.anticipos?.activo } }))} className={`flex items-center px-4 py-2 rounded-full font-bold text-[9px] uppercase tracking-widest transition-all shadow-md border ${config.anticipos?.activo ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-slate-500 border-white/10'}`}>
                <Power size={12} className="mr-1.5" /> {config.anticipos?.activo ? 'HABILITADO' : 'APAGADO'}
              </button>
            </div>
            
            <div className={`bg-[#141210] p-6 rounded-3xl border border-white/5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-500 ${config.anticipos?.activo ? 'opacity-100' : 'grayscale opacity-50 pointer-events-none'}`}>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Porcentaje de Reserva</p>
                <p className="text-xs text-slate-500">El resto se exigirá 24 hrs después de entregar su invitación.</p>
              </div>
              <div className="flex items-center gap-3">
                <input type="range" min="5" max="50" step="5" value={config.anticipos?.porcentaje || 10} onChange={(e) => setConfig(prev => ({ ...prev, anticipos: { ...prev.anticipos, porcentaje: Number(e.target.value) } }))} className="w-32 accent-[#D4AF37] cursor-pointer h-2 bg-slate-700 rounded-lg appearance-none outline-none" />
                <span className="font-editorial font-black text-3xl text-[#D4AF37] w-16 text-right">{config.anticipos?.porcentaje || 10}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[450px] border-l border-white/5 bg-[#141210] p-6 md:p-8 shrink-0 overflow-y-auto custom-scrollbar">
          {/* SECCIÓN PROMOCIÓN GLOBAL */}
          <div className={`transition-all duration-500 ${config.promocion.activa ? 'opacity-100' : 'grayscale opacity-70'}`}>
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
              <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center"><Percent size={18} className="text-rose-500 mr-2" /> Promociones</h3>
              <button onClick={() => setConfig(prev => ({ ...prev, promocion: { ...prev.promocion, activa: !prev.promocion.activa } }))} className={`flex items-center px-4 py-2 rounded-full font-bold text-[9px] uppercase tracking-widest transition-all shadow-md border ${config.promocion.activa ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-slate-500 border-white/10'}`}>
                <Power size={12} className="mr-1.5" /> {config.promocion.activa ? 'EN VIVO' : 'APAGADO'}
              </button>
            </div>
            
            <div className="mb-10 bg-[#1C1917] p-8 rounded-3xl border border-white/10 shadow-sm text-center">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Porcentaje a descontar</label>
              <div className="flex flex-col items-center gap-6">
                <span className="font-editorial font-black text-7xl text-[#D4AF37]">{config.promocion.porcentaje}%</span>
                <input type="range" min="5" max="90" step="5" value={config.promocion.porcentaje} onChange={(e) => setConfig(prev => ({ ...prev, promocion: { ...prev.promocion, porcentaje: Number(e.target.value) } }))} className="w-full accent-rose-500 cursor-pointer h-2 bg-slate-700 rounded-lg appearance-none outline-none" disabled={!config.promocion.activa} />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">¿A qué aplica el descuento?</label>
              <div className="grid grid-cols-2 gap-3">
                {Object.keys(config.preciosBase).map((key) => (
                  <button key={key} onClick={() => toggleProductoPromo(key)} disabled={!config.promocion.activa} className={`flex items-center p-4 rounded-xl border transition-all text-xs font-bold ${config.promocion.productos[key] ? 'bg-[#D4AF37] border-[#D4AF37] text-[#1C1917] shadow-[0_5px_15px_rgba(212,175,55,0.2)]' : 'bg-[#1C1917] border-white/10 text-slate-500 hover:border-white/30'}`}>
                    {config.promocion.productos[key] ? <CheckCircle2 size={16} className="mr-2 shrink-0"/> : <Circle size={16} className="mr-2 opacity-50 shrink-0"/>}
                    <span className="truncate">{nombresProductos[key]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 🟢 GESTOR DE CUPONES ÚNICOS */}
          <div className="mt-10 border-t border-white/5 pt-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center"><Ticket size={18} className="text-[#D4AF37] mr-2" /> Cupones (Promo Codes)</h3>
              <button onClick={agregarCupon} className="bg-white/5 border border-white/10 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center shadow-sm">
                <Plus size={12} className="mr-1"/> Nuevo
              </button>
            </div>

            <div className="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
              {(!config.cupones || config.cupones.length === 0) ? (
                <div className="text-center p-8 bg-[#1C1917] border border-dashed border-white/10 rounded-2xl">
                  <Ticket size={24} className="mx-auto text-slate-600 mb-3"/>
                  <p className="text-xs text-slate-500 font-bold">No hay cupones activos.</p>
                </div>
              ) : (
                config.cupones.map((cupon) => (
                  <div key={cupon.id} className={`bg-[#1C1917] border ${cupon.activo ? 'border-[#D4AF37]/30' : 'border-rose-500/30'} p-4 rounded-2xl shadow-sm transition-colors relative group`}>
                    <button onClick={() => eliminarCupon(cupon.id)} className="absolute -top-2 -right-2 bg-rose-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                    
                    <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-3">
                      <input type="text" placeholder="CÓDIGO (Ej. BODA26)" value={cupon.codigo} onChange={(e) => updateCupon(cupon.id, 'codigo', e.target.value.toUpperCase().trim())} className="bg-[#141210] border border-white/10 text-white font-black text-sm uppercase px-3 py-2 rounded-lg outline-none focus:border-[#D4AF37] w-1/2" />
                      <button onClick={() => updateCupon(cupon.id, 'activo', !cupon.activo)} className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border transition-colors ${cupon.activo ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                        {cupon.activo ? 'ACTIVO' : 'PAUSADO'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Tipo de descuento</label>
                        <select value={cupon.tipo} onChange={(e) => updateCupon(cupon.id, 'tipo', e.target.value)} className="w-full bg-[#141210] border border-white/10 text-slate-300 text-xs px-2 py-2 rounded-lg outline-none focus:border-[#D4AF37] appearance-none">
                          <option value="porcentaje">Porcentaje (%)</option>
                          <option value="fijo">Monto Fijo ($)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Valor a descontar</label>
                        <input type="number" min="1" value={cupon.valor} onChange={(e) => updateCupon(cupon.id, 'valor', Number(e.target.value))} className="w-full bg-[#141210] border border-white/10 text-[#D4AF37] font-black text-xs px-2 py-2 rounded-lg outline-none focus:border-[#D4AF37]" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Límite de usos (Van {cupon.usados || 0})</label>
                        <input type="number" min="1" value={cupon.limite} onChange={(e) => updateCupon(cupon.id, 'limite', Number(e.target.value))} className="w-full bg-[#141210] border border-white/10 text-white font-bold text-xs px-2 py-2 rounded-lg outline-none focus:border-[#D4AF37]" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestorPreciosView;