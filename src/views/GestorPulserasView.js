import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { Palette, QrCode, Lock, Send, Plus, FileSpreadsheet, Users, ListTodo, Trash2, Image as ImageIcon, Download, Eye, Edit3, Info, AlertTriangle } from 'lucide-react';
import { db } from '../firebase'; 

// ==========================================
// --- COMPONENTE: GESTOR DE PULSERAS VIP (V12 - CSV BLINDADO EXTREMO) ---
// ==========================================
const GestorPulserasView = ({ addNotification, eventId }) => {
  const [designConfig, setDesignConfig] = useState({ preTitle: '', eventName: '', logoBase64: '' });
  const [eventDateStr, setEventDateStr] = useState(''); 
  const [wristbandList, setWristbandList] = useState([]);
  const [newEntry, setNewEntry] = useState({ name: '', extraAdults: 0, extraChildren: 0 });
  const [isLocked, setIsLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    const fetchData = async () => {
      try {
        const docRef = doc(db, "eventos", eventId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.pulserasConfig) setDesignConfig(data.pulserasConfig);
          if (data.pulserasStatus === 'enviado' || data.pulserasStatus === 'impreso') setIsLocked(true);
          if (data.fecha) setEventDateStr(data.fecha);
        }

        const listRef = collection(db, "eventos", eventId, "invitados");
        const listSnap = await getDocs(listRef);
        const listData = listSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setWristbandList(listData.filter(g => g.isSecurityKit));
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
      setIsLoading(false);
    };
    fetchData();
  }, [eventId]);

  const handleSaveDesign = async (e) => {
    e.preventDefault();
    if (isLocked) return;
    try {
      await updateDoc(doc(db, "eventos", eventId), { pulserasConfig: designConfig });
      if(addNotification) addNotification('Diseño Guardado', 'Los datos de la pulsera se actualizaron.', 'success');
    } catch (error) {
      if(addNotification) addNotification('Error', 'Fallo al guardar el diseño.', 'error');
    }
  };

  const handleLogoUpload = (e) => {
    if (isLocked) return;
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        if(addNotification) addNotification('Archivo no válido', 'Por favor sube una imagen (JPG o PNG).', 'warning');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 400; 
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
            setDesignConfig({ ...designConfig, logoBase64: compressedBase64 });
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
      if(isLocked) return;
      setDesignConfig({ ...designConfig, logoBase64: '' });
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (isLocked) return;
    
    const guestName = newEntry.name.trim();
    const adExtras = Number(newEntry.extraAdults) || 0;
    const niExtras = Number(newEntry.extraChildren) || 0;
    const totalPases = 1 + adExtras + niExtras;

    if (!guestName) {
        if(addNotification) addNotification('Falta el nombre', 'Ingresa el nombre del invitado principal.', 'warning');
        return;
    }
    
    const newId = `p_${Date.now()}`;
    
    const initSubGuests = [
      { id: `usr_${newId}_0`, name: guestName, isChild: false, entered: false },
      ...Array(adExtras).fill(null).map((_, i) => ({ id: `usr_${newId}_A${i}`, name: `Acompañante ${i+1}`, isChild: false, entered: false })),
      ...Array(niExtras).fill(null).map((_, i) => ({ id: `usr_${newId}_N${i}`, name: `Niño ${i+1}`, isChild: true, entered: false }))
    ];
    
    const newDoc = { 
      name: guestName, 
      passes: totalPases, 
      originalPasses: totalPases,
      childrenPasses: niExtras,
      status: 'confirmado',
      side: 'general', 
      entered: 0, 
      tableId: null, 
      sent: false, 
      subGuests: initSubGuests, 
      extraRequested: 0,
      isSecurityKit: true 
    };
    
    try {
      await setDoc(doc(db, "eventos", eventId, "invitados", newId), newDoc);
      setWristbandList(prev => [{ id: newId, ...newDoc }, ...prev]); 
      setNewEntry({ name: '', extraAdults: 0, extraChildren: 0 }); 
      if(addNotification) addNotification('Agregado', `${guestName} y acompañantes añadidos.`, 'success');
    } catch (error) {
      if(addNotification) addNotification('Error', `No se pudo guardar: ${error.message}`, 'error');
    }
  };

  const handleRemoveEntry = async (id) => {
    if (isLocked) return;
    try {
      await deleteDoc(doc(db, "eventos", eventId, "invitados", id));
      setWristbandList(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      if(addNotification) addNotification('Error', 'No se pudo eliminar.', 'error');
    }
  };

  const handleUpdateNameInline = async (parentId, subGuestId, newName) => {
    if (isLocked || !newName.trim()) return;
    
    const parentIndex = wristbandList.findIndex(g => g.id === parentId);
    if (parentIndex === -1) return;

    const updatedList = [...wristbandList];
    const parent = { ...updatedList[parentIndex] };
    const subIndex = parent.subGuests.findIndex(sg => sg.id === subGuestId);

    if (subIndex > -1) {
        parent.subGuests[subIndex].name = newName.trim();
        if (subIndex === 0) parent.name = newName.trim();
    }

    updatedList[parentIndex] = parent;
    setWristbandList(updatedList);

    try {
        await updateDoc(doc(db, "eventos", eventId, "invitados", parentId), {
            name: parent.name,
            subGuests: parent.subGuests
        });
    } catch (err) {
        console.error("Error guardando nombre inline:", err);
    }
  };

  const downloadTemplate = () => {
    let csv = "";
    csv += "\"BAULIA TECHNOLOGIES - FORMATO OFICIAL DE PRODUCCIÓN DE ACCESOS\"\n";
    csv += `"Evento: ${designConfig.eventName || 'Tu Evento'}"\n`;
    csv += "\"=================================================================\"\n";
    csv += "\"INSTRUCCIONES DE LLENADO:\"\n";
    csv += "\"1. En 'Titular o Familia' escribe el nombre principal. Esto genera 1 pulsera automática.\"\n";
    csv += "\"2. En 'Acompañantes' y 'Niños' si no tienes nombre pon NUMEROS (Ej. 2). Si no hay extras pon 0.\"\n";
    csv += "\"3. Si tienes los nombres, escríbelos separados por una diagonal (Ej. Ana / Carlos).\"\n";
    csv += "\"4. Guarda el archivo manteniendo el formato CSV y súbelo a la plataforma.\"\n";
    csv += "\"=================================================================\"\n\n";
    
    csv += "Titular o Familia,Acompañantes EXTRAS,Niños EXTRAS\n";
    csv += "Familia Garza,Ana / Carlos / 2,Mia / 1\n";
    csv += "Juan Perez,2,0\n";
    csv += "Sofia Rodriguez,0,1\n";

    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Plantilla_Produccion_${designConfig.eventName ? designConfig.eventName.replace(/\s+/g, '_') : 'Baulia'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e) => {
    if (isLocked) return;
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
      
      // 🔴 BLINDAJE EXTREMO: Buscar la cabecera real ignorando todo lo de arriba
      const headerIndex = rawRows.findIndex(row => 
          row.toLowerCase().includes('titular') && 
          row.toLowerCase().includes('extras')
      );
      
      let cleanRows = [];
      if (headerIndex !== -1) {
          // Tomamos absolutamente todo lo que esté DEBAJO de la cabecera
          cleanRows = rawRows.slice(headerIndex + 1);
      } else {
          // Si por alguna razón borró la cabecera, trituramos las instrucciones
          cleanRows = rawRows.filter(row => {
              const r = row.toLowerCase();
              return !r.includes('baulia') && !r.includes('instrucciones') && !r.includes('===') && !r.includes('evento:');
          });
      }

      // Nos aseguramos de no procesar filas vacías o que solo tengan comas ",,"
      cleanRows = cleanRows.filter(r => r.replace(/,/g, '').replace(/['"]/g, '').trim() !== '');

      const processExtrasCol = (colStr, prefixText) => {
          if (!colStr) return [];
          const parts = colStr.split('/').map(s => s.trim()).filter(s => s);
          let countGeneric = 0;
          let namedList = [];
          
          parts.forEach(p => {
              if (/^\d+$/.test(p)) { 
                  countGeneric += parseInt(p, 10);
              } else { 
                  namedList.push(p);
              }
          });

          const finalArray = [...namedList];
          for (let k = 0; k < countGeneric; k++) {
              finalArray.push(`${prefixText} ${namedList.length + k + 1}`);
          }
          return finalArray;
      };
      
      const promesas = [];
      const nuevosItems = [];

      for(let i = 0; i < cleanRows.length; i++) {
        const cols = cleanRows[i].split(','); 
        if (cols[0] && cols[0].trim() !== '') {
          const guestName = cols[0].replace(/['"]/g, '').trim();
          const adCol = cols[1] ? cols[1].replace(/['"]/g, '').trim() : "0";
          const niCol = cols[2] ? cols[2].replace(/['"]/g, '').trim() : "0";

          const adArray = processExtrasCol(adCol, 'Acompañante');
          const niArray = processExtrasCol(niCol, 'Niño');

          const totalPases = 1 + adArray.length + niArray.length;
          const newId = `p_${Date.now()}_${i}`;

          const initSubGuests = [
              { id: `usr_${newId}_0`, name: guestName, isChild: false, entered: false },
              ...adArray.map((n, idx) => ({ id: `usr_${newId}_A${idx}`, name: n, isChild: false, entered: false })),
              ...niArray.map((n, idx) => ({ id: `usr_${newId}_N${idx}`, name: n, isChild: true, entered: false }))
          ];

          const newDoc = { 
            name: guestName, 
            passes: totalPases,
            originalPasses: totalPases,
            childrenPasses: niArray.length,
            status: 'confirmado',
            side: 'general',
            entered: 0,
            tableId: null,
            sent: false,
            subGuests: initSubGuests,
            extraRequested: 0,
            isSecurityKit: true
          };
          
          nuevosItems.push({ id: newId, ...newDoc });
          promesas.push(setDoc(doc(db, "eventos", eventId, "invitados", newId), newDoc));
        }
      }

      try {
        if(promesas.length === 0) {
            if(addNotification) addNotification('Archivo Vacío', 'No se encontraron nombres válidos para importar.', 'warning');
            return;
        }
        await Promise.all(promesas);
        setWristbandList(prev => [...nuevosItems, ...prev]);
        if(addNotification) addNotification('¡Éxito!', `Se importaron ${nuevosItems.length} grupos correctamente.`, 'success');
      } catch (err) {
        console.error("Error en CSV:", err);
        if(addNotification) addNotification('Error', 'Hubo un fallo al guardar la lista en la nube.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = null; 
  };

  const executeSendToWorkshop = async () => {
    try {
      await updateDoc(doc(db, "eventos", eventId), { 
         pulserasStatus: 'enviado',
         fechaEnvioTaller: new Date().toISOString()
      });
      setIsLocked(true);
      if(addNotification) addNotification('¡Pedido Enviado!', 'La orden fue recibida por el taller de producción.', 'success');
    } catch (error) {
      console.error(error);
      if(addNotification) addNotification('Error', 'Fallo al procesar el envío.', 'error');
    }
  };

  if (isLoading) return <div className="p-10 text-center text-slate-500">Cargando plataforma...</div>;

  const totalPulserasSolicitadas = wristbandList.reduce((sum, item) => sum + (Number(item.passes) || 0), 0);

  const getFlattenedGuests = (guestList) => {
    const flattened = [];
    guestList.forEach(guest => {
      (guest.subGuests || []).forEach((sg, idx) => {
        flattened.push({
          _rowId: sg.id,
          parentGuest: guest,
          displayName: sg.name || (sg.isChild ? 'Niño' : 'Acompañante'),
          isMain: idx === 0,
          isChild: sg.isChild,
          pin: sg.id
        });
      });
    });
    return flattened;
  };

  const flattenedList = getFlattenedGuests(wristbandList);

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-500 relative">
      
      {/* MODAL ELEGANTE DE CONFIRMACIÓN */}
      {confirmModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 transition-all">
            <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center border border-white/10 animate-in zoom-in-95">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Confirmar Producción</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Una vez enviado al taller, NO podrás editar la lista de invitados ni el diseño del brazalete. ¿Todo está correcto?</p>
                <div className="flex gap-3">
                    <button onClick={() => setConfirmModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-[#111] text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-white/5 transition-colors">Revisar</button>
                    <button onClick={() => { setConfirmModal(false); executeSendToWorkshop(); }} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-colors">Sí, Enviar</button>
                </div>
            </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');
        .font-firma { font-family: 'Great Vibes', cursive; }
      `}</style>

      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-editorial text-slate-900 dark:text-white tracking-wide">Gestor de Pulseras VIP</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Sube el logo, ajusta el diseño y carga tu lista de accesos.</p>
        </div>
        {isLocked && (
           <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-xl flex items-center shadow-sm">
             <Lock size={16} className="mr-2" />
             <span className="text-xs font-black uppercase tracking-widest">En Producción</span>
           </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMNA IZQUIERDA */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden transition-colors flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#111] flex items-center">
               <Palette size={18} className="text-indigo-500 mr-2" />
               <h3 className="font-bold text-slate-800 dark:text-white text-sm">Personalización del Brazalete</h3>
            </div>
            <form onSubmit={handleSaveDesign} className="p-6 space-y-5">
              
              <div className="bg-slate-50 dark:bg-[#111] p-4 rounded-2xl border border-dashed border-slate-300 dark:border-white/20 text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Logo del Evento (Opcional)</p>
                  {designConfig.logoBase64 ? (
                      <div className="relative inline-block">
                          <img src={designConfig.logoBase64} alt="Logo Evento" className="h-16 object-contain rounded bg-white p-1 shadow-sm" />
                          {!isLocked && <button type="button" onClick={removeLogo} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md hover:bg-rose-600"><X size={12}/></button>}
                      </div>
                  ) : (
                      <label className={`flex flex-col items-center justify-center cursor-pointer transition-colors ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:text-indigo-600'}`}>
                          <ImageIcon size={24} className="text-slate-400 mb-2" />
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Clic para subir imagen</span>
                          <span className="text-[10px] text-slate-400 mt-1">JPG o PNG (Fondo blanco recomendado)</span>
                          <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={isLocked} className="hidden" />
                      </label>
                  )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Pre-Título</label>
                    <input type="text" disabled={isLocked} placeholder="Ej. Boda de:, Mis XV:" value={designConfig.preTitle || ''} onChange={e=>setDesignConfig({...designConfig, preTitle: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-indigo-500 text-sm font-bold text-slate-800 dark:text-white disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nombre Principal</label>
                    <input type="text" disabled={isLocked} required placeholder="Ej. Ana & Carlos" value={designConfig.eventName} onChange={e=>setDesignConfig({...designConfig, eventName: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-indigo-500 text-sm font-bold text-slate-800 dark:text-white disabled:opacity-50" />
                  </div>
              </div>

              <button type="submit" disabled={isLocked} className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-30">
                Guardar Diseño
              </button>
            </form>
          </div>

          <div className="bg-slate-100 dark:bg-[#111] rounded-3xl p-5 border border-slate-200 dark:border-white/5 shadow-inner">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center"><Eye size={12} className="mr-1.5"/> Vista Previa de Impresión</h4>
             
             <div className="w-full bg-white h-20 rounded shadow-md border border-slate-200 overflow-hidden flex items-stretch">
                <div className="w-[10%] bg-slate-100 border-r border-dashed border-slate-300 flex items-center justify-center">
                    <span className="text-[6px] text-slate-400 font-bold -rotate-90 tracking-widest">PEGAMENTO</span>
                </div>
                <div className="w-[12%] flex items-center justify-center border-r border-slate-100">
                    <span className="text-[5px] text-slate-400 font-bold -rotate-90 tracking-widest whitespace-nowrap">by BAULIA.COM</span>
                </div>
                <div className="w-[38%] flex flex-col items-center justify-center border-r border-slate-100 p-1 relative">
                    {designConfig.preTitle && <span className="text-[5px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{designConfig.preTitle}</span>}
                    {designConfig.logoBase64 ? (
                        <img src={designConfig.logoBase64} alt="Logo" className="h-7 object-contain mb-1" />
                    ) : (
                        <div className="font-firma text-xl text-slate-800 leading-none mb-1 truncate w-full text-center px-1">
                            {designConfig.eventName || 'Evento VIP'}
                        </div>
                    )}
                    <span className="text-[5px] font-black text-slate-400 uppercase tracking-widest">{eventDateStr ? new Date(eventDateStr).toLocaleDateString('es-MX', { timeZone: 'UTC' }) : 'Fecha de Evento'}</span>
                </div>
                <div className="w-[25%] flex flex-col justify-center px-2">
                    <span className="text-[8px] font-black uppercase text-slate-900 truncate">Juan Pérez</span>
                    <span className="text-[6px] font-bold text-slate-500 mt-0.5">Pase VIP</span>
                </div>
                <div className="w-[15%] flex items-center justify-center pr-1">
                    <QrCode size={24} className="text-slate-800" strokeWidth={1.5} />
                </div>
             </div>
             <p className="text-[9px] text-center text-slate-400 mt-3 italic">Esta es una representación a escala. La pulsera física medirá 25cm de largo y se imprimirá en papel Tyvek de alta resistencia.</p>
          </div>

          <div className="bg-indigo-600 dark:bg-amber-500 rounded-3xl p-6 text-white dark:text-slate-900 shadow-xl flex flex-col items-center text-center gap-5">
             <div>
               <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Total a Imprimir</p>
               <h3 className="text-5xl font-editorial font-black">{totalPulserasSolicitadas} <span className="text-base font-sans font-medium opacity-80">pulseras</span></h3>
             </div>
             <button onClick={() => {
                if (wristbandList.length === 0) {
                   if(addNotification) addNotification('Lista Vacía', 'Agrega invitados antes de enviar a producción.', 'warning');
                   return;
                }
                setConfirmModal(true);
             }} disabled={isLocked || wristbandList.length === 0} className="w-full py-4 px-8 bg-white text-indigo-700 dark:text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center">
               <Send size={16} className="mr-2" /> {isLocked ? 'Orden en Proceso' : 'Enviar a Taller'}
             </button>
          </div>
        </div>

        {/* COLUMNA DERECHA: LISTA DE NOMBRES */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-[600px]">
          <div className="flex-1 bg-white dark:bg-[#0a0a0a] rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="bg-sky-50 dark:bg-sky-900/20 border-b border-sky-100 dark:border-sky-800/30 p-4 flex items-start gap-3">
               <Info size={20} className="text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
               <div className="text-xs text-sky-800 dark:text-sky-200 leading-relaxed">
                  <strong className="block mb-1">¿Cómo funciona esta lista?</strong>
                  1. El nombre <b>Titular</b> genera automáticamente <span className="underline">1 pulsera</span>.<br/>
                  2. Agrega la cantidad de <b>Extras</b> (Acompañantes o Niños) que ingresarán con el titular.<br/>
                  3. <b>Edición en vivo:</b> Da clic en los nombres generados en la tabla para poner el nombre real de cada acompañante antes de imprimir.
               </div>
            </div>

            <div className="p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#111] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shrink-0">
              <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center"><Users size={16} className="mr-2 text-indigo-500" /> Desglose para Impresión</h3>
              </div>
              {!isLocked && (
                  <div className="flex gap-2 w-full xl:w-auto">
                    <button onClick={downloadTemplate} className="flex-1 xl:flex-none px-3 py-2 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-300 transition-colors flex items-center justify-center">
                        <Download size={14} className="mr-1.5"/> Plantilla CSV
                    </button>
                    <label className="cursor-pointer flex-1 xl:flex-none px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-100 transition-colors flex items-center justify-center">
                        <FileSpreadsheet size={14} className="mr-1.5" /> Subir CSV
                        <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
              )}
            </div>
            
            {!isLocked && (
                <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-transparent shrink-0">
                    <form onSubmit={handleAddEntry} className="flex flex-col sm:flex-row w-full gap-3 items-end">
                        <div className="flex-1 w-full">
                           <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Titular (Incluye 1 pulsera)</span>
                           <input type="text" required placeholder="Ej. Familia Garza" value={newEntry.name} onChange={e=>setNewEntry({...newEntry, name: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500" />
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto items-end">
                          <div className="flex flex-col w-full sm:w-24">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Adultos Extras</span>
                            <input type="number" min="0" value={newEntry.extraAdults} onChange={e=>setNewEntry({...newEntry, extraAdults: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-black text-center text-indigo-600 dark:text-amber-500 outline-none focus:border-indigo-500" />
                          </div>
                          <div className="flex flex-col w-full sm:w-24">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Niños Extras</span>
                            <input type="number" min="0" value={newEntry.extraChildren} onChange={e=>setNewEntry({...newEntry, extraChildren: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-black text-center text-sky-600 dark:text-sky-400 outline-none focus:border-indigo-500" />
                          </div>
                          <button type="submit" className="px-4 w-full sm:w-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center font-bold text-xs h-[46px]">
                             <Plus size={18} className="md:mr-1" /> <span className="hidden md:inline">Agregar</span>
                          </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="overflow-y-auto custom-scrollbar flex-1 max-h-[700px]">
              {flattenedList.length === 0 ? (
                <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                  <ListTodo size={40} className="mb-3 opacity-20" />
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">La tabla de producción está vacía.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-[#111] text-[10px] uppercase font-black text-slate-400 tracking-widest sticky top-0 border-b border-slate-200 dark:border-white/5 z-10">
                    <tr>
                      <th className="px-6 py-3">Nombre en Brazalete (Clic para editar)</th>
                      <th className="px-4 py-3 text-center">Tipo</th>
                      <th className="px-4 py-3 text-right">Controles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {flattenedList.map((row) => (
                      <tr key={row._rowId} className={`transition-colors hover:bg-slate-50 dark:hover:bg-white/5 ${row.isMain ? 'bg-white dark:bg-transparent border-t-[3px] border-slate-200 dark:border-white/10' : 'bg-slate-50/50 dark:bg-white/[0.02]'}`}>
                        <td className="px-6 py-3 flex items-center">
                          <div className="relative w-full group flex items-center bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 rounded transition-colors p-1 -ml-1">
                              {!isLocked && <Edit3 size={12} className="absolute -left-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
                              <input 
                                  type="text" 
                                  defaultValue={row.displayName} 
                                  disabled={isLocked}
                                  onBlur={(e) => handleUpdateNameInline(row.parentGuest.id, row.pin, e.target.value)}
                                  className={`w-full bg-transparent outline-none border-b border-transparent focus:border-indigo-500 transition-colors ${row.isMain ? 'font-bold text-slate-800 dark:text-white' : 'font-medium text-slate-500 dark:text-slate-400'} disabled:opacity-80`}
                              />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {row.isChild ? (
                            <span className="text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 px-2 py-0.5 rounded text-[8px] uppercase font-black tracking-widest">Niño</span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest">Adulto</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {row.isMain && !isLocked && (
                            <button onClick={() => handleRemoveEntry(row.parentGuest.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors">
                              <Trash2 size={16} />
                            </button>
                          )}
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