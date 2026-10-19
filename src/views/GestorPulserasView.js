import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [sentWristbandIds, setSentWristbandIds] = useState([]);
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
        if (data.pulserasSentRowIds) {
          setSentWristbandIds(data.pulserasSentRowIds);
        } else {
          setSentWristbandIds([]);
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
      const isAlreadyInWorkshop = isLocked && sentWristbandIds.includes(sg.id);
      const isLateExtra = isLocked && !sentWristbandIds.includes(sg.id);
      flattenedList.push({
        _rowId: sg.id,
        parentGuest: guest,
        currentSubGuests: currentSubGuests,
        displayName: sg.name || (sg.isChild ? 'Niño' : 'Acompañante'),
        isMain: idx === 0,
        isChild: sg.isChild,
        pin: sg.id,
        isAlreadyInWorkshop,
        isLateExtra
      });
    });
  });

  const lateExtrasList = isLocked ? flattenedList.filter(r => r.isLateExtra) : [];

  const handleUpdateNameInline = async (parentId, subGuestId, newName, currentSubGuests) => {
    if ((isLocked && sentWristbandIds.includes(subGuestId)) || !newName.trim()) return;
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
    if (!isStandalone) return;
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
    try { await setDoc(doc(db, "eventos", eventId, "invitados", newId), newDoc); setNewEntry({ name: '', extraAdults: 0, extraChildren: 0 }); if(addNotification) addNotification('Agregado', isLocked ? 'Añadido a la lista de Pulseras Extra.' : 'Añadido correctamente.', 'success'); } catch (error) {}
  };

  const handleRemoveEntry = async (id, isAlreadySent = false) => { if ((isLocked && isAlreadySent) || !isStandalone) return; try { await deleteDoc(doc(db, "eventos", eventId, "invitados", id)); } catch (error) {} };

  const downloadTemplate = () => { /* Código CSV Omitido para brevedad, sigue intacto en tu archivo real, cópialo de arriba si es necesario */ };
  const handleFileUpload = (e) => { /* Código CSV Omitido para brevedad, sigue intacto en tu archivo real, cópialo de arriba si es necesario */ };

  const executeSendToWorkshop = async () => {
    const currentRowIds = flattenedList.map(r => r._rowId);
    try {
      await updateDoc(doc(db, "eventos", eventId), { 
          pulserasStatus: 'enviado', 
          pulserasSentRowIds: currentRowIds,
          fechaEnvioTaller: new Date().toISOString(), 
          direccionEnvioTaller: shippingInfo,
          pulserasConfig: designConfig
      });
      setSentWristbandIds(currentRowIds);
      setIsLocked(true);
      setShowAtelierModal(false);
      if(addNotification) addNotification('¡Orden Enviada!', 'Tus pulseras ya están en producción.', 'success');
    } catch (error) { 
      if(addNotification) addNotification('Error', 'Fallo de conexión.', 'error'); 
    }
  };

  const handlePrintExtraWristbandsPDF = (rowsToPrint) => {
    if (!rowsToPrint || rowsToPrint.length === 0) {
      if (addNotification) addNotification('Sin pulseras extra', 'No hay confirmados nuevos después del envío a taller.', 'warning');
      return;
    }
    const chosenFont = (FONT_STYLES.find(f => f.id === designConfig.fontId) || FONT_STYLES[0]).family;
    const formattedDate = eventDateStr ? new Date(eventDateStr).toLocaleDateString('es-MX', { timeZone: 'UTC' }) : '';
    const BANDS_PER_SHEET = 10;
    const sheets = [];
    for (let i = 0; i < rowsToPrint.length; i += BANDS_PER_SHEET) {
      sheets.push(rowsToPrint.slice(i, i + BANDS_PER_SHEET));
    }

    const printWin = window.open('', '_blank', 'width=1100,height=850');
    if (!printWin) {
      alert('Por favor permite las ventanas emergentes para generar el PDF de pulseras.');
      return;
    }

    const pagesHtml = sheets.map((sheetRows) => {
      const slots = Array.from({ length: BANDS_PER_SHEET }, (_, idx) => sheetRows[idx] || null);
      const bandsHtml = slots.map((row) => {
        if (!row) {
          return `<div class="tyvek-band empty-band"></div>`;
        }
        const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(row.pin)}&margin=0`;
        return `
          <div class="tyvek-band">
            <div class="zone-glue"></div>
            <div class="zone-safe">
              <div class="qr-block">
                <img src="${qrImgUrl}" class="qr-2cm" crossorigin="anonymous" />
              </div>
              <div class="guest-block">
                <div class="guest-name">${row.displayName}</div>
                <div class="guest-type">${row.isChild ? 'PASE NIÑO VIP' : 'PASE ADULTO VIP'}</div>
              </div>
              <div class="event-center-block">
                ${designConfig.preTitle ? `<div class="event-pre">${designConfig.preTitle}</div>` : ''}
                ${designConfig.logoBase64
                  ? `<img src="${designConfig.logoBase64}" class="event-logo" crossorigin="anonymous" />`
                  : `<div class="event-title">${designConfig.eventName || 'Evento VIP'}</div>`
                }
                ${formattedDate ? `<div class="event-date">${formattedDate}</div>` : ''}
              </div>
              <div class="brand-block">
                <span>by baulia.com</span>
              </div>
            </div>
            <div class="zone-overlap"></div>
          </div>
        `;
      }).join('');

      return `<div class="tyvek-sheet">${bandsHtml}</div>`;
    }).join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Pulseras_Extra_Tyvek_${designConfig.eventName || 'Baulia'}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Great+Vibes&family=Montserrat:wght@400;600;700;900&display=swap" rel="stylesheet">
        <style>
          @page { size: letter landscape; margin: 0; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body, html { margin: 0; padding: 0; background: #ffffff; font-family: 'Montserrat', sans-serif; color: #000000; }
          .tyvek-sheet {
            width: 27.94cm;
            min-height: 21.59cm;
            page-break-after: always;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            margin: 0 auto;
            background: #ffffff;
          }
          .tyvek-sheet:last-child { page-break-after: auto; }
          .tyvek-band {
            width: 25.4cm;
            height: 2.54cm;
            display: flex;
            align-items: center;
            border-bottom: 0.25pt dashed #e2e8f0;
            position: relative;
            overflow: hidden;
          }
          .empty-band { border-bottom: 0.25pt dashed #f1f5f9; }
          /* 3.0 cm lado pegamento + 17.4 cm área segura centrada + 5.0 cm lado libre sin pegamento = 25.4 cm */
          .zone-glue { width: 3.0cm; height: 2.54cm; flex-shrink: 0; }
          .zone-safe {
            width: 17.4cm;
            height: 2.54cm;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 0.35cm;
          }
          .zone-overlap { width: 5.0cm; height: 2.54cm; flex-shrink: 0; }
          .qr-block {
            width: 2.16cm;
            height: 2.16cm;
            background: #ffffff;
            padding: 0.08cm;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .qr-2cm { width: 2.0cm; height: 2.0cm; object-fit: contain; display: block; image-rendering: pixelated; }
          .guest-block {
            width: 4.4cm;
            padding-left: 0.3cm;
            padding-right: 0.2cm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            flex-shrink: 0;
          }
          .guest-name { font-size: 8.5pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.15; word-break: break-word; }
          .guest-type { font-size: 6.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; margin-top: 2px; opacity: 0.8; }
          .event-center-block {
            flex: 1;
            height: 2.54cm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 0 0.3cm;
            border-left: 0.5pt solid #cbd5e1;
            border-right: 0.5pt solid #cbd5e1;
          }
          .event-pre { font-size: 5.5pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.25em; margin-bottom: 1px; }
          .event-logo { height: 1.1cm; max-width: 5.5cm; object-fit: contain; margin: 1px 0; }
          .event-title { font-family: ${chosenFont}; font-size: ${designConfig.fontId === 'caligrafia' ? '17pt' : '12.5pt'}; font-weight: 700; line-height: 1.05; margin: 1px 0; }
          .event-date { font-size: 5.5pt; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; margin-top: 1px; }
          .brand-block {
            width: 1.8cm;
            height: 2.54cm;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .brand-block span {
            writing-mode: vertical-rl;
            transform: rotate(180deg);
            font-size: 6pt;
            font-weight: 900;
            letter-spacing: 0.22em;
            text-transform: uppercase;
          }
        </style>
      </head>
      <body>
        ${pagesHtml}
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 600);
          };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  if (isLoading) return <div className="p-10 text-center text-[#D4AF37] bg-[#141210] rounded-3xl border border-[#D4AF37]/20 font-bold uppercase tracking-widest text-xs">Cargando Atelier Black Label...</div>;

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
    <div className="space-y-6 pb-12 animate-in fade-in duration-500 relative bg-[radial-gradient(circle_at_center,#292421_0%,#141210_75%)] text-white p-6 sm:p-8 rounded-[2.5rem] border border-[#D4AF37]/25 shadow-[0_25px_70px_rgba(0,0,0,0.85)] min-h-screen">
      
      {/* 🔴 MODAL DE DATOS DE ENVÍO LOGÍSTICO (PALETA #1C1917 + #D4AF37) */}
      {confirmModal && createPortal(
        <div className="fixed inset-0 z-[999999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 transition-all overflow-y-auto">
            <div className="bg-[#1C1917] rounded-3xl w-full max-w-xl shadow-[0_25px_70px_rgba(0,0,0,0.9)] p-8 border border-[#D4AF37]/30 animate-in zoom-in-95 transition-colors my-8 text-white">
                
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] rounded-full flex items-center justify-center shadow-inner">
                            <Truck size={28} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-editorial font-black text-white leading-tight">Envío de Producción</h3>
                            <p className="text-xs text-slate-400 mt-1">Completa los datos para la paquetería VIP.</p>
                        </div>
                    </div>
                    <button onClick={() => setConfirmModal(false)} className="text-slate-400 hover:text-[#D4AF37] transition-colors bg-white/5 p-2 rounded-full"><X size={20}/></button>
                </div>
                
                <div className="space-y-4 mb-8 bg-[#141210] p-5 rounded-2xl border border-[#D4AF37]/20">
                    <div>
                        <label className="block text-[9px] font-bold text-[#D4AF37] uppercase tracking-widest mb-1.5 ml-1">Quien Recibe (Nombre Completo)</label>
                        <input type="text" required value={shippingInfo.recipient} onChange={e=>setShippingInfo({...shippingInfo, recipient: e.target.value})} placeholder="Ej. Juan Pérez Garza" className="w-full p-3 bg-[#1C1917] border border-white/10 rounded-xl outline-none focus:border-[#D4AF37] text-sm font-bold text-white transition-colors" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">País</label>
                            <input type="text" required value={shippingInfo.country} onChange={e=>setShippingInfo({...shippingInfo, country: e.target.value})} className="w-full p-3 bg-[#1C1917] border border-white/10 rounded-xl outline-none focus:border-[#D4AF37] text-sm font-bold text-white transition-colors" />
                        </div>
                        <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Estado / Provincia</label>
                            <input type="text" required value={shippingInfo.state} onChange={e=>setShippingInfo({...shippingInfo, state: e.target.value})} placeholder="Ej. Nuevo León" className="w-full p-3 bg-[#1C1917] border border-white/10 rounded-xl outline-none focus:border-[#D4AF37] text-sm font-bold text-white transition-colors" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Ciudad / Municipio</label>
                            <input type="text" required value={shippingInfo.city} onChange={e=>setShippingInfo({...shippingInfo, city: e.target.value})} placeholder="Ej. Monterrey" className="w-full p-3 bg-[#1C1917] border border-white/10 rounded-xl outline-none focus:border-[#D4AF37] text-sm font-bold text-white transition-colors" />
                        </div>
                        <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Código Postal</label>
                            <input type="text" required value={shippingInfo.zipCode} onChange={e=>setShippingInfo({...shippingInfo, zipCode: e.target.value})} placeholder="Ej. 64000" className="w-full p-3 bg-[#1C1917] border border-white/10 rounded-xl outline-none focus:border-[#D4AF37] text-sm font-bold text-white transition-colors" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Calle y Número</label>
                        <input type="text" required value={shippingInfo.address} onChange={e=>setShippingInfo({...shippingInfo, address: e.target.value})} placeholder="Ej. Av. Juárez #123, Col. Centro" className="w-full p-3 bg-[#1C1917] border border-white/10 rounded-xl outline-none focus:border-[#D4AF37] text-sm font-bold text-white transition-colors" />
                    </div>

                    <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Referencias de Entrega (Opcional)</label>
                        <input type="text" value={shippingInfo.references} onChange={e=>setShippingInfo({...shippingInfo, references: e.target.value})} placeholder="Ej. Casa blanca con portón negro, frente a parque" className="w-full p-3 bg-[#1C1917] border border-white/10 rounded-xl outline-none focus:border-[#D4AF37] text-sm font-bold text-white transition-colors" />
                    </div>

                    <div className="flex gap-4">
                        <div className="w-1/3">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Lada</label>
                            <input type="text" required value={shippingInfo.phoneCode} onChange={e=>setShippingInfo({...shippingInfo, phoneCode: e.target.value})} placeholder="+52" className="w-full p-3 bg-[#1C1917] border border-white/10 rounded-xl outline-none focus:border-[#D4AF37] text-sm font-bold text-center text-white transition-colors" />
                        </div>
                        <div className="w-2/3">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Teléfono Móvil</label>
                            <input type="text" required value={shippingInfo.phone} onChange={e=>setShippingInfo({...shippingInfo, phone: e.target.value})} placeholder="10 dígitos" className="w-full p-3 bg-[#1C1917] border border-white/10 rounded-xl outline-none focus:border-[#D4AF37] text-sm font-bold text-white transition-colors" />
                        </div>
                    </div>
                </div>

                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl mb-6 flex items-start gap-3">
                    <AlertTriangle size={20} className="text-rose-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-rose-300 leading-relaxed font-medium">Una vez enviada la orden a taller, <strong>el lote enviado quedará sellado.</strong> Los invitados que confirmen después podrás imprimirlos en el PDF de Pulseras Extra.</p>
                </div>

                <div className="flex gap-3">
                    <button onClick={() => setConfirmModal(false)} className="flex-1 py-4 bg-white/5 text-slate-300 rounded-xl font-bold hover:bg-white/10 transition-colors uppercase tracking-widest text-[10px]">Revisar Lista</button>
                    <button 
                        disabled={!isShippingValid} 
                        onClick={() => { setConfirmModal(false); executeSendToWorkshop(); }} 
                        className="flex-1 py-4 bg-[#D4AF37] text-[#1C1917] rounded-xl font-black shadow-[0_10px_25px_rgba(212,175,55,0.25)] hover:bg-[#c5a028] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center uppercase tracking-widest text-[10px]">
                        <Send size={16} className="mr-2"/> Enviar Orden Definitiva
                    </button>
                </div>
            </div>
        </div>,
        document.body
      )}

      {/* 🟢 ATELIER PHYGITAL A PANTALLA COMPLETA (MODO INDEPENDIENTE: PULSERAS BLACK LABEL) */}
      {showAtelierModal && createPortal(
        <div className="fixed inset-0 z-[99999] bg-[#1C1917]/95 backdrop-blur-2xl flex flex-col animate-in fade-in duration-300 text-white select-none">
          <div className="h-16 px-6 border-b border-[#D4AF37]/20 flex items-center justify-between bg-[#141210] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#D4AF37]">Baulia Atelier Phygital</span>
                  <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-white/10 text-slate-300">Brazaletes Tyvek • Black Label</span>
                </div>
                <h2 className="text-sm font-bold text-white leading-tight">Estudio de Personalización de Pulseras VIP</h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isLocked && (
                <span className="px-3.5 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,175,55,0.15)]">
                  <Lock size={12}/> EN PRODUCCIÓN
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowAtelierModal(false)}
                className="px-4 py-2 rounded-full bg-white/5 hover:bg-[#D4AF37]/20 border border-white/10 hover:border-[#D4AF37]/40 text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
              >
                <X size={15}/> Cerrar Estudio
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            {/* VISOR INTERACTIVO CENTRAL DE LA PULSERA (25.4 x 2.54 CM REALES) */}
            <div className="lg:col-span-7 bg-[radial-gradient(circle_at_center,#292421_0%,#141210_75%)] p-6 sm:p-10 flex flex-col items-center justify-center relative min-h-[420px]">
              <div className="mb-6 flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1C1917]/80 border border-[#D4AF37]/30 backdrop-blur-md">
                <Eye size={13} className="text-[#D4AF37]"/>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">
                  Vista Previa Real • Brazalete Tyvek 25.4 x 2.54 cm • QR 2x2 cm ({activeWristband.name})
                </span>
              </div>

              <div className="w-full max-w-4xl px-2">
                {/* Regla de cotas físicas */}
                <div className="flex text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1.5 px-1">
                  <div style={{ width: '11.8%' }} className="text-center border-r border-white/10">3 cm Pegamento</div>
                  <div style={{ width: '68.5%' }} className="text-center text-[#D4AF37] border-r border-white/10">← 17.4 cm Área Segura Centrada →</div>
                  <div style={{ width: '19.7%' }} className="text-center">5 cm Cierre Libre</div>
                </div>

                <div
                  style={{
                    backgroundColor: activeWristband.bg,
                    color: effectiveInk,
                    borderColor: activeWristband.border
                  }}
                  className="w-full h-28 rounded-2xl border-2 shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex items-center overflow-hidden relative transition-all duration-300"
                >
                  {/* 3.0 CM PEGAMENTO (11.8%) */}
                  <div style={{ width: '11.8%' }} className="h-full border-r border-dashed border-current/25 flex items-center justify-center bg-black/10 shrink-0">
                    <span className="-rotate-90 text-[7px] font-black tracking-widest uppercase opacity-50 whitespace-nowrap">PEGAMENTO (3 CM)</span>
                  </div>

                  {/* 17.4 CM ÁREA SEGURA CENTRADA (68.5%) */}
                  <div style={{ width: '68.5%' }} className="h-full flex items-center justify-between px-3 border-r border-dashed border-current/25">
                    {/* QR 2x2 cm + Invitado */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="w-20 h-20 rounded-lg flex flex-col items-center justify-center bg-white text-black p-1.5 shadow-sm shrink-0">
                        <QrCode size={52} strokeWidth={1.8} className="text-black" />
                        <span className="text-[5.5px] font-black tracking-widest uppercase text-slate-700">QR 2x2 CM</span>
                      </div>
                      <div className="w-28 sm:w-32 flex flex-col justify-center">
                        <span className="text-[10px] font-black uppercase tracking-wider leading-tight line-clamp-2">
                          {flattenedList[0]?.displayName || 'JUAN PÉREZ'}
                        </span>
                        <span className="text-[7.5px] font-bold uppercase opacity-75 mt-0.5">PASE ADULTO VIP</span>
                      </div>
                    </div>

                    {/* Centro: Renglón 1 Tipo Evento, Renglón 2 Logo o Nombres, Renglón 3 Fecha */}
                    <div className="flex-1 h-full flex flex-col items-center justify-center text-center px-3 border-x border-current/15 overflow-hidden">
                      <span className="text-[7px] font-black uppercase tracking-[0.25em] opacity-85 mb-0.5">
                        {designConfig.preTitle || 'NUESTRO EVENTO'}
                      </span>
                      {designConfig.logoBase64 ? (
                        <img src={designConfig.logoBase64} alt="Logo" className="h-10 object-contain my-0.5" />
                      ) : (
                        <span style={{ fontFamily: activeFont.family }} className="text-2xl leading-none my-0.5 truncate w-full">
                          {designConfig.eventName || 'Evento VIP'}
                        </span>
                      )}
                      <span className="text-[7px] font-bold tracking-widest uppercase opacity-75 mt-0.5">
                        {eventDateStr ? new Date(eventDateStr).toLocaleDateString('es-MX', { timeZone: 'UTC' }) : '24/10/2026'}
                      </span>
                    </div>

                    {/* Extremo derecho del área segura: by baulia.com */}
                    <div className="w-8 h-full flex items-center justify-center shrink-0">
                      <span className="-rotate-90 text-[7px] font-black tracking-[0.2em] uppercase opacity-75 whitespace-nowrap">by baulia.com</span>
                    </div>
                  </div>

                  {/* 5.0 CM EXTREMIDAD SIN PEGAMENTO (19.7%) */}
                  <div style={{ width: '19.7%' }} className="h-full flex flex-col items-center justify-center bg-black/5 shrink-0 px-2 text-center">
                    <span className="text-[7px] font-black tracking-widest uppercase opacity-40">ZONA DE CIERRE LIBRE</span>
                    <span className="text-[6px] font-bold tracking-widest uppercase opacity-30 mt-0.5">(5.0 CM SIN IMPRESIÓN)</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 mt-6 text-center max-w-lg">
                ✨ Calibración exacta para Tyvek de <b>2.54 cm de ancho</b>: QR de <b>2.0 x 2.0 cm</b> de lectura garantizada y diseño centrado en los <b>17.4 cm libres</b>.
              </p>
            </div>

            {/* BARRA LATERAL DERECHA DE CONTROLES DEL ATELIER */}
            <div className="lg:col-span-5 bg-[#1C1917] border-l border-[#D4AF37]/20 p-6 sm:p-8 overflow-y-auto custom-scrollbar space-y-6">
              {/* INTERRUPTOR DE HERENCIA (DESACTIVADO TEMPORALMENTE) */}

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
                          ? 'bg-[#D4AF37]/15 border-[#D4AF37] shadow-md'
                          : 'bg-white/5 border-white/10 hover:border-[#D4AF37]/40'
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
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#D4AF37] mb-2">
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
                            ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-white'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-[#D4AF37]/40'
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
                          ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37]'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:border-[#D4AF37]/40'
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

              {/* 3. TEXTOS Y LOGO */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Tipo de Evento (Renglón 1)</label>
                  <input
                    type="text"
                    disabled={isLocked}
                    value={designConfig.preTitle || ''}
                    onChange={e => setDesignConfig({ ...designConfig, preTitle: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#141210] border border-white/10 text-xs font-bold text-white outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Festejados (Renglón 2)</label>
                  <input
                    type="text"
                    disabled={isLocked}
                    value={designConfig.eventName || ''}
                    onChange={e => setDesignConfig({ ...designConfig, eventName: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#141210] border border-white/10 text-xs font-bold text-white outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-dashed border-[#D4AF37]/30 bg-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">Logo o Monograma (Opcional)</p>
                  <p className="text-[9px] text-slate-400">Si subes un logo, se colocará en el renglón central.</p>
                </div>
                {designConfig.logoBase64 ? (
                  <div className="flex items-center gap-3">
                    <img src={designConfig.logoBase64} alt="Logo" className="h-9 object-contain bg-white/10 p-1 rounded" />
                    {!isLocked && (
                      <button type="button" onClick={removeLogo} className="text-[10px] font-bold text-rose-400 underline">Quitar</button>
                    )}
                  </div>
                ) : (
                  <label className={`px-3.5 py-2 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-[#D4AF37]/25 transition-colors ${isLocked ? 'opacity-40 pointer-events-none' : ''}`}>
                    {isUploadingLogo ? 'Subiendo...' : 'Subir Logo'}
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={isLocked} />
                  </label>
                )}
              </div>

              {/* ACCIONES O ESTADO EN TALLER */}
              {!isLocked ? (
                <div className="pt-3 border-t border-[#D4AF37]/20 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleSaveDesign}
                    className="flex-1 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest transition-colors"
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
                    className="flex-1 py-4 rounded-xl bg-[#D4AF37] hover:bg-[#c5a028] text-[#1C1917] font-black text-[10px] uppercase tracking-widest shadow-[0_10px_25px_rgba(212,175,55,0.25)] transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    <Send size={14}/> Enviar a Taller ({totalPulserasSolicitadas})
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold text-center shadow-[0_0_20px_rgba(212,175,55,0.1)]">
                  ✓ Este diseño ya se encuentra en producción dentro del Taller Baulia.
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Great+Vibes&family=Montserrat:wght@400;600;700;900&display=swap');
        .font-firma { font-family: 'Great Vibes', cursive; }
      `}</style>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-[#1C1917] p-6 rounded-3xl border border-[#D4AF37]/25 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
            <Sparkles size={20} />
          </div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#D4AF37] block">Baulia Black Label • Tyvek 2.54 cm</span>
            <h2 className="text-2xl sm:text-3xl font-editorial text-white tracking-wide">Gestor de Pulseras VIP</h2>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setShowAtelierModal(true)}
            className={`w-full md:w-auto justify-center px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all border ${
              isLocked
                ? 'bg-[#141210] text-[#D4AF37] border-[#D4AF37]/50 shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                : 'bg-[#D4AF37] hover:bg-[#c5a028] text-[#1C1917] border-[#D4AF37] shadow-[0_10px_25px_rgba(212,175,55,0.25)]'
            }`}
          >
            {isLocked ? (
              <><Lock size={14}/> Pulseras en Taller (Ver Diseño)</>
            ) : (
              <><Sparkles size={15}/> Abrir Atelier de Brazaletes (Pantalla Completa)</>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 flex flex-col space-y-6">
          <div className="bg-[#1C1917] rounded-3xl border border-[#D4AF37]/25 shadow-xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-[#D4AF37]/15 bg-[#141210] flex items-center justify-between">
               <div className="flex items-center">
                 <Palette size={18} className="text-[#D4AF37] mr-2" />
                 <h3 className="font-bold text-white text-sm">Personalización del Brazalete</h3>
               </div>
               <button
                 type="button"
                 onClick={() => setShowAtelierModal(true)}
                 className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] hover:underline flex items-center gap-1"
               >
                 <Sparkles size={12}/> Elegir Color / Papel
               </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-[#141210] p-4 rounded-2xl border border-[#D4AF37]/15 space-y-3 shadow-inner">
                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Base / Papel</span>
                  <span className="text-[10px] font-black text-white uppercase">{activeWristband.name}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tinta</span>
                  <div className="flex items-center gap-1.5">
                     <span style={{ backgroundColor: effectiveInk }} className="w-2.5 h-2.5 rounded-full border border-white/30 shadow-sm"></span>
                     <span className="text-[10px] font-black text-[#D4AF37] uppercase">{designConfig.pulseraInkColor === '#D4AF37' ? 'Dorado' : designConfig.pulseraInkColor === '#CBD5E1' ? 'Plata' : designConfig.pulseraColorId === 'blanca_atelier' ? 'Tinta Negra' : 'Blanco'}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tipografía</span>
                  <span className="text-[10px] font-black text-white uppercase truncate max-w-[120px]">{activeFont.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Textos Impresos</span>
                  <div className="text-right flex flex-col items-end">
                     <span className="text-[8px] text-[#D4AF37] uppercase tracking-widest">{designConfig.preTitle || 'SIN PRE-TÍTULO'}</span>
                     <span className="text-[10px] font-black text-white uppercase truncate max-w-[130px]">{designConfig.eventName || 'SIN NOMBRE'}</span>
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => setShowAtelierModal(true)} disabled={isLocked} className="w-full py-3.5 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 text-[#D4AF37] rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md transition-colors disabled:opacity-30 flex justify-center items-center gap-2">
                 <Sparkles size={14}/> {isLocked ? 'Diseño Bloqueado' : 'Modificar en Atelier'}
              </button>
            </div>
          </div>

          <div className="bg-[#1C1917] rounded-3xl p-5 border border-[#D4AF37]/25 shadow-xl">
             <div className="flex items-center justify-between mb-3">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-300 flex items-center"><Eye size={12} className="mr-1.5 text-[#D4AF37]" /> Vista Previa 25.4 x 2.54 cm ({activeWristband.name})</h4>
               <button type="button" onClick={() => setShowAtelierModal(true)} className="text-[9px] font-bold text-[#D4AF37] hover:underline">Ampliar en Atelier</button>
             </div>
             <div
               style={{ backgroundColor: activeWristband.bg, color: effectiveInk, borderColor: activeWristband.border }}
               className="w-full h-20 rounded-xl shadow-md border overflow-hidden flex items-stretch transition-colors"
             >
                <div style={{ width: '11.8%' }} className="bg-black/10 border-r border-dashed border-current/25 flex items-center justify-center"><span className="text-[5.5px] opacity-60 font-bold -rotate-90 tracking-widest">3CM PEG.</span></div>
                <div style={{ width: '68.5%' }} className="flex items-center justify-between px-2 border-r border-dashed border-current/25">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="w-12 h-12 bg-white text-black rounded flex items-center justify-center p-0.5"><QrCode size={32} className="text-black" strokeWidth={1.8} /></div>
                    <div className="flex flex-col justify-center max-w-[70px]"><span className="text-[7.5px] font-black uppercase truncate">{flattenedList[0]?.displayName || 'Juan Pérez'}</span><span className="text-[5.5px] font-bold opacity-75">PASE VIP</span></div>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center border-x border-current/15 px-1.5 overflow-hidden text-center">
                    {designConfig.preTitle && <span className="text-[5px] font-black opacity-80 uppercase tracking-widest mb-0.5">{designConfig.preTitle}</span>}
                    {designConfig.logoBase64 ? ( <img src={designConfig.logoBase64} alt="Logo" className="h-6 object-contain my-0.5" /> ) : ( <div style={{ fontFamily: activeFont.family }} className="text-base leading-none my-0.5 truncate w-full">{designConfig.eventName || 'Evento VIP'}</div> )}
                    <span className="text-[5px] font-black opacity-65 uppercase tracking-widest">{eventDateStr ? new Date(eventDateStr).toLocaleDateString('es-MX', { timeZone: 'UTC' }) : 'Fecha'}</span>
                  </div>
                  <div className="w-4 flex items-center justify-center"><span className="text-[5px] opacity-70 font-black -rotate-90 tracking-widest whitespace-nowrap">by baulia</span></div>
                </div>
                <div style={{ width: '19.7%' }} className="bg-black/5 flex items-center justify-center"><span className="text-[5.5px] opacity-40 font-black tracking-widest text-center">5CM LIBRE</span></div>
             </div>
          </div>

          <div className="bg-gradient-to-br from-[#1C1917] to-[#141210] rounded-3xl p-6 text-white border border-[#D4AF37]/40 shadow-[0_15px_40px_rgba(0,0,0,0.6)] flex flex-col items-center text-center gap-4">
             <div>
               <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-1 text-[#D4AF37]">Total en Lista</p>
               <h3 className="text-5xl font-editorial font-black text-white">{totalPulserasSolicitadas} <span className="text-base font-sans font-medium text-slate-400">pulseras</span></h3>
             </div>
             <button onClick={() => { if (validWristbandList.length === 0) return; setConfirmModal(true); }} disabled={isLocked || validWristbandList.length === 0} className="w-full py-4 px-8 bg-[#D4AF37] hover:bg-[#c5a028] text-[#1C1917] rounded-xl font-black text-xs uppercase tracking-widest shadow-[0_10px_25px_rgba(212,175,55,0.25)] hover:scale-[1.02] transition-all disabled:opacity-40 disabled:hover:scale-100 flex items-center justify-center">
               <Send size={16} className="mr-2" /> {isLocked ? `Lote Enviado a Taller (${sentWristbandIds.length})` : 'Enviar a Taller Baulia'}
             </button>

             {isLocked && (
               <div className="w-full pt-4 border-t border-[#D4AF37]/25 space-y-2.5">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                   Confirmados Tardíos Post-Taller: <span className="text-[#D4AF37] underline">{lateExtrasList.length} pulseras</span>
                 </p>
                 <button
                   type="button"
                   disabled={lateExtrasList.length === 0}
                   onClick={() => handlePrintExtraWristbandsPDF(lateExtrasList)}
                   className="w-full py-3.5 px-6 bg-[#D4AF37] hover:bg-[#c5a028] text-[#1C1917] rounded-xl font-black text-[10px] uppercase tracking-widest shadow-[0_10px_25px_rgba(212,175,55,0.25)] transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                 >
                   <Download size={15} /> Imprimir Pulseras Extra ({lateExtrasList.length})
                 </button>
               </div>
             )}
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col h-full min-h-[600px]">
          <div className="flex-1 bg-[#1C1917] rounded-3xl border border-[#D4AF37]/25 shadow-xl overflow-hidden flex flex-col h-full">
            <div className="bg-[#141210] border-b border-[#D4AF37]/20 p-4 flex items-start gap-3">
               <Info size={20} className="text-[#D4AF37] shrink-0 mt-0.5" />
               <div className="text-xs text-slate-300 leading-relaxed">
                  <strong className="block mb-1 text-[#D4AF37] uppercase tracking-wider text-[10px]">¿Cómo funciona esta lista?</strong>
                  {isStandalone ? (
                      <>1. El nombre <b>Titular</b> genera automáticamente <span className="underline text-[#D4AF37]">1 pulsera</span>.<br/>2. Si agregas personas después de enviar a taller, se marcarán como <b className="text-[#D4AF37]">EXTRA PDF</b> para imprimirlas en tus pulseras de reserva.</>
                  ) : (
                      <>1. <b className="text-white">Sincronización Automática:</b> Tus invitados confirmados aparecen aquí al instante.<br/>2. <b className="text-[#D4AF37]">Modo Emergencia Post-Taller:</b> Los invitados que confirmen después de haber enviado tu orden a taller se marcarán como <b className="text-[#D4AF37]">EXTRA PDF</b> para que imprimas únicamente esas pulseras en horizontal.</>
                  )}
               </div>
            </div>

            <div className="p-5 border-b border-white/10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm flex items-center"><Sparkles size={16} className="mr-2 text-[#D4AF37]" /> Lista de Producción</h3>
                {isLocked && lateExtrasList.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-[9px] font-black uppercase tracking-widest">
                    +{lateExtrasList.length} Extras por imprimir
                  </span>
                )}
              </div>
              {!isLocked && isStandalone && (
                  <div className="flex gap-2 w-full xl:w-auto">
                    <button onClick={downloadTemplate} className="flex-1 xl:flex-none px-3 py-2 bg-white/5 text-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center justify-center border border-white/10"><Download size={14} className="mr-1.5 text-[#D4AF37]"/> Plantilla CSV</button>
                    <label className="cursor-pointer flex-1 xl:flex-none px-4 py-2 bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/40 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#D4AF37]/25 transition-colors flex items-center justify-center">
                        <FileSpreadsheet size={14} className="mr-1.5" /> Subir CSV
                        <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
              )}
            </div>
            
            {isStandalone && (
                <div className="p-4 border-b border-white/10 bg-[#141210] shrink-0">
                    <form onSubmit={handleAddEntry} className="flex flex-col sm:flex-row w-full gap-3 items-end">
                        <div className="flex-1 w-full">
                           <span className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-widest ml-1 mb-1 block">
                             {isLocked ? 'Agregar Invitado Tardío (Pulsera Extra)' : 'Titular (Manual)'}
                           </span>
                           <input type="text" required placeholder="Ej. Familia Garza" value={newEntry.name} onChange={e=>setNewEntry({...newEntry, name: e.target.value})} className="w-full p-3 bg-[#1C1917] border border-white/10 rounded-xl text-sm font-bold text-white outline-none focus:border-[#D4AF37] transition-colors" />
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto items-end">
                          <div className="flex flex-col w-full sm:w-24">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Adultos</span>
                            <input type="number" min="0" value={newEntry.extraAdults} onChange={e=>setNewEntry({...newEntry, extraAdults: e.target.value})} className="w-full p-3 bg-[#1C1917] border border-white/10 rounded-xl text-sm font-black text-center text-[#D4AF37] outline-none focus:border-[#D4AF37] transition-colors" />
                          </div>
                          <div className="flex flex-col w-full sm:w-24">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Niños</span>
                            <input type="number" min="0" value={newEntry.extraChildren} onChange={e=>setNewEntry({...newEntry, extraChildren: e.target.value})} className="w-full p-3 bg-[#1C1917] border border-white/10 rounded-xl text-sm font-black text-center text-amber-200 outline-none focus:border-[#D4AF37] transition-colors" />
                          </div>
                          <button type="submit" className="px-4 w-full sm:w-auto bg-[#D4AF37] text-[#1C1917] rounded-xl hover:bg-[#c5a028] flex items-center justify-center font-black text-xs h-[46px] transition-colors uppercase tracking-wider"><Plus size={18} className="md:mr-1" /> <span className="hidden md:inline">Agregar</span></button>
                        </div>
                    </form>
                </div>
            )}

            <div className="overflow-y-auto custom-scrollbar flex-1 max-h-[700px]">
              {flattenedList.length === 0 ? (
                <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                  <ListTodo size={40} className="mb-3 text-[#D4AF37]/30" />
                  <p className="text-sm font-bold text-white">La tabla está vacía.</p>
                  {!isStandalone && <p className="text-xs text-slate-400 mt-2 max-w-sm">Los invitados que tengan estatus <strong className="text-[#D4AF37]">CONFIRMADO</strong> en tu Lista principal aparecerán aquí mágicamente al instante.</p>}
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#141210] text-[10px] uppercase font-black text-[#D4AF37] tracking-widest sticky top-0 border-b border-[#D4AF37]/20 z-10">
                    <tr>
                      <th className="px-6 py-3">Nombre en Brazalete (Clic para editar)</th>
                      <th className="px-4 py-3 text-center">Tipo</th>
                      <th className="px-4 py-3 text-right">Lote / Controles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {flattenedList.map((row) => (
                      <tr key={row._rowId} className={`transition-colors hover:bg-white/5 ${row.isMain ? 'bg-[#1C1917] border-t-2 border-[#D4AF37]/20' : 'bg-[#141210]/60'}`}>
                        <td className="px-6 py-3 flex items-center">
                          <div className="relative w-full group flex items-center bg-transparent hover:bg-white/5 rounded transition-colors p-1 -ml-1">
                              {!row.isAlreadyInWorkshop && <Edit3 size={12} className="absolute -left-3 text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity" />}
                              <input type="text" defaultValue={row.displayName} disabled={row.isAlreadyInWorkshop} onBlur={(e) => handleUpdateNameInline(row.parentGuest.id, row.pin, e.target.value, row.currentSubGuests)} className={`w-full bg-transparent outline-none border-b border-transparent focus:border-[#D4AF37] transition-colors ${row.isMain ? 'font-bold text-white' : 'font-medium text-slate-300'} disabled:opacity-75`} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {row.isChild ? ( <span className="text-[#D4AF37] bg-[#D4AF37]/15 border border-[#D4AF37]/30 px-2 py-0.5 rounded text-[8px] uppercase font-black tracking-widest">Niño</span> ) : ( <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Adulto</span> )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {row.isAlreadyInWorkshop && (
                              <span className="px-2 py-0.5 rounded bg-white/10 text-slate-300 text-[8px] font-black uppercase tracking-widest">En Taller</span>
                            )}
                            {row.isLateExtra && (
                              <span className="px-2 py-0.5 rounded bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] text-[8px] font-black uppercase tracking-widest">Extra PDF</span>
                            )}
                            {row.isMain && !row.isAlreadyInWorkshop && isStandalone && ( <button onClick={() => handleRemoveEntry(row.parentGuest.id, row.isAlreadyInWorkshop)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"><Trash2 size={16} /></button> )}
                          </div>
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