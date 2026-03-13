import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { collection, doc, setDoc, onSnapshot, getDocs, query, where, serverTimestamp, deleteDoc, getDoc, addDoc } from 'firebase/firestore';
import { db, auth, secondaryAuth } from './firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, createUserWithEmailAndPassword, sendPasswordResetEmail, updatePassword } from 'firebase/auth';

import { 
  LayoutDashboard, Users, Map as MapIcon, Wallet, CheckSquare, Store, Clock, Palette, 
  Smartphone, Menu, Bell, Search as SearchIcon, X, MessageCircle, QrCode, UserPlus, FileText, UploadCloud, 
  ExternalLink, Edit2, Trash2, AlertTriangle, FileSpreadsheet, CheckCircle, ArrowRight, 
  Download, Link, LogOut, RotateCw, Move, LayoutGrid, Plus, Minus, RefreshCw, Trash, Info, Hand, Spline, Maximize, 
  FlipHorizontal, Hexagon, Type, Layers, ArrowUp, ArrowDown, PaintBucket, Flower2, Trees, Cuboid, Magnet, 
  DollarSign, PieChart, TrendingDown, Upload, Building, Landmark, History, Phone, Mail, Calendar, Eye, EyeOff, MessageSquare, 
  FileSignature, AlertCircle, Star, Image as ImageIcon, CalendarDays, FileDown, 
  ListTodo, CheckCircle2, Circle, PlayCircle, AlignLeft, MapPin, ShieldCheck, Printer, Scan, Camera, Navigation as NavigationIcon, Navigation, MoreVertical,
  Square, RectangleHorizontal, Settings2, GripVertical, Wand2, Moon, Heart, Send, Lock, WifiOff, Globe, Image, Key, Power, Quote
} from 'lucide-react';

// Función Helper para Exportar a CSV
const exportToCSV = (filename, rows) => {
  const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => Object.values(e).join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const MOCK_BUDGET = { total: 150000, spent: 45000 };

// 🔴 AHORA EL ID ES DINÁMICO PARA PODER CAMBIAR DE BODA EN BODA
export let ID_DEL_EVENTO = "evento_de_prueba";
export const setGlobalEventId = (id) => { ID_DEL_EVENTO = id; };

// ==========================================
// --- LOGOTIPO OFICIAL BAULIA (DIAMANTE PRO) ---
// ==========================================
const BauliaLogo = ({ className = "h-10", forceWhite = false }) => (
  <svg viewBox="0 0 915 201" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ overflow: 'visible' }}>
    <style>
      {`
        .baulia-text { 
          fill: ${forceWhite ? '#FFFFFF' : '#1C1917'}; 
          transition: fill 0.5s ease; 
        }
        /* El animador invisible: ESTADO NATURAL EN ROMBO (45 grados) */
        .baulia-diamond-animator {
          transform-origin: 100px 100px;
          transform: rotate(45deg) scale(0.8); 
          transition: transform 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        /* El color del diamante */
        .baulia-diamond-shape { 
          fill: ${forceWhite ? 'transparent' : '#1C1917'}; 
          stroke: #D4AF37; 
          stroke-width: 1.72px;
          transition: fill 0.5s ease, stroke-width 0.3s ease;
        }
        .baulia-b { 
          fill: #D4AF37; 
          transition: all 0.6s ease; 
          transform-origin: 100px 100px; 
        }
        
        /* HOVERS: Gira 90 grados adicionales (45 + 90 = 135) */
        svg:hover .baulia-diamond-animator { transform: rotate(135deg) scale(0.85); }
        svg:hover .baulia-diamond-shape { stroke-width: 3px; }
        svg:hover .baulia-b { transform: scale(1.05); fill: #FDF1A9; }
        
        /* DARK MODE */
        .dark .baulia-text { fill: #FFFFFF !important; }
        .dark .baulia-diamond-shape { fill: transparent !important; }
      `}
    </style>
    
    <g className="baulia-text">
      <path d="M265.12,78.58h-.35c0-2.04-.75-3.8-2.24-5.25-1.5-1.46-3.27-2.18-5.31-2.18h-1.42l-.12-1.18h9.44v8.62ZM265.12,143.97v8.62h-9.44l.12-1.18h1.42c2.05,0,3.82-.73,5.31-2.18,1.49-1.46,2.24-3.21,2.24-5.25h.35ZM272.44,69.96v82.62h-7.67v-82.62h7.67ZM279.17,69.96c5.51,0,10.17.83,13.99,2.48,3.82,1.65,6.71,3.95,8.68,6.91,1.97,2.95,2.95,6.39,2.95,10.33,0,3.3-.63,6.2-1.89,8.68-1.26,2.48-2.87,4.49-4.84,6.02-1.97,1.53-4.05,2.62-6.26,3.25,4.17.63,7.77,2.01,10.8,4.13,3.03,2.12,5.35,4.78,6.96,7.97,1.61,3.19,2.42,6.75,2.42,10.68,0,4.41-1.06,8.28-3.19,11.63-2.12,3.35-5.25,5.94-9.38,7.79-4.13,1.85-9.11,2.77-14.93,2.77h-13.1c.08-1.42.12-2.83.12-4.25h12.51c4.09,0,7.55-.73,10.39-2.18,2.83-1.46,5-3.6,6.49-6.43,1.49-2.83,2.24-6.22,2.24-10.15,0-4.41-.85-7.99-2.54-10.74-1.69-2.75-3.88-4.84-6.55-6.26-2.68-1.42-5.57-2.38-8.68-2.89-3.11-.51-6.08-.77-8.91-.77v-1.06c1.81,0,3.82-.2,6.02-.59,2.2-.39,4.33-1.18,6.37-2.36,2.04-1.18,3.74-2.93,5.08-5.25,1.34-2.32,2.01-5.37,2.01-9.15,0-3.54-.65-6.57-1.95-9.09-1.3-2.52-3.23-4.43-5.78-5.72-2.56-1.3-5.72-1.95-9.5-1.95h-10.86c0-.08-.1-.41-.29-1-.2-.59-.49-1.51-.89-2.77h12.51Z" />
      <path d="M381.98,143.97c-.55,1.58-.63,2.91-.24,4.01.39,1.1,1.04,1.95,1.95,2.54.9.59,1.83.89,2.77.89h1.06v1.18h-23.73v-1.18h1.06c1.81,0,3.68-.57,5.61-1.71,1.93-1.14,3.52-3.05,4.78-5.72h6.73ZM407.36,68.31l1.06,8.26-29.63,75.66h-7.08l30.22-71.77c.86-1.97,1.59-3.66,2.18-5.08.59-1.42,1.1-2.79,1.53-4.13.43-1.34.65-2.32.65-2.95h1.06ZM424,120.36v3.54h-36.95v-3.54h36.95ZM407.36,68.31l34.94,83.57h-10.03l-27.27-72.36,2.36-11.21ZM429.31,143.97h9.68c1.18,2.68,2.75,4.58,4.72,5.72,1.97,1.14,3.85,1.71,5.67,1.71h.94v1.18h-26.56v-1.18h1.06c1.49,0,2.83-.65,4.01-1.95,1.18-1.3,1.34-3.13.47-5.49Z" />
      <path d="M506.51,69.96v7.08h-.35c0-1.73-.61-3.15-1.83-4.25-1.22-1.1-2.7-1.65-4.43-1.65h-1.89v-1.18h8.5ZM513.83,69.96v51.94c0,5.67,1.04,10.66,3.13,14.99,2.08,4.33,5.02,7.69,8.79,10.09,3.78,2.4,8.14,3.6,13.1,3.6,5.27,0,9.87-1.14,13.81-3.42,3.93-2.28,7-5.45,9.21-9.5,2.2-4.05,3.31-8.79,3.31-14.22v-53.47h5.55v53.47c0,6.14-1.32,11.51-3.95,16.11-2.64,4.6-6.36,8.2-11.15,10.8-4.8,2.6-10.39,3.9-16.76,3.9s-12.26-1.28-17.17-3.84c-4.92-2.56-8.73-6.14-11.45-10.74-2.71-4.6-4.07-9.97-4.07-16.11v-53.59h7.67ZM521.97,69.96v1.18h-1.89c-1.73,0-3.21.55-4.43,1.65-1.22,1.1-1.83,2.52-1.83,4.25h-.24v-7.08h8.38ZM538.73,61.58c1.65-1.81,3.31-3.6,4.96-5.37,1.65-1.77,3.32-3.5,5.02-5.19s3.36-3.32,5.02-4.9c.87.94,1.73,1.93,2.6,2.95.87,1.02,1.61,2.12,2.24,3.31-2.12,1.18-4.25,2.36-6.37,3.54-2.12,1.18-4.23,2.3-6.31,3.36-2.09,1.06-4.19,2.11-6.31,3.13l-.83-.83ZM565.53,69.96v7.08h-.35c0-1.73-.61-3.15-1.83-4.25-1.22-1.1-2.7-1.65-4.43-1.65h-1.89v-1.18h8.5ZM578.86,69.96v1.18h-1.89c-1.73,0-3.21.55-4.43,1.65-1.22,1.1-1.83,2.52-1.83,4.25h-.24v-7.08h8.38Z" />
      <path d="M646.97,78.58h-.35c-.08-2.04-.85-3.8-2.3-5.25-1.46-1.46-3.21-2.18-5.25-2.18h-1.53v-1.18h9.44v8.62ZM646.97,143.97v8.62h-9.44v-1.18h1.53c2.05,0,3.8-.73,5.25-2.18s2.22-3.21,2.3-5.25h.35ZM654.29,69.96v82.62h-7.67v-82.62h7.67ZM653.94,78.58v-8.62h9.44v1.18h-1.53c-2.05,0-3.8.73-5.25,2.18s-2.22,3.21-2.3,5.25h-.35ZM686.16,148.93v3.66h-32.22v-3.66h32.22ZM693.36,133.46l-6.85,19.12h-19.59l4.25-3.66c4.17,0,7.57-.65,10.21-1.95,2.64-1.3,4.78-3.13,6.43-5.49,1.65-2.36,3.11-5.04,4.37-8.03h1.18Z" />
      <path d="M758.75,78.58h-.35c-.08-2.04-.85-3.8-2.3-5.25-1.46-1.46-3.21-2.18-5.25-2.18h-1.53v-1.18h9.44v8.62ZM758.75,143.97v8.62h-9.44v-1.18h1.53c2.05,0,3.8-.73,5.25-2.18s2.22-3.21,2.3-5.25h.35ZM766.07,69.96v82.62h-7.67v-82.62h7.67ZM765.72,78.58v-8.62h9.44v1.18h-1.53c-2.05,0-3.8.73-5.25,2.18-1.46,1.46-2.22,3.21-2.3,5.25h-.35ZM765.72,143.97h.35c.08,2.05.84,3.8,2.3,5.25,1.46,1.46,3.21,2.18,5.25,2.18h1.53v1.18h-9.44v-8.62Z" />
      <path d="M846.33,143.97c-.55,1.58-.63,2.91-.24,4.01.39,1.1,1.04,1.95,1.95,2.54.9.59,1.83.89,2.77.89h1.06v1.18h-23.73v-1.18h1.06c1.81,0,3.68-.57,5.61-1.71,1.93-1.14,3.52-3.05,4.78-5.72h6.73ZM871.71,68.31l1.06,8.26-29.63,75.66h-7.08l30.22-71.77c.87-1.97,1.59-3.66,2.18-5.08.59-1.42,1.1-2.79,1.53-4.13.43-1.34.65-2.32.65-2.95h1.06ZM888.35,120.36v3.54h-36.95v-3.54h36.95ZM871.71,68.31l34.94,83.57h-10.03l-27.27-72.36,2.36-11.21ZM893.67,143.97h9.68c1.18,2.68,2.75,4.58,4.72,5.72,1.97,1.14,3.85,1.71,5.67,1.71h.94v1.18h-26.56v-1.18h1.06c1.49,0,2.83-.65,4.01-1.95s1.34-3.13.47-5.49Z" />
    </g>

    <g className="baulia-diamond-animator">
      <rect className="baulia-diamond-shape" x=".86" y=".86" width="198.64" height="198.64" transform="translate(0 200.36) rotate(-90)" strokeMiterlimit="10" />
    </g>

    <path className="baulia-b" d="M116.87,94.54l6.01-.41c6.47,0,11.27,1.21,14.42,3.62,3.14,2.42,4.72,5.83,4.72,10.25s-2.01,9.59-6.01,15.51c-4.01,5.92-9.2,11.3-15.58,16.13h7.79c3.19,0,5.42-.14,6.7-.41,1.27-.27,2-.41,2.19-.41,1.27,0,1.91.68,1.91,2.05s-.91,2.1-2.73,2.19c-7.02,0-13.76-.09-20.23-.27-10.2,6.47-20.23,9.7-30.07,9.7-4.65,0-8.34-.87-11.07-2.6s-4.1-3.48-4.1-5.26.75-3.16,2.25-4.17c1.5-1,3.62-1.5,6.36-1.5,10.66,0,22.59.23,35.81.68,5.47-4.46,9.84-9.64,13.12-15.51,3.28-5.88,4.92-11.18,4.92-15.92,0-7.56-4.06-11.34-12.16-11.34-3.19,0-6.49.5-9.91,1.5-3.42,1-5.47,1.71-6.15,2.12s-1.12.61-1.3.61c-.55,0-.82-.39-.82-1.16s1.18-1.71,3.55-2.8c10.39-5.01,20.54-11.68,30.48-20.02,9.93-8.34,14.9-14.28,14.9-17.83,0-1.64-1.28-2.46-3.83-2.46-10.39.09-24.65,7.88-42.78,23.37-3.65,9.38-9.64,20.91-17.97,34.58-8.34,13.67-17.06,25.9-26.17,36.69-9.11,10.8-15.9,16.19-20.36,16.19-2.73,0-4.1-1.41-4.1-4.24,0-6.47,6.13-17.99,18.38-34.58,12.25-16.58,26.12-31.84,41.61-45.78,2.73-6.65,4.1-11.5,4.1-14.56s-.73-5.47-2.19-7.24c-1.46-1.78-3.6-3.08-6.42-3.9-4.46-1.18-9.18-1.78-14.14-1.78s-8.77.12-11.41.34c-2.64.23-5.86.68-9.64,1.37-3.78.68-6.86,1.87-9.22,3.55-2.37,1.69-3.55,3.83-3.55,6.42s1.27,4.6,3.83,6.01c2.55,1.41,5.67,2.39,9.36,2.94s7.36,1.14,11,1.78c3.64.64,6.74,1.89,9.29,3.76,2.55,1.87,3.83,4.49,3.83,7.86,0,.91-.2,1.37-.61,1.37s-.73-.14-.96-.41c-.23-.27-.62-.82-1.16-1.64-.82-1.18-2.03-2.1-3.62-2.73-1.59-.64-4.06-1.25-7.38-1.84-3.33-.59-6.47-1.23-9.43-1.91-2.96-.68-5.94-1.57-8.95-2.66-3.01-1.09-5.42-2.64-7.24-4.65-1.82-2-2.73-4.35-2.73-7.04s1.14-5.08,3.42-7.17c2.28-2.1,5.28-3.74,9.02-4.92,7.65-2.28,15.63-3.42,23.92-3.42,21.5,0,32.25,5.65,32.25,16.95,0,1-.23,2.51-.68,4.51,18.4-14.85,33.35-22.28,44.83-22.28,5.1,0,7.65,1.55,7.65,4.65,0,4.46-4.67,10.8-14.01,19-9.34,8.2-18.98,14.58-28.9,19.13ZM44.17,163.69c2.64,0,9.73-8.45,21.25-25.35,11.52-16.9,20.75-32.64,27.68-47.22-13.67,13.03-25.76,26.58-36.29,40.66-10.52,14.08-15.78,23.66-15.78,28.77,0,2.09,1.05,3.14,3.14,3.14ZM111,142.64l-24.74-.55c-7.02,0-10.52,1.05-10.52,3.14,0,1.18,1.18,2.3,3.55,3.35,2.37,1.05,5.1,1.57,8.2,1.57,8.11,0,15.94-2.5,23.51-7.52Z" />
  </svg>
);

// --- COMPONENTES DE ESTRUCTURA ---

const mockGuests = [
  { 
    id: '1a2b', name: 'Familia Pérez Gómez', passes: 4, childrenPasses: 2, status: 'confirmado', entered: 1, phone: '5512345678', tableId: 't1', sent: true, side: 'novia', 
    subGuests: [
      { id: 's1', name: 'Sr. Roberto Pérez', isChild: false, entered: true }, 
      { id: 's2', name: 'Sra. María Gómez', isChild: false, entered: false }, 
      { id: 's3', name: 'Roberto Jr.', isChild: true, entered: false }, 
      { id: 's4', name: 'Ana Pérez', isChild: true, entered: false }
    ] 
  },
  { 
    id: '3c4d', name: 'Carlos Rodríguez', passes: 1, childrenPasses: 0, status: 'ingreso', entered: 1, phone: '5587654321', tableId: 't2', sent: true, side: 'novio', 
    subGuests: [
      { id: 's5', name: 'Carlos Rodríguez', isChild: false, entered: true }
    ] 
  },
  { 
    id: '5e6f', name: 'Ana y Roberto', passes: 2, childrenPasses: 0, status: 'pendiente', entered: 0, phone: '5599887766', tableId: null, sent: false, side: 'general', 
    subGuests: [] // Aún no han registrado los nombres
  }
];

const mockGastos = [
  { id: 1, concepto: 'Salón y Banquete', categoria: 'Lugar', estimado: 80000, pagado: 40000, proveedorId: null, fechaLimite: '2026-10-15', historial: [{id: 1, fecha: '2025-10-01', monto: 40000, metodo: 'Transferencia', cuenta: '0987654321'}] },
  { id: 2, concepto: 'DJ e Iluminación', categoria: 'Música', estimado: 15000, pagado: 5000, proveedorId: 3, fechaLimite: '2024-05-01', historial: [{id: 2, fecha: '2023-10-15', monto: 5000, metodo: 'Efectivo', cuenta: ''}] },
];

const mockProveedores = [
  { id: 1, nombre: 'Florería El Encanto', categoria: 'Decoración', servicio: 'Arreglos Florales', costo: 20000, status: 'Cotizado', contratado: false, gastoId: null, contrato: null, telefono: '5511223344', email: 'flores@encanto.com', notas: 'Las flores son súper frescas.', banco: 'BBVA', clabe: '012345678901234567', titular: 'Ana Flores', rating: 0, galeria: 2 },
  { id: 2, nombre: 'Banquetes Gourmet', categoria: 'Comida/Bebida', servicio: 'Catering 100 pax', costo: 85000, status: 'Descartado', contratado: false, gastoId: null, contrato: null, telefono: '5599887766', email: 'ventas@gourmet.com', notas: 'Muy caros y no incluyen mantelería.', banco: '', clabe: '', titular: '', rating: 2, galeria: 0 },
  { id: 3, nombre: 'DJ Party Mix', categoria: 'Música', servicio: 'Audio e Iluminación', costo: 15000, status: 'Contratado', contratado: true, gastoId: 2, contrato: 'contrato_dj.pdf', telefono: '5522334455', email: 'dj@partymix.com', notas: 'Llegarán 3 horas antes a montar.', banco: 'Santander', clabe: '014987654321098765', titular: 'Carlos Mix', rating: 5, galeria: 1 },
];

const mockTareas = [
  { id: 1, titulo: 'Definir lista de invitados inicial', categoria: 'Logística', fechaLimite: '2025-01-15', estado: 'listo' },
  { id: 2, titulo: 'Prueba de menú y coctelería', categoria: 'Comida/Bebida', fechaLimite: '2026-05-15', estado: 'proceso' },
  { id: 3, titulo: 'Enviar invitaciones digitales', categoria: 'Comunicación', fechaLimite: '2026-08-01', estado: 'pendiente' },
  { id: 4, titulo: 'Trámite de permisos del salón', categoria: 'Trámites', fechaLimite: '2024-02-10', estado: 'pendiente' }, // Tarea vencida de prueba
];

const mockTiming = [
  { id: 1, hora: '14:00', actividad: 'Recepción y Coctel de Bienvenida', responsable: 'Hostess / Catering', lugar: 'Terraza Sur', notas: 'Ofrecer margaritas y canapés fríos.' },
  { id: 2, hora: '15:30', actividad: 'Entrada Estelar', responsable: 'DJ Party Mix', lugar: 'Salón Principal', notas: 'Canción: Viva la Vida (Coldplay). Luces al 100%.' },
  { id: 3, hora: '16:00', actividad: 'Inicio del Banquete (1er Tiempo)', responsable: 'Capitán de Meseros', lugar: 'Salón Principal', notas: 'Servir Crema de Cilantro rápidamente.' },
  { id: 4, hora: '18:00', actividad: 'Apertura de Pista / Baile', responsable: 'Novios / DJ', lugar: 'Pista de Baile', notas: 'Chisperos encendidos al centro de la pista.' },
];

// --- BASE DE DATOS GLOBAL Y UTILIDADES ---
const mockGlobalProviders = [
  { 
    id: 'prov_1', nombre: 'Florería El Encanto', facebook: '[https://facebook.com/elencantoflores](https://facebook.com/elencantoflores)',
    categoria: 'Decoración', servicio: 'Arreglos Florales y Centros de Mesa', costoPromedio: 20000, 
    lat: 19.4326, lng: -99.1332, ratingPromedio: 4.8, telefono: '5511223344'
  },
  { 
    id: 'prov_2', nombre: 'Banquetes Gourmet MTY', facebook: '[https://facebook.com/banquetesgourmetmty](https://facebook.com/banquetesgourmetmty)',
    categoria: 'Comida/Bebida', servicio: 'Catering Premium 3 Tiempos', costoPromedio: 85000, 
    lat: 25.6866, lng: -100.3161, ratingPromedio: 5.0, telefono: '8112345678'
  },
  { 
    id: 'prov_3', nombre: 'DJ Party Mix', facebook: '[https://facebook.com/djpartymixoficial](https://facebook.com/djpartymixoficial)',
    categoria: 'Música', servicio: 'Audio, Iluminación y Chisperos', costoPromedio: 15000, 
    lat: 19.0414, lng: -98.2063, ratingPromedio: 3.5, telefono: '2221234567'
  }
];

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ==========================================
// --- COMPONENTE: MENÚ LATERAL (SIDEBAR BAULIA) ---
// ==========================================
const Sidebar = ({ isOpen, setIsOpen, activeTab, setActiveTab, userRole, userPlan, agencyConfig }) => {
  const planLevels = { 'oro': 1, 'diamante': 2 };
  const level = planLevels[userPlan] || 2; 

  const menuGroups = [
    { title: 'Planeación y Finanzas', items: [ { id: 'dashboard', icon: LayoutDashboard, label: 'Resumen', minLevel: 1 }, { id: 'tareas', icon: CheckSquare, label: 'Checklist', minLevel: 1 }, { id: 'presupuesto', icon: Wallet, label: 'Presupuesto', minLevel: 1 }, { id: 'proveedores', icon: Store, label: 'Proveedores', minLevel: 1 } ] },
    { title: 'Gestión de Asistentes', items: [ { id: 'invitacion', icon: Smartphone, label: 'Ver Invitación App', minLevel: 1 }, { id: 'invitados', icon: Users, label: 'Lista de Invitados', minLevel: 1 }, { id: 'mesas', icon: LayoutGrid, label: 'Gestión de Mesas', minLevel: 2 } ] },
    { title: 'Diseño Espacial', items: [ { id: 'decoracion', icon: Palette, label: 'Visualizador Decor.', minLevel: 2 }, { id: 'mapa', icon: MapIcon, label: 'Croquis del Salón', minLevel: 2 } ] },
    { title: 'El Día del Evento', items: [ { id: 'timing', icon: Clock, label: 'El Minuto a Minuto', minLevel: 1 }, { id: 'escaner', icon: Scan, label: 'Control Puerta (QR)', minLevel: 2 }, { id: 'galeria', icon: ImageIcon, label: 'Muro Social (Vivo)', minLevel: 2 } ] }
  ];

  const themeColors = {
    indigo: 'bg-indigo-600 text-white shadow-indigo-900/20', rose: 'bg-rose-600 text-white shadow-rose-900/20', emerald: 'bg-emerald-600 text-white shadow-emerald-900/20', slate: 'bg-slate-800 text-white shadow-slate-900/20', amber: 'bg-amber-500 text-slate-900 shadow-amber-900/20', sky: 'bg-sky-500 text-white shadow-sky-900/20'
  };

  // 🔴 DEFAULT A BAULIA SI NO HAY MARCA BLANCA
  const activeTheme = agencyConfig?.themeColor ? themeColors[agencyConfig.themeColor] : themeColors.amber;
  const agencyName = agencyConfig?.name || 'BAULIA';

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-20 xl:hidden" onClick={() => setIsOpen(false)} />}
      <aside className={`fixed xl:static inset-y-0 left-0 z-30 w-72 bg-slate-950 text-slate-400 transition-transform duration-300 ease-in-out flex flex-col border-r border-slate-900 shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'}`}>
        
        <div className="flex items-center justify-between p-6 border-b border-slate-900 shrink-0 min-h-[88px] relative overflow-hidden bg-slate-950">
          <div className="relative z-10 w-full flex items-center gap-3">
            {agencyConfig?.logoUrl && userRole !== 'superadmin' ? (
              <img src={agencyConfig.logoUrl} alt="Agency Logo" className="h-10 object-contain drop-shadow-md mb-1" />
            ) : (
              <div className="flex flex-col justify-center">
                 {userRole === 'superadmin' || agencyName === 'BAULIA' || agencyName === 'EVENT MASTER' ? (
                   <BauliaLogo className="h-8 w-auto mb-1" forceWhite={true} />
                 ) : (
                   <h1 className="text-xl font-black text-white tracking-widest uppercase">{agencyName}</h1>
                 )}
                 <p className="text-[8px] text-amber-500 uppercase tracking-widest mt-0.5">
                   {userRole === 'superadmin' ? 'God Mode' : userRole === 'planner' ? 'Planner Workspace' : 'Panel Premium'}
                 </p>
              </div>
            )}
          </div>
          <button onClick={() => setIsOpen(false)} className="xl:hidden p-2 hover:bg-slate-800 rounded-lg relative z-10"><X size={20} /></button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-6 custom-scrollbar">
          {userRole === 'superadmin' && (
             <div className="space-y-1">
               <p className="text-[10px] text-slate-600 uppercase tracking-widest font-black ml-4 mb-3">SISTEMA</p>
               <button onClick={() => { setActiveTab('licencias'); setIsOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'licencias' ? 'bg-amber-500 text-slate-900 font-black shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'hover:bg-slate-900 hover:text-white'}`}>
                 <Building size={18} /><span>Centro de Licencias</span>
               </button>
             </div>
          )}

          {menuGroups.map((group, gIdx) => {
            const visibleItems = group.items.filter(item => level >= item.minLevel);
            if (visibleItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-1">
                <p className="text-[10px] text-slate-600 uppercase tracking-widest font-black ml-4 mb-3">{group.title}</p>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button key={item.id} onClick={() => { setActiveTab(item.id); setIsOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${isActive ? item.id === 'escaner' ? 'bg-emerald-500 text-slate-900 font-black shadow-lg shadow-emerald-900/20' : `${activeTheme} font-bold` : 'hover:bg-slate-900 hover:text-white'}`}>
                      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                      <span className="text-sm tracking-wide">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {userRole === 'planner' && (
          <div className="p-4 border-t border-slate-900 shrink-0 bg-slate-950">
            <button onClick={() => { setActiveTab('configuracion'); setIsOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all border ${activeTab === 'configuracion' ? 'bg-slate-800 text-amber-400 border-amber-500/50 shadow-lg' : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'}`}>
              <Settings2 size={18} strokeWidth={activeTab === 'configuracion' ? 2.5 : 2} />
              <span className="font-bold text-sm tracking-wide">Marca Blanca</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

// --- VISTAS ESPECÍFICAS ---

const DashboardView = ({ guests, tables, gastos, presupuestoTotal, tareas, setActiveTab, addNotification }) => {
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);

  const totalPasses = guests.reduce((sum, guest) => sum + guest.passes, 0);
  const confirmedPasses = guests.filter(g => g.status === 'confirmado' || g.status === 'ingreso').reduce((sum, guest) => sum + guest.passes, 0);
  const confirmationPercentage = totalPasses > 0 ? Math.round((confirmedPasses / totalPasses) * 100) : 0;

  const totalMesas = tables ? tables.length : 0;
  const capacidadTotalSillas = tables ? tables.reduce((sum, t) => sum + (t.capacity || 10), 0) : 0;
  const pasesAcomodados = guests.filter(g => g.tableId).reduce((sum, g) => sum + g.passes, 0);
  const ocupacionPorcentaje = capacidadTotalSillas > 0 ? Math.round((pasesAcomodados / capacidadTotalSillas) * 100) : 0;

  const totalEstimado = gastos ? gastos.reduce((sum, g) => sum + g.estimado, 0) : 0;
  const totalPagado = gastos ? gastos.reduce((sum, g) => sum + g.pagado, 0) : 0;
  const budgetPercentage = presupuestoTotal > 0 ? Math.round((totalEstimado / presupuestoTotal) * 100) : 0;

  const tareasCompletadas = tareas ? tareas.filter(t => t.estado === 'listo').length : 0;
  const tareasTotal = tareas ? tareas.length : 0;
  const tareasPorcentaje = tareasTotal > 0 ? Math.round((tareasCompletadas / tareasTotal) * 100) : 0;

  const tareasPendientes = tareas ? tareas.filter(t => t.estado !== 'listo').sort((a, b) => new Date(a.fechaLimite || '2099-01-01') - new Date(b.fechaLimite || '2099-01-01')).slice(0, 4) : [];
  const pagosPendientes = gastos ? gastos.filter(g => (g.estimado - g.pagado) > 0).sort((a, b) => new Date(a.fechaLimite || '2099-01-01') - new Date(b.fechaLimite || '2099-01-01')).slice(0, 3) : [];

  const formatMoney = (amount) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);
  const isOverdue = (dateStr) => { if(!dateStr) return false; return new Date(dateStr) < new Date(); };

  // 🔴 DESCARGA DIRECTA DE PDF
  const triggerDashboardPdf = async () => {
    setIsPreparingPrint(true);
    setTimeout(async () => {
      try {
        const { jsPDF } = await import('jspdf');
        const html2canvas = (await import('html2canvas')).default;
        
        const element = document.getElementById('dashboard-export-area');
        const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#f8fafc' });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        const pdf = new jsPDF('p', 'mm', 'letter');
        const pdfWidth = 215.9;
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('Resumen-Dashboard.pdf');
        if(addNotification) addNotification('¡PDF Guardado!', 'Revisa tu carpeta de descargas.', 'success');
      } catch (error) {
        console.error(error);
        if(addNotification) addNotification('Error', 'Fallo al generar el PDF.', 'error');
      }
      setIsPreparingPrint(false);
    }, 500);
  };

  return (
    <div className="space-y-6" id="dashboard-export-area">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Panel General</h2>
          <p className="text-slate-500 text-sm mt-1">Resumen en tiempo real y alertas de tu evento.</p>
        </div>
        <button onClick={triggerDashboardPdf} disabled={isPreparingPrint} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm flex items-center disabled:bg-slate-500">
          {isPreparingPrint ? <RefreshCw size={16} className="mr-2 animate-spin"/> : <Download size={16} className="mr-2"/>} 
          {isPreparingPrint ? 'Preparando...' : 'Descargar PDF'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Pases Asignados</p>
              <h3 className="text-3xl font-black text-slate-800 mt-1">{totalPasses}</h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform"><Users size={24} /></div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded mr-2">{confirmationPercentage}% Confirmado</span>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Mesas Creadas</p>
              <h3 className="text-3xl font-black text-slate-800 mt-1">{totalMesas}</h3>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform"><Layers size={24} /></div>
          </div>
          <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5">
            <div className="bg-purple-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${ocupacionPorcentaje}%` }}></div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-bold">
            <span className="text-purple-600">{capacidadTotalSillas} Sillas totales</span> • {ocupacionPorcentaje}% ocupadas
          </p>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Costo Estimado</p>
              <h3 className="text-3xl font-black text-slate-800 mt-1">${(totalEstimado / 1000).toFixed(0)}k</h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform"><Wallet size={24} /></div>
          </div>
          <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full ${budgetPercentage > 100 ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(budgetPercentage, 100)}%` }}></div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-bold flex justify-between">
            <span>Pagado: ${(totalPagado/1000).toFixed(1)}k</span>
            <span className={budgetPercentage > 100 ? 'text-rose-500' : ''}>{budgetPercentage}% del Ppto.</span>
          </p>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Avance Evento</p>
              <h3 className="text-3xl font-black text-slate-800 mt-1">{tareasPorcentaje}%</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform"><CheckSquare size={24} /></div>
          </div>
          <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${tareasPorcentaje}%` }}></div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-bold">
            <span className="text-emerald-600">{tareasCompletadas} Tareas listas</span> de {tareasTotal}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center"><ListTodo size={18} className="mr-2 text-indigo-500"/> Tareas Próximas</h3>
            {setActiveTab && <button onClick={() => setActiveTab('checklist')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors print:hidden">Ver todas</button>}
          </div>
          <div className="p-5 flex-1">
            {tareasPendientes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-6">
                <CheckCircle size={40} className="mb-3 text-emerald-200"/>
                <p className="text-sm font-medium">¡Al día! No hay tareas pendientes.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tareasPendientes.map(tarea => {
                  const vencida = isOverdue(tarea.fechaLimite);
                  return (
                    <div key={tarea.id} className="flex items-start gap-3">
                      <div className={`mt-0.5 w-2 h-2 rounded-full ${vencida ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'}`}></div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${vencida ? 'text-rose-700' : 'text-slate-700'}`}>{tarea.titulo}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{tarea.categoria}</span>
                          {tarea.fechaLimite && <span className={`text-[10px] font-semibold ${vencida ? 'text-rose-500' : 'text-slate-400'}`}><Calendar size={10} className="inline mr-0.5"/> {tarea.fechaLimite}</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center"><AlertTriangle size={18} className="mr-2 text-rose-500"/> Pagos Pendientes</h3>
            {setActiveTab && <button onClick={() => setActiveTab('presupuesto')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors print:hidden">Ir a Finanzas</button>}
          </div>
          <div className="p-5 flex-1">
            {pagosPendientes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-6">
                <CheckCircle size={40} className="mb-3 text-emerald-200"/>
                <p className="text-sm font-medium">Finanzas sanas. No hay deudas próximas.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pagosPendientes.map(pago => {
                  const deuda = pago.estimado - pago.pagado;
                  const vencido = isOverdue(pago.fechaLimite);
                  return (
                    <div key={pago.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="min-w-0 flex-1 mr-3">
                        <p className="text-sm font-bold text-slate-800 truncate">{pago.concepto}</p>
                        <p className={`text-[10px] font-bold mt-0.5 flex items-center ${vencido ? 'text-rose-500' : 'text-slate-500'}`}>
                          <Clock size={10} className="mr-1"/> {pago.fechaLimite ? `Límite: ${pago.fechaLimite}` : 'Sin fecha límite'}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-slate-500 mb-0.5">Falta pagar</p>
                        <p className={`text-sm font-black ${vencido ? 'text-rose-600' : 'text-amber-600'}`}>{formatMoney(deuda)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// --- COMPONENTE: RECEPCIÓN Y ESCÁNER (CÁMARA CUADRADA 100%) ---
// ==========================================
const EscanerView = ({ guests, setGuests, tables, isSharedMode, exitSharedMode, simulateSharedMode, addNotification }) => {
  const [forceMobile, setForceMobile] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  
  const [isListOpen, setIsListOpen] = useState(false);
  const [listSearchTerm, setListSearchTerm] = useState('');
  const [listTab, setListTab] = useState('todos'); 
  
  const [showShareModal, setShowShareModal] = useState(false);
  const [staffPhone, setStaffPhone] = useState('');
  const [camError, setCamError] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const [cardData, setCardData] = useState({ 
    status: 'idle', 
    title: 'Esperando código...', 
    subtitle: 'Apunta la cámara a la pulsera del invitado.' 
  });

  const scannerRef = useRef(null);
  const lastScannedCode = useRef(null);
  
  const guestsRef = useRef(guests || []);
  useEffect(() => { guestsRef.current = guests || []; }, [guests]);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showDesktopPlaceholder = isDesktop && !forceMobile && !isSharedMode;

  useEffect(() => {
    if (showDesktopPlaceholder) return;

    let html5QrCode;
    const initScanner = () => {
      if (!window.Html5Qrcode) {
        setTimeout(initScanner, 500); 
        return;
      }
      try {
        html5QrCode = new window.Html5Qrcode("qr-reader-puerta");
        scannerRef.current = html5QrCode;
        
        html5QrCode.start(
          { facingMode: "environment" }, 
          { 
             fps: 15, 
             aspectRatio: 1.0, // 🔴 FUERZA LA PROPORCIÓN CUADRADA
             qrbox: function(width, height) {
                // 🔴 HACE QUE EL ÁREA DE ESCANEO SEA EL 95% DE LA PANTALLA, IMPOSIBLE FALLAR
                return { width: width * 0.95, height: height * 0.95 };
             }
          },
          (decodedText) => {
             let code = decodedText;
             try {
                const parsedUrl = new URL(decodedText);
                code = parsedUrl.searchParams.get('u') || parsedUrl.searchParams.get('usr') || parsedUrl.searchParams.get('uid') || parsedUrl.searchParams.get('invitado') || code;
             } catch(e) {}
             
             if (lastScannedCode.current === code) return;
             lastScannedCode.current = code;
             setTimeout(() => { lastScannedCode.current = null; }, 3000);

             if (code && code !== 'null') processEntry(code);
          },
          (errorMessage) => {}
        ).catch(err => {
           setCamError("Permite el uso de la cámara en tu navegador para continuar.");
        });
      } catch(e) { console.error(e); }
    };

    initScanner();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(e=>e);
      }
    };
  }, [showDesktopPlaceholder]);

  const processEntry = async (code) => {
    const codeLower = code.trim().toLowerCase();
    let foundParentId = null;
    let targetSubId = null;

    if (codeLower.startsWith('usr_')) {
       const parts = codeLower.split('_');
       if (parts.length >= 3) foundParentId = parts[1];
       targetSubId = codeLower;
    } else {
       foundParentId = codeLower;
    }

    if (!foundParentId) {
      setCardData({ status: 'error', title: 'Código Inválido', subtitle: 'Este pase no pertenece al evento.' });
      return;
    }

    try {
      const docRef = doc(db, "eventos", ID_DEL_EVENTO, "invitados", foundParentId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
         setCardData({ status: 'error', title: 'No Encontrado', subtitle: 'La familia no está en la base de datos.' });
         return;
      }
      
      const freshParent = { id: docSnap.id, ...docSnap.data() };

      if (freshParent.status === 'cancelado') {
         setCardData({ status: 'error', title: 'Acceso Denegado', subtitle: `La invitación de ${freshParent.name} fue cancelada.` });
         return;
      }

      let targetSub = targetSubId ? (freshParent.subGuests || []).find(sg => sg.id === targetSubId) : null;
      if (!targetSub) {
         targetSub = (freshParent.subGuests || []).find(sg => !sg.entered);
         if (!targetSub) { 
           setCardData({ status: 'warning', title: 'Pases Agotados', subtitle: `Toda la familia ${freshParent.name} ya ingresó.` });
           return; 
         }
      }

      // 🔴 REGLA APLICADA: Saca el nombre de la mesa siempre, sin importar el estado
      const tableName = tables.find(t => String(t.id) === String(freshParent.tableId))?.name || 'Sin Mesa Asignada';

      // 🔴 REGLA APLICADA: Si ya entró, tarjeta amarilla pero CON SU NOMBRE Y MESA
      if (targetSub.entered) { 
        setCardData({ status: 'warning', title: targetSub.name, subtitle: `Mesa: ${tableName}` });
        return; 
      }

      const newSubs = (freshParent.subGuests || []).map(sg => sg.id === targetSub.id ? { ...sg, entered: true } : sg);
      const enteredCount = newSubs.filter(sg => sg.entered).length;
      
      let newStatus = freshParent.status;
      if (enteredCount > 0 && newStatus !== 'ingreso') newStatus = 'ingreso';

      // Acceso Nuevo y Exitoso
      setCardData({ status: 'success', title: targetSub.name, subtitle: `Mesa: ${tableName}` });
      await setDoc(docRef, { ...freshParent, subGuests: newSubs, entered: enteredCount, status: newStatus });
      
    } catch(e) {
      setCardData({ status: 'error', title: 'Error de Red', subtitle: 'Revisa tu conexión a internet.' });
    }
  };

  const handleManualEntryFromList = async (parentGuest, subGuest) => {
    if (subGuest.entered) return;
    try {
      const docRef = doc(db, "eventos", ID_DEL_EVENTO, "invitados", parentGuest.id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return;
      const freshParent = { id: docSnap.id, ...docSnap.data() };
      
      const newSubs = (freshParent.subGuests || []).map(sg => sg.id === subGuest.id ? { ...sg, entered: true } : sg);
      const newEntered = newSubs.filter(sg => sg.entered).length;
      let newStatus = freshParent.status;
      if (newEntered > 0 && newStatus !== 'ingreso') newStatus = 'ingreso';
      await setDoc(docRef, { ...freshParent, subGuests: newSubs, entered: newEntered, status: newStatus });
    } catch(e){}
  };

  // 🔴 CORRECCIÓN: URL DEL PANEL BAULIA
  const getCleanBaseUrl = () => window.location.hostname.includes('localhost') ? window.location.origin : 'https://panel.baulia.com';

  const copyStaffLink = () => {
    const url = `${getCleanBaseUrl()}/?modo=puerta&e=${ID_DEL_EVENTO}`;
    navigator.clipboard.writeText(url).then(() => {
      if (addNotification) addNotification('¡Copiado!', 'Enlace de Recepción copiado.', 'success');
    }).catch(() => {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      try { 
         document.execCommand('copy'); 
         if (addNotification) addNotification('¡Copiado!', 'Enlace de Recepción copiado.', 'success');
      } catch (err) {}
      document.body.removeChild(textArea);
    });
  };

  const shareStaffLinkWhatsApp = () => {
    const url = `${getCleanBaseUrl()}/?modo=puerta&e=${ID_DEL_EVENTO}`;
    const msg = `📱 *Recepción EventMaster*\n\nAccede al escáner de puerta aquí:\n${url}`;
    window.open(`https://wa.me/${staffPhone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const flattenedGuests = [];
  (guests || []).forEach(g => {
    if (g.status === 'cancelado') return;
    if (g.subGuests && g.subGuests.length > 0) {
        g.subGuests.forEach(sg => flattenedGuests.push({ parent: g, sub: sg, searchStr: `${sg.name || ''} ${g.name || ''}`.toLowerCase(), entered: sg.entered }));
    }
  });
  
  const filteredList = flattenedGuests.filter(item => {
    const matchesSearch = (item.searchStr || '').includes((listSearchTerm || '').toLowerCase());
    if (listTab === 'adentro') return matchesSearch && item.entered;
    if (listTab === 'faltan') return matchesSearch && !item.entered;
    return matchesSearch;
  });

  if (showDesktopPlaceholder) {
     return (
        <div className="h-full flex flex-col items-center justify-center p-6 animate-in fade-in">
           <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-xl max-w-lg w-full text-center border border-slate-200 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-3 bg-emerald-500"></div>
              <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-emerald-100">
                 <Smartphone size={48} />
              </div>
              <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">Escáner Móvil</h2>
              <p className="text-slate-500 mb-8 text-sm leading-relaxed">
                 Esta herramienta está diseñada para usarse en la puerta del evento usando la cámara de un celular o tablet.
              </p>
              
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-left mb-6 shadow-inner">
                 <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-3 flex items-center"><ShieldCheck size={16} className="mr-2 text-emerald-500"/> Enviar acceso al Staff</label>
                 <div className="flex gap-2 mb-3">
                    <input type="tel" placeholder="WhatsApp (10 dígitos)..." value={staffPhone} onChange={e=>setStaffPhone(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl font-bold outline-none focus:border-emerald-500 bg-white shadow-sm" />
                    <button onClick={shareStaffLinkWhatsApp} className="px-5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 shadow-md transition-colors active:scale-95"><Send size={18}/></button>
                 </div>
                 <button onClick={copyStaffLink} className="w-full py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center justify-center shadow-sm active:scale-95">
                    <Link size={18} className="mr-2"/> Copiar enlace manual
                 </button>
              </div>
              
              <button onClick={() => setForceMobile(true)} className="text-[10px] font-bold text-slate-400 hover:text-emerald-600 underline">Forzar vista de escáner aquí en la computadora</button>
           </div>
        </div>
     );
  }

  return (
    <div className={`h-full flex flex-col space-y-4 pb-6 ${isSharedMode ? 'max-w-lg mx-auto' : 'max-w-4xl'}`}>
      
      {isOffline && (
        <div className="bg-amber-500 text-white p-3 rounded-2xl shadow-lg flex items-center justify-center font-bold text-sm animate-in slide-in-from-top-4">
          <WifiOff size={18} className="mr-2 animate-pulse" /> 
          Modo Offline. Guardando accesos localmente.
        </div>
      )}

      <div className="flex justify-between items-center gap-4 px-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{isSharedMode ? 'Recepción VIP' : 'Control de Accesos'}</h2>
          <p className="text-slate-500 text-sm mt-1">Escaneo continuo automático.</p>
        </div>
        {!isSharedMode && (
          <button onClick={() => setShowShareModal(true)} className="p-3 bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200 transition-colors shadow-sm" title="Compartir a Staff">
            <Link size={20} /> 
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4 flex-1">
        
        {/* 🔴 INYECCIÓN CSS PARA FORZAR EL VIDEO CUADRADO AL 100% */}
        <style>{`
          #qr-reader-puerta { width: 100% !important; height: 100% !important; border: none !important; position: absolute !important; inset: 0 !important; }
          #qr-reader-puerta video { object-fit: cover !important; width: 100% !important; height: 100% !important; border-radius: 1.5rem !important; }
          #qr-reader-puerta canvas { display: none !important; }
        `}</style>

        {/* 🔴 ESCÁNER CUADRADO PERFECTO */}
        <div className="w-full max-w-[350px] mx-auto bg-slate-900 rounded-3xl overflow-hidden relative shadow-2xl flex-shrink-0 aspect-square">
          {camError ? (
            <button onClick={() => window.location.reload()} className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-800 p-6 text-center z-50">
              <Camera size={48} className="text-rose-500 mb-4"/>
              <span className="font-bold text-lg mb-2">Permiso de cámara requerido</span>
              <span className="text-sm text-slate-400">{camError}</span>
            </button>
          ) : (
            <>
               <div id="qr-reader-puerta"></div>
               {/* Marcos y Laser */}
               <div className="absolute inset-0 border-[30px] border-black/40 pointer-events-none z-10"></div>
               <div className="absolute inset-0 border-2 border-emerald-400 m-[30px] pointer-events-none z-10 opacity-70">
                 <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_15px_#34d399] absolute top-1/2 -translate-y-1/2 opacity-60 animate-pulse"></div>
               </div>
            </>
          )}
        </div>

        {/* 🔴 FICHA INTELIGENTE */}
        <div className={`w-full p-6 rounded-3xl shadow-lg border-2 transition-all flex flex-col justify-center min-h-[140px] flex-shrink-0 relative overflow-hidden
            ${cardData.status === 'idle' ? 'bg-white border-slate-200' : ''}
            ${cardData.status === 'success' ? 'bg-emerald-50 border-emerald-400 shadow-emerald-500/20 scale-[1.02]' : ''}
            ${cardData.status === 'warning' ? 'bg-amber-50 border-amber-400 shadow-amber-500/20 scale-[1.02]' : ''}
            ${cardData.status === 'error' ? 'bg-rose-50 border-rose-400 shadow-rose-500/20' : ''}
        `}>
           <div className="relative z-10 text-center">
              <p className={`text-xs font-black uppercase tracking-widest mb-1
                ${cardData.status === 'idle' ? 'text-slate-400' : ''}
                ${cardData.status === 'success' ? 'text-emerald-600' : ''}
                ${cardData.status === 'warning' ? 'text-amber-600' : ''}
                ${cardData.status === 'error' ? 'text-rose-600' : ''}
              `}>
                 {cardData.status === 'idle' ? 'ESTADO: LISTO' : cardData.status === 'success' ? 'ACCESO APROBADO' : cardData.status === 'warning' ? '¡YA INGRESÓ!' : 'ERROR'}
              </p>
              <h3 className={`text-2xl sm:text-3xl font-black leading-tight mb-2 ${cardData.status === 'idle' ? 'text-slate-700' : 'text-slate-900'}`}>
                {cardData.title}
              </h3>
              <p className={`text-lg font-bold ${cardData.status === 'success' ? 'text-emerald-700' : cardData.status === 'warning' ? 'text-amber-700' : 'text-slate-500'}`}>
                {cardData.subtitle}
              </p>
           </div>
           
           {/* Iconos de fondo */}
           {cardData.status === 'success' && <CheckCircle size={100} className="absolute -right-4 -bottom-4 text-emerald-500/10 pointer-events-none"/>}
           {cardData.status === 'warning' && <AlertTriangle size={100} className="absolute -right-4 -bottom-4 text-amber-500/10 pointer-events-none"/>}
           {cardData.status === 'error' && <X size={100} className="absolute -right-4 -bottom-4 text-rose-500/10 pointer-events-none"/>}
        </div>

        <button onClick={() => setIsListOpen(true)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold shadow-lg hover:bg-slate-800 transition-colors flex items-center justify-center text-lg flex-shrink-0 mt-2">
          <Users size={22} className="mr-3 text-emerald-400" /> Abrir Directorio Manual
        </button>
      </div>

      {/* MODAL DIRECTORIO MANUAL */}
      {isListOpen && (
         <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex flex-col justify-end sm:justify-center sm:p-6 animate-in fade-in duration-200">
             <div className="bg-white w-full sm:max-w-2xl mx-auto sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col h-[90vh] sm:h-[80vh] overflow-hidden">
                <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                   <div>
                     <h3 className="text-xl font-bold text-slate-800 flex items-center"><Users size={20} className="mr-2 text-emerald-600" /> Ingreso Manual</h3>
                     <p className="text-xs text-slate-500">Busca por nombre si no traen pulsera.</p>
                   </div>
                   <button onClick={() => setIsListOpen(false)} className="p-2 bg-slate-200 rounded-full hover:bg-slate-300 text-slate-600 transition-colors"><X size={20}/></button>
                </div>
                
                <div className="bg-white border-b border-slate-100 shadow-sm z-10 shrink-0">
                   <div className="flex p-2 gap-2 bg-slate-100">
                      <button onClick={()=>setListTab('todos')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${listTab==='todos' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Todos</button>
                      <button onClick={()=>setListTab('adentro')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${listTab==='adentro' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>Adentro</button>
                      <button onClick={()=>setListTab('faltan')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${listTab==='faltan' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}>Faltan</button>
                   </div>
                   <div className="relative p-4">
                     <SearchIcon className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                     <input type="text" autoFocus placeholder="Buscar por nombre o familia..." value={listSearchTerm} onChange={(e) => setListSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all font-bold text-lg" />
                   </div>
                </div>
                
                <div className="overflow-y-auto flex-1 p-4 bg-slate-50 custom-scrollbar space-y-3">
                   {filteredList.map(item => {
                      const { parent, sub } = item;
                      const mesaName = tables.find(t => String(t.id) === String(parent.tableId))?.name || 'Sin Mesa Asignada';
                      
                      return (
                        <div key={sub.id} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white border rounded-2xl transition-all shadow-sm ${sub.entered ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200'}`}>
                           <div className="mb-3 sm:mb-0 w-full sm:w-auto">
                              <p className={`font-bold text-lg leading-tight ${sub.entered ? 'text-slate-500' : 'text-slate-800'}`}>{sub.name}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                 <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 px-2 py-1 rounded">{parent.name}</span>
                                 <span className="text-[11px] font-bold text-slate-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">Mesa: {mesaName}</span>
                              </div>
                           </div>
                           
                           <div className="w-full sm:w-auto text-right">
                             {sub.entered ? (
                                <div className="px-5 py-3 rounded-xl text-sm font-black bg-emerald-100 text-emerald-700 flex items-center justify-center sm:justify-start"><CheckCircle size={18} className="mr-2"/> Ya Ingresó</div>
                             ) : (
                                <button onClick={() => handleManualEntryFromList(parent, sub)} className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-md transition-transform active:scale-95 flex items-center justify-center">
                                  Dar Acceso <ArrowRight size={16} className="ml-2" />
                                </button>
                             )}
                           </div>
                        </div>
                      )
                   })}
                   {filteredList.length === 0 && <div className="text-center p-12 text-slate-400 font-bold text-lg border-2 border-dashed border-slate-200 rounded-2xl">No se encontraron invitados.</div>}
                </div>
             </div>
         </div>
      )}

      {showShareModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden p-6 text-center shadow-2xl animate-in zoom-in-95">
            <button onClick={() => setShowShareModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-rose-500"><X size={20}/></button>
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4"><ShieldCheck size={32}/></div>
            <h3 className="font-black text-xl text-slate-800 mb-2">Acceso de Staff</h3>
            <p className="text-sm text-slate-500 mb-6">Envía este link a las personas encargadas de la entrada del evento.</p>
            <div className="flex gap-2 mb-4">
              <input type="tel" placeholder="Número WhatsApp..." value={staffPhone} onChange={e=>setStaffPhone(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl font-bold outline-none focus:border-emerald-500" />
              <button onClick={shareStaffLinkWhatsApp} className="px-5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600"><Send size={18}/></button>
            </div>
            <button onClick={() => { setShowShareModal(false); setForceMobile(true); }} className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors mb-2">Simular en esta pantalla</button>
          </div>
        </div>
      )}

    </div>
  );
};

// ==========================================
// --- COMPONENTE: INVITADOS ---
// ==========================================
const InvitadosView = ({ tables, guests, setGuests, addNotification }) => {
  const [isWeddingMode, setIsWeddingMode] = useState(true); 
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroLado, setFiltroLado] = useState('Todos');

  const [addModal, setAddModal] = useState({ open: false, side: 'general' });
  const [newGuest, setNewGuest] = useState({ name: '', passes: 1, childrenPasses: 0, phone: '', status: 'por_invitar' });
  const [editModal, setEditModal] = useState({ open: false, guest: null });
  const [deleteModal, setDeleteModal] = useState(null);
  
  const [qrModal, setQrModal] = useState(null); 

  const [exportViewOpen, setExportViewOpen] = useState(false);
  const [qrStudioOpen, setQrStudioOpen] = useState(false);
  const [separateLists, setSeparateLists] = useState(true);
  const [exportCols, setExportCols] = useState({ nombre: true, pases: true, estatus: true, telefono: true, mesa: true });

  const [isPreparingListPrint, setIsPreparingListPrint] = useState(false);
  const [isPreparingQRPrint, setIsPreparingQRPrint] = useState(false);

  const safeGuests = guests || [];

  const handleOpenAdd = (side) => {
    setNewGuest({ name: '', passes: 1, childrenPasses: 0, phone: '', status: 'por_invitar' });
    setAddModal({ open: true, side });
  };

  const handleOpenEdit = (guest) => {
    setEditModal({ open: true, guest: { ...guest } });
  };

  const totalPases = safeGuests.reduce((sum, g) => sum + (g.passes || 0), 0);
  const totalNinos = safeGuests.reduce((sum, g) => sum + (g.childrenPasses || 0), 0);
  const totalConfirmados = safeGuests.filter(g => g.status === 'confirmado' || g.status === 'ingreso').reduce((sum, g) => sum + (g.passes || 0), 0);
  const totalPendientes = safeGuests.filter(g => g.status === 'pendiente' || g.status === 'por_invitar').reduce((sum, g) => sum + (g.passes || 0), 0);
  const totalIngresos = safeGuests.reduce((sum, g) => sum + (g.entered || 0), 0); 
  
  const totalCancelados = safeGuests.reduce((sum, g) => {
    const pasesOriginales = g.originalPasses || g.passes || 0;
    const pasesConfirmados = g.subGuests?.length || 0;
    if (g.status === 'cancelado') return sum + pasesOriginales;
    if (g.status === 'confirmado' || g.status === 'ingreso') return sum + Math.max(0, pasesOriginales - pasesConfirmados);
    return sum;
  }, 0);

  const pasesNovia = safeGuests.filter(g => g.side === 'novia').reduce((sum, g) => sum + (g.passes || 0), 0);
  const pasesNovio = safeGuests.filter(g => g.side === 'novio').reduce((sum, g) => sum + (g.passes || 0), 0);

  const invitadosFiltrados = safeGuests.filter(g => {
    const term = searchTerm.toLowerCase();
    const matchesSide = filtroLado === 'Todos' ? true : g.side === filtroLado.toLowerCase();
    if (!term) return matchesSide;

    const name = (g.name || '').toLowerCase();
    const status = (g.status || '').toLowerCase();
    const side = g.side ? g.side.toLowerCase() : ''; 
    const subGuestsNames = g.subGuests ? g.subGuests.map(sg => (sg.name || '').toLowerCase()).join(' ') : '';
    const tableObj = tables?.find(t => String(t.id) === String(g.tableId));
    const tableName = tableObj ? (tableObj.name || '').toLowerCase() : '';

    return (name.includes(term) || status.includes(term) || subGuestsNames.includes(term) || tableName.includes(term) || side.includes(term)) && matchesSide;
  });

  const getFlattenedGuests = (guestList) => {
    const flattened = [];
    guestList.forEach(guest => {
      if (!guest.subGuests || guest.subGuests.length === 0) {
        flattened.push({ _rowId: guest.id, parentGuest: guest, displayName: guest.name, passes: guest.passes, isMain: true, isChild: false, pin: null, entered: false });
      } else {
        guest.subGuests.forEach((sg, idx) => {
          flattened.push({ _rowId: sg.id, parentGuest: guest, displayName: sg.name, passes: guest.passes, isMain: idx === 0, isChild: sg.isChild, pin: sg.id, entered: sg.entered });
        });
        const faltantes = (guest.passes || 0) - guest.subGuests.length;
        if (faltantes > 0 && (guest.status === 'pendiente' || guest.status === 'por_invitar')) {
          flattened.push({ _rowId: `${guest.id}_faltantes`, parentGuest: guest, displayName: `Lugares sin confirmar (${faltantes})`, passes: faltantes, isMain: false, isChild: false, pin: null, isMissing: true, entered: false });
        }
      }
    });
    return flattened;
  };

  const flattenedList = getFlattenedGuests(invitadosFiltrados);

  const handleSendWhatsApp = async (parentGuest) => {
    const nuevoStatus = parentGuest.status === 'por_invitar' ? 'pendiente' : parentGuest.status;
    const updatedGuest = { ...parentGuest, sent: true, status: nuevoStatus };
    await setDoc(doc(db, "eventos", ID_DEL_EVENTO, "invitados", parentGuest.id), updatedGuest);
    
    // 🔴 FORZAR DOMINIO DE INVITACIONES (baulia.com)
    const baseDomain = window.location.hostname.includes('localhost') ? window.location.origin : 'https://baulia.com';
    const linkPersonalizado = `${baseDomain}/${ID_DEL_EVENTO}?u=${parentGuest.id}`;
    
    const msg = `✨ ¡Hola *${parentGuest.name}*! Tenemos el honor de invitarte a nuestro evento.\n\nTu pase es VIP e intransferible. Por favor entra al siguiente enlace para ver los detalles, la ubicación y *Confirmar tu Asistencia* (tienes ${parentGuest.passes} lugares reservados):\n🔗 ${linkPersonalizado}\n\n¡No faltes!`;

    const phone = parentGuest.phone ? parentGuest.phone.replace(/\D/g,'') : '';
    if (phone) window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleSaveGuest = async (e) => {
    e.preventDefault();
    const nuevoId = Date.now().toString();
    const pNum = Number(newGuest.passes) || 1;
    
    const initSubGuests = Array(pNum).fill(null).map((_, i) => ({
      id: `usr_${nuevoId}_${i}`,
      name: i === 0 ? newGuest.name : `Acompañante ${i+1}`,
      isChild: false,
      entered: false
    }));

    const datosInvitado = {
      name: newGuest.name, 
      passes: pNum, 
      childrenPasses: Number(newGuest.childrenPasses) || 0,
      phone: newGuest.phone, 
      status: newGuest.status, 
      side: addModal.side, 
      entered: 0, 
      tableId: null, 
      sent: false, 
      subGuests: initSubGuests,
      extraRequested: 0, 
      originalPasses: pNum
    };
    
    await setDoc(doc(db, "eventos", ID_DEL_EVENTO, "invitados", nuevoId), datosInvitado);
    setAddModal({ open: false, side: 'general' });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const updatedGuest = { ...editModal.guest, extraRequested: 0 };
    await setDoc(doc(db, "eventos", ID_DEL_EVENTO, "invitados", updatedGuest.id), updatedGuest);
    setEditModal({ open: false, guest: null });
  };

  const executeDeleteGuest = async () => {
    if(deleteModal) {
      await deleteDoc(doc(db, "eventos", ID_DEL_EVENTO, "invitados", deleteModal.id));
      setDeleteModal(null);
    }
  };

  const toggleCol = (col) => setExportCols(prev => ({ ...prev, [col]: !prev[col] }));

  const triggerListPdfDownload = async () => {
    setIsPreparingListPrint(true);
    setTimeout(async () => {
      try {
        const { jsPDF } = await import('jspdf');
        const html2canvas = (await import('html2canvas')).default;
        const pages = document.querySelectorAll('.list-pdf-page');
        const pdf = new jsPDF('p', 'mm', 'letter');

        for (let i = 0; i < pages.length; i++) {
           const canvas = await html2canvas(pages[i], { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
           const imgData = canvas.toDataURL('image/jpeg', 0.95);
           if (i > 0) pdf.addPage();
           pdf.addImage(imgData, 'JPEG', 0, 0, 215.9, 279.4);
        }
        pdf.save('Lista-Invitados.pdf');
        if(addNotification) addNotification('¡PDF Guardado!', 'Revisa tu carpeta de descargas.', 'success');
      } catch (error) {
        if(addNotification) addNotification('Error', 'Hubo un fallo al generar el archivo PDF.', 'error');
      }
      setIsPreparingListPrint(false);
      setExportViewOpen(false);
    }, 500);
  };

  // 🔴 MOTOR PDF EXACTO A 25cm x 19cm (Horizontal Landscape)
  const triggerQRPdfDownload = async () => {
    setIsPreparingQRPrint(true);
    setTimeout(async () => {
      try {
        const { jsPDF } = await import('jspdf');
        const html2canvas = (await import('html2canvas')).default;
        const pages = document.querySelectorAll('.qr-pdf-page');
        
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'cm', format: [19, 25] });

        for (let i = 0; i < pages.length; i++) {
           const canvas = await html2canvas(pages[i], { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
           const imgData = canvas.toDataURL('image/jpeg', 1.0);
           if (i > 0) pdf.addPage([19, 25], 'landscape');
           pdf.addImage(imgData, 'JPEG', 0, 0, 25, 19);
        }
        pdf.save('Pulseras-VIP.pdf');
        if(addNotification) addNotification('¡PDF Guardado!', 'Revisa tu carpeta de descargas.', 'success');
      } catch (error) {
        if(addNotification) addNotification('Error', 'Hubo un fallo al generar el archivo PDF.', 'error');
      }
      setIsPreparingQRPrint(false);
      setQrStudioOpen(false);
    }, 500);
  };

  if (exportViewOpen) {
    const allList = getFlattenedGuests(invitadosFiltrados);
    const PAGE_1_LIMIT = 26;
    const PAGE_N_LIMIT = 36;
    
    let filteredChunks = [];
    if (isWeddingMode && separateLists) {
       filteredChunks = [allList]; 
    } else {
       filteredChunks = [allList];
    }

    const firstPageItems = allList.slice(0, PAGE_1_LIMIT);
    const extraItems = allList.slice(PAGE_1_LIMIT);
    const extraPages = [];
    for(let i=0; i<extraItems.length; i+=PAGE_N_LIMIT) extraPages.push(extraItems.slice(i, i+PAGE_N_LIMIT));

    const renderTableRows = (rows) => (
      <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap border-collapse">
        <thead>
          <tr className="bg-slate-100/50">
            {exportCols.nombre && <th className="py-2 border-b border-slate-300 font-bold text-slate-700 w-1/3">Nombre del Asistente</th>}
            {exportCols.pases && <th className="px-2 py-2 border-b border-slate-300 font-bold text-slate-700 text-center">Pase</th>}
            {exportCols.estatus && <th className="px-2 py-2 border-b border-slate-300 font-bold text-slate-700 text-center">Estatus</th>}
            {exportCols.telefono && <th className="px-2 py-2 border-b border-slate-300 font-bold text-slate-700">Teléfono (Titular)</th>}
            {exportCols.mesa && <th className="px-2 py-2 border-b border-slate-300 font-bold text-slate-700">Mesa</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {rows.map(row => (
            <tr key={`print_${row._rowId}`}>
              {exportCols.nombre && (
                <td className="py-2"><span className="font-bold">{row.displayName}</span> {row.isChild ? '(Niño)' : ''}</td>
              )}
              {exportCols.pases && <td className="px-2 py-2 text-center font-bold">{row.isMain ? row.passes : ''}</td>}
              {exportCols.estatus && <td className="px-2 py-2 text-center uppercase text-[10px]">{row.parentGuest.status.replace('_', ' ')}</td>}
              {exportCols.telefono && <td className="px-2 py-2">{row.isMain ? (row.parentGuest.phone || 'N/A') : '-'}</td>}
              {exportCols.mesa && <td className="px-2 py-2">{row.parentGuest.tableId ? (tables?.find(t => String(t.id) === String(row.parentGuest.tableId))?.name || row.parentGuest.tableId) : '-'}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    );

    return (
      <div className="fixed inset-0 z-[120] bg-slate-200 flex flex-col overflow-hidden">
        <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row items-center justify-between shadow-lg print:hidden z-10 gap-4">
          <div className="flex items-center space-x-4">
            <button onClick={() => setExportViewOpen(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={24}/></button>
            <div><h3 className="font-bold text-sm">Estudio de Impresión</h3><p className="text-[10px] text-slate-400">Listas formateadas a Tamaño Carta.</p></div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 justify-center">
            <div className="h-6 w-px bg-slate-700 mx-2"></div>
            <button onClick={() => toggleCol('nombre')} className={`text-xs px-2 py-1 rounded transition-colors ${exportCols.nombre ? 'text-white bg-slate-700' : 'text-slate-500'}`}>Nombre</button>
            <button onClick={() => toggleCol('pases')} className={`text-xs px-2 py-1 rounded transition-colors ${exportCols.pases ? 'text-white bg-slate-700' : 'text-slate-500'}`}>Pases</button>
            <button onClick={() => toggleCol('estatus')} className={`text-xs px-2 py-1 rounded transition-colors ${exportCols.estatus ? 'text-white bg-slate-700' : 'text-slate-500'}`}>Estatus</button>
            <button onClick={() => toggleCol('telefono')} className={`text-xs px-2 py-1 rounded transition-colors ${exportCols.telefono ? 'text-white bg-slate-700' : 'text-slate-500'}`}>Teléfono</button>
            <button onClick={() => toggleCol('mesa')} className={`text-xs px-2 py-1 rounded transition-colors ${exportCols.mesa ? 'text-white bg-slate-700' : 'text-slate-500'}`}>Mesa</button>
          </div>

          <button onClick={triggerListPdfDownload} disabled={isPreparingListPrint} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold flex items-center shadow-md transition-all disabled:bg-slate-600">
            {isPreparingListPrint ? <RefreshCw size={16} className="mr-2 animate-spin"/> : <Download size={16} className="mr-2"/>} 
            {isPreparingListPrint ? 'Preparando...' : 'Descargar PDF'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col items-center gap-8">
          
          <div className="list-pdf-page bg-white shadow-2xl relative shrink-0" style={{ width: '215.9mm', height: '279.4mm', padding: '15mm', boxSizing: 'border-box', overflow: 'hidden' }}>
            <header className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{isWeddingMode ? 'Boda Ana & Roberto' : 'Lista de Invitados'}</h1>
                <p className="text-slate-600 text-xs font-medium mt-1">Recepción</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400">Total: {totalPases} Pases</p>
              </div>
            </header>
            <main>{renderTableRows(firstPageItems)}</main>
            <div className="absolute bottom-6 right-6 text-[10px] font-bold text-slate-400">Página 1 de {1 + extraPages.length}</div>
          </div>

          {extraPages.map((pageRows, pIdx) => (
            <div key={`extrapage_${pIdx}`} className="list-pdf-page bg-white shadow-2xl relative shrink-0" style={{ width: '215.9mm', height: '279.4mm', padding: '15mm', boxSizing: 'border-box', overflow: 'hidden' }}>
               <header className="border-b-2 border-slate-800 pb-3 mb-6">
                 <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Lista de Invitados (Cont.)</h1>
               </header>
               <main>{renderTableRows(pageRows)}</main>
               <div className="absolute bottom-6 right-6 text-[10px] font-bold text-slate-400">Página {pIdx + 2} de {1 + extraPages.length}</div>
            </div>
          ))}

        </div>
      </div>
    );
  }

  // --- VISTA 2: ESTUDIO DE PULSERAS QR ---
  if (qrStudioOpen) {
    const allIndividuals = safeGuests
      .filter(g => g.status === 'confirmado' || g.status === 'ingreso')
      .flatMap(g => (g.subGuests || []).map(sg => ({ ...sg, familyName: g.name, familyId: g.id })));

    const chunkArray = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));
    const wristbandPages = chunkArray(allIndividuals, 10);

    return (
      <div className="fixed inset-0 z-[120] bg-slate-200 flex flex-col overflow-hidden">
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-lg print:hidden z-10 shrink-0">
          <div className="flex items-center space-x-4">
            <button onClick={() => setQrStudioOpen(false)} className="p-2 hover:bg-slate-800 rounded-full"><X size={24}/></button>
            <div>
              <h3 className="font-bold text-sm">Plantillas Comerciales para Pulseras</h3>
              <p className="text-[10px] text-slate-400">10 pulseras de 25cm x 1.9cm por hoja.</p>
            </div>
          </div>
          <button onClick={triggerQRPdfDownload} disabled={isPreparingQRPrint} className="px-5 py-2.5 bg-pink-600 hover:bg-pink-50 rounded-xl text-sm font-bold flex items-center shadow-lg disabled:bg-slate-500 transition-all">
            {isPreparingQRPrint ? <RefreshCw size={16} className="mr-2 animate-spin"/> : <Download size={16} className="mr-2"/>} 
            {isPreparingQRPrint ? 'Preparando...' : 'Descargar PDF (25x19)'}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto bg-slate-200 flex flex-col items-center py-8 gap-8">
           {wristbandPages.length === 0 ? (
             <div className="text-center py-20 text-slate-400 font-bold">No hay invitados confirmados para generar códigos QR.</div>
           ) : (
             wristbandPages.map((page, pageIdx) => (
               <div key={pageIdx} className="qr-pdf-page bg-white shadow-2xl relative shrink-0" style={{ width: '25cm', height: '19cm', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden', padding: 0, margin: 0 }}>
                 {page.map((ind) => {
                   const link = window.location.origin + window.location.pathname + '?modo=camara&e=' + ID_DEL_EVENTO + '&u=' + ind.id;
                   const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(link)}`;
                   return (
                     <div key={ind.id} style={{ width: '25cm', height: '1.9cm', borderBottom: '1px dashed #cbd5e1', display: 'flex', boxSizing: 'border-box', backgroundColor: 'white', margin: 0 }}>
                        <div style={{ width: '2.5cm', height: '100%', backgroundColor: '#f1f5f9', borderRight: '1px dashed #94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '8px', color: '#94a3b8', transform: 'rotate(-90deg)', letterSpacing: '1px' }}>PEGAMENTO</span>
                        </div>
                        <div style={{ flex: 1, padding: '0 1cm', display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{ind.name}</div>
                          <div style={{ fontSize: '10px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>({ind.familyName})</div>
                        </div>
                        <div style={{ width: '6cm', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '0.5cm', gap: '10px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#64748b' }}>CÓDIGO MANUAL</span>
                            <span style={{ fontSize: '14px', fontWeight: '900', fontFamily: 'monospace', color: '#0f172a', backgroundColor: '#f1f5f9', padding: '2px 4px', borderRadius: '4px' }}>{ind.id}</span>
                          </div>
                          <img src={qrUrl} alt="QR" style={{ width: '1.5cm', height: '1.5cm', mixBlendMode: 'multiply' }} />
                        </div>
                     </div>
                   )
                 })}
                 {Array.from({ length: 10 - page.length }).map((_, i) => (
                    <div key={`empty_${i}`} style={{ width: '25cm', height: '1.9cm', borderBottom: '1px dashed #e2e8f0', backgroundColor: '#f8fafc', boxSizing: 'border-box', margin: 0 }}></div>
                 ))}
               </div>
             ))
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4 pb-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestión de Invitados</h2>
          <p className="text-slate-500 text-xs mt-1">Control de asistencia, pases y pulseras.</p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mr-2 ml-2">Boda</span>
            <button onClick={() => setIsWeddingMode(!isWeddingMode)} className={`relative w-8 h-4 rounded-full transition-colors ${isWeddingMode ? 'bg-indigo-500' : 'bg-slate-300'}`}>
              <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${isWeddingMode ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </button>
          </div>

          <button onClick={() => setExportViewOpen(true)} className="flex items-center px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 shadow-sm"><FileSpreadsheet size={14} className="mr-1.5 text-emerald-600"/> Reportes PDF</button>
          <button onClick={() => setQrStudioOpen(true)} className="flex items-center px-3 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 shadow-sm"><QrCode size={14} className="mr-1.5 text-indigo-600"/> Imprimir QRs</button>

          {isWeddingMode ? (
            <div className="flex gap-1.5">
              <button onClick={() => handleOpenAdd('novia')} className="flex items-center px-3 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 shadow-sm"><UserPlus size={14} className="mr-1"/> Novia</button>
              <button onClick={() => handleOpenAdd('novio')} className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm"><UserPlus size={14} className="mr-1"/> Novio</button>
            </div>
          ) : (
            <button onClick={() => handleOpenAdd('general')} className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm"><UserPlus size={14} className="mr-1"/> Nuevo Asistente</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col"><div className="text-slate-500 font-semibold text-[9px] uppercase tracking-wider mb-1"><Users size={12} className="inline mr-1 text-slate-400"/> Pases Totales</div><h3 className="text-xl font-black text-slate-800">{totalPases}</h3></div>
        <div className="bg-sky-50 p-3 rounded-xl border border-sky-200 shadow-sm flex flex-col"><div className="text-sky-600 font-semibold text-[9px] uppercase tracking-wider mb-1"><Users size={12} className="inline mr-1"/> Niños</div><h3 className="text-xl font-black text-sky-600">{totalNinos}</h3></div>
        <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 shadow-sm flex flex-col"><div className="text-amber-600 font-semibold text-[9px] uppercase tracking-wider mb-1"><CheckCircle size={12} className="inline mr-1"/> Confirmados</div><h3 className="text-xl font-black text-amber-600">{totalConfirmados}</h3></div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col"><div className="text-slate-500 font-semibold text-[9px] uppercase tracking-wider mb-1"><Clock size={12} className="inline mr-1"/> Pendientes</div><h3 className="text-xl font-black text-slate-600">{totalPendientes}</h3></div>
        <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 shadow-sm flex flex-col"><div className="text-rose-600 font-semibold text-[9px] uppercase tracking-wider mb-1"><X size={12} className="inline mr-1"/> Cancelados</div><h3 className="text-xl font-black text-rose-600">{totalCancelados} Pases</h3></div>
        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 shadow-sm flex flex-col"><div className="text-emerald-600 font-semibold text-[9px] uppercase tracking-wider mb-1"><Scan size={12} className="inline mr-1"/> Ingresaron</div><h3 className="text-xl font-black text-emerald-600">{totalIngresos}</h3></div>
      </div>

      {isWeddingMode && (
        <div className="bg-gradient-to-r from-rose-50 to-indigo-50 py-2 px-4 rounded-xl border border-indigo-100 flex items-center justify-around shadow-inner mt-1">
          <div className="text-center flex items-center gap-2"><p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Pases Novia</p><p className="text-sm font-black text-rose-600">{pasesNovia}</p></div>
          <div className="h-6 w-px bg-indigo-200"></div>
          <div className="text-center flex items-center gap-2"><p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Pases Novio</p><p className="text-sm font-black text-indigo-600">{pasesNovio}</p></div>
        </div>
      )}

      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-2.5 border-b border-slate-100 bg-slate-50/50 flex">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input type="text" placeholder="Buscar por nombre, estatus o mesa..." value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-400" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-3 py-2 font-bold uppercase tracking-wider text-[9px]">Nombre</th>
                <th className="px-2 py-2 font-bold uppercase tracking-wider text-[9px] text-center">Tipo</th>
                <th className="px-2 py-2 font-bold uppercase tracking-wider text-[9px] text-center">Pases</th>
                <th className="px-2 py-2 font-bold uppercase tracking-wider text-[9px] text-center">Mesa</th>
                <th className="px-2 py-2 font-bold uppercase tracking-wider text-[9px] text-center">QR Pase</th>
                <th className="px-2 py-2 font-bold uppercase tracking-wider text-[9px] text-center">Estatus</th>
                <th className="px-3 py-2 font-bold uppercase tracking-wider text-[9px] text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {flattenedList.map((row) => (
                <tr key={row._rowId} className={`transition-colors hover:bg-slate-50 ${row.parentGuest.status === 'cancelado' ? 'bg-rose-50/40 opacity-70' : row.isMain ? 'bg-white border-t-2 border-slate-100' : 'bg-slate-50/30'}`}>
                  <td className="px-3 py-1.5">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className={`${row.isMain ? 'font-bold text-slate-800' : 'font-normal text-slate-700'} ${row.isMissing ? 'text-amber-500 italic' : ''} ${row.parentGuest.status === 'cancelado' ? 'line-through' : ''}`}>
                          {row.displayName}
                        </span>
                        {isWeddingMode && !row.isMissing && row.parentGuest.side && (
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${row.parentGuest.side === 'novia' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                            {row.parentGuest.side}
                          </span>
                        )}
                        {row.isMain && row.parentGuest.extraRequested > 0 && (
                          <span className="bg-rose-100 text-rose-700 text-[8px] px-1.5 rounded uppercase font-bold ml-1">
                              +{row.parentGuest.extraRequested} Pases
                          </span>
                        )}
                      </div>
                      {!row.isMain && !row.isMissing && (
                        <span className="text-[9px] font-light text-slate-400 mt-0.5 leading-tight">Familia: {row.parentGuest.name}</span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-2 py-1.5 text-center">
                    {row.isMissing ? <span className="text-slate-300">-</span> : row.isChild ? <span className="text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-widest">Niño</span> : <span className="text-slate-300"></span>}
                  </td>
                  
                  <td className="px-2 py-1.5 text-center">
                     {row.isMain || row.isMissing ? <span className="font-black text-indigo-600">{row.passes}</span> : <span className="text-slate-300">-</span>}
                  </td>

                  <td className="px-2 py-1.5 text-center">
                    {row.parentGuest.tableId ? (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[9px] font-bold border border-slate-200">
                        {tables?.find(t => String(t.id) === String(row.parentGuest.tableId))?.name || row.parentGuest.tableId}
                      </span>
                    ) : <span className="text-[9px] text-slate-400 italic">-</span>}
                  </td>

                  <td className="px-2 py-1.5 text-center">
                    {row.pin && row.parentGuest.status !== 'cancelado' ? (
                      <button onClick={() => setQrModal(row)} className="text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 p-1 rounded transition-colors" title="Ver Pase Individual">
                        <QrCode size={14} />
                      </button>
                    ) : <span className="text-slate-300">-</span>}
                  </td>
                  
                  <td className="px-2 py-1.5 text-center">
                    {row.isMain ? (
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${row.parentGuest.status === 'ingreso' ? 'bg-emerald-100 text-emerald-700' : row.parentGuest.status === 'confirmado' ? 'bg-amber-100 text-amber-700' : row.parentGuest.status === 'cancelado' ? 'bg-rose-100 text-rose-700' : row.parentGuest.status === 'por_invitar' ? 'bg-slate-200 text-slate-600' : 'bg-slate-100 text-slate-500'}`}>
                        {row.parentGuest.status === 'ingreso' ? `En el evento` : (row.parentGuest.status ? row.parentGuest.status.replace('_', ' ') : 'Pendiente')}
                      </span>
                    ) : !row.isMissing ? (
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${row.entered ? 'bg-emerald-500 text-white shadow-sm' : (row.parentGuest.status === 'confirmado' || row.parentGuest.status === 'ingreso' ? 'bg-amber-100 text-amber-700' : (row.parentGuest.status === 'por_invitar' ? 'bg-slate-200 text-slate-600' : 'bg-slate-100 text-slate-500'))}`}>
                        {row.entered ? '✔ ADENTRO' : (row.parentGuest.status === 'cancelado' ? 'CANCELADO' : (row.parentGuest.status === 'confirmado' || row.parentGuest.status === 'ingreso' ? 'CONFIRMADO' : (row.parentGuest.status === 'por_invitar' ? 'POR INVITAR' : 'PENDIENTE')))}
                      </span>
                    ) : <span className="text-slate-300">-</span>}
                  </td>
                  
                  <td className="px-3 py-1.5 text-right">
                    {row.isMain ? (
                      <div className="flex justify-end space-x-1">
                        <button onClick={() => handleSendWhatsApp(row.parentGuest)} className={`p-1.5 rounded-md transition-colors ${row.parentGuest.sent ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400 hover:bg-slate-100'}`}><MessageCircle size={14}/></button>
                        <button onClick={() => handleOpenEdit(row.parentGuest)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md"><Edit2 size={14} /></button>
                        <button onClick={() => setDeleteModal(row.parentGuest)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md"><Trash2 size={14} /></button>
                      </div>
                    ) : <span className="text-[9px] text-slate-300 italic">Vinculado</span>}
                  </td>
                </tr>
              ))}
              {flattenedList.length === 0 && <tr><td colSpan="8" className="px-4 py-8 text-center text-slate-400">Sin invitados en la lista.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {qrModal && (
        <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-xs overflow-hidden shadow-2xl relative border-4 border-slate-200">
            <button onClick={() => setQrModal(null)} className="absolute top-3 right-3 text-slate-400 hover:text-slate-800 bg-slate-100 p-1.5 rounded-full z-10"><X size={16}/></button>
            <div className="h-24 bg-slate-800 relative bg-[url('https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80')] bg-cover bg-center">
              <div className="absolute inset-0 bg-black/50"></div>
              <div className="absolute bottom-3 left-0 w-full text-center text-white"><p className="text-[8px] tracking-[0.2em] uppercase">Pase Personal</p></div>
            </div>
            <div className="p-6 text-center">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-tight mb-1">{qrModal.displayName}</h3>
              <p className="text-[10px] text-slate-500 mb-6">Invitación: {qrModal.parentGuest.name}</p>
              
              <div className="inline-block border-2 border-dashed border-slate-300 p-2 rounded-xl mb-4">
                {/* 🔴 QR LIMPIO QUE USA EL DOMINIO BAULIA.COM PARA LAS INVITACIONES */}
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent((window.location.hostname.includes('localhost') ? window.location.origin : 'https://baulia.com') + '/' + ID_DEL_EVENTO + '?u=' + (qrModal.pin || qrModal.parentGuest?.id || ''))}`} alt="QR" className="w-32 h-32" />
              </div>
              
              <p className="text-[8px] text-slate-400 uppercase tracking-widest mb-1">Código Manual</p>
              <p className="text-lg font-mono font-black text-indigo-600 bg-indigo-50 py-1 rounded-lg tracking-widest">{qrModal.pin}</p>
            </div>
          </div>
        </div>
      )}

      {addModal.open && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="px-5 py-4 border-b flex justify-between items-center bg-slate-50"><h3 className="font-bold">Nuevo Invitado</h3><button onClick={() => setAddModal({ open: false, side: 'general' })}><X size={18}/></button></div>
            <form onSubmit={handleSaveGuest} className="p-5 space-y-4">
              <div><label className="block text-xs font-bold mb-1">Nombre o Familia</label><input type="text" required value={newGuest.name} onChange={e=>setNewGuest({...newGuest, name: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" /></div>
              <div><label className="block text-xs font-bold mb-1">Teléfono (WhatsApp) <span className="text-rose-500">*</span></label><input type="text" required value={newGuest.phone} onChange={e=>setNewGuest({...newGuest, phone: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm bg-slate-50 focus:bg-white" placeholder="Ej. 5512345678" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">Pases Totales</label><input type="number" min="1" required value={newGuest.passes} onChange={e=>setNewGuest({...newGuest, passes: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Niños Permitidos</label><input type="number" min="0" max={newGuest.passes} required value={newGuest.childrenPasses} onChange={e=>setNewGuest({...newGuest, childrenPasses: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" /></div>
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors">Guardar Invitado</button>
            </form>
          </div>
        </div>
      )}

      {editModal.open && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="px-5 py-4 border-b flex justify-between items-center bg-slate-50"><h3 className="font-bold">Editar Familia</h3><button onClick={() => setEditModal({ open: false, guest: null })}><X size={18}/></button></div>
            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              {editModal.guest.extraRequested > 0 && (
                <div className="bg-rose-50 text-rose-700 p-3 rounded-lg text-xs font-bold border border-rose-200 flex items-center">
                  <AlertCircle size={16} className="mr-2"/> ¡Solicita {editModal.guest.extraRequested} pase(s) extra! Edita los pases totales si apruebas la solicitud.
                </div>
              )}
              <div><label className="block text-xs font-bold mb-1">Nombre</label><input type="text" required value={editModal.guest.name} onChange={e=>setEditModal({ ...editModal, guest: { ...editModal.guest, name: e.target.value }})} className="w-full p-2.5 border rounded-lg text-sm" /></div>
              <div><label className="block text-xs font-bold mb-1">Teléfono (WhatsApp)</label><input type="text" required value={editModal.guest.phone || ''} onChange={e=>setEditModal({ ...editModal, guest: { ...editModal.guest, phone: e.target.value }})} className="w-full p-2.5 border rounded-lg text-sm" /></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">Mesa</label>
                  <select value={editModal.guest.tableId || ''} onChange={e=>setEditModal({ ...editModal, guest: { ...editModal.guest, tableId: e.target.value }})} className="w-full p-2.5 border rounded-lg text-sm">
                    <option value="">Sin Mesa</option>
                    {tables?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div><label className="block text-xs font-bold mb-1">Estatus</label>
                  <select value={editModal.guest.status} onChange={e=>setEditModal({ ...editModal, guest: { ...editModal.guest, status: e.target.value }})} className="w-full p-2.5 border rounded-lg text-sm">
                    <option value="por_invitar">Por Invitar</option><option value="pendiente">Pendiente</option><option value="confirmado">Confirmado</option><option value="cancelado">Canceló</option>
                  </select>
                </div>
                <div><label className="block text-xs font-bold mb-1">Pases Totales</label><input type="number" min="0" required value={editModal.guest.passes} onChange={e=>setEditModal({ ...editModal, guest: { ...editModal.guest, passes: Number(e.target.value) }})} className="w-full p-2.5 border rounded-lg text-sm" /></div>
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors">Guardar Cambios</button>
            </form>
          </div>
        </div>
      )}

      {deleteModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center animate-in zoom-in-95">
             <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={32} /></div>
             <h3 className="font-bold text-xl mb-2">¿Eliminar a {deleteModal.name}?</h3>
             <p className="text-slate-500 text-sm mb-6">Esta acción liberará sus lugares asignados definitivamente.</p>
             <div className="flex space-x-3"><button onClick={()=>setDeleteModal(null)} className="flex-1 p-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200">Cancelar</button><button onClick={executeDeleteGuest} className="flex-1 p-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600">Eliminar</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// --- COMPONENTE: VISTA PREVIA INVITACIÓN (APP) ---
// ==========================================
const InvitacionView = ({ guests, setGuests, addNotification }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuestId, setSelectedGuestId] = useState(guests[0]?.id || null);
  const guest = guests.find(g => g.id === selectedGuestId) || guests[0];
  const [isConfirming, setIsConfirming] = useState(false);
  
  const [tempSubGuests, setTempSubGuests] = useState([]);
  const [extraRequested, setExtraRequested] = useState(0);

  const extrasAprobados = (guest?.passes > (guest?.originalPasses || guest?.passes)) ? guest.passes - guest.originalPasses : 0;

  useEffect(() => {
    setIsConfirming(false);
  }, [selectedGuestId]);

  const handleOpenEdit = () => {
    if (!guest) return;
    setExtraRequested(guest.extraRequested || 0);
    
    const isFirstTime = guest.status === 'pendiente' || guest.status === 'por_invitar';
    const totalLimit = guest.originalPasses || guest.passes; 
    const currentSubs = guest.subGuests || [];
    
    const newTemp = Array(totalLimit).fill(null).map((_, i) => {
      if (currentSubs[i]) {
        return { ...currentSubs[i], willAttend: true };
      } else {
        return { name: '', isChild: false, willAttend: isFirstTime, id: `s_new_${Date.now()}_${i}` };
      }
    });
    
    setTempSubGuests(newTemp);
    setIsConfirming(true); 
  };

  const handleSubGuestChange = (index, field, value) => {
    const newSubGuests = [...tempSubGuests];
    newSubGuests[index] = { ...newSubGuests[index], [field]: value };
    setTempSubGuests(newSubGuests);
  };

  const handleConfirmRSVP = async () => {
    if (!guest) return;
    
    const attendingGuests = tempSubGuests.filter(sg => sg.willAttend);
    const isCancelled = attendingGuests.length === 0;

    if (!isCancelled) {
      const emptyNames = attendingGuests.filter(sg => !sg.name.trim());
      if(emptyNames.length > 0) {
        alert("Por favor, ingresa el nombre de todos los que SÍ asistirán.");
        return;
      }
    }

    const updatedGuest = {
      ...guest,
      passes: isCancelled ? 0 : attendingGuests.length, 
      status: isCancelled ? 'cancelado' : 'confirmado',
      extraRequested: extraRequested,
      subGuests: attendingGuests.map((sg, i) => ({
        id: sg.id?.startsWith('s_new') ? `usr_${guest.id}_${i}` : sg.id,
        name: sg.name, isChild: sg.isChild, entered: false
      }))
    };
    
    await setDoc(doc(db, "eventos", ID_DEL_EVENTO, "invitados", guest.id), updatedGuest);
    setIsConfirming(false);
  };

  const filteredGuests = guests.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (!guest) return <div className="p-8 text-center text-slate-500">No hay invitados en la lista para simular.</div>;

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 pb-6 relative overflow-hidden">
      
      {/* PANEL IZQUIERDO: LISTA */}
      <div className="flex-1 flex flex-col max-h-full min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">Simulador de Invitación</h2>
          <div className="mt-3 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input type="text" placeholder="Buscar familia para simular..." value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-400" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filteredGuests.length > 0 ? (
            <ul className="space-y-1">
              {filteredGuests.map(g => (
                <li key={g.id}>
                  <button onClick={() => setSelectedGuestId(g.id)} className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between ${selectedGuestId === g.id ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50 border border-transparent'}`}>
                    <div>
                      <p className={`font-bold text-sm ${selectedGuestId === g.id ? 'text-indigo-900' : 'text-slate-700'}`}>{g.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{g.originalPasses || g.passes} Pases | <span className={`uppercase font-bold ${g.status === 'cancelado' ? 'text-rose-500' : g.status === 'confirmado' ? 'text-amber-500' : 'text-slate-400'}`}>{g.status.replace('_', ' ')}</span></p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : <div className="p-8 text-center text-slate-400 text-sm">No se encontraron invitados.</div>}
        </div>
      </div>

      {/* PANEL DERECHO: CELULAR */}
      <div className="w-full lg:w-[380px] flex-shrink-0 flex justify-center items-start pt-4 lg:pt-0 overflow-y-auto hide-scrollbar">
        <div className="w-[320px] h-[650px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl relative border-4 border-slate-300 flex-shrink-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-20"></div>
          <div className="w-full h-full bg-[#fdfbf7] rounded-[2.2rem] overflow-y-auto overflow-x-hidden hide-scrollbar relative">
            
            <div className="h-40 bg-slate-200 relative bg-[url('https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80')] bg-cover bg-center">
              <div className="absolute inset-0 bg-black/40"></div>
              <div className="absolute bottom-4 left-0 w-full text-center text-white px-4">
                <p className="text-[9px] tracking-[0.2em] uppercase mb-1">NUESTRA BODA</p>
                <h1 className="text-xl font-serif">Ana & Luis</h1>
              </div>
            </div>

            <div className="p-5 text-center">
              {extrasAprobados > 0 && guest.status === 'confirmado' && (
                 <div className="mb-4 bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-300 p-3 rounded-2xl shadow-sm animate-in fade-in zoom-in">
                    <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1 flex items-center justify-center"><CheckCircle size={12} className="mr-1"/> ¡Buenas noticias!</p>
                    <p className="text-xs text-amber-900 font-bold leading-tight">Tus {extrasAprobados} pases extra han sido aprobados. Tienes {guest.passes} lugares en total.</p>
                 </div>
              )}

              <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Pase Exclusivo Para</p>
              <h3 className="text-lg font-bold text-slate-800 mb-5 leading-tight">{guest.name}</h3>

              {isConfirming ? (
                 <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-100 mb-6 text-left animate-in slide-in-from-bottom-4">
                  <h4 className="font-bold text-slate-800 text-xs mb-1 text-center">Confirmación de Pases</h4>
                  <p className="text-[9px] text-slate-500 text-center mb-4">Selecciona quiénes asistirán e ingresa sus nombres.</p>
                  
                  <div className="space-y-2 mb-4">
                    {tempSubGuests.map((sg, idx) => (
                      <div key={idx} className={`p-2.5 rounded-lg border transition-colors ${sg.willAttend ? 'bg-slate-50 border-slate-300' : 'bg-slate-100/50 border-slate-200 opacity-60'}`}>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-[10px] font-bold text-slate-600">Pase #{idx + 1}</label>
                          <label className="flex items-center space-x-1.5 cursor-pointer">
                            <input type="checkbox" checked={sg.willAttend} onChange={(e) => handleSubGuestChange(idx, 'willAttend', e.target.checked)} className="rounded text-indigo-600 w-3 h-3" />
                            <span className="text-[9px] font-bold uppercase text-slate-500">{sg.willAttend ? 'Asistirá' : 'No asistirá'}</span>
                          </label>
                        </div>
                        {sg.willAttend && (
                          <div className="space-y-2">
                             <input 
                               type="text" placeholder="Nombre de la persona..." 
                               value={sg.name || ''} onChange={(e) => handleSubGuestChange(idx, 'name', e.target.value)}
                               className="w-full p-2 border border-slate-200 rounded-md text-[10px] outline-none focus:border-indigo-400 bg-white"
                             />
                             {/* 🔴 CHECKBOX LIMPIO Y PERFECTO */}
                             <label className="flex items-center space-x-2 cursor-pointer pt-1">
                                <input type="checkbox" checked={sg.isChild || false} onChange={(e) => handleSubGuestChange(idx, 'isChild', e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Es un Niño (Menor)</span>
                             </label>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mb-4 border-t border-slate-200 pt-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-700">¿Necesitas pases extra?</p>
                      <p className="text-[8px] text-slate-400 leading-tight">Sujeto a disponibilidad.</p>
                    </div>
                    <div className="flex items-center bg-slate-100 rounded-lg p-1">
                      <button onClick={() => setExtraRequested(Math.max(0, extraRequested - 1))} className="p-1 text-slate-500"><Minus size={12}/></button>
                      <span className="text-xs font-bold w-6 text-center">{extraRequested}</span>
                      <button onClick={() => setExtraRequested(extraRequested + 1)} className="p-1 text-indigo-600"><Plus size={12}/></button>
                    </div>
                  </div>

                  <button onClick={() => handleConfirmRSVP()} className="w-full py-2.5 bg-slate-900 text-white rounded-lg font-bold text-xs shadow-md hover:bg-slate-800 transition-colors">
                    {tempSubGuests.filter(s => s.willAttend).length === 0 ? 'Declinar Invitación' : 'Enviar Confirmación'}
                  </button>
                  <button onClick={() => setIsConfirming(false)} className="w-full py-2 mt-1 text-[10px] font-bold text-slate-400 hover:text-slate-600">Cancelar</button>
                </div>
              ) : guest.status === 'confirmado' || guest.status === 'ingreso' ? (
                <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-100 mb-6 animate-in zoom-in">
                  <p className="text-amber-600 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center justify-center"><CheckCircle size={14} className="mr-1"/> Asistencia Confirmada</p>
                  <p className="text-[10px] text-slate-500 mb-3">Tus lugares están reservados.</p>
                  
                  <div className="bg-slate-50 p-3 rounded-lg text-left border border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-2 text-center">Asistentes ({guest.subGuests?.length || 0})</p>
                    <ul className="space-y-1.5">
                      {guest.subGuests && guest.subGuests.length > 0 ? (
                        guest.subGuests.map((sg, idx) => (
                          <li key={idx} className="text-xs font-semibold text-slate-700 flex items-center justify-between border-b border-slate-200 pb-1 last:border-0">
                            <span className="truncate mr-2">{sg.name} {sg.isChild && <span className="text-[8px] text-indigo-500 bg-indigo-50 px-1 ml-1 rounded uppercase tracking-widest">Niño</span>}</span>
                          </li>
                        ))
                      ) : <li className="text-[10px] text-slate-500 text-center italic">Sin nombres</li>}
                    </ul>
                  </div>
                  {guest.extraRequested > 0 && (
                    <div className="mt-3 p-2 bg-indigo-50 text-indigo-700 rounded-lg text-[9px] font-bold">
                      Solicitaste {guest.extraRequested} pase(s) extra. Esperando respuesta.
                    </div>
                  )}
                  <button onClick={handleOpenEdit} className="mt-4 text-[10px] font-bold text-slate-400 underline hover:text-indigo-600">Modificar Asistentes</button>
                </div>
              ) : guest.status === 'cancelado' ? (
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 mb-6 animate-in zoom-in">
                  <p className="text-rose-600 text-xs font-bold mb-2">Asistencia Declinada</p>
                  <p className="text-[10px] text-slate-500">Lamentamos que no puedas acompañarnos. Tus lugares han sido liberados.</p>
                  <button onClick={handleOpenEdit} className="mt-4 text-[10px] font-bold text-slate-400 underline hover:text-rose-600">Cambiar de opinión</button>
                </div>
              ) : (
                <div className="bg-white p-5 rounded-xl shadow-lg border border-slate-100 mb-6">
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl mb-4 text-center shadow-inner">
                    <p className="text-[10px] text-slate-600 leading-relaxed">
                      Entra a <b>Confirmar Asistencia</b> para gestionar tus pases, solicitar extras o declinar la invitación.
                    </p>
                  </div>
                  <p className="text-xs font-bold text-slate-700 mb-4">Tienes {guest.originalPasses || guest.passes} pases reservados.</p>
                  <div className="space-y-3">
                    <button onClick={handleOpenEdit} className="w-full py-3.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg hover:scale-105 transition-transform">
                      Confirmar Asistencia
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// --- COMPONENTE: GESTIÓN DE MESAS ---
// ==========================================
const MesasView = ({ tables, setTables, guests, setGuests, addNotification }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [creationMode, setCreationMode] = useState('iguales'); 
  const [cantidadIguales, setCantidadIguales] = useState(1);
  const [mezclaVariedad, setMezclaVariedad] = useState([]);
  const [guestSeleccionado, setGuestSeleccionado] = useState(null);
  const [smartAssign, setSmartAssign] = useState(null);
  const [tableToEdit, setTableToEdit] = useState(null);
  const [guestSplitPrompt, setGuestSplitPrompt] = useState(null);
  const [configActual, setCurrentConfig] = useState({
    tipo: 'redonda', 
    capacidadRedonda: 10,
    capacidadPersonalizada: 10,
    ladosCuadrada: { top: 3, right: 3, bottom: 3, left: 3 }, 
    ladosTablon: { top: 5, bottom: 5, left: 1, right: 1 },
    ladosOvalada: { top: 4, bottom: 4, left: 2, right: 2 }, // Ovalada por defecto
    modeloSerpentina: 'mod4',
    ladosSerpentina: { ext: 5, int: 2, izq: 1, der: 1 }, // Serpentina mod4 por defecto
    uTablones: { izq: 2, centro: 1, der: 2 },
    uSillas: { extIzq: 10, intIzq: 5, extCentro: 5, intCentro: 0, extDer: 10, intDer: 5, cabeceras: 2 },
    libreMedidas: { largo: 2.0, ancho: 1.0 },
    ladosLibre: { top: 4, bottom: 4, left: 2, right: 2 }
  });

  const safeTables = tables || [];
  const safeGuests = guests || [];
  const invitadosSinMesa = safeGuests.filter(g => !g.tableId && g.status !== 'cancelado');

  const modelosSerpentina = {
    'mod1': { nombre: '1.58m x 0.75m', max: { ext: 3, int: 1, izq: 1, der: 1 } },
    'mod2': { nombre: '2.00m x 0.75m', max: { ext: 4, int: 1, izq: 1, der: 1 } },
    'mod3': { nombre: '2.10m x 0.75m', max: { ext: 4, int: 1, izq: 1, der: 1 } },
    'mod4': { nombre: '2.44m x 0.90m', max: { ext: 5, int: 2, izq: 1, der: 1 } }
  };

  const calcularCapacidad = (config) => {
    switch (config.tipo) {
      case 'redonda': return config.capacidadRedonda;
      case 'cuadrada': return config.ladosCuadrada.top + config.ladosCuadrada.right + config.ladosCuadrada.bottom + config.ladosCuadrada.left;
      case 'tablon': return config.ladosTablon.top + config.ladosTablon.bottom + config.ladosTablon.left + config.ladosTablon.right;
      case 'personalizada': return config.capacidadPersonalizada;
      case 'ovalada': return config.ladosOvalada.top + config.ladosOvalada.bottom + config.ladosOvalada.left + config.ladosOvalada.right;
      case 'serpentina': return config.ladosSerpentina.ext + config.ladosSerpentina.int + config.ladosSerpentina.izq + config.ladosSerpentina.der;
      case 'forma_u': return config.uSillas.extIzq + config.uSillas.intIzq + config.uSillas.extCentro + config.uSillas.intCentro + config.uSillas.extDer + config.uSillas.intDer + config.uSillas.cabeceras;
      case 'libre': return config.ladosLibre.top + config.ladosLibre.bottom + config.ladosLibre.left + config.ladosLibre.right;
      default: return 0;
    }
  };

  const handleConfigChange = (tipo, campo, valor, maxLimit) => {
    let num = parseInt(valor) || 0;
    if (num < 0) num = 0;
    if (maxLimit !== null && maxLimit !== undefined && num > maxLimit) num = maxLimit;

    if (tipo === 'general') setCurrentConfig({ ...configActual, [campo]: num });
    else if (tipo === 'medidas_libre') {
      let val = parseFloat(valor) || 0;
      if (val < 0.5) val = 0.5; // El lado mínimo es 0.5m (para al menos 1 silla)
      const newMedidas = { ...configActual.libreMedidas, [campo]: val };
      
      // --- LA MAGIA DE LOS 0.5 METROS POR SILLA ---
      // Calculamos cuántas sillas caben por lado basándonos en la medida nueva
      const maxLargo = Math.floor(newMedidas.largo / 0.5);
      const maxAncho = Math.floor(newMedidas.ancho / 0.5);
      
      // Ajustamos los lados para que nunca superen lo que físicamente cabe
      const newLados = {
        top: Math.min(configActual.ladosLibre.top, maxLargo),
        bottom: Math.min(configActual.ladosLibre.bottom, maxLargo),
        left: Math.min(configActual.ladosLibre.left, maxAncho),
        right: Math.min(configActual.ladosLibre.right, maxAncho)
      };
      
      setCurrentConfig({ ...configActual, libreMedidas: newMedidas, ladosLibre: newLados });
    } 
    else if (tipo === 'serpentina_modelo') {
      const modLimits = modelosSerpentina[valor].max;
      setCurrentConfig({
        ...configActual, 
        modeloSerpentina: valor,
        ladosSerpentina: {
          ext: Math.min(configActual.ladosSerpentina.ext, modLimits.ext),
          int: Math.min(configActual.ladosSerpentina.int, modLimits.int),
          izq: Math.min(configActual.ladosSerpentina.izq, modLimits.izq),
          der: Math.min(configActual.ladosSerpentina.der, modLimits.der)
        }
      });
    }
    else setCurrentConfig({ ...configActual, [tipo]: { ...configActual[tipo], [campo]: num } });
  };

  const agregarAVariedad = (e) => {
    e.preventDefault();
    const capacidad = calcularCapacidad(configActual);
    if (capacidad === 0) {
      if(addNotification) addNotification('Error', 'La mesa debe tener al menos 1 silla.', 'warning');
      return;
    }
    setMezclaVariedad([...mezclaVariedad, { id: Date.now(), cantidad: cantidadIguales, config: { ...configActual, capacidadCalculada: capacidad } }]);
    setCantidadIguales(1);
    if(addNotification) addNotification('Agregada a la mezcla', `Paquete de ${cantidadIguales} mesa(s) añadido.`, 'success');
  };

  const eliminarDeVariedad = (id) => setMezclaVariedad(mezclaVariedad.filter(m => m.id !== id));

  // 🔴 NUEVO: Crear y Editar Mesas en Firebase
   const generarMesas = async () => {
      if (creationMode === 'edit' && tableToEdit) {
         const capacidad = calcularCapacidad(configActual);
         const assignedGuests = safeGuests.filter(g => g.tableId === tableToEdit.id);
         const usedChairs = assignedGuests.reduce((sum, g) => sum + g.passes, 0);
         if (capacidad < usedChairs) {
              if(addNotification) addNotification('Acción Denegada', `La mesa ya tiene ${usedChairs} personas asignadas. Libera invitados primero.`, 'warning');
              return;
         }
         await setDoc(doc(db, "eventos", ID_DEL_EVENTO, "mesas", tableToEdit.id), { ...tableToEdit, capacity: capacidad, tipo: configActual.tipo, configDetalle: configActual });
         setIsAddModalOpen(false);
         setTableToEdit(null);
         setCreationMode('iguales');
         if(addNotification) addNotification('Mesa Actualizada', 'Los cambios se guardaron con éxito en la nube.', 'success');
         return;
      }

      let nuevasMesas = [];
      let startIdx = safeTables.length + 1;

      if (creationMode === 'iguales') {
         const capacidad = calcularCapacidad(configActual);
         if (capacidad === 0) return;
         for (let i = 0; i < cantidadIguales; i++) {
            nuevasMesas.push({ id: `mesa_${Date.now()}_${i}`, name: `Mesa ${startIdx + i}`, capacity: capacidad, tipo: configActual.tipo, configDetalle: configActual });
         }
      } else if (creationMode === 'variedad') {
         if (mezclaVariedad.length === 0) return;
         mezclaVariedad.forEach(paquete => {
            for (let i = 0; i < paquete.cantidad; i++) {
               nuevasMesas.push({ id: `mesa_${Date.now()}_${Math.random()}`, name: `Mesa ${startIdx}`, capacity: paquete.config.capacidadCalculada, tipo: paquete.config.tipo, configDetalle: paquete.config });
               startIdx++;
            }
         });
      }

    // Guardamos todas las mesas nuevas en Firebase
    const promesas = nuevasMesas.map(mesa => setDoc(doc(db, "eventos", ID_DEL_EVENTO, "mesas", mesa.id), mesa));
    await Promise.all(promesas);

      setIsAddModalOpen(false);
      setMezclaVariedad([]);
      setCantidadIguales(1);
      if(addNotification) addNotification('Mesas Creadas', `Se agregaron ${nuevasMesas.length} mesas a la nube.`, 'success');
   };

   // --- IA AUTO-ACOMODAR INTELIGENTE (CONECTADA) ---
   const handleAutoAssign = () => {
      if (!guests || guests.length === 0) return;
      const unassigned = guests.filter(g => !g.tableId && g.status !== 'cancelado');
      if (unassigned.length === 0) {
         if(addNotification) addNotification('Listo', 'Todos los invitados ya tienen mesa asignada.', 'info');
         return;
      }
      const unassignedPasses = unassigned.reduce((sum, g) => sum + g.passes, 0);
      let availableChairs = 0;
      safeTables.forEach(t => {
         const assigned = guests.filter(g => g.tableId === t.id);
         const used = assigned.reduce((sum, g) => sum + g.passes, 0);
         availableChairs += (t.capacity - used);
      });

      if (unassignedPasses > availableChairs) {
         setSmartAssign({ faltantes: unassignedPasses - availableChairs, invitadosPendientes: unassignedPasses });
         return;
      }
      ejecutarAsignacionLogic(safeTables);
   };

   const ejecutarAsignacionLogic = async (mesasDisponibles) => {
      let currentGuests = [...safeGuests];
      let changesMade = false;
    let promesas = [];

      currentGuests.forEach(guest => {
         if (!guest.tableId && guest.status !== 'cancelado') {
            const availableTable = mesasDisponibles.find(table => {
               const assignedGuests = currentGuests.filter(g => g.tableId === table.id);
               const usedChairs = assignedGuests.reduce((sum, g) => sum + g.passes, 0);
               return (table.capacity - usedChairs) >= guest.passes;
            });
            if (availableTable) { 
          guest.tableId = availableTable.id; 
          changesMade = true; 
          promesas.push(setDoc(doc(db, "eventos", ID_DEL_EVENTO, "invitados", guest.id), guest));
        }
         }
      });

      if (changesMade) {
      await Promise.all(promesas);
         if(addNotification) addNotification('Auto-Acomodo Exitoso', 'Se guardaron las asignaciones en la nube.', 'success');
      } else {
         if(addNotification) addNotification('Fragmentación', 'Hay sillas pero están separadas. Acomoda manualmente.', 'warning');
      }
   };

   const generarYAsignarMagico = async (opcion) => {
      let mesasNuevas = [];
      let startIdx = safeTables.length + 1;
      let sillasGeneradas = 0;

      const baseConfig = {  
         'redondas': { cap: 10, tipo: 'redonda', config: { tipo: 'redonda', capacidadRedonda: 10 } },
         'cuadradas': { cap: 12, tipo: 'cuadrada', config: { tipo: 'cuadrada', ladosCuadrada: { top: 3, right: 3, bottom: 3, left: 3 } } },
         'tablones': { cap: 12, tipo: 'tablon', config: { tipo: 'tablon', ladosTablon: { top: 5, bottom: 5, left: 1, right: 1 } } },
         'ovaladas': { cap: 12, tipo: 'ovalada', config: { tipo: 'ovalada', ladosOvalada: { top: 5, bottom: 5, left: 1, right: 1 } } },
         'serpentinas': { cap: 11, tipo: 'serpentina', config: { tipo: 'serpentina', modeloSerpentina: 'mod4', ladosSerpentina: { ext: 5, int: 4, izq: 1, der: 1 } } },
         'forma_u': { cap: 24, tipo: 'forma_u', config: { tipo: 'forma_u', uTablones: { izq: 2, centro: 1, der: 2 }, uSillas: { extIzq: 10, intIzq: 0, extCentro: 5, intCentro: 0, extDer: 10, intDer: 0, cabeceras: 2 } } }
      };

      while (sillasGeneradas < smartAssign.faltantes) {
         let cfg;
         if (opcion === 'mixto') {
            cfg = (startIdx % 2 === 0) ? baseConfig['redondas'] : baseConfig['tablones'];
         } else {
            cfg = baseConfig[opcion];
         }
         mesasNuevas.push({ id: `mesa_smart_${Date.now()}_${startIdx}`, name: `Mesa ${startIdx}`, capacity: cfg.cap, tipo: cfg.tipo, configDetalle: cfg.config });
         sillasGeneradas += cfg.cap;
         startIdx++;
      }

    await Promise.all(mesasNuevas.map(m => setDoc(doc(db, "eventos", ID_DEL_EVENTO, "mesas", m.id), m)));
      setSmartAssign(null);
      if(addNotification) addNotification('¡Magia Aplicada!', `Se generaron mesas mágicas en la nube.`, 'success');
      setTimeout(() => { ejecutarAsignacionLogic([...safeTables, ...mesasNuevas]); }, 500);
   };

  // 🔴 NUEVO: Botones de Limpiar y Eliminar Mesas (Conectados a Firebase)
   const emptyTable = async (tableId) => {
    const guestsToUpdate = guests.filter(g => g.tableId === tableId);
    const promesas = guestsToUpdate.map(g => setDoc(doc(db, "eventos", ID_DEL_EVENTO, "invitados", g.id), { ...g, tableId: null }));
    await Promise.all(promesas);
      if(addNotification) addNotification('Mesa Vaciada', 'Invitados liberados en la nube.', 'info');
   };

   const deleteTable = async (tableId) => {
      await emptyTable(tableId);
    await deleteDoc(doc(db, "eventos", ID_DEL_EVENTO, "mesas", tableId));
      if(addNotification) addNotification('Mesa Eliminada', 'La mesa ha sido borrada.', 'warning');
   };

   const emptyAllTables = async () => {
    const guestsToUpdate = guests.filter(g => g.tableId !== null);
    const promesas = guestsToUpdate.map(g => setDoc(doc(db, "eventos", ID_DEL_EVENTO, "invitados", g.id), { ...g, tableId: null }));
    await Promise.all(promesas);
      if(addNotification) addNotification('Todas las mesas vaciadas', 'Cambios guardados.', 'info');
   };

   const deleteAllTables = async () => {
      await emptyAllTables();
    const promesas = safeTables.map(t => deleteDoc(doc(db, "eventos", ID_DEL_EVENTO, "mesas", t.id)));
    await Promise.all(promesas);
      if(addNotification) addNotification('Mesas Eliminadas', 'Se borraron todas las mesas de la base de datos.', 'warning');
   };

   // --- LÓGICA DE DRAG & DROP PARA LISTA ---
   const handleDragStart = (e, guestId) => { e.dataTransfer.setData('guestId', guestId); setGuestSeleccionado(null); };
   const handleDrop = (e, targetTableId) => { e.preventDefault(); moverInvitado(e.dataTransfer.getData('guestId'), targetTableId); };
   const handleDragOver = (e) => e.preventDefault();

   const moverInvitado = async (guestId, targetTableId) => {
      const guest = safeGuests.find(g => g.id === guestId);
      if (!guest || guest.tableId === targetTableId) return;

      const isToTable = targetTableId !== null;
      let table = null;
      let usedChairs = 0;
       
      if (isToTable) {
           table = safeTables.find(t => t.id === targetTableId);
           usedChairs = safeGuests.filter(g => g.tableId === targetTableId).reduce((sum, g) => sum + g.passes, 0);
      }

      if (guest.passes > 1) {
           setGuestSplitPrompt({ guest, targetTableId, table, usedChairs });
           return;
      }

      if (isToTable && usedChairs + guest.passes > table.capacity) {
           if(addNotification) addNotification('Mesa Llena', `No hay sillas en ${table.name}.`, 'warning');
           return;
      }
    await setDoc(doc(db, "eventos", ID_DEL_EVENTO, "invitados", guestId), { ...guest, tableId: targetTableId });
   };

   const handleSplitChoice = async (mode) => {
         const { guest, targetTableId, table, usedChairs } = guestSplitPrompt;
          
         if (mode === 'all') {
               if (table && usedChairs + guest.passes > table.capacity) {
                     if(addNotification) addNotification('Mesa Llena', `No hay ${guest.passes} sillas en ${table.name}.`, 'warning');
               } else {
              await setDoc(doc(db, "eventos", ID_DEL_EVENTO, "invitados", guest.id), { ...guest, tableId: targetTableId });
               }
         } else if (mode === 'one') {
               if (table && usedChairs + 1 > table.capacity) {
                     if(addNotification) addNotification('Mesa Llena', `No hay sillas en ${table.name}.`, 'warning');
               } else {
              const newGuestId = Date.now().toString() + Math.random().toString(36).substring(2,5);
                     const newGuest = { ...guest, id: newGuestId, name: `${guest.name} (Separado)`, passes: 1, childrenPasses: 0, tableId: targetTableId };
                     const updatedGuest = { ...guest, passes: guest.passes - 1 };
              
              await setDoc(doc(db, "eventos", ID_DEL_EVENTO, "invitados", guest.id), updatedGuest);
              await setDoc(doc(db, "eventos", ID_DEL_EVENTO, "invitados", newGuestId), newGuest);
               }
         }
         setGuestSplitPrompt(null);
   };

  const handleGuestClick = (guest) => {
    if (guestSeleccionado?.id === guest.id) setGuestSeleccionado(null);
    else setGuestSeleccionado(guest);
  };

  const handleTableClick = (tableId) => { if (guestSeleccionado) moverInvitado(guestSeleccionado.id, tableId); };

  // Renderizadores Visuales
  const getTipoIcon = (tipo) => {
    switch(tipo) {
      case 'redonda': return <Circle size={16} className="text-rose-500"/>;
      case 'cuadrada': return <Square size={16} className="text-sky-500"/>;
      case 'tablon': return <RectangleHorizontal size={16} className="text-amber-500"/>;
      case 'ovalada': return <div className="w-5 h-3 rounded-[50%] border-2 border-indigo-500"></div>;
      case 'serpentina': return <Spline size={16} className="text-teal-500"/>;
      case 'forma_u': return <Magnet size={16} className="text-purple-500 rotate-180"/>;
      case 'libre': return <Settings2 size={16} className="text-slate-500"/>;
      default: return <Settings2 size={16} className="text-slate-500"/>;
    }
  };

  // --- FORMULARIOS DINÁMICOS DE CONFIGURACIÓN FALTANTE ---
  // --- FORMULARIOS DINÁMICOS CON LÍMITES EXACTOS ---
  const renderConfigForm = () => {
    switch (configActual.tipo) {
      case 'redonda':
        return (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 animate-in fade-in">
            <label className="block text-xs font-bold mb-2 text-slate-700">Sillas por Mesa Redonda (Máx. 10)</label>
            <input type="number" min="1" max="10" value={configActual.capacidadRedonda} onChange={(e) => handleConfigChange('general', 'capacidadRedonda', e.target.value, 10)} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white shadow-sm font-bold" />
          </div>
        );
      case 'cuadrada':
        return (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 animate-in fade-in">
            <label className="block text-xs font-bold mb-3 text-slate-700 border-b border-slate-200 pb-2">Distribución de Sillas (Máx. 3 por lado)</label>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">Lado Arriba</label><input type="number" min="0" max="3" value={configActual.ladosCuadrada.top} onChange={(e) => handleConfigChange('ladosCuadrada', 'top', e.target.value, 3)} className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white shadow-sm" /></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">Lado Abajo</label><input type="number" min="0" max="3" value={configActual.ladosCuadrada.bottom} onChange={(e) => handleConfigChange('ladosCuadrada', 'bottom', e.target.value, 3)} className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white shadow-sm" /></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">Lado Izquierdo</label><input type="number" min="0" max="3" value={configActual.ladosCuadrada.left} onChange={(e) => handleConfigChange('ladosCuadrada', 'left', e.target.value, 3)} className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white shadow-sm" /></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">Lado Derecho</label><input type="number" min="0" max="3" value={configActual.ladosCuadrada.right} onChange={(e) => handleConfigChange('ladosCuadrada', 'right', e.target.value, 3)} className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white shadow-sm" /></div>
            </div>
          </div>
        );
      case 'tablon':
        return (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 animate-in fade-in">
            <label className="block text-xs font-bold mb-3 text-slate-700 border-b border-slate-200 pb-2">Distribución de Sillas (Tablón)</label>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">Lado Largo 1 (Máx. 5)</label><input type="number" min="0" max="5" value={configActual.ladosTablon.top} onChange={(e) => handleConfigChange('ladosTablon', 'top', e.target.value, 5)} className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white shadow-sm" /></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">Lado Largo 2 (Máx. 5)</label><input type="number" min="0" max="5" value={configActual.ladosTablon.bottom} onChange={(e) => handleConfigChange('ladosTablon', 'bottom', e.target.value, 5)} className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white shadow-sm" /></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">Cabecera 1 (Máx. 1)</label><input type="number" min="0" max="1" value={configActual.ladosTablon.left} onChange={(e) => handleConfigChange('ladosTablon', 'left', e.target.value, 1)} className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white shadow-sm" /></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">Cabecera 2 (Máx. 1)</label><input type="number" min="0" max="1" value={configActual.ladosTablon.right} onChange={(e) => handleConfigChange('ladosTablon', 'right', e.target.value, 1)} className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white shadow-sm" /></div>
            </div>
          </div>
        );
      case 'ovalada':
        return (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 animate-in fade-in">
            <div className="bg-indigo-50 border border-indigo-100 p-2.5 rounded-lg mb-3 text-[10px] text-indigo-700 flex items-start">
              <Info size={14} className="mr-1.5 flex-shrink-0 mt-0.5"/>
              <span>Mesa de 3.05m x 1.22m (Capacidad física máxima: 14 personas totales).</span>
            </div>
            <label className="block text-xs font-bold mb-3 text-slate-700 border-b border-slate-200 pb-2">Distribución (Ovalada)</label>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">Lado Recto 1 (Máx. 4)</label><input type="number" min="0" max="4" value={configActual.ladosOvalada.top} onChange={(e) => handleConfigChange('ladosOvalada', 'top', e.target.value, 4)} className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white shadow-sm" /></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">Lado Recto 2 (Máx. 4)</label><input type="number" min="0" max="4" value={configActual.ladosOvalada.bottom} onChange={(e) => handleConfigChange('ladosOvalada', 'bottom', e.target.value, 4)} className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white shadow-sm" /></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">Media Luna Izq. (Máx. 3)</label><input type="number" min="0" max="3" value={configActual.ladosOvalada.left} onChange={(e) => handleConfigChange('ladosOvalada', 'left', e.target.value, 3)} className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white shadow-sm" /></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">Media Luna Der. (Máx. 3)</label><input type="number" min="0" max="3" value={configActual.ladosOvalada.right} onChange={(e) => handleConfigChange('ladosOvalada', 'right', e.target.value, 3)} className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white shadow-sm" /></div>
            </div>
          </div>
        );
      case 'serpentina':
        const maxS = modelosSerpentina[configActual.modeloSerpentina].max;
        return (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 animate-in fade-in">
            <label className="block text-xs font-bold mb-2 text-slate-700">Modelo de Serpentina (1/4 Círculo)</label>
            <select value={configActual.modeloSerpentina} onChange={(e) => handleConfigChange('serpentina_modelo', null, e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white shadow-sm font-bold text-sm mb-4 text-indigo-600">
              {Object.entries(modelosSerpentina).map(([key, val]) => (
                <option key={key} value={key}>{val.nombre} (Máx. {val.max.ext + val.max.int + val.max.izq + val.max.der} sillas)</option>
              ))}
            </select>

            <label className="block text-xs font-bold mb-3 text-slate-700 border-b border-slate-200 pb-2">Distribución de Sillas</label>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">Arco Exterior (Máx. {maxS.ext})</label><input type="number" min="0" max={maxS.ext} value={configActual.ladosSerpentina.ext} onChange={(e) => handleConfigChange('ladosSerpentina', 'ext', e.target.value, maxS.ext)} className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white shadow-sm" /></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">Arco Interior (Máx. {maxS.int})</label><input type="number" min="0" max={maxS.int} value={configActual.ladosSerpentina.int} onChange={(e) => handleConfigChange('ladosSerpentina', 'int', e.target.value, maxS.int)} className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white shadow-sm" /></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">Ancho Izq. (Máx. {maxS.izq})</label><input type="number" min="0" max={maxS.izq} value={configActual.ladosSerpentina.izq} onChange={(e) => handleConfigChange('ladosSerpentina', 'izq', e.target.value, maxS.izq)} className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white shadow-sm" /></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">Ancho Der. (Máx. {maxS.der})</label><input type="number" min="0" max={maxS.der} value={configActual.ladosSerpentina.der} onChange={(e) => handleConfigChange('ladosSerpentina', 'der', e.target.value, maxS.der)} className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white shadow-sm" /></div>
            </div>
          </div>
        );
      case 'personalizada':
      case 'libre':
        // Protección contra mesas antiguas sin datos de medidas
        const largoVal = configActual.libreMedidas?.largo || 2.0;
        const anchoVal = configActual.libreMedidas?.ancho || 1.0;
        const maxLargo = Math.floor(largoVal / 0.5);
        const maxAncho = Math.floor(anchoVal / 0.5);
        
        // Protección para los lados
        const lTop = configActual.ladosLibre?.top || 0;
        const lBot = configActual.ladosLibre?.bottom || 0;
        const lLeft = configActual.ladosLibre?.left || 0;
        const lRight = configActual.ladosLibre?.right || 0;

        return (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 animate-in fade-in">
            <div className="bg-indigo-50 border border-indigo-100 p-2.5 rounded-lg mb-4 text-[10px] text-indigo-700 flex items-start">
              <Info size={14} className="mr-1.5 flex-shrink-0 mt-0.5"/>
              <span><b>Regla estricta:</b> Cada silla requiere mínimo <b>0.5 metros lineales</b>. Ajusta las dimensiones de la mesa y el sistema calculará el límite físico.</span>
            </div>

            <label className="block text-xs font-bold mb-3 text-slate-700 border-b border-slate-200 pb-2">1. Dimensiones de la Mesa Fija (Metros)</label>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Largo (m)</label>
                <input type="number" step="0.5" min="0.5" value={largoVal} onChange={(e) => handleConfigChange('medidas_libre', 'largo', e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white shadow-sm font-bold text-indigo-600" />
                <p className="text-[9px] text-slate-400 mt-1">Máx. {maxLargo} sillas por lado largo.</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Ancho / Cabecera (m)</label>
                <input type="number" step="0.5" min="0.5" value={anchoVal} onChange={(e) => handleConfigChange('medidas_libre', 'ancho', e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white shadow-sm font-bold text-indigo-600" />
                <p className="text-[9px] text-slate-400 mt-1">Máx. {maxAncho} sillas por cabecera.</p>
              </div>
            </div>

            <label className="block text-xs font-bold mb-3 text-slate-700 border-b border-slate-200 pb-2">2. Distribución Exacta</label>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">Lado Largo Arriba</label><input type="number" min="0" max={maxLargo} value={lTop} onChange={(e) => handleConfigChange('ladosLibre', 'top', e.target.value, maxLargo)} className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white shadow-sm" /></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">Lado Largo Abajo</label><input type="number" min="0" max={maxLargo} value={lBot} onChange={(e) => handleConfigChange('ladosLibre', 'bottom', e.target.value, maxLargo)} className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white shadow-sm" /></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">Cabecera Izquierda</label><input type="number" min="0" max={maxAncho} value={lLeft} onChange={(e) => handleConfigChange('ladosLibre', 'left', e.target.value, maxAncho)} className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white shadow-sm" /></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">Cabecera Derecha</label><input type="number" min="0" max={maxAncho} value={lRight} onChange={(e) => handleConfigChange('ladosLibre', 'right', e.target.value, maxAncho)} className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white shadow-sm" /></div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center bg-white p-2 rounded-lg">
              <span className="text-xs font-bold text-slate-500">Capacidad Total Resultante:</span>
              <span className="font-black text-lg text-emerald-600">{lTop + lBot + lLeft + lRight} pases</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 pb-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestión de Mesas y Acomodo</h2>
          <p className="text-slate-500 text-sm mt-1">Arrastra invitados a las mesas, o tócalos para seleccionarlos.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
           <button onClick={handleAutoAssign} className="flex-1 md:flex-none flex items-center justify-center px-4 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors shadow-sm">
              <Wand2 size={16} className="mr-2" /> Auto-Acomodar
           </button>
           <button onClick={emptyAllTables} className="flex-1 md:flex-none px-4 py-2.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl text-sm font-bold hover:bg-amber-100 transition-colors">
              Vaciar
           </button>
           <button onClick={deleteAllTables} className="flex-1 md:flex-none px-4 py-2.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-sm font-bold hover:bg-rose-100 transition-colors">
              Borrar Mesas
           </button>
           <button onClick={() => setIsAddModalOpen(true)} className="flex-1 md:flex-none flex items-center justify-center px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-sm hover:bg-indigo-700 transition-colors">
              <Plus size={18} className="mr-2" /> Nuevas Mesas
           </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
        
        {/* PANEL IZQUIERDO: INVITADOS SIN MESA */}
        <div 
          className={`w-full lg:w-72 bg-white rounded-2xl border flex flex-col transition-colors ${guestSeleccionado ? 'border-indigo-300 shadow-md' : 'border-slate-200'}`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, null)}
          onClick={() => { if(guestSeleccionado) moverInvitado(guestSeleccionado.id, null); }}
        >
          <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
            <h3 className="font-bold text-slate-700 flex items-center"><Users size={16} className="mr-2 text-indigo-500"/> No Asignados ({invitadosSinMesa.length})</h3>
            <p className="text-[10px] text-slate-500 mt-1">Arrastra un invitado o dale clic para moverlo.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-slate-50/50">
            {invitadosSinMesa.map(g => (
              <div 
                key={g.id}
                draggable
                onDragStart={(e) => handleDragStart(e, g.id)}
                onClick={(e) => { e.stopPropagation(); handleGuestClick(g); }}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all shadow-sm ${guestSeleccionado?.id === g.id ? 'bg-indigo-600 border-indigo-700 text-white transform scale-[1.02]' : 'bg-white border-slate-200 hover:border-indigo-300 text-slate-700'}`}
              >
                <div className="flex items-center truncate">
                  <GripVertical size={14} className={`mr-2 ${guestSeleccionado?.id === g.id ? 'text-indigo-400' : 'text-slate-400 cursor-grab'}`} />
                  <span className="font-bold text-sm truncate">{g.name}</span>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${guestSeleccionado?.id === g.id ? 'bg-white text-indigo-700' : 'bg-indigo-50 text-indigo-700'}`}>
                  {g.passes}p
                </span>
              </div>
            ))}
            {invitadosSinMesa.length === 0 && (
              <div className="text-center p-6 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">Todos están asignados.</div>
            )}
          </div>
        </div>

        {/* PANEL DERECHO: GRID DE MESAS */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {safeTables.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200 h-full flex flex-col items-center justify-center">
              <LayoutGrid size={48} className="mx-auto mb-4 text-slate-300"/>
              <h3 className="text-xl font-bold text-slate-700">Aún no hay mesas creadas</h3>
              <p className="text-slate-500 text-sm mb-4">Puedes agregarlas manualmente o usar el botón Auto-Acomodar para generarlas por ti.</p>
              <button onClick={() => setIsAddModalOpen(true)} className="px-6 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-colors">Crear Mesas Manual</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-10">
              {safeTables.map(table => {
                const assignedGuests = safeGuests.filter(g => g.tableId === table.id);
                const usedChairs = assignedGuests.reduce((sum, g) => sum + g.passes, 0);
                const isFull = usedChairs >= table.capacity;

                return (
                  <div 
                    key={table.id} 
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, table.id)}
                    onClick={() => handleTableClick(table.id)}
                    className={`bg-white p-4 rounded-2xl border shadow-sm flex flex-col relative group transition-all ${guestSeleccionado && !isFull ? 'border-indigo-400 bg-indigo-50/30 cursor-pointer shadow-md' : 'border-slate-200 hover:border-indigo-200'}`}
                  >
                    <div className="absolute top-3 right-3 flex opacity-0 group-hover:opacity-100 transition-opacity space-x-1 z-50">
                       <button onClick={(e) => { e.stopPropagation(); setTableToEdit(table); setCurrentConfig(table.configDetalle || configActual); setCreationMode('edit'); setIsAddModalOpen(true); }} className="p-1 text-slate-400 hover:text-indigo-500 bg-slate-50 border border-slate-200 rounded" title="Editar Configuración"><Edit2 size={14}/></button>
                       <button onClick={(e) => { e.stopPropagation(); emptyTable(table.id); }} className="p-1 text-slate-400 hover:text-amber-500 bg-slate-50 border border-slate-200 rounded" title="Vaciar Sillas"><Users size={14}/></button>
                       <button onClick={(e) => { e.stopPropagation(); deleteTable(table.id); }} className="p-1 text-slate-400 hover:text-rose-500 bg-slate-50 border border-slate-200 rounded" title="Eliminar Mesa"><Trash2 size={14}/></button>
                    </div>
                    
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mr-3 border border-slate-100">
                        {getTipoIcon(table.tipo, table.configDetalle?.formaPersonalizada)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-md leading-tight">{table.name}</h4>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                           {table.tipo === 'personalizada' ? table.configDetalle?.formaPersonalizada || 'Libre' : table.tipo}
                        </p>
                      </div>
                    </div>

                    <div className="mt-1 mb-3 bg-slate-50 rounded-xl p-2 border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center text-xs font-bold text-slate-700">
                        <Users size={14} className="mr-1.5 text-indigo-500"/> {usedChairs} / {table.capacity}
                      </div>
                      {isFull ? <span className="text-[9px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded font-black uppercase">Llena</span> : <span className="text-[9px] text-slate-400">Suelta aquí</span>}
                    </div>

                    <div className="mt-auto border-t border-slate-100 pt-2 min-h-[60px] flex flex-wrap gap-1 content-start">
                      {assignedGuests.map(g => (
                        <div 
                          key={g.id} 
                          draggable
                          onDragStart={(e) => handleDragStart(e, g.id)}
                          onClick={(e) => { e.stopPropagation(); handleGuestClick(g); }}
                          className={`text-[10px] px-2 py-1 rounded-md font-medium truncate flex items-center cursor-grab shadow-sm border transition-colors ${guestSeleccionado?.id === g.id ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'}`}
                        >
                          {g.name} <span className="ml-1 opacity-60 font-black">({g.passes})</span>
                        </div>
                      ))}
                      {assignedGuests.length === 0 && <span className="text-xs text-slate-300 italic w-full text-center mt-2">Mesa vacía</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ASISTENTE INTELIGENTE AUTO-ACOMODAR */}
      {smartAssign && (
        <div className="fixed inset-0 z-[105] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
                <Wand2 size={32} className="text-white"/>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">Asistente Inteligente</h3>
              <p className="text-indigo-100 text-sm">Te faltan mesas para acomodar a todos.</p>
            </div>
            
            <div className="p-6">
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 mb-6 text-center">
                <p className="text-sm font-bold text-rose-800">Tienes {smartAssign.faltantes} invitados sin asiento disponible.</p>
                <p className="text-xs text-rose-600 mt-1">¿Qué tipo de mesas deseas que genere en automático para ellos?</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button onClick={() => generarYAsignarMagico('redondas')} className="w-full p-3 border-2 border-slate-200 rounded-xl flex flex-col items-center text-center hover:border-indigo-500 hover:bg-indigo-50 transition-all group">
                  <Circle size={24} className="text-rose-500 mb-2"/>
                  <p className="font-bold text-slate-800 text-xs">Redondas</p>
                  <p className="text-[9px] text-slate-500 mb-2">10 Sillas c/u</p>
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded group-hover:bg-indigo-100 group-hover:text-indigo-700">+{Math.ceil(smartAssign.faltantes/10)} mesas</span>
                </button>

                <button onClick={() => generarYAsignarMagico('tablones')} className="w-full p-3 border-2 border-slate-200 rounded-xl flex flex-col items-center text-center hover:border-indigo-500 hover:bg-indigo-50 transition-all group">
                  <RectangleHorizontal size={24} className="text-amber-500 mb-2"/>
                  <p className="font-bold text-slate-800 text-xs">Tablones</p>
                  <p className="text-[9px] text-slate-500 mb-2">12 Sillas c/u</p>
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded group-hover:bg-indigo-100 group-hover:text-indigo-700">+{Math.ceil(smartAssign.faltantes/12)} mesas</span>
                </button>

                <button onClick={() => generarYAsignarMagico('cuadradas')} className="w-full p-3 border-2 border-slate-200 rounded-xl flex flex-col items-center text-center hover:border-indigo-500 hover:bg-indigo-50 transition-all group">
                  <Square size={24} className="text-sky-500 mb-2"/>
                  <p className="font-bold text-slate-800 text-xs">Cuadradas</p>
                  <p className="text-[9px] text-slate-500 mb-2">12 Sillas c/u</p>
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded group-hover:bg-indigo-100 group-hover:text-indigo-700">+{Math.ceil(smartAssign.faltantes/12)} mesas</span>
                </button>

                <button onClick={() => generarYAsignarMagico('ovaladas')} className="w-full p-3 border-2 border-slate-200 rounded-xl flex flex-col items-center text-center hover:border-indigo-500 hover:bg-indigo-50 transition-all group">
                  <div className="w-8 h-4 rounded-[50%] border-2 border-indigo-500 mb-2"></div>
                  <p className="font-bold text-slate-800 text-xs">Ovaladas</p>
                  <p className="text-[9px] text-slate-500 mb-2">14 Sillas c/u</p>
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded group-hover:bg-indigo-100 group-hover:text-indigo-700">+{Math.ceil(smartAssign.faltantes/14)} mesas</span>
                </button>

                <button onClick={() => generarYAsignarMagico('serpentinas')} className="w-full p-3 border-2 border-slate-200 rounded-xl flex flex-col items-center text-center hover:border-indigo-500 hover:bg-indigo-50 transition-all group">
                  <Spline size={24} className="text-teal-500 mb-2"/>
                  <p className="font-bold text-slate-800 text-xs">Serpentinas</p>
                  <p className="text-[9px] text-slate-500 mb-2">9 Sillas c/u</p>
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded group-hover:bg-indigo-100 group-hover:text-indigo-700">+{Math.ceil(smartAssign.faltantes/9)} mesas</span>
                </button>

                <button onClick={() => generarYAsignarMagico('mixto')} className="w-full p-3 border-2 border-slate-200 rounded-xl flex flex-col items-center text-center hover:border-indigo-500 hover:bg-indigo-50 transition-all group">
                  <Wand2 size={24} className="text-purple-500 mb-2"/>
                  <p className="font-bold text-slate-800 text-xs">Mezcla 50/50</p>
                  <p className="text-[9px] text-slate-500 mb-2">Redonda y Tablón</p>
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded group-hover:bg-indigo-100 group-hover:text-indigo-700">Magia</span>
                </button>
              </div>

              <button onClick={() => setSmartAssign(null)} className="w-full py-3 mt-4 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">Cancelar y hacer manual</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GENERADOR DE MESAS MANUAL AVANZADO */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-bold text-xl text-slate-800 flex items-center"><LayoutGrid size={20} className="mr-2 text-indigo-600"/> Configurar Mesas</h3>
              <button onClick={() => setIsAddModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-800"/></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex p-1 bg-slate-100 rounded-xl mb-4">
                <button onClick={() => {setCreationMode('iguales'); setTableToEdit(null);}} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${creationMode === 'iguales' && !tableToEdit ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Todas Iguales</button>
                <button onClick={() => {setCreationMode('variedad'); setTableToEdit(null);}} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${creationMode === 'variedad' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Crear Variedad</button>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 p-2.5 rounded-lg mb-4 text-[10px] text-indigo-700 flex items-start">
                <Info size={16} className="mr-1.5 flex-shrink-0 mt-0.5"/>
                <span><b>Tips:</b> Al seleccionar un tipo de mesa, se mostrará por defecto su <b>capacidad máxima física</b>. Puedes reducir el número de sillas si así lo requiere tu evento.</span>
              </div>

              <label className="block text-xs font-bold mb-2 text-slate-700">Forma de la mesa</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
                {[
                  { id: 'redonda', lbl: 'Redonda', icon: <Circle size={24} className="mb-1"/>, action: () => setCurrentConfig({...configActual, tipo: 'redonda', capacidadRedonda: 10}) },
                  { id: 'cuadrada', lbl: 'Cuadrada', icon: <Square size={24} className="mb-1"/>, action: () => setCurrentConfig({...configActual, tipo: 'cuadrada', ladosCuadrada: {top:3, right:3, bottom:3, left:3}}) },
                  { id: 'tablon', lbl: 'Tablón', icon: <RectangleHorizontal size={24} className="mb-1"/>, action: () => setCurrentConfig({...configActual, tipo: 'tablon', ladosTablon: {top:5, bottom:5, left:1, right:1}}) },
                  { id: 'ovalada', lbl: 'Ovalada', icon: <div className={`w-8 h-4 rounded-[50%] border-2 mb-1 ${configActual.tipo === 'ovalada' ? 'border-indigo-500' : 'border-slate-400'}`}></div>, action: () => setCurrentConfig({...configActual, tipo: 'ovalada', ladosOvalada: {top:4, bottom:4, left:3, right:3}}) },
                  { id: 'serpentina', lbl: 'Curva', icon: <Spline size={24} className="mb-1"/>, action: () => setCurrentConfig({...configActual, tipo: 'serpentina', modeloSerpentina: 'mod4', ladosSerpentina: {ext:5, int:2, izq:1, der:1}}) },
                  { id: 'personalizada', lbl: 'Libre', icon: <Settings2 size={24} className="mb-1"/>, action: () => setCurrentConfig({...configActual, tipo: 'personalizada'}) },
                ].map(b => (
                  <button key={b.id} onClick={(e) => { e.preventDefault(); b.action(); }} className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${configActual.tipo === b.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-indigo-300'}`}>
                    {b.icon}
                    <span className="text-[10px] font-bold uppercase">{b.lbl}</span>
                  </button>
                ))}
              </div>

              {renderConfigForm()}

              <div className="mt-6 border-t border-slate-100 pt-4">
                <label className="block text-xs font-bold mb-2 text-slate-700">¿Cuántas mesas de este tipo agregarás?</label>
                <div className="flex items-center gap-4">
                  <input type="number" min="1" value={cantidadIguales} onChange={(e) => { let v = parseInt(e.target.value); if(v>0) setCantidadIguales(v); }} className="w-24 p-3 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 font-bold text-center text-lg bg-slate-50" />
                  
                  {creationMode === 'variedad' && (
                    <button onClick={agregarAVariedad} className="flex-1 py-3 bg-indigo-100 text-indigo-700 font-bold rounded-xl hover:bg-indigo-200 transition-colors flex items-center justify-center">
                      <Plus size={18} className="mr-2"/> Añadir a la mezcla
                    </button>
                  )}
                </div>
              </div>

              {creationMode === 'variedad' && mezclaVariedad.length > 0 && (
                <div className="mt-6 bg-slate-800 rounded-2xl p-4 text-white animate-in slide-in-from-bottom-4">
                  <h4 className="text-sm font-bold mb-3 border-b border-slate-700 pb-2">Paquete a generar:</h4>
                  <ul className="space-y-2 mb-4 max-h-32 overflow-y-auto custom-scrollbar">
                    {mezclaVariedad.map(item => (
                      <li key={item.id} className="flex items-center justify-between text-xs bg-slate-700/50 p-2 rounded-lg">
                        <div className="flex items-center">
                          <span className="font-black text-indigo-300 mr-2">{item.cantidad}x</span> 
                          <span className="uppercase">{item.config.tipo === 'personalizada' ? item.config.formaPersonalizada : item.config.tipo}</span> 
                          <span className="text-slate-400 ml-1">({item.config.capacidadCalculada} sillas)</span>
                        </div>
                        <button onClick={() => eliminarDeVariedad(item.id)} className="text-slate-400 hover:text-rose-400"><Trash2 size={14}/></button>
                      </li>
                    ))}
                  </ul>
                  <div className="text-right text-xs font-bold text-indigo-300">Total a crear: {mezclaVariedad.reduce((acc, curr) => acc + curr.cantidad, 0)} mesas</div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-white shrink-0">
              {creationMode === 'iguales' ? (
                <button onClick={generarMesas} className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:bg-indigo-700 transition-colors text-lg">
                  {creationMode === 'edit' ? 'Guardar Cambios de Mesa' : `Generar ${cantidadIguales} Mesa${cantidadIguales > 1 ? 's' : ''}`}
                </button>
              ) : (
                <button onClick={generarMesas} disabled={mezclaVariedad.length === 0} className={`w-full py-3.5 rounded-xl font-bold shadow-md transition-colors text-lg ${mezclaVariedad.length > 0 ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                  Generar Mezcla Completa
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    {/* MODAL: SEPARAR FAMILIA O MOVER GRUPO */}
      {guestSplitPrompt && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden p-6 text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4"><Users size={32} /></div>
            <h3 className="font-bold text-xl text-slate-800 mb-2">Mover Invitado</h3>
            <p className="text-slate-500 mb-6 text-sm"><b>{guestSplitPrompt.guest.name}</b> tiene {guestSplitPrompt.guest.passes} pases. ¿Deseas mover a toda la familia a la nueva mesa o separar solo 1 pase?</p>
            <div className="flex flex-col space-y-2">
              <button onClick={() => handleSplitChoice('all')} className="w-full p-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm">Mover toda la familia ({guestSplitPrompt.guest.passes})</button>
              <button onClick={() => handleSplitChoice('one')} className="w-full p-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Separar 1 pase individual</button>
              <button onClick={() => setGuestSplitPrompt(null)} className="w-full p-3 text-slate-400 font-bold hover:text-slate-600 mt-2 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const TABLE_TEMPLATES = [
  { type: 'round_table', name: 'Mesa Redonda', width: 1.5, height: 1.5, capacity: 10, desc: 'Ø 1.5m' },
  { type: 'square_table', name: 'Mesa Cuadrada', width: 1.5, height: 1.5, capacity: 12, desc: '1.5x1.5m' },
  { type: 'rect_table', name: 'Tablón', width: 2.44, height: 0.7, capacity: 10, desc: '2.4x0.7m' },
  { type: 'ovalada', name: 'Mesa Ovalada', width: 3.05, height: 1.22, capacity: 12, desc: '3.0x1.2m' },
  { type: 'serpentina', name: 'Serpentina', width: 1.8, height: 1.8, capacity: 10, desc: 'Curva' }
];

const STRUCTURAL_CATALOG = [
  { type: 'dance_floor', name: 'Pista Baile', width: 5, height: 5, shape: 'rounded-none', color: 'border-fuchsia-400 text-fuchsia-900', texture: 'dance', desc: '5x5m' },
  { type: 'stage', name: 'Escenario', width: 6, height: 3, shape: 'rounded-sm', color: 'border-amber-900 text-amber-50', texture: 'wood', desc: '6x3m' },
  { type: 'bar', name: 'Barra', width: 3, height: 0.8, shape: 'rounded-sm', color: 'border-zinc-800 text-white', texture: 'marble', desc: '3x0.8m' },
  { type: 'garden', name: 'Jardín', width: 6, height: 4, shape: 'rounded-xl', color: 'border-green-600 text-green-900', texture: 'grass', desc: 'Área Verde' },
  { type: 'pool', name: 'Alberca', width: 6, height: 4, shape: 'rounded-lg', color: 'border-cyan-500 text-cyan-900', texture: 'water', desc: 'Piscina' }
];

const ROOM_AREAS_CATALOG = [
  { type: 'room_area', shapeType: 'rect', name: 'Área Cuadrada', width: 8, height: 8, isRoomArea: true, mode: 'add' },
  { type: 'room_area', shapeType: 'ellipse', name: 'Área Circular', width: 8, height: 8, isRoomArea: true, mode: 'add' },
  { type: 'room_area', shapeType: 'triangle', name: 'Área Triangular', width: 8, height: 8, isRoomArea: true, triangleCorner: 0, mode: 'add' }, 
  { type: 'room_area', shapeType: 'polygon', name: 'Polígono Libre', width: 8, height: 8, isRoomArea: true, sides: 5, mode: 'add' },
  // NUEVOS EXTERIORES COMO ÁREAS (Modo Overlay)
  { type: 'room_area', shapeType: 'rect', name: 'Jardín', width: 10, height: 10, isRoomArea: true, mode: 'overlay', texture: 'grass' },
  { type: 'room_area', shapeType: 'rect', name: 'Terraza', width: 10, height: 6, isRoomArea: true, mode: 'overlay', texture: 'wood' },
  { type: 'room_area', shapeType: 'pool', name: 'Alberca', width: 8, height: 4, isRoomArea: true, mode: 'overlay', texture: 'water' }
];

const getShapeClipPath = (el) => {
  if (el.shapeType === 'ellipse') return 'ellipse(50% 50% at 50% 50%)';
  if (el.shapeType === 'triangle') {
    const c = el.triangleCorner || 0;
    if (c === 0) return 'polygon(0% 0%, 0% 100%, 100% 100%)'; 
    if (c === 1) return 'polygon(0% 100%, 100% 100%, 100% 0%)'; 
    if (c === 2) return 'polygon(0% 0%, 100% 0%, 100% 100%)'; 
    if (c === 3) return 'polygon(0% 0%, 100% 0%, 0% 100%)'; 
  }
  if (el.shapeType === 'polygon') {
    const sides = el.sides || 5;
    let pts = [];
    for(let i=0; i<sides; i++){
      const angle = (i * 2 * Math.PI / sides) - Math.PI / 2;
      pts.push(`${(50 + 50 * Math.cos(angle)).toFixed(1)}% ${(50 + 50 * Math.sin(angle)).toFixed(1)}%`);
    }
    return `polygon(${pts.join(', ')})`;
  }
  return 'none';
};

const renderSVGShape = (el, scale, minX, minY, props) => {
  // ---> DIBUJO EXACTO DE LA FORMA DEL LÁPIZ EN SVG <---
  if (el.shapeType === 'custom_polygon' && el.absPoints) {
      const pts = el.absPoints.map(p => `${(p.x - minX) * scale},${(p.y - minY) * scale}`).join(' ');
      // Para trazo libre no aplicamos rotación externa, la rotación ya está en los puntos absolutos
      return <polygon key={el.id} points={pts} {...props} />;
  }

  // Cálculo para formas regulares predefinidas (requieren rotación central)
  const w = el.width * scale;
  const h = el.height * scale;
  const x = (el.x - minX) * scale;
  const y = (el.y - minY) * scale;
  const tRegular = `rotate(${el.rotation || 0} ${x + w/2} ${y + h/2})`;

  if (el.shapeType === 'ellipse') {
    return <ellipse key={el.id} cx={x + w/2} cy={y + h/2} rx={w/2} ry={h/2} transform={tRegular} {...props} />;
  }
  if (el.shapeType === 'triangle') {
    let points = '';
    const corner = el.triangleCorner || 0; 
    if (corner === 0) points = `${x},${y} ${x},${y + h} ${x + w},${y + h}`; 
    else if (corner === 1) points = `${x},${y + h} ${x + w},${y + h} ${x + w},${y}`; 
    else if (corner === 2) points = `${x},${y} ${x + w},${y} ${x + w},${y + h}`; 
    else if (corner === 3) points = `${x},${y} ${x + w},${y} ${x},${y + h}`; 
    return <polygon key={el.id} points={points} transform={tRegular} {...props} />;
  }
  // Polígonos regulares SVG
  if (el.sides && el.sides > 2) {
    const sides = el.sides;
    const cx = x + w/2; const cy = y + h/2;
    const rX = w / 2; const rY = h / 2;
    let points = [];
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI / sides) - Math.PI / 2;
      points.push(`${cx + rX * Math.cos(angle)},${cy + rY * Math.sin(angle)}`);
    }
    return <polygon key={el.id} points={points.join(' ')} transform={tRegular} {...props} />;
  }
  
  // Fallback final: Rectángulo
  return <rect key={el.id} x={x} y={y} width={w} height={h} transform={tRegular} {...props} />;
};

const TableWithChairs = ({ tableData, occupancy, scale, tableGuests = [], searchQuery = '' }) => {
  const cap = tableData.capacity;
  const chairSize = 0.45 * scale; 
  const tipo = tableData.tipo || tableData.type;
  const config = tableData.configDetalle;

  let wMeters = tableData.width || 1.5;
  let hMeters = tableData.height || 1.5;
  let widthT_meters = 0.8; 

  if (tipo === 'rect_table' || tipo === 'tablon') { wMeters = 2.44; hMeters = 0.7; } 
  else if (tipo === 'ovalada') { wMeters = 3.05; hMeters = 1.22; } 
  else if (tipo === 'serpentina') { 
    let arcLength = 2.44;
    if (config?.modeloSerpentina === 'mod1') { arcLength = 1.58; widthT_meters = 0.75; }
    if (config?.modeloSerpentina === 'mod2') { arcLength = 2.00; widthT_meters = 0.75; }
    if (config?.modeloSerpentina === 'mod3') { arcLength = 2.10; widthT_meters = 0.75; }
    if (config?.modeloSerpentina === 'mod4') { arcLength = 2.44; widthT_meters = 0.90; }
    wMeters = arcLength / (Math.PI / 2); hMeters = wMeters; 
  } else if (tipo === 'personalizada' || tipo === 'libre') { 
    wMeters = config?.libreMedidas?.largo || 2.0; hMeters = config?.libreMedidas?.ancho || 1.0; 
  }

  const tableW = wMeters * scale;
  const tableH = hMeters * scale;
  const padding = 0.08 * scale;
  const chairs = [];

  const seatAssignments = [];
  if (tableGuests && tableGuests.length > 0) {
    tableGuests.forEach(g => {
      for (let p = 0; p < (g.passes || 1); p++) {
        seatAssignments.push({ guest: g, label: g.name + ((g.passes || 1) > 1 ? ` (Pase ${p + 1})` : '') });
      }
    });
  }

  for (let i = 0; i < cap; i++) {
    const isOccupied = i < occupancy;
    let cx = 0, cy = 0, angleDeg = 0;

    if (tipo === 'round_table' || tipo === 'redonda') {
      angleDeg = i * (360 / cap);
      const aRad = angleDeg * (Math.PI / 180);
      const rX = (tableW / 2) + (chairSize / 2) + padding;
      const rY = (tableH / 2) + (chairSize / 2) + padding;
      cx = (tableW / 2) + rX * Math.cos(aRad) - (chairSize / 2);
      cy = (tableH / 2) + rY * Math.sin(aRad) - (chairSize / 2);
    } else if (tipo === 'ovalada') {
      const topCap = config ? config.ladosOvalada.top : 4;
      const botCap = config ? config.ladosOvalada.bottom : 4;
      const leftCap = config ? config.ladosOvalada.left : Math.floor((cap - topCap - botCap) / 2);
      const radius = tableH / 2; const straightW = tableW - tableH; 
      
      if (i < topCap) {
        if (topCap === 1) cx = tableW / 2 - chairSize/2;
        else cx = radius + ((straightW / (topCap - 1)) * i) - chairSize/2;
        cy = -(chairSize + padding); angleDeg = 270;
      } else if (i < topCap + botCap) {
        const idx = i - topCap;
        if (botCap === 1) cx = tableW / 2 - chairSize/2;
        else cx = radius + ((straightW / (botCap - 1)) * idx) - chairSize/2;
        cy = tableH + padding; angleDeg = 90;
      } else if (i < topCap + botCap + leftCap) {
        const idx = i - (topCap + botCap);
        const aRad = (90 + (180 / (leftCap + 1)) * (idx + 1)) * (Math.PI/180);
        const R = radius + chairSize/2 + padding;
        cx = radius + R * Math.cos(aRad) - chairSize/2; cy = radius - R * Math.sin(aRad) - chairSize/2;
        angleDeg = 360 - (90 + (180 / (leftCap + 1)) * (idx + 1)); 
      } else {
        const rightCap = cap - (topCap + botCap + leftCap);
        const idx = i - (topCap + botCap + leftCap);
        const aRad = (-90 + (180 / (rightCap + 1)) * (idx + 1)) * (Math.PI/180);
        const R = radius + chairSize/2 + padding;
        cx = (tableW - radius) + R * Math.cos(aRad) - chairSize/2; cy = radius - R * Math.sin(aRad) - chairSize/2;
        angleDeg = 360 - (-90 + (180 / (rightCap + 1)) * (idx + 1)); 
      }
    } else if (tipo === 'serpentina') {
      const extCap = config ? config.ladosSerpentina.ext : Math.ceil(cap/2);
      const intCap = config ? config.ladosSerpentina.int : Math.floor(cap/2) - 2;
      const izqCap = config ? config.ladosSerpentina.izq : 1;
      const widthT = widthT_meters * scale;
      
      if (i < extCap) {
         const aRad = ((90 / (extCap + 1)) * (i + 1)) * (Math.PI/180);
         const R = tableW + chairSize/2 + padding;
         cx = R * Math.cos(aRad) - chairSize/2; cy = tableW - R * Math.sin(aRad) - chairSize/2;
         angleDeg = 360 - ((90 / (extCap + 1)) * (i + 1)); 
      } else if (i < extCap + intCap) {
         const idx = i - extCap;
         let aDeg = 45; 
         if (intCap > 1) aDeg = 15 + (idx * ((90 - 30) / (intCap - 1)));
         const aRad = aDeg * (Math.PI/180);
         const R = tableW - widthT - chairSize/2 - padding;
         cx = R * Math.cos(aRad) - chairSize/2; cy = tableW - R * Math.sin(aRad) - chairSize/2;
         angleDeg = 180 - aDeg; 
      } else if (i < extCap + intCap + izqCap) {
         cx = -(chairSize + padding); cy = (widthT / 2) - chairSize/2; angleDeg = 180; 
      } else {
         cx = tableW - (widthT / 2) - chairSize/2; cy = tableW + padding; angleDeg = 90; 
      }
    } else if (tipo === 'square_table' || tipo === 'cuadrada') {
      const topCap = config?.ladosCuadrada?.top ?? Math.ceil(cap / 4);
      const botCap = config?.ladosCuadrada?.bottom ?? Math.ceil(cap / 4);
      const leftCap = config?.ladosCuadrada?.left ?? Math.ceil(cap / 4);
      
      if (i < topCap) {
        cx = ((tableW / (topCap || 1)) * (i + 0.5)) - chairSize/2; cy = -(chairSize + padding); angleDeg = 270;
      } else if (i < topCap + botCap) {
        cx = ((tableW / (botCap || 1)) * ((i - topCap) + 0.5)) - chairSize/2; cy = tableH + padding; angleDeg = 90;
      } else if (i < topCap + botCap + leftCap) {
        cx = -(chairSize + padding); cy = ((tableH / (leftCap || 1)) * ((i - (topCap + botCap)) + 0.5)) - chairSize/2; angleDeg = 180;
      } else {
        const rightCap = cap - topCap - botCap - leftCap;
        cx = tableW + padding; cy = ((tableH / (rightCap || 1)) * ((i - (topCap + botCap + leftCap)) + 0.5)) - chairSize/2; angleDeg = 0;
      }
    } else {
      // Tablón o Libre
      const topCap = config?.ladosTablon?.top ?? config?.ladosLibre?.top ?? Math.floor((cap - 2) / 2);
      const botCap = config?.ladosTablon?.bottom ?? config?.ladosLibre?.bottom ?? Math.ceil((cap - 2) / 2);
      const leftCap = config?.ladosTablon?.left ?? config?.ladosLibre?.left ?? 1;
      
      if (i < topCap) {
        cx = ((tableW / (topCap || 1)) * (i + 0.5)) - chairSize/2; cy = -(chairSize + padding); angleDeg = 270;
      } else if (i < topCap + botCap) {
        cx = ((tableW / (botCap || 1)) * ((i - topCap) + 0.5)) - chairSize/2; cy = tableH + padding; angleDeg = 90;
      } else if (i < topCap + botCap + leftCap) {
        cx = -(chairSize + padding); cy = ((tableH / (leftCap || 1)) * ((i - (topCap + botCap)) + 0.5)) - chairSize/2; angleDeg = 180;
      } else {
        const rightCap = cap - topCap - botCap - leftCap;
        cx = tableW + padding; cy = ((tableH / (rightCap || 1)) * ((i - (topCap + botCap + leftCap)) + 0.5)) - chairSize/2; angleDeg = 0;
      }
    }

    const guestObj = seatAssignments[i];
    const guestName = guestObj ? guestObj.label : null;
    const chairGuestId = guestObj ? guestObj.guest.id : null;
    const totalRotation = angleDeg + (tableData.rotation || 0); 
    const isMatched = searchQuery && guestName && guestName.toLowerCase().includes(searchQuery.toLowerCase());
    const isTableMatched = searchQuery && tableData.name && tableData.name.toLowerCase().includes(searchQuery.toLowerCase());
    const activeSearchClasses = (isMatched || (isTableMatched && isOccupied)) ? 'ring-4 ring-amber-400 ring-offset-2 bg-amber-300 border-amber-600 scale-110 z-50' : (isOccupied ? 'bg-emerald-400 border-emerald-600' : 'bg-slate-100 border-slate-300');

    chairs.push(
      <div key={i} 
           draggable={!!chairGuestId}
           onDragStart={(e) => {
             if (chairGuestId) {
               e.dataTransfer.setData('guestId', chairGuestId);
               e.stopPropagation();
             }
           }}
           className={`group absolute flex items-center justify-center rounded-full border-[1.5px] shadow-sm transition-all duration-300 hover:z-50 ${chairGuestId ? 'cursor-grab pointer-events-auto' : 'pointer-events-none'} ${activeSearchClasses} z-0`} 
           style={{ left: cx, top: cy, width: chairSize, height: chairSize, transform: `rotate(${angleDeg}deg)` }}>
         <div className={`absolute w-[45%] h-[115%] right-[-12%] rounded-full shadow-sm transition-colors duration-300 ${isMatched || (isTableMatched && isOccupied) ? 'bg-amber-600' : (isOccupied ? 'bg-emerald-600' : 'bg-slate-300')}`}></div>
         {isOccupied && guestName && (
           <div className="absolute hidden group-hover:flex items-center justify-center bg-slate-800/95 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-2xl whitespace-nowrap z-[100] -top-8 pointer-events-none border border-slate-600 animate-in fade-in zoom-in-95 duration-200" style={{ transform: `rotate(-${totalRotation}deg)` }}>
             {guestName}
           </div>
         )}
      </div>
    );
  }

  const matchedNames = [];
  if (searchQuery) {
    seatAssignments.forEach(obj => {
      if (obj.label && obj.label.toLowerCase().includes(searchQuery.toLowerCase()) && !matchedNames.includes(obj.label)) matchedNames.push(obj.label);
    });
  }

  let innerContent = null;
  let shapeClass = 'rounded-sm shadow-lg';
  let borderClass = 'border-[3px]';
  let baseColor = 'bg-white border-slate-400 text-slate-800'; 

  if (tipo === 'round_table' || tipo === 'redonda' || tipo === 'ovalada') { shapeClass = 'rounded-[999px] shadow-lg'; } 
  else if (tipo === 'serpentina') {
    shapeClass = 'rounded-none'; borderClass = 'border-0'; baseColor = 'bg-transparent text-slate-800'; 
    const widthT = widthT_meters * scale;
    const innerR = tableW - widthT;
    innerContent = (
      <svg className="absolute inset-0 overflow-visible drop-shadow-md" style={{ zIndex: -1, width: tableW, height: tableW }}>
         <path d={`M 0 0 A ${tableW} ${tableW} 0 0 1 ${tableW} ${tableW} L ${tableW - widthT} ${tableW} A ${innerR} ${innerR} 0 0 0 0 ${widthT} Z`} fill="#ffffff" stroke="#94a3b8" strokeWidth="3" />
      </svg>
    );
  }

  return (
    <div style={{ width: tableW, height: tableH }} className="relative pointer-events-none">
      {chairs}
      <div className={`absolute inset-0 flex flex-col items-center justify-center z-10 ${shapeClass} ${borderClass} ${baseColor}`}>
        {innerContent}
        <div className="z-20 flex items-center justify-center pointer-events-none" style={{ transform: `rotate(-${tableData.rotation || 0}deg)` }}>
          <span className="font-black text-slate-400/70 select-none drop-shadow-sm" style={{ fontSize: `${Math.max(0.8, tableW * 0.02)}rem` }}>
            {tableData.name ? tableData.name.replace(/Mesa\s+/i, '').trim() : ''}
          </span>
        </div>
        {matchedNames.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[300]" style={{ transform: `rotate(-${tableData.rotation || 0}deg)` }}>
            <div className="absolute -top-12 flex flex-col items-center animate-in slide-in-from-bottom-2 duration-300">
              <div className="bg-slate-900/95 backdrop-blur-md text-amber-400 text-xs font-bold px-4 py-2 rounded-xl shadow-2xl border border-amber-500/40 text-center whitespace-nowrap flex flex-col gap-0.5">
                {matchedNames.map((n, idx) => <span key={idx}>{n}</span>)}
              </div>
              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-900/95 mt-[-1px]"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MapaView = ({ tables = [], setTables, guests = [], setGuests, globalSearch = '', elements = [], setElements }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [dragging, setDragging] = useState(null); 
  const [selectionBox, setSelectionBox] = useState(null); 
  const [snapGuides, setSnapGuides] = useState({ x: null, y: null });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(30);
  
  const [activeTool, setActiveTool] = useState('select'); 
  const [measureLine, setMeasureLine] = useState(null); 
  const [mousePos, setMousePos] = useState({x: 0, y: 0});
  
  const [history, setHistory] = useState([]);
  const [roomGrouped, setRoomGrouped] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [guestSplitPrompt, setGuestSplitPrompt] = useState(null); 

  // 🔴 ESTADOS PARA EL MOTOR PDF DEL MAPA
  const [showExportModal, setShowExportModal] = useState(false);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [isCapturingPdf, setIsCapturingPdf] = useState(false);
  const [printScale, setPrintScale] = useState(1);
  const [printPan, setPrintPan] = useState({ x: 0, y: 0 });
  const [isPrintDragging, setIsPrintDragging] = useState(false);
  const [printDragStart, setPrintDragStart] = useState({ x: 0, y: 0 });
  const [isBlueprintPanActive, setIsBlueprintPanActive] = useState(false);

  const placedTables = tables.filter(t => t.x !== undefined && t.x !== null);
  const availableTables = tables.filter(t => t.x === undefined || t.x === null);
  const allItems = [...elements, ...placedTables];
  
  const roomAreas = elements.filter(e => e.isRoomArea);
  const addAreas = roomAreas.filter(e => e.mode === 'add');
  const subAreas = roomAreas.filter(e => e.mode === 'subtract');
  const overlayAreas = roomAreas.filter(e => e.mode === 'overlay'); 
  const physicalStructures = elements.filter(e => !e.isRoomArea);
  const isMultiSelection = selectedIds.length > 1;

  const saveHistory = (currElements, currTables) => {
    setHistory(prev => [...prev.slice(-19), { elements: JSON.parse(JSON.stringify(currElements)), tables: JSON.parse(JSON.stringify(currTables)) }]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prevState = history[history.length - 1];
    setElements(prevState.elements);
    if (setTables) setTables(prevState.tables);
    setHistory(prev => prev.slice(0, -1));
    setSelectedIds([]);
  };

  const containerRef = useRef(null);
  const [vp, setVp] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const observeTarget = containerRef.current;
    if (!observeTarget) return;
    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setVp({ w: width, h: height });
    });
    resizeObserver.observe(observeTarget);
    return () => resizeObserver.disconnect();
  }, []);
  
  const centerAndFitMap = () => {
    if (vp.w === 0 || vp.h === 0) return;
    const allItemsForBounds = [...elements, ...placedTables];
    if (allItemsForBounds.length === 0) { setPan({ x: 0, y: 0 }); setScale(30); return; }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    allItemsForBounds.forEach(el => {
      const w = el.width || 2; const h = el.height || 2;
      if (el.x < minX) minX = el.x; if (el.y < minY) minY = el.y;
      if (el.x + w > maxX) maxX = el.x + w; if (el.y + h > maxY) maxY = el.y + h;
    });

    if (minX === Infinity) return;
    const paddingX = 180; const paddingY = 180; 
    const scaleX = (vp.w - paddingX) / ((maxX - minX) || 1);
    const scaleY = (vp.h - paddingY) / ((maxY - minY) || 1);
    const newScale = Math.max(5, Math.min(120, Math.min(scaleX, scaleY)));
    setScale(newScale); 
    setPan({ x: -(minX + (maxX - minX) / 2) * newScale, y: -(minY + (maxY - minY) / 2) * newScale });
  };

  const [initialFitDone, setInitialFitDone] = useState(false);
  useEffect(() => {
    if (vp.w > 0 && vp.h > 0 && !initialFitDone) {
      setTimeout(() => centerAndFitMap(), 50); setInitialFitDone(true);
    }
  }, [vp, initialFitDone]);

  // 🔴 AUTO-CENTRAR EL BLUEPRINT DEL CROQUIS AL ABRIRLO
  useEffect(() => {
    if (showExportModal) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      const allItemsForBounds = [...elements, ...placedTables];
      allItemsForBounds.forEach(el => {
        const w = el.width || 2; const h = el.height || 2;
        if (el.x < minX) minX = el.x; if (el.y < minY) minY = el.y;
        if (el.x + w > maxX) maxX = el.x + w; if (el.y + h > maxY) maxY = el.y + h;
      });
      if (minX === Infinity) { minX = -10; minY = -10; maxX = 10; maxY = 10; }

      const designW = (maxX - minX) * scale;
      const designH = (maxY - minY) * scale;
      const cx = (minX * scale) + designW / 2; 
      const cy = (minY * scale) + designH / 2;
      
      // Contenedor A4 Landscape aprox
      const targetW = 900; 
      const targetH = 600; 
      const initialZoom = Math.min(targetW / (designW || 1), targetH / (designH || 1)) * 0.85; 
      
      setPrintScale(initialZoom);
      setPrintPan({ x: (targetW / 2) - (cx * initialZoom), y: (targetH / 2) - (cy * initialZoom) });
    }
  }, [showExportModal, elements, placedTables, scale]);

  const offsetX = (vp.w / 2) + pan.x;
  const offsetY = (vp.h / 2) + pan.y;

  const handleDragStart = (e, item, actionType) => {
    e.dataTransfer.setData('actionType', actionType);
    e.dataTransfer.setData('payload', JSON.stringify(item));
  };

  const handleDropOnCanvas = (e) => {
    e.preventDefault();
    const guestId = e.dataTransfer.getData('guestId');
    
    if (guestId && setGuests) {
      const rect = containerRef.current.getBoundingClientRect();
      const dropX = ((e.clientX - rect.left) - offsetX) / scale;
      const dropY = ((e.clientY - rect.top) - offsetY) / scale;
      
      const margin = 0.8;
      const targetTable = tables.find(t => {
        const tw = t.width || 2; const th = t.height || 2;
        return dropX >= (t.x - margin) && dropX <= (t.x + tw + margin) && dropY >= (t.y - margin) && dropY <= (t.y + th + margin);
      });

      const guest = guests.find(g => g.id === guestId);
      if (!guest) return;

      if (targetTable) {
        if (guest.tableId === targetTable.id) return;
        const usedChairs = guests.filter(g => g.tableId === targetTable.id).reduce((sum, g) => sum + g.passes, 0);
        if (guest.passes > 1) {
           setGuestSplitPrompt({ guest, targetTableId: targetTable.id, table: targetTable, usedChairs });
           return;
        }
        if (usedChairs + guest.passes > targetTable.capacity) {
           return;
        }
        setDoc(doc(db, "eventos", ID_DEL_EVENTO, "invitados", guestId), { ...guest, tableId: targetTable.id });
      } else {
        if (guest.tableId) {
           if (guest.passes > 1) {
               setGuestSplitPrompt({ guest, targetTableId: null, table: null, usedChairs: 0 });
           } else {
               setDoc(doc(db, "eventos", ID_DEL_EVENTO, "invitados", guestId), { ...guest, tableId: null });
           }
        }
      }
      return;
    }

    if (!isEditMode) return;
    const actionType = e.dataTransfer.getData('actionType');
    if (!actionType) return;
    saveHistory(elements, tables);

    const payload = JSON.parse(e.dataTransfer.getData('payload'));
    const rect = e.currentTarget.getBoundingClientRect();
    let w = payload.width || 2; let h = payload.height || 2;
    
    if (actionType === 'new_table' || actionType === 'existing_table') {
      const pType = payload.type || payload.tipo;
      if (['round_table', 'square_table', 'redonda', 'cuadrada'].includes(pType)) { w = 1.5; h = 1.5; }
      else if (['rect_table', 'tablon'].includes(pType)) { w = 2.44; h = 0.7; }
      else if (['ovalada'].includes(pType)) { w = 3.05; h = 1.22; }
      else if (['serpentina'].includes(pType)) { 
         let arcL = 2.44;
         if(payload.configDetalle?.modeloSerpentina === 'mod1') arcL = 1.58;
         if(payload.configDetalle?.modeloSerpentina === 'mod2') arcL = 2.0;
         if(payload.configDetalle?.modeloSerpentina === 'mod3') arcL = 2.1;
         w = arcL / (Math.PI / 2); h = w; 
      }
      else if (['personalizada', 'libre'].includes(pType)) { w = payload.configDetalle?.libreMedidas?.largo || 2; h = payload.configDetalle?.libreMedidas?.ancho || 1; }
    }

    const finalX = ((e.clientX - rect.left) - offsetX) / scale - (w / 2);
    const finalY = ((e.clientY - rect.top) - offsetY) / scale - (h / 2);

    if (actionType === 'existing_table') {
      const updatedTable = tables.find(t => t.id === payload.id);
      if(updatedTable) {
          const newT = { ...updatedTable, x: finalX, y: finalY, width: w, height: h };
          setDoc(doc(db, "eventos", ID_DEL_EVENTO, "mesas", payload.id), newT);
      }
      setSelectedIds([payload.id]);
    } else if (actionType === 'new_table') {
      const newTableId = `mesa_${Date.now()}`;
      const newTable = { id: newTableId, name: `Mesa ${tables.length + 1}`, type: payload.type, capacity: payload.capacity, width: w, height: h, x: finalX, y: finalY, rotation: 0 };
      setDoc(doc(db, "eventos", ID_DEL_EVENTO, "mesas", newTableId), newTable);
      setSelectedIds([newTableId]);
    } else if (actionType === 'structure' || actionType === 'room_area') {
      const newElId = `mapa_${Date.now()}`;
      const newEl = { ...payload, id: newElId, x: finalX, y: finalY, rotation: 0, customLabel: '', mode: payload.mode || 'add' };
      setDoc(doc(db, "eventos", ID_DEL_EVENTO, "mapa", newElId), newEl);
      setSelectedIds([newElId]);
    }
    setActiveTool('select'); 
  };

  const handlePointerDownObject = (e, id, isTable) => {
    if (!isEditMode) return;
    if (activeTool !== 'select' && activeTool !== 'rotate') return;
    e.stopPropagation(); 
    
    const el = (isTable ? tables : elements).find(item => item.id === id);
    if (!el) return;
    saveHistory(elements, tables);

    let currentSelection = [...selectedIds];
    if (!currentSelection.includes(id)) {
        if (el.groupId) {
            currentSelection = allItems.filter(x => x.groupId === el.groupId).map(x => x.id);
        } else if (el.isRoomArea && roomGrouped) {
            currentSelection = elements.filter(x => x.isRoomArea).map(x => x.id);
        } else {
            currentSelection = [id];
        }
        setSelectedIds(currentSelection);
    }
    
    const targets = allItems.filter(x => currentSelection.includes(x.id));

    if (activeTool === 'rotate') {
       let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
       targets.forEach(t => {
           const w = t.width || 2; const h = t.height || 2;
           if (t.x < minX) minX = t.x; if (t.y < minY) minY = t.y;
           if (t.x + w > maxX) maxX = t.x + w; if (t.y + h > maxY) maxY = t.y + h;
       });
       const cx = minX + (maxX - minX) / 2;
       const cy = minY + (maxY - minY) / 2;
       
       let groupOriginals = {};
       targets.forEach(t => { groupOriginals[t.id] = { x: t.x, y: t.y, rotation: t.rotation || 0, w: t.width||2, h: t.height||2, isTable: t.capacity !== undefined }; });

       const rect = containerRef.current.getBoundingClientRect();
       const startAngle = Math.atan2(((e.clientY - rect.top) - offsetY)/scale - cy, ((e.clientX - rect.left) - offsetX)/scale - cx) * (180 / Math.PI);

       setDragging({ type: 'rotate', id, isTable, cx, cy, origSelection: currentSelection, groupOriginals, startAngle });
       return;
    }

    let groupOriginals = {};
    targets.forEach(t => { groupOriginals[t.id] = {x: t.x, y: t.y, isTable: t.capacity !== undefined}; });
    setDragging({ type: 'move', id, isTable, startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y, groupOriginals, w: el.width || 2, h: el.height || 2 });
  };

  const handlePointerMove = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if(!rect) return;
    
    const worldX = ((e.clientX - rect.left) - offsetX) / scale;
    const worldY = ((e.clientY - rect.top) - offsetY) / scale;
    setMousePos({x: worldX, y: worldY});

    if (selectionBox) {
        setSelectionBox(prev => ({...prev, currentX: worldX, currentY: worldY}));
        return;
    }

    if (activeTool === 'measure' && measureLine && !measureLine.done) {
       setMeasureLine(prev => ({...prev, x2: worldX, y2: worldY}));
       return;
    }

    if (!dragging) return;
    
    if (dragging.isPanning) {
      setPan({ x: dragging.startPanX + (e.clientX - dragging.startX), y: dragging.startPanY + (e.clientY - dragging.startY) });
      return;
    }

    if (dragging.type === 'rotate') {
      const currentAngle = Math.atan2(worldY - dragging.cy, worldX - dragging.cx) * (180 / Math.PI);
      let deltaAngle = currentAngle - dragging.startAngle;
      deltaAngle = Math.round(deltaAngle / 15) * 15; 

      const rad = deltaAngle * (Math.PI / 180);
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const updateItem = (orig) => {
         const objCx = orig.x + orig.w/2;
         const objCy = orig.y + orig.h/2;
         const newCx = (objCx - dragging.cx) * cos - (objCy - dragging.cy) * sin + dragging.cx;
         const newCy = (objCx - dragging.cx) * sin + (objCy - dragging.cy) * cos + dragging.cy;
         return { x: newCx - orig.w/2, y: newCy - orig.h/2, rotation: orig.rotation + deltaAngle };
      };

      setElements(elements.map(el => dragging.origSelection.includes(el.id) ? { ...el, ...updateItem(dragging.groupOriginals[el.id]) } : el));
      if (setTables) setTables(tables.map(t => dragging.origSelection.includes(t.id) ? { ...t, ...updateItem(dragging.groupOriginals[t.id]) } : t));
      return;
    }

    if (dragging.type === 'move') {
      const dxMeters = (e.clientX - dragging.startX) / scale;
      const dyMeters = (e.clientY - dragging.startY) / scale;
      let finalX = dragging.origX + dxMeters;
      let finalY = dragging.origY + dyMeters;

      let snapGuideX = null; let snapGuideY = null;
      let bestSnapDistX = 0.15; let bestSnapDistY = 0.15;
      const myW = dragging.w; const myH = dragging.h;

      if (Object.keys(dragging.groupOriginals).length === 1) {
          const targetList = [...elements.filter(e => e.isRoomArea), ...placedTables];
          targetList.forEach(other => {
            if (dragging.groupOriginals[other.id]) return; 
            
            const isOtherTable = other.capacity !== undefined;
            if (dragging.isTable && isOtherTable) {
               const t1 = (tables.find(t=>t.id === dragging.id)?.tipo) || (tables.find(t=>t.id === dragging.id)?.type) || '';
               const t2 = other.tipo || other.type || '';
               const noSnap = ['round_table', 'redonda', 'ovalada'];
               if (noSnap.includes(t1) || noSnap.includes(t2)) return;
            }

            const oW = other.width || 2; const oH = other.height || 2;
            const snapsX = [ { dist: Math.abs(finalX - (other.x + oW)), pos: other.x + oW }, { dist: Math.abs((finalX + myW) - other.x), pos: other.x - myW }, { dist: Math.abs(finalX - other.x), pos: other.x }, { dist: Math.abs((finalX + myW) - (other.x + oW)), pos: other.x + oW - myW } ];
            const snapsY = [ { dist: Math.abs(finalY - (other.y + oH)), pos: other.y + oH }, { dist: Math.abs((finalY + myH) - other.y), pos: other.y - myH }, { dist: Math.abs(finalY - other.y), pos: other.y }, { dist: Math.abs((finalY + myH) - (other.y + oH)), pos: other.y + oH - myH } ];

            snapsX.forEach(s => { if (s.dist < bestSnapDistX) { bestSnapDistX = s.dist; finalX = s.pos; snapGuideX = s.pos; } });
            snapsY.forEach(s => { if (s.dist < bestSnapDistY) { bestSnapDistY = s.dist; finalY = s.pos; snapGuideY = s.pos; } });
          });
      }
      setSnapGuides({ x: snapGuideX, y: snapGuideY });

      const finalDx = finalX - dragging.origX;
      const finalDy = finalY - dragging.origY;
      
      setElements(elements.map(el => dragging.groupOriginals[el.id] ? { ...el, x: dragging.groupOriginals[el.id].x + finalDx, y: dragging.groupOriginals[el.id].y + finalDy } : el));
      if (setTables) setTables(tables.map(t => dragging.groupOriginals[t.id] ? { ...t, x: dragging.groupOriginals[t.id].x + finalDx, y: dragging.groupOriginals[t.id].y + finalDy } : t));
    }
  };

  const handlePointerUp = async () => {
    if (selectionBox) {
        const minX = Math.min(selectionBox.startX, selectionBox.currentX);
        const maxX = Math.max(selectionBox.startX, selectionBox.currentX);
        const minY = Math.min(selectionBox.startY, selectionBox.currentY);
        const maxY = Math.max(selectionBox.startY, selectionBox.currentY);
        
        const newSelected = allItems.filter(el => {
           if(el.x === undefined) return false;
           const elW = el.width || 2; const elH = el.height || 2;
           const elMaxX = el.x + elW; const elMaxY = el.y + elH;
           return !(el.x > maxX || elMaxX < minX || el.y > maxY || elMaxY < minY);
        }).map(el => el.id);
        
        if(newSelected.length > 0) setSelectedIds(newSelected);
        setSelectionBox(null);
    }

    if (dragging && dragging.type === 'move') {
        const promesas = Object.keys(dragging.groupOriginals).map(id => {
            const isTab = dragging.groupOriginals[id].isTable;
            const item = isTab ? tables.find(t => String(t.id) === String(id)) : elements.find(e => String(e.id) === String(id));
            const collectionName = isTab ? "mesas" : "mapa";
            return item ? setDoc(doc(db, "eventos", ID_DEL_EVENTO, collectionName, String(id)), item) : Promise.resolve();
        });
        await Promise.all(promesas);
    }
    
    if (dragging && dragging.type === 'rotate') {
        const promesas = dragging.origSelection.map(id => {
            const isTab = dragging.groupOriginals[id].isTable;
            const item = isTab ? tables.find(t => String(t.id) === String(id)) : elements.find(e => String(e.id) === String(id));
            const collectionName = isTab ? "mesas" : "mapa";
            return item ? setDoc(doc(db, "eventos", ID_DEL_EVENTO, collectionName, String(id)), item) : Promise.resolve();
        });
        await Promise.all(promesas);
    }

    setDragging(null);
    setSnapGuides({x:null, y:null});
  };

  const updateElementData = async (id, newData) => {
    saveHistory(elements, tables);
    const el = elements.find(e => String(e.id) === String(id));
    if(el) await setDoc(doc(db, "eventos", ID_DEL_EVENTO, "mapa", String(id)), { ...el, ...newData });
  };

  const deleteSelected = async () => {
    saveHistory(elements, tables);
    const promesas = [];
    selectedIds.forEach(id => {
      const isTable = tables.some(t => String(t.id) === String(id));
      if (isTable) {
        const t = tables.find(x => String(x.id) === String(id));
        promesas.push(setDoc(doc(db, "eventos", ID_DEL_EVENTO, "mesas", String(id)), { ...t, x: null, y: null, rotation: 0, groupId: null }));
      } else {
        promesas.push(deleteDoc(doc(db, "eventos", ID_DEL_EVENTO, "mapa", String(id))));
      }
    });
    await Promise.all(promesas);
    setSelectedIds([]);
  };

  const toggleGroupSelection = async () => {
     const firstItem = allItems.find(x => String(x.id) === String(selectedIds[0]));
     const allHaveSameGroup = firstItem && firstItem.groupId && selectedIds.every(id => {
         const item = allItems.find(x => String(x.id) === String(id));
         return item && item.groupId === firstItem.groupId;
     });

     const promesas = [];
     if (allHaveSameGroup) {
        const grpId = firstItem.groupId;
        elements.forEach(e => { if(e.groupId === grpId) promesas.push(setDoc(doc(db, "eventos", ID_DEL_EVENTO, "mapa", String(e.id)), {...e, groupId: null})) });
        tables.forEach(t => { if(t.groupId === grpId) promesas.push(setDoc(doc(db, "eventos", ID_DEL_EVENTO, "mesas", String(t.id)), {...t, groupId: null})) });
     } else {
        const newGroupId = 'grp_' + Date.now();
        selectedIds.forEach(id => {
           const e = elements.find(x => String(x.id) === String(id));
           if (e) promesas.push(setDoc(doc(db, "eventos", ID_DEL_EVENTO, "mapa", String(id)), {...e, groupId: newGroupId}));
           const t = tables.find(x => String(x.id) === String(id));
           if (t) promesas.push(setDoc(doc(db, "eventos", ID_DEL_EVENTO, "mesas", String(id)), {...t, groupId: newGroupId}));
        });
     }
     await Promise.all(promesas);
  };

  const handleSplitChoice = (mode) => {
      const { guest, targetTableId, table, usedChairs } = guestSplitPrompt;
      if (mode === 'all') {
          if (table && usedChairs + guest.passes > table.capacity) {
              // Notificación silenciada
          } else {
              setDoc(doc(db, "eventos", ID_DEL_EVENTO, "invitados", guest.id), { ...guest, tableId: targetTableId });
          }
      } else if (mode === 'one') {
          if (table && usedChairs + 1 > table.capacity) {
              // Notificación silenciada
          } else {
              const newGuestId = Date.now().toString() + Math.random().toString(36).substring(2,5);
              const newGuest = { ...guest, id: newGuestId, name: `${guest.name} (Separado)`, passes: 1, childrenPasses: 0, tableId: targetTableId };
              const updatedGuest = { ...guest, passes: guest.passes - 1 };
              setDoc(doc(db, "eventos", ID_DEL_EVENTO, "invitados", guest.id), updatedGuest);
              setDoc(doc(db, "eventos", ID_DEL_EVENTO, "invitados", newGuestId), newGuest);
          }
      }
      setGuestSplitPrompt(null);
  };

  const getTextureStyle = (texture) => {
    switch(texture) {
      case 'grass': return { backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M2 2c0 1-1 2-2 2v-1c.5 0 1-.5 1-1h1zm16 0c0 1 1 2 2 2v-1c-.5 0-1-.5-1-1h-1zM9 9c0 1-1 2-2 2v-1c.5 0 1-.5 1-1h1zm8 8c0 1-1 2-2 2v-1c.5 0 1-.5 1-1h1z\' fill=\'%2316a34a\' fill-opacity=\'0.25\' fill-rule=\'evenodd\'/%3E")', backgroundColor: '#bbf7d0' };
      case 'water': return { backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 10 Q 5 15 10 10 T 20 10\' stroke=\'%230891b2\' stroke-width=\'1.5\' fill=\'none\' opacity=\'0.4\'/%3E%3C/svg%3E")', backgroundSize: '100% 20px', backgroundColor: '#a5f3fc' };
      case 'wood': return { backgroundImage: 'repeating-linear-gradient(to right, #78350f, #78350f 2px, #92400e 2px, #92400e 20px)', backgroundColor: '#78350f' };
      case 'marble': return { backgroundImage: 'linear-gradient(45deg, #18181b 25%, #27272a 25%, #27272a 50%, #18181b 50%, #18181b 75%, #27272a 75%, #27272a 100%)', backgroundSize: '20px 20px' };
      case 'dance': return { backgroundImage: 'linear-gradient(45deg, #fdf4ff 25%, #fae8ff 25%, #fae8ff 50%, #fdf4ff 50%, #fdf4ff 75%, #fae8ff 75%, #fae8ff 100%)', backgroundSize: '40px 40px', backgroundColor: '#fdf4ff' };
      default: return { backgroundColor: '#f8fafc' };
    }
  };

  const renderContextualMenu = () => {
    if (selectedIds.length === 0) return null;

    if (isMultiSelection) {
       return (
         <div className="p-4 bg-indigo-600 text-white border-b border-indigo-700 shrink-0 shadow-inner flex flex-col justify-center animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold flex items-center"><Layers size={16} className="mr-2"/> {selectedIds.length} Seleccionados</span>
              <button onClick={() => setSelectedIds([])} className="text-indigo-300 hover:text-white"><X size={16}/></button>
            </div>
            <div className="flex gap-2">
              <button onClick={toggleGroupSelection} className="flex-1 py-2 bg-indigo-500 hover:bg-indigo-400 rounded-lg text-xs font-bold transition-colors flex items-center justify-center"><Link size={14} className="mr-1.5"/> Agrupar / Desagrupar</button>
              <button onClick={deleteSelected} className="flex-1 py-2 bg-rose-500 hover:bg-rose-400 rounded-lg text-xs font-bold transition-colors flex items-center justify-center"><Trash2 size={14} className="mr-1.5"/> Borrar Todos</button>
            </div>
         </div>
       );
    }

    let el = allItems.find(i => i.id === selectedIds[0]);
    if (!el) return null;
    
    const isSub = el.mode === 'subtract';
    const isTable = el.capacity !== undefined;
    const tType = el.tipo || el.type;

    let normType = 'libre';
    if (['round_table', 'redonda'].includes(tType)) normType = 'redonda';
    if (['square_table', 'cuadrada'].includes(tType)) normType = 'cuadrada';
    if (['rect_table', 'tablon'].includes(tType)) normType = 'tablon';
    if (tType === 'ovalada') normType = 'ovalada';
    if (tType === 'serpentina') normType = 'serpentina';

    const config = el.configDetalle || {};

    return (
      <div className="p-3 bg-indigo-50/60 border-b border-indigo-100 shrink-0 shadow-inner animate-in slide-in-from-top-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <span className="text-[11px] font-bold text-indigo-900 truncate max-w-[130px]">{el.name || el.customLabel || 'Elemento'}</span>
            <span className="text-[8px] bg-indigo-200 text-indigo-700 px-1.5 py-0.5 rounded ml-2 uppercase font-bold">{isTable ? 'Mesa' : 'Área'}</span>
          </div>
          <button onClick={() => setSelectedIds([])} className="text-indigo-400 hover:text-rose-500"><X size={14}/></button>
        </div>

        {el.isRoomArea && (
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            <div className="bg-white p-1.5 rounded-lg flex items-center justify-between border border-indigo-100 shadow-sm">
              <span className="text-[9px] text-slate-500 font-bold uppercase">Ancho</span>
              <input type="number" step="0.5" value={el.width} onChange={e => updateElementData(el.id, {width: Math.max(0.5, parseFloat(e.target.value) || 0.5)})} className="w-12 text-right bg-transparent text-xs font-black text-indigo-600 outline-none" />
            </div>
            <div className="bg-white p-1.5 rounded-lg flex items-center justify-between border border-indigo-100 shadow-sm">
              <span className="text-[9px] text-slate-500 font-bold uppercase">Largo</span>
              <input type="number" step="0.5" value={el.height} onChange={e => updateElementData(el.id, {height: Math.max(0.5, parseFloat(e.target.value) || 0.5)})} className="w-12 text-right bg-transparent text-xs font-black text-indigo-600 outline-none" />
            </div>
            {el.mode !== 'overlay' && (
              <button onClick={() => updateElementData(el.id, {mode: isSub ? 'add' : 'subtract'})} className={`col-span-2 py-1.5 rounded-lg text-[9px] font-bold transition-colors shadow-sm ${isSub ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : 'bg-slate-800 text-white hover:bg-slate-900'}`}>
                 {isSub ? 'Convertir a Piso Fijo' : 'Convertir a Hueco/Perforación'}
              </button>
            )}
          </div>
        )}

        {isTable && (
          <div className="mb-3 space-y-2">
            <div className="text-[9px] font-black text-indigo-800 uppercase tracking-wider flex items-center"><Settings2 size={12} className="mr-1"/> Configurar Sillas</div>
            
            {normType === 'redonda' && (
              <div className="bg-white p-1.5 rounded-lg flex items-center justify-between border border-indigo-100 shadow-sm">
                <span className="text-[9px] text-slate-500 font-bold uppercase">Capacidad Total</span>
                <input type="number" min="1" max="14" value={config.capacidadRedonda || el.capacity} onChange={e => handleTableConfig(el.id, el, 'capacidadRedonda', null, e.target.value, 14)} className="w-12 text-right bg-transparent text-xs font-black text-indigo-600 outline-none" />
              </div>
            )}
            
            {normType === 'tablon' && (
              <div className="bg-white p-2 rounded-lg border border-indigo-100 shadow-sm grid grid-cols-2 gap-1.5">
                <div className="flex flex-col"><span className="text-[8px] text-slate-400 font-bold mb-0.5">Largo 1</span><input type="number" min="0" value={config.ladosTablon?.top ?? 5} onChange={e=>handleTableConfig(el.id, el, 'ladosTablon', 'top', e.target.value, 5)} className="w-full text-xs p-1 border rounded bg-slate-50 outline-none text-center font-bold text-indigo-600" /></div>
                <div className="flex flex-col"><span className="text-[8px] text-slate-400 font-bold mb-0.5">Largo 2</span><input type="number" min="0" value={config.ladosTablon?.bottom ?? 5} onChange={e=>handleTableConfig(el.id, el, 'ladosTablon', 'bottom', e.target.value, 5)} className="w-full text-xs p-1 border rounded bg-slate-50 outline-none text-center font-bold text-indigo-600" /></div>
                <div className="flex flex-col"><span className="text-[8px] text-slate-400 font-bold mb-0.5">Cabecera 1</span><input type="number" min="0" value={config.ladosTablon?.left ?? 1} onChange={e=>handleTableConfig(el.id, el, 'ladosTablon', 'left', e.target.value, 1)} className="w-full text-xs p-1 border rounded bg-slate-50 outline-none text-center font-bold text-indigo-600" /></div>
                <div className="flex flex-col"><span className="text-[8px] text-slate-400 font-bold mb-0.5">Cabecera 2</span><input type="number" min="0" value={config.ladosTablon?.right ?? 1} onChange={e=>handleTableConfig(el.id, el, 'ladosTablon', 'right', e.target.value, 1)} className="w-full text-xs p-1 border rounded bg-slate-50 outline-none text-center font-bold text-indigo-600" /></div>
              </div>
            )}

            {normType === 'cuadrada' && (
              <div className="bg-white p-2 rounded-lg border border-indigo-100 shadow-sm grid grid-cols-2 gap-1.5">
                <div className="flex flex-col"><span className="text-[8px] text-slate-400 font-bold mb-0.5">Arriba</span><input type="number" min="0" value={config.ladosCuadrada?.top ?? 3} onChange={e=>handleTableConfig(el.id, el, 'ladosCuadrada', 'top', e.target.value, 3)} className="w-full text-xs p-1 border rounded bg-slate-50 outline-none text-center font-bold text-indigo-600" /></div>
                <div className="flex flex-col"><span className="text-[8px] text-slate-400 font-bold mb-0.5">Abajo</span><input type="number" min="0" value={config.ladosCuadrada?.bottom ?? 3} onChange={e=>handleTableConfig(el.id, el, 'ladosCuadrada', 'bottom', e.target.value, 3)} className="w-full text-xs p-1 border rounded bg-slate-50 outline-none text-center font-bold text-indigo-600" /></div>
                <div className="flex flex-col"><span className="text-[8px] text-slate-400 font-bold mb-0.5">Izquierda</span><input type="number" min="0" value={config.ladosCuadrada?.left ?? 3} onChange={e=>handleTableConfig(el.id, el, 'ladosCuadrada', 'left', e.target.value, 3)} className="w-full text-xs p-1 border rounded bg-slate-50 outline-none text-center font-bold text-indigo-600" /></div>
                <div className="flex flex-col"><span className="text-[8px] text-slate-400 font-bold mb-0.5">Derecha</span><input type="number" min="0" value={config.ladosCuadrada?.right ?? 3} onChange={e=>handleTableConfig(el.id, el, 'ladosCuadrada', 'right', e.target.value, 3)} className="w-full text-xs p-1 border rounded bg-slate-50 outline-none text-center font-bold text-indigo-600" /></div>
              </div>
            )}

            {normType === 'ovalada' && (
              <div className="bg-white p-2 rounded-lg border border-indigo-100 shadow-sm grid grid-cols-2 gap-1.5">
                <div className="flex flex-col"><span className="text-[8px] text-slate-400 font-bold mb-0.5">Lado Recto 1</span><input type="number" min="0" value={config.ladosOvalada?.top ?? 4} onChange={e=>handleTableConfig(el.id, el, 'ladosOvalada', 'top', e.target.value, 4)} className="w-full text-xs p-1 border rounded bg-slate-50 outline-none text-center font-bold text-indigo-600" /></div>
                <div className="flex flex-col"><span className="text-[8px] text-slate-400 font-bold mb-0.5">Lado Recto 2</span><input type="number" min="0" value={config.ladosOvalada?.bottom ?? 4} onChange={e=>handleTableConfig(el.id, el, 'ladosOvalada', 'bottom', e.target.value, 4)} className="w-full text-xs p-1 border rounded bg-slate-50 outline-none text-center font-bold text-indigo-600" /></div>
                <div className="flex flex-col"><span className="text-[8px] text-slate-400 font-bold mb-0.5">Curva Izq.</span><input type="number" min="0" value={config.ladosOvalada?.left ?? 2} onChange={e=>handleTableConfig(el.id, el, 'ladosOvalada', 'left', e.target.value, 3)} className="w-full text-xs p-1 border rounded bg-slate-50 outline-none text-center font-bold text-indigo-600" /></div>
                <div className="flex flex-col"><span className="text-[8px] text-slate-400 font-bold mb-0.5">Curva Der.</span><input type="number" min="0" value={config.ladosOvalada?.right ?? 2} onChange={e=>handleTableConfig(el.id, el, 'ladosOvalada', 'right', e.target.value, 3)} className="w-full text-xs p-1 border rounded bg-slate-50 outline-none text-center font-bold text-indigo-600" /></div>
              </div>
            )}

            {normType === 'serpentina' && (() => {
              const mod = config.modeloSerpentina || 'mod4';
              const sMax = mod === 'mod1' ? {e:3,i:1,s:1} : mod === 'mod2' ? {e:4,i:1,s:1} : mod === 'mod3' ? {e:4,i:1,s:1} : {e:5,i:2,s:1};
              return (
                <div className="bg-white p-2 rounded-lg border border-indigo-100 shadow-sm grid grid-cols-2 gap-1.5">
                  <div className="flex flex-col"><span className="text-[8px] text-slate-400 font-bold mb-0.5">Arco Exterior</span><input type="number" min="0" value={config.ladosSerpentina?.ext ?? sMax.e} onChange={e=>handleTableConfig(el.id, el, 'ladosSerpentina', 'ext', e.target.value, sMax.e)} className="w-full text-xs p-1 border rounded bg-slate-50 outline-none text-center font-bold text-indigo-600" /></div>
                  <div className="flex flex-col"><span className="text-[8px] text-slate-400 font-bold mb-0.5">Arco Interior</span><input type="number" min="0" value={config.ladosSerpentina?.int ?? sMax.i} onChange={e=>handleTableConfig(el.id, el, 'ladosSerpentina', 'int', e.target.value, sMax.i)} className="w-full text-xs p-1 border rounded bg-slate-50 outline-none text-center font-bold text-indigo-600" /></div>
                  <div className="flex flex-col"><span className="text-[8px] text-slate-400 font-bold mb-0.5">Ancho Izq.</span><input type="number" min="0" value={config.ladosSerpentina?.izq ?? sMax.s} onChange={e=>handleTableConfig(el.id, el, 'ladosSerpentina', 'izq', e.target.value, sMax.s)} className="w-full text-xs p-1 border rounded bg-slate-50 outline-none text-center font-bold text-indigo-600" /></div>
                  <div className="flex flex-col"><span className="text-[8px] text-slate-400 font-bold mb-0.5">Ancho Der.</span><input type="number" min="0" value={config.ladosSerpentina?.der ?? sMax.s} onChange={e=>handleTableConfig(el.id, el, 'ladosSerpentina', 'der', e.target.value, sMax.s)} className="w-full text-xs p-1 border rounded bg-slate-50 outline-none text-center font-bold text-indigo-600" /></div>
                </div>
              );
            })()}
          </div>
        )}

        <div className="flex items-center gap-1.5 pt-2 border-t border-indigo-100">
          <button onClick={() => {setActiveTool('rotate'); setDragging(null);}} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg flex items-center justify-center transition-colors shadow-sm ${activeTool === 'rotate' ? 'bg-amber-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-amber-50'}`} title="Activar Rotación Libre"><RotateCw size={12} className="mr-1"/> Girar</button>
          <button onClick={deleteSelected} className="flex-1 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-[10px] font-bold flex items-center justify-center transition-colors shadow-sm"><Trash2 size={12} className="mr-1"/> {isTable ? "Quitar Mesa" : "Borrar"}</button>
        </div>
      </div>
    );
  };

  // 🔴 HANDLERS DEL LIENZO INTERACTIVO DE IMPRESIÓN (PDF)
  const handlePrintWheel = (e) => {
    e.preventDefault(); e.stopPropagation();
    const zoomSensitivity = 0.002;
    const delta = -e.deltaY * zoomSensitivity;
    setPrintScale(s => Math.max(0.1, Math.min(s * (1 + delta), 5)));
  };

  const handlePrintPointerDown = (e) => {
    if (!isBlueprintPanActive) return; 
    e.preventDefault(); 
    e.stopPropagation();
    setIsPrintDragging(true);
    setPrintDragStart({ x: e.clientX - printPan.x, y: e.clientY - printPan.y });
  };

  const handlePrintPointerMove = (e) => {
    if (!isPrintDragging) return;
    setPrintPan({ x: e.clientX - printDragStart.x, y: e.clientY - printDragStart.y });
  };

  const handlePrintPointerUp = () => setIsPrintDragging(false);

  const triggerPdfDownload = async () => {
    setIsPreparingPrint(true);
    setIsCapturingPdf(true);

    setTimeout(async () => {
      try {
        const { jsPDF } = await import('jspdf');
        const html2canvas = (await import('html2canvas')).default;

        const pages = document.querySelectorAll('.map-pdf-page');
        const pdf = new jsPDF('l', 'mm', 'letter'); // LANDSCAPE

        for (let i = 0; i < pages.length; i++) {
           const canvas = await html2canvas(pages[i], { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
           const imgData = canvas.toDataURL('image/jpeg', 0.95);
           if (i > 0) pdf.addPage();
           pdf.addImage(imgData, 'JPEG', 0, 0, 279.4, 215.9);
        }
        
        pdf.save('Plano-Croquis.pdf');
      } catch (error) {
        console.error(error);
      }
      setIsCapturingPdf(false);
      setIsPreparingPrint(false);
      setShowExportModal(false);
    }, 500); 
  };

  // 🔴 VISTA DE EXPORTACIÓN PDF (CROQUIS INTERACTIVO)
  if (showExportModal) {
    return (
      <div className="fixed inset-0 z-[120] bg-slate-900/95 flex flex-col overflow-hidden backdrop-blur-sm">
        
        <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row justify-between items-center shadow-lg border-b border-slate-700 z-10 shrink-0 gap-4">
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            <button onClick={() => setShowExportModal(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={24}/></button>
            <div>
              <h3 className="font-bold text-sm">Vista Previa de Exportación</h3>
              <p className="text-[10px] text-slate-400">Ajusta el zoom, encuadra y descarga.</p>
            </div>
          </div>
          <button onClick={triggerPdfDownload} disabled={isPreparingPrint} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold flex items-center shadow-lg transition-all w-full sm:w-auto justify-center disabled:bg-slate-600">
            {isPreparingPrint ? <RefreshCw size={18} className="mr-2 animate-spin"/> : <Download size={18} className="mr-2"/>} 
            {isPreparingPrint ? 'Armando PDF...' : 'Guardar PDF'}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center py-8 relative gap-8">
           {/* HOJA TAMAÑO CARTA HORIZONTAL (279.4mm x 215.9mm) */}
           <div className="bg-white shadow-[0_0_40px_rgba(0,0,0,0.5)] relative shrink-0 map-pdf-page flex flex-col" style={{ width: '279.4mm', height: '215.9mm', padding: '15mm', boxSizing: 'border-box', overflow: 'hidden' }}>
             
             <header className="border-b-4 border-slate-900 pb-2 mb-4 flex justify-between items-end shrink-0">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Plano y Acomodo</h1>
                  <p className="text-slate-500 text-sm font-medium">Proyecto: Boda Ana & Luis</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400">Escala Ajustada (Carta Horizontal)</p>
                </div>
             </header>

             {/* FOTO DEL LIENZO INTERACTIVO SEGURO */}
             <div 
               onPointerDown={handlePrintPointerDown} onPointerMove={handlePrintPointerMove} onPointerUp={handlePrintPointerUp} onPointerLeave={handlePrintPointerUp} onWheel={handlePrintWheel}
               className={`w-full flex-1 bg-[#eef2f6] border-2 border-slate-300 rounded-xl relative overflow-hidden flex shadow-inner ${isBlueprintPanActive ? 'cursor-grab active:cursor-grabbing touch-none ring-4 ring-indigo-300' : ''}`}
             >
                {!isCapturingPdf && (
                  <div className="absolute top-3 left-3 z-50 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <button onClick={() => setIsBlueprintPanActive(!isBlueprintPanActive)} className={`px-3 py-2 transition-colors rounded-xl font-bold text-[10px] flex items-center shadow-lg border border-slate-700 ${isBlueprintPanActive ? 'bg-indigo-500 text-white' : 'bg-slate-900/90 text-white hover:bg-slate-800'}`}>
                      <Hand size={14} className="mr-1.5"/> {isBlueprintPanActive ? 'Arrastre Activo (Bloquear para PDF)' : 'Activar Arrastre'}
                    </button>
                    <div className="bg-slate-900/90 backdrop-blur text-white rounded-xl shadow-lg flex items-center pointer-events-auto border border-slate-700">
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPrintScale(s => Math.max(0.1, s - 0.15)); }} className="p-3 hover:bg-white/20 transition-colors rounded-l-xl active:bg-white/30 touch-manipulation"><Minus size={16} /></button>
                      <div className="w-px h-5 bg-white/20"></div>
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPrintScale(s => Math.min(5, s + 0.15)); }} className="p-3 hover:bg-white/20 transition-colors rounded-r-xl active:bg-white/30 touch-manipulation"><Plus size={16} /></button>
                    </div>
                  </div>
                )}

                <div style={{ transform: `translate(${printPan.x}px, ${printPan.y}px) scale(${printScale})`, transformOrigin: '0 0', width: '100%', height: '100%' }}>
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ overflow: 'visible' }}>
                     <defs>
                       <mask id="printRoomMask">
                         <rect x="-5000" y="-5000" width="10000" height="10000" fill="black" />
                         {addAreas.map(el => renderSVGShape(el, scale, 0, 0, { fill: 'white' }))}
                         {subAreas.map(el => renderSVGShape(el, scale, 0, 0, { fill: 'black' }))}
                       </mask>
                       <mask id="printOuterWallMask">
                         <rect x="-5000" y="-5000" width="10000" height="10000" fill="white" />
                         {addAreas.map(el => renderSVGShape(el, scale, 0, 0, { fill: 'black' }))}
                         {subAreas.map(el => renderSVGShape(el, scale, 0, 0, { fill: 'black' }))}
                       </mask>
                       <mask id="printSubWallMask">
                         <rect x="-5000" y="-5000" width="10000" height="10000" fill="black" />
                         {addAreas.map(el => renderSVGShape(el, scale, 0, 0, { fill: 'white' }))}
                         {subAreas.map(el => renderSVGShape(el, scale, 0, 0, { fill: 'black' }))}
                       </mask>
                     </defs>
                     <g>
                       <rect x="-5000" y="-5000" width="10000" height="10000" fill="#ffffff" mask="url(#printRoomMask)" />
                       <g mask="url(#printOuterWallMask)">
                         {addAreas.map(el => renderSVGShape(el, scale, 0, 0, { stroke: '#1e293b', strokeWidth: scale * 0.10, strokeLinejoin: 'round', fill: 'none' }))}
                       </g>
                       <g mask="url(#printSubWallMask)">
                         {subAreas.map(el => renderSVGShape(el, scale, 0, 0, { stroke: '#1e293b', strokeWidth: scale * 0.10, strokeLinejoin: 'round', fill: 'none' }))}
                       </g>
                     </g>
                  </svg>

                  {overlayAreas.map((el) => (
                    <div key={el.id} className="absolute flex items-center justify-center select-none pointer-events-none z-0" style={{ width: el.width * scale, height: el.height * scale, left: el.x * scale, top: el.y * scale, transform: `rotate(${el.rotation || 0}deg)`, ...getTextureStyle(el.texture), boxShadow: el.shapeType === 'pool' ? `inset 0 0 0 ${0.3 * scale}px #94a3b8` : 'none', borderRadius: el.shapeType === 'pool' ? '8px' : '0px' }}>
                      <span className="font-extrabold text-center drop-shadow-md bg-white/40 px-2 py-0.5 rounded backdrop-blur-sm" style={{ fontSize: `${Math.max(0.5, Math.min(el.width, el.height) * 0.25)}rem` }}>{el.customLabel || el.name}</span>
                    </div>
                  ))}

                  {roomAreas.filter(e => e.mode !== 'overlay').map((el) => (
                    <div key={el.id} className="absolute z-20 pointer-events-none" style={{ width: el.width * scale, height: el.height * scale, left: el.x * scale, top: el.y * scale, transform: `rotate(${el.rotation || 0}deg)` }}>
                      <div className="w-full h-full" style={{ clipPath: getShapeClipPath(el) }}>
                        {el.customLabel && <span className="absolute inset-0 flex items-center justify-center font-extrabold text-slate-500 opacity-80 uppercase tracking-widest pointer-events-none" style={{ fontSize: `${Math.max(0.6, Math.min(el.width, el.height) * 0.2)}rem` }}>{el.customLabel}</span>}
                      </div>
                    </div>
                  ))}

                  {physicalStructures.map((el) => (
                    <div key={el.id} className={`absolute flex items-center justify-center select-none shadow-md pointer-events-none z-20 ${el.shape} ${el.color} ${el.texture === 'none' ? '' : 'border-[3px]'}`} style={{ width: el.width * scale, height: el.height * scale, left: el.x * scale, top: el.y * scale, transform: `rotate(${el.rotation || 0}deg)`, ...getTextureStyle(el.texture) }}>
                      <span className="font-extrabold text-center drop-shadow-md bg-white/40 px-2 py-0.5 rounded backdrop-blur-sm" style={{ fontSize: `${Math.max(0.5, Math.min(el.width, el.height) * 0.25)}rem` }}>{el.customLabel || el.name}</span>
                    </div>
                  ))}

                  {placedTables.map((el) => {
                    const occupancy = guests.filter(g => g.tableId === el.id).reduce((s, g) => s + g.passes, 0);
                    return (
                      <div key={el.id} className="absolute flex items-center justify-center select-none pointer-events-none z-40" style={{ width: el.width * scale, height: el.height * scale, left: el.x * scale, top: el.y * scale, transform: `rotate(${el.rotation || 0}deg)` }}>
                        <TableWithChairs tableData={el} occupancy={occupancy} scale={scale} tableGuests={guests.filter(g => g.tableId === el.id)} searchQuery={""} />
                      </div>
                    );
                  })}
                </div>
             </div>

           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4 pb-6" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onMouseLeave={handlePointerUp}>
      
      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row overflow-hidden relative">

        <div ref={containerRef} className="flex-1 relative overflow-hidden bg-slate-100" onDrop={handleDropOnCanvas} onDragOver={(e) => e.preventDefault()}>
          
          {isEditMode && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl flex flex-col items-center p-2 gap-2 z-[600] animate-in slide-in-from-left-4">
              <button onClick={() => {setActiveTool('select'); setMeasureLine(null);}} className={`p-3 rounded-xl transition-all ${activeTool === 'select' ? 'bg-indigo-600 text-white shadow-md scale-110' : 'text-slate-500 hover:bg-slate-100 hover:text-indigo-600'}`} title="Seleccionar Libre">
                <NavigationIcon size={20} className="-rotate-90" />
              </button>
              <button onClick={() => {setActiveTool('pan'); setSelectedIds([]); setMeasureLine(null);}} className={`p-3 rounded-xl transition-all ${activeTool === 'pan' ? 'bg-indigo-600 text-white shadow-md scale-110' : 'text-slate-500 hover:bg-slate-100 hover:text-indigo-600'}`} title="Mover Lienzo">
                <Hand size={20} />
              </button>
              <button onClick={() => { if(selectedIds.length>1) toggleGroupSelection(); else setActiveTool('select'); }} className={`p-3 rounded-xl transition-all ${selectedIds.length > 1 ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 ring-2 ring-indigo-200 animate-pulse' : 'text-slate-300 cursor-not-allowed'}`} title="Agrupar Selección">
                <Link size={20} />
              </button>
              <div className="w-8 h-px bg-slate-200 my-1"></div>
              <button onClick={() => {setActiveTool('measure'); setSelectedIds([]);}} className={`p-3 rounded-xl transition-all ${activeTool === 'measure' ? 'bg-sky-500 text-white shadow-md scale-110' : 'text-slate-500 hover:bg-sky-50 hover:text-sky-600'}`} title="Cinta Métrica">
                <Spline size={20} />
              </button>
              <div className="w-8 h-px bg-slate-200 my-1"></div>
              <button onClick={() => setActiveTool('rotate')} className={`p-3 rounded-xl transition-all ${activeTool === 'rotate' ? 'bg-amber-500 text-white shadow-md scale-110' : 'text-slate-500 hover:bg-amber-50 hover:text-amber-600'}`} title="Girar Selección">
                <RotateCw size={20} />
              </button>
            </div>
          )}
          
          {!isEditMode && (
            <div className="absolute top-6 right-6 z-[600] pointer-events-auto animate-in zoom-in duration-300">
              <button onClick={() => setIsEditMode(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-xl flex items-center hover:scale-105 border border-indigo-500">
                <Edit2 size={18} className="mr-2"/> Editar Plano
              </button>
            </div>
          )}

          {isEditMode && activeTool === 'measure' && (
             <div className="absolute z-[9999] pointer-events-none transform -translate-x-1/2 -translate-y-[150%]" style={{ left: mousePos.x * scale + offsetX, top: mousePos.y * scale + offsetY }}>
               <div className="bg-slate-900/80 backdrop-blur text-white text-[10px] font-mono px-2 py-1 rounded-lg shadow-lg flex flex-col items-center leading-tight">
                 <span>X: {mousePos.x.toFixed(1)}</span>
                 <span>Y: {mousePos.y.toFixed(1)}</span>
               </div>
             </div>
          )}

          {selectionBox && (
              <div className="absolute border border-indigo-500 bg-indigo-500/20 pointer-events-none z-[9999]"
                   style={{
                      left: Math.min(selectionBox.startX, selectionBox.currentX) * scale + offsetX,
                      top: Math.min(selectionBox.startY, selectionBox.currentY) * scale + offsetY,
                      width: Math.abs(selectionBox.currentX - selectionBox.startX) * scale,
                      height: Math.abs(selectionBox.currentY - selectionBox.startY) * scale
                   }} />
          )}

          <div 
            className={`absolute inset-0 z-0 touch-none ${activeTool === 'measure' ? 'cursor-crosshair' : (activeTool === 'pan' ? 'cursor-grab active:cursor-grabbing' : (activeTool === 'rotate' ? 'cursor-alias' : 'cursor-default'))}`}
            onPointerDown={(e) => {
              if (e.button === 2) { setMeasureLine(null); return; } 
              
              const rect = containerRef.current.getBoundingClientRect();
              const worldX = ((e.clientX - rect.left) - offsetX) / scale;
              const worldY = ((e.clientY - rect.top) - offsetY) / scale;

              if (activeTool === 'measure') {
                if (!measureLine) {
                   setMeasureLine({ x1: worldX, y1: worldY, x2: worldX, y2: worldY, done: false });
                } else if (!measureLine.done) {
                   setMeasureLine({ ...measureLine, done: true }); 
                } else {
                   setMeasureLine(null);
                }
              } else if (activeTool === 'pan') {
                setSelectedIds([]);
                setDragging({ isPanning: true, startX: e.clientX, startY: e.clientY, startPanX: pan.x, startPanY: pan.y });
              } else if (activeTool === 'select') {
                setSelectionBox({ startX: worldX, startY: worldY, currentX: worldX, currentY: worldY });
                setSelectedIds([]);
              }
            }}
            onContextMenu={(e) => { e.preventDefault(); setMeasureLine(null); }}
          />

          <div className="absolute inset-0 pointer-events-none">
            <svg className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-xl z-10">
               <defs>
                 <mask id="roomMask">
                   <rect x="-5000" y="-5000" width="10000" height="10000" fill="black" />
                   {addAreas.map(el => renderSVGShape(el, scale, 0, 0, { fill: 'white' }))}
                   {subAreas.map(el => renderSVGShape(el, scale, 0, 0, { fill: 'black' }))}
                 </mask>
                 <mask id="outerWallMask">
                   <rect x="-5000" y="-5000" width="10000" height="10000" fill="white" />
                   {addAreas.map(el => renderSVGShape(el, scale, 0, 0, { fill: 'black' }))}
                   {subAreas.map(el => renderSVGShape(el, scale, 0, 0, { fill: 'black' }))}
                 </mask>
                 <mask id="subWallMask">
                   <rect x="-5000" y="-5000" width="10000" height="10000" fill="black" />
                   {addAreas.map(el => renderSVGShape(el, scale, 0, 0, { fill: 'white' }))}
                   {subAreas.map(el => renderSVGShape(el, scale, 0, 0, { fill: 'black' }))}
                 </mask>
               </defs>

               <g transform={`translate(${offsetX}, ${offsetY})`}>
                 <rect x="-5000" y="-5000" width="10000" height="10000" fill="#ffffff" mask="url(#roomMask)" />
                 <g mask="url(#outerWallMask)">
                   {addAreas.map(el => renderSVGShape(el, scale, 0, 0, { stroke: '#1e293b', strokeWidth: scale * 0.10, strokeLinejoin: 'round', fill: 'none' }))}
                 </g>
                 <g mask="url(#subWallMask)">
                   {subAreas.map(el => renderSVGShape(el, scale, 0, 0, { stroke: '#1e293b', strokeWidth: scale * 0.10, strokeLinejoin: 'round', fill: 'none' }))}
                 </g>
               </g>

               {measureLine && (() => {
                 const dx = measureLine.x2 - measureLine.x1; const dy = measureLine.y2 - measureLine.y1;
                 const length = Math.sqrt(dx*dx + dy*dy);
                 const p1x = measureLine.x1 * scale; const p1y = measureLine.y1 * scale;
                 const p2x = measureLine.x2 * scale; const p2y = measureLine.y2 * scale;

                 return (
                   <g transform={`translate(${offsetX}, ${offsetY})`} className="pointer-events-none z-[9999]">
                      <line x1={p1x} y1={p1y} x2={p2x} y2={p2y} stroke="#0ea5e9" strokeWidth="3" strokeDasharray="6 4" />
                      <circle cx={p1x} cy={p1y} r="6" fill="#0ea5e9" stroke="white" strokeWidth="2" />
                      <circle cx={p2x} cy={p2y} r="6" fill="#0ea5e9" stroke="white" strokeWidth="2" />
                      <g transform={`translate(${p1x + dx/2}, ${p1y + dy/2 - 12})`}>
                         <rect x="-35" y="-15" width="70" height="24" rx="6" fill="#0ea5e9" opacity="0.95" />
                         <text x="0" y="2" fill="white" fontSize="12" fontWeight="bold" textAnchor="middle">{length.toFixed(2)} m</text>
                      </g>
                   </g>
                 );
               })()}
            </svg>

            {overlayAreas.map((el) => {
              const isSelected = selectedIds.includes(el.id);
              const canInteract = activeTool === 'select' || activeTool === 'rotate';
              const isPool = el.shapeType === 'pool';

              return (
                <div
                  key={el.id}
                  onPointerDown={(e) => handlePointerDownObject(e, el.id, false)}
                  className={`absolute flex items-center justify-center select-none shadow-md transition-shadow duration-300 z-0
                    ${canInteract ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}
                    ${isSelected && canInteract ? 'ring-4 ring-rose-500 ring-offset-2 shadow-2xl' : (canInteract ? 'hover:ring-2 hover:ring-indigo-300' : '')}
                  `}
                  style={{
                    width: el.width * scale, height: el.height * scale,
                    left: el.x * scale + offsetX, top: el.y * scale + offsetY,
                    transform: `rotate(${el.rotation || 0}deg)`,
                    ...getTextureStyle(el.texture),
                    boxShadow: isPool ? `inset 0 0 0 ${0.3 * scale}px #94a3b8` : 'none',
                    borderRadius: isPool ? '8px' : '0px'
                  }}
                >
                  <span className="font-extrabold text-center pointer-events-none drop-shadow-md bg-white/40 px-2 py-0.5 rounded backdrop-blur-sm" style={{ fontSize: `${Math.max(0.5, Math.min(el.width, el.height) * 0.25)}rem` }}>
                    {el.customLabel || el.name}
                  </span>
                </div>
              );
            })}

            {roomAreas.filter(e => e.mode !== 'overlay').map((el) => {
              const isSelected = selectedIds.includes(el.id);
              const isSub = el.mode === 'subtract';
              const canInteract = activeTool === 'select' || activeTool === 'rotate';
              
              return (
                <div
                  key={el.id}
                  className={`absolute z-20 ${canInteract ? 'pointer-events-auto' : 'pointer-events-none'}`}
                  style={{ width: el.width * scale, height: el.height * scale, left: el.x * scale + offsetX, top: el.y * scale + offsetY, transform: `rotate(${el.rotation || 0}deg)` }}
                >
                  <div 
                    onPointerDown={(e) => handlePointerDownObject(e, el.id, false)}
                    className={`w-full h-full cursor-pointer transition-colors duration-300 ${isSelected ? (isSub ? 'bg-rose-500/20 border-2 border-dashed border-rose-600' : 'bg-indigo-500/10 border-2 border-dashed border-indigo-600') : (isSub && canInteract ? 'hover:bg-rose-500/10' : (canInteract ? 'hover:bg-slate-500/5' : ''))}`}
                    style={{ clipPath: getShapeClipPath(el) }}
                  >
                    {el.customLabel && (
                      <span className="absolute inset-0 flex items-center justify-center font-extrabold text-slate-500 opacity-80 uppercase tracking-widest pointer-events-none" style={{ fontSize: `${Math.max(0.6, Math.min(el.width, el.height) * 0.2)}rem` }}>
                        {el.customLabel}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {physicalStructures.map((el) => {
              const isSelected = selectedIds.includes(el.id);
              const canInteract = activeTool === 'select' || activeTool === 'rotate';
              
              return (
                <div
                  key={el.id}
                  onPointerDown={(e) => handlePointerDownObject(e, el.id, false)}
                  className={`absolute flex items-center justify-center select-none shadow-md transition-shadow duration-300 ${canInteract ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}
                    ${el.shape} ${el.color} ${el.texture === 'none' ? '' : 'border-[3px]'}
                    ${isSelected && canInteract ? 'ring-4 ring-rose-500 ring-offset-2 z-40 shadow-2xl' : (canInteract ? 'hover:ring-2 hover:ring-indigo-300 z-20' : 'z-20')}
                  `}
                  style={{
                    width: el.width * scale, height: el.height * scale,
                    left: el.x * scale + offsetX, top: el.y * scale + offsetY,
                    transform: `rotate(${el.rotation || 0}deg)`,
                    ...getTextureStyle(el.texture)
                  }}
                >
                  <span className="font-extrabold text-center pointer-events-none drop-shadow-md bg-white/40 px-2 py-0.5 rounded backdrop-blur-sm" style={{ fontSize: `${Math.max(0.5, Math.min(el.width, el.height) * 0.25)}rem` }}>
                    {el.customLabel || el.name}
                  </span>
                </div>
              );
            })}

            {placedTables.map((el) => {
              const isSelected = selectedIds.includes(el.id);
              const occupancy = guests.filter(g => g.tableId === el.id).reduce((s, g) => s + g.passes, 0);
              const isSearched = globalSearch && guests.some(g => g.tableId === el.id && g.name.toLowerCase().includes(globalSearch.toLowerCase()));
              const canInteract = activeTool === 'select' || activeTool === 'rotate';

              return (
                <div
                  key={el.id}
                  onPointerDown={(e) => handlePointerDownObject(e, el.id, true)}
                  className={`absolute flex items-center justify-center select-none transition-shadow duration-300 ${canInteract ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}
                    ${isSelected && canInteract ? 'ring-4 ring-rose-500 ring-offset-[6px] rounded-full' : (canInteract ? 'hover:ring-2 hover:ring-indigo-400 hover:ring-offset-4 rounded-full' : '')}
                  `}
                  style={{
                    width: el.width * scale, height: el.height * scale,
                    left: el.x * scale + offsetX, top: el.y * scale + offsetY,
                    transform: `rotate(${el.rotation || 0}deg)`,
                    zIndex: isSearched ? 9999 : (isSelected ? 50 : 40)
                  }}
                >
                  <TableWithChairs tableData={el} occupancy={occupancy} scale={scale} tableGuests={guests.filter(g => g.tableId === el.id)} searchQuery={globalSearch} />
                </div>
              );
            })}

            <div className="absolute bottom-6 right-6 z-[600] flex flex-col gap-3 pointer-events-none">
              <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-2xl border border-slate-200 flex flex-col pointer-events-auto">
                <button onClick={() => setScale(s => Math.min(200, s + Math.max(2, s * 0.1)))} className="p-2.5 text-slate-600 hover:bg-slate-100 hover:text-indigo-600 rounded-xl transition-colors" title="Acercar">
                  <Plus size={24}/>
                </button>
                <div className="h-px bg-slate-200 mx-2 my-1"></div>
                <button onClick={() => setScale(s => Math.max(5, s - Math.max(2, s * 0.1)))} className="p-2.5 text-slate-600 hover:bg-slate-100 hover:text-indigo-600 rounded-xl transition-colors" title="Alejar">
                  <Minus size={24}/>
                </button>
              </div>
              <button onClick={centerAndFitMap} className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-2xl border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors pointer-events-auto flex items-center justify-center group" title="Ajustar y Centrar Plano">
                <Maximize size={24} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>

          </div>
        </div>

        {/* BARRA DERECHA: EDICIÓN MAESTRA Y CATÁLOGOS */}
        {isEditMode && (
          <div className="w-full md:w-[280px] border-t md:border-t-0 md:border-l border-slate-200 bg-slate-50 flex flex-col z-20 max-h-64 md:max-h-full">
            
            <div className="p-3 bg-white border-b border-slate-200 shadow-sm shrink-0 flex flex-col gap-1.5">
               <button onClick={() => { setIsEditMode(false); setSelectedIds([]); centerAndFitMap(); }} className="w-full py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm flex items-center justify-center">
                 <CheckCircle size={14} className="mr-1.5"/> Guardar Diseño
               </button>
               {/* 🔴 BOTÓN EXPORTAR PDF PARA MAPA (CROQUIS) */}
               <button onClick={() => setShowExportModal(true)} className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm flex items-center justify-center">
                 <FileDown size={14} className="mr-1.5"/> Descargar PDF
               </button>
               <div className="flex gap-1.5 mt-1">
                 <button onClick={handleUndo} disabled={history.length === 0} className={`flex-1 py-1.5 rounded-md text-[10px] font-bold flex items-center justify-center transition-colors border ${history.length > 0 ? 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300 shadow-sm' : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'}`}><RotateCw size={12} className="mr-1" style={{ transform: 'scaleX(-1)' }}/> Deshacer</button>
                 <button onClick={async () => { 
                   if(window.confirm('¿Estás seguro de limpiar todo el plano? Esta acción no se puede deshacer.')) { 
                     saveHistory(elements, tables);
                     const promesasMapa = elements.map(e => deleteDoc(doc(db, "eventos", ID_DEL_EVENTO, "mapa", String(e.id))));
                     const promesasMesas = placedTables.map(t => setDoc(doc(db, "eventos", ID_DEL_EVENTO, "mesas", String(t.id)), { ...t, x: null, y: null, rotation: 0, groupId: null }));
                     await Promise.all([...promesasMapa, ...promesasMesas]);
                     setSelectedIds([]); 
                     setPan({x:0, y:0}); 
                   } 
                 }} className="flex-1 py-1.5 bg-white border border-rose-200 text-rose-600 rounded-md text-[10px] font-bold hover:bg-rose-50 transition-colors shadow-sm flex items-center justify-center"><Trash2 size={12} className="mr-1"/> Limpiar</button>
               </div>
               <button onClick={() => setRoomGrouped(!roomGrouped)} className={`w-full mt-1 py-1.5 rounded-md text-[10px] font-bold flex items-center justify-center transition-colors border shadow-sm ${roomGrouped ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}><Layers size={12} className="mr-1.5"/> {roomGrouped ? 'Desvincular Salón Compuesto' : 'Vincular Salón Compuesto'}</button>
            </div>

            {renderContextualMenu()}

            <div className="p-3 overflow-y-auto flex-1 hide-scrollbar">
              
              <h3 className="font-bold text-slate-700 mb-2 text-[10px] uppercase tracking-wider flex items-center">
                <Spline size={12} className="mr-1.5"/> 1. Áreas y Exteriores
              </h3>
              <div className="grid grid-cols-3 gap-1.5 mb-4">
                {ROOM_AREAS_CATALOG.map((tmpl, idx) => {
                  if (tmpl.shapeType === 'polygon') return null; 
                  return (
                    <div key={idx} draggable onDragStart={(e) => handleDragStart(e, tmpl, 'room_area')} className="bg-white p-1.5 rounded-lg border border-slate-300 text-center cursor-grab active:cursor-grabbing hover:bg-indigo-50 hover:border-indigo-300 transition-colors shadow-sm">
                       <div className="h-6 flex items-center justify-center mb-1 text-slate-500">
                          <div 
                            className="border border-current bg-slate-100" 
                            style={{ 
                              width: '18px', height: '18px',
                              borderRadius: tmpl.shapeType === 'ellipse' && tmpl.name === 'Área Circular' ? '50%' : tmpl.shapeType === 'ellipse' ? '50%' : '2px',
                              clipPath: tmpl.shapeType === 'triangle' ? 'polygon(0 0, 0 100%, 100% 100%)' : 'none',
                              ...(tmpl.mode === 'overlay' ? getTextureStyle(tmpl.texture) : {})
                            }}
                          ></div>
                       </div>
                       <p className="text-[8px] font-bold text-slate-600 leading-tight">{tmpl.name}</p>
                    </div>
                  );
                })}
              </div>

              <h3 className="font-bold text-indigo-700 mb-2 text-[10px] uppercase tracking-wider flex items-center pt-2 border-t border-slate-200">
                <Users size={12} className="mr-1.5"/> 2. Mesas Reales ({availableTables.length})
              </h3>
              <div className="space-y-1.5 mb-4">
                {availableTables.map((table) => {
                  const occupancy = guests.filter(g => g.tableId === table.id).reduce((s, g) => s + g.passes, 0);
                  const tType = table.tipo || table.type;
                  let tW = 1.5, tH = 1.5;
                  if (tType === 'rect_table' || tType === 'tablon') { tW = 2.44; tH = 0.7; }
                  else if (tType === 'ovalada') { tW = 3.05; tH = 1.22; }
                  else if (tType === 'serpentina') { tW = 1.8; tH = 1.8; }
                  else if (tType === 'personalizada' || tType === 'libre') { tW = table.configDetalle?.libreMedidas?.largo || 2; tH = table.configDetalle?.libreMedidas?.ancho || 1; }

                  return (
                    <div key={table.id} draggable onDragStart={(e) => handleDragStart(e, {id: table.id, width: tW, height: tH}, 'existing_table')} className="bg-white p-1.5 rounded-lg border border-indigo-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-500 hover:shadow-md transition-all flex items-center">
                      <div className="w-6 h-6 bg-indigo-50 rounded flex items-center justify-center mr-2 text-indigo-500 flex-shrink-0">
                        {table.type === 'round_table' || table.tipo === 'redonda' ? <div className="w-3 h-3 rounded-full border-[1.5px] border-current"></div> : <div className="w-3 h-3 rounded-sm border-[1.5px] border-current"></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{table.name}</p>
                        <p className="text-[8px] text-slate-500 uppercase font-semibold">{occupancy}/{table.capacity} Sillas</p>
                      </div>
                    </div>
                  );
                })}
                {availableTables.length === 0 && <p className="text-[9px] text-slate-400 italic text-center py-1 bg-white rounded border border-dashed border-slate-300">Todas ubicadas en el plano.</p>}
              </div>

              <h3 className="font-bold text-emerald-700 mb-2 text-[10px] uppercase tracking-wider flex items-center pt-2 border-t border-slate-200">
                <Plus size={12} className="mr-1.5"/> 3. Mesas Extra
              </h3>
              <div className="grid grid-cols-4 gap-1.5 mb-4">
                {TABLE_TEMPLATES.map((tmpl, idx) => {
                  let iconEl;
                  if (tmpl.type === 'round_table') iconEl = <div className="mx-auto mb-1 border-[1.5px] border-emerald-500 rounded-full w-4 h-4"></div>;
                  else if (tmpl.type === 'square_table') iconEl = <div className="mx-auto mb-1 border-[1.5px] border-emerald-500 rounded-sm w-4 h-4"></div>;
                  else if (tmpl.type === 'rect_table') iconEl = <div className="mx-auto mb-1 border-[1.5px] border-emerald-500 rounded-sm w-5 h-2.5 mt-1"></div>;
                  else if (tmpl.type === 'ovalada') iconEl = <div className="mx-auto mb-1 border-[1.5px] border-emerald-500 rounded-[10px] w-6 h-2.5 mt-1"></div>;
                  else if (tmpl.type === 'serpentina') iconEl = (
                    <svg className="mx-auto mb-1" width="16" height="16" viewBox="0 0 20 20">
                      <path d="M 2 18 A 16 16 0 0 1 18 2 L 18 7 A 11 11 0 0 0 7 18 Z" fill="none" stroke="#10b981" strokeWidth="1.5" />
                    </svg>
                  );

                  return (
                    <div key={idx} draggable onDragStart={(e) => handleDragStart(e, tmpl, 'new_table')} className="bg-white p-1.5 rounded-lg border border-emerald-200 text-center cursor-grab active:cursor-grabbing hover:bg-emerald-50 transition-colors shadow-sm">
                       {iconEl}
                       <p className="text-[8px] font-bold text-slate-600 leading-tight">{tmpl.name}</p>
                    </div>
                  );
                })}
              </div>

              <h3 className="font-bold text-slate-700 mb-2 text-[10px] uppercase tracking-wider flex items-center pt-2 border-t border-slate-200">
                <Move size={12} className="mr-1.5"/> 4. Físico
              </h3>
              <div className="space-y-1.5">
                {STRUCTURAL_CATALOG.map((item, idx) => (
                  <div key={idx} draggable onDragStart={(e) => handleDragStart(e, item, 'structure')} className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-slate-400 hover:shadow-md transition-all flex items-center">
                    <div className="w-8 h-8 rounded flex items-center justify-center mr-2 border border-slate-300 flex-shrink-0 shadow-inner" style={getTextureStyle(item.texture)}></div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 leading-tight">{item.name}</p>
                      <p className="text-[8px] text-slate-500 uppercase tracking-wide font-semibold">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

      </div>

      {/* MODAL: SEPARAR FAMILIA O MOVER GRUPO */}
      {guestSplitPrompt && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden p-6 text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4"><Users size={32} /></div>
            <h3 className="font-bold text-xl text-slate-800 mb-2">Mover Invitado</h3>
            <p className="text-slate-500 mb-6 text-sm"><b>{guestSplitPrompt.guest.name}</b> tiene {guestSplitPrompt.guest.passes} pases. ¿Deseas mover a toda la familia a la nueva mesa o separar solo 1 pase?</p>
            <div className="flex flex-col space-y-2">
              <button onClick={() => handleSplitChoice('all')} className="w-full p-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm">Mover toda la familia ({guestSplitPrompt.guest.passes})</button>
              <button onClick={() => handleSplitChoice('one')} className="w-full p-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Separar 1 pase individual</button>
              <button onClick={() => setGuestSplitPrompt(null)} className="w-full p-3 text-slate-400 font-bold hover:text-slate-600 mt-2 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 MODAL: VISTA PREVIA EXPORTACIÓN MAPA (CARTA HORIZONTAL) */}
      {showExportModal && (
        <div className="fixed inset-0 z-[120] bg-slate-900/95 flex flex-col overflow-hidden backdrop-blur-sm">
          <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row justify-between items-center shadow-lg border-b border-slate-700 z-10 shrink-0 gap-4">
            <div className="flex items-center space-x-4 w-full sm:w-auto">
              <button onClick={() => setShowExportModal(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={24}/></button>
              <div>
                <h3 className="font-bold text-sm">Vista Previa de Exportación</h3>
                <p className="text-[10px] text-slate-400">Ajusta el zoom, bloquea y descarga.</p>
              </div>
            </div>
            <button onClick={triggerPdfDownload} disabled={isPreparingPrint} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold flex items-center shadow-lg transition-all w-full sm:w-auto justify-center disabled:bg-slate-600">
              {isPreparingPrint ? <RefreshCw size={18} className="mr-2 animate-spin"/> : <Download size={18} className="mr-2"/>} 
              {isPreparingPrint ? 'Armando PDF...' : 'Guardar PDF'}
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center py-8 relative gap-8">
             <div className="bg-white shadow-[0_0_40px_rgba(0,0,0,0.5)] relative shrink-0 map-pdf-page flex flex-col" style={{ width: '279.4mm', height: '215.9mm', padding: '15mm', boxSizing: 'border-box', overflow: 'hidden' }}>
               
               <header className="border-b-4 border-slate-900 pb-2 mb-4 flex justify-between items-end shrink-0">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Plano y Acomodo</h1>
                    <p className="text-slate-500 text-sm font-medium">Proyecto: Boda Ana & Luis</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-400">Escala Ajustada (Carta Horizontal)</p>
                  </div>
               </header>

               <div 
                 onPointerDown={handlePrintPointerDown} onPointerMove={handlePrintPointerMove} onPointerUp={handlePrintPointerUp} onPointerLeave={handlePrintPointerUp} onWheel={handlePrintWheel}
                 className={`w-full flex-1 bg-[#eef2f6] border-2 border-slate-300 rounded-xl relative overflow-hidden flex shadow-inner ${isBlueprintPanActive ? 'cursor-grab active:cursor-grabbing touch-none ring-4 ring-indigo-300' : ''}`}
               >
                  {!isCapturingPdf && (
                    <div className="absolute top-3 left-3 z-50 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <button onClick={() => setIsBlueprintPanActive(!isBlueprintPanActive)} className={`px-3 py-2 transition-colors rounded-xl font-bold text-[10px] flex items-center shadow-lg border border-slate-700 ${isBlueprintPanActive ? 'bg-indigo-500 text-white' : 'bg-slate-900/90 text-white hover:bg-slate-800'}`}>
                        <Hand size={14} className="mr-1.5"/> {isBlueprintPanActive ? 'Arrastre Activo (Bloquear para PDF)' : 'Activar Arrastre'}
                      </button>
                      <div className="bg-slate-900/90 backdrop-blur text-white rounded-xl shadow-lg flex items-center pointer-events-auto border border-slate-700">
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPrintScale(s => Math.max(0.1, s - 0.15)); }} className="p-3 hover:bg-white/20 transition-colors rounded-l-xl active:bg-white/30 touch-manipulation"><Minus size={16} /></button>
                        <div className="w-px h-5 bg-white/20"></div>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPrintScale(s => Math.min(5, s + 0.15)); }} className="p-3 hover:bg-white/20 transition-colors rounded-r-xl active:bg-white/30 touch-manipulation"><Plus size={16} /></button>
                      </div>
                    </div>
                  )}

                  <div style={{ transform: `translate(${printPan.x}px, ${printPan.y}px) scale(${printScale})`, transformOrigin: '0 0', width: '100%', height: '100%' }}>
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ overflow: 'visible' }}>
                       <defs>
                         <mask id="printRoomMask">
                           <rect x="-5000" y="-5000" width="10000" height="10000" fill="black" />
                           {addAreas.map(el => renderSVGShape(el, scale, 0, 0, { fill: 'white' }))}
                           {subAreas.map(el => renderSVGShape(el, scale, 0, 0, { fill: 'black' }))}
                         </mask>
                         <mask id="printOuterWallMask">
                           <rect x="-5000" y="-5000" width="10000" height="10000" fill="white" />
                           {addAreas.map(el => renderSVGShape(el, scale, 0, 0, { fill: 'black' }))}
                           {subAreas.map(el => renderSVGShape(el, scale, 0, 0, { fill: 'black' }))}
                         </mask>
                         <mask id="printSubWallMask">
                           <rect x="-5000" y="-5000" width="10000" height="10000" fill="black" />
                           {addAreas.map(el => renderSVGShape(el, scale, 0, 0, { fill: 'white' }))}
                           {subAreas.map(el => renderSVGShape(el, scale, 0, 0, { fill: 'black' }))}
                         </mask>
                       </defs>
                       <g>
                         <rect x="-5000" y="-5000" width="10000" height="10000" fill="#ffffff" mask="url(#printRoomMask)" />
                         <g mask="url(#printOuterWallMask)">
                           {addAreas.map(el => renderSVGShape(el, scale, 0, 0, { stroke: '#1e293b', strokeWidth: scale * 0.10, strokeLinejoin: 'round', fill: 'none' }))}
                         </g>
                         <g mask="url(#printSubWallMask)">
                           {subAreas.map(el => renderSVGShape(el, scale, 0, 0, { stroke: '#1e293b', strokeWidth: scale * 0.10, strokeLinejoin: 'round', fill: 'none' }))}
                         </g>
                       </g>
                    </svg>

                    {overlayAreas.map((el) => (
                      <div key={el.id} className="absolute flex items-center justify-center select-none pointer-events-none z-0" style={{ width: el.width * scale, height: el.height * scale, left: el.x * scale, top: el.y * scale, transform: `rotate(${el.rotation || 0}deg)`, ...getTextureStyle(el.texture), boxShadow: el.shapeType === 'pool' ? `inset 0 0 0 ${0.3 * scale}px #94a3b8` : 'none', borderRadius: el.shapeType === 'pool' ? '8px' : '0px' }}>
                        <span className="font-extrabold text-center drop-shadow-md bg-white/40 px-2 py-0.5 rounded backdrop-blur-sm" style={{ fontSize: `${Math.max(0.5, Math.min(el.width, el.height) * 0.25)}rem` }}>{el.customLabel || el.name}</span>
                      </div>
                    ))}

                    {roomAreas.filter(e => e.mode !== 'overlay').map((el) => (
                      <div key={el.id} className="absolute z-20 pointer-events-none" style={{ width: el.width * scale, height: el.height * scale, left: el.x * scale, top: el.y * scale, transform: `rotate(${el.rotation || 0}deg)` }}>
                        <div className="w-full h-full" style={{ clipPath: getShapeClipPath(el) }}>
                          {el.customLabel && <span className="absolute inset-0 flex items-center justify-center font-extrabold text-slate-500 opacity-80 uppercase tracking-widest pointer-events-none" style={{ fontSize: `${Math.max(0.6, Math.min(el.width, el.height) * 0.2)}rem` }}>{el.customLabel}</span>}
                        </div>
                      </div>
                    ))}

                    {physicalStructures.map((el) => (
                      <div key={el.id} className={`absolute flex items-center justify-center select-none shadow-md pointer-events-none z-20 ${el.shape} ${el.color} ${el.texture === 'none' ? '' : 'border-[3px]'}`} style={{ width: el.width * scale, height: el.height * scale, left: el.x * scale, top: el.y * scale, transform: `rotate(${el.rotation || 0}deg)`, ...getTextureStyle(el.texture) }}>
                        <span className="font-extrabold text-center drop-shadow-md bg-white/40 px-2 py-0.5 rounded backdrop-blur-sm" style={{ fontSize: `${Math.max(0.5, Math.min(el.width, el.height) * 0.25)}rem` }}>{el.customLabel || el.name}</span>
                      </div>
                    ))}

                    {placedTables.map((el) => {
                      const occupancy = guests.filter(g => g.tableId === el.id).reduce((s, g) => s + g.passes, 0);
                      return (
                        <div key={el.id} className="absolute flex items-center justify-center select-none pointer-events-none z-40" style={{ width: el.width * scale, height: el.height * scale, left: el.x * scale, top: el.y * scale, transform: `rotate(${el.rotation || 0}deg)` }}>
                          <TableWithChairs tableData={el} occupancy={occupancy} scale={scale} tableGuests={guests.filter(g => g.tableId === el.id)} searchQuery={""} />
                        </div>
                      );
                    })}
                  </div>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// VISTA NUEVA: VISUALIZADOR DE DECORACIÓN (VECTORES PROFESIONALES SVG)
// ==========================================

// --- FUNCIONES MATEMÁTICAS PARA CURVAS SUAVES ---
const catmullRom = (t, p0, p1, p2, p3) => {
  const t2 = t * t; const t3 = t2 * t;
  return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
};

const getSplinePoint = (t, points) => {
  const p = points.length - 1;
  const scaledT = t * p;
  const i = Math.floor(scaledT);
  const localT = scaledT - i;
  
  const p0 = points[Math.max(0, i - 1)];
  const p1 = points[i];
  const p2 = points[Math.min(p, i + 1)];
  const p3 = points[Math.min(p, i + 2)];
  
  return {
    x: catmullRom(localT, p0.x, p1.x, p2.x, p3.x),
    y: catmullRom(localT, p0.y, p1.y, p2.y, p3.y)
  };
};

const DECO_CATALOG = [
  { type: 'mampara_arco', name: 'Mampara Arco', defaultW: 1.2, defaultH: 2.2, defaultColor: '#fecdd3' },
  { type: 'mampara_cuad', name: 'Mampara Recta', defaultW: 1.5, defaultH: 2.2, defaultColor: '#bfdbfe' },
  { type: 'globo_guirnalda', name: 'Guirnalda Libre', defaultW: 2.5, defaultH: 2.5, defaultColor: '#fde047', colors: ['#fde047', '#ffffff'] },
  { type: 'globo_individual', name: 'Globo/Tercia', defaultW: 0.5, defaultH: 0.5, defaultColor: '#fcd34d', clusterType: 'single', sizeInches: 11 },
  { type: 'letras_neon', name: 'Letras Neón', defaultW: 1.2, defaultH: 0.4, text: 'Better Together', defaultColor: '#fef08a' },
  { type: 'mesa_principal', name: 'Mesa Novios', defaultW: 2.0, defaultH: 0.75, defaultColor: '#ffffff' },
  { type: 'silla_tiffany', name: 'Silla Tiffany', defaultW: 0.4, defaultH: 0.9, defaultColor: '#e5e7eb' },
  { type: 'sillon_lounge', name: 'Sillón Lounge', defaultW: 1.5, defaultH: 0.8, defaultColor: '#fbcfe8' },
  { type: 'silla_trono', name: 'Trono Rey/Reina', defaultW: 0.8, defaultH: 1.6, defaultColor: '#fef08a' },
  { type: 'arbol_pino', name: 'Pino Elegante', defaultW: 1.0, defaultH: 2.5, defaultColor: '#16a34a' },
  { type: 'arbusto_redondo', name: 'Arbusto Topiario', defaultW: 0.8, defaultH: 1.2, defaultColor: '#22c55e' },
  { type: 'arbol_cerezo', name: 'Árbol Follaje', defaultW: 1.5, defaultH: 2.5, defaultColor: '#fecdd3' },
  { type: 'flor_rosa', name: 'Rosas (Arreglo)', defaultW: 0.8, defaultH: 0.6, defaultColor: '#ef4444' },
  { type: 'flor_girasol', name: 'Girasoles', defaultW: 0.8, defaultH: 0.8, defaultColor: '#eab308' },
  { type: 'flor_tulipan', name: 'Tulipanes', defaultW: 0.6, defaultH: 0.7, defaultColor: '#d946ef' }
];

const PRESET_COLORS = ['#ffffff', 'rgba(255, 255, 255, 0.4)', '#fecdd3', '#fbcfe8', '#bfdbfe', '#a7f3d0', '#6ee7b7', '#16a34a', '#fde047', '#eab308', '#fcd34d', '#fed7aa', '#e5e7eb', '#9ca3af', '#1f2937', '#d946ef', '#ef4444'];

const DecoracionView = ({ elements = [], setElements, addNotification }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [dragging, setDragging] = useState(null);

  const [isEditMode, setIsEditMode] = useState(true);
  const [activeTool, setActiveTool] = useState('select'); 
 
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [selectedBalloonId, setSelectedBalloonId] = useState(null);
  
  const [pan, setPan] = useState({ x: 0, y: 150 }); 
  const [scale, setScale] = useState(90); 
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [snapGuides, setSnapGuides] = useState({ x: null, y: null });

  const [bgImage, setBgImage] = useState(() => localStorage.getItem('deco_bgImage') || null);
  const [bgImgSize, setBgImgSize] = useState(() => JSON.parse(localStorage.getItem('deco_bgSize')) || { w: 10, h: 10 });
  const [bgPos, setBgPos] = useState(() => JSON.parse(localStorage.getItem('deco_bgPos')) || { x: 0, y: 0 });
  
  const [calibrationLine, setCalibrationLine] = useState(null);
  const [calibrationModal, setCalibrationModal] = useState(null);
  const [realDistanceInput, setRealDistanceInput] = useState('');
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false); 
  const [isBlueprintPanActive, setIsBlueprintPanActive] = useState(false); 

  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [isCapturingPdf, setIsCapturingPdf] = useState(false);

  const fileInputRefBg = useRef(null);

  const [printScale, setPrintScale] = useState(1);
  const [printPan, setPrintPan] = useState({ x: 0, y: 0 });
  const [isPrintDragging, setIsPrintDragging] = useState(false);
  const [printDragStart, setPrintDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);
  const [vp, setVp] = useState({ w: 0, h: 0 });

  const stateRef = useRef({ scale, pan, vp, offsetX: 0, offsetY: 0 });
  const offsetX = (vp.w / 2) + pan.x;
  const offsetY = (vp.h / 2) + pan.y;
  stateRef.current = { scale, pan, vp, offsetX, offsetY };

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setVp({ w: width, h: height });
    });
    resizeObserver.observe(container);

    const handleWheel = (e) => {
      e.preventDefault();
      const st = stateRef.current;
      const zoomSensitivity = 0.003;
      const delta = -e.deltaY * zoomSensitivity;
      const newScale = Math.min(Math.max(20, st.scale * (1 + delta)), 400);
      
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const worldX = (mouseX - st.offsetX) / st.scale;
      const worldY = (mouseY - st.offsetY) / st.scale;

      const newOffsetX = mouseX - worldX * newScale;
      const newOffsetY = mouseY - worldY * newScale;

      setPan({ x: newOffsetX - (st.vp.w / 2), y: newOffsetY - (st.vp.h / 2) });
      setScale(newScale);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => { resizeObserver.disconnect(); container.removeEventListener('wheel', handleWheel); };
  }, []);

  useEffect(() => {
    if (showExportModal) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      if (bgImage) {
          minX = Math.min(minX, bgPos.x); minY = Math.min(minY, bgPos.y);
          maxX = Math.max(maxX, bgPos.x + bgImgSize.w); maxY = Math.max(maxY, bgPos.y + bgImgSize.h);
      }
      elements.forEach(el => {
          minX = Math.min(minX, el.x); minY = Math.min(minY, el.y);
          maxX = Math.max(maxX, el.x + el.width); maxY = Math.max(maxY, el.y + el.height);
      });
      if (minX === Infinity) { minX = 0; minY = 0; maxX = 10; maxY = 10; }

      const designW = (maxX - minX) * scale;
      const designH = (maxY - minY) * scale;
      const cx = (minX * scale) + designW / 2; 
      const cy = (minY * scale) + designH / 2;
      
      const targetW = 750; 
      const targetH = 380; 
      const initialZoom = Math.min(targetW / (designW || 1), targetH / (designH || 1)) * 0.85; 
      
      setPrintScale(initialZoom);
      setPrintPan({ x: (targetW / 2) - (cx * initialZoom), y: (targetH / 2) - (cy * initialZoom) });
    }
  }, [showExportModal, elements, bgImage, bgPos, bgImgSize, scale]);

  const handleBgUpload = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
       const img = new Image();
       img.onload = () => {
          const aspect = img.height / img.width;
          const newSize = { w: 15, h: 15 * aspect };
          const newPos = { x: 0, y: 0 };
          
          setBgImgSize(newSize); setBgPos(newPos); setBgImage(event.target.result); setPan({x:0, y:0}); 
          localStorage.setItem('deco_bgImage', event.target.result);
          localStorage.setItem('deco_bgSize', JSON.stringify(newSize));
          localStorage.setItem('deco_bgPos', JSON.stringify(newPos));
          if(addNotification) addNotification('Plano Cargado', 'Usa la herramienta "Calibrar" y luego "Mover Fondo".', 'info');
       };
       img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const removeBackground = () => {
    setBgImage(null); setCalibrationLine(null);
    localStorage.removeItem('deco_bgImage'); localStorage.removeItem('deco_bgSize'); localStorage.removeItem('deco_bgPos');
    setActiveTool('select');
  };

  const applyCalibration = () => {
    const realMeters = parseFloat(realDistanceInput);
    if (!realMeters || isNaN(realMeters)) {
      if(addNotification) addNotification('Atención', 'Ingresa un número válido en metros.', 'warning');
      return;
    }
    const factor = realMeters / calibrationModal.lengthWorld;
    const newSize = { w: bgImgSize.w * factor, h: bgImgSize.h * factor };
    
    setBgImgSize(newSize); localStorage.setItem('deco_bgSize', JSON.stringify(newSize));
    setCalibrationModal(null); setCalibrationLine(null); setActiveTool('select');
    if(addNotification) addNotification('Plano Calibrado', 'El fondo coincide con medidas reales.', 'success');
  };

  const executeClearAll = async () => {
    elements.forEach(e => deleteDoc(doc(db, "eventos", ID_DEL_EVENTO, "decoracion", e.id)));
    setElements([]); 
    setSelectedId(null); 
    setEditingGroupId(null); 
    removeBackground();
    setShowClearConfirm(false);
    if(addNotification) addNotification('Lienzo Limpio', 'Se ha borrado todo el diseño.', 'success');
  };

  const handleDragStart = (e, item) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(item));
    e.dataTransfer.setData('text', JSON.stringify(item));
    e.dataTransfer.setData('payload', JSON.stringify(item)); 
  };

  const createNewElement = async (payload, finalX, finalY) => {
    let extraProps = {};
    if (payload.type === 'globo_guirnalda') {
      const clusterCount = 15;
      extraProps.balloonCount = clusterCount * 3;
      extraProps.controlPoints = [ {x: 0, y: 0.5}, {x: 0.166, y: 0.5}, {x: 0.333, y: 0.5}, {x: 0.5, y: 0.5}, {x: 0.666, y: 0.5}, {x: 0.833, y: 0.5}, {x: 1, y: 0.5} ];
      const balloons = [];
      for (let c = 0; c < clusterCount; c++) {
        const clusterId = `init_${c}`;
        const t = c / (clusterCount - 1 || 1);
        const clusterAngleOffset = Math.random() * Math.PI * 2;
        for (let j = 0; j < 3; j++) {
          const angle = clusterAngleOffset + (j * (Math.PI * 2 / 3));
          const radiusOffset = 0.06 + (Math.random() * 0.04);
          balloons.push({ id: c * 3 + j, clusterId, t, isMain: j === 0, offsetX: Math.cos(angle) * radiusOffset, offsetY: Math.sin(angle) * radiusOffset, sizeInches: j === 0 ? 11 : 9, colorOverride: null });
        }
      }
      extraProps.balloons = balloons;
    } else if (payload.type === 'globo_individual') {
      extraProps.clusterType = payload.clusterType;
      extraProps.sizeInches = payload.sizeInches;
      let initBalloons = [{id: 0, clusterId: 1, colorOverride: null}];
      if(payload.clusterType === 'tercia') initBalloons = [{id:0, clusterId: 1, colorOverride: null}, {id:1, clusterId: 1, colorOverride: null}, {id:2, clusterId: 1, colorOverride: null}];
      if(payload.clusterType === 'cuarteto') initBalloons = [{id:0, clusterId: 1, colorOverride: null}, {id:1, clusterId: 1, colorOverride: null}, {id:2, clusterId: 1, colorOverride: null}, {id:3, clusterId: 1, colorOverride: null}, {id:4, clusterId: 1, colorOverride: null}];
      extraProps.balloons = initBalloons;
    }

    const newEl = {
      id: `deco_${Date.now()}_${Math.floor(Math.random()*1000)}`,
      type: payload.type, name: payload.name, width: payload.defaultW, height: payload.defaultH, x: finalX, y: finalY,
      color: payload.defaultColor, colors: payload.colors || [payload.defaultColor], rotation: 0, zIndex: elements.length + 1, text: payload.text || '', ...extraProps
    };

    setElements(prev => [...prev, newEl]);
    setSelectedId(newEl.id);
    try { await setDoc(doc(db, "eventos", ID_DEL_EVENTO, "decoracion", newEl.id), newEl); } catch(err) {}
  };

  const handleDropOnCanvas = (e) => {
    e.preventDefault(); e.stopPropagation();
    try {
      const payloadData = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text') || e.dataTransfer.getData('payload');
      if (!payloadData) return;
      const payload = JSON.parse(payloadData);
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left; const mouseY = e.clientY - rect.top;
      const finalX = (mouseX - offsetX) / scale - (payload.defaultW / 2);
      const finalY = (mouseY - offsetY) / scale - (payload.defaultH / 2);
      createNewElement(payload, finalX, finalY);
    } catch (error) {}
  };

  const handlePointerDown = (e, id, type = 'element', index = null) => {
    e.stopPropagation(); 
    
    setSelectedId(id);
    if(type === 'element' && editingGroupId !== id) { setEditingGroupId(null); setSelectedBalloonId(null); } 
    else if (type === 'element' && editingGroupId === id) { setSelectedBalloonId(null); return; }
    
    const el = elements.find(item => item.id === id);
    if(el) {
      let groupOffsets = [];
      if (type === 'balloon') {
        const b = el.balloons.find(x => x.id === index);
        if (b && b.clusterId) groupOffsets = el.balloons.filter(x => x.clusterId === b.clusterId).map(x => ({id: x.id, ox: x.offsetX || 0, oy: x.offsetY || 0}));
        else if (b) groupOffsets = [{id: b.id, ox: b.offsetX || 0, oy: b.offsetY || 0}];
      }

      setDragging({ 
        id, type, balloonId: type === 'balloon' ? index : null, index,
        startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y, 
        origCurveX: type === 'curve_control' ? el.controlPoints[index].x : 0, 
        origCurveY: type === 'curve_control' ? el.controlPoints[index].y : 0, w: el.width, h: el.height, groupOffsets
      });
    }
  };

  const handlePointerMove = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if(!rect) return;
    const worldX = ((e.clientX - rect.left) - offsetX) / scale;
    const worldY = ((e.clientY - rect.top) - offsetY) / scale;

    if (activeTool === 'calibrate' && calibrationLine && calibrationLine.isDragging) {
       setCalibrationLine({ ...calibrationLine, x2: worldX, y2: worldY }); return;
    }

    if (!dragging) return;
    
    if (dragging.isPanning) {
      setPan({ x: dragging.startPanX + (e.clientX - dragging.startX), y: dragging.startPanY + (e.clientY - dragging.startY) }); return;
    }

    if (dragging.type === 'move_bg') {
      const newX = dragging.startBgX + (e.clientX - dragging.startX) / scale;
      const newY = dragging.startBgY + (e.clientY - dragging.startY) / scale;
      setBgPos({ x: newX, y: newY });
      return;
    }

    const dxMeters = (e.clientX - dragging.startX) / scale;
    const dyMeters = (e.clientY - dragging.startY) / scale;

    if (dragging.type === 'balloon') {
       const el = elements.find(x => x.id === dragging.id);
       const updatedBalloons = el.balloons.map(b => {
           const inGroup = dragging.groupOffsets.find(go => go.id === b.id);
           if (inGroup) return { ...b, offsetX: inGroup.ox + dxMeters, offsetY: inGroup.oy + dyMeters };
           return b;
       });
       setElements(elements.map(x => x.id === dragging.id ? { ...x, balloons: updatedBalloons } : x)); return;
    }

    if (dragging.type === 'curve_control') {
       const newPoints = [...elements.find(e => e.id === dragging.id).controlPoints];
       newPoints[dragging.index] = { x: dragging.origCurveX + (dxMeters / dragging.w), y: dragging.origCurveY + (dyMeters / dragging.h) };
       setElements(elements.map(el => el.id === dragging.id ? { ...el, controlPoints: newPoints } : el)); return;
    }

    let finalX = dragging.origX + dxMeters;
    let finalY = dragging.origY + dyMeters;
    let guideX = null; let guideY = null;

    if (snapEnabled && !editingGroupId) {
      const snapThreshold = 0.3;
      const myCenter = finalX + (dragging.w / 2); const myMiddle = finalY + (dragging.h / 2);
      const others = elements.filter(el => el.id !== dragging.id);

      for (let other of others) {
        const otherCenter = other.x + (other.width / 2); const otherMiddle = other.y + (other.height / 2);
        if (Math.abs(myCenter - otherCenter) < snapThreshold) { finalX = otherCenter - (dragging.w / 2); guideX = otherCenter; }
        const myBottom = finalY + dragging.h; const otherBottom = other.y + other.height;
        if (Math.abs(myBottom - otherBottom) < snapThreshold) { finalY = otherBottom - dragging.h; guideY = otherBottom; } 
        else if (Math.abs(myMiddle - otherMiddle) < snapThreshold) { finalY = Math.abs(myMiddle - otherMiddle) < snapThreshold ? otherMiddle : guideY; }
      }
    }

    setSnapGuides({ x: guideX, y: guideY });
    setElements(elements.map(el => el.id === dragging.id ? { ...el, x: finalX, y: finalY } : el));
  };

  const handlePointerUp = async () => {
    if (activeTool === 'calibrate' && calibrationLine && calibrationLine.isDragging) {
       setCalibrationLine({ ...calibrationLine, isDragging: false });
       const dx = calibrationLine.x2 - calibrationLine.x1;
       const dy = calibrationLine.y2 - calibrationLine.y1;
       const lengthWorld = Math.sqrt(dx*dx + dy*dy);
       setCalibrationModal({ lengthWorld }); return;
    }

    if (dragging && dragging.type === 'move_bg') {
       localStorage.setItem('deco_bgPos', JSON.stringify(bgPos));
    } else if (dragging && dragging.type !== 'isPanning') {
       const el = elements.find(e => e.id === dragging.id);
       if (el) await setDoc(doc(db, "eventos", ID_DEL_EVENTO, "decoracion", el.id), el);
    }
    
    setDragging(null);
    setSnapGuides({x: null, y: null});
  };

  const updateElementData = async (id, newData) => {
    const el = elements.find(e => e.id === id);
    if(el) {
        const updatedEl = { ...el, ...newData };
        setElements(elements.map(e => e.id === id ? updatedEl : e)); 
        await setDoc(doc(db, "eventos", ID_DEL_EVENTO, "decoracion", id), updatedEl);
    }
  };

  const deleteSelected = async () => {
    if(selectedId) {
       const idToDelete = selectedId;
       setSelectedId(null); setEditingGroupId(null);
       setElements(elements.filter(e => e.id !== idToDelete)); 
       await deleteDoc(doc(db, "eventos", ID_DEL_EVENTO, "decoracion", idToDelete));
    }
  };

  const rotateSelected = async () => {
    const el = elements.find(e => e.id === selectedId);
    if(el) {
        const newRot = (el.rotation || 0) + 15;
        setElements(elements.map(e => e.id === selectedId ? { ...e, rotation: newRot } : e)); 
        await setDoc(doc(db, "eventos", ID_DEL_EVENTO, "decoracion", selectedId), { ...el, rotation: newRot });
    }
  };

  const changeZIndex = async (id, direction) => {
    const el = elements.find(e => e.id === id);
    if(el) {
        const newZ = el.zIndex + direction;
        setElements(elements.map(e => e.id === id ? { ...e, zIndex: newZ } : e)); 
        await setDoc(doc(db, "eventos", ID_DEL_EVENTO, "decoracion", id), { ...el, zIndex: newZ });
    }
  };

  const toggleGarlandColor = (colorId, color) => {
    const el = elements.find(e => e.id === colorId);
    let newColors = [...(el.colors || [el.color])];
    if (newColors.includes(color)) {
      newColors = newColors.filter(c => c !== color);
      if (newColors.length === 0) newColors = [color]; 
    } else {
      newColors.push(color);
    }
    updateElementData(colorId, { colors: newColors, color: newColors[0] });
  };

  const handleGarlandCountChange = (id, newCount) => {
    const el = elements.find(e => e.id === id);
    const validCount = Math.max(3, Math.min(300, newCount)); 
    let newBalloons = [...(el.balloons || [])];
    
    if (validCount > newBalloons.length) {
       let nextId = newBalloons.length > 0 ? Math.max(...newBalloons.map(b=>b.id)) + 1 : 0;
       const clusters = Math.ceil(validCount / 3);
       for (let i = newBalloons.length; i < validCount; i++) {
         const c = Math.floor(i / 3);
         const j = i % 3;
         const t = c / (clusters - 1 || 1);
         const clusterId = `gen_${c}`;
         const angle = (c * 0.7) + (j * (Math.PI * 2 / 3)); 
         const radiusOffset = 0.08 + (Math.random() * 0.03);
         newBalloons.push({
           id: nextId++, clusterId, t, isMain: j === 0,
           offsetX: Math.cos(angle) * radiusOffset,
           offsetY: Math.sin(angle) * radiusOffset,
           sizeInches: j === 0 ? 11 : 9, colorOverride: null
         });
       }
    } else if (validCount < newBalloons.length) {
       newBalloons = newBalloons.slice(0, validCount);
    }
    updateElementData(id, { balloonCount: validCount, balloons: newBalloons });
  };

  const addClusterToGarland = (type) => {
    if (!selectedId) return;
    const el = elements.find(e => e.id === selectedId);
    const refB = el.balloons.find(x => x.id === selectedBalloonId) || el.balloons[Math.floor(el.balloons.length/2)];
    const t = refB ? refB.t : 0.5;
    const baseOx = refB && refB.offsetX != null ? refB.offsetX : 0;
    const baseOy = refB && refB.offsetY != null ? refB.offsetY : 0;
    
    let newBalloons = [];
    let nextId = el.balloons.length > 0 ? Math.max(...el.balloons.map(x=>x.id)) + 1 : 0;
    const rOffset = 0.12; 
    const clusterId = Date.now().toString() + Math.random().toString();

    if (type === 'single') {
      newBalloons.push({ id: nextId++, t, isMain: true, offsetX: baseOx + rOffset, offsetY: baseOy + rOffset, sizeInches: 11, colorOverride: null, clusterId: null });
    } else if (type === 'tercia') {
      newBalloons.push({ id: nextId++, t, isMain: true, offsetX: baseOx, offsetY: baseOy - rOffset, sizeInches: 11, colorOverride: null, clusterId });
      newBalloons.push({ id: nextId++, t, isMain: true, offsetX: baseOx - rOffset*0.86, offsetY: baseOy + rOffset*0.5, sizeInches: 11, colorOverride: null, clusterId });
      newBalloons.push({ id: nextId++, t, isMain: true, offsetX: baseOx + rOffset*0.86, offsetY: baseOy + rOffset*0.5, sizeInches: 11, colorOverride: null, clusterId });
    } else if (type === 'cuarteto') {
      newBalloons.push({ id: nextId++, t, isMain: true, offsetX: baseOx - rOffset*0.7, offsetY: baseOy - rOffset*0.7, sizeInches: 11, colorOverride: null, clusterId });
      newBalloons.push({ id: nextId++, t, isMain: true, offsetX: baseOx + rOffset*0.7, offsetY: baseOy - rOffset*0.7, sizeInches: 11, colorOverride: null, clusterId });
      newBalloons.push({ id: nextId++, t, isMain: true, offsetX: baseOx - rOffset*0.7, offsetY: baseOy + rOffset*0.7, sizeInches: 11, colorOverride: null, clusterId });
      newBalloons.push({ id: nextId++, t, isMain: true, offsetX: baseOx + rOffset*0.7, offsetY: baseOy + rOffset*0.7, sizeInches: 11, colorOverride: null, clusterId });
    }

    updateElementData(el.id, { balloons: [...el.balloons, ...newBalloons], balloonCount: el.balloons.length + newBalloons.length });
    setSelectedBalloonId(newBalloons[0].id);
  };

  const getTransparentStyle = (color) => ({
    backgroundColor: color.includes('rgba') ? undefined : color,
    backgroundImage: color.includes('rgba') ? 'linear-gradient(45deg, #e2e8f0 25%, transparent 25%, transparent 75%, #e2e8f0 75%, #e2e8f0), linear-gradient(45deg, #e2e8f0 25%, transparent 25%, transparent 75%, #e2e8f0 75%, #e2e8f0)' : 'none',
    backgroundPosition: '0 0, 4px 4px', backgroundSize: '8px 8px'
  });

  const renderShape = (el) => {
    const w = el.width * scale; const h = el.height * scale;
    switch(el.type) {
      case 'mampara_arco': return <div style={{ backgroundColor: el.color, width: '100%', height: '100%', borderRadius: `${w/2}px ${w/2}px 0 0`, boxShadow: 'inset 0px -5px 20px rgba(0,0,0,0.1), 0 10px 15px -3px rgba(0,0,0,0.2)' }}><div className="absolute bottom-0 w-full h-2 bg-black/10"></div></div>;
      case 'mampara_cuad': return <div style={{ backgroundColor: el.color, width: '100%', height: '100%', borderRadius: '4px 4px 0 0', boxShadow: 'inset 0px -5px 20px rgba(0,0,0,0.1), 0 10px 15px -3px rgba(0,0,0,0.2)' }}><div className="absolute bottom-0 w-full h-2 bg-black/10"></div></div>;
      case 'silla_tiffany': return (<svg width="100%" height="100%" viewBox="0 0 40 100" style={{ filter: 'drop-shadow(2px 5px 4px rgba(0,0,0,0.15))' }}><rect x="6" y="50" width="3" height="50" fill={el.color} /><rect x="31" y="50" width="3" height="50" fill={el.color} /><rect x="2" y="46" width="36" height="6" rx="2" fill={el.color} opacity="0.9"/><rect x="6" y="0" width="3" height="46" fill={el.color} /><rect x="31" y="0" width="3" height="46" fill={el.color} /><rect x="6" y="5" width="28" height="3" fill={el.color} /><rect x="6" y="15" width="28" height="2" fill={el.color} /><rect x="13" y="17" width="2" height="29" fill={el.color} opacity="0.8"/><rect x="19" y="17" width="2" height="29" fill={el.color} opacity="0.8"/><rect x="25" y="17" width="2" height="29" fill={el.color} opacity="0.8"/></svg>);
      case 'sillon_lounge': return (<svg width="100%" height="100%" viewBox="0 0 150 80" style={{ filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.2))' }}><rect x="20" y="65" width="8" height="15" fill="#451a03" rx="2"/><rect x="122" y="65" width="8" height="15" fill="#451a03" rx="2"/><rect x="10" y="45" width="130" height="20" rx="5" fill={el.color} /><path d="M 20 45 L 20 15 Q 20 0 75 0 Q 130 0 130 15 L 130 45 Z" fill={el.color} opacity="0.95"/><rect x="0" y="30" width="25" height="35" rx="8" fill={el.color} opacity="0.9"/><rect x="125" y="30" width="25" height="35" rx="8" fill={el.color} opacity="0.9"/><circle cx="50" cy="20" r="2" fill="rgba(0,0,0,0.2)"/><circle cx="75" cy="20" r="2" fill="rgba(0,0,0,0.2)"/><circle cx="100" cy="20" r="2" fill="rgba(0,0,0,0.2)"/><circle cx="62.5" cy="30" r="2" fill="rgba(0,0,0,0.2)"/><circle cx="87.5" cy="30" r="2" fill="rgba(0,0,0,0.2)"/></svg>);
      case 'silla_trono': return (<svg width="100%" height="100%" viewBox="0 0 80 160" style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.25))' }}><rect x="15" y="95" width="8" height="65" fill="#b45309" rx="2"/><rect x="57" y="95" width="8" height="65" fill="#b45309" rx="2"/><path d="M 10 95 L 10 40 Q 40 -10 70 40 L 70 95 Z" fill={el.color} /><path d="M 8 95 L 8 40 Q 40 -15 72 40 L 72 95" fill="none" stroke="#eab308" strokeWidth="4"/><rect x="5" y="80" width="70" height="15" rx="4" fill={el.color} opacity="0.9"/><rect x="0" y="60" width="15" height="25" rx="5" fill="#eab308"/><rect x="65" y="60" width="15" height="25" rx="5" fill="#eab308"/><circle cx="40" cy="20" r="4" fill="#eab308"/></svg>);
      case 'arbol_pino': return (<svg width="100%" height="100%" viewBox="0 0 100 200" style={{ filter: 'drop-shadow(0 15px 15px rgba(0,0,0,0.2))' }}><rect x="42" y="160" width="16" height="40" fill="#78350f" rx="3"/><polygon points="10,170 50,80 90,170" fill={el.color} opacity="0.85"/><polygon points="15,120 50,40 85,120" fill={el.color} opacity="0.9"/><polygon points="25,70 50,0 75,70" fill={el.color} /></svg>);
      case 'arbusto_redondo': return (<svg width="100%" height="100%" viewBox="0 0 100 120" style={{ filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.15))' }}><polygon points="30,120 20,80 80,80 70,120" fill="#78350f" /><rect x="15" y="70" width="70" height="10" fill="#451a03" rx="2"/><circle cx="50" cy="45" r="45" fill={el.color} /><circle cx="40" cy="35" r="15" fill="#ffffff" opacity="0.15"/><circle cx="65" cy="55" r="10" fill="#000000" opacity="0.1"/></svg>);
      case 'arbol_cerezo': return (<svg width="100%" height="100%" viewBox="0 0 100 200" style={{ overflow: 'visible', filter: 'drop-shadow(0 15px 15px rgba(0,0,0,0.2))' }}><path d="M 45 200 Q 50 100 30 50 M 55 200 Q 50 100 70 60" stroke="#78350f" strokeWidth="8" fill="none" strokeLinecap="round"/><path d="M 45 120 Q 70 90 80 70 M 52 150 Q 30 110 20 90" stroke="#78350f" strokeWidth="5" fill="none" strokeLinecap="round"/><circle cx="30" cy="50" r="30" fill={el.color} opacity="0.9" /><circle cx="70" cy="60" r="35" fill={el.color} opacity="0.85" /><circle cx="50" cy="30" r="40" fill={el.color} opacity="0.95" /><circle cx="20" cy="80" r="25" fill={el.color} opacity="0.8" /><circle cx="80" cy="90" r="25" fill={el.color} opacity="0.8" /><circle cx="50" cy="70" r="30" fill="#ffffff" opacity="0.3" /></svg>);
      case 'flor_rosa': return (<svg width="100%" height="100%" viewBox="0 0 100 80" style={{ filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.2))' }}><path d="M 10 70 Q 30 20 50 30 Q 70 20 90 70" fill="none" stroke="#16a34a" strokeWidth="6" strokeLinecap="round"/><path d="M 50 80 L 50 20" fill="none" stroke="#15803d" strokeWidth="6" strokeLinecap="round"/><g transform="translate(20, 25)"><circle cx="0" cy="0" r="18" fill={el.color} /><path d="M -5 -5 Q 10 -15 10 5 Q -10 15 -5 -5" fill="rgba(0,0,0,0.15)"/><path d="M 0 0 Q 5 -5 5 2 Q -5 5 0 0" fill="rgba(0,0,0,0.25)"/></g><g transform="translate(80, 25)"><circle cx="0" cy="0" r="18" fill={el.color} /><path d="M -5 -5 Q 10 -15 10 5 Q -10 15 -5 -5" fill="rgba(0,0,0,0.15)"/><path d="M 0 0 Q 5 -5 5 2 Q -5 5 0 0" fill="rgba(0,0,0,0.25)"/></g><g transform="translate(50, 15)"><circle cx="0" cy="0" r="22" fill={el.color} opacity="0.95"/><path d="M -6 -6 Q 12 -18 12 6 Q -12 18 -6 -6" fill="rgba(0,0,0,0.15)"/><path d="M 0 0 Q 6 -6 6 2 Q -6 6 0 0" fill="rgba(0,0,0,0.25)"/></g></svg>);
      case 'flor_girasol': return (<svg width="100%" height="100%" viewBox="0 0 100 120" style={{ filter: 'drop-shadow(0 5px 8px rgba(0,0,0,0.2))' }}><rect x="46" y="50" width="8" height="70" fill="#16a34a" rx="4"/><ellipse cx="30" cy="80" rx="20" ry="8" transform="rotate(-30 30 80)" fill="#15803d"/><ellipse cx="70" cy="90" rx="20" ry="8" transform="rotate(30 70 90)" fill="#15803d"/><g transform="translate(50, 40)">{Array.from({length: 12}).map((_, i) => (<ellipse key={`out${i}`} cx="0" cy="-25" rx="8" ry="20" transform={`rotate(${i*30} 0 0)`} fill={el.color} />))}{Array.from({length: 12}).map((_, i) => (<ellipse key={`in${i}`} cx="0" cy="-18" rx="6" ry="15" transform={`rotate(${(i*30)+15} 0 0)`} fill={el.color} opacity="0.8" />))}<circle cx="0" cy="0" r="16" fill="#451a03" /><circle cx="0" cy="0" r="12" fill="#290f02" /><circle cx="-5" cy="-5" r="1.5" fill="#78350f" /><circle cx="5" cy="5" r="1.5" fill="#78350f" /><circle cx="5" cy="-5" r="1.5" fill="#78350f" /><circle cx="-5" cy="5" r="1.5" fill="#78350f" /></g></svg>);
      case 'flor_tulipan': return (<svg width="100%" height="100%" viewBox="0 0 100 120" style={{ filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.15))' }}><path d="M 50 120 Q 40 80 25 40" fill="none" stroke="#16a34a" strokeWidth="5" strokeLinecap="round"/><path d="M 50 120 Q 55 80 50 30" fill="none" stroke="#15803d" strokeWidth="5" strokeLinecap="round"/><path d="M 50 120 Q 60 80 75 45" fill="none" stroke="#16a34a" strokeWidth="5" strokeLinecap="round"/><path d="M 50 110 Q 20 80 35 50 Q 40 80 50 110" fill="#22c55e"/><path d="M 50 100 Q 80 70 65 40 Q 60 70 50 100" fill="#15803d"/><g transform="translate(25, 40) rotate(-15)"><path d="M -10 0 C -10 -20 10 -20 10 0 L 5 -10 L 0 5 L -5 -10 Z" fill={el.color}/><path d="M -10 0 C -10 15 10 15 10 0 C 10 -15 -10 -15 -10 0" fill={el.color} opacity="0.8"/></g><g transform="translate(75, 45) rotate(15)"><path d="M -10 0 C -10 -20 10 -20 10 0 L 5 -10 L 0 5 L -5 -10 Z" fill={el.color}/><path d="M -10 0 C -10 15 10 15 10 0 C 10 -15 -10 -15 -10 0" fill={el.color} opacity="0.8"/></g><g transform="translate(50, 30)"><path d="M -12 0 C -12 -25 12 -25 12 0 L 6 -12 L 0 6 L -6 -12 Z" fill={el.color}/><path d="M -12 0 C -12 18 12 18 12 0 C 12 -18 -12 -18 -12 0" fill={el.color} opacity="0.9"/></g></svg>);
      case 'globo_individual': {
        const sizeInInches = el.sizeInches || 11;
        const rPx = ((sizeInInches * 0.0254) / 2) * scale;
        const getBalColor = (b) => b && b.colorOverride ? b.colorOverride : el.color;

        const renderBalloon = (b, x, y, angle = 0, scaleR = 1) => {
           if (!b) return null;
           const cColor = getBalColor(b);
           const isTrans = cColor.includes('rgba');
           const isSel = selectedBalloonId === b.id && editingGroupId === el.id;
           const sProps = isTrans ? { stroke: "rgba(255,255,255,0.8)", strokeWidth: 1 } : {};
           if (isSel) { sProps.stroke = "#ec4899"; sProps.strokeWidth = 3; }
           const finalX = x + ((b.offsetX || 0) * scale);
           const finalY = y + ((b.offsetY || 0) * scale);

           return (
             <g key={b.id} transform={`translate(${finalX}, ${finalY}) rotate(${angle})`}
                onPointerDown={(e) => {
                  if(editingGroupId === el.id) {
                    e.stopPropagation(); setSelectedBalloonId(b.id);
                    let groupOffsets = b.clusterId ? el.balloons.filter(x => x.clusterId === b.clusterId).map(x => ({id: x.id, ox: x.offsetX || 0, oy: x.offsetY || 0})) : [{id: b.id, ox: b.offsetX || 0, oy: b.offsetY || 0}];
                    setDragging({ id: el.id, type: 'balloon', balloonId: b.id, startX: e.clientX, startY: e.clientY, groupOffsets });
                  }
                }}
                style={{ cursor: editingGroupId === el.id ? 'pointer' : 'default' }}
             >
                <circle cx="0" cy="0" r={rPx * scaleR} fill={cColor} {...sProps} />
                <polygon points={`${-rPx*scaleR*0.15},${rPx*scaleR*0.95} ${rPx*scaleR*0.15},${rPx*scaleR*0.95} 0,${rPx*scaleR*1.15}`} fill={cColor} />
             </g>
           );
        };

        const bArr = el.balloons || [{id:0}];
        let balloonsNodes = [];
        const cx = w / 2; const cy = h / 2;

        if (el.clusterType === 'tercia') {
            balloonsNodes.push(renderBalloon(bArr[0], cx, cy - rPx * 0.5, 0));
            balloonsNodes.push(renderBalloon(bArr[1], cx - rPx * 0.8, cy + rPx * 0.5, -45));
            balloonsNodes.push(renderBalloon(bArr[2], cx + rPx * 0.8, cy + rPx * 0.5, 45));
        } else if (el.clusterType === 'cuarteto') {
            balloonsNodes.push(renderBalloon(bArr[0], cx - rPx * 0.6, cy - rPx * 0.6, -45));
            balloonsNodes.push(renderBalloon(bArr[1], cx + rPx * 0.6, cy - rPx * 0.6, 45));
            balloonsNodes.push(renderBalloon(bArr[2], cx - rPx * 0.6, cy + rPx * 0.6, -135));
            balloonsNodes.push(renderBalloon(bArr[3], cx + rPx * 0.6, cy + rPx * 0.6, 135));
            balloonsNodes.push(renderBalloon(bArr[4], cx, cy, 0, 0.35)); 
        } else {
            balloonsNodes.push(renderBalloon(bArr[0], cx, cy));
        }

        return <div className="w-full h-full" style={{ overflow: 'visible' }}><svg width="100%" height="100%" style={{ overflow: 'visible', filter: 'drop-shadow(2px 4px 4px rgba(0,0,0,0.15))' }}><g style={{ pointerEvents: editingGroupId === el.id ? 'auto' : 'none' }}>{balloonsNodes}</g></svg></div>;
      }
      case 'globo_guirnalda':
        const renderBalloons = [];
        const cols = el.colors && el.colors.length > 0 ? el.colors : [el.color];
        let pathVisualizer = null;
        if (selectedId === el.id && !editingGroupId) {
           const pathD = el.controlPoints.map((pt, i) => `${i===0?'M':'L'} ${pt.x * w} ${pt.y * h}`).join(' ');
           pathVisualizer = <path d={pathD} stroke="rgba(99,102,241,0.6)" strokeWidth="2" strokeDasharray="4 4" fill="none" />;
        }

        el.balloons.forEach((b) => {
          const pt = getSplinePoint(b.t, el.controlPoints);
          const bx = pt.x * w; const by = pt.y * h;
          const radiusPx = ((b.sizeInches || (b.isMain ? 11 : 9)) * 0.0254 / 2) * scale;
          const color = b.colorOverride || cols[b.id % cols.length];
          const isTransparent = color.includes('rgba');
          const isSelected = selectedBalloonId === b.id && editingGroupId === el.id;
          
          renderBalloons.push(
            <circle key={b.id} cx={bx + ((b.offsetX || 0) * scale)} cy={by + ((b.offsetY || 0) * scale)} r={radiusPx} fill={color} 
              stroke={isTransparent ? "rgba(255,255,255,0.8)" : (isSelected ? "#ec4899" : "none")}
              strokeWidth={isSelected ? 3 : (isTransparent ? 1 : 0)} opacity={isTransparent ? 1 : (b.isMain ? 0.95 : 0.9)} 
              onPointerDown={(e) => {
                if(editingGroupId === el.id) {
                  e.stopPropagation(); setSelectedBalloonId(b.id);
                  let groupOffsets = b.clusterId ? el.balloons.filter(x => x.clusterId === b.clusterId).map(x => ({id: x.id, ox: x.offsetX || 0, oy: x.offsetY || 0})) : [{id: b.id, ox: b.offsetX || 0, oy: b.offsetY || 0}];
                  setDragging({ id: el.id, type: 'balloon', balloonId: b.id, startX: e.clientX, startY: e.clientY, groupOffsets });
                }
              }}
              style={{ cursor: editingGroupId === el.id ? 'move' : 'default' }}
            />
          );
        });

        return (
          <div className="w-full h-full relative" style={{ pointerEvents: 'none' }}>
            <svg width="100%" height="100%" style={{ overflow: 'visible', filter: 'drop-shadow(3px 5px 8px rgba(0,0,0,0.2))' }}>
              {pathVisualizer}
              <g style={{ pointerEvents: editingGroupId === el.id ? 'auto' : 'none' }}>{renderBalloons}</g>
            </svg>
            {selectedId === el.id && !editingGroupId && el.controlPoints.map((pt, idx) => (
              <div key={idx} onPointerDown={(e) => handlePointerDown(e, el.id, 'curve_control', idx)}
                className="absolute w-4 h-4 bg-indigo-500 border-2 border-white rounded-full shadow-lg cursor-move pointer-events-auto hover:scale-125 transition-transform z-50 flex items-center justify-center"
                style={{ left: pt.x * w - 8, top: pt.y * h - 8 }}
              ><div className="w-1 h-1 bg-white rounded-full"></div></div>
            ))}
          </div>
        );
      default: return <div style={{ backgroundColor: el.color, width: '100%', height: '100%' }} />;
    }
  };

  const renderSidebarIcon = (item) => {
    switch(item.type) {
      case 'mampara_arco': return <div className="w-6 h-10 bg-pink-200 border-2 border-pink-300 rounded-t-full shadow-inner"></div>;
      case 'mampara_cuad': return <div className="w-8 h-10 bg-blue-200 border-2 border-blue-300 rounded-t-sm shadow-inner"></div>;
      case 'globo_guirnalda': return (<div className="flex -space-x-2"><div className="w-4 h-4 rounded-full bg-yellow-300 border border-yellow-400"></div><div className="w-5 h-5 rounded-full bg-yellow-300 border border-yellow-400 -mt-1"></div><div className="w-4 h-4 rounded-full bg-yellow-300 border border-yellow-400"></div></div>);
      case 'globo_individual': return (<div className="flex -space-x-1"><div className="w-3 h-4 bg-yellow-300 rounded-full border border-yellow-400 rounded-b-md relative"></div><div className="w-4 h-5 bg-yellow-300 rounded-full border border-yellow-400 rounded-b-md relative z-10 -mt-1"></div><div className="w-3 h-4 bg-yellow-300 rounded-full border border-yellow-400 rounded-b-md relative"></div></div>);
      case 'letras_neon': return <Type size={28} className="text-yellow-400 drop-shadow-md" />;
      case 'mesa_principal': return <div className="w-10 h-4 bg-white border-2 border-slate-300 rounded-sm shadow-sm relative"><div className="absolute top-0 w-full h-1 bg-slate-200"></div></div>;
      case 'silla_tiffany': return (<div className="w-4 h-8 flex flex-col items-center"><div className="w-3 h-4 border-x-2 border-t-2 border-slate-400 rounded-t-sm"></div><div className="w-4 h-1 bg-slate-300"></div><div className="w-3 h-3 flex justify-between"><div className="w-0.5 h-full bg-slate-400"></div><div className="w-0.5 h-full bg-slate-400"></div></div></div>);
      case 'sillon_lounge': return (<div className="w-8 h-6 flex items-end relative"><div className="w-full h-3 bg-pink-300 rounded-sm relative z-10"></div><div className="absolute top-0 left-1 w-6 h-4 bg-pink-300 rounded-t-sm"></div></div>);
      case 'silla_trono': return (<div className="w-5 h-9 flex flex-col items-center"><div className="w-4 h-5 bg-yellow-200 border-2 border-yellow-400 rounded-t-full"></div><div className="w-5 h-1.5 bg-yellow-400 rounded-sm"></div><div className="w-4 h-3 flex justify-between"><div className="w-1 h-full bg-amber-700"></div><div className="w-1 h-full bg-amber-700"></div></div></div>);
      case 'arbol_pino': return (<div className="w-6 h-10 flex flex-col items-center"><div className="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[16px] border-l-transparent border-r-transparent border-b-green-600 mb-[-8px] z-20"></div><div className="w-0 h-0 border-l-[14px] border-r-[14px] border-b-[18px] border-l-transparent border-r-transparent border-b-green-600 mb-[-8px] z-10"></div><div className="w-0 h-0 border-l-[16px] border-r-[16px] border-b-[20px] border-l-transparent border-r-transparent border-b-green-600"></div><div className="w-2 h-4 bg-amber-900"></div></div>);
      case 'arbusto_redondo': return (<div className="w-6 h-8 flex flex-col items-center justify-end relative"><div className="w-6 h-6 bg-green-500 rounded-full absolute top-0 z-10"></div><div className="w-4 h-3 bg-amber-900 clip-path-polygon-[0_0,100%_0,80%_100%,20%_100%]"></div></div>);
      case 'arbol_cerezo': return <Trees size={28} className="text-pink-300" />;
      case 'flor_rosa': return <Flower2 size={24} className="text-rose-500" />;
      case 'flor_girasol': return (<div className="relative w-6 h-6 flex items-center justify-center"><div className="absolute w-6 h-6 rounded-full border-4 border-dashed border-yellow-400 animate-spin-slow"></div><div className="w-3 h-3 bg-amber-900 rounded-full z-10"></div></div>);
      case 'flor_tulipan': return (<div className="flex items-end h-8 space-x-0.5"><div className="w-2 h-3 bg-fuchsia-500 rounded-b-md"></div><div className="w-2.5 h-4 bg-fuchsia-500 rounded-b-md mb-1"></div><div className="w-2 h-3 bg-fuchsia-500 rounded-b-md"></div></div>);
      default: return <div className="w-6 h-6 bg-slate-200"></div>;
    }
  };

  const getMaterialList = () => {
    const inventory = {}; 
    elements.forEach(e => {
      if (e.type === 'globo_guirnalda' || e.type === 'globo_individual') {
        const baseColors = e.colors && e.colors.length > 0 ? e.colors : [e.color];
        (e.balloons || []).forEach(b => {
          const bSize = b.sizeInches || (b.isMain ? 11 : 9);
          const bColor = b.colorOverride || baseColors[b.id % baseColors.length] || '#ffffff';
          const key = `globo_${bSize}_${bColor}`;
          if (!inventory[key]) inventory[key] = { name: `Globos Látex (${bSize}")`, count: 0, colors: [bColor] };
          inventory[key].count++;
        });
      } else {
        let itemName = e.name;
        if (e.type.includes('mampara') || e.type.includes('mesa') || e.type.includes('sillon') || e.type.includes('letras')) itemName += ` (${Number(e.width).toFixed(1)}m x ${Number(e.height).toFixed(1)}m)`;
        const key = `${e.type}_${e.width}_${e.height}_${e.color}`;
        if (!inventory[key]) inventory[key] = { name: itemName, count: 0, colors: [e.color] };
        inventory[key].count++;
      }
    });
    return Object.values(inventory).sort((a, b) => b.count - a.count);
  };

  const selectedElement = elements.find(e => e.id === selectedId);
  const sortedElements = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  const handlePrintWheel = (e) => {
    e.preventDefault(); e.stopPropagation();
    const zoomSensitivity = 0.002;
    const delta = -e.deltaY * zoomSensitivity;
    setPrintScale(s => Math.max(0.1, Math.min(s * (1 + delta), 5)));
  };

  const handlePrintPointerDown = (e) => {
    if (!isBlueprintPanActive) return; 
    e.preventDefault(); 
    e.stopPropagation();
    setIsPrintDragging(true);
    setPrintDragStart({ x: e.clientX - printPan.x, y: e.clientY - printPan.y });
  };

  const handlePrintPointerMove = (e) => {
    if (!isPrintDragging) return;
    setPrintPan({ x: e.clientX - printDragStart.x, y: e.clientY - printDragStart.y });
  };

  const handlePrintPointerUp = () => setIsPrintDragging(false);

  const triggerPdfDownload = async () => {
    setIsPreparingPrint(true);
    setIsCapturingPdf(true);

    setTimeout(async () => {
      try {
        const { jsPDF } = await import('jspdf');
        const html2canvas = (await import('html2canvas')).default;

        const pages = document.querySelectorAll('.export-pdf-page');
        const pdf = new jsPDF('p', 'mm', 'letter');

        for (let i = 0; i < pages.length; i++) {
           const canvas = await html2canvas(pages[i], { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
           const imgData = canvas.toDataURL('image/jpeg', 0.95);
           if (i > 0) pdf.addPage();
           pdf.addImage(imgData, 'JPEG', 0, 0, 215.9, 279.4);
        }
        
        pdf.save('Blueprint-Decoracion.pdf');
        if(addNotification) addNotification('¡PDF Guardado!', 'Revisa tu carpeta de descargas.', 'success');
      } catch (error) {
        console.error(error);
        if(addNotification) addNotification('Error', 'Hubo un fallo al generar el archivo PDF.', 'error');
      }
      setIsCapturingPdf(false);
      setIsPreparingPrint(false);
      setShowExportModal(false);
    }, 500); 
  };

  if (showExportModal) {
    const materials = getMaterialList();
    const PAGE_1_LIMIT = 8;
    const PAGE_N_LIMIT = 22;
    const page1Materials = materials.slice(0, PAGE_1_LIMIT);
    const extraMaterials = materials.slice(PAGE_1_LIMIT);
    const extraPages = [];
    for (let i = 0; i < extraMaterials.length; i += PAGE_N_LIMIT) {
       extraPages.push(extraMaterials.slice(i, i + PAGE_N_LIMIT));
    }
    
    return (
      <div className="fixed inset-0 z-[120] bg-slate-900/95 flex flex-col overflow-hidden backdrop-blur-sm">
        
        <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row justify-between items-center shadow-lg border-b border-slate-700 z-10 shrink-0 gap-4">
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            <button onClick={() => setShowExportModal(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={24}/></button>
            <div>
              <h3 className="font-bold text-sm">Vista Previa de Exportación</h3>
              <p className="text-[10px] text-slate-400">Ajusta el zoom, bloquea y descarga.</p>
            </div>
          </div>
          <button onClick={triggerPdfDownload} disabled={isPreparingPrint} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold flex items-center shadow-lg transition-all w-full sm:w-auto justify-center disabled:bg-slate-600">
            {isPreparingPrint ? <RefreshCw size={18} className="mr-2 animate-spin"/> : <Download size={18} className="mr-2"/>} 
            {isPreparingPrint ? 'Armando PDF...' : 'Descargar PDF'}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center py-8 relative gap-8">
           
           <div className="bg-white shadow-[0_0_40px_rgba(0,0,0,0.5)] relative shrink-0 export-pdf-page" style={{ width: '215.9mm', height: '279.4mm', padding: '15mm', boxSizing: 'border-box', overflow: 'hidden' }}>
             <header className="border-b-4 border-slate-900 pb-3 mb-5 flex justify-between items-end">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Render Decorativo</h1>
                  <p className="text-slate-500 text-sm font-medium">Proyecto: Boda Ana & Luis</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400">Escala Ajustada (Carta)</p>
                </div>
             </header>

             <div 
               onPointerDown={handlePrintPointerDown} onPointerMove={handlePrintPointerMove} onPointerUp={handlePrintPointerUp} onPointerLeave={handlePrintPointerUp} onWheel={handlePrintWheel}
               className={`w-full h-[120mm] bg-[#eef2f6] border-2 border-slate-300 rounded-xl mb-6 relative overflow-hidden flex shadow-inner ${isBlueprintPanActive ? 'cursor-grab active:cursor-grabbing touch-none ring-4 ring-indigo-300' : ''}`}
             >
                {!isCapturingPdf && (
                  <div className="absolute top-3 left-3 z-50 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <button onClick={() => setIsBlueprintPanActive(!isBlueprintPanActive)} className={`px-3 py-2 transition-colors rounded-xl font-bold text-[10px] flex items-center shadow-lg border border-slate-700 ${isBlueprintPanActive ? 'bg-indigo-500 text-white' : 'bg-slate-900/90 text-white hover:bg-slate-800'}`}>
                      <Hand size={14} className="mr-1.5"/> {isBlueprintPanActive ? 'Arrastre Activo (Bloquear para PDF)' : 'Activar Arrastre'}
                    </button>
                    <div className="bg-slate-900/90 backdrop-blur text-white rounded-xl shadow-lg flex items-center pointer-events-auto border border-slate-700">
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPrintScale(s => Math.max(0.1, s - 0.15)); }} className="p-3 hover:bg-white/20 transition-colors rounded-l-xl active:bg-white/30 touch-manipulation"><Minus size={16} /></button>
                      <div className="w-px h-5 bg-white/20"></div>
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPrintScale(s => Math.min(5, s + 0.15)); }} className="p-3 hover:bg-white/20 transition-colors rounded-r-xl active:bg-white/30 touch-manipulation"><Plus size={16} /></button>
                    </div>
                  </div>
                )}

                <div style={{ transform: `translate(${printPan.x}px, ${printPan.y}px) scale(${printScale})`, transformOrigin: '0 0', width: '100%', height: '100%' }}>
                  <div className="absolute inset-0 z-0 pointer-events-none" style={{ width: '5000px', height: '5000px', left: '-2500px', top: '-2500px', backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)`, backgroundSize: `${scale}px ${scale}px` }}></div>
                  {bgImage && (
                    <div className="absolute z-0 opacity-80" style={{ left: bgPos.x * scale, top: bgPos.y * scale }}>
                      <img src={bgImage} style={{ width: bgImgSize.w * scale, height: bgImgSize.h * scale }} className="max-w-none rounded shadow-md pointer-events-none" />
                    </div>
                  )}
                  {sortedElements.map((el) => (
                    <div key={el.id} className="absolute flex items-center justify-center select-none origin-bottom pointer-events-none" style={{ width: el.width * scale, height: el.height * scale, left: el.x * scale, top: el.y * scale, transform: `rotateZ(${el.rotation || 0}deg)`, zIndex: el.zIndex }}>
                      {renderShape(el)}
                    </div>
                  ))}
                </div>
             </div>

             <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-3 flex items-center"><CheckSquare size={18} className="mr-2 text-indigo-500"/> Lista de Requerimientos (BOM)</h2>
             <table className="w-full text-left text-xs border-collapse">
               <thead>
                 <tr className="bg-slate-100 text-slate-700">
                   <th className="py-2 px-3 font-bold border border-slate-200 w-12 text-center">Cant.</th>
                   <th className="py-2 px-3 font-bold border border-slate-200">Elemento</th>
                   <th className="py-2 px-3 font-bold border border-slate-200 w-40">Color Base</th>
                 </tr>
               </thead>
               <tbody>
                 {page1Materials.map((m, i) => (
                   <tr key={i} className="border-b border-slate-200">
                     <td className="py-2 px-3 text-center font-black text-indigo-600 border-x border-slate-200">{m.count}</td>
                     <td className="py-2 px-3 font-medium border-r border-slate-200 text-slate-800">{m.name}</td>
                     <td className="py-2 px-3 border-r border-slate-200">
                        <div className="flex flex-wrap gap-2">
                          {m.colors.map((c, idx) => (
                            <div key={idx} className="flex items-center bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                              <div className="w-3 h-3 rounded-full border border-slate-300 mr-1.5 shadow-sm" style={getTransparentStyle(c)}></div>
                              <span className="text-[9px] uppercase text-slate-600 font-mono font-bold">{c}</span>
                            </div>
                          ))}
                        </div>
                     </td>
                   </tr>
                 ))}
                 {materials.length === 0 && <tr><td colSpan="3" className="py-4 text-center text-slate-400">El lienzo está vacío.</td></tr>}
               </tbody>
             </table>
             <div className="absolute bottom-6 right-6 text-[10px] font-bold text-slate-400">Página 1 de {1 + extraPages.length}</div>
           </div>

           {/* 📄 PÁGINAS ADICIONALES */}
           {extraPages.map((pageMats, pIdx) => (
             <div key={`extrapage_${pIdx}`} className="bg-white shadow-2xl relative shrink-0 export-pdf-page" style={{ width: '215.9mm', height: '279.4mm', padding: '15mm', boxSizing: 'border-box', overflow: 'hidden' }}>
               <header className="border-b-4 border-slate-900 pb-3 mb-6 flex justify-between items-end">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Render Decorativo (Cont.)</h1>
                    <p className="text-slate-500 text-sm font-medium">Proyecto: Boda Ana & Luis</p>
                  </div>
               </header>

               <table className="w-full text-left text-xs border-collapse">
                 <thead>
                   <tr className="bg-slate-100 text-slate-700">
                     <th className="py-2 px-3 font-bold border border-slate-200 w-12 text-center">Cant.</th>
                     <th className="py-2 px-3 font-bold border border-slate-200">Elemento</th>
                     <th className="py-2 px-3 font-bold border border-slate-200 w-40">Color Base</th>
                   </tr>
                 </thead>
                 <tbody>
                   {pageMats.map((m, i) => (
                     <tr key={i} className="border-b border-slate-200">
                       <td className="py-2 px-3 text-center font-black text-indigo-600 border-x border-slate-200">{m.count}</td>
                       <td className="py-2 px-3 font-medium border-r border-slate-200 text-slate-800">{m.name}</td>
                       <td className="py-2 px-3 border-r border-slate-200">
                          <div className="flex flex-wrap gap-2">
                            {m.colors.map((c, idx) => (
                              <div key={idx} className="flex items-center bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                <div className="w-3 h-3 rounded-full border border-slate-300 mr-1.5 shadow-sm" style={getTransparentStyle(c)}></div>
                                <span className="text-[9px] uppercase text-slate-600 font-mono font-bold">{c}</span>
                              </div>
                            ))}
                          </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
               <div className="absolute bottom-6 right-6 text-[10px] font-bold text-slate-400">Página {pIdx + 2} de {1 + extraPages.length}</div>
             </div>
           ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4 pb-6" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onMouseLeave={handlePointerUp}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Bocetador de Decoración</h2>
          <p className="text-slate-500 text-sm">Arrastra del catálogo o haz clic para agregar.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowExportModal(true)} className="px-4 py-2 bg-white border border-indigo-200 text-indigo-700 rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-50 transition-colors flex items-center">
            <FileDown size={16} className="mr-2"/> Generar Blueprint
          </button>
          <button 
            onClick={() => setSnapEnabled(!snapEnabled)} 
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors border shadow-sm ${snapEnabled ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500'}`}
            title="Auto-alinear objetos magnéticamente"
          >
            <Magnet size={16} className="mr-2"/> Imán {snapEnabled ? 'ON' : 'OFF'}
          </button>

          <button onClick={() => setShowClearConfirm(true)} className="px-3 py-2 bg-white border border-rose-200 text-rose-600 rounded-lg text-sm font-medium hover:bg-rose-50 transition-colors shadow-sm">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row overflow-hidden relative">
        
        {/* BANNERS DE INSTRUCCIONES CLARAS */}
        {activeTool === 'move_bg' && (
           <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl z-[200] flex items-center animate-in slide-in-from-top-4 border-2 border-emerald-400">
              <Move size={20} className="mr-3 animate-pulse" />
              <div>
                <p className="font-bold text-sm">Modo Mover Fondo</p>
                <p className="text-xs text-emerald-100">Arrastra la foto para ajustarla a la cuadrícula.</p>
              </div>
              <button onClick={() => setActiveTool('select')} className="ml-6 p-2 bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors flex items-center font-bold text-sm shadow-sm"><CheckCircle size={16} className="mr-1.5"/> Listo</button>
           </div>
        )}

        {activeTool === 'calibrate' && (
           <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-sky-600 text-white px-6 py-3 rounded-2xl shadow-2xl z-[200] flex items-center animate-in slide-in-from-top-4 border-2 border-sky-400">
              <Spline size={20} className="mr-3 animate-pulse" />
              <div>
                <p className="font-bold text-sm">Calibración Láser</p>
                <p className="text-xs text-sky-100">Haz <b>clic sostenido</b> en un extremo y <b>arrastra</b> hasta el otro.</p>
              </div>
              <button onClick={() => { setActiveTool('select'); setCalibrationLine(null); }} className="ml-6 p-2 bg-sky-700 rounded-lg hover:bg-sky-800 transition-colors flex items-center font-bold text-sm shadow-sm"><X size={16} className="mr-1.5"/> Cancelar</button>
           </div>
        )}

        {/* BARRA DE HERRAMIENTAS FLOTANTE */}
        {isEditMode && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 md:top-1/2 md:bottom-auto md:left-4 md:-translate-x-0 md:-translate-y-1/2 bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl rounded-2xl flex flex-row md:flex-col items-center p-2 gap-2 z-[15]">
             <button onClick={() => setActiveTool('select')} className={`p-3 rounded-xl transition-all ${activeTool === 'select' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/50 scale-110' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`} title="Seleccionar">
               <NavigationIcon size={20} className="-rotate-90" />
             </button>
             <button onClick={() => setActiveTool('pan')} className={`p-3 rounded-xl transition-all ${activeTool === 'pan' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/50 scale-110' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`} title="Mover Plano">
               <Hand size={20} />
             </button>
             {bgImage && (
               <button onClick={() => setActiveTool('move_bg')} className={`p-3 rounded-xl transition-all ${activeTool === 'move_bg' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50 scale-110' : 'text-slate-400 hover:bg-slate-800 hover:text-emerald-400'}`} title="Mover Foto">
                 <ImageIcon size={20} />
               </button>
             )}
          </div>
        )}

        <div ref={containerRef} className="flex-1 relative overflow-hidden bg-[#eef2f6]">
          <div 
            className={`absolute inset-0 z-0 ${activeTool === 'calibrate' ? 'cursor-crosshair' : 'touch-none'}`}
            onPointerDown={(e) => {
              if (activeTool === 'calibrate') {
                const rect = containerRef.current.getBoundingClientRect();
                const worldX = ((e.clientX - rect.left) - offsetX) / scale;
                const worldY = ((e.clientY - rect.top) - offsetY) / scale;
                setCalibrationLine({ x1: worldX, y1: worldY, x2: worldX, y2: worldY, isDragging: true });
                return;
              }

              if (activeTool === 'move_bg' && bgImage) {
                setDragging({ type: 'move_bg', startX: e.clientX, startY: e.clientY, startBgX: bgPos.x, startBgY: bgPos.y });
                return;
              }

              setSelectedId(null); setEditingGroupId(null); setSelectedBalloonId(null);
              if (activeTool === 'pan' || activeTool === 'select') {
                setDragging({ isPanning: true, startX: e.clientX, startY: e.clientY, startPanX: pan.x, startPanY: pan.y });
              }
            }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'copy'; }}
            onDrop={handleDropOnCanvas}
          />

          <div className="w-full h-full pointer-events-none">
            <div className="w-full h-full touch-none">
              
              <div className="absolute inset-0 z-0 pointer-events-none">
                {bgImage && (
                  <div className="absolute z-0 pointer-events-none opacity-60" style={{ left: (bgPos.x * scale) + offsetX, top: (bgPos.y * scale) + offsetY }}>
                    <img src={bgImage} style={{ width: bgImgSize.w * scale, height: bgImgSize.h * scale }} className="max-w-none shadow-2xl border-4 border-slate-300 rounded" />
                  </div>
                )}
                <div className="absolute inset-0 transition-opacity duration-500 z-10 pointer-events-none bg-transparent" style={{ backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.15) 1px, transparent 1px)`, backgroundSize: `${scale}px ${scale}px`, backgroundPosition: `${offsetX}px ${offsetY}px` }} />
              </div>

              {calibrationLine && (() => {
                 const p1x = calibrationLine.x1 * scale + offsetX; const p1y = calibrationLine.y1 * scale + offsetY;
                 const p2x = calibrationLine.x2 * scale + offsetX; const p2y = calibrationLine.y2 * scale + offsetY;
                 return (
                   <svg className="absolute inset-0 w-full h-full pointer-events-none z-[150] overflow-visible">
                      <line x1={p1x} y1={p1y} x2={p2x} y2={p2y} stroke="#0ea5e9" strokeWidth="4" strokeDasharray="8 4" />
                      <circle cx={p1x} cy={p1y} r="8" fill="#0ea5e9" stroke="white" strokeWidth="3" />
                      <circle cx={p2x} cy={p2y} r="8" fill="#0ea5e9" stroke="white" strokeWidth="3" />
                   </svg>
                 );
              })()}

              <div className="absolute inset-0 pointer-events-none z-20">
                {sortedElements.map((el) => {
                  const isSelected = selectedId === el.id;
                  const isDimmed = editingGroupId && editingGroupId !== el.id;
                  return (
                    <div key={el.id} onPointerDown={(e) => handlePointerDown(e, el.id)} onDoubleClick={(e) => { if (el.type === 'globo_guirnalda' || el.type === 'globo_individual') { e.stopPropagation(); setEditingGroupId(el.id); setSelectedBalloonId(null); } }}
                      className={`absolute flex items-center justify-center cursor-pointer select-none origin-bottom ${isSelected && !editingGroupId ? 'ring-2 ring-offset-4 ring-pink-500 z-[100]' : ''} ${!editingGroupId ? 'hover:ring-2 hover:ring-offset-2 hover:ring-slate-400 pointer-events-auto' : ''}`}
                      style={{ width: el.width * scale, height: el.height * scale, left: el.x * scale + offsetX, top: el.y * scale + offsetY, transform: `rotateZ(${el.rotation || 0}deg)`, zIndex: isSelected ? 9999 : el.zIndex, opacity: isDimmed ? 0.3 : 1 }}
                    >
                      {renderShape(el)}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        
        <div className="w-full md:w-80 border-l border-slate-200 bg-slate-50 flex flex-col z-20 relative h-full shrink-0">
          
          {/* PANEL DE EDICIÓN ULTRA COMPACTO */}
          {selectedElement && (
            <div className="shrink-0 bg-white border-b-2 border-indigo-200 p-3 shadow-md z-30 relative max-h-[40vh] overflow-y-auto custom-scrollbar animate-in slide-in-from-right-4">
              <div className="flex items-center justify-between mb-2 border-b border-slate-100 pb-2">
                <h3 className="font-bold text-slate-800 text-xs flex items-center"><Palette size={14} className="mr-1.5 text-indigo-500"/> Editar {selectedElement.name}</h3>
                <div className="flex items-center space-x-1.5">
                  {editingGroupId && <button onClick={() => { setEditingGroupId(null); setSelectedBalloonId(null); }} className="text-pink-600 bg-pink-50 hover:bg-pink-100 text-[9px] font-bold px-2 py-1 rounded transition-colors">Cerrar Globos</button>}
                  <button onClick={() => {setSelectedId(null); setEditingGroupId(null);}} className="p-1 text-slate-400 hover:text-rose-500 bg-slate-100 rounded transition-colors"><X size={14}/></button>
                </div>
              </div>

              {editingGroupId && (selectedElement.type === 'globo_guirnalda' || selectedElement.type === 'globo_individual') ? (
                <div className="space-y-2.5">
                  {selectedBalloonId !== null ? (() => {
                     const b = selectedElement.balloons.find(x => x.id === selectedBalloonId);
                     if (!b) return null;
                     return (
                       <>
                         <div>
                           <label className="block text-[9px] font-bold text-pink-700 uppercase tracking-wider mb-1.5">Color de Globo</label>
                           <div className="flex flex-wrap gap-1.5">
                             {PRESET_COLORS.map(color => (
                               <button key={color} onClick={() => { const newBalloons = selectedElement.balloons.map(x => x.id === selectedBalloonId ? {...x, colorOverride: color} : x); updateElementData(selectedElement.id, { balloons: newBalloons }); }} className={`w-5 h-5 rounded-full shadow-sm border-2 ${b.colorOverride === color ? 'border-pink-500 scale-110' : 'border-slate-200 hover:scale-110 transition-transform'}`} style={getTransparentStyle(color)} />
                             ))}
                           </div>
                           <button onClick={() => { const newBalloons = selectedElement.balloons.map(x => x.id === selectedBalloonId ? {...x, colorOverride: null} : x); updateElementData(selectedElement.id, { balloons: newBalloons }); }} className="text-[10px] bg-white border border-pink-200 px-2 py-1 rounded-md text-pink-600 font-bold mt-2 w-full text-center hover:bg-pink-50 transition-colors shadow-sm">Restaurar Color</button>
                         </div>
                         <div>
                           <label className="block text-[9px] font-bold text-pink-700 uppercase tracking-wider mb-1">Medida (In)</label>
                           <select value={b.sizeInches || selectedElement.sizeInches || (b.isMain ? 11 : 5)} onChange={e => { const val = parseFloat(e.target.value); const newBalloons = selectedElement.balloons.map(x => x.id === selectedBalloonId ? {...x, sizeInches: val} : x); updateElementData(selectedElement.id, { balloons: newBalloons }); }} className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none text-slate-700 focus:border-pink-400">
                             <option value={5}>5"</option><option value={9}>9"</option><option value={11}>11"</option><option value={18}>18"</option><option value={24}>24"</option><option value={36}>36"</option>
                           </select>
                         </div>
                       </>
                     );
                  })() : (
                     <div className="bg-pink-50 text-pink-700 p-2.5 rounded-lg text-[10px] font-bold border border-pink-200 flex items-start shadow-sm"><Info size={14} className="mr-2 flex-shrink-0 mt-0.5" />Toca un globo en el lienzo para aislarlo, cambiar su medida o color.</div>
                  )}

                  {selectedElement.type === 'globo_guirnalda' && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <label className="block text-[9px] font-bold text-indigo-700 uppercase tracking-wider mb-1.5 text-center">Agregar Globos</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button onClick={() => addClusterToGarland('single')} className="py-1.5 bg-white text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-bold hover:bg-indigo-50 transition-colors shadow-sm flex flex-col items-center"><div className="w-3 h-3 bg-indigo-400 rounded-full mb-1"></div>1</button>
                        <button onClick={() => addClusterToGarland('tercia')} className="py-1.5 bg-white text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-bold hover:bg-indigo-50 transition-colors shadow-sm flex flex-col items-center"><div className="flex -space-x-1 mb-1"><div className="w-2.5 h-2.5 bg-indigo-400 rounded-full"></div><div className="w-2.5 h-2.5 bg-indigo-400 rounded-full z-10"></div><div className="w-2.5 h-2.5 bg-indigo-400 rounded-full"></div></div>3</button>
                        <button onClick={() => addClusterToGarland('cuarteto')} className="py-1.5 bg-white text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-bold hover:bg-indigo-50 transition-colors shadow-sm flex flex-col items-center"><div className="grid grid-cols-2 gap-[1px] mb-1"><div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div><div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div><div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div><div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div></div>4</button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedElement.type === 'globo_individual' && (
                    <>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Agrupación</label>
                        <select value={selectedElement.clusterType || 'single'} onChange={(e) => { const newType = e.target.value; let newBalloons = []; if (newType === 'single') newBalloons = [{id:0, clusterId: 1, colorOverride: null}]; if (newType === 'tercia') newBalloons = [{id:0, clusterId: 1, colorOverride: null}, {id:1, clusterId: 1, colorOverride: null}, {id:2, clusterId: 1, colorOverride: null}]; if (newType === 'cuarteto') newBalloons = [{id:0, clusterId: 1, colorOverride: null}, {id:1, clusterId: 1, colorOverride: null}, {id:2, clusterId: 1, colorOverride: null}, {id:3, clusterId: 1, colorOverride: null}, {id:4, clusterId: 1, colorOverride: null}]; updateElementData(selectedId, { clusterType: newType, balloons: newBalloons }); }} className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none focus:border-indigo-400 shadow-inner">
                          <option value="single">Suelto</option><option value="tercia">Tercia (3)</option><option value="cuarteto">Cuarteto (4)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Diámetro (In)</label>
                        <select value={selectedElement.sizeInches || 11} onChange={(e) => updateElementData(selectedId, { sizeInches: parseFloat(e.target.value) })} className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none focus:border-indigo-400 shadow-inner">
                          <option value={5}>5"</option><option value={9}>9"</option><option value={11}>11"</option><option value={18}>18"</option><option value={24}>24"</option><option value={36}>36"</option>
                        </select>
                      </div>
                    </>
                  )}

                  {selectedElement.type === 'globo_guirnalda' ? (
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Colores</label>
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {PRESET_COLORS.map(color => {
                          const isSelected = selectedElement.colors?.includes(color);
                          return (
                            <button key={color} onClick={() => toggleGarlandColor(selectedId, color)} className={`w-5 h-5 rounded-full shadow-sm border-2 transition-transform ${isSelected ? 'border-indigo-600 scale-110' : 'border-slate-200 hover:scale-110'}`} style={getTransparentStyle(color)} />
                          );
                        })}
                      </div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Densidad (Globos)</label>
                      <input type="number" min="3" max="300" value={selectedElement.balloonCount || 45} onChange={(e) => handleGarlandCountChange(selectedId, parseInt(e.target.value) || 45)} className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold text-indigo-600 outline-none focus:border-indigo-400 shadow-inner" />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Color Base</label>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_COLORS.map(color => (<button key={color} onClick={() => updateElementData(selectedId, { color })} className={`w-5 h-5 rounded-full shadow-sm border-2 transition-transform hover:scale-110 ${selectedElement.color === color ? 'border-indigo-500 scale-110' : 'border-slate-200'}`} style={getTransparentStyle(color)} />))}
                        <label className="w-5 h-5 rounded-full shadow-sm border-2 border-dashed border-indigo-400 flex items-center justify-center cursor-pointer hover:bg-indigo-50 transition-colors bg-white"><PaintBucket size={10} className="text-indigo-600" /><input type="color" value={selectedElement.color} onChange={(e) => updateElementData(selectedId, { color: e.target.value })} className="opacity-0 absolute w-0 h-0" /></label>
                      </div>
                    </div>
                  )}

                  {selectedElement.type === 'letras_neon' && (
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Texto Neón</label>
                      <input type="text" value={selectedElement.text} onChange={(e) => updateElementData(selectedId, { text: e.target.value })} className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none focus:border-indigo-400 shadow-inner" />
                    </div>
                  )}

                  {selectedElement.type !== 'globo_individual' && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <div className="flex-1"><label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 text-center">Ancho(m)</label><input type="number" step="0.1" min="0.1" value={selectedElement.width} onChange={(e) => updateElementData(selectedId, { width: parseFloat(e.target.value) || 0.1 })} className="w-full px-1 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold outline-none text-center focus:border-indigo-400 shadow-inner" /></div>
                      <div className="flex-1"><label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 text-center">Alto(m)</label><input type="number" step="0.1" min="0.1" value={selectedElement.height} onChange={(e) => updateElementData(selectedId, { height: parseFloat(e.target.value) || 0.1 })} className="w-full px-1 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold outline-none text-center focus:border-indigo-400 shadow-inner" /></div>
                    </div>
                  )}
                </div>
              )}
              
              {/* BOTONES DE CAPA Y BORRAR (SIEMPRE VISIBLES SI NO ESTÁS EDITANDO UN GLOBO AISLADO) */}
              {!editingGroupId && (
                 <div className="flex items-center gap-1.5 pt-3 mt-3 border-t border-slate-100">
                   <button onClick={() => changeZIndex(selectedId, 1)} className="flex-1 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-md text-[10px] font-bold hover:bg-white hover:border-indigo-300 hover:text-indigo-600 flex items-center justify-center transition-colors shadow-sm"><ArrowUp size={12} className="mr-1"/> Frente</button>
                   <button onClick={() => changeZIndex(selectedId, -1)} className="flex-1 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-md text-[10px] font-bold hover:bg-white hover:border-indigo-300 hover:text-indigo-600 flex items-center justify-center transition-colors shadow-sm"><ArrowDown size={12} className="mr-1"/> Fondo</button>
                   <button onClick={deleteSelected} className="flex-1 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-md text-[10px] font-bold hover:bg-rose-100 hover:border-rose-300 flex items-center justify-center transition-colors shadow-sm"><Trash2 size={12} className="mr-1"/> Borrar</button>
                 </div>
              )}
            </div>
          )}

          <div className="overflow-y-auto flex-1 hide-scrollbar p-4 space-y-5">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h3 className="font-bold text-slate-800 mb-2 text-xs uppercase tracking-wider flex items-center border-b border-slate-100 pb-2"><MapPin size={14} className="mr-1.5 text-rose-500"/> Escenario Real</h3>
              {!bgImage ? (
                <><input type="file" accept="image/*" ref={fileInputRefBg} onChange={handleBgUpload} className="hidden" /><button onClick={() => fileInputRefBg.current.click()} className="w-full py-3 bg-slate-50 text-slate-600 rounded-lg font-bold text-xs hover:bg-slate-100 hover:text-indigo-600 transition-colors flex items-center justify-center border-2 border-dashed border-slate-300"><ImageIcon size={16} className="mr-2"/> Subir Foto / Plano</button></>
              ) : (
                <div className="space-y-2">
                  <button onClick={() => setActiveTool('calibrate')} className={`w-full py-2.5 rounded-lg font-bold text-xs flex items-center justify-center transition-all shadow-sm ${activeTool === 'calibrate' ? 'bg-sky-500 text-white ring-2 ring-sky-200' : 'bg-sky-50 text-sky-600 hover:bg-sky-100 border border-sky-200'}`}><Spline size={14} className="mr-2"/> Calibrar Medidas</button>
                  <button onClick={() => setActiveTool('move_bg')} className={`w-full py-2.5 rounded-lg font-bold text-xs flex items-center justify-center transition-all shadow-sm ${activeTool === 'move_bg' ? 'bg-emerald-500 text-white ring-2 ring-emerald-200' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'}`}><Move size={14} className="mr-2"/> Mover Fondo</button>
                  <button onClick={removeBackground} className="w-full py-2 bg-white border border-rose-200 text-rose-500 rounded-lg font-bold text-[10px] hover:bg-rose-50 transition-colors mt-1">Quitar Imagen</button>
                </div>
              )}
            </div>

            <div>
              <h3 className="font-bold text-slate-800 mb-3 text-xs uppercase tracking-wider flex items-center"><Layers size={16} className="mr-2 text-indigo-500"/> Catálogo PRO</h3>
              <div className="grid grid-cols-2 gap-2 pb-6">
                {DECO_CATALOG.map((item, idx) => (
                  <div key={idx} draggable onDragStart={(e) => handleDragStart(e, item)} onClick={() => { const cx = (-pan.x / scale) + ((vp.w / 2) / scale) - (item.defaultW / 2); const cy = (-pan.y / scale) + ((vp.h / 2) / scale) - (item.defaultH / 2); createNewElement(item, cx, cy); }} className="bg-white p-2.5 rounded-xl border border-slate-200 text-center cursor-grab active:cursor-grabbing hover:border-pink-400 hover:shadow-md transition-all group" title="Haz clic para agregar al centro, o arrastra al lienzo"><div className="h-10 flex items-center justify-center mb-1.5 pointer-events-none group-hover:scale-110 transition-transform">{renderSidebarIcon(item)}</div><p className="text-[9px] font-bold text-slate-600 leading-tight pointer-events-none">{item.name}</p></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {calibrationModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in zoom-in-95">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-8 text-center border-4 border-sky-200"><div className="w-16 h-16 bg-sky-50 text-sky-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner"><Maximize size={32} /></div><h3 className="font-black text-xl text-slate-800 mb-2">Escalar Fondo</h3><p className="text-slate-500 text-sm mb-6 leading-relaxed">¿Cuántos <b>metros reales</b> mide la línea azul que acabas de trazar en la foto?</p><div className="flex items-center justify-center bg-slate-50 border-2 border-slate-200 rounded-2xl mb-8 focus-within:border-sky-400 focus-within:bg-white transition-all shadow-inner"><input type="number" step="0.1" autoFocus placeholder="Ej. 2.5" value={realDistanceInput} onChange={(e) => setRealDistanceInput(e.target.value)} className="w-full p-4 bg-transparent outline-none font-black text-2xl text-center text-slate-800" /><span className="pr-5 font-bold text-slate-400 text-sm uppercase tracking-wider">metros</span></div><div className="flex space-x-4"><button onClick={() => { setCalibrationModal(null); setCalibrationLine(null); setActiveTool('select'); }} className="flex-1 p-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancelar</button><button onClick={applyCalibration} className="flex-1 p-3 bg-sky-500 text-white rounded-xl font-bold shadow-lg hover:bg-sky-600 hover:shadow-sky-500/30 transition-all active:scale-95">Aplicar Escala</button></div></div>
        </div>
      )}

      {showClearConfirm && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in zoom-in-95">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden p-6 text-center shadow-2xl border border-rose-100"><div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={32} /></div><h3 className="font-bold text-xl text-slate-800 mb-2">¿Borrar Diseño?</h3><p className="text-slate-500 mb-6 text-sm">Se eliminarán todos los muebles y fondos de este plano. Esta acción no se puede deshacer.</p><div className="flex space-x-3"><button onClick={() => setShowClearConfirm(false)} className="flex-1 p-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancelar</button><button onClick={executeClearAll} className="flex-1 p-3 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-colors shadow-sm">Sí, Borrar Todo</button></div></div>
        </div>
      )}

    </div>
  );
};

// ==========================================
// --- COMPONENTE: CHECKLIST (MEJORADO Y CONECTADO) ---
// ==========================================
const ChecklistView = ({ tareas, addNotification }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  
  const [formData, setFormData] = useState({
    titulo: '', categoria: 'Logística', fechaLimite: '', estado: 'pendiente'
  });

  const categorias = ['Logística', 'Comida/Bebida', 'Comunicación', 'Música', 'Decoración', 'Finanzas', 'Otros'];

  // 🔴 CONEXIÓN REAL A FIREBASE (Usamos las tareas que vienen de App)
  const safeTareas = tareas || [];

  const handleSaveTarea = async (e) => {
    e.preventDefault();
    const nuevoId = Date.now().toString();
    await setDoc(doc(db, "eventos", ID_DEL_EVENTO, "tareas", nuevoId), { id: nuevoId, ...formData });
    setIsFormOpen(false);
    setFormData({ titulo: '', categoria: 'Logística', fechaLimite: '', estado: 'pendiente' });
    if(addNotification) addNotification('Tarea Agregada', 'Se ha añadido al tablero correctamente.', 'success', 'tareas');
  };

  const moverTarea = async (id, nuevoEstado) => {
    const tarea = safeTareas.find(t => t.id === id);
    if(tarea) {
      await setDoc(doc(db, "eventos", ID_DEL_EVENTO, "tareas", id.toString()), { ...tarea, estado: nuevoEstado });
    }
  };

  const eliminarTarea = async (id) => {
    await deleteDoc(doc(db, "eventos", ID_DEL_EVENTO, "tareas", id.toString()));
    if(addNotification) addNotification('Tarea Eliminada', 'Se ha quitado del checklist.', 'warning');
  };

  const isOverdue = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  // Filtrado
  const tareasFiltradas = filtroCategoria === 'Todas' 
    ? safeTareas 
    : safeTareas.filter(t => t.categoria === filtroCategoria);

  // Columnas
  const pendientes = tareasFiltradas.filter(t => t.estado === 'pendiente');
  const enProceso = tareasFiltradas.filter(t => t.estado === 'proceso');
  const completadas = tareasFiltradas.filter(t => t.estado === 'listo');

  // Renderizado de Tarjeta de Tarea
  const renderTarea = (tarea) => {
    const overdue = isOverdue(tarea.fechaLimite) && tarea.estado !== 'listo';
    
    return (
      <div key={tarea.id} className={`bg-white p-4 rounded-xl border shadow-sm mb-3 transition-all hover:shadow-md group ${overdue ? 'border-rose-300' : 'border-slate-200'}`}>
        <div className="flex justify-between items-start mb-2">
          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">{tarea.categoria}</span>
          <button onClick={() => eliminarTarea(tarea.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
        </div>
        
        <h4 className={`font-bold text-sm mb-2 ${tarea.estado === 'listo' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
          {tarea.titulo}
        </h4>
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center">
            {tarea.fechaLimite ? (
              <span className={`text-[10px] font-bold flex items-center ${overdue ? 'text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded' : 'text-slate-500'}`}>
                {overdue ? <AlertCircle size={12} className="mr-1"/> : <Calendar size={12} className="mr-1"/>}
                {tarea.fechaLimite}
              </span>
            ) : <span className="text-[10px] text-slate-400 flex items-center"><Calendar size={12} className="mr-1"/> Sin fecha</span>}
          </div>
          
          <div className="flex space-x-1">
            {tarea.estado === 'pendiente' && (
              <button onClick={() => moverTarea(tarea.id, 'proceso')} className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded hover:bg-indigo-100 flex items-center">
                <Clock size={12} className="mr-1"/> Iniciar
              </button>
            )}
            {tarea.estado === 'proceso' && (
              <>
                <button onClick={() => moverTarea(tarea.id, 'pendiente')} className="px-2 py-1 text-slate-400 text-[10px] font-bold hover:text-slate-600">Pausar</button>
                <button onClick={() => moverTarea(tarea.id, 'listo')} className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded hover:bg-emerald-100 flex items-center">
                  <CheckCircle2 size={12} className="mr-1"/> Completar
                </button>
              </>
            )}
            {tarea.estado === 'listo' && (
              <button onClick={() => moverTarea(tarea.id, 'pendiente')} className="px-2 py-1 text-slate-400 text-[10px] font-bold hover:text-indigo-500">Reabrir</button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col space-y-6 pb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Tablero de Actividades</h2>
          <p className="text-slate-500 text-sm mt-1">Organiza tu progreso moviendo las tareas entre las columnas.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-xl bg-white text-sm font-bold text-slate-700 outline-none shadow-sm flex-1 md:flex-none">
            <option value="Todas">Todas las Categorías</option>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={() => setIsFormOpen(true)} className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-sm hover:bg-indigo-700 transition-colors flex-1 md:flex-none">
            <Plus size={18} className="mr-1.5" /> Tarea
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
        <div className="flex-1 flex flex-col bg-slate-50 rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-bold text-slate-700 flex items-center"><Circle size={16} className="mr-2 text-slate-400"/> Por Hacer</h3>
            <span className="bg-white text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full border border-slate-200 shadow-sm">{pendientes.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {pendientes.map(renderTarea)}
            {pendientes.length === 0 && <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">No hay tareas pendientes.</div>}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-indigo-50/50 rounded-2xl border border-indigo-100 p-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-bold text-indigo-900 flex items-center"><Clock size={16} className="mr-2 text-indigo-500"/> En Proceso</h3>
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">{enProceso.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {enProceso.map(renderTarea)}
            {enProceso.length === 0 && <div className="text-center py-8 text-indigo-300 text-sm border-2 border-dashed border-indigo-200 rounded-xl">Arrastra o inicia una tarea.</div>}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-emerald-50/50 rounded-2xl border border-emerald-100 p-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-bold text-emerald-900 flex items-center"><CheckCircle2 size={16} className="mr-2 text-emerald-500"/> Completado</h3>
            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">{completadas.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {completadas.map(renderTarea)}
            {completadas.length === 0 && <div className="text-center py-8 text-emerald-300 text-sm border-2 border-dashed border-emerald-200 rounded-xl">Aún no hay tareas terminadas.</div>}
          </div>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800 flex items-center"><ListTodo size={20} className="mr-2 text-indigo-600"/> Agregar Tarea</h3>
              <button onClick={() => setIsFormOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-800"/></button>
            </div>
            <form onSubmit={handleSaveTarea} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-600">¿Qué necesitas hacer?</label>
                <input type="text" required value={formData.titulo} onChange={e=>setFormData({...formData, titulo: e.target.value})} placeholder="Ej. Contratar al fotógrafo" className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none" autoFocus/>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-600">Categoría</label>
                <select value={formData.categoria} onChange={e=>setFormData({...formData, categoria: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none">
                  {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-600">Fecha Límite (Opcional)</label>
                <input type="date" value={formData.fechaLimite} onChange={e=>setFormData({...formData, fechaLimite: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none" />
              </div>
              
              <button type="submit" className="w-full p-3 bg-indigo-600 text-white rounded-xl font-bold mt-2 shadow-md hover:bg-indigo-700 transition-colors">
                Crear Tarea
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// --- COMPONENTE: CRONOGRAMA (TIMING / MINUTO A MINUTO) ---
// ==========================================
const TimingView = ({ timing, setTiming, addNotification }) => {
  const [exportViewOpen, setExportViewOpen] = useState(false);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, evento: null });
  const [deleteModal, setDeleteModal] = useState(null);
  const [formData, setFormData] = useState({ hora: '', actividad: '', responsable: '', lugar: '', notas: '' });

  const timingOrdenado = [...timing].sort((a, b) => a.hora.localeCompare(b.hora));

  const handleSave = async (e) => {
      e.preventDefault();
    const nuevoId = Date.now().toString();
    await setDoc(doc(db, "eventos", ID_DEL_EVENTO, "timing", nuevoId), { id: nuevoId, ...formData });
      setModalOpen(false);
      if(addNotification) addNotification('Actividad Guardada', 'El cronograma se ha actualizado en la nube.', 'success');
  };

  const handleUpdate = async (e) => {
      e.preventDefault();
    await setDoc(doc(db, "eventos", ID_DEL_EVENTO, "timing", editModal.evento.id.toString()), editModal.evento);
      setEditModal({ open: false, evento: null });
      if(addNotification) addNotification('Cambios Guardados', 'Actividad modificada en la nube.', 'success');
  };

  const executeDelete = async () => {
    await deleteDoc(doc(db, "eventos", ID_DEL_EVENTO, "timing", deleteModal.id.toString()));
      setDeleteModal(null);
      if(addNotification) addNotification('Eliminada', 'Actividad removida del cronograma.', 'warning');
  };

  const triggerPdfDownload = async () => {
    setIsPreparingPrint(true);
    setTimeout(async () => {
      try {
        const { jsPDF } = await import('jspdf');
        const html2canvas = (await import('html2canvas')).default;
        const pages = document.querySelectorAll('.timing-pdf-page');
        const pdf = new jsPDF('p', 'mm', 'letter');

        for (let i = 0; i < pages.length; i++) {
           const canvas = await html2canvas(pages[i], { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
           const imgData = canvas.toDataURL('image/jpeg', 0.95);
           if (i > 0) pdf.addPage();
           pdf.addImage(imgData, 'JPEG', 0, 0, 215.9, 279.4);
        }
        pdf.save('Cronograma-Rundown.pdf');
        if(addNotification) addNotification('¡PDF Guardado!', 'Revisa tu carpeta de descargas.', 'success');
      } catch (error) {
        if(addNotification) addNotification('Error', 'Fallo al generar el PDF.', 'error');
      }
      setIsPreparingPrint(false);
      setExportViewOpen(false);
    }, 500);
  };

  if (exportViewOpen) {
    const PAGE_1_LIMIT = 12;
    const PAGE_N_LIMIT = 18;
    const firstPageItems = timingOrdenado.slice(0, PAGE_1_LIMIT);
    const extraItems = timingOrdenado.slice(PAGE_1_LIMIT);
    const extraPages = [];
    for(let i=0; i<extraItems.length; i+=PAGE_N_LIMIT) extraPages.push(extraItems.slice(i, i+PAGE_N_LIMIT));

    const renderTableRows = (rows) => (
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="bg-slate-800 text-white">
            <th className="px-4 py-3 font-bold w-24 border border-slate-800">Hora</th>
            <th className="px-4 py-3 font-bold border border-slate-800">Actividad / Momento</th>
            <th className="px-4 py-3 font-bold border border-slate-800">Responsable</th>
            <th className="px-4 py-3 font-bold border border-slate-800">Lugar / Notas Extra</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((evento, idx) => (
            <tr key={`print_${evento.id}`} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
              <td className="px-4 py-4 font-black text-lg text-indigo-600 border border-slate-300 align-top">{evento.hora}</td>
              <td className="px-4 py-4 border border-slate-300 align-top"><p className="font-bold text-slate-800 text-base">{evento.actividad}</p></td>
              <td className="px-4 py-4 border border-slate-300 font-bold text-slate-600 uppercase text-xs align-top">{evento.responsable}</td>
              <td className="px-4 py-4 border border-slate-300 align-top">
                {evento.lugar && <p className="font-bold text-xs text-slate-800 mb-1 flex items-center"><MapPin size={10} className="mr-1"/> {evento.lugar}</p>}
                {evento.notas && <p className="text-xs text-slate-500 italic">{evento.notas}</p>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );

    return (
      <div className="fixed inset-0 z-[120] bg-slate-200 flex flex-col overflow-hidden">
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-lg print:hidden z-10 shrink-0 gap-4">
          <div className="flex items-center space-x-4">
            <button onClick={() => setExportViewOpen(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={24}/></button>
            <div><h3 className="font-bold text-sm">Estudio de Impresión: Staff Rundown</h3><p className="text-[10px] text-slate-400">Guion operativo tamaño Carta.</p></div>
          </div>
          <button onClick={triggerPdfDownload} disabled={isPreparingPrint} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold flex items-center shadow-md transition-all disabled:bg-slate-600">
            {isPreparingPrint ? <RefreshCw size={16} className="mr-2 animate-spin"/> : <Download size={16} className="mr-2"/>} 
            {isPreparingPrint ? 'Preparando...' : 'Descargar PDF'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-200 flex flex-col items-center py-8 gap-8">
          <div className="timing-pdf-page bg-white mx-auto shadow-2xl shrink-0" style={{ width: '215.9mm', height: '279.4mm', padding: '15mm', boxSizing: 'border-box', overflow: 'hidden', position: 'relative' }}>
            <header className="flex justify-between items-start border-b-4 border-slate-900 pb-6 mb-8">
              <div>
                <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight">GUION OPERATIVO</h1>
                <p className="text-lg text-slate-600 font-bold mt-1">Mi Gran Evento</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Documento Confidencial</p>
                <p className="text-xs text-slate-400 mt-1">Solo Staff y Proveedores</p>
              </div>
            </header>
            <main>{renderTableRows(firstPageItems)}</main>
            <div className="absolute bottom-6 right-6 text-[10px] font-bold text-slate-400">Página 1 de {1 + extraPages.length}</div>
          </div>

          {extraPages.map((pageRows, pIdx) => (
            <div key={`extrapage_${pIdx}`} className="timing-pdf-page bg-white mx-auto shadow-2xl shrink-0" style={{ width: '215.9mm', height: '279.4mm', padding: '15mm', boxSizing: 'border-box', overflow: 'hidden', position: 'relative' }}>
              <header className="border-b-2 border-slate-800 pb-3 mb-6">
                <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">GUION OPERATIVO (Cont.)</h1>
              </header>
              <main>{renderTableRows(pageRows)}</main>
              <div className="absolute bottom-6 right-6 text-[10px] font-bold text-slate-400">Página {pIdx + 2} de {1 + extraPages.length}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 pb-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">El Minuto a Minuto</h2>
          <p className="text-slate-500 text-sm mt-1">Sincroniza al staff y proveedores con el guion perfecto.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setExportViewOpen(true)} className="flex items-center px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 shadow-sm transition-colors">
            <FileDown size={16} className="mr-2 text-indigo-600"/> Reporte PDF
          </button>
          <button onClick={() => { setFormData({ hora: '', actividad: '', responsable: '', lugar: '', notas: '' }); setModalOpen(true); }} className="flex items-center px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-sm hover:bg-indigo-700 transition-colors">
            <Plus size={18} className="mr-2" /> Agregar Momento
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-y-auto">
        {timingOrdenado.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Clock size={48} className="mx-auto mb-4 opacity-20"/>
            <p className="font-medium">Tu cronograma está vacío. Empieza a planear el gran día.</p>
          </div>
        ) : (
          <div className="relative border-l-4 border-indigo-100 ml-4 md:ml-10 space-y-8 py-4">
            {timingOrdenado.map((evento) => (
              <div key={evento.id} className="relative pl-8 md:pl-12 group">
                <div className="absolute w-6 h-6 bg-white border-4 border-indigo-500 rounded-full -left-[15px] top-1 shadow-sm group-hover:scale-125 transition-transform"></div>
                <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl font-black text-indigo-600">{evento.hora}</span>
                      <span className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[10px] font-bold uppercase tracking-wider">{evento.responsable}</span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 mb-2">{evento.actividad}</h4>
                    {evento.lugar && <p className="text-sm font-bold text-slate-600 flex items-center mb-1"><MapPin size={14} className="mr-1.5 text-rose-500"/> {evento.lugar}</p>}
                    {evento.notas && <p className="text-sm text-slate-500 flex items-start mt-2"><AlignLeft size={14} className="mr-1.5 mt-0.5 opacity-50"/> {evento.notas}</p>}
                  </div>
                  <div className="flex md:flex-col justify-end md:justify-start gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-slate-200 mt-2 md:mt-0">
                    <button onClick={() => setEditModal({ open: true, evento: { ...evento } })} className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 rounded-xl transition-colors shadow-sm"><Edit2 size={16} /></button>
                    <button onClick={() => setDeleteModal(evento)} className="p-2 bg-white border border-slate-200 text-rose-400 hover:text-rose-600 hover:border-rose-300 rounded-xl transition-colors shadow-sm"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="px-6 py-5 border-b bg-slate-50 flex justify-between items-center"><h3 className="font-bold text-xl text-slate-800">Agregar Momento</h3><button onClick={() => setModalOpen(false)}><X size={20} className="text-slate-500"/></button></div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-2">Hora</label><input type="time" required value={formData.hora} onChange={e=>setFormData({...formData, hora: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:border-indigo-500" /></div>
                <div><label className="block text-xs font-bold mb-2">Responsable</label><input type="text" value={formData.responsable} onChange={e=>setFormData({...formData, responsable: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:border-indigo-500" placeholder="Ej. DJ, Hostess" /></div>
              </div>
              <div><label className="block text-xs font-bold mb-2">Actividad / Momento</label><input type="text" required value={formData.actividad} onChange={e=>setFormData({...formData, actividad: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:border-indigo-500" placeholder="Ej. Entrada de Novios" /></div>
              <div><label className="block text-xs font-bold mb-2">Lugar (Opcional)</label><input type="text" value={formData.lugar} onChange={e=>setFormData({...formData, lugar: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:border-indigo-500" placeholder="Ej. Pista de Baile" /></div>
              <div><label className="block text-xs font-bold mb-2">Notas Extra (Opcional)</label><textarea value={formData.notas} onChange={e=>setFormData({...formData, notas: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:border-indigo-500" rows="2" placeholder="Canción específica, detalles..." /></div>
              <button type="submit" className="w-full p-3.5 bg-indigo-600 text-white rounded-xl font-bold mt-2 hover:bg-indigo-700">Guardar Momento</button>
            </form>
          </div>
        </div>
      )}

      {editModal.open && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="px-6 py-5 border-b bg-slate-50 flex justify-between items-center"><h3 className="font-bold text-xl text-slate-800">Editar Momento</h3><button onClick={() => setEditModal({open: false, evento: null})}><X size={20} className="text-slate-500"/></button></div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-2">Hora</label><input type="time" required value={editModal.evento.hora} onChange={e=>setEditModal({...editModal, evento: {...editModal.evento, hora: e.target.value}})} className="w-full p-3 border rounded-xl outline-none focus:border-indigo-500" /></div>
                <div><label className="block text-xs font-bold mb-2">Responsable</label><input type="text" value={editModal.evento.responsable} onChange={e=>setEditModal({...editModal, evento: {...editModal.evento, responsable: e.target.value}})} className="w-full p-3 border rounded-xl outline-none focus:border-indigo-500" /></div>
              </div>
              <div><label className="block text-xs font-bold mb-2">Actividad / Momento</label><input type="text" required value={editModal.evento.actividad} onChange={e=>setEditModal({...editModal, evento: {...editModal.evento, actividad: e.target.value}})} className="w-full p-3 border rounded-xl outline-none focus:border-indigo-500" /></div>
              <div><label className="block text-xs font-bold mb-2">Lugar (Opcional)</label><input type="text" value={editModal.evento.lugar || ''} onChange={e=>setEditModal({...editModal, evento: {...editModal.evento, lugar: e.target.value}})} className="w-full p-3 border rounded-xl outline-none focus:border-indigo-500" /></div>
              <div><label className="block text-xs font-bold mb-2">Notas Extra</label><textarea value={editModal.evento.notas || ''} onChange={e=>setEditModal({...editModal, evento: {...editModal.evento, notas: e.target.value}})} className="w-full p-3 border rounded-xl outline-none focus:border-indigo-500" rows="2" /></div>
              <button type="submit" className="w-full p-3.5 bg-indigo-600 text-white rounded-xl font-bold mt-2 hover:bg-indigo-700">Guardar Cambios</button>
            </form>
          </div>
        </div>
      )}

      {deleteModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden p-6 text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={32} /></div>
            <h3 className="font-bold text-xl text-slate-800 mb-2">¿Eliminar actividad?</h3>
            <p className="text-slate-500 mb-6 text-sm">Borrarás "<b>{deleteModal.actividad}</b>" a las {deleteModal.hora}.</p>
            <div className="flex space-x-3">
              <button onClick={() => setDeleteModal(null)} className="flex-1 p-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200">Cancelar</button>
              <button onClick={executeDelete} className="flex-1 p-3 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600">Sí, Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// --- COMPONENTE: PRESUPUESTO (Fase 4) ---
// ==========================================
const PresupuestoView = ({ gastos, setGastos, proveedores, setProveedores, presupuestoTotal, setPresupuestoTotal, addNotification }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ concepto: '', categoria: 'Lugar', estimado: '', fechaLimite: '' });
  const [paymentProcess, setPaymentProcess] = useState(null);
  const [deleteProcess, setDeleteProcess] = useState(null);
  const [historyModal, setHistoryModal] = useState(null);
  const [editGastoModal, setEditGastoModal] = useState(null);
  const [viewMode, setViewMode] = useState('table'); 
  const [viewReceipt, setViewReceipt] = useState(null);
  
  const [exportViewOpen, setExportViewOpen] = useState(false);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(presupuestoTotal);

  useEffect(() => {
    if (!isEditingBudget) setTempBudget(presupuestoTotal);
  }, [presupuestoTotal, isEditingBudget]);

  const categorias = ['Lugar', 'Música', 'Decoración', 'Recuerdos', 'Comida/Bebida', 'Ropa/Maquillaje', 'Papelería', 'Otros'];
  const coloresCategoria = { 'Lugar':'bg-indigo-500', 'Música':'bg-pink-500', 'Decoración':'bg-emerald-500', 'Comida/Bebida':'bg-amber-500', 'Otros':'bg-slate-500' };

  const safeGastos = gastos || [];
  const totalEstimado = safeGastos.reduce((sum, g) => sum + g.estimado, 0);
  const totalPagado = safeGastos.reduce((sum, g) => sum + g.pagado, 0);
  const totalDeuda = totalEstimado - totalPagado;

  const gastosPorCategoria = safeGastos.reduce((acc, g) => { acc[g.categoria] = (acc[g.categoria] || 0) + g.estimado; return acc; }, {});
  
  const handleSaveGasto = async (e) => {
    e.preventDefault();
    const nuevoId = Date.now().toString();
    const nuevoGasto = { id: nuevoId, ...formData, estimado: Number(formData.estimado), pagado: 0, proveedorId: null, historial: [] };
    await setDoc(doc(db, "eventos", ID_DEL_EVENTO, "gastos", nuevoId), nuevoGasto);
    setIsFormOpen(false);
    if (addNotification) addNotification('Éxito', 'Gasto agregado correctamente.', 'success');
  };

  const handleUpdateGasto = async (e) => {
    e.preventDefault();
    const gastoActualizado = { ...editGastoModal, estimado: Number(editGastoModal.estimado) };
    await setDoc(doc(db, "eventos", ID_DEL_EVENTO, "gastos", editGastoModal.id.toString()), gastoActualizado);
    setEditGastoModal(null);
    if (addNotification) addNotification('Actualizado', 'Los cambios se han guardado.', 'success');
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    const { item, monto, fecha, metodo, cuenta, comprobante } = paymentProcess;
    const montoNum = Number(monto);
    const nombreArchivo = comprobante ? comprobante.name : null;
    
    const gastoActualizado = { 
      ...item, 
      pagado: item.pagado + montoNum, 
      historial: [...(item.historial || []), { id: Date.now(), fecha, monto: montoNum, metodo, cuenta, comprobante: nombreArchivo }] 
    };
    
    await setDoc(doc(db, "eventos", ID_DEL_EVENTO, "gastos", item.id.toString()), gastoActualizado);
    setPaymentProcess(null);
    if (addNotification) addNotification('Pago Registrado', `Se abonaron $${montoNum} a ${item.concepto}.`, 'success');
  };

  const initiateDelete = (gasto) => {
    if (gasto.pagado === 0) executeDelete(gasto, 0, false);
    else setDeleteProcess({ step: 1, item: gasto, refundAmount: '', keepRemaining: false });
  };

  const executeDelete = async (gasto, refundAmount, keepRemaining) => {
    const refund = Number(refundAmount); 
    const lostMoney = gasto.pagado - refund;
    
    if (lostMoney > 0 && keepRemaining) {
      const gastoActualizado = { ...gasto, concepto: `${gasto.concepto} (Cancelado)`, estimado: lostMoney, pagado: lostMoney, proveedorId: null };
      await setDoc(doc(db, "eventos", ID_DEL_EVENTO, "gastos", gasto.id.toString()), gastoActualizado);
    } else { 
      await deleteDoc(doc(db, "eventos", ID_DEL_EVENTO, "gastos", gasto.id.toString())); 
    }
    
    if (gasto.proveedorId && proveedores) { 
      const prov = proveedores.find(p => p.id === gasto.proveedorId);
      if (prov) {
         await setDoc(doc(db, "eventos", ID_DEL_EVENTO, "proveedores", prov.id.toString()), { ...prov, status: 'Descartado', contratado: false, gastoId: null });
      }
    }
    
    setDeleteProcess(null);
    if (addNotification) addNotification('Cancelado', 'Servicio cancelado con éxito.', 'warning');
  };

  const exportData = () => {
    const data = safeGastos.map(g => ({ Concepto: g.concepto, Categoria: g.categoria, Total: g.estimado, Pagado: g.pagado, Deuda: g.estimado - g.pagado, Fecha_Limite: g.fechaLimite || 'N/A' }));
    exportToCSV("presupuesto_evento.csv", data);
    if (addNotification) addNotification('Descarga Iniciada', 'Tu archivo Excel se está descargando.', 'success');
  };

  const guardarPresupuestoNube = async () => {
    const nuevoValor = Number(tempBudget);
    if (isNaN(nuevoValor) || nuevoValor <= 0) return;
    setPresupuestoTotal(nuevoValor);
    setIsEditingBudget(false);
    localStorage.setItem('eventmaster_presupuesto', nuevoValor);
    try {
      await setDoc(doc(db, "eventos", ID_DEL_EVENTO), { presupuestoTotal: nuevoValor }, { merge: true });
      if(addNotification) addNotification('Presupuesto Guardado', 'Se ha guardado tu presupuesto total en la nube.', 'success');
    } catch (error) {}
  };

  const formatMoney = (amount) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);
  const isOverdue = (dateStr, deuda) => { if(!dateStr || deuda <= 0) return false; return new Date(dateStr) < new Date(); };
  const gastosConFecha = safeGastos.filter(g => g.fechaLimite && (g.estimado - g.pagado) > 0).sort((a,b) => new Date(a.fechaLimite) - new Date(b.fechaLimite));

  const triggerPdfDownload = async () => {
    setIsPreparingPrint(true);
    setTimeout(async () => {
      try {
        const { jsPDF } = await import('jspdf');
        const html2canvas = (await import('html2canvas')).default;
        const pages = document.querySelectorAll('.finance-pdf-page');
        const pdf = new jsPDF('p', 'mm', 'letter');

        for (let i = 0; i < pages.length; i++) {
           const canvas = await html2canvas(pages[i], { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
           const imgData = canvas.toDataURL('image/jpeg', 0.95);
           if (i > 0) pdf.addPage();
           pdf.addImage(imgData, 'JPEG', 0, 0, 215.9, 279.4);
        }
        pdf.save('Reporte-Financiero.pdf');
        if(addNotification) addNotification('¡PDF Guardado!', 'Revisa tu carpeta de descargas.', 'success');
      } catch (error) {
        if(addNotification) addNotification('Error', 'Fallo al generar el PDF.', 'error');
      }
      setIsPreparingPrint(false);
      setExportViewOpen(false);
    }, 500);
  };

  if (exportViewOpen) {
    const PAGE_1_LIMIT = 10;
    const PAGE_N_LIMIT = 20;
    const firstPageItems = safeGastos.slice(0, PAGE_1_LIMIT);
    const extraItems = safeGastos.slice(PAGE_1_LIMIT);
    const extraPages = [];
    for(let i=0; i<extraItems.length; i+=PAGE_N_LIMIT) extraPages.push(extraItems.slice(i, i+PAGE_N_LIMIT));

    const renderTableRows = (rows) => (
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="bg-slate-100 text-slate-800 border-b-2 border-slate-800">
            <th className="px-3 py-3 font-bold">Concepto</th>
            <th className="px-3 py-3 font-bold">Categoría</th>
            <th className="px-3 py-3 font-bold text-right">Costo Total</th>
            <th className="px-3 py-3 font-bold text-right">Abonado</th>
            <th className="px-3 py-3 font-bold text-right">Falta Pagar</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((gasto) => {
            const deuda = gasto.estimado - gasto.pagado;
            return (
              <tr key={`print_${gasto.id}`} className="border-b border-slate-200">
                <td className="px-3 py-3 font-bold text-slate-800">{gasto.concepto}</td>
                <td className="px-3 py-3 text-slate-600 text-xs">{gasto.categoria}</td>
                <td className="px-3 py-3 text-right font-medium">{formatMoney(gasto.estimado)}</td>
                <td className="px-3 py-3 text-right font-bold text-emerald-600">{formatMoney(gasto.pagado)}</td>
                <td className="px-3 py-3 text-right font-bold text-amber-600">{deuda > 0 ? formatMoney(deuda) : <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold bg-slate-100 px-2 py-1 rounded">Saldado</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );

    return (
      <div className="fixed inset-0 z-[120] bg-slate-200 flex flex-col overflow-hidden">
        <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row justify-between items-center shadow-lg print:hidden z-10 gap-4 shrink-0">
          <div className="flex items-center space-x-4">
            <button onClick={() => setExportViewOpen(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={24}/></button>
            <div>
              <h3 className="font-bold text-sm">Reporte Financiero</h3>
              <p className="text-[10px] text-slate-400">Paginado Tamaño Carta</p>
            </div>
          </div>
          <button onClick={triggerPdfDownload} disabled={isPreparingPrint} className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-50 text-white rounded-xl text-sm font-bold flex items-center justify-center shadow-md transition-all disabled:bg-slate-500">
            {isPreparingPrint ? <RefreshCw size={16} className="mr-2 animate-spin"/> : <Download size={16} className="mr-2"/>} 
            {isPreparingPrint ? 'Preparando...' : 'Descargar PDF'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-200 flex flex-col items-center py-8 gap-8 relative">
          <div className="finance-pdf-page bg-white shadow-2xl shrink-0" style={{ width: '215.9mm', height: '279.4mm', padding: '15mm', boxSizing: 'border-box', overflow: 'hidden', position: 'relative' }}>
            <header className="flex justify-between items-center border-b-2 border-slate-200 pb-4 mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-slate-800 rounded flex items-center justify-center text-white font-black text-xl mr-3">E</div>
                <div><h2 className="text-xl font-black text-slate-800 tracking-wider">EVENT MASTER</h2><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Plataforma Premium</p></div>
              </div>
              <div className="text-right">
                <h1 className="text-xl font-serif text-slate-900 italic">Reporte Financiero</h1>
              </div>
            </header>

            <div className="flex justify-between items-center border-y-2 border-slate-800 py-4 mb-6">
              <div className="text-center flex-1 border-r border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Presupuesto</p>
                <p className="text-xl font-black text-slate-800">{formatMoney(presupuestoTotal)}</p>
              </div>
              <div className="text-center flex-1 border-r border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Estimado</p>
                <p className="text-xl font-black text-slate-800">{formatMoney(totalEstimado)}</p>
              </div>
              <div className="text-center flex-1 border-r border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pagado</p>
                <p className="text-xl font-black text-emerald-600">{formatMoney(totalPagado)}</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Deuda</p>
                <p className="text-xl font-black text-amber-600">{formatMoney(totalDeuda)}</p>
              </div>
            </div>
            
            <main>{renderTableRows(firstPageItems)}</main>
            <div className="absolute bottom-6 right-6 text-[10px] font-bold text-slate-400">Página 1 de {1 + extraPages.length}</div>
          </div>

          {extraPages.map((pageRows, pIdx) => (
            <div key={`extrapage_${pIdx}`} className="finance-pdf-page bg-white shadow-2xl shrink-0" style={{ width: '215.9mm', height: '279.4mm', padding: '15mm', boxSizing: 'border-box', overflow: 'hidden', position: 'relative' }}>
               <header className="border-b-2 border-slate-800 pb-3 mb-6">
                 <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Reporte Financiero (Cont.)</h1>
               </header>
               <main>{renderTableRows(pageRows)}</main>
               <div className="absolute bottom-6 right-6 text-[10px] font-bold text-slate-400">Página {pIdx + 2} de {1 + extraPages.length}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 pb-6 relative">
      <div className="flex justify-between items-end">
        <div><h2 className="text-2xl font-bold text-slate-800">Control Financiero</h2><p className="text-slate-500 text-sm mt-1">Con gestión de abonos, fechas límite y reportes.</p></div>
        <div className="flex gap-2">
          <div className="bg-white rounded-xl border border-slate-200 p-1 hidden sm:flex">
            <button onClick={()=>setViewMode('table')} className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center transition-colors ${viewMode === 'table' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}><LayoutGrid size={16} className="mr-1.5"/> Tabla</button>
            <button onClick={()=>setViewMode('calendar')} className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center transition-colors ${viewMode === 'calendar' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}><CalendarDays size={16} className="mr-1.5"/> Fechas</button>
          </div>
          <button onClick={() => setExportViewOpen(true)} className="flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 shadow-sm"><FileDown size={16} className="mr-2 text-indigo-600"/> Reporte PDF</button>
          <button onClick={exportData} className="hidden sm:flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 shadow-sm"><Download size={16} className="mr-2"/> Excel</button>
          <button onClick={() => { setFormData({ concepto: '', categoria: 'Lugar', estimado: '', fechaLimite: '' }); setIsFormOpen(true); }} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-sm hover:bg-indigo-700"><Plus size={18} className="mr-2" /> Nuevo Gasto</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="text-slate-500 font-semibold text-sm mb-2 flex justify-between items-center">
            <span><Wallet size={16} className="inline mr-2 text-indigo-500"/> Presupuesto Total</span>
            {!isEditingBudget && (
              <button onClick={() => setIsEditingBudget(true)} className="text-indigo-400 hover:text-indigo-600 transition-colors p-1 bg-indigo-50 rounded" title="Editar Presupuesto"><Edit2 size={12}/></button>
            )}
          </div>
          {isEditingBudget ? (
             <div className="flex mt-auto bg-slate-50 rounded-lg overflow-hidden border border-slate-200 focus-within:border-indigo-400 transition-colors">
               <span className="pl-3 py-2 text-slate-400 font-bold">$</span>
               <input type="number" autoFocus value={tempBudget} onChange={(e)=>setTempBudget(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') guardarPresupuestoNube(); }} className="w-full py-2 px-2 bg-transparent font-bold outline-none text-slate-800" />
               <button onClick={guardarPresupuestoNube} className="bg-indigo-600 text-white px-4 font-bold text-xs hover:bg-indigo-700 transition-colors">OK</button>
             </div>
          ) : (
             <h3 className="text-3xl font-black text-slate-800 mt-auto">{formatMoney(presupuestoTotal)}</h3>
          )}
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col"><div className="text-slate-500 font-semibold text-sm mb-2"><PieChart size={16} className="inline mr-2 text-sky-500"/> Costo Estimado</div><h3 className="text-3xl font-black text-slate-800 mt-auto">{formatMoney(totalEstimado)}</h3></div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col"><div className="text-slate-500 font-semibold text-sm mb-2"><DollarSign size={16} className="inline mr-2 text-emerald-500"/> Dinero Pagado</div><h3 className="text-3xl font-black text-emerald-600 mt-auto">{formatMoney(totalPagado)}</h3></div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col"><div className="text-slate-500 font-semibold text-sm mb-2"><TrendingDown size={16} className="inline mr-2 text-amber-500"/> Por Pagar (Deuda)</div><h3 className="text-3xl font-black text-amber-500 mt-auto">{formatMoney(totalDeuda)}</h3></div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center"><PieChart size={16} className="mr-2 text-indigo-500"/> Distribución del Gasto (Estimado)</h3>
        <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-100">
          {Object.entries(gastosPorCategoria).map(([cat, amount], idx) => {
            const pct = (amount / totalEstimado) * 100;
            return <div key={idx} className={`${coloresCategoria[cat] || 'bg-indigo-300'} h-full transition-all`} style={{width: `${pct}%`}} title={`${cat}: ${formatMoney(amount)}`}></div>
          })}
        </div>
        <div className="flex flex-wrap gap-4 mt-3">
          {Object.entries(gastosPorCategoria).map(([cat, amount], idx) => (
            <div key={idx} className="flex items-center text-[10px] font-bold text-slate-600"><span className={`w-2 h-2 rounded-full mr-1.5 ${coloresCategoria[cat] || 'bg-indigo-300'}`}></span>{cat} ({(amount/totalEstimado*100).toFixed(0)}%)</div>
          ))}
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col print:hidden">
          <div className="overflow-y-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600"><tr><th className="px-6 py-4 font-semibold">Concepto / Servicio</th><th className="px-6 py-4 font-semibold">Fecha Límite</th><th className="px-6 py-4 font-semibold text-right">Costo Total</th><th className="px-6 py-4 font-semibold text-right">Abonado</th><th className="px-6 py-4 font-semibold text-right">Falta Pagar</th><th className="px-6 py-4 font-semibold text-center">Acciones</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {safeGastos.map((gasto) => {
                  const deuda = gasto.estimado - gasto.pagado;
                  const overdue = isOverdue(gasto.fechaLimite, deuda);
                  return (
                    <tr key={gasto.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{gasto.concepto}</p>
                        {gasto.proveedorId && <p className="text-[10px] text-indigo-500 flex items-center mt-1"><Building size={10} className="mr-1"/> Proveedor Vinculado</p>}
                      </td>
                      <td className="px-6 py-4">
                        {gasto.fechaLimite ? (
                           <span className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center w-max ${overdue ? 'bg-rose-100 text-rose-700' : (deuda===0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600')}`}>
                             {overdue ? <AlertCircle size={12} className="mr-1"/> : <Calendar size={12} className="mr-1"/>}
                             {gasto.fechaLimite}
                           </span>
                        ) : <span className="text-xs text-slate-400">-</span>}
                      </td>
                      <td className="px-6 py-4 text-right font-medium">{formatMoney(gasto.estimado)}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-emerald-600 block">{formatMoney(gasto.pagado)}</span>
                        {gasto.historial?.length > 0 && <button onClick={()=>setHistoryModal(gasto)} className="text-[10px] text-indigo-500 hover:text-indigo-700 font-bold flex items-center justify-end w-full mt-0.5"><History size={10} className="mr-1"/> Ver pagos ({gasto.historial.length})</button>}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-amber-500">{deuda > 0 ? formatMoney(deuda) : <span className="text-emerald-500 text-xs">Liquidado</span>}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center items-center space-x-2">
                          {deuda > 0 && <button onClick={() => setPaymentProcess({ item: gasto, monto: '', fecha: new Date().toISOString().split('T')[0], metodo: 'Transferencia', cuenta: '', comprobante: null })} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 font-bold text-xs rounded-lg hover:bg-emerald-100 border border-emerald-200">Abonar</button>}
                          <button onClick={() => setEditGastoModal(gasto)} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                          <button onClick={() => initiateDelete(gasto)} className="p-1.5 text-rose-400 hover:text-rose-600 bg-rose-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 print:hidden">
          <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center"><CalendarDays size={20} className="mr-2 text-indigo-600"/> Próximos Pagos Pendientes</h3>
          {gastosConFecha.length === 0 ? (
            <div className="text-center py-10 text-slate-400"><Calendar size={48} className="mx-auto mb-4 opacity-20"/> No hay pagos pendientes con fecha límite asignada.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gastosConFecha.map(g => {
                const deuda = g.estimado - g.pagado;
                const overdue = isOverdue(g.fechaLimite, deuda);
                return (
                  <div key={g.id} className={`p-4 rounded-xl border-l-4 shadow-sm flex flex-col bg-slate-50 ${overdue ? 'border-l-rose-500' : 'border-l-indigo-500'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${overdue ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'}`}>{g.fechaLimite}</span>
                      {overdue && <AlertCircle size={16} className="text-rose-500 animate-pulse"/>}
                    </div>
                    <h4 className="font-bold text-slate-800 text-md truncate">{g.concepto}</h4>
                    <p className="text-xs text-slate-500 mb-3">{g.categoria}</p>
                    <div className="mt-auto pt-3 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500">Deuda:</span>
                      <span className={`font-black text-lg ${overdue ? 'text-rose-600' : 'text-slate-800'}`}>{formatMoney(deuda)}</span>
                    </div>
                    <button onClick={() => setPaymentProcess({ item: g, monto: '', fecha: new Date().toISOString().split('T')[0], metodo: 'Transferencia', cuenta: '', comprobante: null })} className="w-full mt-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors">Registrar Abono</button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {editGastoModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b bg-slate-50 flex justify-between"><h3 className="font-bold text-xl text-slate-800">Editar Gasto</h3><button onClick={() => setEditGastoModal(null)}><X size={20}/></button></div>
            <form onSubmit={handleUpdateGasto} className="p-6 space-y-4">
              <div><label className="block text-xs font-bold mb-2 text-slate-600">Concepto</label><input type="text" required value={editGastoModal.concepto} onChange={e=>setEditGastoModal({...editGastoModal, concepto: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none" /></div>
              <div><label className="block text-xs font-bold mb-2 text-slate-600">Categoría</label><select value={editGastoModal.categoria} onChange={e=>setEditGastoModal({...editGastoModal, categoria: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none">{categorias.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-2 text-slate-600">Costo Estimado ($)</label><input type="number" required value={editGastoModal.estimado} onChange={e=>setEditGastoModal({...editGastoModal, estimado: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none" /></div>
                <div><label className="block text-xs font-bold mb-2 text-slate-600">Fecha Límite</label><input type="date" value={editGastoModal.fechaLimite || ''} onChange={e=>setEditGastoModal({...editGastoModal, fechaLimite: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none" /></div>
              </div>
              <button type="submit" className="w-full p-3 bg-indigo-600 text-white rounded-xl font-bold mt-4 hover:bg-indigo-700 transition-colors">Guardar Cambios</button>
            </form>
          </div>
        </div>
      )}

      {historyModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b bg-indigo-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-indigo-900 flex items-center"><History size={20} className="mr-2"/> Historial: {historyModal.concepto}</h3>
              <button onClick={() => setHistoryModal(null)} className="text-indigo-900/50 hover:text-indigo-900"><X size={20}/></button>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto space-y-4 bg-slate-50/50">
              {historyModal.historial.map((abono, i) => (
                <div key={abono.id} className="p-4 border border-slate-200 rounded-xl relative flex justify-between items-center bg-white shadow-sm hover:border-indigo-200 transition-colors">
                  <div className="absolute -left-2 -top-2 w-6 h-6 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-[10px] font-black text-slate-500">{i+1}</div>
                  <div>
                    <p className="font-bold text-slate-800 text-lg">{formatMoney(abono.monto)}</p>
                    <p className="text-xs text-slate-500 flex items-center mt-1"><Calendar size={12} className="mr-1"/> {abono.fecha}</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className="text-xs font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-1 rounded inline-block">{abono.metodo}</p>
                    {abono.cuenta && <p className="text-[10px] text-slate-400 mt-1">Ref: {abono.cuenta}</p>}
                    {abono.comprobante && (
                      <button onClick={() => setViewReceipt(abono.comprobante)} className="mt-2 text-[10px] flex items-center justify-end text-emerald-600 hover:text-emerald-700 font-bold w-full">
                        <ImageIcon size={12} className="mr-1"/> Ver Ticket
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {paymentProcess && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b bg-emerald-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-emerald-800 flex items-center"><DollarSign size={20} className="mr-2"/> Registrar Pago a: {paymentProcess.item.concepto}</h3>
            </div>
            <form onSubmit={handleAddPayment} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1 text-slate-600">Monto del Abono</label><input type="number" required max={paymentProcess.item.estimado - paymentProcess.item.pagado} value={paymentProcess.monto} onChange={e=>setPaymentProcess({...paymentProcess, monto: e.target.value})} className="w-full p-2.5 border rounded-xl font-bold text-lg text-emerald-600 focus:ring-2 focus:ring-emerald-200 outline-none bg-slate-50" /></div>
                <div><label className="block text-xs font-bold mb-1 text-slate-600">Fecha</label><input type="date" required value={paymentProcess.fecha} onChange={e=>setPaymentProcess({...paymentProcess, fecha: e.target.value})} className="w-full p-2.5 border rounded-xl focus:ring-2 outline-none bg-slate-50" /></div>
              </div>
              <div><label className="block text-xs font-bold mb-1 text-slate-600">Forma de Pago</label><select value={paymentProcess.metodo} onChange={e=>setPaymentProcess({...paymentProcess, metodo: e.target.value})} className="w-full p-2.5 border rounded-xl focus:ring-2 outline-none bg-slate-50"><option value="Transferencia">Transferencia</option><option value="Efectivo">Efectivo</option><option value="Tarjeta">Tarjeta</option><option value="Depósito">Depósito</option></select></div>
              {(paymentProcess.metodo === 'Transferencia' || paymentProcess.metodo === 'Depósito') && (<div><label className="block text-xs font-bold mb-1 text-slate-600">Cuenta / Referencia</label><input type="text" placeholder="Ej. 01234567890" value={paymentProcess.cuenta} onChange={e=>setPaymentProcess({...paymentProcess, cuenta: e.target.value})} className="w-full p-2.5 border rounded-xl focus:ring-2 outline-none bg-slate-50" /></div>)}
              
              <div>
                <label className="block text-xs font-bold mb-2 text-slate-600">Comprobante de Pago (Opcional)</label>
                <div className="flex gap-2">
                  <label className="flex-1 flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-emerald-50 hover:border-emerald-300 transition-colors">
                    <Upload size={18} className="text-emerald-400 mb-1"/>
                    <span className="text-[10px] font-bold text-slate-500 text-center">Subir Archivo</span>
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => setPaymentProcess({...paymentProcess, comprobante: e.target.files[0]})} />
                  </label>
                  <button type="button" onClick={() => { if(addNotification) addNotification('Cámara Activa', 'Se abrirá la cámara para fotografiar el recibo.', 'info'); }} className="flex-1 flex flex-col items-center justify-center p-3 border-2 border-slate-200 rounded-xl cursor-pointer hover:bg-emerald-50 transition-colors bg-slate-50 text-slate-600 hover:text-emerald-600">
                    <Camera size={18} className="mb-1"/>
                    <span className="text-[10px] font-bold">Tomar Foto</span>
                  </button>
                </div>
                {paymentProcess.comprobante && <p className="text-xs text-emerald-600 font-bold mt-2 text-center truncate bg-emerald-50 py-1 rounded">Adjunto: {paymentProcess.comprobante.name}</p>}
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setPaymentProcess(null)} className="flex-1 p-3 bg-slate-100 font-bold rounded-xl text-slate-600 transition-colors hover:bg-slate-200">Cancelar</button>
                <button type="submit" className="flex-1 p-3 bg-emerald-500 text-white font-bold rounded-xl shadow-md hover:bg-emerald-600 transition-colors">Guardar Pago</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteProcess && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center text-rose-500 mb-4"><AlertTriangle size={28} className="mr-3"/><h3 className="font-bold text-xl">Cancelar Servicio</h3></div>
            {deleteProcess.step === 1 && (<div className="space-y-4"><p className="text-slate-600 text-sm">Este gasto tiene abonos por <b>{formatMoney(deleteProcess.item.pagado)}</b>.</p><p className="text-slate-800 font-bold">¿Hubo reembolso?</p><div className="flex space-x-3 pt-2"><button onClick={() => setDeleteProcess({...deleteProcess, step: 2})} className="flex-1 p-3 bg-emerald-50 text-emerald-700 font-bold rounded-xl border border-emerald-200 hover:bg-emerald-100">Sí</button><button onClick={() => setDeleteProcess({...deleteProcess, step: 3, refundAmount: 0})} className="flex-1 p-3 bg-rose-50 text-rose-700 font-bold rounded-xl border border-rose-200 hover:bg-rose-100">No</button></div></div>)}
            {deleteProcess.step === 2 && (<div className="space-y-4"><label className="block text-sm font-bold text-slate-700">¿Cuánto te devolvieron?</label><input type="number" max={deleteProcess.item.pagado} value={deleteProcess.refundAmount} onChange={e=>setDeleteProcess({...deleteProcess, refundAmount: e.target.value})} className="w-full p-3 border-2 border-indigo-200 rounded-xl text-lg font-bold outline-none" autoFocus /><button onClick={() => {if (Number(deleteProcess.refundAmount) >= deleteProcess.item.pagado) executeDelete(deleteProcess.item, deleteProcess.refundAmount, false); else setDeleteProcess({...deleteProcess, step: 3});}} className="w-full p-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Continuar</button></div>)}
            {deleteProcess.step === 3 && (<div className="space-y-4"><p className="text-slate-600 text-sm">Se perdieron <b>{formatMoney(deleteProcess.item.pagado - Number(deleteProcess.refundAmount))}</b>.</p><p className="text-slate-800 font-bold text-sm">¿Mantener esta pérdida en el historial de gastos?</p><div className="flex space-x-3 pt-2"><button onClick={() => executeDelete(deleteProcess.item, deleteProcess.refundAmount, true)} className="flex-1 p-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl text-xs hover:bg-indigo-100">Sí, registrar pérdida</button><button onClick={() => executeDelete(deleteProcess.item, deleteProcess.refundAmount, false)} className="flex-1 p-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200">No, borrar todo</button></div></div>)}
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// --- COMPONENTE: PROVEEDORES (Fase 4) ---
// ==========================================
const ProveedoresView = ({ proveedores, setProveedores, gastos, setGastos, addNotification }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProvId, setEditingProvId] = useState(null); 
  const [deleteProvConfirm, setDeleteProvConfirm] = useState(null); 
  
  const [hireProcess, setHireProcess] = useState(null);
  const [viewContract, setViewContract] = useState(null);
  const [viewGallery, setViewGallery] = useState(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
  const [cancelProvModal, setCancelProvModal] = useState(null); 
  const [infoModal, setInfoModal] = useState(null);

  // Estados para el buscador y global
  const [searchTerm, setSearchTerm] = useState('');
  const [globalData, setGlobalData] = useState(mockGlobalProviders);
  const [userLocation, setUserLocation] = useState(null);
  const [isFromGlobal, setIsFromGlobal] = useState(false);

  // 🔴 NUEVOS ESTADOS PARA EL MOTOR PDF
  const [exportViewOpen, setExportViewOpen] = useState(false);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);

  const [formData, setFormData] = useState({ 
    nombre: '', facebook: '', categoria: 'Otros', servicio: '', costo: '', 
    status: 'Cotizado', telefono: '', email: '', notas: '', banco: '', clabe: '', titular: '', rating: 0, galeria: 0 
  });

  const categorias = ['Lugar', 'Música', 'Decoración', 'Recuerdos', 'Comida/Bebida', 'Ropa/Maquillaje', 'Papelería', 'Otros'];
  const statusColors = { 'Cotizado':'bg-slate-100 text-slate-600', 'Negociando':'bg-amber-100 text-amber-700', 'Contratado':'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500', 'Descartado':'bg-rose-100 text-rose-700 opacity-70' };
  const safeProveedores = proveedores || [];

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(function(position) {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      });
    }
  }, []);

  const openNewProviderForm = (provName = '') => {
    setFormData({ nombre: provName, facebook: '', categoria: 'Otros', servicio: '', costo: '', status: 'Cotizado', telefono: '', email: '', notas: '', banco: '', clabe: '', titular: '', rating: 0, galeria: 0 });
    setEditingProvId(null);
    setIsFromGlobal(false);
    setIsFormOpen(true);
  };

  const openEditProvider = (prov) => {
    setFormData({
      nombre: prov.nombre || '', facebook: prov.facebook || '', categoria: prov.categoria || 'Otros',
      servicio: prov.servicio || '', costo: prov.costo || '', status: prov.status || 'Cotizado',
      telefono: prov.telefono || '', email: prov.email || '', notas: prov.notas || '',
      banco: prov.banco || '', clabe: prov.clabe || '', titular: prov.titular || '', rating: prov.rating || 0, galeria: prov.galeria || 0
    });
    setEditingProvId(prov.id);
    setIsFromGlobal(false); 
    setIsFormOpen(true);
  };

  const selectGlobalProvider = (prov) => {
    setFormData({
      nombre: prov.nombre, facebook: prov.facebook || '', categoria: prov.categoria, servicio: prov.servicio, costo: prov.costoPromedio, status: 'Cotizado', telefono: prov.telefono || '', email: '', notas: '', banco: '', clabe: '', titular: '', rating: 0, galeria: 0
    });
    setEditingProvId(null);
    setIsFromGlobal(true);
    setIsFormOpen(true);
  };

  const handleSaveProveedor = async (e) => {
      e.preventDefault();
      if (formData.facebook && !formData.facebook.includes('facebook.com') && !formData.facebook.includes('instagram.com')) {
         if(addNotification) addNotification('Enlace Inválido', 'Por favor ingresa un link válido de Facebook o Instagram.', 'warning');
         return;
      }

      if (editingProvId) {
         const prov = safeProveedores.find(p => p.id === editingProvId);
         const updatedProv = { ...prov, ...formData, costo: Number(formData.costo) };
         await setDoc(doc(db, "eventos", ID_DEL_EVENTO, "proveedores", editingProvId.toString()), updatedProv);
         if(addNotification) addNotification('Proveedor Actualizado', 'Los datos se han guardado correctamente.', 'success');
      } else {
         const nuevoId = Date.now().toString();
         const nuevoProv = { id: nuevoId, ...formData, costo: Number(formData.costo), contratado: false, gastoId: null, contrato: null };
         await setDoc(doc(db, "eventos", ID_DEL_EVENTO, "proveedores", nuevoId), nuevoProv);
           
         if (!isFromGlobal && formData.facebook && !globalData.find(p => p.facebook === formData.facebook)) {
             setGlobalData([...globalData, {
                id: `prov_new_${Date.now()}`, nombre: formData.nombre, facebook: formData.facebook, categoria: formData.categoria, servicio: formData.servicio, costoPromedio: Number(formData.costo), lat: userLocation ? userLocation.lat : 19.4326, lng: userLocation ? userLocation.lng : -99.1332, ratingPromedio: 0, telefono: formData.telefono
             }]);
         }
         if(addNotification) addNotification('Proveedor Guardado', 'El proveedor ha sido registrado exitosamente.', 'success');
      }
      setIsFormOpen(false);
      setEditingProvId(null);
      setSearchTerm('');
  };

  const executeDeleteProvider = async () => {
    if (deleteProvConfirm) {
       await deleteDoc(doc(db, "eventos", ID_DEL_EVENTO, "proveedores", deleteProvConfirm.id.toString()));
       setDeleteProvConfirm(null);
       if(addNotification) addNotification('Eliminado', 'Proveedor borrado permanentemente.', 'success');
    }
  };

  const setRating = async (provId, newRating) => { 
    const prov = safeProveedores.find(p => p.id === provId);
    if(prov) await setDoc(doc(db, "eventos", ID_DEL_EVENTO, "proveedores", provId.toString()), { ...prov, rating: newRating });
  };

  const handleHireSubmit = async (e) => {
      e.preventDefault();
      const { prov, abono, file, fechaLimite } = hireProcess;
      const fileName = file ? file.name : null;
      const nuevoGastoId = Date.now().toString();
      const nuevoGasto = { id: nuevoGastoId, concepto: `${prov.servicio} (${prov.nombre})`, categoria: prov.categoria, estimado: prov.costo, pagado: Number(abono), proveedorId: prov.id, fechaLimite: fechaLimite, historial: abono > 0 ? [{ id: Date.now(), fecha: new Date().toISOString().split('T')[0], monto: Number(abono), metodo: 'Acuerdo Inicial', cuenta: prov.clabe || '' }] : [] };
      
    await setDoc(doc(db, "eventos", ID_DEL_EVENTO, "gastos", nuevoGastoId), nuevoGasto);
    await setDoc(doc(db, "eventos", ID_DEL_EVENTO, "proveedores", prov.id.toString()), { ...prov, status: 'Contratado', contratado: true, gastoId: nuevoGastoId, contrato: fileName });

      setHireProcess(null);
      if(addNotification) addNotification('¡Contratado!', `${prov.nombre} se vinculó al presupuesto automáticamente.`, 'success');
  };

  const confirmCancel = async () => {
      if(cancelProvModal) {
      await setDoc(doc(db, "eventos", ID_DEL_EVENTO, "proveedores", cancelProvModal.id.toString()), { ...cancelProvModal, status: 'Descartado', contratado: false, gastoId: null });
         setCancelProvModal(null);
         if(addNotification) addNotification('Cancelado', 'Proveedor movido a descartados.', 'warning');
      }
  };

  const proveedoresFiltrados = categoriaFiltro === 'Todas' ? safeProveedores : safeProveedores.filter(p => p.categoria === categoriaFiltro);
  
  const searchedProviders = globalData
    .filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.servicio.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (!userLocation) return b.ratingPromedio - a.ratingPromedio;
      const distA = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, a.lat, a.lng);
      const distB = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, b.lat, b.lng);
      return distA - distB;
    });

  const formatMoney = (amount) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);

  // 🔴 MOTOR PARA GUARDAR EL PDF NATIVO
  const triggerPdfDownload = async () => {
    setIsPreparingPrint(true);
    setTimeout(async () => {
      try {
        const { jsPDF } = await import('jspdf');
        const html2canvas = (await import('html2canvas')).default;
        const pages = document.querySelectorAll('.providers-pdf-page');
        const pdf = new jsPDF('p', 'mm', 'letter');

        for (let i = 0; i < pages.length; i++) {
           const canvas = await html2canvas(pages[i], { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
           const imgData = canvas.toDataURL('image/jpeg', 0.95);
           if (i > 0) pdf.addPage();
           pdf.addImage(imgData, 'JPEG', 0, 0, 215.9, 279.4);
        }
        
        const fileName = categoriaFiltro === 'Todas' ? 'Directorio-Proveedores.pdf' : `Comparativa-${categoriaFiltro}.pdf`;
        pdf.save(fileName);
        if(addNotification) addNotification('¡PDF Guardado!', 'Revisa tu carpeta de descargas.', 'success');
      } catch (error) {
        console.error(error);
        if(addNotification) addNotification('Error', 'Fallo al generar el PDF.', 'error');
      }
      setIsPreparingPrint(false);
      setExportViewOpen(false);
    }, 500); 
  };

  // 🔴 VISTA DE EXPORTACIÓN PDF (DIRECTORIO O COMPARATIVA)
  if (exportViewOpen) {
    const isComparativa = categoriaFiltro !== 'Todas';
    const title = isComparativa ? `Cuadro Comparativo: ${categoriaFiltro}` : 'Directorio de Proveedores';
    const subtitle = isComparativa ? 'Análisis de opciones y cotizaciones para tomar decisión' : 'Contactos operativos para el día del evento';

    // Paginación dinámica
    const PAGE_1_LIMIT = 8;
    const PAGE_N_LIMIT = 12;
    const firstPageItems = proveedoresFiltrados.slice(0, PAGE_1_LIMIT);
    const extraItems = proveedoresFiltrados.slice(PAGE_1_LIMIT);
    const extraPages = [];
    for(let i=0; i<extraItems.length; i+=PAGE_N_LIMIT) extraPages.push(extraItems.slice(i, i+PAGE_N_LIMIT));

    const renderTableRows = (rows) => (
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-slate-100 text-slate-800 border-b-2 border-slate-800">
            <th className="px-3 py-3 font-bold w-1/3">Proveedor / Servicio</th>
            {!isComparativa && <th className="px-3 py-3 font-bold">Contacto</th>}
            <th className="px-3 py-3 font-bold text-center">Estatus</th>
            {isComparativa && <th className="px-3 py-3 font-bold text-center">Rating</th>}
            <th className="px-3 py-3 font-bold text-right">Costo Estimado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((prov) => (
            <tr key={`print_${prov.id}`} className={prov.status === 'Descartado' ? 'opacity-50' : ''}>
              <td className="px-3 py-3 align-top">
                <p className="font-black text-slate-800 text-sm">{prov.nombre}</p>
                <p className="text-slate-500 mt-0.5">{prov.servicio}</p>
                {isComparativa && prov.notas && <p className="text-[9px] text-amber-700 bg-amber-50 p-1.5 rounded mt-1 border border-amber-100 italic">Nota: {prov.notas}</p>}
              </td>
              {!isComparativa && (
                <td className="px-3 py-3 align-top font-medium text-slate-700">
                  {prov.telefono ? <span className="block">Tel: {prov.telefono}</span> : null}
                  {prov.email ? <span className="block mt-0.5">Email: {prov.email}</span> : null}
                  {!prov.telefono && !prov.email ? <span className="text-slate-400 italic">Sin contacto</span> : null}
                </td>
              )}
              <td className="px-3 py-3 align-top text-center">
                <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider ${statusColors[prov.status]}`}>{prov.status}</span>
              </td>
              {isComparativa && (
                <td className="px-3 py-3 align-top text-center text-amber-500 font-black text-sm">
                  {prov.rating > 0 ? '★'.repeat(prov.rating) : <span className="text-slate-300">S/C</span>}
                </td>
              )}
              <td className="px-3 py-3 align-top text-right font-black text-indigo-700 text-sm">
                {formatMoney(prov.costo)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );

    return (
      <div className="fixed inset-0 z-[120] bg-slate-200 flex flex-col overflow-hidden">
        <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row justify-between items-center shadow-lg print:hidden z-10 shrink-0 gap-4">
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            <button onClick={() => setExportViewOpen(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={24}/></button>
            <div>
              <h3 className="font-bold text-sm">Previsualización de Documento</h3>
              <p className="text-[10px] text-slate-400">Paginado Automático Tamaño Carta</p>
            </div>
          </div>
          <button onClick={triggerPdfDownload} disabled={isPreparingPrint} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold flex items-center shadow-lg transition-all w-full sm:w-auto justify-center disabled:bg-slate-600">
            {isPreparingPrint ? <RefreshCw size={18} className="mr-2 animate-spin"/> : <Download size={18} className="mr-2"/>} 
            {isPreparingPrint ? 'Armando PDF...' : 'Descargar PDF'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-200 flex flex-col items-center py-8 gap-8 relative">
          <div className="providers-pdf-page bg-white shadow-2xl shrink-0" style={{ width: '215.9mm', height: '279.4mm', padding: '15mm', boxSizing: 'border-box', overflow: 'hidden', position: 'relative' }}>
            <header className="flex justify-between items-center border-b-2 border-slate-200 pb-4 mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-slate-800 rounded flex items-center justify-center text-white font-black text-xl mr-3">E</div>
                <div><h2 className="text-xl font-black text-slate-800 tracking-wider">EVENT MASTER</h2><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Plataforma Premium</p></div>
              </div>
              <div className="text-right">
                <h1 className="text-lg font-serif text-slate-900 italic">{title}</h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">{subtitle}</p>
              </div>
            </header>

            <main>{renderTableRows(firstPageItems)}</main>
            <div className="absolute bottom-6 right-6 text-[10px] font-bold text-slate-400">Página 1 de {1 + extraPages.length}</div>
          </div>

          {extraPages.map((pageRows, pIdx) => (
            <div key={`extrapage_${pIdx}`} className="providers-pdf-page bg-white shadow-2xl shrink-0" style={{ width: '215.9mm', height: '279.4mm', padding: '15mm', boxSizing: 'border-box', overflow: 'hidden', position: 'relative' }}>
               <header className="border-b-2 border-slate-800 pb-3 mb-6">
                 <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">{title} (Cont.)</h1>
               </header>
               <main>{renderTableRows(pageRows)}</main>
               <div className="absolute bottom-6 right-6 text-[10px] font-bold text-slate-400">Página {pIdx + 2} de {1 + extraPages.length}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 pb-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div><h2 className="text-2xl font-bold text-slate-800">Directorio VIP de Proveedores</h2><p className="text-slate-500 text-sm mt-1">Busca locales o gestiona tus contactos, evaluaciones y contratos.</p></div>
        <button onClick={() => openNewProviderForm('')} className="flex items-center px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-sm hover:bg-indigo-700 transition-colors w-full md:w-auto justify-center"><Plus size={18} className="mr-2" /> Nuevo Proveedor</button>
      </div>

      {/* BUSCADOR INTEGRADO */}
      <div className="relative z-10">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <SearchIcon size={20} className="text-slate-400" />
        </div>
        <input 
          type="text" 
          placeholder="Buscar proveedor por nombre o servicio..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
        />
      </div>

      {searchTerm.length > 0 ? (
        // RESULTADOS DE BÚSQUEDA GLOBAL
        <div className="flex-1 overflow-y-auto pb-10">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center text-sm"><SearchIcon size={16} className="mr-2 text-indigo-500"/> Resultados en la comunidad</h3>
          
          {searchedProviders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
               <Store size={48} className="mx-auto mb-4 text-slate-300"/>
               <h3 className="text-lg font-bold text-slate-800">Aún no dan de alta a este proveedor con nosotros</h3>
               <p className="text-slate-500 mt-2 mb-6 text-sm">¡Sé el primero en agregarlo y ayuda a futuros organizadores!</p>
               <button onClick={() => openNewProviderForm(searchTerm)} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-colors inline-flex items-center">
                 <Plus size={18} className="mr-2"/> Agregar "{searchTerm}"
               </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchedProviders.map(prov => {
                const distancia = userLocation ? getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, prov.lat, prov.lng).toFixed(1) : null;
                return (
                  <div key={prov.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col p-5 hover:border-indigo-300 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-[10px] font-black uppercase">{prov.categoria}</span>
                      {distancia && <span className="text-[10px] font-bold text-slate-500 flex items-center bg-slate-100 px-2 py-1 rounded-full"><MapPin size={10} className="mr-1 text-rose-500"/> A {distancia} km</span>}
                    </div>
                    <h3 className="font-bold text-xl text-slate-800 mb-1">{prov.nombre}</h3>
                    <p className="text-slate-500 text-sm mb-4 line-clamp-2">{prov.servicio}</p>
                    
                    <div className="flex items-center justify-between mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex items-center">
                        <Star size={14} fill="#f59e0b" className="text-amber-500 mr-1"/>
                        <span className="font-bold text-slate-700 text-sm">{prov.ratingPromedio}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-500">Costo: {formatMoney(prov.costoPromedio)}</span>
                    </div>

                    <div className="mt-auto border-t border-slate-100 pt-4 flex gap-2">
                      <button onClick={() => { if(prov.telefono) window.open(`https://wa.me/${prov.telefono.replace(/\D/g,'')}?text=Hola,%20te%20encontré%20en%20EventMaster`, '_blank'); }} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors" title="Contactar por WhatsApp">
                        <MessageCircle size={20} />
                      </button>
                      <button onClick={() => selectGlobalProvider(prov)} className="flex-1 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 shadow-md flex items-center justify-center transition-colors">
                        Cotizar para mi evento
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        // VISTA ORIGINAL: MIS PROVEEDORES
        <>
          <div className="flex gap-2">
            <select value={categoriaFiltro} onChange={e=>setCategoriaFiltro(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-xl bg-white text-sm font-bold text-slate-700 outline-none shadow-sm"><option value="Todas">Todas las áreas</option>{categorias.map(c => <option key={c} value={c}>Giro: {c}</option>)}</select>
            {/* 🔴 NUEVO BOTÓN DE DESCARGA PDF */}
            <button onClick={() => { if(proveedoresFiltrados.length === 0) { if(addNotification) addNotification('Directorio Vacío', 'No hay proveedores para exportar.', 'warning'); return; } setExportViewOpen(true); }} className="flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 shadow-sm transition-colors">
              <FileDown size={16} className="mr-2 text-indigo-600"/> {categoriaFiltro === 'Todas' ? 'Directorio PDF' : 'Comparativa PDF'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-10">
            {proveedoresFiltrados.map(prov => (
              <div key={prov.id} className={`group bg-white p-5 rounded-2xl border shadow-sm flex flex-col relative overflow-hidden transition-all ${prov.status === 'Descartado' ? 'opacity-60 bg-slate-50' : 'hover:border-indigo-300'}`}>
                
                <div className="absolute top-3 right-3 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                   <button onClick={(e) => { e.stopPropagation(); openEditProvider(prov); }} className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-lg shadow-sm transition-colors" title="Editar Proveedor"><Edit2 size={14}/></button>
                   <button onClick={(e) => { e.stopPropagation(); setDeleteProvConfirm(prov); }} className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 rounded-lg shadow-sm transition-colors" title="Eliminar Proveedor"><Trash2 size={14}/></button>
                </div>

                <div className="flex justify-between items-start mb-2 pr-16">
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">{prov.categoria}</span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusColors[prov.status]}`}>{prov.status}</span>
                </div>
                
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-lg text-slate-800 leading-tight pr-2">{prov.nombre}</h3>
                  <div className="flex space-x-0.5 mt-1 shrink-0">
                    {[1,2,3,4,5].map(star => (
                      <button key={star} onClick={()=>setRating(prov.id, star)} className={`transition-colors ${prov.rating >= star ? 'text-amber-400' : 'text-slate-200 hover:text-amber-200'}`}>
                        <Star size={14} fill={prov.rating >= star ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>
                
                <p className="text-slate-600 text-sm mb-4 font-medium">{prov.servicio}</p>
                
                <div className="flex space-x-3 mb-4">
                  {prov.telefono && (
                    <>
                      <a href={`tel:${prov.telefono}`} className="p-2.5 bg-slate-100 text-slate-600 rounded-full hover:bg-indigo-100 hover:text-indigo-600 transition-colors"><Phone size={16} /></a>
                      <a href={`https://wa.me/${prov.telefono.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="p-2.5 bg-slate-100 text-slate-600 rounded-full hover:bg-emerald-100 hover:text-emerald-600 transition-colors"><MessageCircle size={16} /></a>
                    </>
                  )}
                  {prov.email && <a href={`mailto:${prov.email}`} className="p-2.5 bg-slate-100 text-slate-600 rounded-full hover:bg-rose-100 hover:text-rose-600 transition-colors"><Mail size={16} /></a>}
                  <button onClick={() => setViewGallery(prov)} className="p-2.5 bg-slate-100 text-slate-600 rounded-full hover:bg-sky-100 hover:text-sky-600 transition-colors relative">
                    <ImageIcon size={16} />
                    {prov.galeria > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-sky-500 text-white rounded-full text-[8px] font-bold flex items-center justify-center border-2 border-white">{prov.galeria}</span>}
                  </button>
                </div>

                {(prov.banco || prov.clabe) && (
                  <div className="mb-4 bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs text-slate-600 flex flex-col space-y-1">
                    <div className="flex items-center font-bold text-slate-700 mb-1"><Building size={12} className="mr-1.5 text-indigo-500"/> Datos Bancarios</div>
                    {prov.titular && <div><span className="text-slate-400">Titular:</span> {prov.titular}</div>}
                    {prov.banco && <div><span className="text-slate-400">Banco:</span> {prov.banco}</div>}
                    {prov.clabe && <div><span className="text-slate-400">Cuenta/CLABE:</span> <span className="font-mono bg-slate-200 px-1 rounded">{prov.clabe}</span></div>}
                  </div>
                )}

                {prov.notas && <div className="mb-4 bg-amber-50 border border-amber-100 p-2.5 rounded-lg text-xs text-amber-800 italic flex items-start"><MessageSquare size={12} className="mr-1.5 mt-0.5 flex-shrink-0"/> {prov.notas}</div>}

                {prov.contrato && (
                  <div className="mb-4 flex items-center justify-between bg-indigo-50 border border-indigo-100 p-2 rounded-lg text-xs text-indigo-700 font-medium">
                    <span className="flex items-center truncate mr-2"><FileSignature size={14} className="mr-1.5 flex-shrink-0"/> {prov.contrato}</span>
                    <button onClick={() => setViewContract(prov.contrato)} className="p-1.5 bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200 transition-colors flex-shrink-0"><Eye size={14}/></button>
                  </div>
                )}

                <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="font-black text-xl text-slate-800">{formatMoney(prov.costo)}</span>
                  {prov.status === 'Contratado' ? (
                    <button onClick={() => setCancelProvModal(prov)} className="text-xs font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors">Cancelar</button>
                  ) : prov.status !== 'Descartado' ? (
                    <button onClick={() => setHireProcess({ prov, abono: '', file: null, fechaLimite: '' })} className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg shadow-sm transition-colors">Firmar y Contratar</button>
                  ) : null}
                </div>
              </div>
            ))}
            {proveedoresFiltrados.length === 0 && <div className="col-span-full text-center py-10 text-slate-400 font-medium">No hay cotizaciones registradas en esta categoría.</div>}
          </div>
        </>
      )}
      
      {/* MODAL: ALTA Y EDICIÓN DE PROVEEDOR */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-xl text-slate-800 flex items-center">
                 <Store size={20} className="mr-2 text-indigo-600"/> 
                 {editingProvId ? 'Editar Proveedor' : 'Alta de Proveedor'}
              </h3>
              <button onClick={() => setIsFormOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-800"/></button>
            </div>
            <form onSubmit={handleSaveProveedor} className="p-6 overflow-y-auto shrink">
              
              <div className="mb-6 bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex items-start text-indigo-800 text-xs">
                <CheckCircle size={16} className="mr-2 mt-0.5 flex-shrink-0"/>
                <p>Por seguridad de tu evento y para garantizar reseñas reales, vinculamos a cada proveedor con su página oficial. Así evitamos fraudes y duplicados.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="col-span-2">
                  <label className="block text-xs font-bold mb-1">Enlace de Facebook o Instagram</label>
                  <input type="url" readOnly={isFromGlobal} placeholder="Ej. https://facebook.com/..." value={formData.facebook} onChange={e=>setFormData({...formData, facebook: e.target.value})} className={`w-full p-2.5 border rounded-xl outline-none shadow-sm ${isFromGlobal ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-white border-slate-200 focus:border-indigo-500'}`} />
                  {isFromGlobal && <p className="text-[10px] text-indigo-500 mt-1">Bloqueado. Este dato proviene de la base global.</p>}
                </div>
                <div className="col-span-2 md:col-span-1"><label className="block text-xs font-bold mb-1">Empresa / Nombre</label><input type="text" required value={formData.nombre} onChange={e=>setFormData({...formData, nombre: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 bg-slate-50" /></div>
                <div className="col-span-2 md:col-span-1"><label className="block text-xs font-bold mb-1">Servicio Ofrecido</label><input type="text" required value={formData.servicio} onChange={e=>setFormData({...formData, servicio: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 bg-slate-50" placeholder="Ej. Banquete 100 pax"/></div>
                <div><label className="block text-xs font-bold mb-1">Categoría</label><select value={formData.categoria} onChange={e=>setFormData({...formData, categoria: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 bg-slate-50">{categorias.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><label className="block text-xs font-bold mb-1">Costo Estimado ($)</label><input type="number" required value={formData.costo} onChange={e=>setFormData({...formData, costo: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 bg-slate-50 text-indigo-700 font-bold" /></div>
              </div>

              <h4 className="text-xs font-black text-indigo-500 uppercase tracking-wider mb-4 border-b pb-2">2. Medios de Contacto</h4>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div><label className="block text-xs font-bold mb-1">Teléfono / WhatsApp</label><input type="text" value={formData.telefono} onChange={e=>setFormData({...formData, telefono: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" placeholder="10 dígitos"/></div>
                <div><label className="block text-xs font-bold mb-1">Correo Electrónico</label><input type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" placeholder="@"/></div>
              </div>

              <h4 className="text-xs font-black text-indigo-500 uppercase tracking-wider mb-4 border-b pb-2">3. Datos Bancarios (Opcional)</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div><label className="block text-xs font-bold mb-1">Banco</label><input type="text" value={formData.banco} onChange={e=>setFormData({...formData, banco: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" placeholder="Ej. BBVA"/></div>
                <div className="col-span-2 md:col-span-1"><label className="block text-xs font-bold mb-1">Cuenta / CLABE</label><input type="text" value={formData.clabe} onChange={e=>setFormData({...formData, clabe: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" placeholder="18 dígitos"/></div>
                <div className="col-span-2 md:col-span-1"><label className="block text-xs font-bold mb-1">Titular de la cuenta</label><input type="text" value={formData.titular} onChange={e=>setFormData({...formData, titular: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" /></div>
              </div>

              <div><label className="block text-xs font-bold mb-1">Notas Internas</label><textarea value={formData.notas} onChange={e=>setFormData({...formData, notas: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 resize-none h-16" placeholder="Detalles extra a recordar..."></textarea></div>

              <div className="mt-8 pt-4 border-t flex justify-end">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold mr-3 hover:bg-slate-200 transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md">
                   {editingProvId ? 'Guardar Cambios' : 'Guardar Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteProvConfirm && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden p-6 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={32} /></div>
            <h3 className="font-bold text-xl text-slate-800 mb-2">¿Eliminar Proveedor?</h3>
            <p className="text-slate-500 mb-6 text-sm">Estás a punto de borrar a <b>{deleteProvConfirm.nombre}</b>. Esta acción no se puede deshacer.</p>
            <div className="flex space-x-3">
              <button onClick={() => setDeleteProvConfirm(null)} className="flex-1 p-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
              <button onClick={executeDeleteProvider} className="flex-1 p-3 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-colors">Sí, Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {viewContract && (
        <div className="fixed inset-0 z-[110] bg-slate-900/90 backdrop-blur-md flex flex-col p-4 sm:p-10 animate-in fade-in duration-200">
          <div className="flex justify-between items-center w-full max-w-4xl mx-auto mb-4 text-white">
            <h3 className="font-bold text-lg flex items-center"><FileText size={20} className="mr-2"/> Documento Adjunto: {viewContract}</h3>
            <button onClick={() => setViewContract(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
          </div>
          <div className="flex-1 w-full max-w-4xl mx-auto bg-slate-200 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center relative">
            <div className="text-center">
              <FileSignature size={64} className="mx-auto text-slate-400 mb-4 opacity-50"/>
              <p className="text-slate-600 font-bold text-xl">Visor de Documentos Seguro</p>
              <button className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow hover:bg-indigo-700" onClick={()=>setViewContract(null)}>Cerrar Previsualización</button>
            </div>
          </div>
        </div>
      )}

      {viewGallery && (
        <div className="fixed inset-0 z-[110] bg-slate-900/90 backdrop-blur-md flex flex-col p-4 sm:p-10 animate-in fade-in duration-200">
          <div className="flex justify-between items-center w-full max-w-4xl mx-auto mb-4 text-white">
            <h3 className="font-bold text-lg flex items-center"><ImageIcon size={20} className="mr-2"/> Inspiración y Referencias: {viewGallery.nombre}</h3>
            <button onClick={() => setViewGallery(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
          </div>
          <div className="flex-1 w-full max-w-4xl mx-auto bg-slate-100 rounded-2xl overflow-hidden shadow-2xl p-6 flex flex-col items-center justify-center border-4 border-dashed border-slate-300">
            <UploadCloud size={64} className="text-indigo-300 mb-4"/>
            <h4 className="text-xl font-bold text-slate-700 mb-2">Sube fotos de referencia</h4>
            <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow hover:bg-indigo-700 transition-colors flex items-center"><Camera size={18} className="mr-2"/> Seleccionar Archivos</button>
          </div>
        </div>
      )}

      {cancelProvModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden p-6 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32} /></div>
            <h3 className="font-bold text-xl text-slate-800 mb-2">¿Cancelar contrato?</h3>
            <p className="text-slate-500 mb-6 text-sm">Pasarás a <b>{cancelProvModal.nombre}</b> a descartado. Si había un pago vinculado, recuerda borrarlo desde Presupuesto.</p>
            <div className="flex space-x-3">
              <button onClick={() => setCancelProvModal(null)} className="flex-1 p-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Atrás</button>
              <button onClick={confirmCancel} className="flex-1 p-3 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-colors">Sí, Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {hireProcess && (
        <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-indigo-600 text-white text-center relative">
              <Building size={32} className="mx-auto mb-2 opacity-80"/><h3 className="font-bold text-xl">Contratar Proveedor</h3><p className="text-indigo-200 text-sm">{hireProcess.prov.nombre}</p>
              <button onClick={() => setHireProcess(null)} className="absolute top-4 right-4 text-white/50 hover:text-white"><X size={20}/></button>
            </div>
            <form onSubmit={handleHireSubmit} className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700 mb-2">Costo acordado: <b className="text-lg text-slate-900 ml-2">{formatMoney(hireProcess.prov.costo)}</b></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-2 text-slate-600">Anticipo Hoy ($)</label><input type="number" max={hireProcess.prov.costo} value={hireProcess.abono} onChange={e=>setHireProcess({...hireProcess, abono: e.target.value})} placeholder="0.00" className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-bold text-slate-800" /></div>
                <div><label className="block text-xs font-bold mb-2 text-slate-600">Fecha Límite Pago</label><input type="date" required value={hireProcess.fechaLimite} onChange={e=>setHireProcess({...hireProcess, fechaLimite: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none" /></div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-2 text-slate-600">Respaldar Contrato (Archivo)</label>
                <div className="flex gap-2">
                  <label className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-indigo-300 transition-colors"><UploadCloud size={20} className="text-indigo-400 mb-1"/><span className="text-[10px] font-bold text-slate-500">Subir PDF</span><input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => setHireProcess({...hireProcess, file: e.target.files[0]})} /></label>
                </div>
              </div>
              <button type="submit" className="w-full p-3.5 bg-indigo-600 text-white rounded-xl font-bold mt-4 shadow-md hover:bg-indigo-700 transition-colors">Confirmar y Enviar a Presupuesto</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

// ==========================================
// --- COMPONENTE: CABECERA INTELIGENTE ---
// ==========================================
const Header = ({ setIsOpen, setActiveTab, data, globalSearch, setGlobalSearch, bellAlerts, setBellAlerts, markAsRead }) => {
  const [showResults, setShowResults] = useState(false);
  const [showBellMenu, setShowBellMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const headerRef = useRef(null); 

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setShowBellMenu(false);
        setShowProfileMenu(false);
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavigate = (tab) => { 
    if(tab) setActiveTab(tab); 
    setShowResults(false); 
    setGlobalSearch(''); 
    setShowBellMenu(false); 
    setShowProfileMenu(false); 
  };

  const isOverdue = (dateStr, deuda) => { if(!dateStr || deuda <= 0) return false; return new Date(dateStr) < new Date(); };
  const overdueGastos = (data?.gastos || []).filter(g => isOverdue(g.fechaLimite, g.estimado - g.pagado));
  
  const dynamicAlerts = [
    ...overdueGastos.map(g => ({ id: `g_${g.id}`, title: 'Pago Vencido', message: `Adeudo en: ${g.concepto}`, tab: 'presupuesto', type: 'danger', isDynamic: true, isRead: false })),
    ...(data?.guests || []).filter(g => g.extraRequested > 0).map(g => ({ id: `ext_${g.id}`, title: 'Pases Extra', message: `${g.name} solicita +${g.extraRequested} pases.`, tab: 'invitados', type: 'warning', isDynamic: true, isRead: false }))
  ];

  const allAlerts = [...dynamicAlerts, ...bellAlerts];
  const unreadCount = allAlerts.filter(a => !a.isRead).length;

  const guestsData = data?.guests || [];
  const countTotal = guestsData.reduce((sum, g) => sum + g.passes, 0);
  const countConfirmados = guestsData.filter(g => g.status === 'confirmado' || g.status === 'ingreso').reduce((sum, g) => sum + g.passes, 0);
  const countCancelados = guestsData.reduce((sum, g) => {
    const pasesOriginales = g.originalPasses || g.passes;
    const pasesConfirmados = g.subGuests?.length || 0;
    if (g.status === 'cancelado') return sum + pasesOriginales;
    if (g.status === 'confirmado' || g.status === 'ingreso') return sum + Math.max(0, pasesOriginales - pasesConfirmados);
    return sum;
  }, 0);
  const countIngresos = guestsData.reduce((sum, g) => sum + (g.entered || 0), 0);

  const searchResults = [];
  if(globalSearch.length > 1) {
     const term = globalSearch.toLowerCase();
     (data?.guests || []).forEach(g => { if(g.name.toLowerCase().includes(term)) searchResults.push({ id: g.id, text: g.name, type: 'Invitado', tab: 'invitados', icon: <Users size={14}/> }) });
     (data?.proveedores || []).forEach(p => { if(p.nombre.toLowerCase().includes(term) || p.servicio.toLowerCase().includes(term)) searchResults.push({ id: p.id, text: p.nombre, type: 'Proveedor', tab: 'proveedores', icon: <Store size={14}/> }) });
     (data?.gastos || []).forEach(g => { if(g.concepto.toLowerCase().includes(term)) searchResults.push({ id: g.id, text: g.concepto, type: 'Gasto', tab: 'presupuesto', icon: <Wallet size={14}/> }) });
  }

  // Lógica para los botones del menú de perfil
  const handleLogout = async () => {
    await signOut(auth); // Firebase cierra la sesión de forma segura
    window.location.reload(); 
  };

  const handleContactStaff = () => {
    window.open('https://wa.me/525512345678?text=Hola,%20necesito%20ayuda%20con%20mi%20panel%20EventMaster', '_blank');
    setShowProfileMenu(false);
  };

  return (
    <header ref={headerRef} className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 relative z-50 print:hidden">
      <div className="flex items-center flex-1">
        <button onClick={() => setIsOpen(true)} className="xl:hidden text-slate-500 hover:text-slate-700 mr-4 transition-colors"><Menu size={24} /></button>
        
        <div className="relative w-full max-w-md hidden sm:block">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Buscar en toda la plataforma..." value={globalSearch} onChange={(e) => {setGlobalSearch(e.target.value); setShowResults(true);}} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"/>
          {showResults && globalSearch.length > 1 && (
            <div className="absolute top-full left-0 mt-2 w-full bg-white shadow-xl rounded-2xl border border-slate-100 py-2 max-h-80 overflow-y-auto z-[100] animate-in fade-in">
              {searchResults.length === 0 ? <div className="p-4 text-center text-sm text-slate-400">No se encontraron resultados para "{globalSearch}"</div> : searchResults.map(res => (
                  <button key={`${res.type}_${res.id}`} onClick={() => handleNavigate(res.tab)} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center border-b border-slate-50 last:border-0 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center mr-3">{res.icon}</div>
                    <div><p className="font-bold text-slate-700 text-sm">{res.text}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{res.type}</p></div>
                  </button>
                ))
              }
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* INDICADORES RÁPIDOS */}
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 sm:p-1 mr-1 sm:mr-2 space-x-0.5 sm:space-x-1 shadow-sm">
          <div className="flex items-center px-1.5 sm:px-2 py-1 rounded-md text-slate-600" title="Total Pases"><Users size={14} className="opacity-70" /><span className="text-[10px] sm:text-xs font-bold ml-1">{countTotal}</span></div>
          <div className="flex items-center px-1.5 sm:px-2 py-1 rounded-md text-amber-600 bg-amber-50" title="Confirmaron"><CheckCircle size={14} className="opacity-80" /><span className="text-[10px] sm:text-xs font-bold ml-1">{countConfirmados}</span></div>
          <div className="flex items-center px-1.5 sm:px-2 py-1 rounded-md text-rose-600 bg-rose-50" title="Cancelaron"><X size={14} className="opacity-80" /><span className="text-[10px] sm:text-xs font-bold ml-1">{countCancelados}</span></div>
          <div className="flex items-center px-1.5 sm:px-2 py-1 rounded-md text-emerald-600 bg-emerald-50" title="Ya Ingresaron"><Scan size={14} className="opacity-80" /><span className="text-[10px] sm:text-xs font-bold ml-1">{countIngresos}</span></div>
        </div>

        {/* CAMPANITA DE NOTIFICACIONES */}
        <div className="relative">
          <button onClick={() => {setShowBellMenu(!showBellMenu); setShowProfileMenu(false); setShowResults(false);}} className="relative p-2 text-slate-500 hover:text-indigo-600 transition-colors rounded-full hover:bg-indigo-50">
            <Bell size={20} />
            {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 border-2 border-white rounded-full text-[9px] font-bold text-white flex items-center justify-center animate-in zoom-in">{unreadCount}</span>}
          </button>
          
          {showBellMenu && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white shadow-2xl rounded-2xl border border-slate-100 overflow-hidden z-[100] animate-in slide-in-from-top-2">
              <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                <h4 className="font-bold text-slate-800">Centro de Atención</h4>
                {bellAlerts.length > 0 && <button onClick={(e) => { e.stopPropagation(); setBellAlerts([]); }} className="text-[10px] text-slate-400 hover:text-indigo-600 font-bold">Limpiar historial</button>}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {allAlerts.length === 0 ? (
                  <div className="p-8 text-center text-slate-400"><CheckCircle size={32} className="mx-auto mb-2 text-emerald-300"/> ¡Todo al día! No tienes notificaciones.</div>
                ) : (
                  allAlerts.map(alert => (
                    <div 
                      key={alert.id} 
                      className={`w-full text-left px-4 py-3 flex items-start transition-colors group cursor-pointer border-b border-slate-100
                        ${alert.isRead ? 'bg-white opacity-70 hover:bg-slate-50' : 'bg-slate-100 hover:bg-slate-200'} 
                      `} 
                      onClick={(e) => { 
                        e.stopPropagation();
                        if(markAsRead && !alert.isDynamic) markAsRead(alert.id); 
                        if(alert.tab) {
                          handleNavigate(alert.tab); 
                        } else {
                          setShowBellMenu(false);
                        }
                      }}
                    >
                      <div className={`mt-0.5 mr-3 ${alert.type === 'success' ? 'text-emerald-500' : alert.type === 'danger' ? 'text-rose-500' : alert.type === 'warning' ? 'text-amber-500' : 'text-indigo-500'}`}>
                        {alert.type === 'success' ? <CheckCircle size={16}/> : alert.type === 'warning' || alert.type === 'danger' ? <AlertCircle size={16}/> : <Bell size={16}/>}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm leading-tight ${alert.isRead ? 'font-medium text-slate-600' : 'font-bold text-slate-800'}`}>{alert.title}</p>
                        <p className={`text-[10px] mt-1 leading-snug ${alert.isRead ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>{alert.message}</p>
                      </div>
                      {!alert.isDynamic && (
                        <button onClick={(e) => { e.stopPropagation(); setBellAlerts(prev => prev.filter(a => a.id !== alert.id)); }} className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity ml-2">
                          <X size={14}/>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 🔴 BOTÓN DE PERFIL INVERTIDO (TEXTO A LA IZQ, ICONO A LA DER) */}
        <div className="relative">
          <button 
            onClick={() => {setShowProfileMenu(!showProfileMenu); setShowBellMenu(false); setShowResults(false);}} 
            className="flex items-center space-x-2 sm:space-x-3 hover:bg-slate-50 p-1 sm:p-1.5 rounded-xl transition-colors text-right border border-transparent hover:border-slate-200"
          >
            <div className="hidden sm:block pl-1">
              <p className="text-xs font-bold text-slate-800 leading-tight">Boda Ana & Luis</p>
              <p className="text-[9px] text-slate-500 font-medium">15 de Nov, 2026</p>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm text-sm shrink-0">
              B
            </div>
          </button>
          
          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white shadow-2xl rounded-2xl border border-slate-100 overflow-hidden z-[100] animate-in slide-in-from-top-2">
              <div className="p-4 border-b border-slate-100 bg-slate-50 sm:hidden">
                <p className="font-bold text-slate-800 text-sm">Boda Ana & Luis</p>
                <p className="text-[10px] text-slate-500 truncate">15 de Nov, 2026</p>
              </div>
              <div className="p-2">
                <button onClick={() => handleNavigate('invitacion')} className="w-full text-left px-3 py-2.5 text-sm text-slate-600 font-medium hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors flex items-center"><ExternalLink size={16} className="mr-2.5"/> Ver Invitación App</button>
                <button onClick={handleContactStaff} className="w-full text-left px-3 py-2.5 text-sm text-slate-600 font-medium hover:bg-slate-50 hover:text-emerald-600 rounded-lg transition-colors flex items-center"><MessageCircle size={16} className="mr-2.5"/> Contactar Staff</button>
              </div>
              <div className="p-2 border-t border-slate-100">
                <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 text-sm text-rose-500 font-bold hover:bg-rose-50 rounded-lg transition-colors flex items-center"><LogOut size={16} className="mr-2.5"/> Cerrar Sesión</button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

// ==========================================
// --- COMPONENTE: GALERÍA EN VIVO (ADMIN + CONFIGURACIÓN) ---
// ==========================================
const GaleriaView = ({ photos, addNotification }) => {
  const [showQR, setShowQR] = useState(false); 
  const [showProyectorModal, setShowProyectorModal] = useState(false); 
  const [djPhone, setDjPhone] = useState(''); 
  const [config, setConfig] = useState({ modoPublico: true, hashtag: '#MiEvento', moderacion: false, marcoUrl: '' });
  const [viewingPost, setViewingPost] = useState(null);
  const [isZipping, setIsZipping] = useState(false);

  const fileInputRef = useRef(null);
  const cloudName = "duy0mcqsh"; 
  const uploadPreset = "ml_default"; 

  // 🔴 CORRECCIÓN: Enlaces con RUTAS LIMPIAS BAULIA
  const getCleanBaseUrl = () => window.location.hostname.includes('localhost') ? window.location.origin : 'https://baulia.com';
  
  const guestLink = `${getCleanBaseUrl()}/?modo=camara&e=${ID_DEL_EVENTO}`;
  const proyectorLink = `${getCleanBaseUrl()}/?modo=proyector&e=${ID_DEL_EVENTO}`; 
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(guestLink)}&margin=10`;

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "eventos", ID_DEL_EVENTO, "configuracion", "galeria"), (docSnap) => {
      if (docSnap.exists()) setConfig(docSnap.data());
    });
    return () => unsub();
  }, []);

  const updateConfig = async (key, value) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    await setDoc(doc(db, "eventos", ID_DEL_EVENTO, "configuracion", "galeria"), newConfig, { merge: true });
    if(addNotification) addNotification('Ajuste Guardado', 'La configuración se actualizó en vivo.', 'success');
  };

  const handleFrameUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if(addNotification) addNotification('Subiendo Marco...', 'Procesando archivo PNG transparente.', 'info');
    try {
      const formData = new FormData(); formData.append("file", file); formData.append("upload_preset", uploadPreset);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.secure_url) {
        updateConfig('marcoUrl', data.secure_url);
        if(addNotification) addNotification('Marco Aplicado', 'El diseño ahora se mostrará en todas las fotos.', 'success');
      }
    } catch (err) { alert("Error al subir el marco."); }
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "eventos", ID_DEL_EVENTO, "fotos", id));
    setViewingPost(null); 
  };

  const toggleApproval = async (foto, approved) => {
    await setDoc(doc(db, "eventos", ID_DEL_EVENTO, "fotos", foto.id), { ...foto, status: approved ? 'approved' : 'rejected' });
    if(addNotification) addNotification(approved ? 'Foto Aprobada' : 'Foto Rechazada', approved ? 'Ya se ve en el proyector' : 'Oculta para todos', 'success');
  };

  const forceDownloadQR = async () => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'QR_Mesa_Galeria.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      window.open(qrUrl, '_blank'); 
    }
  };

  const downloadAllPhotos = () => {
    if (photos.length === 0) return;
    setIsZipping(true);
    if(addNotification) addNotification('Empaquetando Fotos', 'Esto puede tardar unos segundos...', 'info');

    const executeZip = async () => {
      const zip = new window.JSZip();
      const folder = zip.folder("Album_Evento");
      let count = 0;

      for (let f of photos) {
        const urls = f.urls || [f.url];
        for (let i = 0; i < urls.length; i++) {
          try {
            const response = await fetch(urls[i]);
            const blob = await response.blob();
            folder.file(`${f.autor}_${f.id}_${i}.jpg`, blob);
            count++;
          } catch(e) {}
        }
      }
      
      zip.generateAsync({type:"blob"}).then(function(content) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = "Album_Evento.zip";
        link.click();
        setIsZipping(false);
        if(addNotification) addNotification('¡Descarga Lista!', `Se descargaron ${count} fotos.`, 'success');
      });
    };

    if (!window.JSZip) {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
      document.head.appendChild(script);
      script.onload = executeZip;
    } else { executeZip(); }
  };

  const sendProyectorWhatsApp = () => {
     const phone = djPhone.replace(/\D/g,'');
     if (!phone) { alert('Ingresa un número válido'); return; }
     const msg = `¡Hola! Aquí tienes el enlace de acceso directo para las Pantallas Gigantes (Proyector):\n\n${proyectorLink}`;
     window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const renderTextWithHashtags = (text) => {
    if (!text) return null;
    return text.split(/(#[a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ]+)/g).map((part, i) => {
      if (part.startsWith('#')) return <span key={i} className="font-bold text-indigo-400">{part}</span>;
      return part;
    });
  };

  return (
    <div className="h-full flex flex-col space-y-4 pb-6 relative">
      
      <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 w-full xl:w-auto shrink-0">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><ImageIcon size={20}/></div>
          <h2 className="text-lg font-black text-slate-800 tracking-tight">Muro Social</h2>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5 w-full xl:w-auto">
          <div className="flex items-center bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
             <ShieldCheck size={14} className={`mr-1.5 ${config.moderacion ? 'text-amber-500' : 'text-slate-400'}`}/>
             <span className="text-[10px] font-bold text-slate-600 mr-2">Moderación</span>
             <button onClick={() => updateConfig('moderacion', !config.moderacion)} className={`relative w-8 h-4 rounded-full transition-colors ${config.moderacion ? 'bg-amber-500' : 'bg-slate-300'}`}>
                <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${config.moderacion ? 'translate-x-4' : 'translate-x-0'}`}></div>
             </button>
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button onClick={() => updateConfig('modoPublico', true)} className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md transition-all ${config.modoPublico ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>Público</button>
            <button onClick={() => updateConfig('modoPublico', false)} className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md transition-all ${!config.modoPublico ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>Privado</button>
          </div>

          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus-within:border-indigo-500 transition-colors w-24 shrink-0">
            <span className="text-slate-400 font-bold mr-1 text-xs">#</span>
            <input type="text" value={config.hashtag?.replace('#', '') || ''} onChange={(e) => setConfig({...config, hashtag: '#' + e.target.value.replace(/\s+/g, '')})} onBlur={(e) => updateConfig('hashtag', config.hashtag)} placeholder="Boda" className="bg-transparent text-slate-800 font-bold text-xs outline-none w-full placeholder:text-slate-400"/>
          </div>

          <input type="file" accept="image/png" ref={fileInputRef} onChange={handleFrameUpload} className="hidden" />
          <button onClick={() => fileInputRef.current.click()} className="flex items-center px-3 py-1.5 bg-sky-50 text-sky-600 rounded-lg text-xs font-bold hover:bg-sky-100 transition-all shadow-sm">
            <ImageIcon size={14} className="mr-1.5" /> Marco PNG
          </button>

          <button onClick={downloadAllPhotos} disabled={isZipping} className={`flex items-center px-3 py-1.5 text-white rounded-lg text-xs font-bold transition-all shadow-sm ${isZipping ? 'bg-slate-400' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
            {isZipping ? <RefreshCw size={14} className="mr-1.5 animate-spin"/> : <Download size={14} className="mr-1.5"/>} ZIP
          </button>

          <button onClick={() => setShowQR(true)} className="flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm"><QrCode size={14} className="mr-1.5" /> QR Mesas</button>
          <button onClick={() => setShowProyectorModal(true)} className="flex items-center px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 transition-all shadow-sm"><PlayCircle size={14} className="mr-1.5" /> Pantallas</button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 overflow-y-auto bg-slate-50/50 custom-scrollbar">
        {photos.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <ImageIcon size={64} className="mb-4 opacity-20" />
            <h3 className="text-xl font-bold text-slate-700">Aún no hay fotos</h3>
          </div>
        ) : (
          <div className="columns-2 md:columns-4 gap-4 pb-10">
            {photos.map((foto) => {
              const urls = foto.urls || [foto.url];
              const portada = urls[0]; 
              const isPending = config.moderacion && foto.status === 'pending';
              
              const likesCount = Array.isArray(foto.likes) ? foto.likes.length : (foto.likes || 0);
              const commentCount = (foto.comentarios || []).length;
              const isCarousel = urls.length > 1;

              return (
                <div 
                  key={foto.id} 
                  onClick={() => setViewingPost(foto)} 
                  style={{ WebkitColumnBreakInside: 'avoid', pageBreakInside: 'avoid', breakInside: 'avoid' }}
                  className={`group mb-4 w-full rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border cursor-pointer ${isPending ? 'border-amber-400 ring-2 ring-amber-200' : 'border-slate-200'}`}
                >
                  <div className="relative w-full aspect-[3/4] bg-slate-200">
                    <img src={portada} alt="Foto" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                    {config.marcoUrl && <img src={config.marcoUrl} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />}
                    
                    {isPending && (
                       <div className="absolute top-2 left-2 z-20 bg-amber-500 text-white text-[10px] font-black px-2 py-1 rounded-full flex items-center shadow-lg">
                          <AlertCircle size={12} className="mr-1"/> PENDIENTE
                       </div>
                    )}

                    {isCarousel && (
                      <div className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-lg backdrop-blur-sm z-10 shadow-md">
                        <Layers size={14} />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 z-20">
                      <div className="flex justify-end gap-2">
                        {isPending && (
                          <>
                             <button onClick={(e) => { e.stopPropagation(); toggleApproval(foto, true); }} className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full backdrop-blur-md shadow-md"><CheckCircle size={14} /></button>
                             <button onClick={(e) => { e.stopPropagation(); toggleApproval(foto, false); }} className="p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full backdrop-blur-md shadow-md"><X size={14} /></button>
                          </>
                        )}
                        {!isPending && (
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(foto.id); }} className="p-2 bg-white/20 hover:bg-rose-500 text-white rounded-full backdrop-blur-md transition-colors" title="Borrar Publicación">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      
                      <div className="mt-auto">
                        {foto.mensaje && <p className="text-white/90 text-xs mb-1.5 line-clamp-2 drop-shadow-md">{renderTextWithHashtags(foto.mensaje)}</p>}
                        <div className="flex justify-between items-end">
                          <div className="flex flex-col">
                             <p className="text-white font-bold text-sm drop-shadow-md">{foto.autor}</p>
                             <p className="text-white/70 text-[10px]">{foto.fecha}</p>
                          </div>
                          <div className="flex gap-2">
                            <span className="flex items-center text-white bg-white/20 px-2 py-1 rounded-full backdrop-blur-md text-[10px] font-bold">
                              <MessageCircle size={10} className="mr-1" /> {commentCount}
                            </span>
                            <span className="flex items-center text-white bg-rose-500/80 px-2 py-1 rounded-full backdrop-blur-md text-[10px] font-bold">
                              <Heart size={10} className="mr-1 fill-white" /> {likesCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {viewingPost && (
        <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-indigo-100 overflow-hidden mr-3"><img src={viewingPost.avatar || ''} className="w-full h-full object-cover"/></div>
                <div><h3 className="font-bold text-slate-800 text-sm">{viewingPost.autor}</h3></div>
              </div>
              <button onClick={() => setViewingPost(null)} className="p-2 bg-slate-200 rounded-full text-slate-600"><X size={16}/></button>
            </div>
            <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
              <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar bg-slate-900 relative">
                 {(viewingPost.urls || [viewingPost.url]).map((u, idx) => (
                   <div key={idx} className="w-full flex-shrink-0 snap-center relative">
                     <img src={u} className="w-full max-h-[60vh] object-contain mx-auto" />
                     {config.marcoUrl && <img src={config.marcoUrl} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />}
                   </div>
                 ))}
              </div>
              <div className="p-5 flex justify-between">
                <button onClick={() => handleDelete(viewingPost.id)} className="text-xs font-bold text-rose-500 bg-rose-50 px-4 py-2 rounded-xl">Borrar Todo</button>
                {config.moderacion && viewingPost.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => toggleApproval(viewingPost, false)} className="text-xs font-bold text-white bg-rose-500 px-4 py-2 rounded-xl shadow-md"><X size={14} className="inline mr-1"/> Rechazar</button>
                    <button onClick={() => toggleApproval(viewingPost, true)} className="text-xs font-bold text-white bg-emerald-500 px-4 py-2 rounded-xl shadow-md"><CheckCircle size={14} className="inline mr-1"/> Aprobar</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showProyectorModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 relative animate-in zoom-in-95">
             <button onClick={() => setShowProyectorModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-rose-500"><X size={20}/></button>
             <div className="w-16 h-16 bg-slate-100 text-slate-800 rounded-full flex items-center justify-center mx-auto mb-4"><PlayCircle size={32}/></div>
             <h3 className="font-black text-xl text-slate-800 mb-2 text-center">Modo Proyector</h3>
             <button onClick={() => {navigator.clipboard.writeText(proyectorLink); if(addNotification) addNotification('Copiado', 'Enlace copiado al portapapeles', 'success');}} className="w-full py-3 mb-6 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 flex items-center justify-center"><Link size={18} className="mr-2"/> Copiar enlace directo</button>
             <div className="border-t border-slate-200 pt-4">
                <label className="block text-xs font-bold mb-2 text-slate-600 text-center">Enviar por WhatsApp</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="Número a 10 dígitos..." value={djPhone} onChange={e=>setDjPhone(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl font-bold" />
                  <button onClick={sendProyectorWhatsApp} className="px-5 bg-emerald-500 text-white rounded-xl"><Send size={18}/></button>
                </div>
             </div>
          </div>
        </div>
      )}

      {showQR && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-8 text-center relative animate-in zoom-in-95">
            <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 bg-slate-100 p-2 rounded-full"><X size={20}/></button>
            <h3 className="font-black text-2xl text-slate-900 mb-2">Tu Código QR</h3>
            <div className="bg-white p-2 rounded-2xl border-4 border-slate-100 inline-block mb-8 shadow-sm">
              <img src={qrUrl} alt="QR Code" className="w-48 h-48 mx-auto mix-blend-multiply" />
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={forceDownloadQR} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white rounded-xl font-bold shadow-md"><Download size={18} className="inline mr-2"/> Descargar PNG</button>
              <button onClick={() => {navigator.clipboard.writeText(guestLink); if(addNotification) addNotification('Copiado', 'Link manual copiado al portapapeles', 'success');}} className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 flex items-center justify-center transition-colors"><Link size={18} className="mr-2"/> Copiar enlace manual</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// --- COMPONENTE: VISTA PÚBLICA DEL INVITADO (W/ CÁMARA CUADRADA TIPO SUPERMERCADO) ---
// ==========================================
const GuestCameraView = ({ eventId }) => {
  const [config, setConfig] = useState({ modoPublico: true, hashtag: '', moderacion: false, marcoUrl: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = (text, type = 'info') => {
    setToast({ text, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  };
  
  const [guestName, setGuestName] = useState(() => localStorage.getItem('eventmaster_guestName') || '');
  const [guestAvatar, setGuestAvatar] = useState(''); 
  const [guestCode, setGuestCode] = useState('');
  const [authGuest, setAuthGuest] = useState(null); 
  const [allGuests, setAllGuests] = useState([]); 

  const [feedFotos, setFeedFotos] = useState([]);
  
  const [postDraft, setPostDraft] = useState(null); 
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState(null);

  const retos = [
    "¡Selfie con alguien que no conocías! 📸",
    "El mejor paso de baile en la pista 💃",
    "Una foto brindando con tu mesa 🥂",
    "Atrapa un beso de los novios/festejados 💋",
    "¡Foto haciendo una cara graciosa! 🤪",
    "Fotografía el detalle más bonito del salón ✨",
    "Selfie con el invitado más prendido de la fiesta 🔥",
    "Una foto estilo paparazzi a alguien distraído 🕶️",
    "Foto grupal con TODOS los de tu mesa 🍽️",
    "Encuentra a alguien con tu mismo color de ropa y tómense foto 👗",
    "Captura el momento exacto de una carcajada 😂",
    "Selfie haciendo 'pico de pato' con la abuela o tía mayor 🦆",
    "Foto épica del DJ en plena acción 🎧",
    "Una foto romántica de una pareja invitada ❤️",
    "El postre o la comida antes de que la devoren 🍰",
    "Selfie tuya con el centro de mesa en la cabeza 👑",
    "¡Alguien tomando un shot! ¡Salud! 🥃",
    "Foto de unos zapatos increíbles o muy locos 👠",
    "Captura a los papás de los festejados muy orgullosos 🥰",
    "Haz un corazón con las manos junto a tu mejor amigo(a) 🫶",
    "Foto del bartender preparando una obra de arte 🍸",
    "Selfie en el espejo del baño (¡Un clásico!) 🪞",
    "Alguien con la corbata chueca o sin zapatos en la pista 👞",
    "Selfie imitando la pose de una estatua o foto del salón 🗽",
    "Captura el abrazo más tierno de la noche 🤗"
  ];
  
  const [activePostComments, setActivePostComments] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  
  const [socialActivity, setSocialActivity] = useState([]);
  const [showSocialBell, setShowSocialBell] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  const bellRef = useRef(null); 
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const cloudName = "duy0mcqsh"; 
  const uploadPreset = "ml_default"; 

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('eventmaster_theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return true;
    const hr = new Date().getHours();
    return hr >= 19 || hr < 6;
  });

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('eventmaster_theme', newTheme ? 'dark' : 'light');
    setShowMenu(false);
  };

  const tBgBase = isDarkMode ? 'bg-zinc-950' : 'bg-slate-50';
  const tBgCard = isDarkMode ? 'bg-zinc-900' : 'bg-white';
  const tBorder = isDarkMode ? 'border-zinc-800' : 'border-slate-200';
  const tTextMain = isDarkMode ? 'text-slate-100' : 'text-slate-900';
  const tTextSub = isDarkMode ? 'text-zinc-400' : 'text-slate-500';
  const tInputBg = isDarkMode ? 'bg-zinc-800 focus:bg-zinc-700' : 'bg-slate-50 focus:bg-white';

  const currentUserName = !config?.modoPublico ? (authGuest?.name || '') : (guestName || '').trim();

  const DiceIcon = ({ className, size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="4" ry="4"></rect>
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"></circle>
      <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor"></circle>
      <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor"></circle>
      <circle cx="8.5" cy="15.5" r="1.5" fill="currentColor"></circle>
      <circle cx="12" cy="12" r="1.5" fill="currentColor"></circle>
    </svg>
  );

  const allGuestsRef = useRef([]);
  useEffect(() => { allGuestsRef.current = allGuests; }, [allGuests]);
  
  const scannerRef = useRef(null);

  // 🔴 FUNCIÓN DE CERRAR SESIÓN BLINDADA
  const handleGuestLogout = () => {
    setAuthGuest(null);
    setGuestName('');
    setGuestAvatar('');
    localStorage.removeItem('eventmaster_authGuestId');
    localStorage.removeItem('eventmaster_guestName');
    localStorage.removeItem('eventmaster_currentEventId'); // Borramos el candado
    setShowMenu(false);
    // Limpiamos la URL para que no vuelva a iniciar sesión automáticamente
    window.history.replaceState({}, document.title, window.location.pathname + "?modo=camara&e=" + eventId);
  };

  const ejecutarLogin = async (codigoIngresado) => {
    const code = (codigoIngresado || '').trim().toLowerCase();
    if (!code) return;
    
    let foundUser = null;
    
    for (const g of allGuestsRef.current) {
      if (g.id && g.id.toLowerCase() === code) { foundUser = { id: g.id, name: g.name }; break; }
      if (g.subGuests && g.subGuests.length > 0) {
        const sub = g.subGuests.find(sg => (sg.id || '').toLowerCase() === code);
        if (sub) { foundUser = { id: sub.id, name: sub.name }; break; }
      }
    }

    if (!foundUser) {
       let parentId = code;
       if (code.startsWith('usr_')) {
          const parts = code.split('_');
          if (parts.length >= 3) parentId = parts[1]; 
       }
       try {
         const docSnap = await getDoc(doc(db, "eventos", eventId, "invitados", parentId));
         if (docSnap.exists()) {
           const gData = docSnap.data();
           if (docSnap.id.toLowerCase() === code) foundUser = { id: docSnap.id, name: gData.name };
           else if (gData.subGuests) {
             const sub = gData.subGuests.find(sg => (sg.id || '').toLowerCase() === code);
             if (sub) foundUser = { id: sub.id, name: sub.name };
           }
         }
       } catch(e) {}
    }

    if (foundUser) {
      setAuthGuest(foundUser);
      setGuestName(foundUser.name);
      setGuestAvatar(localStorage.getItem(`eventmaster_avatar_${foundUser.id}`) || '');
      localStorage.setItem('eventmaster_authGuestId', foundUser.id);
      localStorage.setItem('eventmaster_guestName', foundUser.name);
      localStorage.setItem('eventmaster_currentEventId', eventId); // 🔴 CANDADO DE EVENTO APLICADO
      window.history.replaceState({}, document.title, window.location.pathname + "?modo=camara&e=" + eventId);
    } else {
      showToast("Código no reconocido. Revisa tu pulsera.", "error");
      setTimeout(() => { if (!authGuest) startLoginScanner(); }, 2000);
    }
  };

  const startLoginScanner = () => {
    if (!window.Html5Qrcode) {
      setTimeout(startLoginScanner, 500);
      return;
    }
    setIsScanning(true);
    
    setTimeout(() => {
      try {
        const html5QrCode = new window.Html5Qrcode("qr-reader-login");
        scannerRef.current = html5QrCode;
        
        html5QrCode.start(
          { facingMode: "environment" },
          { 
             fps: 15, 
             aspectRatio: 1.0, 
             qrbox: function(width, height) { return { width: width * 0.95, height: height * 0.95 }; }
          },
          (decodedText) => {
             if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.pause();
             }
             
             let code = decodedText;
             try {
                const parsedUrl = new URL(decodedText);
                code = parsedUrl.searchParams.get('u') || parsedUrl.searchParams.get('usr') || parsedUrl.searchParams.get('uid') || parsedUrl.searchParams.get('invitado') || code;
             } catch(e) {}
             
             if (!code) {
                 const match = decodedText.match(/(?:u|usr|invitado)=([^&]+)/i);
                 if (match && match[1]) code = match[1];
                 else code = decodedText;
             }
             
             if (!code || code === 'null' || code === 'undefined') { 
                showToast("Código inválido", "error"); 
                if (scannerRef.current) scannerRef.current.resume();
                return; 
             }

             setGuestCode(code);
             
             if (scannerRef.current) {
                scannerRef.current.stop().then(() => {
                   scannerRef.current.clear();
                   setIsScanning(false);
                   ejecutarLogin(code); 
                }).catch(() => {
                   setIsScanning(false);
                   ejecutarLogin(code);
                });
             } else {
                setIsScanning(false);
                ejecutarLogin(code);
             }
          },
          (err) => {}
        ).catch(err => {
           setIsScanning(false);
           showToast("Debes Permitir el uso de la Cámara para acceder.", "error");
        });
      } catch(e) { setIsScanning(false); }
    }, 200);
  };

  useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = "viewport";
      document.head.appendChild(meta);
    }
    meta.content = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0";

    setGlobalEventId(eventId);
    if (!window.Html5QrcodeScanner && !document.getElementById('qr-script')) {
      const script = document.createElement('script');
      script.id = 'qr-script';
      script.src = "https://unpkg.com/html5-qrcode";
      script.async = true;
      document.body.appendChild(script);
    }

    const unsubConfig = onSnapshot(doc(db, "eventos", eventId, "configuracion", "galeria"), (docSnap) => {
      if (docSnap.exists()) setConfig(docSnap.data());
    });

    const unsubFotos = onSnapshot(collection(db, "eventos", eventId, "fotos"), (snap) => {
      const fotosOrdenadas = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => b.id - a.id);
      setFeedFotos(fotosOrdenadas);
      if (activePostComments) {
        const updatedPost = fotosOrdenadas.find(f => f.id === activePostComments.id);
        if (updatedPost) setActivePostComments(updatedPost);
      }
    });

    const unsubGuests = onSnapshot(collection(db, "eventos", eventId, "invitados"), (snap) => {
      setAllGuests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubActivity = onSnapshot(collection(db, "eventos", eventId, "actividad_social"), (snap) => {
      setSocialActivity(snap.docs.map(doc => doc.data()).sort((a, b) => b.timestamp - a.timestamp));
    });

    // 🔴 REVISIÓN DEL CANDADO DE EVENTO
    const savedGuestId = localStorage.getItem('eventmaster_authGuestId');
    const savedEventId = localStorage.getItem('eventmaster_currentEventId'); 

    if (savedGuestId && savedEventId === eventId) {
      // Si el ID guardado pertenece A ESTE EVENTO, lo dejamos entrar
      setAuthGuest({ id: savedGuestId, name: localStorage.getItem('eventmaster_guestName') });
      setGuestAvatar(localStorage.getItem(`eventmaster_avatar_${savedGuestId}`) || '');
    } else if (savedGuestId && savedEventId !== eventId) {
      // 🔴 ¡ALERTA! El invitado escaneó otro evento diferente. Borramos su sesión vieja.
      localStorage.removeItem('eventmaster_authGuestId');
      localStorage.removeItem('eventmaster_guestName');
      localStorage.removeItem('eventmaster_currentEventId');
      setAuthGuest(null);
      setGuestName('');
      setGuestAvatar('');
    }

    return () => { unsubConfig(); unsubFotos(); unsubGuests(); unsubActivity(); };
  }, [activePostComments, eventId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) setShowSocialBell(false);
      if (menuRef.current && !menuRef.current.contains(event.target)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    let uid = urlParams.get('u') || urlParams.get('usr') || urlParams.get('invitado'); 
    if (uid && allGuests.length > 0 && !authGuest) ejecutarLogin(uid);
  }, [allGuests]);

  useEffect(() => {
     let timer;
     if (!config?.modoPublico && !authGuest) {
         timer = setTimeout(() => {
             startLoginScanner();
         }, 1000); 
     }
     return () => {
         if (timer) clearTimeout(timer);
         if (scannerRef.current && scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(e=>e);
         }
     }
  }, [config, authGuest]);

  const notifySocial = async (tipo, targetUser, fotoId, textoExtra = '', fotoUrl = '') => {
    if (!targetUser || !currentUserName || targetUser === currentUserName) return; 
    const id = Date.now().toString() + Math.random().toString(36).substring(2);
    await setDoc(doc(db, "eventos", eventId, "actividad_social", id), {
      id, tipo, actorName: currentUserName, actorAvatar: guestAvatar, targetUser, fotoId: String(fotoId), textoExtra, fotoUrl, timestamp: Date.now()
    });
  };

  const handleAvatarSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsAvatarUploading(true);
    setShowMenu(false);
    try {
      const formData = new FormData(); formData.append("file", file); formData.append("upload_preset", uploadPreset);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.secure_url) {
        const urlParts = data.secure_url.split('/upload/');
        const avatarUrl = `${urlParts[0]}/upload/c_thumb,g_face,h_150,w_150,f_auto,q_auto/${urlParts[1]}`;
        
        setGuestAvatar(avatarUrl);
        const userId = authGuest ? authGuest.id : 'public';
        localStorage.setItem(`eventmaster_avatar_${userId}`, avatarUrl);

        if (currentUserName) {
          const promesasUpdate = feedFotos.map(foto => {
            let changesMade = false;
            let updatedFoto = { ...foto };
            if (updatedFoto.autor === currentUserName && updatedFoto.avatar !== avatarUrl) { updatedFoto.avatar = avatarUrl; changesMade = true; }
            if (updatedFoto.comentarios) {
              updatedFoto.comentarios = updatedFoto.comentarios.map(c => {
                let newC = { ...c };
                if (newC.autor === currentUserName && newC.avatar !== avatarUrl) { newC.avatar = avatarUrl; changesMade = true; }
                if (newC.replies) {
                  newC.replies = newC.replies.map(r => {
                    if (r.autor === currentUserName && r.avatar !== avatarUrl) { changesMade = true; return { ...r, avatar: avatarUrl }; }
                    return r;
                  });
                }
                return newC;
              });
            }
            if (changesMade) return setDoc(doc(db, "eventos", eventId, "fotos", foto.id), updatedFoto);
            return Promise.resolve();
          });
          await Promise.all(promesasUpdate);
        }
      }
    } catch (error) { 
      showToast("Error al subir foto de perfil.", "error"); 
    } finally { 
      setIsAvatarUploading(false); 
    }
  };

  const generarReto = () => {
    const retoAzar = retos[Math.floor(Math.random() * retos.length)];
    setActiveChallenge(retoAzar);
  };

  const openChallengeModal = () => {
    generarReto();
    setShowChallengeModal(true);
  };

  const initiatePost = (e) => {
    const files = Array.from(e.target.files).slice(0, 10);
    if (files.length === 0) return;
    const previewUrls = files.map(f => URL.createObjectURL(f));
    
    const initialCaption = activeChallenge ? `¡Reto cumplido! 🎲\n${activeChallenge}` : '';
    
    setPostDraft({ files, previewUrls, caption: initialCaption, emotion: '', location: '' });
    if (fileInputRef.current) fileInputRef.current.value = "";
    
    setActiveChallenge(null); 
  };

  const cancelPost = () => {
    setPostDraft(null);
  };

  const publishPost = async () => {
    const nombreFinal = !config?.modoPublico ? authGuest?.name : (guestName || '').trim();
    if (!nombreFinal) { showToast("Ingresa tu nombre para publicar.", "error"); return; }

    setIsUploading(true);

    try {
      const uploadPromises = postDraft.files.map(async (file) => {
        const formData = new FormData(); formData.append("file", file); formData.append("upload_preset", uploadPreset);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: formData });
        const data = await res.json();
        if (data.secure_url) {
          const urlParts = data.secure_url.split('/upload/');
          return `${urlParts[0]}/upload/c_fill,g_auto,ar_4:5,w_1080,f_auto,q_auto/${urlParts[1]}`;
        }
        return null;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter(url => url !== null);
      if (validUrls.length === 0) throw new Error("Fallo al procesar fotos.");

      if(config?.modoPublico) {
         localStorage.setItem('eventmaster_guestName', (guestName||'').trim());
         localStorage.setItem('eventmaster_currentEventId', eventId);
      }

      let finalCaption = (postDraft.caption || '').trim();
      if (config?.hashtag && !finalCaption.toLowerCase().includes(config.hashtag.toLowerCase())) {
         finalCaption = finalCaption ? `${finalCaption} ${config.hashtag}` : config.hashtag;
      }

      const nuevaFoto = {
        id: Date.now().toString(), 
        urls: validUrls, 
        autor: nombreFinal, 
        avatar: guestAvatar, 
        mensaje: finalCaption,
        emotion: postDraft.emotion,
        location: postDraft.location,
        fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        likes: [], 
        comentarios: [],
        status: config?.moderacion ? 'pending' : 'approved'
      };
      
      await setDoc(doc(db, "eventos", eventId, "fotos", nuevaFoto.id), nuevaFoto);
      setPostDraft(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      if(config?.moderacion) {
        showToast("¡Subida! Un administrador la revisará en breve.", "info");
      }
    } catch (error) { 
      showToast("Hubo un error al intentar publicar.", "error"); 
    } finally {
      setIsUploading(false);
    }
  };

  const toggleLike = async (foto) => {
    if (!currentUserName) { 
      showToast("Por favor, ingresa tu nombre para interactuar.", "error"); 
      return; 
    }
    let likesArray = Array.isArray(foto.likes) ? [...foto.likes] : [];
    const isLiking = !likesArray.includes(currentUserName);
    
    if (isLiking) {
      likesArray.push(currentUserName);
      const coverUrl = foto.urls ? foto.urls[0] : foto.url;
      notifySocial('like_foto', foto.autor || 'Anónimo', foto.id, '', coverUrl);
    } else {
      likesArray = likesArray.filter(name => name !== currentUserName);
    }
    await setDoc(doc(db, "eventos", eventId, "fotos", foto.id), { ...foto, likes: likesArray });
  };

  const toggleCommentLike = async (foto, isReply = false, commentId, replyId = null) => {
    if (!currentUserName) return;
    let updatedComments = Array.isArray(foto.comentarios) ? [...foto.comentarios] : (foto.comentarios ? Object.values(foto.comentarios) : []);
    const cIndex = updatedComments.findIndex(c => c.id === commentId);
    if (cIndex === -1) return;

    const coverUrl = foto.urls ? foto.urls[0] : foto.url;

    if (!isReply) {
      let likes = Array.isArray(updatedComments[cIndex].likes) ? updatedComments[cIndex].likes : [];
      const isLiking = !likes.includes(currentUserName);
      if (isLiking) {
        likes.push(currentUserName);
        notifySocial('like_comment', updatedComments[cIndex].autor || 'Anónimo', foto.id, '', coverUrl);
      } else likes = likes.filter(n => n !== currentUserName);
      updatedComments[cIndex].likes = likes;
    } else {
      let replies = Array.isArray(updatedComments[cIndex].replies) ? updatedComments[cIndex].replies : [];
      const rIndex = replies.findIndex(r => r.id === replyId);
      if (rIndex > -1) {
        let likes = Array.isArray(replies[rIndex].likes) ? replies[rIndex].likes : [];
        const isLiking = !likes.includes(currentUserName);
        if (isLiking) {
          likes.push(currentUserName);
          notifySocial('like_comment', replies[rIndex].autor || 'Anónimo', foto.id, '', coverUrl); 
        } else likes = likes.filter(n => n !== currentUserName);
        replies[rIndex].likes = likes;
      }
    }
    await setDoc(doc(db, "eventos", eventId, "fotos", foto.id), { ...foto, comentarios: updatedComments });
  };

  const handleAddComment = async () => {
    const foto = activePostComments;
    if (!currentUserName || !commentText.trim() || !foto) return;

    let finalComment = commentText.trim();
    if (!replyingTo && config?.hashtag && !finalComment.toLowerCase().includes(config.hashtag.toLowerCase())) finalComment += ` ${config.hashtag}`;

    let updatedComments = Array.isArray(foto.comentarios) ? [...foto.comentarios] : (foto.comentarios ? Object.values(foto.comentarios) : []);
    const newObj = { id: Date.now(), autor: currentUserName, avatar: guestAvatar, texto: finalComment, likes: [] };
    const coverUrl = foto.urls ? foto.urls[0] : foto.url;

    if (replyingTo) {
      const cIndex = updatedComments.findIndex(c => c.id === replyingTo.commentId);
      if (cIndex > -1) {
        let currentReplies = Array.isArray(updatedComments[cIndex].replies) ? updatedComments[cIndex].replies : [];
        updatedComments[cIndex].replies = [...currentReplies, newObj];
        notifySocial('reply_comment', replyingTo.autor || 'Anónimo', foto.id, finalComment, coverUrl); 
      }
    } else {
      newObj.replies = [];
      updatedComments.push(newObj);
      notifySocial('comment_foto', foto.autor || 'Anónimo', foto.id, finalComment, coverUrl); 
    }
    
    await setDoc(doc(db, "eventos", eventId, "fotos", foto.id), { ...foto, comentarios: updatedComments });
    setCommentText(''); setReplyingTo(null);
  };

  const storageKey = `eventmaster_lastReadSocial_${authGuest ? authGuest.id : guestName}`;
  const lastReadStamp = Number(localStorage.getItem(storageKey) || 0);
  const myNotifications = socialActivity.filter(a => a.targetUser === currentUserName);
  const unreadCount = myNotifications.filter(a => a.timestamp > lastReadStamp).length;

  const handleOpenBell = () => {
    setShowSocialBell(!showSocialBell);
    setShowMenu(false);
    if (!showSocialBell) localStorage.setItem(storageKey, Date.now()); 
  };

  const openNotificationPost = (fotoId, tipo) => {
    setShowSocialBell(false); 
    const postEl = document.getElementById(`post_${fotoId}`);
    if (postEl) {
      const yOffset = -70; 
      const y = postEl.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      
      postEl.classList.add('ring-4', 'ring-pink-500', 'ring-offset-2', 'transition-all', 'duration-500');
      setTimeout(() => postEl.classList.remove('ring-4', 'ring-pink-500', 'ring-offset-2'), 2500);
      
      if (tipo.includes('comment')) {
        setTimeout(() => {
          const fotoDestino = feedFotos.find(f => String(f.id) === String(fotoId));
          if (fotoDestino) setActivePostComments(fotoDestino);
        }, 600);
      }
    } else {
      showToast("Esta foto ya no está disponible.", "info");
    }
  };

  const renderLikesText = (likesArr) => {
    if(!likesArr || likesArr.length === 0) return 'Sé el primero en dar Me gusta';
    if(likesArr.length === 1) return `Le gusta a ${likesArr[0]}`;
    if(likesArr.length === 2) return `Le gusta a ${likesArr[0]} y ${likesArr[1]}`;
    return `Le gusta a ${likesArr[0]}, ${likesArr[1]} y ${likesArr.length - 2} más`;
  };

  const renderTextWithHashtags = (text) => {
    if (!text) return null;
    return text.split(/(#[a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ]+)/g).map((part, i) => {
      if (part.startsWith('#')) return <span key={i} className="font-bold text-pink-500 cursor-pointer">{part}</span>;
      if (part.startsWith('@')) return <span key={i} className="font-bold text-indigo-500">{part}</span>;
      return part;
    });
  };

  const ToastOverlay = () => {
    if (!toast) return null;
    return (
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-top-4 fade-in duration-300">
        <div className={`px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 text-sm font-bold text-white border border-white/20 ${toast.type === 'error' ? 'bg-rose-600' : toast.type === 'success' ? 'bg-emerald-600' : 'bg-slate-800'}`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : toast.type === 'success' ? <CheckCircle size={18} /> : <Info size={18} />}
          {toast.text}
        </div>
      </div>
    );
  };

  if (!config?.modoPublico && !authGuest) {
    return (
      <div className={`min-h-screen ${tBgBase} flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans`}>
        
        <style>{`
          #qr-reader-login { width: 100% !important; height: 100% !important; border: none !important; position: absolute !important; inset: 0 !important; }
          #qr-reader-login video { object-fit: cover !important; width: 100% !important; height: 100% !important; border-radius: 1.5rem !important; }
          #qr-reader-login canvas { display: none !important; }
        `}</style>

        <ToastOverlay />
        <div className="absolute top-0 w-full h-64 bg-pink-600/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className={`w-full max-w-sm ${tBgCard} border ${tBorder} backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-center z-10 flex flex-col`}>
          <h1 className={`text-2xl font-black ${tTextMain} mb-2 tracking-tight`}>Red Privada</h1>
          <p className={`${tTextSub} text-xs mb-6`}>Apunta a la pulsera para ingresar a la fiesta.</p>
          
          <div className="w-full max-w-[350px] mx-auto bg-slate-900 rounded-3xl overflow-hidden relative shadow-2xl flex-shrink-0 aspect-square mb-6 border-4 border-pink-500/30">
            {isScanning ? (
              <>
                 <div id="qr-reader-login"></div>
                 <div className="absolute inset-0 border-[30px] border-black/40 pointer-events-none z-10"></div>
                 <div className="absolute inset-0 border-2 border-pink-400 m-[30px] pointer-events-none z-10 opacity-70">
                   <div className="w-full h-0.5 bg-pink-400 shadow-[0_0_15px_#f472b6] absolute top-1/2 -translate-y-1/2 opacity-60 animate-pulse"></div>
                 </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-800 p-6 text-center z-50">
                <Camera size={48} className="text-pink-500 mb-4 animate-pulse"/>
                <span className="font-bold text-sm text-slate-400">Iniciando cámara...</span>
              </div>
            )}
          </div>
          
          <div className="relative flex items-center justify-center mb-6 mt-auto">
            <div className={`border-t ${tBorder} w-full`}></div>
            <span className={`${tBgCard} px-3 text-xs ${tTextSub} font-bold uppercase tracking-widest absolute`}>O escribe tu código</span>
          </div>

          <div className="flex gap-2">
            {/* 🔴 input en text-base para evitar zoom */}
            <input type="text" placeholder="Ej. usr_123_0" value={guestCode} onChange={(e) => setGuestCode(e.target.value)} className={`w-full ${tInputBg} border ${tBorder} p-4 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all text-center font-bold ${tTextMain} text-base sm:text-lg uppercase`} />
            <button onClick={() => ejecutarLogin(guestCode)} className="px-5 bg-pink-600 text-white font-bold rounded-xl shadow-lg hover:bg-pink-700 transition-transform active:scale-95"><ArrowRight size={24}/></button>
          </div>
        </div>
      </div>
    );
  }

  const hasPosted = feedFotos.some(f => f.autor === currentUserName);

  return (
    <div className={`min-h-screen ${tBgBase} font-sans relative w-full flex flex-col`}>
      <ToastOverlay />

      <div className={`sticky top-0 z-[150] w-full ${tBgCard} border-b ${tBorder} shadow-sm flex justify-center transition-colors duration-300`}>
        <div className="w-full max-w-lg px-4 py-3 flex items-center justify-between">
          
          <div className="flex items-center gap-3 relative" ref={menuRef}>
            <button onClick={() => {setShowMenu(!showMenu); setShowSocialBell(false);}} className={`p-1.5 rounded-lg ${tTextMain} hover:bg-zinc-500/10 transition-colors`}>
              <Menu size={24} />
            </button>

            {showMenu && (
              <div className={`absolute top-12 left-0 w-56 ${tBgCard} border ${tBorder} shadow-2xl rounded-2xl p-2 z-[200] animate-in slide-in-from-top-2`}>
                <label className={`flex items-center w-full px-4 py-3 rounded-xl hover:bg-indigo-500 hover:text-white cursor-pointer transition-colors ${tTextMain}`}>
                  <Camera size={16} className="mr-3"/> <span className="text-sm font-bold">Cambiar foto</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
                </label>
                <button onClick={toggleTheme} className={`flex items-center w-full px-4 py-3 rounded-xl hover:bg-indigo-500 hover:text-white transition-colors ${tTextMain}`}>
                  <Moon size={16} className="mr-3"/> <span className="text-sm font-bold">{isDarkMode ? 'Modo Día' : 'Modo Noche'}</span>
                </button>
                <div className={`w-full h-px ${tBorder} my-1`}></div>
                
                {/* 🔴 NUEVO BOTÓN DE CERRAR SESIÓN BLINDADO */}
                <button onClick={handleGuestLogout} className={`flex items-center w-full px-4 py-3 rounded-xl hover:bg-rose-500 hover:text-white transition-colors text-rose-500`}>
                  <LogOut size={16} className="mr-3"/> <span className="text-sm font-bold">Cerrar Sesión</span>
                </button>
              </div>
            )}

            <div onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="flex items-center gap-2 cursor-pointer">
              <div className={`w-9 h-9 rounded-full ${tBgBase} overflow-hidden border ${tBorder} flex-shrink-0 relative`}>
                 {isAvatarUploading ? <RefreshCw size={14} className="absolute inset-0 m-auto text-indigo-500 animate-spin"/> : guestAvatar ? <img src={guestAvatar} className="w-full h-full object-cover"/> : <span className={`font-bold ${tTextSub} flex items-center justify-center h-full`}>{(currentUserName || '?').charAt(0).toUpperCase()}</span>}
              </div>
              <span className={`font-black text-sm ${tTextMain} truncate max-w-[120px] tracking-tight`}>{currentUserName}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={openChallengeModal} className={`relative p-1 text-amber-500 hover:text-amber-400 hover:scale-110 transition-transform group`} title="Jugar un Reto">
              <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-md animate-pulse"></div>
              <DiceIcon size={24} className="relative z-10 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
            </button>

            <button onClick={() => { setActiveChallenge(null); if (fileInputRef.current) fileInputRef.current.click(); }} className={`${tTextMain} hover:text-pink-500 transition-colors`} title="Subir foto libre">
              <div className="border-[2.5px] border-current rounded-[8px] p-0.5 flex items-center justify-center">
                <Plus size={16} strokeWidth={3} />
              </div>
            </button>

            <div className="relative" ref={bellRef}>
              <button onClick={handleOpenBell} className={`relative mt-1 ${showSocialBell ? 'text-pink-500' : tTextMain} hover:text-pink-500 transition-colors`}>
                <Heart size={24} className={showSocialBell ? 'fill-pink-500' : ''}/>
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 border-2 border-white rounded-full text-[9px] font-bold text-white flex items-center justify-center animate-bounce">{unreadCount}</span>}
              </button>

              {showSocialBell && (
                <div className={`absolute right-0 mt-3 w-80 sm:w-80 w-[90vw] ${tBgCard} shadow-2xl rounded-2xl border ${tBorder} overflow-hidden z-[200] text-left animate-in slide-in-from-top-2`}>
                  <div className={`p-3 border-b ${tBorder} font-bold ${tTextMain} text-sm flex justify-between items-center`}>
                    Actividad <button onClick={() => setShowSocialBell(false)} className={`${tTextSub} hover:text-rose-500`}><X size={14}/></button>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                     {myNotifications.length === 0 ? <p className={`p-6 text-center text-xs ${tTextSub} font-medium`}>Aún no tienes notificaciones.</p> :
                       myNotifications.map((n, idx) => {
                         const isNew = n.timestamp > lastReadStamp;
                         return (
                            <div key={idx} onClick={() => openNotificationPost(n.fotoId, n.tipo)} className={`flex items-start p-3 border-b ${tBorder} cursor-pointer transition-colors ${isNew ? (isDarkMode ? 'bg-indigo-900/40' : 'bg-pink-50/40') : `hover:${tBgBase}`}`}>
                               <div className={`w-8 h-8 rounded-full ${tBgBase} mr-3 flex-shrink-0 overflow-hidden border ${tBorder}`}>
                                  {n.actorAvatar ? <img src={n.actorAvatar} className="w-full h-full object-cover" /> : <span className={`w-full h-full flex items-center justify-center text-xs font-bold ${tTextSub}`}>{(n.actorName || '?').charAt(0).toUpperCase()}</span>}
                               </div>
                               <div className="flex-1 pr-2">
                                  <p className={`text-xs ${tTextMain} leading-snug`}>
                                     {n.tipo === 'like_foto' && <span><b className="font-bold">{n.actorName || 'Alguien'}</b> le dio Me gusta a tu foto.</span>}
                                     {n.tipo === 'comment_foto' && <span><b className="font-bold">{n.actorName || 'Alguien'}</b> comentó: {n.textoExtra}</span>}
                                     {n.tipo === 'like_comment' && <span>A <b className="font-bold">{n.actorName || 'Alguien'}</b> le gustó tu comentario.</span>}
                                     {n.tipo === 'reply_comment' && <span><b className="font-bold">{n.actorName || 'Alguien'}</b> te respondió: {n.textoExtra}</span>}
                                  </p>
                                  <p className={`text-[9px] ${tTextSub} mt-1`}>{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                               </div>
                               {n.fotoUrl && (
                                 <div className={`w-10 h-10 flex-shrink-0 rounded-md border ${tBorder} overflow-hidden shadow-sm ml-1`}>
                                   <img src={n.fotoUrl} className="w-full h-full object-cover" />
                                 </div>
                               )}
                               {isNew && <div className="w-2 h-2 rounded-full bg-pink-500 ml-2 mt-4 flex-shrink-0"></div>}
                            </div>
                         )
                       })
                     }
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-lg mx-auto pt-6 px-4 pb-20 flex flex-col items-center">
        <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={initiatePost} className="hidden" />

        {!hasPosted && !postDraft && (
           <div className={`w-full ${tBgCard} rounded-3xl shadow-sm p-8 text-center z-10 mb-8 border ${tBorder} flex flex-col items-center`}>
              <div className="w-16 h-16 bg-gradient-to-tr from-pink-500 to-indigo-500 rounded-full flex items-center justify-center text-white mb-4 shadow-lg">
                 <Camera size={28} />
              </div>
              <h2 className={`text-xl font-black ${tTextMain} mb-2`}>¡Bienvenido a la fiesta!</h2>
              <p className={`${tTextSub} text-xs mb-6 px-4`}>Eres el alma de este evento. Sube una foto o completa un reto divertido.</p>
              
              <button onClick={() => { setActiveChallenge(null); if (fileInputRef.current) fileInputRef.current.click(); }} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center mb-3">
                 <ImageIcon size={18} className="mr-2"/> Subir foto libre
              </button>

              <button onClick={openChallengeModal} className="relative w-full py-3.5 bg-slate-900 border border-amber-500/50 text-amber-400 font-black rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all active:scale-95 flex items-center justify-center overflow-hidden">
                 <div className="absolute inset-0 bg-amber-400/10 animate-pulse"></div>
                 <DiceIcon size={20} className="mr-2 relative z-10 drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]" />
                 <span className="relative z-10 tracking-wide uppercase">Misión Secreta</span>
              </button>
           </div>
        )}

        <div className="w-full space-y-8">
          {feedFotos.map((foto) => {
            if (config?.moderacion && foto.status === 'pending' && foto.autor !== currentUserName) return null;
            const isPending = config?.moderacion && foto.status === 'pending';

            const likesArr = Array.isArray(foto.likes) ? foto.likes : (foto.likes ? Object.values(foto.likes) : []);
            const hasLiked = currentUserName && likesArr.includes(currentUserName);
            const urls = foto.urls || [foto.url || '']; 
            
            const comentariosArr = Array.isArray(foto.comentarios) ? foto.comentarios : (foto.comentarios ? Object.values(foto.comentarios) : []);
            const commentCount = comentariosArr.reduce((acc, c) => {
               const repArr = Array.isArray(c.replies) ? c.replies : (c.replies ? Object.values(c.replies) : []);
               return acc + 1 + repArr.length;
            }, 0);
            
            return (
              <div id={`post_${foto.id}`} key={foto.id} className={`${tBgCard} rounded-3xl border ${isPending ? 'border-amber-500' : tBorder} shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 transition-colors duration-300 relative`}>
                
                {isPending && <div className="absolute top-3 left-3 z-20 bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-md flex items-center"><AlertCircle size={12} className="mr-1"/> PENDIENTE DE APROBACIÓN</div>}

                <div className="p-3.5 flex items-center">
                  <div className={`w-9 h-9 ${tBgBase} rounded-full flex items-center justify-center text-slate-400 font-bold text-xs mr-3 shadow-inner overflow-hidden border ${tBorder} shrink-0`}>
                    {foto.avatar ? <img src={foto.avatar} alt="P" className="w-full h-full object-cover"/> : (foto.autor || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${tTextMain} leading-tight`}>{foto.autor || 'Anónimo'}</p>
                    <p className={`text-[10px] ${tTextSub} font-medium`}>{foto.fecha}</p>
                  </div>
                </div>

                <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar">
                   {urls.map((u, idx) => (
                     <div key={idx} className={`w-full flex-shrink-0 snap-center relative border-y ${tBorder}`}>
                       <img src={u} alt={`Post ${idx}`} className={`w-full h-auto object-cover max-h-[70vh] sm:max-h-[600px] ${tBgBase}`} loading="lazy" />
                       {config?.marcoUrl && <img src={config.marcoUrl} className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10" />}
                       {urls.length > 1 && <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-md z-20">{idx + 1} / {urls.length}</div>}
                     </div>
                   ))}
                </div>
                
                <div className="px-4 py-3">
                  <div className="flex items-center space-x-4 mb-2.5">
                    <button onClick={() => toggleLike(foto)} className={`transition-transform active:scale-75 flex items-center ${hasLiked ? 'text-rose-500' : `${tTextMain} opacity-80 hover:opacity-100`}`}>
                      <Heart size={24} className={hasLiked ? 'fill-rose-500' : ''} />
                    </button>
                    <button onClick={() => setActivePostComments(foto)} className={`${tTextMain} opacity-80 hover:opacity-100 transition-transform active:scale-75`}>
                      <MessageCircle size={24} />
                    </button>
                    <button className={`${tTextMain} opacity-80 hover:opacity-100 transition-transform active:scale-75 ml-auto`}>
                      <Send size={20} />
                    </button>
                  </div>
                  
                  {likesArr.length > 0 && <p className={`font-bold text-xs ${tTextMain} mb-1.5`}>{renderLikesText(likesArr)}</p>}
                  
                  {(foto.emotion || foto.location) && (
                     <p className={`text-[10px] ${tTextSub} mb-1.5 flex items-center gap-1.5`}>
                        {foto.emotion && <span>Se siente <b>{foto.emotion}</b></span>}
                        {foto.emotion && foto.location && <span>•</span>}
                        {foto.location && <span className="flex items-center"><MapPin size={10} className="mr-0.5"/> {foto.location}</span>}
                     </p>
                  )}

                  {foto.mensaje && <p className={`text-sm ${tTextMain} mb-1.5 leading-snug`}><span className="font-bold mr-2">{foto.autor || 'Anónimo'}</span>{renderTextWithHashtags(foto.mensaje || '')}</p>}
                  
                  {commentCount > 0 && (
                    <button onClick={() => setActivePostComments(foto)} className={`text-xs ${tTextSub} font-medium hover:${tTextMain} transition-colors mt-1 mb-2`}>
                      Ver los {commentCount} comentarios
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {feedFotos.length === 0 && hasPosted && <p className={`text-center ${tTextSub} font-medium py-10`}>Aún no hay fotos en el muro.</p>}
        </div>
      </div>
      
      {showChallengeModal && (
        <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
          <div className={`w-full max-w-sm ${tBgCard} border border-amber-500/30 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.1)] p-8 text-center flex flex-col items-center relative overflow-hidden`}>
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-500"></div>
            
            <div className="w-20 h-20 bg-slate-900 border-2 border-amber-400/50 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.3)] mb-6 animate-pulse relative">
              <DiceIcon size={40} className="text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)] relative z-10" />
            </div>
            
            <h3 className={`text-2xl font-black ${tTextMain} mb-2 tracking-tight`}>Misión Secreta</h3>
            <p className={`${tTextSub} text-sm mb-6`}>Cumple este reto y sé la estrella de las pantallas:</p>
            
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-5 rounded-2xl w-full mb-8 shadow-inner relative overflow-hidden">
              <p className="font-black text-lg leading-snug relative z-10">{activeChallenge}</p>
            </div>

            <div className="w-full space-y-3">
              <button onClick={() => { setShowChallengeModal(false); if(fileInputRef.current) fileInputRef.current.click(); }} className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black rounded-xl shadow-[0_5px_15px_rgba(245,158,11,0.4)] hover:scale-105 transition-transform flex items-center justify-center text-lg">
                <Camera size={20} className="mr-2" /> ¡Aceptar Reto!
              </button>
              <button onClick={generarReto} className={`w-full py-3 ${tBgBase} ${tTextMain} font-bold rounded-xl border ${tBorder} hover:opacity-80 transition-colors flex justify-center items-center`}>
                <RefreshCw size={16} className="mr-2"/> Cambiar misión
              </button>
              <button onClick={() => { setShowChallengeModal(false); setActiveChallenge(null); }} className={`text-sm ${tTextSub} font-bold mt-4 hover:text-rose-500 block w-full`}>
                No quiero jugar
              </button>
            </div>
          </div>
        </div>
      )}

      {postDraft && (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex justify-center items-end sm:items-center sm:p-4 animate-in fade-in duration-200">
           <div className={`w-full sm:max-w-lg h-[95vh] sm:h-auto sm:max-h-[85vh] ${tBgCard} border ${tBorder} flex flex-col rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95`}>
             
             <div className={`flex justify-between items-center p-4 border-b ${tBorder} ${tBgCard} sm:rounded-t-3xl shrink-0`}>
               <button onClick={cancelPost} className={`${tTextSub} text-sm font-bold hover:text-rose-500`}>Cancelar</button>
               <h3 className={`font-black text-lg ${tTextMain}`}>Nueva Publicación</h3>
               <button onClick={publishPost} disabled={isUploading} className="text-pink-500 font-bold text-sm hover:text-pink-600 disabled:opacity-50 transition-opacity">
                 {isUploading ? 'Subiendo...' : 'Publicar'}
               </button>
             </div>

             <div className={`flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar ${tBgBase} sm:rounded-b-3xl`}>
               <div className="flex overflow-x-auto gap-3 pb-2 snap-x hide-scrollbar">
                 {postDraft.previewUrls.map((url, i) => (
                    <div key={i} className={`relative w-64 sm:w-80 h-80 sm:h-96 flex-shrink-0 snap-center rounded-2xl overflow-hidden border ${tBorder} shadow-sm`}>
                       <img src={url} className="w-full h-full object-cover" />
                       {config?.marcoUrl && <img src={config.marcoUrl} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />}
                    </div>
                 ))}
               </div>

               <div>
                 {/* 🔴 TEXT-BASE para evitar zoom en iOS */}
                 <textarea placeholder="Escribe un pie de foto..." value={postDraft.caption} onChange={e=>setPostDraft({...postDraft, caption: e.target.value})} className={`w-full p-4 rounded-2xl ${tInputBg} ${tTextMain} outline-none border ${tBorder} resize-none min-h-[100px] text-base sm:text-sm shadow-inner`} />
               </div>
               
               <div className="grid grid-cols-2 gap-3">
                 <div className={`flex items-center px-3 py-3 rounded-xl ${tInputBg} border ${tBorder}`}>
                   <span className="mr-2 text-lg">😀</span>
                   <select value={postDraft.emotion} onChange={e=>setPostDraft({...postDraft, emotion: e.target.value})} className={`bg-transparent outline-none w-full ${tTextMain} text-base sm:text-xs font-bold appearance-none`}>
                     <option value="" className="text-slate-400">¿Cómo te sientes?</option>
                     <option value="Feliz 😊">Feliz 😊</option>
                     <option value="De fiesta 🎉">De fiesta 🎉</option>
                     <option value="Enamorado ❤️">Enamorado ❤️</option>
                     <option value="Bailando 💃">Bailando 💃</option>
                     <option value="Nostálgico ✨">Nostálgico ✨</option>
                   </select>
                 </div>
                 <div className={`flex items-center px-3 py-3 rounded-xl ${tInputBg} border ${tBorder}`}>
                   <MapPin size={16} className={`mr-2 ${tTextSub}`}/>
                   <input type="text" placeholder="Añadir ubicación..." value={postDraft.location} onChange={e=>setPostDraft({...postDraft, location: e.target.value})} className={`w-full bg-transparent outline-none text-base sm:text-xs font-bold ${tTextMain}`} />
                 </div>
               </div>

               {isUploading && (
                  <div className="w-full bg-indigo-100 rounded-full h-2 mt-6 overflow-hidden">
                     <div className="bg-indigo-500 h-2 rounded-full animate-pulse w-full"></div>
                  </div>
               )}
             </div>
           </div>
        </div>
      )}

      {activePostComments && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex justify-center items-end sm:items-center sm:p-4 animate-in fade-in duration-200">
          <div className={`${tBgCard} w-full sm:max-w-md h-[80vh] sm:h-[600px] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 border ${tBorder}`}>
            <div className={`p-4 border-b ${tBorder} flex items-center justify-between shrink-0 ${tBgCard} rounded-t-3xl`}>
              <div className="w-8"></div>
              <h3 className={`font-bold ${tTextMain} text-sm`}>Comentarios</h3>
              <button onClick={() => { setActivePostComments(null); setReplyingTo(null); }} className={`p-1.5 ${tBgBase} rounded-full ${tTextSub} hover:text-rose-500 transition-colors`}><X size={16}/></button>
            </div>
            
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${tBgCard} custom-scrollbar`}>
              {activePostComments.mensaje && (
                <div className={`flex items-start mb-4 border-b ${tBorder} pb-4`}>
                  <div className={`w-8 h-8 ${tBgBase} rounded-full mr-3 flex-shrink-0 overflow-hidden border ${tBorder}`}>
                    {activePostComments.avatar ? <img src={activePostComments.avatar} className="w-full h-full object-cover"/> : <span className={`font-bold text-xs ${tTextSub} h-full flex items-center justify-center`}>{(activePostComments.autor || '?').charAt(0).toUpperCase()}</span>}
                  </div>
                  <div>
                    <p className={`text-sm ${tTextMain}`}><span className="font-bold mr-2">{activePostComments.autor || 'Anónimo'}</span>{renderTextWithHashtags(activePostComments.mensaje || '')}</p>
                    <p className={`text-[10px] ${tTextSub} mt-1`}>{activePostComments.fecha}</p>
                  </div>
                </div>
              )}

              {(activePostComments.comentarios || []).length === 0 ? (
                <div className={`text-center ${tTextSub} py-10 text-sm font-medium`}>No hay comentarios aún. ¡Sé el primero!</div>
              ) : (
                (Array.isArray(activePostComments.comentarios) ? activePostComments.comentarios : Object.values(activePostComments.comentarios)).map(c => {
                  const cLiked = Array.isArray(c.likes) && c.likes.includes(currentUserName);
                  return (
                    <div key={c.id} className="flex flex-col">
                      <div className="flex items-start group">
                        <div className={`w-8 h-8 ${tBgBase} rounded-full mr-3 flex-shrink-0 overflow-hidden border ${tBorder}`}>
                          {c.avatar ? <img src={c.avatar} className="w-full h-full object-cover"/> : <span className={`font-bold text-xs ${tTextSub} h-full flex items-center justify-center`}>{(c.autor || '?').charAt(0).toUpperCase()}</span>}
                        </div>
                        <div className="flex-1 pr-2">
                          <p className={`text-sm ${tTextMain}`}><span className="font-bold mr-2">{c.autor || 'Anónimo'}</span>{renderTextWithHashtags(c.texto || '')}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`text-[10px] ${tTextSub} font-medium`}>{c.likes?.length > 0 ? `${c.likes.length} Me gusta` : ''}</span>
                            <button onClick={() => setReplyingTo({ commentId: c.id, autor: c.autor })} className={`text-[10px] font-bold ${tTextSub} hover:${tTextMain} transition-colors`}>Responder</button>
                          </div>
                        </div>
                        <button onClick={() => toggleCommentLike(activePostComments, false, c.id)} className={`pt-1 transition-transform active:scale-75 ${cLiked ? 'text-rose-500' : `${tTextSub} hover:text-pink-400`}`}><Heart size={12} className={cLiked ? 'fill-rose-500' : ''}/></button>
                      </div>

                      {c.replies && (Array.isArray(c.replies) ? c.replies : Object.values(c.replies)).length > 0 && (
                        <div className="ml-11 mt-3 space-y-3">
                          {(Array.isArray(c.replies) ? c.replies : Object.values(c.replies)).map(r => {
                            const rLiked = Array.isArray(r.likes) && r.likes.includes(currentUserName);
                            return (
                              <div key={r.id} className="flex items-start">
                                <div className={`w-6 h-6 ${tBgBase} rounded-full mr-2 flex-shrink-0 overflow-hidden border ${tBorder}`}>
                                  {r.avatar ? <img src={r.avatar} className="w-full h-full object-cover"/> : <span className={`font-bold text-[9px] ${tTextSub} h-full flex items-center justify-center`}>{(r.autor || '?').charAt(0).toUpperCase()}</span>}
                                </div>
                                <div className="flex-1 pr-2">
                                  <p className={`text-xs ${tTextMain}`}><span className="font-bold mr-1.5">{r.autor || 'Anónimo'}</span>{renderTextWithHashtags(r.texto || '')}</p>
                                  <span className={`text-[9px] ${tTextSub} font-medium mt-0.5 block`}>{r.likes?.length > 0 ? `${r.likes.length} Me gusta` : ''}</span>
                                </div>
                                <button onClick={() => toggleCommentLike(activePostComments, true, c.id, r.id)} className={`pt-1 transition-transform active:scale-75 ${rLiked ? 'text-rose-500' : `${tTextSub} hover:text-pink-400`}`}><Heart size={10} className={rLiked ? 'fill-rose-500' : ''}/></button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className={`p-3 border-t ${tBorder} ${tBgBase} shrink-0 rounded-b-3xl sm:rounded-b-3xl`}>
              {replyingTo && (
                <div className={`flex justify-between items-center text-[10px] ${tTextSub} ${tBgCard} px-3 py-1.5 rounded-t-lg mx-1 -mt-3 mb-2 font-medium border ${tBorder}`}>
                  <span>Respondiendo a <b className={tTextMain}>@{replyingTo.autor}</b></span>
                  <button onClick={() => setReplyingTo(null)} className="hover:text-rose-500"><X size={12}/></button>
                </div>
              )}
              <div className={`flex items-center ${tBgCard} border ${tBorder} rounded-full pl-4 pr-1.5 py-1.5 shadow-sm focus-within:border-indigo-400 transition-colors`}>
                <div className={`w-7 h-7 ${tBgBase} rounded-full mr-2 flex-shrink-0 overflow-hidden border ${tBorder}`}>
                  {guestAvatar ? <img src={guestAvatar} className="w-full h-full object-cover"/> : <span className={`font-bold text-[10px] ${tTextSub} h-full flex items-center justify-center`}>{(currentUserName || '?').charAt(0).toUpperCase()}</span>}
                </div>
                <input 
                  type="text" 
                  placeholder={replyingTo ? `Escribe tu respuesta...` : `Agrega un comentario...`}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className={`flex-1 bg-transparent outline-none text-base sm:text-sm ${tTextMain} font-medium`}
                />
                <button onClick={handleAddComment} disabled={!commentText.trim()} className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-slate-400 disabled:text-slate-200 transition-all active:scale-90 ml-1">
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// ==========================================
// --- COMPONENTE: MODO PROYECTOR (CÓDIGO DE EVENTO DINÁMICO) ---
// ==========================================
const GuestProyectorView = ({ eventId }) => {
  const [photos, setPhotos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSubIndex, setCurrentSubIndex] = useState(0); 
  const [config, setConfig] = useState({ hashtag: '', moderacion: false, marcoUrl: '' });
  const [isHallOfFame, setIsHallOfFame] = useState(false); 
  
  const [flyingHearts, setFlyingHearts] = useState([]);
  const [liveComments, setLiveComments] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('proyector_theme') !== 'light');
  const [screenRotation, setScreenRotation] = useState(() => Number(localStorage.getItem('proyector_rotation')) || 0);

  const [windowPortrait, setWindowPortrait] = useState(window.innerHeight > window.innerWidth);

  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);

  const lastPhotoCount = useRef(0);

  const getCleanBaseUrl = () => {
    let base = window.location.href.split('?')[0];
    if (base.endsWith('/')) base = base.slice(0, -1);
    return base;
  };
  const guestLink = `${getCleanBaseUrl()}/?modo=camara&e=${eventId}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(guestLink)}&margin=0`;

  // 🔴 BLINDAJE: Ahora todas las consultas apuntan directo a eventId
  useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, "eventos", eventId, "configuracion", "galeria"), (docSnap) => {
      if (docSnap.exists()) setConfig(docSnap.data());
    });

    const unsubFotos = onSnapshot(collection(db, "eventos", eventId, "fotos"), (snap) => {
      let fotosLimpias = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fotosLimpias = fotosLimpias.sort((a, b) => b.id - a.id);
      
      if (lastPhotoCount.current > 0 && fotosLimpias.length > lastPhotoCount.current) {
        setCurrentIndex(0);
        setCurrentSubIndex(0);
        setIsHallOfFame(false);
        triggerHearts(15); 
      }
      lastPhotoCount.current = fotosLimpias.length;
      setPhotos(fotosLimpias);
    });

    return () => { unsubConfig(); unsubFotos(); };
  }, [eventId]);

  useEffect(() => {
    const timeOnLoad = Date.now(); 
    const unsubActivity = onSnapshot(collection(db, "eventos", eventId, "actividad_social"), (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          if (data.timestamp > timeOnLoad) {
             if (data.tipo.includes('like')) triggerHearts(12); 
             if (data.tipo.includes('comment')) showLiveComment(data); 
          }
        }
      });
    });
    return () => unsubActivity();
  }, [eventId]);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    const handleResize = () => setWindowPortrait(window.innerHeight > window.innerWidth);
    
    document.addEventListener('fullscreenchange', onFullscreenChange);
    window.addEventListener('resize', handleResize);
    
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const resetActivityTimer = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000); 
    };

    resetActivityTimer(); 

    window.addEventListener('mousemove', resetActivityTimer);
    window.addEventListener('touchstart', resetActivityTimer);
    window.addEventListener('click', resetActivityTimer);
    window.addEventListener('keydown', resetActivityTimer);

    return () => {
      window.removeEventListener('mousemove', resetActivityTimer);
      window.removeEventListener('touchstart', resetActivityTimer);
      window.removeEventListener('click', resetActivityTimer);
      window.removeEventListener('keydown', resetActivityTimer);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  const displayPhotos = config.moderacion ? photos.filter(f => f.status !== 'pending' && f.status !== 'rejected') : photos;

  useEffect(() => {
    if (displayPhotos[currentIndex]) {
      const likesCount = displayPhotos[currentIndex].likes?.length || 0;
      if (likesCount > 0) setTimeout(() => triggerHearts(Math.min(likesCount, 10)), 800);
    }
  }, [currentIndex, isHallOfFame]);

  useEffect(() => {
    if (displayPhotos.length <= 1 && (!displayPhotos[0]?.urls || displayPhotos[0].urls.length <= 1)) return;

    const currentPost = displayPhotos[currentIndex];
    if (!currentPost) return;

    const urlsCount = (currentPost.urls || [currentPost.url]).filter(u => u !== undefined).length;
    const delay = urlsCount > 1 ? 3000 : 8000;

    const timer = setTimeout(() => {
      if (isHallOfFame) {
         setIsHallOfFame(false);
         setCurrentIndex((prev) => (prev + 1) % displayPhotos.length);
         setCurrentSubIndex(0);
         return;
      }

      if (currentSubIndex < urlsCount - 1) {
         setCurrentSubIndex(prev => prev + 1);
      } else {
         if (currentIndex > 0 && currentIndex % 5 === 0) {
            setIsHallOfFame(true);
         } else {
            setCurrentIndex((prev) => (prev + 1) % displayPhotos.length);
            setCurrentSubIndex(0);
         }
      }
    }, delay); 

    return () => clearTimeout(timer);
  }, [displayPhotos, currentIndex, currentSubIndex, isHallOfFame]);

  const triggerHearts = (cantidad) => {
    const newHearts = Array(cantidad).fill(null).map(() => ({
      id: Math.random().toString(36).substr(2, 9),
      left: Math.random() * 80 + 10, 
      size: Math.random() * 30 + 20, 
      duration: Math.random() * 2 + 3  
    }));
    setFlyingHearts(prev => [...prev, ...newHearts]);
    setTimeout(() => {
      setFlyingHearts(prev => prev.filter(h => !newHearts.map(nh => nh.id).includes(h.id)));
    }, 5000);
  };

  const showLiveComment = (action) => {
    const newComment = { 
      id: Math.random().toString(36).substr(2, 9), 
      actor: action.actorName, 
      avatar: action.actorAvatar, 
      text: action.textoExtra,
      left: Math.random() * 50 + 10, 
      duration: Math.random() * 3 + 8 
    };
    setLiveComments(prev => [...prev, newComment]);
    setTimeout(() => {
      setLiveComments(prev => prev.filter(c => c.id !== newComment.id));
    }, 12000);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(err => console.log(err));
    else if (document.exitFullscreen) document.exitFullscreen();
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('proyector_theme', newTheme ? 'dark' : 'light');
  };

  const cycleRotation = () => {
    const next = screenRotation === 0 ? 90 : (screenRotation === 90 ? -90 : 0);
    setScreenRotation(next);
    localStorage.setItem('proyector_rotation', next);
  };

  if (displayPhotos.length === 0) {
    return (
      <div className="w-screen h-screen bg-slate-900 flex flex-col items-center justify-center text-white relative">
        <Camera size={80} className="animate-pulse mb-6 text-slate-600" />
        <h1 className="text-4xl font-black uppercase text-slate-400 text-center px-4">Esperando Fotos...</h1>
        <p className="text-slate-500 mt-4 text-xl text-center px-4">Escanea el QR para ser el primero en aparecer aquí.</p>
        <div className="mt-12 bg-white p-4 rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.2)]">
           <img src={qrUrl} alt="QR" className="w-64 h-64 mix-blend-multiply" />
        </div>
      </div>
    );
  }

  let currentPhoto = displayPhotos[currentIndex];
  if (isHallOfFame) currentPhoto = [...displayPhotos].sort((a,b) => (b.likes?.length || 0) - (a.likes?.length || 0))[0];
  if (!currentPhoto) return null;

  const urls = currentPhoto.urls || [currentPhoto.url];
  const safeSubIndex = isHallOfFame ? 0 : (currentSubIndex >= urls.length ? 0 : currentSubIndex);
  const imageUrl = urls[safeSubIndex];

  const tBg = isDarkMode ? 'bg-black' : 'bg-slate-200';
  const tAmbilight = isDarkMode ? 'from-black/95 via-black/40 to-black/80' : 'from-slate-200/95 via-white/40 to-slate-200/80';
  const tCard = isDarkMode ? 'bg-black/60 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]' : 'bg-white/80 border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)]';
  const tTextMain = isDarkMode ? 'text-white' : 'text-slate-900';
  const tTextSub = isDarkMode ? 'text-white/80' : 'text-slate-600';
  const tCommentsArea = isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-100/50 border-slate-200';

  const isPortraitMode = screenRotation !== 0 || windowPortrait;

  return (
    <div className={`w-screen h-screen ${tBg} overflow-hidden relative font-sans transition-colors duration-1000`}>
      
      <style>{`
        @keyframes flyUp { 0% { top: 110%; transform: scale(0.5) rotate(0deg); opacity: 0; } 10% { opacity: 1; transform: scale(1.2) rotate(5deg); } 100% { top: -20%; transform: scale(1) rotate(15deg); opacity: 0; } }
        @keyframes floatComment { 0% { top: 110%; transform: scale(0.8); opacity: 0; } 10% { top: 75%; transform: scale(1); opacity: 1; } 90% { top: 15%; transform: scale(1); opacity: 1; } 100% { top: -10%; transform: scale(0.8); opacity: 0; } }
        .animate-fly { animation: flyUp linear forwards; }
        .animate-float-comment { animation: floatComment linear forwards; }
      `}</style>

      <div className={`absolute top-6 right-6 z-[999] flex gap-3 transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button onClick={cycleRotation} className={`p-3 rounded-full backdrop-blur-md border shadow-lg transition-all ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white border-white/20' : 'bg-black/10 hover:bg-black/20 text-slate-800 border-black/10'}`} title="Rotar Pantalla LED">
           <RotateCw size={24} className={!isDarkMode ? 'text-slate-800' : ''} />
        </button>
        <button onClick={toggleTheme} className={`p-3 rounded-full backdrop-blur-md border shadow-lg transition-all ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white border-white/20' : 'bg-black/10 hover:bg-black/20 text-slate-800 border-black/10'}`} title="Cambiar Tema (Día/Noche)">
           <Moon size={24} className={!isDarkMode ? 'fill-slate-800' : ''} />
        </button>
        <button onClick={toggleFullscreen} className={`p-3 rounded-full backdrop-blur-md border shadow-lg transition-all ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white border-white/20' : 'bg-black/10 hover:bg-black/20 text-slate-800 border-black/10'}`} title="Pantalla Completa">
           {isFullscreen ? (
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
           ) : (
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
           )}
        </button>
      </div>

      <div 
        className="absolute bg-transparent overflow-hidden"
        style={{
          width: screenRotation === 0 ? '100vw' : '100vh',
          height: screenRotation === 0 ? '100vh' : '100vw',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) rotate(${screenRotation}deg)`,
          transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1), width 0.7s, height 0.7s'
        }}
      >
        
        <div className="absolute inset-0 z-0">
           <img src={imageUrl} className="w-full h-full object-cover blur-[100px] opacity-50 transform scale-110 transition-all duration-1000" />
           <div className={`absolute inset-0 bg-gradient-to-t ${tAmbilight} transition-colors duration-1000`}></div>
        </div>

        <div className={`absolute inset-0 z-10 flex items-center justify-center ${isPortraitMode ? 'p-6 pb-72' : 'p-12'}`}>
          <div 
             className="relative shadow-2xl rounded-2xl overflow-hidden bg-black/10 animate-in fade-in zoom-in-95 duration-700 flex justify-center items-center"
             style={{ 
               maxHeight: isPortraitMode ? '70%' : '80%', 
               maxWidth: '85%', 
               aspectRatio: '4/5' 
             }}
          >
             <img key={`${currentPhoto.id}_${safeSubIndex}`} src={imageUrl} className="w-full h-full object-cover" />
             {config.marcoUrl && <img src={config.marcoUrl} className="absolute inset-0 w-full h-full object-cover pointer-events-none z-20" />}
          </div>
        </div>

        {isHallOfFame && (
           <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 text-center animate-in slide-in-from-top-10 duration-1000 w-[90%]">
              <div className="bg-gradient-to-r from-amber-400 to-yellow-600 text-white px-6 md:px-10 py-3 rounded-full shadow-[0_0_40px_rgba(251,191,36,0.6)] inline-flex items-center justify-center border-2 border-yellow-200">
                 <Star size={28} className="mr-3 fill-white animate-spin-slow hidden sm:block"/>
                 <h2 className="text-xl md:text-3xl font-black tracking-widest uppercase text-shadow-lg text-center">¡Foto más popular!</h2>
                 <Star size={28} className="ml-3 fill-white animate-spin-slow hidden sm:block"/>
              </div>
              <div className="w-full"></div>
              <p className={`mt-4 text-sm md:text-xl font-bold inline-block px-6 py-2 rounded-full backdrop-blur-md border ${isDarkMode ? 'bg-black/40 text-white border-white/10' : 'bg-white/60 text-slate-800 border-slate-200'}`}>
                 Con {currentPhoto.likes?.length || 0} Me gusta ❤️
              </p>
           </div>
        )}

        <div className={`absolute inset-x-0 bottom-0 z-20 pointer-events-none flex ${isPortraitMode ? 'flex-col items-center justify-end gap-6 p-6 pb-8' : 'flex-row items-end justify-between gap-6 p-12'}`}>
           
           <div className={`w-[280px] sm:w-[320px] max-w-[85vw] pointer-events-auto ${tCard} backdrop-blur-2xl px-6 pb-6 pt-12 rounded-[2rem] animate-in slide-in-from-bottom-12 duration-700 flex flex-col items-center text-center relative max-h-[50vh] sm:max-h-[60vh] shrink-0`}>
              
              {!isHallOfFame && urls.length > 1 && (
                 <div className="absolute -top-4 right-4 bg-pink-600 text-white px-3 py-1.5 rounded-full text-[10px] font-black shadow-lg flex items-center border border-white/20 z-30">
                   <Layers size={12} className="mr-1.5"/> {safeSubIndex + 1} / {urls.length}
                 </div>
              )}

              <div className={`absolute -top-10 w-20 h-20 rounded-full bg-indigo-600 overflow-hidden border-4 shadow-xl z-20 ${isDarkMode ? 'border-zinc-800' : 'border-white'}`}>
                 {currentPhoto.avatar ? <img src={currentPhoto.avatar} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-white text-3xl font-black">{currentPhoto.autor.charAt(0).toUpperCase()}</div>}
              </div>
              
              <h2 className={`text-2xl font-black ${tTextMain} leading-tight drop-shadow-sm`}>{currentPhoto.autor}</h2>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold mt-1.5 mb-3 flex items-center shrink-0 ${isDarkMode ? 'bg-white/10 text-white' : 'bg-slate-200 text-slate-600'}`}>
                 <Clock size={12} className="mr-1"/> {currentPhoto.fecha}
              </span>
              
              {(currentPhoto.emotion || currentPhoto.location) && (
                 <div className="flex flex-col items-center gap-1.5 mb-3 w-full shrink-0">
                   {currentPhoto.emotion && <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-sm">{currentPhoto.emotion}</span>}
                   {currentPhoto.location && <span className="bg-rose-500 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-sm flex items-center"><MapPin size={10} className="mr-1"/> {currentPhoto.location}</span>}
                 </div>
              )}

              <div className="w-full overflow-y-auto hide-scrollbar flex-1 min-h-0 pt-2">
                {currentPhoto.mensaje && <p className={`text-sm ${tTextMain} font-medium italic leading-snug drop-shadow-sm px-2 mb-4`}>"{currentPhoto.mensaje}"</p>}

                {currentPhoto.comentarios && Object.values(currentPhoto.comentarios).length > 0 && (
                  <div className={`pt-3 border-t w-full text-left ${isDarkMode ? 'border-white/10' : 'border-slate-300'}`}>
                    {Object.values(currentPhoto.comentarios).slice(-4).map((c, i) => (
                      <div key={i} className={`mb-1.5 p-2.5 rounded-xl shadow-sm ${tCommentsArea}`}>
                         <span className="font-black text-pink-500 text-[9px] uppercase block mb-0.5">{c.usuario || c.autor}</span>
                         <span className={`text-xs ${tTextSub} leading-tight block`}>{c.texto}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
           </div>

           <div className={`flex flex-col items-center pointer-events-auto animate-in slide-in-from-right-12 duration-1000 shrink-0 ${isPortraitMode ? 'mt-2' : ''}`}>
              <div className={`backdrop-blur-xl p-4 rounded-[2rem] border-4 shadow-2xl mb-4 transform hover:scale-105 transition-transform ${isDarkMode ? 'bg-white/95 border-white/50' : 'bg-white border-white'}`}>
                <img src={qrUrl} alt="QR" className="w-24 h-24 sm:w-32 sm:h-32 mix-blend-multiply" />
              </div>
              <div className={`backdrop-blur-xl px-6 py-2.5 rounded-full shadow-lg text-center border ${isDarkMode ? 'bg-black/50 border-white/10' : 'bg-white/80 border-slate-200'}`}>
                 <p className={`font-black text-sm tracking-widest uppercase ${tTextMain}`}>¡Sube tu foto!</p>
                 <p className="text-pink-500 font-bold text-xs">{config.hashtag || 'Galería en vivo'}</p>
              </div>
           </div>

        </div>

        <div className="absolute inset-0 z-[100] pointer-events-none overflow-hidden">
          {flyingHearts.map(h => (
            <div key={h.id} className="absolute animate-fly drop-shadow-[0_5px_15px_rgba(225,29,72,0.8)]" style={{ left: `${h.left}%`, animationDuration: `${h.duration}s` }}>
              <Heart fill="#f43f5e" color="#e11d48" size={h.size} />
            </div>
          ))}
          
          {liveComments.map(c => (
            <div key={c.id} className={`absolute animate-float-comment flex items-center gap-3 p-3 rounded-2xl shadow-2xl max-w-xs border-l-4 border-indigo-500 backdrop-blur-md ${isDarkMode ? 'bg-white/95 text-slate-800' : 'bg-slate-900/95 text-white'}`} style={{ left: `${c.left}%`, animationDuration: `${c.duration}s` }}>
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 shadow-inner">
                 {c.avatar ? <img src={c.avatar} className="w-full h-full object-cover"/> : <div className="w-full h-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">{c.actor.charAt(0)}</div>}
              </div>
              <div>
                 <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>{c.actor}</p>
                 <p className="text-sm font-bold leading-tight">{c.text}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

// ==========================================
// --- COMPONENTE: PÁGINA DE VENTAS WEB (BAULIA 9.0 - SOCIAL PROOF) ---
// ==========================================
const LandingPageView = ({ isDarkMode, themeSetting, cycleTheme }) => {
  const [legalModal, setLegalModal] = useState(null);
  
  // Estados para Demos Interactivas
  const [fakeRsvp, setFakeRsvp] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ d: 45, h: 12, m: 30, s: 59 });
  const [accentColor, setAccentColor] = useState('amber');
  // 🔴 ESTADO PARA LAS RESEÑAS REALES APROBADAS
  const [liveReviews, setLiveReviews] = useState([]);

  useEffect(() => {
    // Escucha en tiempo real solo las reseñas que tú aprobaste en el panel
    const q = query(collection(db, "resenas"), where("status", "==", "aprobada"));
    const unsub = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      fetched.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setLiveReviews(fetched);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { d, h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; d--; }
        return { d, h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const IconFB = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
  const IconIG = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 1.727-6.98 6.077-.058 1.28-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 1.718 6.781 6.077 6.98 1.28.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-1.718 6.979-6.077.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-1.717-6.78-6.077-6.98-1.28-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>;
  const IconWA = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.88-.653-1.473-1.46-1.646-1.757-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>;
  const IconTK = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v7.2c0 1.63-.31 3.23-1.11 4.6-1.18 2.01-3.21 3.44-5.5 3.86-2.5.46-5.22-.09-7.25-1.67-1.95-1.52-3.13-3.87-3.2-6.38-.08-2.82 1.25-5.61 3.54-7.24 1.48-1.06 3.32-1.5 5.12-1.37v4.03c-1.04-.15-2.15.02-3.05.62-.92.6-1.53 1.57-1.64 2.66-.1 1.05.28 2.11 1.02 2.85.76.76 1.86 1.1 2.92 1.03 1.16-.08 2.21-.71 2.78-1.7.35-.61.54-1.32.55-2.03V.02z"/></svg>;

  const accentThemes = {
    amber: { text: 'text-amber-500', bg: 'bg-amber-500', glow: 'shadow-[0_0_40px_rgba(245,158,11,0.4)]' },
    rose: { text: 'text-rose-500', bg: 'bg-rose-500', glow: 'shadow-[0_0_40px_rgba(244,63,94,0.4)]' },
    emerald: { text: 'text-emerald-500', bg: 'bg-emerald-500', glow: 'shadow-[0_0_40px_rgba(16,185,129,0.4)]' },
    indigo: { text: 'text-indigo-500', bg: 'bg-indigo-500', glow: 'shadow-[0_0_40px_rgba(99,102,241,0.4)]' }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#050505] font-sans text-slate-900 dark:text-slate-100 selection:bg-amber-500 selection:text-white transition-colors duration-700 overflow-x-hidden">
      
      {/* 🔴 INYECCIÓN DE FUENTES EDITORIALES */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
        .font-editorial { font-family: 'Playfair Display', serif; }
        .font-monogram { font-family: 'Great Vibes', cursive; }
      `}</style>

      {/* LUCES DE AMBIENTE SUTILES */}
      <div className="fixed top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-amber-500/5 dark:bg-amber-600/10 blur-[150px] rounded-full pointer-events-none z-0 transition-colors duration-700"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] bg-indigo-500/5 dark:bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none z-0 transition-colors duration-700"></div>

      {/* 🔴 NAVEGACIÓN FLOTANTE */}
      <nav className="fixed w-full z-50 top-0 pt-4 md:pt-6 px-4 md:px-8 pointer-events-none">
        <div className="max-w-6xl mx-auto bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-2xl border border-slate-200/50 dark:border-white/10 h-16 md:h-20 rounded-[2rem] flex items-center justify-between px-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] pointer-events-auto transition-colors duration-700">
            <a href="/" className="flex items-center group">
               <BauliaLogo className="h-8 md:h-10 w-auto" />
            </a>
          <div className="hidden lg:flex gap-8 text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            <a href="#experiencia" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">La Experiencia</a>
            <a href="#boveda" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">El Panel</a>
            <a href="#planes" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">Colección</a>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={cycleTheme} className="text-slate-400 hover:text-amber-600 dark:text-slate-500 dark:hover:text-amber-400 transition-colors" title={`Modo: ${themeSetting.toUpperCase()}`}>
              {themeSetting === 'auto' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              ) : themeSetting === 'dark' ? (
                <Moon size={20} />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              )}
            </button>
            <button onClick={() => window.location.href = 'https://panel.baulia.com'} className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white dark:text-slate-900 bg-slate-900 dark:bg-white px-5 py-2.5 md:px-6 md:py-3 rounded-full hover:scale-105 transition-transform shadow-md">
              Acceso Clientes
            </button>
          </div>
        </div>
      </nav>

      {/* 🔴 HERO SECTION */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-32 pb-20 px-4 md:px-6 z-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest mb-8 backdrop-blur-md shadow-sm">
          <Star size={12} className="fill-amber-500 dark:fill-amber-400"/>
          <span className="text-slate-700 dark:text-white/80">Software Premium para Eventos</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl lg:text-[6.5rem] font-medium text-slate-900 dark:text-white mb-6 tracking-tight leading-[1.05] font-editorial transition-colors duration-700">
          El nuevo estándar <br className="hidden md:block"/> 
          <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-yellow-600 to-amber-700 dark:from-amber-200 dark:via-amber-400 dark:to-yellow-600 pr-2">para celebrar.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed transition-colors duration-700">
          Baulia es la bóveda digital que fusiona <b>invitaciones interactivas de lujo</b> con el software de gestión y control de accesos más poderoso del mercado.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button onClick={() => window.open('/demo-boda-vip', '_blank')} className="px-8 py-4 md:py-5 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-full font-black text-sm uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.4)] border border-amber-400">
            Probar Invitación VIP <Smartphone size={18} className="ml-3"/>
          </button>
          <a href="#planes" className="px-8 py-4 md:py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-sm uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center shadow-xl">
            Ver Colección
          </a>
        </div>
      </section>

      {/* ========================================== */}
      {/* SECCIÓN DE PRECIOS: LA COLECCIÓN BAULIA  */}
      {/* ========================================== */}
      <div id="planes" className="py-24 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <span className="px-4 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-[0.2em] border border-amber-500/20 shadow-sm">
            Oferta de Lanzamiento
          </span>
          <h2 className="text-4xl md:text-5xl font-serif text-slate-900 dark:text-white mt-8 mb-6">
            La Colección
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-sm md:text-base">
            Diseña tu evento sin compromiso. Comienza en <b>Modo Prueba</b> con marca de agua y paga solo cuando estés 100% enamorado del resultado.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-center">
          
          {/* PAQUETE 1: BÁSICO */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-8 border border-slate-200 dark:border-white/5 shadow-lg hover:shadow-xl transition-shadow relative">
            <h3 className="text-xl font-serif text-slate-900 dark:text-white mb-2">Básico</h3>
            <p className="text-xs text-slate-500 mb-6 h-8">La elegancia esencial para tu evento.</p>
            <div className="text-3xl font-light text-slate-900 dark:text-white mb-8">
              $990 <span className="text-sm text-slate-400 font-normal">MXN</span>
            </div>
            <ul className="space-y-4 mb-8 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start"><Check size={16} className="text-amber-500 mr-2 shrink-0 mt-0.5"/> Invitación interactiva</li>
              <li className="flex items-start"><Check size={16} className="text-amber-500 mr-2 shrink-0 mt-0.5"/> Confirmación simple</li>
              <li className="flex items-start"><Check size={16} className="text-amber-500 mr-2 shrink-0 mt-0.5"/> Cuenta regresiva</li>
              <li className="flex items-start"><Check size={16} className="text-amber-500 mr-2 shrink-0 mt-0.5"/> Mapas y ubicación GPS</li>
            </ul>
            <button className="w-full py-3 rounded-full border border-slate-300 dark:border-white/20 text-slate-800 dark:text-white text-xs font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              Iniciar Draft
            </button>
          </div>

          {/* PAQUETE 2: PLATA */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-8 border border-slate-200 dark:border-white/5 shadow-lg hover:shadow-xl transition-shadow relative">
            <h3 className="text-xl font-serif text-slate-900 dark:text-white mb-2">Plata</h3>
            <p className="text-xs text-slate-500 mb-6 h-8">Recupera tu inversión con regalos en efectivo.</p>
            <div className="text-3xl font-light text-slate-900 dark:text-white mb-8">
              $1,490 <span className="text-sm text-slate-400 font-normal">MXN</span>
            </div>
            <ul className="space-y-4 mb-8 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start"><Check size={16} className="text-amber-500 mr-2 shrink-0 mt-0.5"/> <b>Todo lo del Básico</b></li>
              <li className="flex items-start"><Check size={16} className="text-amber-500 mr-2 shrink-0 mt-0.5"/> Itinerario del evento</li>
              <li className="flex items-start"><Check size={16} className="text-amber-500 mr-2 shrink-0 mt-0.5"/> Mesa de Regalos / Efectivo</li>
              <li className="flex items-start"><Check size={16} className="text-amber-500 mr-2 shrink-0 mt-0.5"/> Dress Code (Código de Vestimenta)</li>
            </ul>
            <button className="w-full py-3 rounded-full border border-slate-300 dark:border-white/20 text-slate-800 dark:text-white text-xs font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              Iniciar Draft
            </button>
          </div>

          {/* PAQUETE 3: ORO (ESTRELLA - DESTACADO) */}
          <div className="bg-slate-900 dark:bg-[#111111] rounded-3xl p-8 border-2 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.15)] transform md:-translate-y-4 relative z-10">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest py-1 px-4 rounded-full shadow-md">
              El Más Popular
            </div>
            <h3 className="text-xl font-serif text-white mb-2 mt-2">Oro</h3>
            <p className="text-xs text-amber-200/70 mb-6 h-8">Cero colados. Seguridad total con tecnología QR.</p>
            <div className="text-4xl font-light text-amber-500 mb-8">
              $1,990 <span className="text-sm text-amber-500/50 font-normal">MXN</span>
            </div>
            <ul className="space-y-4 mb-8 text-sm text-slate-300">
              <li className="flex items-start"><Check size={16} className="text-amber-500 mr-2 shrink-0 mt-0.5"/> <b>Todo lo del Plata</b></li>
              <li className="flex items-start"><Check size={16} className="text-amber-500 mr-2 shrink-0 mt-0.5"/> Pases QR Únicos e Infértiles</li>
              <li className="flex items-start"><Check size={16} className="text-amber-500 mr-2 shrink-0 mt-0.5"/> RSVP Estricto por número de pases</li>
              <li className="flex items-start"><Check size={16} className="text-amber-500 mr-2 shrink-0 mt-0.5"/> Escáner de Puerta para Hostess</li>
              <li className="flex items-start"><Check size={16} className="text-amber-500 mr-2 shrink-0 mt-0.5"/> Panel de Presupuesto</li>
            </ul>
            <button className="w-full py-4 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-lg">
              Comprar Paquete Oro
            </button>
          </div>

          {/* PAQUETE 4: DIAMANTE */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-8 border border-slate-200 dark:border-white/5 shadow-lg hover:shadow-xl transition-shadow relative">
            <h3 className="text-xl font-serif text-slate-900 dark:text-white mb-2">Diamante VIP</h3>
            <p className="text-xs text-slate-500 mb-6 h-8">La suite definitiva para Planners y eventos TOP.</p>
            <div className="text-3xl font-light text-slate-900 dark:text-white mb-8">
              $2,990 <span className="text-sm text-slate-400 font-normal">MXN</span>
            </div>
            <ul className="space-y-4 mb-8 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start"><Check size={16} className="text-amber-500 mr-2 shrink-0 mt-0.5"/> <b>Todo lo del Oro</b></li>
              <li className="flex items-start"><Check size={16} className="text-amber-500 mr-2 shrink-0 mt-0.5"/> Acomodo de Mesas Visual 3D</li>
              <li className="flex items-start"><Check size={16} className="text-amber-500 mr-2 shrink-0 mt-0.5"/> Muro Social (Proyección en Vivo)</li>
              <li className="flex items-start"><Check size={16} className="text-amber-500 mr-2 shrink-0 mt-0.5"/> Bocetador Decorativo</li>
            </ul>
            <button className="w-full py-3 rounded-full border border-slate-300 dark:border-white/20 text-slate-800 dark:text-white text-xs font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              Iniciar Draft VIP
            </button>
          </div>

        </div>
      </div>

      {/* 🔴 BENTO BOX: INVITACIONES INTERACTIVAS */}
      <section id="experiencia" className="py-24 px-4 md:px-8 max-w-7xl mx-auto relative z-10">
        <div className="mb-16">
          <span className="text-amber-600 dark:text-amber-500 font-bold tracking-widest uppercase text-xs mb-4 block">Fase 1: La Invitación</span>
          <h2 className="text-4xl md:text-5xl font-editorial font-medium text-slate-900 dark:text-white tracking-tight transition-colors duration-700">Más que una invitación.<br/><span className="italic text-slate-500 dark:text-slate-400">Una experiencia táctil.</span></h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[280px]">
          {/* TARJETA 1: GALERÍA Y MONOGRAMA */}
          <div className="md:col-span-2 md:row-span-2 bg-white dark:bg-[#0a0a0a] rounded-[2.5rem] p-10 md:p-12 border border-slate-200 dark:border-white/10 flex flex-col justify-end relative overflow-hidden group shadow-sm dark:shadow-none transition-colors duration-700">
            <div className={`absolute inset-0 opacity-5 dark:opacity-10 transition-colors duration-700 ${accentThemes[accentColor].bg}`}></div>
            <div className="absolute top-10 right-0 md:right-10 w-full md:w-56 h-64 pointer-events-none perspective-[1000px] flex items-center justify-center">
               <img src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Galeria 1" className="absolute w-40 h-52 object-cover rounded-xl border-[4px] border-white dark:border-[#111] transform rotate-[10deg] translate-x-12 translate-y-4 group-hover:rotate-[20deg] group-hover:translate-x-20 shadow-xl transition-all duration-700 ease-out" />
               <img src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Galeria 2" className="absolute w-40 h-52 object-cover rounded-xl border-[4px] border-white dark:border-[#111] transform -rotate-[5deg] group-hover:-rotate-[12deg] group-hover:-translate-x-8 shadow-xl transition-all duration-700 ease-out z-10" />
               <div className={`absolute z-20 font-monogram text-5xl md:text-6xl drop-shadow-xl transition-colors duration-700 ${accentThemes[accentColor].text} transform group-hover:scale-110`}>Ana & Rodrigo</div>
            </div>
            <div className="absolute top-10 left-10 flex gap-2 p-2 bg-white/80 dark:bg-black/40 backdrop-blur-md rounded-full border border-slate-200 dark:border-white/10 z-30 shadow-sm">
               <button onMouseEnter={()=>setAccentColor('amber')} className={`w-5 h-5 rounded-full bg-amber-500 transition-all ${accentColor === 'amber' ? 'scale-125 ring-2 ring-offset-2 ring-amber-500 dark:ring-offset-[#0a0a0a]' : 'hover:scale-110'}`}></button>
               <button onMouseEnter={()=>setAccentColor('rose')} className={`w-5 h-5 rounded-full bg-rose-500 transition-all ${accentColor === 'rose' ? 'scale-125 ring-2 ring-offset-2 ring-rose-500 dark:ring-offset-[#0a0a0a]' : 'hover:scale-110'}`}></button>
               <button onMouseEnter={()=>setAccentColor('emerald')} className={`w-5 h-5 rounded-full bg-emerald-500 transition-all ${accentColor === 'emerald' ? 'scale-125 ring-2 ring-offset-2 ring-emerald-500 dark:ring-offset-[#0a0a0a]' : 'hover:scale-110'}`}></button>
               <button onMouseEnter={()=>setAccentColor('indigo')} className={`w-5 h-5 rounded-full bg-indigo-500 transition-all ${accentColor === 'indigo' ? 'scale-125 ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-[#0a0a0a]' : 'hover:scale-110'}`}></button>
            </div>
            <div className="relative z-30 w-full md:w-3/4">
               <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 leading-tight transition-colors duration-500">Diseño Inmersivo</h3>
               <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed transition-colors duration-500">Galerías fotográficas, logotipos manuscritos y paletas de color <b>adaptativas</b> que reflejan la elegancia de tu evento.</p>
            </div>
          </div>

          {/* TARJETA 2: CUENTA REGRESIVA */}
          <div className="md:col-span-2 bg-slate-100 dark:bg-[#0a0a0a] rounded-[2.5rem] p-8 md:p-10 border border-slate-200 dark:border-white/10 flex items-center justify-between relative overflow-hidden group shadow-sm dark:shadow-none transition-colors duration-700">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">Cuenta Regresiva</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-[200px] transition-colors">El latido de tu evento en tiempo real.</p>
            </div>
            <div className="flex gap-2 text-center relative z-10">
              <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 w-16 shadow-sm transition-colors">
                <span className="block text-2xl font-light text-slate-800 dark:text-white">{String(timeLeft.d).padStart(2, '0')}</span>
                <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-1 block">Días</span>
              </div>
              <div className="text-slate-300 dark:text-white/20 font-light text-3xl mt-2">:</div>
              <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 w-16 shadow-sm transition-colors">
                <span className="block text-2xl font-light text-slate-800 dark:text-white">{String(timeLeft.h).padStart(2, '0')}</span>
                <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-1 block">Hrs</span>
              </div>
              <div className="text-slate-300 dark:text-white/20 font-light text-3xl mt-2">:</div>
              <div className="bg-slate-900 dark:bg-white rounded-2xl p-4 w-16 shadow-lg transform scale-110 transition-colors">
                <span className="block text-2xl font-light text-white dark:text-slate-900">{String(timeLeft.s).padStart(2, '0')}</span>
                <span className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold mt-1 block">Seg</span>
              </div>
            </div>
          </div>

          {/* TARJETA 3: RSVP */}
          <div onMouseEnter={() => setFakeRsvp(true)} onMouseLeave={() => setFakeRsvp(false)} className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 flex flex-col justify-between relative overflow-hidden transform hover:scale-[1.02] transition-all shadow-sm dark:shadow-none cursor-pointer group">
             <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <div className="flex justify-between items-start relative z-10">
               <div>
                 <h3 className="text-2xl font-bold leading-tight mb-2 text-slate-900 dark:text-white">RSVP<br/>Inteligente</h3>
                 <p className="text-slate-500 dark:text-slate-400 text-sm">Pasa el cursor / Toca</p>
               </div>
               <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm border transition-colors duration-500 ${fakeRsvp ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10'}`}>
                 {fakeRsvp ? <CheckCircle size={24} className="text-white animate-in zoom-in duration-300"/> : <UserPlus size={24} className="text-slate-400"/>}
               </div>
             </div>
          </div>

          {/* TARJETA 4: MAPA */}
          <div className="bg-slate-50 dark:bg-[#0a0a0a] rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/10 flex flex-col justify-between relative overflow-hidden group shadow-sm dark:shadow-none transition-colors duration-700">
             <div className="absolute inset-0 opacity-[0.03] dark:opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMWgyMHYyMEgxVjF6IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS1vcGFjaXR5PSIwLjIiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')]"></div>
             <div className="absolute right-8 top-8 w-12 h-12 flex items-center justify-center">
                <span className="absolute inline-flex h-full w-full rounded-full bg-slate-400 dark:bg-white opacity-20 animate-ping"></span>
                <div className="relative w-3 h-3 bg-slate-800 dark:bg-white rounded-full shadow-lg"></div>
             </div>
             <div className="relative z-10 mt-auto">
               <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">Logística GPS</h3>
               <p className="text-slate-500 dark:text-slate-400 text-sm max-w-[200px] transition-colors">Rutas precisas a la ceremonia y recepción.</p>
             </div>
          </div>

          {/* TARJETA 5: PASES QR */}
          <div className="md:col-span-2 bg-slate-900 dark:bg-white rounded-[2.5rem] p-8 md:p-10 border border-transparent flex items-center justify-between relative overflow-hidden group shadow-xl transition-colors duration-700">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
             <div className="relative z-10 max-w-[200px] md:max-w-[280px]">
               <h3 className="text-2xl font-bold text-white dark:text-slate-900 mb-2 flex items-center transition-colors"><QrCode size={24} className="mr-2 opacity-70"/> Accesos QR</h3>
               <p className="text-slate-400 dark:text-slate-500 text-sm transition-colors">Cada invitado recibe un boleto digital único e intransferible. Adiós a los colados.</p>
             </div>
             <div className="relative z-10 w-24 h-24 bg-white dark:bg-slate-100 rounded-3xl p-3 shadow-lg group-hover:scale-105 transition-transform flex items-center justify-center">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VIP-PASS-123`} alt="QR Code VIP" className="w-full h-full mix-blend-multiply opacity-80" />
             </div>
          </div>

          {/* TARJETA 6: MESA REGALOS */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/10 flex flex-col justify-between group hover:border-slate-300 dark:hover:border-white/20 transition-colors relative overflow-hidden shadow-sm dark:shadow-none">
             <div className="w-12 h-12 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:-translate-y-1 transition-transform border border-slate-100 dark:border-white/5">
               <Wallet size={20} className="text-slate-700 dark:text-slate-300" />
             </div>
             <div className="relative z-10">
               <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 transition-colors">Mesa de Regalos</h3>
               <p className="text-slate-500 dark:text-slate-400 text-sm transition-colors">Recibe efectivo directo en tus cuentas, sin comisiones.</p>
             </div>
          </div>

          {/* TARJETA 7: ITINERARIO */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/10 flex flex-col justify-between group hover:border-slate-300 dark:hover:border-white/20 transition-colors relative overflow-hidden shadow-sm dark:shadow-none">
             <div className="space-y-3 mb-6 relative z-10 opacity-70 group-hover:opacity-100 transition-opacity">
               <div className="flex items-center gap-3"><div className="w-2 h-2 bg-amber-500 rounded-full"></div><div className="h-1 w-16 bg-slate-200 dark:bg-white/20 rounded-full"></div></div>
               <div className="flex items-center gap-3"><div className="w-2 h-2 border border-slate-400 rounded-full"></div><div className="h-1 w-12 bg-slate-100 dark:bg-white/10 rounded-full"></div></div>
               <div className="flex items-center gap-3"><div className="w-2 h-2 border border-slate-400 rounded-full"></div><div className="h-1 w-20 bg-slate-100 dark:bg-white/10 rounded-full"></div></div>
             </div>
             <div className="relative z-10">
               <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 transition-colors">Itinerario</h3>
               <p className="text-slate-500 dark:text-slate-400 text-sm transition-colors">El minuto a minuto elegante y ordenado.</p>
             </div>
          </div>

        </div>
      </section>

      {/* 🔴 SECCIÓN: EL PANEL (BÓVEDA) */}
      <section id="boveda" className="py-32 relative z-10 border-y border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/50 transition-colors duration-700">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2">
              <span className="text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase text-xs mb-4 block flex items-center"><Lock size={14} className="mr-2"/> Fase 2: La Ejecución</span>
              <h2 className="text-4xl md:text-5xl font-editorial font-medium text-slate-900 dark:text-white mb-8 tracking-tight leading-tight transition-colors">Tu evento, bajo tu <span className="italic text-slate-500">dominio absoluto.</span></h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg mb-10 font-light leading-relaxed transition-colors">Olvídate de los excels desordenados y las libretas perdidas. Baulia te entrega el Centro de Comando para administrar cada detalle desde tu iPad o computadora.</p>
              
              <div className="space-y-8">
                {[
                  { i: <LayoutGrid strokeWidth={1.5}/>, t: 'Acomodo de Mesas Visual', d: 'Dibuja el croquis del salón y arrastra a tus invitados a sus sillas.' },
                  { i: <Scan strokeWidth={1.5}/>, t: 'Check-in con Escáner QR', d: 'Tus accesos son blindados. El staff escanea la pulsera en la entrada.' },
                  { i: <Wallet strokeWidth={1.5}/>, t: 'Inteligencia Financiera', d: 'Controla pagos, abonos a proveedores y fechas límite.' },
                  { i: <Camera strokeWidth={1.5}/>, t: 'Muro Social en Vivo', d: 'Las fotos que suben tus invitados se proyectan al instante.' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start">
                    <div className="w-12 h-12 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-800 dark:text-white shrink-0 mr-6 shadow-sm dark:shadow-none transition-colors">
                      {item.i}
                    </div>
                    <div className="pt-1">
                      <h4 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-1 transition-colors">{item.t}</h4>
                      <p className="text-slate-500 dark:text-slate-500 text-sm leading-relaxed transition-colors">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:w-1/2 w-full relative perspective-[1000px]">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 dark:from-indigo-500/20 to-amber-500/10 dark:to-amber-500/20 blur-[120px] rounded-full pointer-events-none transition-colors"></div>
              <div className="bg-white dark:bg-[#0a0a0a] rounded-[2rem] border border-slate-200 dark:border-white/10 p-3 shadow-2xl dark:shadow-[0_30px_80px_rgba(0,0,0,0.8)] relative z-10 transform md:rotate-y-[-5deg] md:rotate-x-[2deg] hover:rotate-y-0 hover:rotate-x-0 transition-all duration-1000">
                <div className="bg-slate-50 dark:bg-slate-950 rounded-[1.5rem] border border-slate-100 dark:border-white/5 h-[500px] w-full overflow-hidden flex flex-col relative transition-colors">
                   <div className="h-12 border-b border-slate-200 dark:border-white/5 flex items-center px-4 gap-2 bg-white dark:bg-black/50 shrink-0 transition-colors">
                     <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                     <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                     <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                   </div>
                   <div className="flex-1 p-4 flex gap-4">
                     <div className="w-1/4 h-full bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 flex flex-col gap-3 p-3 transition-colors shadow-sm dark:shadow-none">
                        <div className="w-full h-6 bg-slate-100 dark:bg-white/10 rounded-md mb-2 transition-colors"></div>
                        <div className="w-3/4 h-3 bg-slate-100 dark:bg-white/5 rounded-full transition-colors"></div>
                        <div className="w-full h-3 bg-slate-100 dark:bg-white/5 rounded-full transition-colors"></div>
                     </div>
                     <div className="flex-1 flex flex-col gap-4">
                       <div className="flex gap-3 h-20 shrink-0">
                         <div className="flex-1 bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-300 dark:text-slate-600 transition-colors shadow-sm dark:shadow-none"><Users size={20}/></div>
                         <div className="flex-1 bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-300 dark:text-slate-600 transition-colors shadow-sm dark:shadow-none"><Wallet size={20}/></div>
                       </div>
                       <div className="flex-1 bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 flex items-center justify-center relative overflow-hidden transition-colors shadow-sm dark:shadow-none">
                          <BauliaLogo size={60} className="opacity-5 dark:opacity-10 absolute text-slate-900 dark:text-white" />
                       </div>
                     </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🔴 SECCIÓN: TESTIMONIOS (CONECTADOS A FIREBASE) */}
      <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <span className="text-amber-600 dark:text-amber-500 font-bold tracking-widest uppercase text-xs mb-4 block">El Estándar de la Industria</span>
          <h2 className="text-4xl md:text-5xl font-editorial font-medium text-slate-900 dark:text-white tracking-tight transition-colors duration-700">Lo que dicen de nosotros.</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {liveReviews.length > 0 ? (
             /* MUESTRA LAS RESEÑAS REALES DE TUS CLIENTES */
             liveReviews.slice(0, 3).map((review, idx) => (
               <div key={review.id} className={`bg-white dark:bg-[#0a0a0a] rounded-[2rem] p-8 border border-slate-200 dark:border-white/10 flex flex-col justify-between shadow-sm dark:shadow-none transition-colors duration-500 relative ${idx === 1 ? 'transform lg:-translate-y-4 shadow-xl dark:bg-slate-900 dark:border-slate-800' : ''}`}>
                  <Quote className="absolute top-8 right-8 text-slate-100 dark:text-white/5" size={48} />
                  <div className="flex gap-1 mb-6">
                    {[1,2,3,4,5].map(star => <Star key={star} size={16} className={review.rating >= star ? "fill-amber-500 text-amber-500" : "text-slate-200 dark:text-slate-800"}/>)}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-lg font-light leading-relaxed mb-8 relative z-10 italic">
                    "{review.comment}"
                  </p>
                  <div className="flex items-center gap-4 border-t border-slate-100 dark:border-white/5 pt-4">
                     <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-500 flex items-center justify-center font-bold text-lg font-editorial">
                        {review.authorName.charAt(0)}
                     </div>
                     <div>
                       <h4 className="font-bold text-slate-900 dark:text-white text-sm">{review.authorName}</h4>
                       <p className="text-[10px] text-slate-500 uppercase tracking-widest">{review.authorType}</p>
                     </div>
                  </div>
               </div>
             ))
           ) : (
             /* SI NO HAS APROBADO NINGUNA, MUESTRA ESTAS 3 POR DEFECTO PARA QUE NO SE VEA VACÍO */
             <>
               <div className="bg-white dark:bg-[#0a0a0a] rounded-[2rem] p-8 border border-slate-200 dark:border-white/10 flex flex-col justify-between shadow-sm dark:shadow-none transition-colors duration-500 relative">
                  <Quote className="absolute top-8 right-8 text-slate-100 dark:text-white/5" size={48} />
                  <div className="flex gap-1 mb-6"><Star size={16} className="fill-amber-500 text-amber-500"/><Star size={16} className="fill-amber-500 text-amber-500"/><Star size={16} className="fill-amber-500 text-amber-500"/><Star size={16} className="fill-amber-500 text-amber-500"/><Star size={16} className="fill-amber-500 text-amber-500"/></div>
                  <p className="text-slate-600 dark:text-slate-300 text-lg font-light leading-relaxed mb-8 relative z-10 italic">"Usar Baulia fue la mejor decisión para nuestra boda. La invitación quedó hermosa y todo fue automatizado."</p>
                  <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center font-bold text-slate-500">S</div><div><h4 className="font-bold text-slate-900 dark:text-white text-sm">Sofía & Mauricio</h4><p className="text-[10px] text-slate-500 uppercase tracking-widest">Anfitriones</p></div></div>
               </div>
               <div className="bg-slate-900 dark:bg-white rounded-[2rem] p-8 border border-transparent flex flex-col justify-between shadow-xl transition-colors duration-500 relative transform lg:-translate-y-4">
                  <Quote className="absolute top-8 right-8 text-white/5 dark:text-slate-900/5" size={48} />
                  <div className="flex gap-1 mb-6"><Star size={16} className="fill-amber-500 text-amber-500"/><Star size={16} className="fill-amber-500 text-amber-500"/><Star size={16} className="fill-amber-500 text-amber-500"/><Star size={16} className="fill-amber-500 text-amber-500"/><Star size={16} className="fill-amber-500 text-amber-500"/></div>
                  <p className="text-slate-300 dark:text-slate-700 text-lg font-light leading-relaxed mb-8 relative z-10 italic">"Como Planner, esta plataforma me ahorra 15 horas de logística. El escáner de QR en la puerta nos da un control brutal."</p>
                  <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-white/20 dark:bg-slate-900/10 flex items-center justify-center font-editorial text-white dark:text-slate-900 text-lg font-bold">EG</div><div><h4 className="font-bold text-white dark:text-slate-900 text-sm">Estudio Gala</h4><p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">Agencia Planner</p></div></div>
               </div>
               <div className="bg-white dark:bg-[#0a0a0a] rounded-[2rem] p-8 border border-slate-200 dark:border-white/10 flex flex-col justify-between shadow-sm dark:shadow-none transition-colors duration-500 relative">
                  <Quote className="absolute top-8 right-8 text-slate-100 dark:text-white/5" size={48} />
                  <div className="flex gap-1 mb-6"><Star size={16} className="fill-amber-500 text-amber-500"/><Star size={16} className="fill-amber-500 text-amber-500"/><Star size={16} className="fill-amber-500 text-amber-500"/><Star size={16} className="fill-amber-500 text-amber-500"/><Star size={16} className="fill-amber-500 text-amber-500"/></div>
                  <p className="text-slate-600 dark:text-slate-300 text-lg font-light leading-relaxed mb-8 relative z-10 italic">"El Muro Social proyectado fue la sensación. Además, la mesa de regalos en efectivo directo a mi cuenta nos salvó."</p>
                  <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center font-bold text-slate-500">F</div><div><h4 className="font-bold text-slate-900 dark:text-white text-sm">Familia Torres</h4><p className="text-[10px] text-slate-500 uppercase tracking-widest">Anfitriones</p></div></div>
               </div>
             </>
           )}
        </div>
      </section>

      {/* 🔴 SECCIÓN B2B: PLANNERS */}
      <section id="planners" className="py-24 relative z-10 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10">
          <div className="bg-slate-900 dark:bg-[#0a0a0a] rounded-[3rem] p-10 md:p-20 border border-slate-800 dark:border-white/10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between shadow-2xl transition-colors duration-700">
             <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 dark:bg-white/5 rounded-full blur-[100px] pointer-events-none transition-colors duration-700"></div>
             
             <div className="md:w-1/2 relative z-10 mb-12 md:mb-0">
               <span className="text-slate-400 font-bold tracking-widest uppercase text-xs mb-4 block">Alianza B2B</span>
               <h2 className="text-4xl md:text-5xl font-editorial font-medium text-white mb-6 leading-tight">¿Eres Wedding Planner <br/> o Agencia?</h2>
               <p className="text-slate-400 text-lg mb-8 font-light leading-relaxed">
                 Ofrece el software de Baulia a tus clientes bajo <b className="text-white">tu propia marca</b> (White-Label). Tus colores, tu logotipo y gestión multievento para elevar el valor de tus servicios.
               </p>
               <button onClick={() => window.open('https://wa.me/525512345678?text=Hola,%20soy%20Planner%20y%20quiero%20usar%20Baulia', '_blank')} className="px-8 py-4 bg-white text-slate-900 font-bold rounded-full hover:scale-105 transition-all text-sm uppercase tracking-widest shadow-xl">
                 Solicitar Licencia Planner
               </button>
             </div>

             <div className="md:w-5/12 relative z-10 flex justify-center w-full">
                <div className="w-full max-w-sm bg-[#050505] rounded-[2rem] border border-white/10 p-8 shadow-2xl transform md:rotate-2 hover:rotate-0 transition-all duration-700">
                   <div className="flex items-center gap-5 mb-10 border-b border-white/10 pb-6">
                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white font-serif italic text-xl">E</div>
                      <div>
                        <p className="text-white font-bold text-lg leading-tight">Elite Bodas</p>
                        <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">Panel Maestro Pro</p>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div className="h-10 bg-white/5 rounded-xl border border-white/5 w-full flex items-center px-4"><div className="w-2 h-2 rounded-full bg-white/20 mr-3"></div><div className="h-2 w-24 bg-white/10 rounded-full"></div></div>
                      <div className="h-10 bg-white/5 rounded-xl border border-white/5 w-4/5 flex items-center px-4"><div className="w-2 h-2 rounded-full bg-white/20 mr-3"></div><div className="h-2 w-16 bg-white/10 rounded-full"></div></div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* 🔴 SECCIÓN: COLECCIÓN DE PLANES */}
      <section id="planes" className="py-32 px-4 md:px-8 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-editorial font-medium text-slate-900 dark:text-white mb-4 tracking-tight transition-colors duration-700">Colección Baulia</h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto font-light transition-colors duration-700">Inversiones a la medida de tu celebración. Único pago por evento, el panel es tuyo hasta el día de la fiesta.</p>
        </div>

        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-4 items-end">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-[2rem] p-8 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-colors h-max shadow-sm dark:shadow-none">
            <h3 className="text-slate-900 dark:text-white font-bold text-xl mb-1 transition-colors">Básica</h3>
            <p className="text-slate-500 dark:text-slate-500 text-xs mb-8 h-8 transition-colors">La esencia digital para eventos íntimos.</p>
            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-light mb-10 transition-colors">
              <p className="flex items-center text-slate-800 dark:text-slate-200"><span className="w-1 h-1 rounded-full bg-slate-400 mr-3"></span> Invitación Interactiva</p>
              <p className="flex items-center text-slate-800 dark:text-slate-200"><span className="w-1 h-1 rounded-full bg-slate-400 mr-3"></span> Confirmación Simple</p>
              <p className="flex items-center"><span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mr-3"></span> Cuenta Regresiva</p>
              <p className="flex items-center"><span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mr-3"></span> Mapas GPS</p>
            </div>
            <button onClick={() => window.open('https://wa.me/525512345678?text=Hola,%20me%20interesa%20el%20plan%20Básica', '_blank')} className="w-full py-4 rounded-full bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-white font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-xs uppercase tracking-widest">Adquirir Básica</button>
          </div>

          <div className="bg-white dark:bg-[#0a0a0a] rounded-[2rem] p-8 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-colors h-max shadow-sm dark:shadow-none">
            <h3 className="text-slate-900 dark:text-white font-bold text-xl mb-1 transition-colors">Plata</h3>
            <p className="text-slate-500 dark:text-slate-500 text-xs mb-8 h-8 transition-colors">Ideal para control de regalos y hospedaje.</p>
            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-light mb-10 transition-colors">
              <p className="text-slate-900 dark:text-white font-bold border-b border-slate-100 dark:border-white/5 pb-3 mb-3">Todo en Básica, más:</p>
              <p className="flex items-center text-slate-800 dark:text-slate-200"><span className="w-1 h-1 rounded-full bg-slate-400 mr-3"></span> Itinerario Visual</p>
              <p className="flex items-center text-slate-800 dark:text-slate-200"><span className="w-1 h-1 rounded-full bg-slate-400 mr-3"></span> Mesa de Regalos</p>
              <p className="flex items-center"><span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mr-3"></span> Dress Code</p>
            </div>
            <button onClick={() => window.open('https://wa.me/525512345678?text=Hola,%20me%20interesa%20el%20plan%20Plata', '_blank')} className="w-full py-4 rounded-full bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-white font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-xs uppercase tracking-widest">Adquirir Plata</button>
          </div>

          <div className="bg-slate-900 dark:bg-white rounded-[2rem] p-[2px] shadow-2xl transform lg:-translate-y-4 relative z-10 h-max transition-colors duration-700">
            <div className="bg-slate-900 dark:bg-[#050505] rounded-[1.9rem] p-8 h-full flex flex-col relative overflow-hidden transition-colors duration-700">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 dark:bg-white/10 rounded-full blur-[40px]"></div>
              <span className="bg-white text-slate-900 dark:bg-white dark:text-slate-900 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full w-max mb-6">El más popular</span>
              <h3 className="text-white dark:text-white font-bold text-2xl mb-1 transition-colors">Plan Oro</h3>
              <p className="text-slate-400 text-xs mb-8 h-8 transition-colors">Control estricto de accesos y finanzas.</p>
              
              <div className="space-y-4 text-sm text-slate-300 font-light mb-10 flex-1 transition-colors">
                <p className="text-white font-bold border-b border-white/10 pb-3 mb-3">Todo en Plata, más:</p>
                <p className="flex items-start"><span className="w-1 h-1 rounded-full bg-white mr-3 mt-2 shrink-0"></span> <span className="text-white font-medium">Pases QR (Escáner Puerta)</span></p>
                <p className="flex items-start"><span className="w-1 h-1 rounded-full bg-white mr-3 mt-2 shrink-0"></span> <span>RSVP Estricto (No colados)</span></p>
                <p className="flex items-start"><span className="w-1 h-1 rounded-full bg-slate-600 mr-3 mt-2 shrink-0"></span> <span>Panel de Presupuesto</span></p>
              </div>
              <button onClick={() => window.open('https://wa.me/525512345678?text=Hola,%20me%20interesa%20el%20plan%20Oro', '_blank')} className="w-full py-4 rounded-full bg-white text-slate-900 font-bold hover:bg-slate-200 transition-colors text-xs uppercase tracking-widest">Adquirir Oro</button>
            </div>
          </div>

          <div className="bg-slate-100 dark:bg-[#0a0a0a] rounded-[2rem] p-8 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-colors h-max shadow-sm dark:shadow-none">
            <h3 className="text-slate-900 dark:text-white font-bold text-xl mb-1 transition-colors">Diamante VIP</h3>
            <p className="text-slate-500 text-xs mb-8 h-8 transition-colors">La suite tecnológica extrema para tu boda.</p>
            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-light mb-10 transition-colors">
              <p className="text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-white/5 pb-3 mb-3">Todo en Oro, más:</p>
              <p className="flex items-start"><span className="w-1 h-1 rounded-full bg-slate-400 mr-3 mt-2 shrink-0"></span> <span className="text-slate-800 dark:text-slate-200">Acomodo de Mesas Visual</span></p>
              <p className="flex items-start"><span className="w-1 h-1 rounded-full bg-slate-400 mr-3 mt-2 shrink-0"></span> <span className="text-slate-800 dark:text-slate-200">Muro Social (Proyector)</span></p>
              <p className="flex items-start"><span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mr-3 mt-2 shrink-0"></span> <span>Bocetador Decorativo</span></p>
            </div>
            <button onClick={() => window.open('https://wa.me/525512345678?text=Hola,%20me%20interesa%20el%20plan%20Diamante', '_blank')} className="w-full py-4 rounded-full bg-slate-900 dark:bg-white/10 text-white font-bold hover:bg-slate-800 dark:hover:bg-white/20 transition-colors text-xs uppercase tracking-widest">Adquirir Diamante</button>
          </div>

        </div>
      </section>

      {/* 🔴 PREGUNTAS FRECUENTES (FAQ) */}
      <section id="faq" className="py-24 px-4 md:px-8 max-w-4xl mx-auto relative z-10">
         <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-editorial font-medium text-slate-900 dark:text-white mb-4 transition-colors">Preguntas Frecuentes</h2>
         </div>
         <div className="space-y-2">
            {[
               { q: '¿Mis invitados tienen que descargar alguna App?', a: 'No, cero descargas. Todo funciona fluidamente desde el navegador de cualquier celular inteligente (Safari o Chrome).' },
               { q: '¿Qué significa que el pase QR es estricto en el Plan Oro?', a: 'Si asignas 2 pases a una familia, el sistema solo generará un QR válido para 2 escaneos en la puerta, evitando invitados sorpresa automáticamente.' },
               { q: '¿Por cuánto tiempo tendré acceso a mi panel?', a: 'Tendrás acceso total a tu panel desde el día de tu compra hasta 30 días naturales después de la fecha de tu evento, permitiendo descargar tus fotos y reportes.' },
               { q: '¿Soy Planner, puedo usar el mismo panel para varias bodas?', a: '¡Sí! Contamos con licencias B2B. Gestiona ilimitadas bodas al mismo tiempo bajo tu propia marca corporativa.' }
            ].map((faq, idx) => (
               <details key={idx} className="group bg-transparent border-b border-slate-200 dark:border-white/10 py-6 transition-colors duration-300 cursor-pointer">
                 <summary className="font-bold text-base text-slate-800 dark:text-white list-none flex justify-between items-center select-none outline-none transition-colors">
                   {faq.q}
                   <span className="text-slate-400 group-open:rotate-45 transition-transform duration-300"><Plus size={20} /></span>
                 </summary>
                 <p className="mt-4 text-slate-500 dark:text-slate-400 leading-relaxed text-sm font-light animate-in fade-in transition-colors pr-8">
                   {faq.a}
                 </p>
               </details>
            ))}
         </div>
      </section>

      {/* 🔴 FOOTER VIP EDITORIAL */}
      <footer className="border-t border-slate-200 dark:border-white/5 bg-white dark:bg-[#050505] pt-20 pb-10 relative z-10 transition-colors duration-700">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
           <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                 <BauliaLogo className="h-10 w-auto" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-light leading-relaxed max-w-sm mb-8 transition-colors">Software de gestión de élite. <br/>Elegancia en la invitación, poder absoluto en la ejecución.</p>
              
              <div className="flex space-x-3">
                 <button onClick={() => window.open('https://instagram.com/TU_PERFIL', '_blank')} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" title="Instagram">
                   <IconIG />
                 </button>
                 <button onClick={() => window.open('https://facebook.com/TU_PERFIL', '_blank')} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" title="Facebook">
                   <IconFB />
                 </button>
                 <button onClick={() => window.open('https://tiktok.com/@TU_PERFIL', '_blank')} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" title="TikTok">
                   <IconTK />
                 </button>
                 <button onClick={() => window.open('https://wa.me/525500000000', '_blank')} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" title="WhatsApp">
                   <IconWA />
                 </button>
              </div>
           </div>
           
           <div>
              <h4 className="text-slate-900 dark:text-white font-bold mb-6 tracking-widest uppercase text-[10px] transition-colors">Plataforma</h4>
              <ul className="space-y-4 text-xs text-slate-500 font-medium transition-colors">
                 <li><a href="#experiencia" className="hover:text-slate-900 dark:hover:text-white transition-colors">Características</a></li>
                 <li><a href="#planes" className="hover:text-slate-900 dark:hover:text-white transition-colors">Colección</a></li>
                 <li><a href="#planners" className="hover:text-slate-900 dark:hover:text-white transition-colors">Para Planners</a></li>
                 <li><button onClick={() => window.location.href = 'https://panel.baulia.com'} className="hover:text-slate-900 dark:hover:text-white transition-colors">Login Clientes</button></li>
              </ul>
           </div>
           
           <div>
              <h4 className="text-slate-900 dark:text-white font-bold mb-6 tracking-widest uppercase text-[10px] transition-colors">Compañía</h4>
              <ul className="space-y-4 text-xs text-slate-500 font-medium transition-colors">
                 <li><button onClick={() => setLegalModal('about')} className="hover:text-slate-900 dark:hover:text-white transition-colors">La Visión Baulia</button></li>
                 <li><button onClick={() => window.open('mailto:hola@baulia.com')} className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center">hola@baulia.com</button></li>
              </ul>
           </div>

           <div>
              <h4 className="text-slate-900 dark:text-white font-bold mb-6 tracking-widest uppercase text-[10px] transition-colors">Legal</h4>
              <ul className="space-y-4 text-xs text-slate-500 font-medium transition-colors">
                 <li><button onClick={() => setLegalModal('terms')} className="hover:text-slate-900 dark:hover:text-white transition-colors">Términos de Servicio</button></li>
                 <li><button onClick={() => setLegalModal('privacy')} className="hover:text-slate-900 dark:hover:text-white transition-colors">Aviso de Privacidad</button></li>
              </ul>
           </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 border-t border-slate-200 dark:border-white/5 pt-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4 transition-colors">
           <p className="text-[9px] text-slate-400 uppercase tracking-widest transition-colors">&copy; {new Date().getFullYear()} Baulia Technologies.</p>
           <p className="text-[9px] text-slate-500 font-bold flex items-center uppercase tracking-widest transition-colors">Hecho con <Heart size={10} className="mx-1.5 fill-slate-300 dark:fill-slate-700 text-slate-300 dark:text-slate-700"/> en México.</p>
        </div>
      </footer>

      {/* 🔴 MODALES LEGALES Y ACERCA DE (OVERLAYS) */}
      {legalModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/80 dark:bg-slate-900/90 backdrop-blur-md flex justify-center items-center p-4 md:p-8 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 w-full max-w-3xl h-[80vh] rounded-[2rem] shadow-2xl flex flex-col relative overflow-hidden animate-in zoom-in-95 transition-colors duration-300">
            
            <div className="p-6 md:p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-[#050505] shrink-0 transition-colors">
              <h2 className="text-xl font-editorial font-bold text-slate-900 dark:text-white tracking-wide transition-colors">
                {legalModal === 'terms' ? 'Términos de Servicio' : legalModal === 'privacy' ? 'Aviso de Privacidad' : 'La Visión Baulia'}
              </h2>
              <button onClick={() => setLegalModal(null)} className="p-2 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors text-slate-500 border border-slate-200 dark:border-transparent">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-6 md:p-10 overflow-y-auto flex-1 text-slate-600 dark:text-slate-400 text-sm leading-relaxed space-y-6 custom-scrollbar transition-colors font-light">
              {legalModal === 'terms' ? (
                <>
                  <p><strong>Última actualización:</strong> {new Date().toLocaleDateString('es-MX')}</p>
                  <p>Bienvenido a Baulia. Estos Términos de Servicio ("Términos") regulan el uso de nuestra plataforma web, panel de control y servicios relacionados. Al acceder o utilizar Baulia, usted ("el Usuario", "el Cliente" o "el Planner") acepta estar sujeto a estos Términos.</p>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-8 mb-2 font-editorial transition-colors">1. Descripción del Servicio</h3>
                  <p>Baulia provee un entorno digital (Software as a Service) para la gestión y logística de eventos, que incluye pero no se limita a: creación de invitaciones web, gestión de confirmaciones (RSVP), acomodo de mesas, control financiero, muros sociales interactivos y escaneo de pases QR.</p>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-8 mb-2 font-editorial transition-colors">2. Pagos y Suscripciones</h3>
                  <p>El pago del Servicio consiste en una tarifa única por evento. La licencia otorga acceso al panel de control desde el momento del pago hasta 30 días naturales posteriores a la fecha del evento programado.</p>
                </>
              ) : legalModal === 'privacy' ? (
                <>
                  <p><strong>Última actualización:</strong> {new Date().toLocaleDateString('es-MX')}</p>
                  <p>En cumplimiento con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) de México, <strong>Baulia Technologies</strong> ("Baulia", "nosotros" o "nuestro") expide el presente Aviso de Privacidad.</p>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-8 mb-2 font-editorial transition-colors">1. Datos Recabados</h3>
                  <p>Para la correcta prestación de nuestros servicios de gestión de eventos, Baulia recaba los siguientes datos personales:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-2">
                    <li><strong>Del Administrador:</strong> Nombre, correo, teléfono y datos del evento.</li>
                    <li><strong>De los Invitados:</strong> Nombres, RSVP y fotografías subidas voluntariamente.</li>
                  </ul>
                </>
              ) : (
                <>
                  <div className="flex flex-col items-center text-center mb-12 mt-4">
                    <BauliaLogo className="h-12 w-auto mb-6 opacity-80" />
                    <h3 className="text-2xl font-editorial font-medium text-slate-900 dark:text-white tracking-widest uppercase transition-colors">El Estándar de Oro</h3>
                  </div>
                  <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 p-8 rounded-3xl mb-8 transition-colors">
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 font-editorial transition-colors">Nuestra Misión</h4>
                    <p className="leading-relaxed text-slate-700 dark:text-slate-300 transition-colors">
                      Transformar la gestión de eventos mediante tecnología premium, brindando a anfitriones y <i>planners</i> el <b>control absoluto</b>, y a los invitados una experiencia inolvidable.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 border border-slate-200 dark:border-white/5 rounded-2xl bg-white dark:bg-[#050505] transition-colors">
                      <span className="text-slate-900 dark:text-white font-bold text-xs block mb-1">01. Cero Caos</span>
                      <p className="text-xs">Diseñamos interfaces que reducen la ansiedad al mínimo.</p>
                    </div>
                    <div className="p-5 border border-slate-200 dark:border-white/5 rounded-2xl bg-white dark:bg-[#050505] transition-colors">
                      <span className="text-slate-900 dark:text-white font-bold text-xs block mb-1">02. Lujo Digital</span>
                      <p className="text-xs">El software debe ser tan elegante como el evento mismo.</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// ==========================================
// --- COMPONENTE: CENTRO DE LICENCIAS (RESTAURADO) Y MODERACIÓN ---
// ==========================================
const SuperAdminView = () => {
  const [adminTab, setAdminTab] = useState('licencias'); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ nombres: '', email: '', plan: 'diamante', tipoEvento: 'boda', role: 'cliente' });
  const [isCreating, setIsCreating] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [clientPhone, setClientPhone] = useState('');
  const [licencias, setLicencias] = useState([]);
  const [resenasList, setResenasList] = useState([]);
  const [correosVisibles, setCorreosVisibles] = useState({});

  const [dialog, setDialog] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: null });

  const tiposDeEvento = [
    { id: 'boda', label: 'Boda', placeholder: 'Ej. Carlos y Sofia', labelNombre: 'Nombre de los Novios' },
    { id: 'xv_anos', label: 'XV Años', placeholder: 'Ej. Maria Fernanda', labelNombre: 'Nombre de la Quinceañera' },
    { id: 'cumpleanos', label: 'Cumpleaños', placeholder: 'Ej. Juan Perez', labelNombre: 'Nombre del Festejado' },
    { id: 'bautizo', label: 'Bautizo', placeholder: 'Ej. Bautizo de Mateo', labelNombre: 'Nombre del Festejado' },
    { id: 'empresarial', label: 'Empresarial', placeholder: 'Ej. Convencion Telcel', labelNombre: 'Nombre de la Empresa' },
    { id: 'concierto', label: 'Concierto', placeholder: 'Ej. Festival Primavera', labelNombre: 'Nombre del Evento' },
    { id: 'otro', label: 'Otro Evento', placeholder: 'Ej. Graduacion', labelNombre: 'Nombre del Evento' }
  ];

  const eventoSeleccionado = tiposDeEvento.find(t => t.id === formData.tipoEvento);

  useEffect(() => {
    const unsubLic = onSnapshot(collection(db, "usuarios"), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const clientes = data.filter(u => u.role !== 'superadmin');
      clientes.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setLicencias(clientes);
    });

    const unsubRes = onSnapshot(collection(db, "resenas"), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setResenasList(data);
    });

    return () => { unsubLic(); unsubRes(); };
  }, []);

  const handleCreateLicense = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const slug = formData.nombres.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const newEventId = slug; 
      const newEmail = formData.email.trim().toLowerCase();
      const newPassword = Math.random().toString(36).slice(-8) + "!";

      await createUserWithEmailAndPassword(secondaryAuth, newEmail, newPassword);
      await signOut(secondaryAuth); 

      await setDoc(doc(db, "usuarios", newEventId), { email: newEmail, role: formData.role, plan: formData.plan, tipoEvento: formData.tipoEvento, eventId: newEventId, nombres: formData.nombres, status: 'activo', createdAt: serverTimestamp() });
      await setDoc(doc(db, "eventos", newEventId), { presupuestoTotal: 150000, nombres: formData.nombres, plan: formData.plan, tipoEvento: formData.tipoEvento });

      setSuccessData({ email: newEmail, password: newPassword, eventId: newEventId, nombres: formData.nombres, plan: formData.plan, tipoEvento: eventoSeleccionado.label, role: formData.role });
      setClientPhone('');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') setDialog({ isOpen: true, type: 'alert', title: 'Correo Duplicado', message: 'Este correo ya está registrado.' });
      else setDialog({ isOpen: true, type: 'alert', title: 'Error del Sistema', message: `Ocurrió un error al crear la licencia: ${error.message}` });
    }
    setIsCreating(false);
  };

  const handleSendWhatsApp = () => {
    if (clientPhone.length < 10) { setDialog({ isOpen: true, type: 'alert', title: 'Información Incompleta', message: 'Ingresa un número de 10 dígitos.' }); return; }
    const domain = window.location.hostname.includes('localhost') ? window.location.origin : 'https://panel.baulia.com'; 
    const tipoTexto = successData.role === 'planner' ? 'Agencia / Organizador' : successData.tipoEvento;
    const mensaje = `✨ ¡Hola ${successData.nombres}! Tu Panel de Control Premium para tu ${tipoTexto} está listo.\n\nAccede a tu plataforma privada aquí:\n🔗 ${domain}\n\n👤 Usuario: ${successData.email}\n🔑 Contraseña temporal: ${successData.password}\n\n¡Guarda estos accesos, te servirán para gestionar todos los detalles!`;
    window.open(`https://wa.me/${clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const toggleStatus = (lic) => {
    const nuevoEstatus = lic.status === 'suspendido' ? 'activo' : 'suspendido';
    const accionText = nuevoEstatus === 'suspendido' ? 'SUSPENDER' : 'ACTIVAR';
    setDialog({ isOpen: true, type: 'confirm', title: `${accionText === 'SUSPENDER' ? 'Suspender' : 'Activar'} Licencia`, message: `¿Estás seguro que deseas ${accionText} la plataforma de ${lic.nombres}?`, onConfirm: async () => { setDialog({ ...dialog, isOpen: false }); await setDoc(doc(db, "usuarios", lic.id), { ...lic, status: nuevoEstatus }); } });
  };

  const handleDelete = (lic) => {
    setDialog({ isOpen: true, type: 'confirm', title: 'Eliminar Permanentemente', message: `⚠️ PELIGRO EXTREMO: ¿Seguro de eliminar la información de ${lic.nombres}?`, onConfirm: async () => { setDialog({ ...dialog, isOpen: false }); await deleteDoc(doc(db, "usuarios", lic.id)); await deleteDoc(doc(db, "eventos", lic.eventId)); } });
  };

  const toggleVerCorreo = (id) => setCorreosVisibles(prev => ({ ...prev, [id]: !prev[id] }));

  const toggleResenaAprobacion = async (resena) => {
    const nuevoStatus = resena.status === 'aprobada' ? 'pendiente' : 'aprobada';
    await updateDoc(doc(db, "resenas", resena.id), { status: nuevoStatus });
  };

  const editResenaAuthor = async (resena) => {
    const nuevoNombre = prompt("Edita el nombre público del autor (Ej. Familia Pérez):", resena.authorName);
    if (nuevoNombre && nuevoNombre.trim() !== '') {
      await updateDoc(doc(db, "resenas", resena.id), { authorName: nuevoNombre.trim() });
    }
  };

  const deleteResena = async (resenaId) => {
    if (window.confirm("¿Seguro de eliminar esta reseña permanentemente?")) {
      await deleteDoc(doc(db, "resenas", resenaId));
    }
  };

  const totalEventos = licencias.length;
  const totalDiamante = licencias.filter(l => l.plan === 'diamante').length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10 animate-in fade-in relative">
      {dialog.isOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center border border-white/20">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner ${dialog.type === 'alert' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
              {dialog.type === 'alert' ? <AlertTriangle size={32} /> : <AlertCircle size={32} />}
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">{dialog.title}</h3>
            <p className="text-sm text-slate-500 mb-6">{dialog.message}</p>
            <div className="flex space-x-3">
              {dialog.type === 'confirm' && <button onClick={() => setDialog({ ...dialog, isOpen: false })} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancelar</button>}
              <button onClick={() => { if(dialog.onConfirm) dialog.onConfirm(); else setDialog({ ...dialog, isOpen: false }); }} className={`flex-1 py-3.5 text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95 ${dialog.type === 'alert' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/30'}`}>
                {dialog.type === 'confirm' ? 'Sí, proceder' : 'Entendido'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-8 shadow-xl text-white flex items-center justify-between">
        <div>
          <span className="bg-black/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 inline-block">Nivel 3: Acceso Maestro</span>
          <h2 className="text-3xl font-black flex items-center mb-2"><Building className="mr-3" size={36}/> Centro de Licencias</h2>
          <p className="text-amber-100 max-w-lg text-sm">Control global de la plataforma. Crea nuevos eventos, asigna planes y entrega credenciales directamente a tus clientes o Planners.</p>
        </div>
        <div className="hidden md:flex w-24 h-24 bg-white/10 rounded-full items-center justify-center border-4 border-white/20 shadow-inner"><Lock size={40} className="text-white" /></div>
      </div>

      <div className="flex gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm w-max">
         <button onClick={() => setAdminTab('licencias')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 ${adminTab === 'licencias' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
           <Building size={16}/> Gestor de Licencias
         </button>
         <button onClick={() => setAdminTab('resenas')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 ${adminTab === 'resenas' ? 'bg-amber-500 text-slate-900' : 'text-slate-500 hover:bg-slate-100'}`}>
           <Star size={16}/> Moderar Reseñas {resenasList.filter(r => r.status === 'pendiente').length > 0 && <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full">{resenasList.filter(r => r.status === 'pendiente').length}</span>}
         </button>
      </div>

      {adminTab === 'licencias' && (
        <div className="animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center"><div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3"><Calendar size={24}/></div><h3 className="text-2xl font-black text-slate-800">{totalEventos}</h3><p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Eventos Activos</p></div>
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center"><div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-3"><Star size={24}/></div><h3 className="text-2xl font-black text-slate-800">{totalDiamante}</h3><p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Planes Diamante</p></div>
             <div onClick={() => { setIsModalOpen(true); setSuccessData(null); setFormData({ nombres: '', email: '', plan: 'diamante', tipoEvento: 'boda', role: 'cliente' }); }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center hover:border-emerald-400 cursor-pointer transition-colors group"><div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Plus size={24}/></div><h3 className="text-sm font-black text-emerald-600 mt-2">NUEVA LICENCIA</h3><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Crear Acceso</p></div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center"><h3 className="font-bold text-slate-800 text-sm">Directorio de Eventos Generados</h3></div>
             <div className="overflow-x-auto">
               <table className="w-full text-left whitespace-nowrap min-w-[800px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] uppercase tracking-widest">
                    <tr><th className="px-5 py-3 font-bold">Cliente / ID</th><th className="px-5 py-3 font-bold">Acceso (Correo)</th><th className="px-5 py-3 font-bold text-center">Tipo</th><th className="px-5 py-3 font-bold text-center">Plan</th><th className="px-5 py-3 font-bold text-center">Estatus</th><th className="px-5 py-3 font-bold text-right">Controles</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                     {licencias.length === 0 ? (
                        <tr><td colSpan="6" className="px-5 py-8 text-center text-slate-400">Sin registros de eventos.</td></tr>
                     ) : (
                        licencias.map((lic) => {
                          const tipoObj = tiposDeEvento.find(t => t.id === lic.tipoEvento);
                          const etiquetaTipo = tipoObj ? tipoObj.label : 'Evento';
                          const estaSuspendido = lic.status === 'suspendido';
                          const correoVisible = correosVisibles[lic.id];
                          
                          return (
                            <tr key={lic.id} className={`transition-colors ${estaSuspendido ? 'bg-rose-50/40' : 'hover:bg-slate-50'}`}>
                              <td className="px-5 py-3">
                                <p className={`font-black text-sm ${estaSuspendido ? 'text-rose-800' : 'text-slate-800'}`}>
                                  {lic.nombres || 'Sin Nombre'} 
                                  {lic.role === 'planner' && <span className="ml-2 text-[8px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest">Planner</span>}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{lic.eventId}</p>
                              </td>
                              <td className="px-5 py-3">
                                <div className="flex items-center text-slate-600 bg-slate-100/70 px-2 py-1.5 rounded-lg w-max border border-slate-200/50">
                                  <span className="mr-3 font-mono text-[11px]">{correoVisible ? lic.email : '••••••••••••@••••.com'}</span>
                                  <button onClick={() => toggleVerCorreo(lic.id)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                                    {correoVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                                  </button>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-center text-slate-500 font-bold text-[10px] uppercase tracking-wider">{etiquetaTipo}</td>
                              <td className="px-5 py-3 text-center"><span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${lic.plan === 'diamante' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{lic.plan}</span></td>
                              <td className="px-5 py-3 text-center"><div className={`w-2.5 h-2.5 rounded-full mx-auto ${estaSuspendido ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'}`} title={estaSuspendido ? 'Suspendido' : 'Activo'}></div></td>
                              <td className="px-5 py-3 text-right">
                                 <div className="flex items-center justify-end space-x-2">
                                   <button onClick={() => toggleStatus(lic)} title={estaSuspendido ? "Reactivar Cuenta" : "Suspender Cuenta"} className={`p-2 rounded-lg transition-colors ${estaSuspendido ? 'text-emerald-600 bg-emerald-100 hover:bg-emerald-200' : 'text-amber-600 bg-amber-100 hover:bg-amber-200'}`}><Power size={16} /></button>
                                   <button onClick={() => handleDelete(lic)} title="Eliminar Permanentemente" className="p-2 rounded-lg text-rose-500 bg-rose-50 hover:text-white hover:bg-rose-500 transition-colors"><Trash2 size={16} /></button>
                                 </div>
                              </td>
                            </tr>
                          )
                        })
                     )}
                  </tbody>
               </table>
             </div>
          </div>
        </div>
      )}

      {adminTab === 'resenas' && (
        <div className="animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm">Reseñas de Clientes</h3>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Aprobadas se ven en baulia.com</span>
             </div>
             <div className="p-6 grid grid-cols-1 gap-4">
                {resenasList.length === 0 ? <p className="text-center text-slate-400 py-10">Aún no hay reseñas enviadas.</p> : null}
                {resenasList.map(resena => (
                   <div key={resena.id} className={`p-5 rounded-2xl border transition-colors ${resena.status === 'aprobada' ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-slate-50'}`}>
                      <div className="flex justify-between items-start mb-3">
                         <div>
                            <div className="flex items-center gap-2 mb-1">
                               <h4 className="font-black text-slate-900">{resena.authorName}</h4>
                               <button onClick={() => editResenaAuthor(resena)} className="text-slate-400 hover:text-indigo-600"><Edit2 size={14}/></button>
                            </div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">{resena.authorType} • Evento: {resena.eventId}</p>
                         </div>
                         <div className="flex gap-1">
                            {[1,2,3,4,5].map(s => <Star key={s} size={14} className={resena.rating >= s ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}/>)}
                         </div>
                      </div>
                      <p className="text-slate-700 text-sm mb-4 font-medium italic">"{resena.comment}"</p>
                      
                      <div className="flex justify-between items-center border-t border-slate-200/60 pt-4 mt-2">
                         <div>
                            {resena.status === 'aprobada' 
                              ? <span className="flex items-center text-[10px] font-black text-emerald-600 uppercase tracking-widest"><Globe size={14} className="mr-1"/> Pública en Web</span>
                              : <span className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest"><Lock size={14} className="mr-1"/> Oculta (Pendiente)</span>
                            }
                         </div>
                         <div className="flex gap-2">
                            <button onClick={() => deleteResena(resena.id)} className="px-3 py-1.5 bg-white border border-slate-200 text-rose-500 rounded-lg text-xs font-bold hover:bg-rose-50 transition-colors">Borrar</button>
                            <button onClick={() => toggleResenaAprobacion(resena)} className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-colors shadow-sm ${resena.status === 'aprobada' ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}>
                               {resena.status === 'aprobada' ? 'Ocultar' : 'Aprobar y Publicar'}
                            </button>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {!successData ? (
              <form onSubmit={handleCreateLicense} className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4"><Key size={32} /></div>
                  <h3 className="text-2xl font-black text-slate-800">Generar Accesos</h3>
                  <p className="text-sm text-slate-500">Configura la bóveda privada para tu cliente.</p>
                </div>
                
                <div className="space-y-5 mb-8">
                  <div>
                    <label className="block text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2 flex items-center"><Users size={14} className="mr-1"/> Tipo de Cuenta</label>
                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full p-4 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl outline-none focus:border-indigo-500 font-black cursor-pointer">
                      <option value="cliente">Cliente Final (Novios/Festejados)</option>
                      <option value="planner">Wedding Planner / Agencia</option>
                    </select>
                  </div>
                  <div className="h-px w-full bg-slate-200 my-2"></div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Tipo de Evento</label>
                    <select value={formData.tipoEvento} onChange={e => setFormData({...formData, tipoEvento: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 font-bold text-slate-700 cursor-pointer">
                      {tiposDeEvento.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">{formData.role === 'planner' ? 'Nombre de la Agencia' : eventoSeleccionado.labelNombre}</label>
                    <input type="text" autoFocus required value={formData.nombres} onChange={e => setFormData({...formData, nombres: e.target.value})} placeholder={formData.role === 'planner' ? 'Ej. Elite Planners' : eventoSeleccionado.placeholder} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-500 font-bold text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2 flex items-center"><Mail size={14} className="mr-1.5" /> Correo de Acceso</label>
                    <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="ejemplo@gmail.com" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-500 font-bold text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Paquete Contratado</label>
                    <select value={formData.plan} onChange={e => setFormData({...formData, plan: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 font-bold text-slate-700 cursor-pointer">
                      <option value="oro">Plan Oro (Básico)</option>
                      <option value="diamante">Plan Diamante (VIP Completo)</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
                  <button type="submit" disabled={isCreating} className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 disabled:bg-slate-400 transition-colors">
                    {isCreating ? 'Procesando...' : 'Crear Licencia'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-8 text-center bg-slate-50">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle size={40} /></div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">¡Accesos Creados!</h3>
                <p className="text-sm text-slate-500 mb-6">La cuenta para <b>{successData.nombres}</b> se ha generado exitosamente.</p>
                
                <div className="bg-white p-5 rounded-2xl border border-slate-200 text-left text-sm mb-6 shadow-sm">
                  <p className="mb-3"><span className="text-slate-400 font-bold w-20 inline-block">Usuario:</span> <b className="text-slate-800">{successData.email}</b></p>
                  <p><span className="text-slate-400 font-bold w-20 inline-block">Clave Temp:</span> <b className="text-slate-800 font-mono text-base">{successData.password}</b></p>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl mb-6 shadow-sm">
                  <label className="block text-xs font-black text-emerald-700 uppercase tracking-widest mb-3 text-left flex items-center"><MessageCircle size={14} className="mr-1.5"/> Enviar accesos al {successData.role === 'planner' ? 'Planner' : 'Cliente'}</label>
                  <div className="flex space-x-2 mb-4">
                    <span className="bg-emerald-100 text-emerald-700 font-bold p-3 rounded-xl flex items-center justify-center">+52</span>
                    <input type="tel" placeholder="10 dígitos del cliente..." value={clientPhone} onChange={e => setClientPhone(e.target.value)} className="w-full p-3 bg-white border border-emerald-200 rounded-xl outline-none focus:border-emerald-500 font-bold text-slate-800" />
                  </div>
                  <button onClick={handleSendWhatsApp} className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center">
                    <Send size={18} className="mr-2" /> Enviar por WhatsApp
                  </button>
                </div>

                <button onClick={() => setIsModalOpen(false)} className="w-full py-4 text-slate-500 font-bold hover:text-slate-800 transition-colors">Cerrar Ventana</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// --- COMPONENTE: CONFIGURACIÓN MAESTRA (WHITE-LABEL) ---
// ==========================================
const ConfiguracionMaestraView = ({ agencyConfig, addNotification }) => {
  const [formData, setFormData] = useState({
    name: agencyConfig?.name || 'EVENT MASTER',
    themeColor: agencyConfig?.themeColor || 'indigo',
    domain: agencyConfig?.domain || '',
    logoUrl: agencyConfig?.logoUrl || ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const cloudName = "duy0mcqsh"; 
  const uploadPreset = "ml_default"; 

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    if (addNotification) addNotification('Subiendo Logo...', 'Espera unos segundos.', 'info');
    
    try {
      const uploadData = new FormData(); 
      uploadData.append("file", file); 
      uploadData.append("upload_preset", uploadPreset);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: uploadData });
      const data = await res.json();
      if (data.secure_url) {
        const urlParts = data.secure_url.split('/upload/');
        const optimUrl = `${urlParts[0]}/upload/c_fit,h_100,w_300,f_png,q_auto/${urlParts[1]}`;
        setFormData({ ...formData, logoUrl: optimUrl });
        if (addNotification) addNotification('Logo Subido', 'No olvides hacer clic en Guardar.', 'success');
      }
    } catch (err) { 
      if (addNotification) addNotification('Error', 'Fallo al subir la imagen.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "eventos", ID_DEL_EVENTO, "configuracion", "marcaBlanca"), formData);
      if (addNotification) addNotification('Guardado', 'La identidad visual ha sido actualizada en toda la plataforma.', 'success');
    } catch (error) {
      if (addNotification) addNotification('Error', 'No se pudo guardar la configuración.', 'error');
    }
  };

  const colorOptions = [
    { id: 'indigo', hex: 'bg-indigo-600', label: 'Índigo (Por defecto)' },
    { id: 'rose', hex: 'bg-rose-600', label: 'Rosa Premium' },
    { id: 'emerald', hex: 'bg-emerald-600', label: 'Esmeralda' },
    { id: 'slate', hex: 'bg-slate-800', label: 'Carbón / Oscuro' },
    { id: 'amber', hex: 'bg-amber-500', label: 'Ámbar / Dorado' },
    { id: 'sky', hex: 'bg-sky-500', label: 'Cielo' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 shadow-xl text-white flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black flex items-center mb-2"><Settings2 className="mr-3 text-rose-500" size={36}/> Configuración Maestra</h2>
          <p className="text-slate-400 max-w-lg">Personaliza la plataforma con la identidad de tu Agencia (White-Label). Tus clientes verán tus colores y logotipos en todos sus paneles.</p>
        </div>
        <div className="hidden md:flex w-24 h-24 bg-white/10 rounded-full items-center justify-center border border-white/20">
           <Layers size={40} className="text-white/50" />
        </div>
      </div>

      <form onSubmit={handleSaveConfig} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 space-y-8">
          
          {/* SECCIÓN 1: LOGOTIPO */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><Image size={20} className="mr-2 text-indigo-500"/> 1. Logotipo Corporativo</h3>
            <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="w-full sm:w-64 h-24 bg-slate-900 rounded-xl border border-slate-300 flex items-center justify-center overflow-hidden relative shadow-inner">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                {formData.logoUrl ? (
                  <img src={formData.logoUrl} alt="Logo Agencia" className="h-16 object-contain z-10 drop-shadow-md px-2" />
                ) : (
                  <span className="text-slate-500 font-bold z-10 uppercase tracking-widest text-xs">Tu Logo Aquí</span>
                )}
                {isUploading && <div className="absolute inset-0 bg-slate-900/80 z-20 flex items-center justify-center"><RefreshCw className="text-white animate-spin"/></div>}
              </div>
              <div className="flex-1 space-y-3 w-full">
                <p className="text-xs text-slate-500">Se recomienda un archivo PNG con fondo transparente (máx. 2MB). Este logo reemplazará el nombre "EVENT MASTER" en el menú principal.</p>
                <input type="file" accept="image/png, image/jpeg" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current.click()} className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-100 transition-colors flex items-center">
                  <UploadCloud size={16} className="mr-2"/> Seleccionar Archivo
                </button>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: IDENTIDAD VISUAL */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><Palette size={20} className="mr-2 text-rose-500"/> 2. Nombre y Color Principal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre de la Agencia / Planner</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Ej. Elite Weddings" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Color del Panel</label>
                <div className="flex gap-2">
                  {colorOptions.map(color => (
                    <button 
                      key={color.id} type="button" title={color.label}
                      onClick={() => setFormData({...formData, themeColor: color.id})} 
                      className={`w-12 h-12 rounded-xl border-2 transition-all flex items-center justify-center ${color.hex} ${formData.themeColor === color.id ? 'border-slate-900 scale-110 shadow-lg' : 'border-transparent opacity-80 hover:opacity-100 hover:scale-105'}`}
                    >
                      {formData.themeColor === color.id && <CheckCircle size={16} className="text-white drop-shadow-md" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: DOMINIO */}
          <div className="opacity-60 grayscale cursor-not-allowed">
             <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><Globe size={20} className="mr-2 text-sky-500"/> 3. Dominio Personalizado (Próximamente)</h3>
             <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative">
                <div className="absolute top-4 right-4 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">Fase 6</div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">URL de la plataforma</label>
                <div className="flex items-center">
                  <span className="p-3.5 bg-slate-200 text-slate-500 font-medium rounded-l-xl border border-r-0 border-slate-300">https://</span>
                  <input type="text" disabled value={formData.domain} placeholder="bodas.tu-agencia.com" className="w-full p-3.5 bg-slate-100 border border-slate-300 rounded-r-xl font-mono text-sm" />
                </div>
                <p className="text-xs text-slate-400 mt-2 flex items-center"><AlertTriangle size={14} className="mr-1.5"/> Requiere configuración de registros CNAME y A en tu proveedor de dominio (GoDaddy, Hostinger, etc).</p>
             </div>
          </div>

        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button type="submit" className="px-8 py-3.5 bg-slate-900 text-white rounded-xl font-bold shadow-xl hover:bg-slate-800 hover:shadow-indigo-500/20 transition-all flex items-center text-lg active:scale-95">
            <CheckSquare size={20} className="mr-2"/> Guardar Configuración Maestra
          </button>
        </div>
      </form>
    </div>
  );
};

// ==========================================
// --- COMPONENTE: VISOR PÚBLICO WIDGET (COMPACTO, ANTI-ZOOM Y CRISTAL) ---
// ==========================================
const InvitacionPublicaView = ({ eventId, guestUid }) => {
  const [eventoInfo, setEventoInfo] = useState(null);
  const [guestInfo, setGuestInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRSVP, setShowRSVP] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState('idle'); 
  const [formError, setFormError] = useState(''); 
  
  const [guestPhone, setGuestPhone] = useState('');
  const [tempSubGuests, setTempSubGuests] = useState([]);
  const [extraRequested, setExtraRequested] = useState(0);
  const [openPasses, setOpenPasses] = useState(1);
  const [openName, setOpenName] = useState('');

  const urlParams = new URLSearchParams(window.location.search);
  const isIframe = urlParams.get('iframe') === 'true';
  
  const t_bg = urlParams.get('bg') ? `#${urlParams.get('bg')}` : '#f8fafc'; 
  const t_card = urlParams.get('card') ? `#${urlParams.get('card')}` : '#ffffff'; 
  const t_btn = urlParams.get('btn') ? `#${urlParams.get('btn')}` : '#d97706'; 
  const t_txt = urlParams.get('txt') ? `#${urlParams.get('txt')}` : '#1c1917'; 
  const t_font = urlParams.get('font') || '';

  const themeContainer = { backgroundColor: isIframe ? 'transparent' : t_bg, fontFamily: t_font ? `"${t_font}", sans-serif` : 'inherit', minHeight: '100vh', color: t_txt };
  const themeCard = { backgroundColor: t_card, borderColor: `${t_txt}20`, color: t_txt };
  const themeBtn = { backgroundColor: t_btn, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.1em' };
  
  // Fondo de inputs más sutil
  const themeInput = { backgroundColor: isIframe ? 'rgba(255,255,255,0.3)' : `${t_bg}50`, color: t_txt, borderColor: `${t_txt}30` };

  // 🔴 INYECCIÓN ANTI-ZOOM PARA MÓVILES
  useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = "viewport";
      document.head.appendChild(meta);
    }
    // Fuerza a la escala 1.0 y prohíbe al usuario hacer zoom
    meta.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0";
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docSnap = await getDoc(doc(db, "eventos", eventId));
        if (docSnap.exists()) setEventoInfo(docSnap.data());

        if (guestUid) {
          const guestSnap = await getDoc(doc(db, "eventos", eventId, "invitados", guestUid));
          if (guestSnap.exists()) {
            const gData = guestSnap.data();
            setGuestInfo(gData);
            setGuestPhone(gData.phone || '');
            setExtraRequested(gData.extraRequested || 0);
            
            const isFirstTime = gData.status === 'pendiente' || gData.status === 'por_invitar';
            const totalLimit = gData.originalPasses || gData.passes; 
            const currentSubs = gData.subGuests || [];
            
            const newTemp = Array(totalLimit).fill(null).map((_, i) => {
              if (currentSubs[i]) return { ...currentSubs[i], willAttend: true };
              return { name: i === 0 ? gData.name : '', isChild: false, willAttend: isFirstTime, id: `s_new_${Date.now()}_${i}` };
            });
            setTempSubGuests(newTemp);
          }
        }
      } catch (error) {}
      setLoading(false);
    };
    setShowRSVP(true);
    fetchData();
  }, [eventId, guestUid]);

  const handleSubGuestChange = (index, field, value) => {
    setFormError('');
    const newSubGuests = [...tempSubGuests];
    newSubGuests[index] = { ...newSubGuests[index], [field]: value };
    setTempSubGuests(newSubGuests);
  };

  const handleRSVPSubmit = async (e) => {
    e.preventDefault();
    setRsvpStatus('submitting');
    setFormError('');
    try {
      if (guestUid && guestInfo) {
        const attendingGuests = tempSubGuests.filter(sg => sg.willAttend);
        const isCancelled = attendingGuests.length === 0;

        if (!isCancelled) {
          const emptyNames = attendingGuests.filter(sg => !sg.name.trim());
          if(emptyNames.length > 0) { 
             setFormError("Por favor, ingresa el nombre de todos los que SÍ asistirán."); 
             setRsvpStatus('idle'); 
             return; 
          }
        }

        const updatedGuest = {
          ...guestInfo, phone: guestPhone, passes: isCancelled ? 0 : attendingGuests.length, 
          status: isCancelled ? 'cancelado' : 'confirmado', extraRequested: extraRequested, fechaConfirmacion: serverTimestamp(),
          subGuests: attendingGuests.map((sg, i) => ({ id: sg.id?.startsWith('s_new') ? `usr_${guestInfo.id}_${i}` : sg.id, name: sg.name, isChild: sg.isChild, entered: false }))
        };
        await setDoc(doc(db, "eventos", eventId, "invitados", guestUid), updatedGuest);
      } else {
        await addDoc(collection(db, "eventos", eventId, "invitados"), {
          name: openName, phone: guestPhone, passes: parseInt(openPasses), originalPasses: parseInt(openPasses),
          status: 'confirmado', fechaConfirmacion: serverTimestamp(), side: 'general', entered: 0, tableId: null,
          subGuests: Array(parseInt(openPasses)).fill(null).map((_, i) => ({ id: `usr_gen_${Date.now()}_${i}`, name: i === 0 ? openName : `Acompañante de ${openName}`, isChild: false, entered: false }))
        });
      }
      setRsvpStatus('success');

      if (isIframe) {
        setTimeout(() => { window.parent.postMessage('rsvp_success', '*'); }, 2000); 
      }

    } catch (error) { 
      setFormError("Error al guardar. Revisa tu conexión."); 
      setRsvpStatus('idle'); 
    }
  };

  if (loading) return <div style={themeContainer} className="flex items-center justify-center animate-pulse text-lg font-bold">Cargando Bóveda...</div>;
  if (!eventoInfo) return <div style={themeContainer} className="flex items-center justify-center font-bold text-lg text-center p-6"><p>ERROR 404:<br/>Evento no encontrado.</p></div>;

  const extrasAprobados = (guestInfo?.passes > (guestInfo?.originalPasses || guestInfo?.passes)) ? guestInfo.passes - guestInfo.originalPasses : 0;

  if (rsvpStatus === 'success') {
    return (
      <div style={themeContainer} className="flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
        <div style={{...themeCard, borderColor: t_btn, borderWidth: '2px'}} className="w-20 h-20 rounded-full flex items-center justify-center mb-5 shadow-lg"><CheckCircle size={36} color={t_btn} /></div>
        <h2 className="text-2xl font-bold mb-1 drop-shadow-sm">¡Asistencia Confirmada!</h2>
        <p className="text-sm opacity-80 font-medium">Hemos guardado tu respuesta.</p>
      </div>
    );
  }

  return (
    <div style={themeContainer} className="relative pb-16 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      
      {/* 🔴 PARCHE DE CRISTAL Y ANTI-ZOOM HORIZONTAL */}
      {isIframe && (
        <style>{`
          html, body, #root { 
            background: transparent !important; 
            background-color: transparent !important; 
            overflow-x: hidden !important; 
            touch-action: pan-y !important; 
          }
        `}</style>
      )}

      {t_font && <style>{`@import url('https://fonts.googleapis.com/css2?family=${t_font.replace(/ /g, '+')}&display=swap');`}</style>}

      {showRSVP && (
        <div className="w-full max-w-sm mx-auto z-50 animate-in slide-in-from-bottom-8 duration-500">
          <div style={themeCard} className={`w-full rounded-2xl p-4 sm:p-5 border max-h-[90vh] overflow-y-auto overflow-x-hidden custom-scrollbar ${isIframe ? 'shadow-[0_8px_30px_rgba(0,0,0,0.12)]' : 'shadow-xl'}`}>
            
            <div className="text-center mb-5 border-b pb-3" style={{ borderColor: `${t_txt}15` }}>
               <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-widest leading-tight">Confirmación</h3>
               {guestInfo && <p className="mt-1 text-sm font-medium opacity-80">{guestInfo.name} ({guestInfo.originalPasses || guestInfo.passes} lugares)</p>}
            </div>

            {extrasAprobados > 0 && guestInfo?.status === 'confirmado' && (
               <div style={{ backgroundColor: `${t_btn}15`, borderColor: t_btn, color: t_txt }} className="mb-4 border p-2.5 rounded-lg shadow-sm animate-in fade-in">
                  <p className="text-xs font-black uppercase tracking-widest mb-0.5 flex items-center justify-center"><CheckCircle size={14} className="mr-1.5"/> Solicitud Aprobada</p>
                  <p className="text-xs text-center font-medium">Te han otorgado {extrasAprobados} pase(s) extra. Tienes {guestInfo.passes} en total.</p>
               </div>
            )}
            
            <form onSubmit={handleRSVPSubmit} className="space-y-4">
              
              {/* CAMPO TELÉFONO COMPACTO */}
              <div className="p-3 rounded-xl border" style={{ borderColor: `${t_txt}20` }}>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5 flex items-center opacity-90"><Phone size={14} className="mr-1.5"/> WhatsApp de Contacto</label>
                {/* 🔴 IMPORTANTE: text-base (16px) EVITA EL ZOOM EN IPHONE */}
                <input type="tel" required value={guestPhone} onChange={e => setGuestPhone(e.target.value)} style={themeInput} className="w-full p-2.5 border rounded-lg outline-none font-medium text-base" placeholder="10 dígitos" />
              </div>

              {guestInfo ? (
                <>
                  <div className="text-center mt-5 mb-2">
                    <h4 className="font-bold text-sm uppercase tracking-widest opacity-90">Asistentes</h4>
                  </div>
                  
                  <div className="space-y-2.5">
                    {tempSubGuests.map((sg, idx) => (
                      <div key={idx} style={{ borderColor: sg.willAttend ? `${t_txt}40` : `${t_txt}15`, opacity: sg.willAttend ? 1 : 0.6 }} className="p-2.5 rounded-xl border transition-all">
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider">Pase #{idx + 1}</label>
                          <label style={{ backgroundColor: isIframe ? 'rgba(0,0,0,0.05)' : `${t_bg}60` }} className="flex items-center space-x-1.5 cursor-pointer px-2 py-1 rounded-md border" >
                            <input type="checkbox" checked={sg.willAttend} onChange={(e) => handleSubGuestChange(idx, 'willAttend', e.target.checked)} className="w-3.5 h-3.5 accent-emerald-600" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{sg.willAttend ? 'SÍ VOY' : 'NO VOY'}</span>
                          </label>
                        </div>
                        
                        {sg.willAttend && (
                          <div className="space-y-2 mt-2 pt-2 border-t animate-in fade-in" style={{ borderColor: `${t_txt}10` }}>
                            {/* 🔴 IMPORTANTE: text-base (16px) EVITA EL ZOOM EN IPHONE */}
                            <input 
                              type="text" required placeholder="Nombre del asistente..." 
                              value={sg.name || ''} onChange={(e) => handleSubGuestChange(idx, 'name', e.target.value)} 
                              style={themeInput} className="w-full p-2 border rounded-md text-base font-medium outline-none" 
                            />
                            <label className="flex items-center space-x-2 cursor-pointer pt-0.5">
                               <input type="checkbox" checked={sg.isChild || false} onChange={(e) => handleSubGuestChange(idx, 'isChild', e.target.checked)} className="w-3.5 h-3.5 accent-indigo-600" />
                               <span className="text-xs font-medium uppercase tracking-wider opacity-80">Menor de edad</span>
                            </label>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* SOLICITAR PASES EXTRA COMPACTO */}
                  <div className="border-t pt-3 mt-4 flex items-center justify-between p-2 rounded-lg" style={{ borderColor: `${t_txt}15`, backgroundColor: isIframe ? 'transparent' : `${t_bg}40` }}>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest">¿Pases extra?</p>
                      <p className="text-[10px] opacity-70">Sujeto a confirmación.</p>
                    </div>
                    <div style={{ backgroundColor: t_card, borderColor: `${t_txt}30` }} className="flex items-center border rounded-md p-0.5 shadow-sm">
                      <button type="button" onClick={() => setExtraRequested(Math.max(0, extraRequested - 1))} className="px-2 py-0.5 text-lg font-bold hover:opacity-50">-</button>
                      <span className="text-sm font-black w-6 text-center">{extraRequested}</span>
                      <button type="button" onClick={() => setExtraRequested(extraRequested + 1)} className="px-2 py-0.5 text-lg font-bold hover:opacity-50">+</button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl border" style={{ borderColor: `${t_txt}20` }}>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-1.5 opacity-90">Tu Nombre Completo</label>
                    <input type="text" required value={openName} onChange={e => setOpenName(e.target.value)} style={themeInput} className="w-full p-2.5 border rounded-lg outline-none font-medium text-base" placeholder="Ej. Familia López" />
                  </div>
                  <div className="p-3 rounded-xl border" style={{ borderColor: `${t_txt}20` }}>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-1.5 opacity-90">¿Cuántos asisten?</label>
                    <select value={openPasses} onChange={e => setOpenPasses(e.target.value)} style={themeInput} className="w-full p-2.5 border rounded-lg outline-none font-medium text-base">
                      {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} persona(s)</option>)}
                    </select>
                  </div>
                </div>
              )}
              
              {/* ALERTA DE ERROR COMPACTA */}
              {formError && (
                 <div className="bg-rose-500/10 border border-rose-500/30 text-rose-600 p-2.5 rounded-lg font-bold text-xs flex items-center shadow-sm animate-in shake">
                    <AlertCircle size={16} className="mr-1.5 flex-shrink-0"/> {formError}
                 </div>
              )}

              {/* BOTÓN SUBMIT COMPACTO PERO PODEROSO */}
              <button type="submit" disabled={rsvpStatus === 'submitting'} style={{...themeBtn, opacity: (!guestInfo || tempSubGuests.filter(s => s.willAttend).length > 0) ? 1 : 0.8 }} className="w-full py-3.5 rounded-xl font-bold text-sm sm:text-base shadow-lg hover:scale-[1.02] transition-transform mt-5 border-b-4 border-black/20">
                {rsvpStatus === 'submitting' ? 'Enviando...' : (!guestInfo || tempSubGuests.filter(s => s.willAttend).length > 0 ? 'Confirmar Asistencia' : 'Declinar Invitación')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// --- COMPONENTE: PANTALLA DE ACCESO BAULIA ---
// ==========================================
const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mensajeOk, setMensajeOk] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); setError(''); setMensajeOk('');
    try { await signInWithEmailAndPassword(auth, email.trim(), password); } 
    catch (err) { setError('Credenciales incorrectas o usuario no encontrado.'); setIsLoading(false); }
  };

  const handleResetPassword = async () => {
    if (!email) { setError('Escribe tu correo arriba y presiona "Recuperar" de nuevo.'); return; }
    try { await sendPasswordResetEmail(auth, email.trim()); setMensajeOk('Enlace de recuperación enviado al correo.'); setError(''); } 
    catch (err) { setError('Error al enviar. Verifica el correo.'); }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Luces de fondo estilo Champagne */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none"></div>
      
      <div className="bg-slate-900/80 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.6)] w-full max-w-md relative z-10 border border-slate-800">
        <div className="flex flex-col items-center mb-8">
           <div className="mb-2 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:scale-105 transition-transform cursor-default">
              <BauliaLogo className="h-16 w-auto" forceWhite={true} />
           </div>
           <p className="text-amber-500 text-xs font-bold tracking-[0.2em] mt-2">Bóveda Premium</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Correo Electrónico</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all font-bold text-white shadow-inner" placeholder="tu@correo.com" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Contraseña Segura</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all font-bold text-white shadow-inner" placeholder="••••••••" />
          </div>
          
          {error && <div className="bg-rose-500/10 text-rose-400 p-3 rounded-lg text-xs font-bold text-center border border-rose-500/20 animate-in shake">{error}</div>}
          {mensajeOk && <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-lg text-xs font-bold text-center border border-emerald-500/20">{mensajeOk}</div>}
          
          <button type="submit" disabled={isLoading} className="w-full py-4 bg-amber-500 text-slate-900 rounded-xl font-black text-lg shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:bg-amber-400 hover:scale-[1.02] transition-all mt-4 disabled:opacity-50 disabled:hover:scale-100">
            {isLoading ? 'Autenticando...' : 'Acceder al Panel'}
          </button>
        </form>
        
        <div className="mt-8 text-center border-t border-slate-800 pt-6">
          <button onClick={handleResetPassword} type="button" className="text-xs font-bold text-slate-500 hover:text-amber-400 transition-colors">
            ¿Olvidaste tu contraseña? Recuperar aquí
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// --- COMPONENTE: PANEL DE ADMINISTRACIÓN PROTEGIDO ---
// ==========================================
const AdminDashboard = ({ authData }) => {
  const { role: userRole, plan: userPlan, eventId } = authData;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(userRole === 'superadmin' ? 'licencias' : 'dashboard');  
  
  const [tareas, setTareas] = useState([]); 
  const [timing, setTiming] = useState([]); 
  const [guests, setGuests] = useState([]); 
  const [tables, setTables] = useState([]); 
  const [gastos, setGastos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [globalSearch, setGlobalSearch] = useState('');
  const [mapElements, setMapElements] = useState([]); 
  const [decoElements, setDecoElements] = useState([]);
  const [photos, setPhotos] = useState([]); 

  const [presupuestoTotal, setPresupuestoTotal] = useState(() => {
    const saved = localStorage.getItem('eventmaster_presupuesto');
    return saved ? Number(saved) : 150000;
  });

  const [notifications, setNotifications] = useState([]);
  const [bellAlerts, setBellAlerts] = useState([]); 
  const [agencyConfig, setAgencyConfig] = useState(null);

  const addNotification = React.useCallback((title, message, type = 'info', tab = null) => {
    const id = Date.now() + Math.random(); 
    const notifObj = { id, title, message, type, tab, date: new Date(), isRead: false };
    setNotifications(prev => [...prev, notifObj]);
    setTimeout(() => { setNotifications(prev => prev.filter(n => n.id !== id)); }, 6000);
    setBellAlerts(prev => [notifObj, ...prev].slice(0, 30));
  }, []);

  const markAsRead = React.useCallback((id) => {
    setBellAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
  }, []);

  const prevGuestsRef = useRef([]);

  useEffect(() => {
    if (userRole === 'superadmin') return;
    setGlobalEventId(eventId);

    const unsubConfigMain = onSnapshot(doc(db, "eventos", eventId), (docSnap) => {
      if (docSnap.exists() && docSnap.data().presupuestoTotal !== undefined) {
        const remoteBudget = Number(docSnap.data().presupuestoTotal);
        setPresupuestoTotal(remoteBudget);
        localStorage.setItem('eventmaster_presupuesto', remoteBudget);
      }
    });

    const unsubWhiteLabel = onSnapshot(doc(db, "eventos", eventId, "configuracion", "marcaBlanca"), (docSnap) => {
      if (docSnap.exists()) setAgencyConfig(docSnap.data());
    });

    const unsubGuests = onSnapshot(collection(db, "eventos", eventId, "invitados"), (snap) => {
      const newGuests = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (prevGuestsRef.current.length > 0) {
         newGuests.forEach(newG => {
            const oldG = prevGuestsRef.current.find(g => g.id === newG.id);
            if (oldG) {
               if ((oldG.status === 'pendiente' || oldG.status === 'por_invitar') && newG.status === 'confirmado') {
                  addNotification('¡Nueva Confirmación!', `${newG.name} ha confirmado (${newG.passes} lugares).`, 'success', 'invitados');
               } else if (oldG.status !== 'cancelado' && newG.status === 'cancelado') {
                  addNotification('Invitación Declinada', `${newG.name} ha liberado sus lugares.`, 'danger', 'invitados');
               } else if (oldG.status === 'confirmado' && newG.status === 'confirmado' && newG.passes < oldG.passes) {
                  addNotification('Lugares Liberados', `${newG.name} redujo su grupo y liberó ${oldG.passes - newG.passes} lugar(es).`, 'warning', 'invitados');
               }
               if (newG.extraRequested > (oldG.extraRequested || 0)) {
                  addNotification('Pases Extra', `${newG.name} solicita ${newG.extraRequested} pase(s) extra.`, 'warning', 'invitados');
               }
            }
         });
      }
      prevGuestsRef.current = newGuests;
      setGuests(newGuests);
    });

    const unsubGastos = onSnapshot(collection(db, "eventos", eventId, "gastos"), (snap) => setGastos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubProv = onSnapshot(collection(db, "eventos", eventId, "proveedores"), (snap) => setProveedores(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubMesas = onSnapshot(collection(db, "eventos", eventId, "mesas"), (snap) => setTables(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubTareas = onSnapshot(collection(db, "eventos", eventId, "tareas"), (snap) => setTareas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubTiming = onSnapshot(collection(db, "eventos", eventId, "timing"), (snap) => setTiming(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubMapa = onSnapshot(collection(db, "eventos", eventId, "mapa"), (snap) => setMapElements(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubDeco = onSnapshot(collection(db, "eventos", eventId, "decoracion"), (snap) => setDecoElements(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubFotos = onSnapshot(collection(db, "eventos", eventId, "fotos"), (snap) => setPhotos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));

    return () => { unsubConfigMain(); unsubWhiteLabel(); unsubGuests(); unsubGastos(); unsubProv(); unsubMesas(); unsubTareas(); unsubTiming(); unsubMapa(); unsubDeco(); unsubFotos(); };
  }, [eventId, userRole, addNotification]);

  const renderContent = () => {
    switch(activeTab) {
      case 'licencias': return userRole === 'superadmin' && typeof SuperAdminView !== 'undefined' ? <SuperAdminView /> : null;
      case 'dashboard': return typeof DashboardView !== 'undefined' ? <DashboardView guests={guests} tables={tables} gastos={gastos} presupuestoTotal={presupuestoTotal} tareas={tareas} setActiveTab={setActiveTab} addNotification={addNotification} /> : null; 
      case 'invitados': return typeof InvitadosView !== 'undefined' ? <InvitadosView tables={tables} guests={guests} setGuests={setGuests} addNotification={addNotification} /> : null; 
      // 🔴 AQUÍ PASAMOS LA FUNCIÓN DE NOTIFICACIONES AL ESCÁNER DE ESCRITORIO
      case 'escaner': return userPlan === 'diamante' && typeof EscanerView !== 'undefined' ? <EscanerView guests={guests} setGuests={setGuests} tables={tables} isSharedMode={false} addNotification={addNotification} /> : null; 
      case 'mesas': return userPlan === 'diamante' && typeof MesasView !== 'undefined' ? <MesasView tables={tables} setTables={setTables} guests={guests} setGuests={setGuests} addNotification={addNotification} /> : null; 
      case 'mapa': return userPlan === 'diamante' && typeof MapaView !== 'undefined' ? <MapaView tables={tables} setTables={setTables} guests={guests} setGuests={setGuests} globalSearch={globalSearch} elements={mapElements} setElements={setMapElements} /> : null;
      case 'decoracion': return userPlan === 'diamante' && typeof DecoracionView !== 'undefined' ? <DecoracionView elements={decoElements} setElements={setDecoElements} addNotification={addNotification} /> : null; 
      case 'tareas': return typeof ChecklistView !== 'undefined' ? <ChecklistView tareas={tareas} addNotification={addNotification} /> : null;
      case 'timing': return typeof TimingView !== 'undefined' ? <TimingView timing={timing} setTiming={setTiming} addNotification={addNotification} /> : null;
      case 'presupuesto': return typeof PresupuestoView !== 'undefined' ? <PresupuestoView gastos={gastos} setGastos={setGastos} proveedores={proveedores} setProveedores={setProveedores} presupuestoTotal={presupuestoTotal} setPresupuestoTotal={setPresupuestoTotal} addNotification={addNotification} /> : null;
      case 'proveedores': return typeof ProveedoresView !== 'undefined' ? <ProveedoresView proveedores={proveedores} setProveedores={setProveedores} gastos={gastos} setGastos={setGastos} addNotification={addNotification} /> : null;
      case 'galeria': return userPlan === 'diamante' && typeof GaleriaView !== 'undefined' ? <GaleriaView photos={photos} addNotification={addNotification} /> : null;
      case 'invitacion': return typeof InvitacionView !== 'undefined' ? <InvitacionView guests={guests} setGuests={setGuests} addNotification={addNotification} /> : null; 
      case 'configuracion': return userRole === 'planner' && typeof ConfiguracionMaestraView !== 'undefined' ? <ConfiguracionMaestraView agencyConfig={agencyConfig} addNotification={addNotification} /> : null;
      default: return <div className="p-8 text-center text-slate-500 font-bold">Módulo bloqueado o en construcción.</div>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      <div className="fixed top-4 right-4 z-[999] hidden sm:flex flex-col space-y-2 pointer-events-none">
        {notifications.map(notif => (
          <div key={notif.id} onClick={() => { if(notif.tab) setActiveTab(notif.tab); setNotifications(prev => prev.filter(n => n.id !== notif.id)); }} className={`w-80 bg-white border-l-4 rounded-xl shadow-2xl p-4 flex items-start transform transition-all duration-300 animate-in slide-in-from-right-8 pointer-events-auto ${notif.type === 'success' ? 'border-emerald-500' : notif.type === 'danger' ? 'border-rose-500' : 'border-amber-500'} ${notif.tab ? 'cursor-pointer hover:scale-[1.02]' : ''}`}>
            <div className={`mr-3 mt-0.5 ${notif.type === 'success' ? 'text-emerald-500' : notif.type === 'danger' ? 'text-rose-500' : 'text-amber-500'}`}>
              {notif.type === 'success' ? <CheckCircle size={20}/> : notif.type === 'danger' ? <AlertCircle size={20}/> : <Bell size={20}/>}
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">{notif.title}</h4>
              <p className="text-slate-500 text-xs mt-0.5 leading-snug">{notif.message}</p>
            </div>
          </div>
        ))}
      </div>

      {typeof Sidebar !== 'undefined' && <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} activeTab={activeTab} setActiveTab={setActiveTab} userRole={userRole} userPlan={userPlan} agencyConfig={agencyConfig} />}
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header setIsOpen={setSidebarOpen} setActiveTab={setActiveTab} data={{ guests, proveedores, gastos }} globalSearch={globalSearch} setGlobalSearch={setGlobalSearch} bellAlerts={bellAlerts} setBellAlerts={setBellAlerts} markAsRead={markAsRead} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-5 lg:p-6 print:p-0 print:overflow-visible">
          <div className="h-full max-w-7xl mx-auto print:max-w-none print:w-full">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

// ==========================================
// --- COMPONENTE: VISTA INDEPENDIENTE PARA EL CADENERO (STAFF) ---
// ==========================================
const HostessStandaloneView = ({ eventId }) => {
  const [guests, setGuests] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sistema de notificaciones silencioso para no causar errores de consola
  const addNotification = (title, msg, type) => console.log(title, msg);

  useEffect(() => {
    setGlobalEventId(eventId);
    
    // El cadenero necesita conectarse a la base de datos de invitados y mesas de este evento
    const unsubGuests = onSnapshot(collection(db, "eventos", eventId, "invitados"), (snap) => {
      setGuests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    const unsubMesas = onSnapshot(collection(db, "eventos", eventId, "mesas"), (snap) => {
      setTables(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => { unsubGuests(); unsubMesas(); };
  }, [eventId]);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center text-emerald-400 font-bold">
        <RefreshCw size={40} className="animate-spin mb-4" /> Conectando a la Puerta...
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-50 p-2 sm:p-4 overflow-y-auto">
       <EscanerView guests={guests} setGuests={setGuests} tables={tables} isSharedMode={true} addNotification={addNotification} />
    </div>
  );
};

// ==========================================
// --- COMPONENTE: COSECHADOR DE RESEÑAS VIP (CERO RIESGO) ---
// ==========================================
const ReviewHarvester = ({ authData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('idle');

  // Solo se muestra a clientes o planners, NO al superadmin
  if (!authData || authData.role === 'superadmin') return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      // Guarda la reseña en una nueva bóveda llamada "resenas"
      await setDoc(doc(db, "resenas", authData.eventId), {
        eventId: authData.eventId,
        rating,
        comment,
        status: 'pendiente', // 🔴 Nace oculta. Solo tú podrás hacerla pública.
        createdAt: serverTimestamp(),
        authorName: 'Cliente Baulia', // Podrás editar su nombre real
        authorType: authData.role === 'planner' ? 'Agencia / Planner' : 'Anfitrión del Evento'
      });
      setStatus('success');
      setTimeout(() => setIsOpen(false), 4000);
    } catch (error) {
      console.error(error);
      setStatus('idle');
    }
  };

  return (
    <>
      {/* BOTÓN FLOTANTE EN LA ESQUINA */}
      <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 bg-slate-900 dark:bg-white text-amber-500 dark:text-slate-900 px-5 py-3.5 rounded-full shadow-2xl flex items-center gap-2 border border-slate-700 dark:border-slate-200 hover:scale-105 transition-transform z-50 group">
        <Star size={16} className="fill-amber-500 dark:fill-amber-500 group-hover:animate-spin"/>
        <span className="font-bold text-[10px] uppercase tracking-widest text-white dark:text-slate-900">Calificar Experiencia</span>
      </button>

      {/* MODAL DE BÓVEDA PARA CALIFICAR */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 md:p-10 w-full max-w-md shadow-2xl relative transform animate-in zoom-in-95">
            <button onClick={() => setIsOpen(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
            
            {status === 'success' ? (
               <div className="text-center py-8">
                 <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]"><CheckCircle size={32}/></div>
                 <h3 className="text-2xl font-editorial font-bold text-white mb-2">¡Gracias por tu opinión!</h3>
                 <p className="text-slate-400 font-light text-sm">Tus comentarios nos ayudan a mantener el estándar de oro en cada evento.</p>
               </div>
            ) : (
               <form onSubmit={handleSubmit}>
                 <div className="text-center mb-8">
                   <h3 className="text-2xl font-editorial font-bold text-white mb-2">Califica tu Bóveda</h3>
                   <p className="text-slate-400 font-light text-sm">¿Cómo fue tu experiencia gestionando tu evento con la tecnología de Baulia?</p>
                 </div>

                 <div className="flex justify-center gap-2 mb-8">
                   {[1,2,3,4,5].map(star => (
                     <button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none transform hover:scale-110 transition-transform">
                       <Star size={36} className={`${rating >= star ? 'fill-amber-500 text-amber-500' : 'text-slate-700'}`} />
                     </button>
                   ))}
                 </div>

                 <textarea 
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Escribe tu reseña aquí... (Ej. Nos ahorró horas de estrés y a los invitados les encantó)." 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-sm font-light focus:border-amber-500 outline-none min-h-[140px] mb-8 custom-scrollbar resize-none transition-colors"
                 ></textarea>

                 <button type="submit" disabled={status === 'loading'} className="w-full py-4 bg-amber-500 text-slate-900 rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-amber-400 transition-all shadow-lg disabled:opacity-50">
                   {status === 'loading' ? 'Enviando a Bóveda Segura...' : 'Enviar Reseña Privada'}
                 </button>
               </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// ==========================================
// --- COMPONENTE: DEMO INVITACIÓN VIP (VENDEDOR) ---
// ==========================================
const DemoBodaVip = () => {
  const [timeLeft, setTimeLeft] = useState({ d: 45, h: 12, m: 30, s: 0 });
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { d, h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; d--; }
        return { d, h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-[#111111] text-white overflow-x-hidden pb-32">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,400&family=Montserrat:wght@300;400;600&display=swap');
        .font-serif { font-family: 'Cormorant Garamond', serif; }
        .font-sans { font-family: 'Montserrat', sans-serif; }
      `}</style>
      
      {/* Banner Superior Baulia */}
      <div className="fixed top-0 w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-center py-2 z-[100] shadow-lg">
        <p className="text-[10px] font-black uppercase tracking-widest text-white flex items-center justify-center">
          <Star size={14} className="mr-2" /> Estás viendo una Invitación Demo de Baulia <Star size={14} className="ml-2" />
        </p>
      </div>

      {/* Hero Portada */}
      <div className="relative h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070')] bg-cover bg-center opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#111111]/60 to-[#111111]"></div>
        
        <div className="relative z-10 mt-10">
          <p className="text-amber-500 uppercase tracking-[0.3em] text-xs font-bold mb-6">Nuestra Boda</p>
          <h1 className="text-7xl md:text-8xl font-serif mb-4 drop-shadow-lg">Ana & Luis</h1>
          <p className="text-lg font-light tracking-widest mt-4">15 . NOVIEMBRE . 2026</p>
        </div>
      </div>

      {/* Cuenta Regresiva */}
      <div className="relative z-10 -mt-20 max-w-3xl mx-auto px-4 mb-24">
        <div className="bg-[#1a1a1a] border border-amber-500/20 rounded-2xl p-6 md:p-8 shadow-2xl flex justify-center gap-4 md:gap-8 text-center">
          {[ {l:'Días', v:timeLeft.d}, {l:'Hrs', v:timeLeft.h}, {l:'Min', v:timeLeft.m}, {l:'Seg', v:timeLeft.s} ].map((t,i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-3xl md:text-5xl font-serif text-amber-500">{String(t.v).padStart(2, '0')}</span>
              <span className="text-[9px] uppercase tracking-widest text-slate-400 mt-2">{t.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detalles del Evento */}
      <div className="max-w-4xl mx-auto px-4 text-center mb-24">
        <h2 className="text-4xl font-serif text-amber-500 mb-12">Dónde y Cuándo</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-[#1a1a1a] p-10 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-colors">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6 text-amber-500"><MapPin size={24}/></div>
            <h3 className="text-2xl font-serif mb-2">Ceremonia</h3>
            <p className="text-sm text-slate-400 mb-6 font-light">Templo de San Francisco<br/>16:00 Hrs</p>
            <button className="text-[10px] uppercase tracking-widest border border-amber-500 text-amber-500 px-6 py-2 rounded-full hover:bg-amber-500 hover:text-white transition-colors">Ver Mapa</button>
          </div>
          <div className="bg-[#1a1a1a] p-10 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-colors">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6 text-amber-500"><MapPin size={24}/></div>
            <h3 className="text-2xl font-serif mb-2">Recepción</h3>
            <p className="text-sm text-slate-400 mb-6 font-light">Hacienda Los Arcángeles<br/>18:00 Hrs</p>
            <button className="text-[10px] uppercase tracking-widest border border-amber-500 text-amber-500 px-6 py-2 rounded-full hover:bg-amber-500 hover:text-white transition-colors">Ver Mapa</button>
          </div>
        </div>
      </div>

      {/* Módulo RSVP Real (Transparente para integrarse al diseño) */}
      <div className="max-w-xl mx-auto px-4 mb-24">
        <h2 className="text-4xl font-serif text-center text-amber-500 mb-4">RSVP</h2>
        <p className="text-center text-slate-400 mb-10 text-sm font-light">Confirma tu asistencia usando la tecnología real de Baulia a continuación.</p>
        
        {/* Usamos el componente real pasándole parámetros de colores oscuros para que combine */}
        <div className="bg-[#1a1a1a] border border-amber-500/30 rounded-3xl shadow-[0_0_30px_rgba(245,158,11,0.1)] overflow-hidden">
           <InvitacionPublicaView eventId="evento_de_prueba" guestUid={null} />
        </div>
      </div>

      {/* Sticky CTA (Botón flotante de ventas) */}
      <div className="fixed bottom-6 w-full px-4 z-[100] flex justify-center pointer-events-none">
        <button onClick={() => window.location.href = '/#planes'} className="pointer-events-auto bg-white text-slate-900 border-2 border-amber-500 px-8 py-4 md:py-5 rounded-full font-black text-xs md:text-sm uppercase tracking-widest shadow-[0_0_40px_rgba(245,158,11,0.6)] hover:scale-105 transition-transform animate-bounce flex items-center">
          Quiero esta Invitación para mi Evento <ArrowRight size={18} className="ml-2"/>
        </button>
      </div>
    </div>
  );
};

// ==========================================
// 3. EL ENRUTADOR PRINCIPAL (App) - CEREBRO MAESTRO
// ==========================================
export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  let modoApp = urlParams.get('modo');
  let eventIdParam = urlParams.get('e') || urlParams.get('evt') || urlParams.get('id');
  const guestUidParam = urlParams.get('u') || urlParams.get('usr') || urlParams.get('uid') || urlParams.get('invitado');

  // 🔴 MAGIA DE RUTAS: DETECTAR SI ES BAULIA.COM O PANEL.BAULIA.COM
  const hostname = window.location.hostname;
  const pathname = window.location.pathname.replace(/^\/+/g, '');
  const isPanel = hostname.startsWith('panel.') || hostname.includes('localhost');

  // ==========================================
  // 1. REGLA DE ORO: TODOS LOS ESTADOS (HOOKS) PRIMERO
  // ==========================================
  const [themeSetting, setThemeSetting] = useState(() => localStorage.getItem('baulia_theme') || 'auto');
  const [systemIsDark, setSystemIsDark] = useState(false);
  const [authData, setAuthData] = useState({ isAuthenticated: false, role: null, plan: null, eventId: null });
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [accountSuspended, setAccountSuspended] = useState(false);

  // ==========================================
  // 2. TODOS LOS EFECTOS SECUNDARIOS
  // ==========================================
  
  // Escucha el sistema del usuario para el Modo Noche
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemIsDark(mediaQuery.matches);
    const handleChange = (e) => setSystemIsDark(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const isDarkMode = themeSetting === 'dark' || (themeSetting === 'auto' && systemIsDark);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [isDarkMode]);

  // Autenticación Global de Firebase
  useEffect(() => {
    if (!window.Html5QrcodeScanner && !document.getElementById('qr-script')) {
      const script = document.createElement('script');
      script.id = 'qr-script';
      script.src = "https://unpkg.com/html5-qrcode";
      script.async = true;
      document.body.appendChild(script);
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user && user.email) {
          const q = query(collection(db, "usuarios"), where("email", "==", user.email.toLowerCase()));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            
            if (userData.status === 'suspendido') {
               await signOut(auth);
               setAccountSuspended(true);
               setAuthData({ isAuthenticated: false, role: null, plan: null, eventId: null });
            } else {
               setAuthData({ isAuthenticated: true, role: userData.role, plan: userData.plan, eventId: userData.eventId });
            }
          } else {
            await signOut(auth);
            setAuthData({ isAuthenticated: false, role: null, plan: null, eventId: null });
          }
        } else {
          setAuthData({ isAuthenticated: false, role: null, plan: null, eventId: null });
        }
      } catch (error) {
        setAuthData({ isAuthenticated: false, role: null, plan: null, eventId: null });
      } finally {
        setIsCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const cycleTheme = () => {
    setThemeSetting(prev => {
      let next = 'auto';
      if (prev === 'auto') next = 'dark';
      else if (prev === 'dark') next = 'light';
      else if (prev === 'light') next = 'auto';

      if (next === 'auto') localStorage.removeItem('baulia_theme');
      else localStorage.setItem('baulia_theme', next);
      
      return next;
    });
  };

  // ==========================================
  // 3. ENRUTAMIENTO (AHORA SÍ, YA PODEMOS REDIRIGIR)
  // ==========================================

  // Si entra a baulia.com/boda-ana-y-luis
  if (!isPanel && pathname && !eventIdParam) {
     eventIdParam = pathname;
     if (!modoApp) modoApp = 'invitacion';
  }

  // 🟢 1. LANDING PAGE PRINCIPAL
  if (!isPanel && !pathname && !eventIdParam) {
      return <LandingPageView isDarkMode={isDarkMode} themeSetting={themeSetting} cycleTheme={cycleTheme} />;
  }
  
  // 🟢 2. RUTA DEMO (EL VENDEDOR SILENCIOSO)
  if (eventIdParam === 'demo-boda-vip') {
    return <DemoBodaVip />;
  }

  // 🟢 3. RUTAS PÚBLICAS (INVITADOS)
  if (modoApp === 'camara') { 
    if (!eventIdParam) return <div className="p-10 text-center font-bold text-rose-500 mt-10 text-xl">Error: Enlace roto (Falta código de evento).</div>;
    return <GuestCameraView eventId={eventIdParam} />; 
  } 
  if (modoApp === 'proyector') { 
    if (!eventIdParam) return <div className="p-10 text-center font-bold text-rose-500 mt-10 text-xl">Error: Enlace roto (Falta código de evento).</div>;
    return <GuestProyectorView eventId={eventIdParam} />; 
  } 
  if (modoApp === 'invitacion') { 
    if (!eventIdParam) return <div className="p-10 text-center font-bold text-rose-500 mt-10 text-xl">Error: Enlace de invitación roto.</div>;
    return <InvitacionPublicaView eventId={eventIdParam} guestUid={guestUidParam} />; 
  }
  if (modoApp === 'puerta') {
    if (!eventIdParam) return <div className="p-10 text-center font-bold text-rose-500 text-2xl mt-10">❌ Enlace de puerta inválido.</div>;
    return <HostessStandaloneView eventId={eventIdParam} />;
  }

  // 🟢 4. ZONA SEGURA (PANEL DE CLIENTES/ADMIN)
  if (isCheckingAuth) return <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center text-amber-500 font-bold"><RefreshCw size={40} className="animate-spin mb-4" /> Bóveda Segura...</div>;

  if (accountSuspended) return (
      <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle size={64} className="text-rose-500 mb-4 animate-pulse" />
        <h1 className="text-2xl font-black text-white mb-2">Cuenta Suspendida</h1>
        <p className="text-slate-400 max-w-sm">Contacta a tu administrador de plataforma para reactivar tu licencia.</p>
      </div>
  );

  if (!authData.isAuthenticated) { return <LoginScreen />; }
  
  return (
    <>
      <AdminDashboard authData={authData} />
      <ReviewHarvester authData={authData} />
    </>
  );
}