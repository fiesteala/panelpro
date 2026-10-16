import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';
import { Palette, QrCode, Lock, Send, Plus, FileSpreadsheet, Users, ListTodo, Trash2, Image as ImageIcon, Download, Eye, Edit3, Info, AlertTriangle, Loader2, X, Sparkles, MapPin, Truck } from 'lucide-react';
import { db } from '../firebase'; 

// ==========================================
// --- COMPONENTE: BAULIA BLACK LABEL - PRODUCCIÓN (V23: LOGÍSTICA INTERNACIONAL) ---
// ==========================================
// Catálogo de Pulseras Tyvek y Fuentes para el Atelier Black Label
const WRISTBAND_COLORS = [
  { id: 'blanca_atelier', name: 'Blanca Alta Costura', desc: 'Permite heredar colores de la invitación o tinta negra', bg: '#FFFFFF', ink: '#0F172A', border: '#E2E8F0' },
  { id: 'negra_obsidiana', name: 'Negra Obsidiana VIP', desc: 'Impresión en Dorado, Plata o Blanco', bg: '#0B0B0E', ink: '#D4AF37', border: '#27272A' },
  { id: 'oro_imperial', name: 'Oro Imperial', desc: 'Acabado metálico con tinta negra y Micro-QR', bg: '#D4AF37', ink: '#000000', border: '#B45309' },
  { id: 'plata_platino', name: 'Plata Platino', desc: 'Acabado frío con tinta negra de alta densidad', bg: '#CBD5E1', ink: '#000000', border: '#94A3B8' },
  { id: 'rose_gold', name: 'Rose Gold', desc: 'Tono cobrizo suave con tinta negra profunda', bg: '#F4C2C2', ink: '#000000', border: '#FDA4AF' }
];

const BLACK_WRISTBAND_INKS = [
  { id: '#D4AF37', name: 'Dorado Imperial', hex: '#D4AF37' },
  { id: '#CBD5E1', name: 'Plata Metálico', hex: '#CBD5E1' },
  { id: '#FFFFFF', name: 'Blanco Puro', hex: '#FFFFFF' }
];

const FONT_STYLES = [
  { id: 'caligrafia', name: 'Caligrafía Imperial', family: "'Great Vibes', cursive" },
  { id: 'editorial', name: 'Editorial Clásica', family: "'Cormorant Garamond', serif" },
  { id: 'alta_moda', name: 'Alta Moda Romana', family: "'Cinzel', serif" },
  { id: 'minimal', name: 'Minimalista Moderna', family: "'Montserrat', sans-serif" }
];

