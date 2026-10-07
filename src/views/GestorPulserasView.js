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
  
  // 🔴 NUEVO ESTADO: Información de Envío Estructurada
  const [shippingInfo, setShippingInfo] = useState({ 
      recipient: '', country: 'México', state: '', city: '', zipCode: '', address: '', references: '', phoneCode: '+52', phone: '' 
  });

  useEffect(() => {
    if (!eventId) return;

    const unsubEvent = onSnapshot(doc(db, "eventos", eventId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // 🟢 ESCUDO: Si pulserasConfig no existe, cargamos una estructura vacía pero segura
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

  const downloadTemplate = () => { /* Código CSV Omitido para brevedad, sigue intacto en tu archivo real, cópialo de arriba si es necesario */ };
  const handleFileUpload = (e) => { /* Código CSV Omitido para brevedad, sigue intacto en tu archivo real, cópialo de arriba si es necesario */ };

  const executeSendToWorkshop = async () => {
    try {
      await updateDoc(doc(db, "eventos", eventId), { pulserasStatus: 'enviado', fechaEnvioTaller: new Date().toISOString(), direccionEnvioTaller: shippingInfo });
      setIsLocked(true);
      if(addNotification) addNotification('¡Orden Enviada!', 'Tus pulseras ya están en producción.', 'success');
    } catch (error) { if(addNotification) addNotification('Error', 'Fallo de conexión.', 'error'); }
  };

  if (isLoading) return <div className="p-10 text-center text-slate-500">Cargando plataforma...</div>;

  const totalPulserasSolicitadas = validWristbandList.reduce((sum, item) => sum + (Number(item.passes) || 0), 0);

  // Validación de que llenen todo el formulario
  const isShippingValid = shippingInfo.recipient && shippingInfo.country && shippingInfo.state && shippingInfo.city && shippingInfo.zipCode && shippingInfo.address && shippingInfo.phone;

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-500 relative">
      
      {/* 🔴 NUEVO MODAL DE DATOS DE ENVÍO LOGÍSTICO */}
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

      {/* RESTO DE LA INTERFAZ ORIGINAL INTACTA (Columna 5 y Columna 7) */}
      {/* ... (Tu código de interfaz sigue exactamente igual aquí) ... */}
      
      {/* Solo como recordatorio: El botón de enviar al final ahora llama a confirmModal */}
      
    </div>
  );
};

export default GestorPulserasView;