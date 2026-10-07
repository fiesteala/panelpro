import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, setDoc, deleteDoc, collection, onSnapshot, writeBatch } from 'firebase/firestore';
import { Palette, QrCode, Lock, Send, Plus, FileSpreadsheet, Users, ListTodo, Trash2, Image as ImageIcon, Download, Eye, Edit3, Info, AlertTriangle, Loader2, X, Sparkles } from 'lucide-react';
import { db } from '../firebase'; 

// ==========================================
// --- COMPONENTE: BAULIA BLACK LABEL (INTELIGENCIA HÍBRIDA & TIEMPO REAL) ---
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
  
  // 🔴 NUEVA VARIABLE: Define si es independiente o híbrido
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (!eventId) return;

    // 1. ESCÁNER EN TIEMPO REAL PARA EL EVENTO (Detecta si es Independiente o Híbrido)
    const unsubEvent = onSnapshot(doc(db, "eventos", eventId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.pulserasConfig) setDesignConfig(data.pulserasConfig);
        if (data.pulserasStatus === 'enviado' || data.pulserasStatus === 'impreso') setIsLocked(true);
        if (data.fecha) setEventDateStr(data.fecha);
        
        // Si su plan principal es security_kit, es independiente. De lo contrario, es híbrido.
        const isSoloKit = data.plan === 'security_kit' || data.plan === 'baulia_black_label';
        setIsStandalone(isSoloKit);
      }
    });

    // 2. ESCÁNER EN TIEMPO REAL PARA INVITADOS (Sincronización instantánea)
    const unsubGuests = onSnapshot(collection(db, "eventos", eventId, "invitados"), (listSnap) => {
      const listData = listSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      let requiresUpdate = false;
      const batch = writeBatch(db);

      const processedList = listData.map((guest) => {
          const isConfirmed = guest.status === 'confirmado' || guest.status === 'ingreso';

          if (guest.isSecurityKit || guest.isBlackLabel) {
              return guest;
          }

          // Si acaba de confirmar en la otra pestaña, lo preparamos al instante
          if (isConfirmed) {
              requiresUpdate = true;
              let newSubGuests = guest.subGuests || [];
              const totalPases = guest.passes || 1;
              
              if (newSubGuests.length === 0) {
                  newSubGuests = [
                      { id: `usr_${guest.id}_0`, name: guest.name, isChild: false, entered: false },
                      ...Array(Math.max(0, totalPases - 1)).fill(null).map((_, i) => ({ id: `usr_${guest.id}_A${i}`, name: `Acompañante ${i+1}`, isChild: false, entered: false }))
                  ];
              }

              const updatedGuest = { ...guest, subGuests: newSubGuests, isBlackLabel: true, isSecurityKit: true };
              const guestRef = doc(db, "eventos", eventId, "invitados", guest.id);
              batch.update(guestRef, { subGuests: newSubGuests, isBlackLabel: true, isSecurityKit: true });
              return updatedGuest;
          }
          return null; 
      }).filter(g => g !== null); 

      if (requiresUpdate && !isLocked) {
           batch.commit().catch(e => console.error(e));
      }

      setWristbandList(processedList);
      setIsLoading(false);
    });

    return () => {
        unsubEvent();
        unsubGuests();
    };
  }, [eventId, isLocked]);

  // 🔴 FILTRO INTELIGENTE: Si es híbrido, SOLO muestra a los que siguen confirmados.
  // Si en la pestaña principal cancelan a alguien, aquí desaparece al instante.
  const validWristbandList = isStandalone 
    ? wristbandList 
    : wristbandList.filter(g => g.status === 'confirmado' || g.status === 'ingreso');

  const handleSaveDesign = async (e) => {
    e.preventDefault();
    if (isLocked) return;
    try {
      await updateDoc(doc(db, "eventos", eventId), { pulserasConfig: designConfig });
      if(addNotification) addNotification('Diseño Guardado', 'Los datos del brazalete se actualizaron.', 'success');
    } catch (error) {
      if(addNotification) addNotification('Error', 'Fallo al guardar el diseño.', 'error');
    }
  };

  const handleLogoUpload = async (e) => {
    if (isLocked) return;
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        if(addNotification) addNotification('Archivo no válido', 'Por favor sube una imagen (JPG o PNG).', 'warning');
        return;
    }

    setIsUploadingLogo(true);
    const CLOUD_NAME = "duy0mcqsh"; 
    const UPLOAD_PRESET = "ml_default"; 

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.secure_url) {
        setDesignConfig(prev => ({ ...prev, logoBase64: data.secure_url }));
      }
    } catch (err) {
      console.error("Error en Cloudinary:", err);
    } finally {
      setIsUploadingLogo(false);
      e.target.value = null; 
    }
  };

  const removeLogo = () => {
      if(isLocked) return;
      setDesignConfig({ ...designConfig, logoBase64: '' });
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (isLocked || !isStandalone) return;
    
    const guestName = newEntry.name.trim();
    const adExtras = Number(newEntry.extraAdults) || 0;
    const niExtras = Number(newEntry.extraChildren) || 0;
    const totalPases = 1 + adExtras + niExtras;

    if (!guestName) return;
    
    const newId = `p_${Date.now()}`;
    const initSubGuests = [
      { id: `usr_${newId}_0`, name: guestName, isChild: false, entered: false },
      ...Array(adExtras).fill(null).map((_, i) => ({ id: `usr_${newId}_A${i}`, name: `Acompañante ${i+1}`, isChild: false, entered: false })),
      ...Array(niExtras).fill(null).map((_, i) => ({ id: `usr_${newId}_N${i}`, name: `Niño ${i+1}`, isChild: true, entered: false }))
    ];
    
    const newDoc = { 
      name: guestName, passes: totalPases, originalPasses: totalPases, childrenPasses: niExtras,
      status: 'confirmado', side: 'general', entered: 0, tableId: null, sent: false, 
      subGuests: initSubGuests, extraRequested: 0, isBlackLabel: true, isSecurityKit: true 
    };
    
    try {
      await setDoc(doc(db, "eventos", eventId, "invitados", newId), newDoc);
      setNewEntry({ name: '', extraAdults: 0, extraChildren: 0 }); 
      if(addNotification) addNotification('Agregado', `${guestName} y acompañantes añadidos.`, 'success');
    } catch (error) {}
  };

  const handleRemoveEntry = async (id) => {
    if (isLocked || !isStandalone) return;
    try {
      await deleteDoc(doc(db, "eventos", eventId, "invitados", id));
    } catch (error) {}
  };

  const handleUpdateNameInline = async (parentId, subGuestId, newName) => {
    if (isLocked || !newName.trim()) return;
    
    // Obtenemos al invitado directo desde la base de datos para no cruzar cables
    const parentIndex = validWristbandList.findIndex(g => g.id === parentId);
    if (parentIndex === -1) return;

    const parent = { ...validWristbandList[parentIndex] };
    const subIndex = parent.subGuests.findIndex(sg => sg.id === subGuestId);

    if (subIndex > -1) {
        parent.subGuests[subIndex].name = newName.trim();
        if (subIndex === 0) parent.name = newName.trim();
    }

    try {
        await updateDoc(doc(db, "eventos", eventId, "invitados", parentId), { name: parent.name, subGuests: parent.subGuests });
    } catch (err) {}
  };

  const downloadTemplate = () => {
    let csv = "";
    csv += "\"BAULIA TECHNOLOGIES - FORMATO OFICIAL DE PRODUCCIÓN\"\n";
    csv += `"Evento: ${designConfig.eventName || 'Tu Evento'}"\n`;
    csv += "\"=================================================================\"\n";
    csv += "\"INSTRUCCIONES DE LLENADO:\"\n";
    csv += "\"1. En 'Titular o Familia' escribe el nombre principal. Esto genera 1 brazalete automático.\"\n";
    csv += "\"2. En 'Acompañantes' y 'Niños' si no tienes nombre pon NUMEROS (Ej. 2). Si no hay extras pon 0.\"\n";
    csv += "\"3. Si tienes los nombres, escríbelos separados por una diagonal (Ej. Ana / Carlos).\"\n";
    csv += "\"4. Puedes combinar nombre y número de pases separados con la / si no te sabes los demás nombres (Ej. Ana / 2).\"\n";
    csv += "\"5. Guarda el archivo manteniendo el formato CSV y súbelo a la plataforma.\"\n";
    csv += "\"=================================================================\"\n\n";
    
    csv += "Titular o Familia,Acompañantes EXTRAS,Niños EXTRAS\n";
    csv += "Familia Garza,Ana / Carlos / 2,Mia / 1\n";
    csv += "Juan Perez,2,0\n";
    csv += "Sofia Rodriguez,0,1\n";

    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Plantilla_Brazaletes_${designConfig.eventName ? designConfig.eventName.replace(/\s+/g, '_') : 'Baulia'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e) => {
    if (isLocked || !isStandalone) return;
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
        if(addNotification) addNotification('Formato Incorrecto', 'El archivo debe ser .CSV.', 'error');
        return;
    }

    if(addNotification) addNotification('Procesando', 'Analizando matriz de nombres...', 'info');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const rawRows = text.split(/\r?\n/); 
      
      const headerIndex = rawRows.findIndex(row => row.toLowerCase().includes('titular o familia'));
      let validRows = headerIndex !== -1 ? rawRows.slice(headerIndex + 1) : rawRows; 

      const cleanRows = validRows.filter(row => {
          const lowerRow = row.toLowerCase().trim();
          if (!lowerRow || lowerRow.replace(/,/g, '').replace(/;/g, '') === '') return false;
          if (lowerRow.includes('===') || lowerRow.includes('baulia')) return false;
          if (lowerRow.includes('instrucciones')) return false;
          if (lowerRow.includes('evento:')) return false;
          if (lowerRow.includes('titular o familia')) return false;
          if (lowerRow.includes('guarda el archivo')) return false;
          if (lowerRow.includes('formato oficial')) return false;
          if (/^[0-9]+\./.test(lowerRow)) return false; 
          if (lowerRow.includes('ej.')) return false;
          return true;
      });

      const processExtrasCol = (colStr, prefixText) => {
          if (!colStr) return [];
          const parts = colStr.split('/').map(s => s.trim()).filter(s => s);
          let countGeneric = 0;
          let namedList = [];
          
          parts.forEach(p => {
              if (/^\d+$/.test(p)) { countGeneric += parseInt(p, 10); } 
              else { namedList.push(p); }
          });

          const finalArray = [...namedList];
          for (let k = 0; k < countGeneric; k++) { finalArray.push(`${prefixText} ${namedList.length + k + 1}`); }
          return finalArray;
      };
      
      const promesas = [];
      const baseTime = Date.now();

      for(let i = 0; i < cleanRows.length; i++) {
        const delimiter = cleanRows[i].includes(';') ? ';' : ',';
        const cols = cleanRows[i].split(delimiter); 
        
        if (cols[0] && cols[0].trim() !== '') {
          const guestName = cols[0].replace(/['"]/g, '').trim();
          const adCol = cols[1] ? cols[1].replace(/['"]/g, '').trim() : "0";
          const niCol = cols[2] ? cols[2].replace(/['"]/g, '').trim() : "0";

          const adArray = processExtrasCol(adCol, 'Acompañante');
          const niArray = processExtrasCol(niCol, 'Niño');

          const totalPases = 1 + adArray.length + niArray.length;
          const newId = `p_${baseTime + i}`;

          const initSubGuests = [
              { id: `usr_${newId}_0`, name: guestName, isChild: false, entered: false },
              ...adArray.map((n, idx) => ({ id: `usr_${newId}_A${idx}`, name: n, isChild: false, entered: false })),
              ...niArray.map((n, idx) => ({ id: `usr_${newId}_N${idx}`, name: n, isChild: true, entered: false }))
          ];

          const newDoc = { 
            name: guestName, passes: totalPases, originalPasses: totalPases, childrenPasses: niArray.length,
            status: 'confirmado', side: 'general', entered: 0, tableId: null, sent: false, 
            subGuests: initSubGuests, extraRequested: 0, isBlackLabel: true, isSecurityKit: true 
          };
          
          promesas.push(setDoc(doc(db, "eventos", eventId, "invitados", newId), newDoc));
        }
      }

      try {
        if(promesas.length === 0) {
            if(addNotification) addNotification('Archivo Vacío', 'No se encontraron nombres válidos.', 'warning');
            return;
        }
        await Promise.all(promesas);
        if(addNotification) addNotification('¡Éxito!', `Se importó la lista correctamente.`, 'success');
      } catch (err) {
        if(addNotification) addNotification('Error', 'Hubo un fallo al guardar la lista en la nube.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = null; 
  };

  const executeSendToWorkshop = async () => {
    try {
      await updateDoc(doc(db, "eventos", eventId), { pulserasStatus: 'enviado', fechaEnvioTaller: new Date().toISOString() });
      setIsLocked(true);
      if(addNotification) addNotification('¡Orden Enviada!', 'El pedido está en producción.', 'success');
    } catch (error) {}
  };

  if (isLoading) return <div className="p-10 text-center text-slate-500">Cargando plataforma...</div>;

  const totalPulserasSolicitadas = validWristbandList.reduce((sum, item) => sum + (Number(item.passes) || 0), 0);
  
  const flattenedList = [];
  validWristbandList.forEach(guest => {
    (guest.subGuests || []).forEach((sg, idx) => {
      flattenedList.push({ _rowId: sg.id, parentGuest: guest, displayName: sg.name || (sg.isChild ? 'Niño' : 'Acompañante'), isMain: idx === 0, isChild: sg.isChild, pin: sg.id });
    });
  });

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-500 relative">
      {confirmModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 transition-all">
            <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center border border-white/10 animate-in zoom-in-95">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Confirmar Producción</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Una vez enviado, NO podrás editar la lista ni el diseño. ¿Todo está perfecto?</p>
                <div className="flex gap-3">
                    <button onClick={() => setConfirmModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-[#111] text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 transition-colors">Revisar</button>
                    <button onClick={() => { setConfirmModal(false); executeSendToWorkshop(); }} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-colors">Sí, Enviar</button>
                </div>
            </div>
        </div>
      )}

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap'); .font-firma { font-family: 'Great Vibes', cursive; }`}</style>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-editorial text-slate-900 dark:text-white tracking-wide">Gestor de Pulseras VIP</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Sube el logo, ajusta el diseño y carga tu lista de accesos.</p>
        </div>
        {isLocked && (
           <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl flex items-center shadow-sm">
             <Lock size={16} className="mr-2" />
             <span className="text-xs font-black uppercase tracking-widest">En Producción</span>
           </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 flex flex-col space-y-6">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50 flex items-center">
               <Palette size={18} className="text-indigo-500 mr-2" />
               <h3 className="font-bold text-slate-800 dark:text-white text-sm">Personalización del Brazalete</h3>
            </div>
            <form onSubmit={handleSaveDesign} className="p-6 space-y-5">
              <div className="bg-slate-50 dark:bg-[#111] p-4 rounded-2xl border border-dashed border-slate-300 text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Logo del Evento (Opcional)</p>
                  {isUploadingLogo ? (
                      <div className="flex flex-col items-center justify-center py-4">
                          <Loader2 size={24} className="text-indigo-500 animate-spin mb-2" />
                          <span className="text-xs font-bold text-slate-500 mt-2">Subiendo...</span>
                      </div>
                  ) : designConfig.logoBase64 ? (
                      <div className="relative inline-block">
                          <img src={designConfig.logoBase64} alt="Logo Evento" className="h-16 object-contain rounded bg-white p-1 shadow-sm" />
                          {!isLocked && <button type="button" onClick={removeLogo} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md hover:bg-rose-600"><X size={12} /></button>}
                      </div>
                  ) : (
                      <label className={`flex flex-col items-center justify-center cursor-pointer transition-colors ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:text-indigo-600'}`}>
                          <ImageIcon size={24} className="text-slate-400 mb-2" />
                          <span className="text-xs font-bold text-slate-600">Clic para subir imagen</span>
                          <span className="text-[10px] text-slate-400 mt-1">Sube tu logo y mantendremos la calidad</span>
                          <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={isLocked} className="hidden" />
                      </label>
                  )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Pre-Título</label>
                    <input type="text" disabled={isLocked} placeholder="Ej. Boda de:" value={designConfig.preTitle || ''} onChange={e=>setDesignConfig({...designConfig, preTitle: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm font-bold disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nombre Principal</label>
                    <input type="text" disabled={isLocked} required placeholder="Ej. Ana & Carlos" value={designConfig.eventName} onChange={e=>setDesignConfig({...designConfig, eventName: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm font-bold disabled:opacity-50" />
                  </div>
              </div>
              <button type="submit" disabled={isLocked || isUploadingLogo} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-slate-800 transition-colors disabled:opacity-30">Guardar Diseño</button>
            </form>
          </div>

          <div className="bg-slate-100 dark:bg-[#111] rounded-3xl p-5 border border-slate-200 shadow-inner">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center"><Eye size={12} className="mr-1.5" /> Vista Previa</h4>
             <div className="w-full bg-white h-20 rounded shadow-md border border-slate-200 overflow-hidden flex items-stretch">
                <div className="w-[10%] bg-slate-100 border-r border-dashed border-slate-300 flex items-center justify-center"><span className="text-[6px] text-slate-400 font-bold -rotate-90 tracking-widest">PEGAMENTO</span></div>
                <div className="w-[12%] flex items-center justify-center border-r border-slate-100"><span className="text-[5px] text-slate-400 font-bold -rotate-90 tracking-widest">by BAULIA</span></div>
                <div className="w-[38%] flex flex-col items-center justify-center border-r border-slate-100 p-1 relative overflow-hidden">
                    {designConfig.preTitle && <span className="text-[5px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{designConfig.preTitle}</span>}
                    {designConfig.logoBase64 ? ( <img src={designConfig.logoBase64} alt="Logo" className="h-7 object-contain mb-1" /> ) : ( <div className="font-firma text-xl text-slate-800 leading-none mb-1 truncate w-full text-center px-1">{designConfig.eventName || 'Evento VIP'}</div> )}
                    <span className="text-[5px] font-black text-slate-400 uppercase tracking-widest">{eventDateStr ? new Date(eventDateStr).toLocaleDateString('es-MX', { timeZone: 'UTC' }) : 'Fecha de Evento'}</span>
                </div>
                <div className="w-[25%] flex flex-col justify-center px-2"><span className="text-[8px] font-black uppercase text-slate-900 truncate">Juan Pérez</span><span className="text-[6px] font-bold text-slate-500 mt-0.5">Pase VIP</span></div>
                <div className="w-[15%] flex items-center justify-center pr-1"><QrCode size={24} className="text-slate-800" strokeWidth={1.5} /></div>
             </div>
          </div>

          <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl flex flex-col items-center text-center gap-5">
             <div>
               <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Total a Imprimir</p>
               <h3 className="text-5xl font-editorial font-black">{totalPulserasSolicitadas} <span className="text-base font-sans font-medium opacity-80">pulseras</span></h3>
             </div>
             <button onClick={() => { if (validWristbandList.length === 0) return; setConfirmModal(true); }} disabled={isLocked || validWristbandList.length === 0} className="w-full py-4 px-8 bg-white text-indigo-700 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-transform disabled:opacity-50 flex items-center justify-center">
               <Send size={16} className="mr-2" /> {isLocked ? 'Orden en Proceso' : 'Enviar a Taller'}
             </button>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col h-full min-h-[600px]">
          <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="bg-sky-50 border-b border-sky-100 p-4 flex items-start gap-3">
               <Info size={20} className="text-sky-600 shrink-0 mt-0.5" />
               <div className="text-xs text-sky-800 leading-relaxed">
                  <strong className="block mb-1">¿Cómo funciona esta lista?</strong>
                  {isStandalone ? (
                     <>1. El nombre <b>Titular</b> genera automáticamente <span className="underline">1 pulsera</span>.<br/>2. Agrega la cantidad de extras que ingresarán con el titular.<br/>3. Da clic en los nombres generados para editarlos antes de imprimir.</>
                  ) : (
                     <>1. <b>Sincronización Automática:</b> Tus invitados confirmados aparecerán aquí al instante.<br/>2. <b>Edición en vivo:</b> Da clic en los nombres generados para editarlos antes de imprimir.</>
                  )}
               </div>
            </div>

            <div className="p-5 border-b border-slate-100 flex justify-between items-center gap-4 shrink-0">
              <h3 className="font-bold text-slate-800 text-sm flex items-center"><Sparkles size={16} className="mr-2 text-indigo-500" /> Lista de Producción</h3>
              {!isLocked && isStandalone && (
                  <div className="flex gap-2 w-full xl:w-auto">
                    <button onClick={downloadTemplate} className="flex-1 xl:flex-none px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-300 transition-colors flex items-center justify-center border border-slate-200"><Download size={14} className="mr-1.5"/> Plantilla CSV</button>
                    <label className="cursor-pointer flex-1 xl:flex-none px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-100 transition-colors flex items-center justify-center">
                        <FileSpreadsheet size={14} className="mr-1.5" /> Subir CSV
                        <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
              )}
            </div>
            
            {/* 🔴 SI ES HÍBRIDO, SE OCULTA EL FORMULARIO MANUAL */}
            {!isLocked && isStandalone && (
                <div className="p-4 border-b border-slate-100 bg-white shrink-0">
                    <form onSubmit={handleAddEntry} className="flex flex-col sm:flex-row w-full gap-3 items-end">
                        <div className="flex-1 w-full">
                           <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Titular (Manual)</span>
                           <input type="text" required placeholder="Ej. Familia Garza" value={newEntry.name} onChange={e=>setNewEntry({...newEntry, name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500" />
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto items-end">
                          <div className="flex flex-col w-full sm:w-24">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Adultos</span>
                            <input type="number" min="0" value={newEntry.extraAdults} onChange={e=>setNewEntry({...newEntry, extraAdults: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-center text-indigo-600 outline-none focus:border-indigo-500" />
                          </div>
                          <div className="flex flex-col w-full sm:w-24">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Niños</span>
                            <input type="number" min="0" value={newEntry.extraChildren} onChange={e=>setNewEntry({...newEntry, extraChildren: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-center text-sky-600 outline-none focus:border-indigo-500" />
                          </div>
                          <button type="submit" className="px-4 w-full sm:w-auto bg-slate-900 text-white rounded-xl hover:bg-slate-800 flex items-center justify-center font-bold text-xs h-[46px]"><Plus size={18} className="md:mr-1" /> <span className="hidden md:inline">Agregar</span></button>
                        </div>
                    </form>
                </div>
            )}

            <div className="overflow-y-auto custom-scrollbar flex-1 max-h-[700px]">
              {flattenedList.length === 0 ? (
                <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                  <ListTodo size={40} className="mb-3 opacity-20" />
                  <p className="text-sm font-bold text-slate-600">La tabla está vacía.</p>
                  {!isStandalone && <p className="text-xs text-slate-500 mt-2 max-w-sm">Los invitados que confirmen asistencia en tu Lista principal aparecerán aquí automáticamente.</p>}
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest sticky top-0 border-b border-slate-200 z-10">
                    <tr>
                      <th className="px-6 py-3">Nombre en Brazalete (Clic para editar)</th>
                      <th className="px-4 py-3 text-center">Tipo</th>
                      <th className="px-4 py-3 text-right">Controles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {flattenedList.map((row) => (
                      <tr key={row._rowId} className={`transition-colors hover:bg-slate-50 ${row.isMain ? 'bg-white border-t-[3px] border-slate-200' : 'bg-slate-50/50'}`}>
                        <td className="px-6 py-3 flex items-center">
                          <div className="relative w-full group flex items-center bg-transparent hover:bg-slate-100 rounded p-1 -ml-1">
                              {!isLocked && <Edit3 size={12} className="absolute -left-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
                              <input type="text" defaultValue={row.displayName} disabled={isLocked} onBlur={(e) => handleUpdateNameInline(row.parentGuest.id, row.pin, e.target.value)} className={`w-full bg-transparent outline-none border-b border-transparent focus:border-indigo-500 ${row.isMain ? 'font-bold text-slate-800' : 'font-medium text-slate-500'}`} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {row.isChild ? ( <span className="text-sky-600 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded text-[8px] uppercase font-black tracking-widest">Niño</span> ) : ( <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Adulto</span> )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {/* 🔴 SI ES HÍBRIDO, SE OCULTA EL BOTÓN DE ELIMINAR */}
                          {row.isMain && !isLocked && isStandalone && ( <button onClick={() => handleRemoveEntry(row.parentGuest.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16} /></button> )}
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