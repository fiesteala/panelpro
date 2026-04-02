import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { Lock, AlertCircle, Loader2 } from 'lucide-react';
import { db } from '../firebase'; 

const GuardianBoveda = ({ eventId, children }) => {
  const [estado, setEstado] = useState('cargando'); // cargando, activo, suspendido, error

  useEffect(() => {
    const verificarAcceso = async () => {
      if (!eventId) {
        setEstado('error');
        return;
      }

      try {
        const docRef = doc(db, "usuarios", eventId);
        const docSnap = await getDoc(docRef);

        // Si la eliminaste por completo
        if (!docSnap.exists()) {
          setEstado('error');
          return;
        }

        // Si le pusiste "Suspender" en tu SuperAdmin
        if (docSnap.data().status === 'suspendido') {
          setEstado('suspendido');
          return;
        }

        // Todo está perfecto, luz verde
        setEstado('activo');

      } catch (error) {
        console.error("Error del guardián:", error);
        // Si hay una falla de internet, por seguridad dejamos pasar para no bloquear la boda por error
        setEstado('activo'); 
      }
    };

    verificarAcceso();
  }, [eventId]);

  if (estado === 'cargando') {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
        <Loader2 size={40} className="animate-spin text-amber-500 mb-4" />
        <p className="font-bold tracking-widest uppercase text-xs text-slate-400">Verificando seguridad de bóveda...</p>
      </div>
    );
  }

  if (estado === 'suspendido') {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border border-rose-500/20">
          <Lock size={32} className="text-rose-500" />
        </div>
        <h1 className="text-2xl font-editorial font-black mb-2">Acceso Restringido</h1>
        <p className="text-slate-400 text-sm max-w-sm">
          Esta invitación se encuentra temporalmente suspendida o en mantenimiento. Contacta a los organizadores del evento.
        </p>
      </div>
    );
  }

  if (estado === 'error') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-slate-900 p-6 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <AlertCircle size={32} className="text-slate-400" />
        </div>
        <h1 className="text-2xl font-black mb-2">Invitación no encontrada</h1>
        <p className="text-slate-500 text-sm max-w-sm">
          El enlace al que intentas acceder no existe o la bóveda fue eliminada permanentemente.
        </p>
      </div>
    );
  }

  // Si está activo, devuelve a los "hijos" (que será tu InvitacionPublicaView intacta)
  return <>{children}</>;
};

export default GuardianBoveda;