const GestorPulserasView = ({ addNotification, eventId }) => {
  const [designConfig, setDesignConfig] = useState({
    preTitle: '',
    eventName: '',
    logoBase64: '',
    pulseraColorId: 'blanca_atelier',
    pulseraInkColor: '#D4AF37',
    fontId: 'caligrafia',
    heredarInvitacion: false,
    accentColor: '#0F172A'
  });
  const [eventoRawData, setEventoRawData] = useState({});
  const [showAtelierModal, setShowAtelierModal] = useState(false);
  const [eventDateStr, setEventDateStr] = useState(''); 
  const [wristbandList, setWristbandList] = useState([]);
  const [newEntry, setNewEntry] = useState({ name: '', extraAdults: 0, extraChildren: 0 });
  const [isLocked, setIsLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  
  // 🔴 Información de Envío Estructurada (compartida con Social Wall si ya existe)
  const [shippingInfo, setShippingInfo] = useState({ 
      recipient: '', country: 'México', state: '', city: '', zipCode: '', address: '', references: '', phoneCode: '+52', phone: '' 
  });

  useEffect(() => {
    if (!eventId) return;

    const unsubEvent = onSnapshot(doc(db, "eventos", eventId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setEventoRawData(data);
        if (data.pulserasStatus === 'enviado' || data.pulserasStatus === 'impreso') {
          setIsLocked(true);
        } else {
          setIsLocked(false);
        }
        if (data.fecha) setEventDateStr(data.fecha);
        if (data.direccionEnvioTaller) {
          setShippingInfo(data.direccionEnvioTaller);
        } else if (data.direccionEnvioSocialWall) {
          setShippingInfo(data.direccionEnvioSocialWall);
        }
        
        const isSoloKit = data.plan === 'security_kit' || data.plan === 'baulia_black_label';
        setIsStandalone(isSoloKit);

        // Inteligencia para detectar logo en la vista previa de Black Label
        let autoLogo = '';
        if (data.urlInvitacion && !isSoloKit) {
           const cleanUrl = data.urlInvitacion.split('?')[0].replace(/\/$/, '');
           autoLogo = `${cleanUrl}/monograma.svg`;
        }
        
        if (data.pulserasConfig) {
           setDesignConfig(prev => ({ 
              ...prev,
              ...data.pulserasConfig, 
              logoBase64: data.pulserasConfig.logoBase64 || autoLogo 
           }));
        } else {
           setDesignConfig(prev => ({
              ...prev,
              eventName: data.nombres || prev.eventName || '',
              preTitle: data.tipoEvento ? String(data.tipoEvento).replace(/_/g, ' ').toUpperCase() : prev.preTitle,
              logoBase64: autoLogo
           }));
        }
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
    if (e && e.preventDefault) e.preventDefault();
    if (isLocked) return;
    try {
      await updateDoc(doc(db, "eventos", eventId), { pulserasConfig: designConfig });
      if(addNotification) addNotification('Diseño Guardado', 'Los datos y acabados del brazalete se actualizaron.', 'success');
    } catch (error) {
      if(addNotification) addNotification('Error', 'Fallo al guardar el diseño.', 'error');
    }
  };

  // Sincronización inteligente con la invitación web (solo en pulsera blanca)
  const handleToggleInheritance = () => {
    if (isLocked) return;
    const nextState = !designConfig.heredarInvitacion;
    if (nextState) {
      let autoLogo = designConfig.logoBase64;
      if (!autoLogo && eventoRawData.urlInvitacion) {
        const cleanUrl = eventoRawData.urlInvitacion.split('?')[0].replace(/\/$/, '');
        autoLogo = `${cleanUrl}/monograma.svg`;
      }
      const inheritedColor =
        eventoRawData.colorPrincipal ||
        eventoRawData.themeColor ||
        eventoRawData.colorTema ||
        eventoRawData.configuracion?.colorPrincipal ||
        '#0F172A';

      setDesignConfig(prev => ({
        ...prev,
        heredarInvitacion: true,
        pulseraColorId: 'blanca_atelier',
        preTitle: eventoRawData.tipoEvento ? String(eventoRawData.tipoEvento).replace(/_/g, ' ').toUpperCase() : prev.preTitle,
        eventName: eventoRawData.nombres || prev.eventName,
        logoBase64: autoLogo,
        accentColor: inheritedColor
      }));
      if (addNotification) addNotification('✨ Diseño Sincronizado', 'Tu pulsera blanca heredó los datos y color de tu invitación.', 'success');
    } else {
      setDesignConfig(prev => ({ ...prev, heredarInvitacion: false, accentColor: '#0F172A' }));
    }
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
      await updateDoc(doc(db, "eventos", eventId), { 
          pulserasStatus: 'enviado', 
          fechaEnvioTaller: new Date().toISOString(), 
          direccionEnvioTaller: shippingInfo,
          pulserasConfig: designConfig
      });
      setIsLocked(true);
      setShowAtelierModal(false);
      if(addNotification) addNotification('¡Orden Enviada!', 'Tus pulseras ya están en producción.', 'success');
    } catch (error) { 
      if(addNotification) addNotification('Error', 'Fallo de conexión.', 'error'); 
    }
  };

  if (isLoading) return <div className="p-10 text-center text-slate-500">Cargando plataforma...</div>;

  const totalPulserasSolicitadas = validWristbandList.reduce((sum, item) => sum + (Number(item.passes) || 0), 0);
  const isShippingValid = shippingInfo.recipient && shippingInfo.country && shippingInfo.state && shippingInfo.city && shippingInfo.zipCode && shippingInfo.address && shippingInfo.phone;

  const activeWristband = WRISTBAND_COLORS.find(w => w.id === designConfig.pulseraColorId) || WRISTBAND_COLORS[0];
  const activeFont = FONT_STYLES.find(f => f.id === designConfig.fontId) || FONT_STYLES[0];
  const effectiveInk =
    designConfig.pulseraColorId === 'negra_obsidiana'
      ? (designConfig.pulseraInkColor || '#D4AF37')
      : (designConfig.heredarInvitacion && designConfig.pulseraColorId === 'blanca_atelier')
      ? (designConfig.accentColor || '#0F172A')
      : activeWristband.ink;

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-500 relative">
      
      {/* 🔴 MODAL DE DATOS DE ENVÍO LOGÍSTICO */}
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

      {/* 🟢 ATELIER PHYGITAL A PANTALLA COMPLETA (MODO INDEPENDIENTE: PULSERAS BLACK LABEL) */}
      {showAtelierModal && (
        <div className="fixed inset-0 z-[9998] bg-black/95 backdrop-blur-2xl flex flex-col animate-in fade-in duration-300 text-white select-none">
          <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between bg-[#08080a] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-400">Baulia Atelier Phygital</span>
                  <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-white/10 text-slate-300">Brazaletes Tyvek • Black Label</span>
                </div>
                <h2 className="text-sm font-bold text-white leading-tight">Estudio de Personalización de Pulseras VIP</h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isLocked && (
                <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                  <Lock size={12}/> EN PRODUCCIÓN
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowAtelierModal(false)}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
              >
                <X size={15}/> Cerrar Estudio
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            {/* VISOR INTERACTIVO CENTRAL DE LA PULSERA */}
            <div className="lg:col-span-7 bg-[radial-gradient(circle_at_center,#1e1b2e_0%,#070709_75%)] p-6 sm:p-10 flex flex-col items-center justify-center relative min-h-[420px]">
              <div className="mb-6 flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/50 border border-white/10 backdrop-blur-md">
                <Eye size={13} className="text-amber-400"/>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                  Vista Previa Real • Brazalete Tyvek 25 x 1.9 cm ({activeWristband.name})
                </span>
              </div>

              <div className="w-full max-w-2xl px-2">
                <div
                  style={{
                    backgroundColor: activeWristband.bg,
                    color: effectiveInk,
                    borderColor: activeWristband.border
                  }}
                  className="w-full h-28 rounded-2xl border-2 shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex items-center overflow-hidden relative transition-all duration-300"
                >
                  <div className="w-14 h-full border-r border-dashed border-current/25 flex items-center justify-center bg-black/5 shrink-0">
                    <span className="-rotate-90 text-[7px] font-black tracking-widest uppercase opacity-50 whitespace-nowrap">PEGAMENTO</span>
                  </div>
                  <div className="w-12 h-full border-r border-current/15 flex items-center justify-center shrink-0">
                    <span className="-rotate-90 text-[7px] font-bold tracking-widest uppercase opacity-60 whitespace-nowrap">by BAULIA</span>
                  </div>
                  <div className="flex-1 h-full flex flex-col items-center justify-center text-center px-4 border-r border-current/15 overflow-hidden">
                    {designConfig.preTitle && (
                      <span className="text-[7px] font-black uppercase tracking-[0.25em] opacity-80 mb-0.5">{designConfig.preTitle}</span>
                    )}
                    {designConfig.logoBase64 ? (
                      <img src={designConfig.logoBase64} alt="Logo" className="h-10 object-contain my-0.5" />
                    ) : (
                      <span style={{ fontFamily: activeFont.family }} className="text-2xl leading-none my-1 truncate w-full">
                        {designConfig.eventName || 'Evento VIP'}
                      </span>
                    )}
                    <span className="text-[7px] font-bold tracking-widest uppercase opacity-75">
                      {eventDateStr ? new Date(eventDateStr).toLocaleDateString('es-MX', { timeZone: 'UTC' }) : '24/10/2026'}
                    </span>
                  </div>
                  <div className="w-40 h-full flex flex-col justify-center px-4 border-r border-current/15 shrink-0">
                    <span className="text-[11px] font-black uppercase tracking-wider truncate">
                      {flattenedList[0]?.displayName || 'JUAN PÉREZ'}
                    </span>
                    <span className="text-[8px] font-bold uppercase opacity-75">PASE VIP</span>
                  </div>
                  {/* Zona Micro-QR siempre en alto contraste óptico */}
                  <div className="w-24 h-full flex flex-col items-center justify-center bg-white text-black p-2 shrink-0">
                    <QrCode size={42} strokeWidth={1.8} className="text-black" />
                    <span className="text-[6px] font-black tracking-widest uppercase mt-0.5 text-slate-600">MICRO-QR</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 mt-6 text-center max-w-md">
                ✨ El Micro-QR se imprime siempre en contraste negro de alta densidad sobre ventana óptica para lectura instantánea en puerta.
              </p>
            </div>

            {/* BARRA LATERAL DERECHA DE CONTROLES DEL ATELIER */}
            <div className="lg:col-span-5 bg-[#0e0e12] border-l border-white/10 p-6 sm:p-8 overflow-y-auto custom-scrollbar space-y-6">
              {!isStandalone && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1">
                      <Sparkles size={11}/> Smart Sync Phygital
                    </span>
                    <h4 className="text-xs font-bold text-white mt-0.5">Heredar diseño de mi Invitación Web</h4>
                    <p className="text-[10px] text-slate-400 leading-snug mt-0.5">
                      Sincroniza nombres, monograma y color de tu invitación sobre la pulsera blanca.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={handleToggleInheritance}
                    className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${designConfig.heredarInvitacion ? 'bg-amber-500' : 'bg-white/15'}`}
                  >
                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${designConfig.heredarInvitacion ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
                </div>
              )}

              {/* 1. COLOR DE PULSERA */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5">
                  1. Color del Brazalete Tyvek
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {WRISTBAND_COLORS.map(wb => (
                    <button
                      key={wb.id}
                      type="button"
                      disabled={isLocked}
                      onClick={() => setDesignConfig({ ...designConfig, pulseraColorId: wb.id, heredarInvitacion: wb.id === 'blanca_atelier' ? designConfig.heredarInvitacion : false })}
                      className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                        designConfig.pulseraColorId === wb.id
                          ? 'bg-amber-500/15 border-amber-500 shadow-md'
                          : 'bg-white/5 border-white/10 hover:border-white/25'
                      }`}
                    >
                      <span style={{ backgroundColor: wb.bg }} className="w-5 h-5 rounded-full border border-white/30 shrink-0 mt-0.5"></span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{wb.name}</p>
                        <p className="text-[9px] text-slate-400 leading-tight mt-0.5 line-clamp-2">{wb.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* SELECTOR DE TINTA EXCLUSIVO SI ELIGEN PULSERA NEGRA */}
              {designConfig.pulseraColorId === 'negra_obsidiana' && (
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-amber-400 mb-2">
                    Color de Tinta sobre Pulsera Negra
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {BLACK_WRISTBAND_INKS.map(ink => (
                      <button
                        key={ink.id}
                        type="button"
                        disabled={isLocked}
                        onClick={() => setDesignConfig({ ...designConfig, pulseraInkColor: ink.hex })}
                        className={`p-2.5 rounded-xl border text-center transition-all flex items-center justify-center gap-2 ${
                          designConfig.pulseraInkColor === ink.hex
                            ? 'bg-amber-500/15 border-amber-500 text-white'
                            : 'bg-white/5 border-white/10 text-slate-400'
                        }`}
                      >
                        <span style={{ backgroundColor: ink.hex }} className="w-3.5 h-3.5 rounded-full border border-white/30"></span>
                        <span className="text-[10px] font-bold">{ink.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. TIPOGRAFÍA */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  2. Tipografía del Evento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {FONT_STYLES.map(font => (
                    <button
                      key={font.id}
                      type="button"
                      disabled={isLocked}
                      onClick={() => setDesignConfig({ ...designConfig, fontId: font.id })}
                      className={`px-3 py-2.5 rounded-xl border text-left transition-all ${
                        designConfig.fontId === font.id
                          ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-wider block opacity-60">{font.name}</span>
                      <span style={{ fontFamily: font.family }} className="text-base block truncate mt-0.5">
                        {designConfig.eventName || 'Ana & Carlos'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. TEXTOS */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Pre-Título</label>
                  <input
                    type="text"
                    disabled={isLocked}
                    value={designConfig.preTitle || ''}
                    onChange={e => setDesignConfig({ ...designConfig, preTitle: e.target.value })}
                    className="w-full p-3 rounded-xl bg-black border border-white/10 text-xs font-bold text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Nombre Principal</label>
                  <input
                    type="text"
                    disabled={isLocked}
                    value={designConfig.eventName || ''}
                    onChange={e => setDesignConfig({ ...designConfig, eventName: e.target.value })}
                    className="w-full p-3 rounded-xl bg-black border border-white/10 text-xs font-bold text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* ACCIONES */}
              {!isLocked && (
                <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleSaveDesign}
                    className="flex-1 py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-black text-[10px] uppercase tracking-widest transition-colors"
                  >
                    Guardar Diseño
                  </button>
                  <button
                    type="button"
                    disabled={validWristbandList.length === 0}
                    onClick={async () => {
                      await handleSaveDesign();
                      setShowAtelierModal(false);
                      setConfirmModal(true);
                    }}
                    className="flex-1 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    <Send size={14}/> Enviar a Taller ({totalPulserasSolicitadas})
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Great+Vibes&family=Montserrat:wght@400;600;700;900&display=swap');
        .font-firma { font-family: 'Great Vibes', cursive; }
      `}</style>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-editorial text-slate-900 dark:text-white tracking-wide transition-colors">Gestor de Pulseras VIP</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 transition-colors">Sube el logo, elige el color de pulsera en el Atelier y carga tu lista de accesos.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowAtelierModal(true)}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all"
          >
            <Sparkles size={15}/> Abrir Atelier de Brazaletes (Pantalla Completa)
          </button>
          {isLocked && (
             <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-xl flex items-center shadow-sm transition-colors">
               <Lock size={16} className="mr-2" />
               <span className="text-xs font-black uppercase tracking-widest">En Producción</span>
             </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 flex flex-col space-y-6">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col transition-colors">
            <div className="p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#111] flex items-center justify-between transition-colors">
               <div className="flex items-center">
                 <Palette size={18} className="text-indigo-500 mr-2" />
                 <h3 className="font-bold text-slate-800 dark:text-white text-sm transition-colors">Personalización del Brazalete</h3>
               </div>
               <button
                 type="button"
                 onClick={() => setShowAtelierModal(true)}
                 className="text-[10px] font-black uppercase tracking-widest text-amber-500 hover:underline flex items-center gap-1"
               >
                 <Sparkles size={12}/> Elegir Color / Papel
               </button>
            </div>
            <form onSubmit={handleSaveDesign} className="p-6 space-y-5">
              <div className="bg-slate-50 dark:bg-[#111] p-4 rounded-2xl border border-dashed border-slate-300 dark:border-white/20 text-center transition-colors">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 transition-colors">Logo del Evento (Opcional)</p>
                  {isUploadingLogo ? (
                      <div className="flex flex-col items-center justify-center py-4">
                          <Loader2 size={24} className="text-indigo-500 animate-spin mb-2" />
                          <span className="text-xs font-bold text-slate-500 mt-2 transition-colors">Subiendo...</span>
                      </div>
                  ) : designConfig.logoBase64 ? (
                      <div className="relative inline-block">
                          <img src={designConfig.logoBase64} alt="Logo Evento" className="h-16 object-contain rounded bg-white p-1 shadow-sm" />
                          {!isLocked && <button type="button" onClick={removeLogo} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md hover:bg-rose-600"><X size={12} /></button>}
                      </div>
                  ) : (
                      <label className={`flex flex-col items-center justify-center cursor-pointer transition-colors ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:text-indigo-600 dark:hover:text-amber-500'}`}>
                          <ImageIcon size={24} className="text-slate-400 mb-2 transition-colors" />
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 transition-colors">Clic para subir imagen</span>
                          <span className="text-[10px] text-slate-400 mt-1 transition-colors">Sube tu logo y mantendremos la calidad</span>
                          <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={isLocked} className="hidden" />
                      </label>
                  )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 transition-colors">Pre-Título</label>
                    <input type="text" disabled={isLocked} placeholder="Ej. Boda de:" value={designConfig.preTitle || ''} onChange={e=>setDesignConfig({...designConfig, preTitle: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-indigo-500 dark:focus:border-amber-500 text-sm font-bold text-slate-800 dark:text-white disabled:opacity-50 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 transition-colors">Nombre Principal</label>
                    <input type="text" disabled={isLocked} required placeholder="Ej. Ana & Carlos" value={designConfig.eventName} onChange={e=>setDesignConfig({...designConfig, eventName: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-indigo-500 dark:focus:border-amber-500 text-sm font-bold text-slate-800 dark:text-white disabled:opacity-50 transition-colors" />
                  </div>
              </div>
              <button type="submit" disabled={isLocked || isUploadingLogo} className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-30">Guardar Diseño</button>
            </form>
          </div>

          <div className="bg-slate-100 dark:bg-[#111] rounded-3xl p-5 border border-slate-200 dark:border-white/5 shadow-inner transition-colors">
             <div className="flex items-center justify-between mb-3">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center transition-colors"><Eye size={12} className="mr-1.5" /> Vista Previa ({activeWristband.name})</h4>
               <button type="button" onClick={() => setShowAtelierModal(true)} className="text-[9px] font-bold text-amber-500 hover:underline">Ampliar en Atelier</button>
             </div>
             <div
               style={{ backgroundColor: activeWristband.bg, color: effectiveInk, borderColor: activeWristband.border }}
               className="w-full h-20 rounded shadow-md border overflow-hidden flex items-stretch transition-colors"
             >
                <div className="w-[10%] bg-black/5 border-r border-dashed border-current/20 flex items-center justify-center"><span className="text-[6px] opacity-60 font-bold -rotate-90 tracking-widest">PEGAMENTO</span></div>
                <div className="w-[12%] flex items-center justify-center border-r border-current/10"><span className="text-[5px] opacity-60 font-bold -rotate-90 tracking-widest">by BAULIA</span></div>
                <div className="w-[38%] flex flex-col items-center justify-center border-r border-current/10 p-1 relative overflow-hidden">
                    {designConfig.preTitle && <span className="text-[5px] font-black opacity-75 uppercase tracking-widest mb-0.5">{designConfig.preTitle}</span>}
                    {designConfig.logoBase64 ? ( <img src={designConfig.logoBase64} alt="Logo" className="h-7 object-contain mb-1" /> ) : ( <div style={{ fontFamily: activeFont.family }} className="text-xl leading-none mb-1 truncate w-full text-center px-1">{designConfig.eventName || 'Evento VIP'}</div> )}
                    <span className="text-[5px] font-black opacity-60 uppercase tracking-widest">{eventDateStr ? new Date(eventDateStr).toLocaleDateString('es-MX', { timeZone: 'UTC' }) : 'Fecha de Evento'}</span>
                </div>
                <div className="w-[25%] flex flex-col justify-center px-2"><span className="text-[8px] font-black uppercase truncate">Juan Pérez</span><span className="text-[6px] font-bold opacity-70 mt-0.5">Pase VIP</span></div>
                <div className="w-[15%] bg-white text-black flex items-center justify-center pr-1"><QrCode size={24} className="text-slate-900" strokeWidth={1.5} /></div>
             </div>
          </div>

          <div className="bg-indigo-600 dark:bg-amber-500 rounded-3xl p-6 text-white dark:text-slate-900 shadow-xl flex flex-col items-center text-center gap-5 transition-colors">
             <div>
               <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Total a Imprimir</p>
               <h3 className="text-5xl font-editorial font-black">{totalPulserasSolicitadas} <span className="text-base font-sans font-medium opacity-80">pulseras</span></h3>
             </div>
             <button onClick={() => { if (validWristbandList.length === 0) return; setConfirmModal(true); }} disabled={isLocked || validWristbandList.length === 0} className="w-full py-4 px-8 bg-white text-indigo-700 dark:text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center">
               <Send size={16} className="mr-2" /> {isLocked ? 'Orden en Proceso' : 'Enviar a Taller'}
             </button>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col h-full min-h-[600px]">
          <div className="flex-1 bg-white dark:bg-[#0a0a0a] rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col h-full transition-colors">
            <div className="bg-sky-50 dark:bg-sky-900/20 border-b border-sky-100 dark:border-sky-800/30 p-4 flex items-start gap-3 transition-colors">
               <Info size={20} className="text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
               <div className="text-xs text-sky-800 dark:text-sky-200 leading-relaxed transition-colors">
                  <strong className="block mb-1">¿Cómo funciona esta lista?</strong>
                  {isStandalone ? (
                      <>1. El nombre <b>Titular</b> genera automáticamente <span className="underline">1 pulsera</span>.<br/>2. Agrega la cantidad de extras que ingresarán con el titular.<br/>3. Da clic en los nombres generados para editarlos antes de imprimir.</>
                  ) : (
                      <>1. <b>Sincronización Automática:</b> Tus invitados confirmados aparecerán aquí al instante.<br/>2. <b>Edición en vivo:</b> Da clic en los nombres generados para editarlos antes de imprimir.</>
                  )}
               </div>
            </div>

            <div className="p-5 border-b border-slate-100 dark:border-white/5 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shrink-0 transition-colors">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center transition-colors"><Sparkles size={16} className="mr-2 text-indigo-500" /> Lista de Producción</h3>
              {!isLocked && isStandalone && (
                  <div className="flex gap-2 w-full xl:w-auto">
                    <button onClick={downloadTemplate} className="flex-1 xl:flex-none px-3 py-2 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-300 dark:hover:bg-white/20 transition-colors flex items-center justify-center border border-slate-200 dark:border-transparent"><Download size={14} className="mr-1.5"/> Plantilla CSV</button>
                    <label className="cursor-pointer flex-1 xl:flex-none px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors flex items-center justify-center">
                        <FileSpreadsheet size={14} className="mr-1.5" /> Subir CSV
                        <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
              )}
            </div>
            
            {!isLocked && isStandalone && (
                <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-transparent shrink-0 transition-colors">
                    <form onSubmit={handleAddEntry} className="flex flex-col sm:flex-row w-full gap-3 items-end">
                        <div className="flex-1 w-full">
                           <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block transition-colors">Titular (Manual)</span>
                           <input type="text" required placeholder="Ej. Familia Garza" value={newEntry.name} onChange={e=>setNewEntry({...newEntry, name: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500 dark:focus:border-amber-500 transition-colors" />
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto items-end">
                          <div className="flex flex-col w-full sm:w-24">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block transition-colors">Adultos</span>
                            <input type="number" min="0" value={newEntry.extraAdults} onChange={e=>setNewEntry({...newEntry, extraAdults: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-black text-center text-indigo-600 dark:text-amber-500 outline-none focus:border-indigo-500 dark:focus:border-amber-500 transition-colors" />
                          </div>
                          <div className="flex flex-col w-full sm:w-24">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block transition-colors">Niños</span>
                            <input type="number" min="0" value={newEntry.extraChildren} onChange={e=>setNewEntry({...newEntry, extraChildren: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-black text-center text-sky-600 dark:text-sky-400 outline-none focus:border-indigo-500 dark:focus:border-amber-500 transition-colors" />
                          </div>
                          <button type="submit" className="px-4 w-full sm:w-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 flex items-center justify-center font-bold text-xs h-[46px] transition-colors"><Plus size={18} className="md:mr-1" /> <span className="hidden md:inline">Agregar</span></button>
                        </div>
                    </form>
                </div>
            )}

            <div className="overflow-y-auto custom-scrollbar flex-1 max-h-[700px]">
              {flattenedList.length === 0 ? (
                <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-slate-400 p-8 text-center transition-colors">
                  <ListTodo size={40} className="mb-3 opacity-20" />
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300 transition-colors">La tabla está vacía.</p>
                  {!isStandalone && <p className="text-xs text-slate-500 mt-2 max-w-sm transition-colors">Los invitados que tengan estatus <strong className="text-emerald-600 dark:text-emerald-500">CONFIRMADO</strong> en tu Lista principal aparecerán aquí mágicamente al instante.</p>}
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-[#111] text-[10px] uppercase font-black text-slate-400 tracking-widest sticky top-0 border-b border-slate-200 dark:border-white/5 z-10 transition-colors">
                    <tr>
                      <th className="px-6 py-3">Nombre en Brazalete (Clic para editar)</th>
                      <th className="px-4 py-3 text-center">Tipo</th>
                      <th className="px-4 py-3 text-right">Controles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 transition-colors">
                    {flattenedList.map((row) => (
                      <tr key={row._rowId} className={`transition-colors hover:bg-slate-50 dark:hover:bg-white/5 ${row.isMain ? 'bg-white dark:bg-transparent border-t-[3px] border-slate-200 dark:border-white/10' : 'bg-slate-50/50 dark:bg-white/[0.02]'}`}>
                        <td className="px-6 py-3 flex items-center">
                          <div className="relative w-full group flex items-center bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 rounded transition-colors p-1 -ml-1">
                              {!isLocked && <Edit3 size={12} className="absolute -left-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
                              <input type="text" defaultValue={row.displayName} disabled={isLocked} onBlur={(e) => handleUpdateNameInline(row.parentGuest.id, row.pin, e.target.value, row.currentSubGuests)} className={`w-full bg-transparent outline-none border-b border-transparent focus:border-indigo-500 dark:focus:border-amber-500 transition-colors ${row.isMain ? 'font-bold text-slate-800 dark:text-white' : 'font-medium text-slate-500 dark:text-slate-400'} disabled:opacity-80`} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {row.isChild ? ( <span className="text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 px-2 py-0.5 rounded text-[8px] uppercase font-black tracking-widest transition-colors">Niño</span> ) : ( <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest transition-colors">Adulto</span> )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {row.isMain && !isLocked && isStandalone && ( <button onClick={() => handleRemoveEntry(row.parentGuest.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"><Trash2 size={16} /></button> )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestorPulserasView;