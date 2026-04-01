import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { Palette, QrCode, Lock, Send, Plus, FileSpreadsheet, Users, ListTodo, Trash2, Image as ImageIcon, Download, Eye } from 'lucide-react';
// 🔴 Ajusta la ruta de Firebase si es necesario
import { db } from '../firebase'; 

// ==========================================
// --- COMPONENTE: GESTOR DE PULSERAS VIP (V2 CON VISTA PREVIA) ---
// ==========================================
const GestorPulserasView = ({ addNotification, eventId }) => {
  const [designConfig, setDesignConfig] = useState({ eventName: '', eventDate: '', eventType: 'boda', logoBase64: '' });
  const [wristbandList, setWristbandList] = useState([]);
  const [newEntry, setNewEntry] = useState({ name: '', passes: 1 });
  const [isLocked, setIsLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. CARGA INICIAL
  useEffect(() => {
    if (!eventId) return;
    const fetchData = async () => {
      try {
        const docRef = doc(db, "eventos", eventId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.pulserasConfig) setDesignConfig(data.pulserasConfig);
          if (data.pulserasStatus === 'enviado') setIsLocked(true);
        }

        const listRef = collection(db, "eventos", eventId, "pulseras");
        const listSnap = await getDocs(listRef);
        const listData = listSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setWristbandList(listData);
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
      setIsLoading(false);
    };
    fetchData();
  }, [eventId]);

  // 2. GUARDAR DISEÑO
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

  // 3. SUBIR LOGO (COMPRESIÓN AUTOMÁTICA A BASE64)
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
            const MAX_WIDTH = 400; // Reducimos tamaño para no saturar Firebase
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
  }

  // 4. AGREGAR MANUALMENTE (CORREGIDO)
  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (isLocked) return;
    
    const guestName = newEntry.name.trim();
    if (!guestName) {
        if(addNotification) addNotification('Falta el nombre', 'Ingresa el nombre del invitado.', 'warning');
        return;
    }
    
    const newId = `p_${Date.now()}`;
    const newDoc = { name: guestName, passes: Number(newEntry.passes) || 1 };
    
    try {
      await setDoc(doc(db, "eventos", eventId, "pulseras", newId), newDoc);
      setWristbandList(prev => [{ id: newId, ...newDoc }, ...prev]); // Lo agrega al inicio de la lista
      setNewEntry({ name: '', passes: 1 }); // Limpia los inputs
      if(addNotification) addNotification('Agregado', `${guestName} añadido a la lista.`, 'success');
    } catch (error) {
      if(addNotification) addNotification('Error', 'No se pudo guardar en la base de datos.', 'error');
    }
  };

  const handleRemoveEntry = async (id) => {
    if (isLocked) return;
    try {
      await deleteDoc(doc(db, "eventos", eventId, "pulseras", id));
      setWristbandList(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      if(addNotification) addNotification('Error', 'No se pudo eliminar.', 'error');
    }
  };

  // 5. GESTIÓN DE EXCEL/CSV
  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Nombre del Invitado o Familia,Cantidad de Pulseras\nFamilia Garza,4\nJuan Perez,1\nSofia Rodriguez,2";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Plantilla_Invitados_Baulia.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e) => {
    if (isLocked) return;
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
        if(addNotification) addNotification('Formato Incorrecto', 'El archivo debe ser .CSV. Descarga la plantilla para ver el formato correcto.', 'error');
        return;
    }

    if(addNotification) addNotification('Procesando', 'Leyendo lista de invitados...', 'info');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      // Normalizar saltos de línea y separar por filas
      const rows = text.split(/\r?\n/).filter(r => r.trim()); 
      
      let startIdx = 0;
      // Si la primera fila contiene "nombre", es la cabecera, la saltamos
      if (rows[0].toLowerCase().includes('nombre')) startIdx = 1;
      
      const promesas = [];
      const nuevosItems = [];

      for(let i = startIdx; i < rows.length; i++) {
        // Soporta comas o punto y coma como separador
        const cols = rows[i].split(/,|;/); 
        if (cols[0] && cols[0].trim() !== '') {
          const newId = `p_${Date.now()}_${i}`;
          const newDoc = { 
            name: cols[0].trim(), 
            passes: parseInt(cols[1]) || 1 
          };
          nuevosItems.push({ id: newId, ...newDoc });
          promesas.push(setDoc(doc(db, "eventos", eventId, "pulseras", newId), newDoc));
        }
      }

      try {
        await Promise.all(promesas);
        setWristbandList(prev => [...nuevosItems, ...prev]);
        if(addNotification) addNotification('¡Éxito!', `Se importaron ${nuevosItems.length} invitados.`, 'success');
      } catch (err) {
        if(addNotification) addNotification('Error', 'Hubo un fallo al guardar la lista en la nube.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Reset input
  };

  // 6. ENVIAR AL TALLER
  const handleSendToWorkshop = async () => {
    if (wristbandList.length === 0) {
      if(addNotification) addNotification('Lista Vacía', 'Agrega invitados antes de enviar a producción.', 'warning');
      return;
    }
    const confirm = window.confirm("Una vez enviado al taller, NO podrás editar la lista ni el diseño. ¿Estás seguro de que todo está correcto?");
    if (!confirm) return;

    try {
      await updateDoc(doc(db, "eventos", eventId), { 
         pulserasStatus: 'enviado',
         fechaEnvioTaller: new Date().toISOString()
      });
      setIsLocked(true);
      if(addNotification) addNotification('¡Pedido Enviado!', 'La orden fue recibida por el taller de producción.', 'success');
    } catch (error) {
      if(addNotification) addNotification('Error', 'Fallo al procesar el envío.', 'error');
    }
  };

  if (isLoading) return <div className="p-10 text-center text-slate-500">Cargando plataforma...</div>;

  const totalPulserasSolicitadas = wristbandList.reduce((sum, item) => sum + item.passes, 0);

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-500">
      
      {/* 🔴 ESTILOS PARA LA FUENTE MANUSCRITA EN LA VISTA PREVIA */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');
        .font-firma { font-family: 'Great Vibes', cursive; }
      `}</style>

      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-editorial text-slate-900 dark:text-white tracking-wide">Gestor de Pulseras VIP</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Sube el logo, ajusta el diseño y carga tu lista de invitados.</p>
        </div>
        {isLocked && (
           <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-xl flex items-center shadow-sm">
             <Lock size={16} className="mr-2" />
             <span className="text-xs font-black uppercase tracking-widest">En Producción</span>
           </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMNA IZQUIERDA: DISEÑO Y VISTA PREVIA */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden transition-colors flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#111] flex items-center">
               <Palette size={18} className="text-indigo-500 mr-2" />
               <h3 className="font-bold text-slate-800 dark:text-white text-sm">Personalización del Brazalete</h3>
            </div>
            <form onSubmit={handleSaveDesign} className="p-6 space-y-5">
              
              {/* SUBIDA DE LOGO */}
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

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nombre Corto del Evento</label>
                <input type="text" disabled={isLocked} required placeholder="Ej. Ana & Carlos" value={designConfig.eventName} onChange={e=>setDesignConfig({...designConfig, eventName: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-indigo-500 text-sm font-bold text-slate-800 dark:text-white disabled:opacity-50" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Fecha Impresa</label>
                    <input type="date" disabled={isLocked} required value={designConfig.eventDate} onChange={e=>setDesignConfig({...designConfig, eventDate: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-indigo-500 text-sm font-bold text-slate-800 dark:text-white disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tipo</label>
                    <select disabled={isLocked} value={designConfig.eventType} onChange={e=>setDesignConfig({...designConfig, eventType: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-indigo-500 text-sm font-bold text-slate-800 dark:text-white disabled:opacity-50">
                      <option value="boda">Boda</option>
                      <option value="xv_anos">XV Años</option>
                      <option value="graduacion">Graduación</option>
                      <option value="empresarial">Empresarial</option>
                      <option value="general">General / VIP</option>
                    </select>
                  </div>
              </div>

              <button type="submit" disabled={isLocked} className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-30">
                Guardar Diseño
              </button>
            </form>
          </div>

          {/* 👁️ VISTA PREVIA EN VIVO (SIMULACIÓN DE PULSERA) */}
          <div className="bg-slate-100 dark:bg-[#111] rounded-3xl p-5 border border-slate-200 dark:border-white/5 shadow-inner">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center"><Eye size={12} className="mr-1.5"/> Vista Previa de Impresión</h4>
             
             {/* LIENZO DE LA PULSERA (Escalado visualmente) */}
             <div className="w-full bg-white h-20 rounded shadow-md border border-slate-200 overflow-hidden flex items-stretch">
                {/* Zona 1: Pegamento */}
                <div className="w-[10%] bg-slate-100 border-r border-dashed border-slate-300 flex items-center justify-center">
                    <span className="text-[6px] text-slate-400 font-bold -rotate-90 tracking-widest">PEGAMENTO</span>
                </div>
                {/* Zona 2: Autopublicidad */}
                <div className="w-[12%] flex items-center justify-center border-r border-slate-100">
                    <span className="text-[5px] text-slate-400 font-bold -rotate-90 tracking-widest whitespace-nowrap">by BAULIA.COM</span>
                </div>
                {/* Zona 3: Logo y Nombre (El Diseño) */}
                <div className="w-[38%] flex flex-col items-center justify-center border-r border-slate-100 p-1">
                    {designConfig.logoBase64 ? (
                        <img src={designConfig.logoBase64} alt="Logo" className="h-8 object-contain mb-1" />
                    ) : (
                        <div className="font-firma text-xl text-slate-800 leading-none mb-1 truncate w-full text-center px-1">
                            {designConfig.eventName || 'Evento VIP'}
                        </div>
                    )}
                    <span className="text-[6px] font-black text-slate-500 uppercase tracking-widest">{designConfig.eventDate || 'Sin Fecha'}</span>
                </div>
                {/* Zona 4: Nombre Invitado Ficticio */}
                <div className="w-[25%] flex flex-col justify-center px-2">
                    <span className="text-[8px] font-black uppercase text-slate-900 truncate">Juan Pérez</span>
                    <span className="text-[6px] font-bold text-slate-500 mt-0.5">Pase VIP</span>
                </div>
                {/* Zona 5: QR Ficticio */}
                <div className="w-[15%] flex items-center justify-center pr-1">
                    <QrCode size={24} className="text-slate-800" strokeWidth={1.5} />
                </div>
             </div>
             <p className="text-[9px] text-center text-slate-400 mt-3 italic">Esta es una representación a escala. La pulsera física medirá 25cm de largo y se imprimirá en papel Tyvek de alta resistencia.</p>
          </div>
        </div>

        {/* COLUMNA DERECHA: LISTA DE NOMBRES */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          
          {/* TARJETA DE RESUMEN Y BOTÓN ENVIAR */}
          <div className="bg-indigo-600 dark:bg-amber-500 rounded-3xl p-6 text-white dark:text-slate-900 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
             <div className="text-center sm:text-left">
               <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Total a Imprimir</p>
               <h3 className="text-5xl font-editorial font-black">{totalPulserasSolicitadas} <span className="text-base font-sans font-medium opacity-80">pulseras</span></h3>
             </div>
             <button onClick={handleSendToWorkshop} disabled={isLocked || wristbandList.length === 0} className="w-full sm:w-auto py-4 px-8 bg-white text-indigo-700 dark:text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center">
               <Send size={16} className="mr-2" /> {isLocked ? 'Orden en Proceso' : 'Enviar a Taller'}
             </button>
          </div>
          
          {/* PANEL DE CARGA DE NOMBRES */}
          <div className="flex-1 bg-white dark:bg-[#0a0a0a] rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#111] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center"><Users size={16} className="mr-2 text-indigo-500" /> Lista de Nombres ({wristbandList.length})</h3>
                  <p className="text-[10px] text-slate-500 mt-1">Escribe los nombres uno a uno o importa tu archivo Excel.</p>
              </div>
              
              {!isLocked && (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={downloadTemplate} className="flex-1 sm:flex-none px-3 py-2 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-300 transition-colors flex items-center justify-center">
                        <Download size={14} className="mr-1.5"/> Plantilla CSV
                    </button>
                    <label className="cursor-pointer flex-1 sm:flex-none px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-100 transition-colors flex items-center justify-center">
                        <FileSpreadsheet size={14} className="mr-1.5" /> Subir CSV
                        <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
              )}
            </div>
            
            {/* AGREGAR MANUALMENTE */}
            {!isLocked && (
                <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-transparent">
                    <form onSubmit={handleAddEntry} className="flex w-full gap-2">
                        <input type="text" required placeholder="Nombre de la Familia/Invitado..." value={newEntry.name} onChange={e=>setNewEntry({...newEntry, name: e.target.value})} className="flex-1 p-3 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500" />
                        <input type="number" min="1" placeholder="Pases" value={newEntry.passes} onChange={e=>setNewEntry({...newEntry, passes: e.target.value})} className="w-20 p-3 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-black text-center text-indigo-600 dark:text-amber-500 outline-none focus:border-indigo-500" />
                        <button type="submit" className="px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center font-bold text-xs"><Plus size={18} className="md:mr-1" /> <span className="hidden md:inline">Agregar</span></button>
                    </form>
                </div>
            )}

            <div className="overflow-y-auto custom-scrollbar flex-1 max-h-[450px]">
              {wristbandList.length === 0 ? (
                <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                  <ListTodo size={40} className="mb-3 opacity-20" />
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">La tabla de producción está vacía.</p>
                  <p className="text-xs mt-2 max-w-xs leading-relaxed">Descarga la plantilla, llénala en Excel, guárdala como "CSV" y súbela aquí. O agrega los nombres arriba uno por uno.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-[#111] text-[10px] uppercase font-black text-slate-400 tracking-widest sticky top-0 border-b border-slate-200 dark:border-white/5">
                    <tr>
                      <th className="px-6 py-3">Nombre a Imprimir</th>
                      <th className="px-4 py-3 text-center">Cantidad (Pulseras)</th>
                      <th className="px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {wristbandList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-6 py-3 font-bold text-slate-800 dark:text-white">{item.name}</td>
                        <td className="px-4 py-3 text-center font-black text-indigo-600 dark:text-amber-500 bg-indigo-50/50 dark:bg-amber-500/5">{item.passes}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleRemoveEntry(item.id)} disabled={isLocked} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-30">
                            <Trash2 size={16} />
                          </button>
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