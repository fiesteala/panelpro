import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase'; 
import { Percent, Save, Power, CheckCircle2, Circle, DollarSign, Tag } from 'lucide-react';

const GestorPreciosView = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [config, setConfig] = useState({
    promocion: { activa: false, porcentaje: 50, productos: { basico: true, plata: true, oro: true, diamante: true, social_wall: false, black_label: true } },
    preciosBase: {
      basico: { MXN: 990, USD: 59 }, plata: { MXN: 1490, USD: 79 }, oro: { MXN: 1990, USD: 99 },
      diamante: { MXN: 2990, USD: 159 }, social_wall: { MXN: 1490, USD: 79 }, black_label: { MXN: 1490, USD: 79 }
    }
  });

  const nombresProductos = { basico: 'Plan Básico', plata: 'Plan Plata', oro: 'Plan Oro', diamante: 'Plan Diamante', social_wall: 'Muro Social', black_label: 'Black Label' };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, 'ajustes_baulia', 'precios_publicos');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setConfig(docSnap.data());
      } catch (error) { console.error("Error al leer configuración:", error); }
      setLoading(false);
    };
    fetchConfig();
  }, []);

  const handleGuardar = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'ajustes_baulia', 'precios_publicos'), config);
      alert("¡Precios y promociones guardados en la nube!");
    } catch (error) { alert("Hubo un error al guardar."); }
    setSaving(false);
  };

  const toggleProductoPromo = (key) => setConfig(prev => ({ ...prev, promocion: { ...prev.promocion, productos: { ...prev.promocion.productos, [key]: !prev.promocion.productos[key] } } }));
  const handlePrecioChange = (key, moneda, valor) => setConfig(prev => ({ ...prev, preciosBase: { ...prev.preciosBase, [key]: { ...prev.preciosBase[key], [moneda]: Number(valor) } } }));

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold animate-pulse">Cargando Motor Financiero...</div>;

  return (
    <div className="h-full flex flex-col space-y-4 pb-6 relative text-slate-900 dark:text-slate-200 transition-colors duration-500 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-editorial text-slate-900 dark:text-white tracking-wide">Finanzas y Promociones</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-light">Control maestro de precios base y descuentos para la Landing Page.</p>
        </div>
        <button onClick={handleGuardar} disabled={saving} className="px-6 py-3 bg-indigo-600 dark:bg-amber-500 text-white dark:text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center">
          <Save size={18} className="mr-2" /> {saving ? 'Guardando...' : 'Publicar Ajustes'}
        </button>
      </div>

      <div className="flex-1 bg-white dark:bg-[#0a0a0a] rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-2xl overflow-hidden flex flex-col lg:flex-row z-10 relative">
        <div className="flex-1 p-6 md:p-8 bg-slate-50/50 dark:bg-transparent overflow-y-auto custom-scrollbar">
          <div className="flex items-center mb-6"><Tag size={18} className="text-indigo-500 dark:text-amber-500 mr-2" /><h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white">Precios Base (Sin Descuento)</h3></div>
          <div className="space-y-4">
            {Object.keys(config.preciosBase).map((key) => (
              <div key={key} className="bg-white dark:bg-[#111] p-4 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <span className="font-bold text-sm text-slate-700 dark:text-slate-300 w-32">{nombresProductos[key]}</span>
                <div className="flex gap-2">
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span><input type="number" value={config.preciosBase[key].MXN} onChange={(e) => handlePrecioChange(key, 'MXN', e.target.value)} className="w-24 pl-6 pr-3 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-lg text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[9px] font-black">MXN</span></div>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span><input type="number" value={config.preciosBase[key].USD} onChange={(e) => handlePrecioChange(key, 'USD', e.target.value)} className="w-24 pl-6 pr-3 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-lg text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[9px] font-black">USD</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`w-full lg:w-[400px] border-l border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20 p-6 md:p-8 shrink-0 transition-all duration-500 ${config.promocion.activa ? 'opacity-100' : 'grayscale'}`}>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white flex items-center"><Percent size={18} className="text-rose-500 mr-2" /> Promociones</h3>
            <button onClick={() => setConfig(prev => ({ ...prev, promocion: { ...prev.promocion, activa: !prev.promocion.activa } }))} className={`flex items-center px-4 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all shadow-md ${config.promocion.activa ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
              <Power size={12} className="mr-1.5" /> {config.promocion.activa ? 'EN VIVO' : 'APAGADO'}
            </button>
          </div>
          
          <div className="mb-10 bg-white dark:bg-[#111] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 text-center">Porcentaje a descontar</label>
            <div className="flex flex-col items-center gap-4">
              <span className="font-black text-6xl text-slate-900 dark:text-white">{config.promocion.porcentaje}%</span>
              <input type="range" min="5" max="90" step="5" value={config.promocion.porcentaje} onChange={(e) => setConfig(prev => ({ ...prev, promocion: { ...prev.promocion, porcentaje: Number(e.target.value) } }))} className="w-full accent-rose-500 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none" disabled={!config.promocion.activa} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">¿A qué aplica el descuento?</label>
            <div className="grid grid-cols-2 gap-3">
              {Object.keys(config.preciosBase).map((key) => (
                <button key={key} onClick={() => toggleProductoPromo(key)} disabled={!config.promocion.activa} className={`flex items-center p-3 rounded-xl border transition-all text-xs font-bold ${config.promocion.productos[key] ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900 shadow-md' : 'bg-white dark:bg-[#111] border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300'}`}>
                  {config.promocion.productos[key] ? <CheckCircle2 size={16} className="mr-2 shrink-0"/> : <Circle size={16} className="mr-2 opacity-50 shrink-0"/>}
                  <span className="truncate">{nombresProductos[key]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestorPreciosView;