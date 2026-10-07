import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';
import { Palette, QrCode, Lock, Send, Plus, FileSpreadsheet, Users, ListTodo, Trash2, Image as ImageIcon, Download, Eye, Edit3, Info, AlertTriangle, Loader2, X, Sparkles, MapPin, Truck } from 'lucide-react';
import { db } from '../firebase'; 

// ==========================================
// --- COMPONENTE: BAULIA BLACK LABEL - PRODUCCIÓN (V23: LOGÍSTICA INTERNACIONAL) ---
// ==========================================
const GestorPulserasView = ({ addNotification, eventId }) => {
  const [designConfig, setDesignConfig] = useState({ preTitle: '', eventName: '', logoBase64: '' });
  const [eventDateStr, setEventDateStr] = useState(''); 
  const [wristbandList, setWristbandList] = useState([]);
  const [newEntry, setNewEntry] = useState({ name: '', extraAdults: 0, extraChildren: 0 });
  const [isLocked, setIsLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  
  // 🔴 ESTADO: Información de Envío Estructurada
  const [shippingInfo, setShippingInfo] = useState({ 
      recipient: '', country: 'México', state: '', city: '', zipCode: '', address: '', references: '', phoneCode: '+52', phone: '' 
  });

  useEffect(() => {
    if (!eventId) return;

    const unsubEvent = onSnapshot(doc(db, "eventos", eventId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.pulserasConfig) {
          setDesignConfig(data.pulserasConfig);
        } else {
          setDesignConfig({ preTitle: '', eventName: data.nombres || '', logoBase64: '' });
        }

        if (data.pulserasStatus === 'enviado' || data.pulserasStatus === 'impreso') setIsLocked(true);
        if (data.fecha) setEventDateStr(data.fecha);
        if (data.direccionEnvioTaller) setShippingInfo(data.direccionEnvioTaller);
        
        const isSoloKit = data.plan === 'security_kit' || data.plan === 'baulia_black_label';
        setIsStandalone(isSoloKit);
      }
    });

    const unsubGuests = onSnapshot(collection(db, "eventos", eventId, "invitados"), (listSnap) => {
      const listData = listSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setWristbandList(listData);
      setIsLoading(false);
    });

    return () => { unsubEvent(); unsubGuests(); };
  }, [eventId]);

  const validWristbandList = isStandalone 
    ? wristbandList.filter(g => g.isSecurityKit || g.isBlackLabel)
    : wristbandList.filter(g => g.status === 'confirmado' || g.status === 'ingreso');

  const flattenedList = [];
  validWristbandList.forEach(guest => {
    let currentSubGuests = guest.subGuests && guest.subGuests.length > 0 ? guest.subGuests : [];
    if (currentSubGuests.length === 0) {
        const totalPases = guest.passes || 1;
        currentSubGuests = [
            { id: `usr_${guest.id}_0`, name: guest.name, isChild: false, entered: false },
            ...Array(Math.max(0, totalPases - 1)).fill(null).map((_, i) => ({ id: `usr_${guest.id}_A${i}`, name: `Acompañante ${i+1}`, isChild: false, entered: false }))
        ];
    }
    currentSubGuests.forEach((sg, idx) => {
      flattenedList.push({ _rowId: sg.id, parentGuest: guest, currentSubGuests: currentSubGuests, displayName: sg.name || (sg.isChild ? 'Niño' : 'Acompañante'), isMain: idx === 0, isChild: sg.isChild, pin: sg.id });
    });
  });

  const handleUpdateNameInline = async (parentId, subGuestId, newName, currentSubGuests) => {
    if (isLocked || !newName.trim()) return;
    const subIndex = currentSubGuests.findIndex(sg => sg.id === subGuestId);
    if (subIndex > -1) currentSubGuests[subIndex].name = newName.trim();
    const parentGuest = wristbandList.find(g => g.id === parentId);
    const updatedName = subIndex === 0 ? newName.trim() : (parentGuest?.name || newName.trim());
    try { await updateDoc(doc(db, "eventos", eventId, "invitados", parentId), { name: updatedName, subGuests: currentSubGuests, isBlackLabel: true, isSecurityKit: true }); } catch (err) {}
  };

  const handleSaveDesign = async (e) => {
    e.preventDefault();
    if (isLocked) return;
    try { await updateDoc(doc(db, "eventos", eventId), { pulserasConfig: designConfig }); if(addNotification) addNotification('Diseño Guardado', 'Los datos del brazalete se actualizaron.', 'success'); } catch (error) { if(addNotification) addNotification('Error', 'Fallo al guardar el diseño.', 'error'); }
  };

  const handleLogoUpload = async (e) => {
    if (isLocked) return;
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { if(addNotification) addNotification('Archivo no válido', 'Por favor sube una imagen (JPG o PNG).', 'warning'); return; }

    setIsUploadingLogo(true);
    const formData = new FormData(); formData.append('file', file); formData.append('upload_preset', "ml_default");
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/duy0mcqsh/image/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.secure_url) setDesignConfig(prev => ({ ...prev, logoBase64: data.secure_url }));
    } catch (err) { } finally { setIsUploadingLogo(false); e.target.value = null; }
  };

  const removeLogo = () => { if(isLocked) return; setDesignConfig({ ...designConfig, logoBase64: '' }); };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (isLocked || !isStandalone) return;
    const guestName = newEntry.name.trim();
    if (!guestName) return;
    const totalPases = 1 + (Number(newEntry.extraAdults) || 0) + (Number(newEntry.extraChildren) || 0);
    const newId = `p_${Date.now()}`;
    const initSubGuests = [
      { id: `usr_${newId}_0`, name: guestName, isChild: false, entered: false },
      ...Array(Number(newEntry.extraAdults) || 0).fill(null).map((_, i) => ({ id: `usr_${newId}_A${i}`, name: `Acompañante ${i+1}`, isChild: false, entered: false })),
      ...Array(Number(newEntry.extraChildren) || 0).fill(null).map((_, i) => ({ id: `usr_${newId}_N${i}`, name: `Niño ${i+1}`, isChild: true, entered: false }))
    ];
    const newDoc = { name: guestName, passes: totalPases, originalPasses: totalPases, childrenPasses: (Number(newEntry.extraChildren) || 0), status: 'confirmado', side: 'general', entered: 0, tableId: null, sent: false, subGuests: initSubGuests, extraRequested: 0, isBlackLabel: true, isSecurityKit: true };
    try { await setDoc(doc(db, "eventos", eventId, "invitados", newId), newDoc); setNewEntry({ name: '', extraAdults: 0, extraChildren: 0 }); if(addNotification) addNotification('Agregado', 'Añadido correctamente.', 'success'); } catch (error) {}
  };

  const handleRemoveEntry = async (id) => { if (isLocked || !isStandalone) return; try { await deleteDoc(doc(db, "eventos", eventId, "invitados", id)); } catch (error) {} };

  const executeSendToWorkshop = async () => {
    try {
      await updateDoc(doc(db, "eventos", eventId), { pulserasStatus: 'enviado', fechaEnvioTaller: new Date().toISOString(), direccionEnvioTaller: shippingInfo });
      setIsLocked(true);
      if(addNotification) addNotification('¡Orden Enviada!', 'Tus pulseras ya están en producción.', 'success');
    } catch (error) { if(addNotification) addNotification('Error', 'Fallo de conexión.', 'error'); }
  };

  if (isLoading) return <div className="p-10 text-center text-slate-500">Cargando plataforma...</div>;

  const totalPulserasSolicitadas = validWristbandList.reduce((sum, item) => sum + (Number(item.passes) || 0), 0);
  const isShippingValid = shippingInfo.recipient && shippingInfo.country && shippingInfo.state && shippingInfo.city && shippingInfo.zipCode && shippingInfo.address && shippingInfo.phone;

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-500 relative">
      
      {/* MODAL DE DATOS DE ENVÍO LOGÍSTICO */}
      {confirmModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 transition-all overflow-y-auto">
            <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl w-full max-w-xl shadow-2xl p-8 border border-transparent dark:border-white/10 animate-in zoom-in-95 transition-colors my-8">
                
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-100 dark:bg-amber-500/20 text-indigo-600 dark:text-amber-500 rounded-full flex items-center justify-center shadow-inner">
                            <Truck size={28} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-editorial font-black text-slate-800 dark:text-white leading-tight">Envío de Producción</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Completa los datos para la paquetería.</p>
                        </div>
                    </div>
                    <button onClick={() => setConfirmModal(false)} className="text-slate-400 hover:text-rose-500 transition-colors bg-slate-100 dark:bg-white/5 p-2 rounded-full"><X size={20}/></button>
                </div>
                
                <div className="space-y-4 mb-8 bg-slate-50 dark:bg-[#111] p-5 rounded-2xl border border-slate-100 dark:border-white/5">
                    <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Quien Recibe (Nombre Completo)</label>
                        <input type="text" required value={shippingInfo.recipient} onChange={e=>setShippingInfo({...shippingInfo, recipient: e.target.value})} placeholder="Ej. Juan Pérez Garza" className="w-full p-3 bg-white dark:bg-[#050505] border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-indigo-500 dark:focus:border-amber-500 text-sm font-bold text-slate-800 dark:text-white transition-colors" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">País</label>
                            <input type="text" required value={shippingInfo.country} onChange={e=>setShippingInfo({...shippingInfo, country: e.target.value})} className="w-full p-3 bg-white dark:bg-[#050505] border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-indigo-500 dark:focus:border-amber-500 text-sm font-bold text-slate-800 dark:text-white transition-colors" />
                        </div>
                        <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Estado / Provincia</label>
                            <input type="text" required value={shippingInfo.state} onChange={e=>setShippingInfo({...shippingInfo, state: e.target.value})} placeholder="Ej. Nuevo León" className="w-full p-3 bg-white dark:bg-[#050505] border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-indigo-500 dark:focus:border-amber-500 text-sm font-bold text-slate-800 dark:text-white transition-colors" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Ciudad / Municipio</label>
                            <input type="text" required value={shippingInfo.city} onChange={e=>setShippingInfo({...shippingInfo, city: e.target.value})} placeholder="Ej. Monterrey" className="w-full p-3 bg-white dark:bg-[#050505] border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-indigo-500 dark:focus:border-amber-500 text-sm font-bold text-slate-800 dark:text-white transition-colors" />
                        </div>
                        <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Código Postal</label>
                            <input type="text" required value={shippingInfo.zipCode} onChange={e=>setShippingInfo({...shippingInfo, zipCode: e.target.value})} placeholder="Ej. 64000" className="w-full p-3 bg-white dark:bg-[#050505] border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-indigo-500 dark:focus:border-amber-500 text-sm font-bold text-slate-800 dark:text-white transition-colors" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Calle y Número</label>
                        <input type="text" required value={shippingInfo.address} onChange={e=>setShippingInfo({...shippingInfo, address: e.target.value})} placeholder="Ej. Av. Juárez #123, Col. Centro" className="w-full p-3 bg-white dark:bg-[#050505] border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-indigo-500 dark:focus:border-amber-500 text-sm font-bold text-slate-800 dark:text-white transition-colors" />
                    </div>

                    <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Referencias de Entrega (Opcional)</label>
                        <input type="text" value={shippingInfo.references} onChange={e=>setShippingInfo({...shippingInfo, references: e.target.value})} placeholder="Ej. Casa blanca con portón negro, frente a parque" className="w-full p-3 bg-white dark:bg-[#050505] border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-indigo-500 dark:focus:border-amber-500 text-sm font-bold text-slate-800 dark:text-white transition-colors" />
                    </div>

                    <div className="flex gap-4">
                        <div className="w-1/3">
                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Lada</label>
                            <input type="text" required value={shippingInfo.phoneCode} onChange={e=>setShippingInfo({...shippingInfo, phoneCode: e.target.value})} placeholder="+52" className="w-full p-3 bg-white dark:bg-[#050505] border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-indigo-500 dark:focus:border-amber-500 text-sm font-bold text-center text-slate-800 dark:text-white transition-colors" />
                        </div>
                        <div className="w-2/3">
                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Teléfono Móvil</label>
                            <input type="text" required value={shippingInfo.phone} onChange={e=>setShippingInfo({...shippingInfo, phone: e.target.value})} placeholder="10 dígitos" className="w-full p-3 bg-white dark:bg-[#050505] border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-indigo-500 dark:focus:border-amber-500 text-sm font-bold text-slate-800 dark:text-white transition-colors" />
                        </div>
                    </div>
                </div>

                <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-4 rounded-xl mb-6 flex items-start gap-3">
                    <AlertTriangle size={20} className="text-rose-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed font-medium">Una vez enviada la orden a taller, <strong>NO podrás editar la lista de invitados ni el diseño.</strong> Verifica que todo esté perfecto antes de continuar.</p>
                </div>

                <div className="flex gap-3">
                    <button onClick={() => setConfirmModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-[#111] text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-white/5 transition-colors uppercase tracking-widest text-[10px]">Revisar Lista</button>
                    <button 
                        disabled={!isShippingValid} 
                        onClick={() => { setConfirmModal(false); executeSendToWorkshop(); }} 
                        className="flex-1 py-4 bg-indigo-600 dark:bg-amber-500 text-white dark:text-slate-900 rounded-xl font-black shadow-lg hover:bg-indigo-700 dark:hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center uppercase tracking-widest text-[10px]">
                        <Send size={16} className="mr-2"/> Enviar Orden Definitiva
                    </button>
                </div>
            </div>
        </div>
      )}

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap'); .font-firma { font-family: 'Great Vibes', cursive; }`}</style>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-editorial text-slate-900 dark:text-white tracking-wide transition-colors">Gestor de Pulseras VIP</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 transition-colors">Sube el logo, ajusta el diseño y carga tu lista de accesos.</p>
        </div>
        {isLocked && (
           <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-xl flex items-center shadow-sm transition-colors">
             <Lock size={16} className="mr-2" />
             <span className="text-xs font-black uppercase tracking-widest">En Producción</span>
           </div>
        )}
      </div>

      {/* INTERFAZ VISUAL COMPLETA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMNA IZQUIERDA: DISEÑO DEL BRAZALETE Y PREVISUALIZACIÓN */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-[#0a0a0a] p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center"><Palette size={18} className="mr-2 text-indigo-500"/> Personalización del Brazalete</h3>
            
            <form onSubmit={handleSaveDesign} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Pre-título (Ej. Boda de / XV de)</label>
                <input type="text" disabled={isLocked} value={designConfig.preTitle} onChange={e=>setDesignConfig({...designConfig, preTitle: e.target.value})} placeholder="Ej. Boda" className="w-full p-3 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-xl text-xs outline-none focus:border-indigo-500 font-bold" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Nombre Principal / Evento</label>
                <input type="text" disabled={isLocked} value={designConfig.eventName} onChange={e=>setDesignConfig({...designConfig, eventName: e.target.value})} placeholder="Ej. Carlos & Sofia" className="w-full p-3 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-xl text-xs outline-none focus:border-indigo-500 font-bold" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Logotipo del Evento</label>
                <div className="flex items-center gap-3">
                  {designConfig.logoBase64 ? (
                    <div className="relative w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center p-1">
                      <img src={designConfig.logoBase64} alt="Logo" className="max-h-full max-w-full object-contain" />
                      {!isLocked && <button type="button" onClick={removeLogo} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md"><X size={12}/></button>}
                    </div>
                  ) : (
                    <label className={`flex-1 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl p-3 text-center cursor-pointer hover:border-indigo-500 transition-colors ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input type="file" disabled={isLocked} accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      {isUploadingLogo ? <Loader2 size={18} className="animate-spin mx-auto text-indigo-500"/> : <ImageIcon size={18} className="mx-auto text-slate-400 mb-1"/>}
                      <span className="text-[10px] font-bold text-slate-500">Subir Logo (PNG/JPG)</span>
                    </label>
                  )}
                </div>
              </div>

              {!isLocked && (
                <button type="submit" className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest shadow-md hover:scale-[1.02] transition-transform">
                  Guardar Cambios de Diseño
                </button>
              )}
            </form>
          </div>

          {/* PREVISIÓN VISUAL DEL BRAZALETE */}
          <div className="bg-white dark:bg-[#0a0a0a] p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center"><Eye size={18} className="mr-2 text-indigo-500"/> Previsualización Física</h3>
            <div className="w-full bg-slate-100 dark:bg-[#111] p-6 rounded-2xl border border-slate-200 dark:border-white/5 flex items-center justify-center overflow-x-auto">
              <div className="w-[320px] h-[55px] bg-white border-2 border-dashed border-slate-300 rounded-lg flex items-center px-3 shadow-md text-black relative shrink-0">
                <div className="text-[7px] font-black uppercase tracking-widest text-slate-400 rotate-[-90deg] shrink-0">BAULIA.COM</div>
                <div className="flex-1 flex flex-col items-center justify-center text-center px-2 overflow-hidden">
                  {designConfig.preTitle && <div className="text-[6px] font-black uppercase tracking-widest">{designConfig.preTitle}</div>}
                  {designConfig.logoBase64 ? (
                    <img src={designConfig.logoBase64} alt="Logo" className="max-h-[22px] max-w-[100px] object-contain my-0.5" />
                  ) : (
                    <div className="font-firma text-lg leading-none my-0.5">{designConfig.eventName || 'Evento VIP'}</div>
                  )}
                  {eventDateStr && <div className="text-[6px] font-bold text-slate-600">{new Date(eventDateStr).toLocaleDateString('es-MX', { timeZone: 'UTC' })}</div>}
                </div>
                <div className="w-8 h-8 border border-slate-400 rounded flex items-center justify-center shrink-0 text-[6px] font-mono font-bold text-slate-500">QR</div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: LISTA DE ACCESOS Y ENVÍO A TALLER */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-[#0a0a0a] p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center"><Users size={18} className="mr-2 text-indigo-500"/> Lista de Accesos a Producir</h3>
                <p className="text-xs text-slate-500 mt-0.5">Total de brazaletes en lote: <strong className="text-indigo-600 dark:text-amber-400">{totalPulserasSolicitadas}</strong></p>
              </div>
              {!isLocked && (
                <button onClick={() => setConfirmModal(true)} className="px-5 py-3 bg-indigo-600 dark:bg-amber-500 text-white dark:text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-transform flex items-center">
                  <Send size={16} className="mr-2"/> Enviar al Taller
                </button>
              )}
            </div>

            {/* TABLA DE INVITADOS */}
            <div className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-[#111] text-slate-400 font-bold uppercase tracking-wider sticky top-0 border-b border-slate-200 dark:border-white/10">
                    <tr>
                      <th className="px-4 py-3">Invitado Principal / Pase</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {flattenedList.length === 0 ? (
                      <tr><td colSpan="3" className="text-center py-8 text-slate-400">No hay invitados confirmados para producción.</td></tr>
                    ) : (
                      flattenedList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3">
                            <input 
                              type="text" 
                              disabled={isLocked}
                              value={item.displayName} 
                              onChange={(e) => handleUpdateNameInline(item.parentGuest.id, item._rowId, e.target.value, item.currentSubGuests)}
                              className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none w-full text-slate-800 dark:text-white font-medium py-0.5" 
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${item.isChild ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'}`}>
                              {item.isChild ? 'Pase Niño' : 'Pase VIP'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-400 font-mono text-[10px]">
                            ID: {item.pin}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default GestorPulserasView;