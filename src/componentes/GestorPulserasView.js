// ==========================================
// --- COMPONENTE: GESTOR DE PULSERAS (KIT DE SEGURIDAD B2B) ---
// ==========================================
const GestorPulserasView = ({ addNotification }) => {
  const [designConfig, setDesignConfig] = useState({ eventName: '', eventDate: '', eventType: 'boda', logoUrl: '' });
  const [wristbandList, setWristbandList] = useState([]);
  const [newEntry, setNewEntry] = useState({ name: '', passes: 1 });
  const [isLocked, setIsLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Cargar datos iniciales desde Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar configuración de diseño y estatus
        const docRef = doc(db, "eventos", ID_DEL_EVENTO);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.pulserasConfig) setDesignConfig(data.pulserasConfig);
          if (data.pulserasStatus === 'enviado') setIsLocked(true);
        }

        // Cargar lista de invitados exclusiva para pulseras
        const listRef = collection(db, "eventos", ID_DEL_EVENTO, "pulseras");
        const listSnap = await getDocs(listRef);
        const listData = listSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setWristbandList(listData);
      } catch (error) {
        console.error("Error cargando pulseras:", error);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  // 2. Guardar el Diseño
  const handleSaveDesign = async (e) => {
    e.preventDefault();
    if (isLocked) return;
    try {
      await updateDoc(doc(db, "eventos", ID_DEL_EVENTO), { pulserasConfig: designConfig });
      if(addNotification) addNotification('Diseño Guardado', 'Los datos de la pulsera se actualizaron.', 'success');
    } catch (error) {
      if(addNotification) addNotification('Error', 'Fallo al guardar el diseño.', 'error');
    }
  };

  // 3. Agregar una sola familia/invitado manualmente
  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (isLocked || !newEntry.name.trim()) return;
    
    const newId = `p_${Date.now()}`;
    const newDoc = { name: newEntry.name, passes: Number(newEntry.passes) || 1 };
    
    try {
      await setDoc(doc(db, "eventos", ID_DEL_EVENTO, "pulseras", newId), newDoc);
      setWristbandList(prev => [...prev, { id: newId, ...newDoc }]);
      setNewEntry({ name: '', passes: 1 });
    } catch (error) {
      if(addNotification) addNotification('Error', 'No se pudo agregar el invitado.', 'error');
    }
  };

  // 4. Eliminar un invitado
  const handleRemoveEntry = async (id) => {
    if (isLocked) return;
    try {
      await deleteDoc(doc(db, "eventos", ID_DEL_EVENTO, "pulseras", id));
      setWristbandList(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      if(addNotification) addNotification('Error', 'No se pudo eliminar.', 'error');
    }
  };

  // 5. Carga masiva mediante CSV
  const handleFileUpload = (e) => {
    if (isLocked) return;
    const file = e.target.files[0];
    if (!file) return;

    if(addNotification) addNotification('Procesando archivo', 'Leyendo lista de invitados...', 'info');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const rows = text.split('\n').filter(r => r.trim());
      
      // Ignorar cabecera si detecta la palabra "nombre"
      const startIdx = rows[0].toLowerCase().includes('nombre') ? 1 : 0;
      
      const promesas = [];
      const nuevosItems = [];

      for(let i = startIdx; i < rows.length; i++) {
        // Asume formato CSV: Nombre, Pases
        const cols = rows[i].split(',');
        if (cols[0] && cols[0].trim() !== '') {
          const newId = `p_${Date.now()}_${i}`;
          const newDoc = { 
            name: cols[0].trim(), 
            passes: parseInt(cols[1]) || 1 
          };
          nuevosItems.push({ id: newId, ...newDoc });
          promesas.push(setDoc(doc(db, "eventos", ID_DEL_EVENTO, "pulseras", newId), newDoc));
        }
      }

      try {
        await Promise.all(promesas);
        setWristbandList(prev => [...prev, ...nuevosItems]);
        if(addNotification) addNotification('¡Éxito!', `Se importaron ${nuevosItems.length} registros.`, 'success');
      } catch (err) {
        if(addNotification) addNotification('Error', 'Hubo un fallo al subir la lista.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Reset input
  };

  // 6. Enviar a Taller (Bloquear)
  const handleSendToWorkshop = async () => {
    if (wristbandList.length === 0) {
      if(addNotification) addNotification('Lista Vacía', 'Agrega invitados antes de enviar a producción.', 'warning');
      return;
    }
    
    const confirm = window.confirm("Una vez enviado al taller, NO podrás editar la lista ni el diseño. ¿Estás seguro de que todo está correcto?");
    if (!confirm) return;

    try {
      await updateDoc(doc(db, "eventos", ID_DEL_EVENTO), { 
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
      
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-editorial text-slate-900 dark:text-white tracking-wide">Logística de Pulseras</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configura el diseño y sube la lista de accesos para tu evento.</p>
        </div>
        {isLocked && (
           <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-xl flex items-center shadow-sm">
             <Lock size={16} className="mr-2" />
             <span className="text-xs font-black uppercase tracking-widest">En Producción</span>
           </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMNA IZQUIERDA: DISEÑO */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden transition-colors">
            <div className="p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#111] flex items-center">
               <Palette size={18} className="text-amber-500 mr-2" />
               <h3 className="font-bold text-slate-800 dark:text-white text-sm">Diseño del Brazalete</h3>
            </div>
            <form onSubmit={handleSaveDesign} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nombre del Evento</label>
                <input type="text" disabled={isLocked} required placeholder="Ej. Boda Ana & Carlos" value={designConfig.eventName} onChange={e=>setDesignConfig({...designConfig, eventName: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-amber-500 text-sm font-bold text-slate-800 dark:text-white disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Fecha del Evento</label>
                <input type="date" disabled={isLocked} required value={designConfig.eventDate} onChange={e=>setDesignConfig({...designConfig, eventDate: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-amber-500 text-sm font-bold text-slate-800 dark:text-white disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tipo de Evento</label>
                <select disabled={isLocked} value={designConfig.eventType} onChange={e=>setDesignConfig({...designConfig, eventType: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-amber-500 text-sm font-bold text-slate-800 dark:text-white disabled:opacity-50">
                  <option value="boda">Boda</option>
                  <option value="xv_anos">XV Años</option>
                  <option value="graduacion">Graduación</option>
                  <option value="empresarial">Empresarial</option>
                  <option value="general">General / VIP</option>
                </select>
              </div>
              <div className="pt-2">
                <button type="submit" disabled={isLocked} className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-30">
                  Guardar Diseño
                </button>
              </div>
            </form>
          </div>

          {/* TARJETA DE RESUMEN DE COMPRA */}
          <div className="bg-indigo-600 dark:bg-amber-500 rounded-3xl p-6 text-white dark:text-slate-900 shadow-xl relative overflow-hidden">
             <div className="absolute -right-6 -top-6 text-indigo-500/30 dark:text-amber-600/20"><QrCode size={120} /></div>
             <div className="relative z-10">
               <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Total a Imprimir</p>
               <h3 className="text-5xl font-editorial font-black mb-4">{totalPulserasSolicitadas}</h3>
               <p className="text-xs font-medium leading-relaxed opacity-90 mb-6">
                 Este es el total exacto de pulseras Tyvek que se imprimirán con códigos únicos QR y se enviarán a tu domicilio.
               </p>
               <button onClick={handleSendToWorkshop} disabled={isLocked || wristbandList.length === 0} className="w-full py-3.5 bg-white text-indigo-700 dark:text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center">
                 <Send size={16} className="mr-2" /> {isLocked ? 'Orden en Proceso' : 'Enviar a Taller'}
               </button>
             </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: LISTA DE NOMBRES */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          
          {!isLocked && (
            <div className="bg-white dark:bg-[#0a0a0a] p-5 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
              <form onSubmit={handleAddEntry} className="flex-1 flex w-full gap-2">
                <input type="text" placeholder="Nombre de la Familia/Invitado..." value={newEntry.name} onChange={e=>setNewEntry({...newEntry, name: e.target.value})} className="flex-1 p-3 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-amber-500" />
                <input type="number" min="1" placeholder="Pases" value={newEntry.passes} onChange={e=>setNewEntry({...newEntry, passes: e.target.value})} className="w-24 p-3 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-black text-center text-indigo-600 dark:text-amber-500 outline-none focus:border-amber-500" />
                <button type="submit" className="p-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:scale-105 transition-transform"><Plus size={20} /></button>
              </form>
              
              <div className="w-full sm:w-auto flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-white/10 pt-4 sm:pt-0 sm:pl-4">
                <label className="cursor-pointer flex items-center px-4 py-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-100 transition-colors w-full justify-center">
                  <FileSpreadsheet size={16} className="mr-2" /> Importar Excel
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>
          )}

          <div className="flex-1 bg-white dark:bg-[#0a0a0a] rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#111] flex justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center"><Users size={16} className="mr-2 text-slate-400" /> Nombres a Imprimir ({wristbandList.length})</h3>
              {!isLocked && <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Sube archivo .CSV (Nombre, Pases)</p>}
            </div>
            
            <div className="overflow-y-auto custom-scrollbar flex-1 max-h-[500px]">
              {wristbandList.length === 0 ? (
                <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                  <ListTodo size={40} className="mb-3 opacity-20" />
                  <p className="text-sm font-bold">Tu lista está vacía.</p>
                  <p className="text-xs mt-1">Agrega nombres manualmente o importa un archivo CSV.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-white dark:bg-[#0a0a0a] text-[10px] uppercase font-black text-slate-400 tracking-widest sticky top-0 border-b border-slate-100 dark:border-white/5">
                    <tr>
                      <th className="p-4">Nombre del Titular</th>
                      <th className="p-4 text-center">Pases / Pulseras</th>
                      <th className="p-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                    {wristbandList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <td className="p-4 font-bold text-slate-800 dark:text-white">{item.name}</td>
                        <td className="p-4 text-center font-black text-indigo-600 dark:text-amber-500">{item.passes}</td>
                        <td className="p-4 text-right">
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