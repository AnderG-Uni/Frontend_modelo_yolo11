import React, { useState } from 'react';
import Registro from './Registro';
import Escaner from './Escaner';
import TablaVehiculos from './TablaVehiculos';
import Historial from './Historial'; // NUEVO: Importamos el componente

function App() {
  const [moduloActivo, setModuloActivo] = useState('escaner');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRegistroExitoso = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="h-screen w-screen bg-slate-50 font-sans text-slate-800 flex flex-col overflow-hidden">
      
      <header className="bg-white shadow-sm border-b border-slate-200 h-14 flex-shrink-0 z-50">
        <div className="w-full h-full px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">AL</div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">
              Control de Acceso <span className="text-blue-600">Vehicular</span>
            </h1>
          </div>
          
          <nav className="flex gap-2">
            <button 
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${moduloActivo === 'registro' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`} 
              onClick={() => setModuloActivo('registro')}
            >
              📋 Registro
            </button>
            <button 
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${moduloActivo === 'escaner' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`} 
              onClick={() => setModuloActivo('escaner')}
            >
              📷 Escáner
            </button>
            {/* NUEVO: Botón de Historial */}
            <button 
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${moduloActivo === 'historial' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`} 
              onClick={() => setModuloActivo('historial')}
            >
              🕒 Historial
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden p-4 gap-4">
        
        {/* Columna Izquierda: Modulo Activo (Ocupa 50%) */}
        {/* NUEVO: Si es el historial, le quitamos el max-w-md y le damos h-full para que crezca */}
        <div className="w-1/2 h-full flex flex-col justify-center items-center overflow-y-auto">
          {/* AQUÍ ESTÁ EL CAMBIO: Quitamos el 'pb-2' para que queden niveladas en la parte inferior */}
          <div className={`w-full ${moduloActivo === 'historial' ? 'h-full' : 'max-w-md'}`}>
            {moduloActivo === 'registro' && <Registro onRegistroExitoso={handleRegistroExitoso} />}
            {moduloActivo === 'escaner' && <Escaner />}
            {moduloActivo === 'historial' && <Historial />}
          </div>
        </div>

        {/* Columna Derecha: Tabla de Datos (Ocupa 50%) */}
        <div className="w-1/2 h-full">
          <TablaVehiculos refreshTrigger={refreshTrigger} />
        </div>

      </main>
    </div>
  );
}

export default App;