import React, { useState } from 'react';
import unicatolicaIcono from './assets/unicatolica-icono.svg'; 
import Registro from './Registro';
import Escaner from './Escaner';
import TablaVehiculos from './TablaVehiculos';
import Historial from './Historial';

function App() {
  const [moduloActivo, setModuloActivo] = useState('escaner');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRegistroExitoso = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="h-screen w-screen bg-slate-50 font-sans text-slate-800 flex flex-col overflow-hidden">
      
      {/* HEADER / NAVBAR */}
      <header className="bg-white shadow-sm border-b border-slate-200 h-14 flex-shrink-0 z-50">
        <div className="w-full h-full px-6 flex justify-between items-center">
          
          <div className="flex items-center gap-3">
            <img 
              src={unicatolicaIcono} 
              alt="Logo Unicatólica" 
              className="h-9 w-auto object-contain" 
            />
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
            <button 
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${moduloActivo === 'historial' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`} 
              onClick={() => setModuloActivo('historial')}
            >
              🕒 Historial
            </button>
            {/* NUEVO: Botón para la tabla de vehículos */}
            <button 
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${moduloActivo === 'vehiculos' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`} 
              onClick={() => setModuloActivo('vehiculos')}
            >
              🚘 Vehículos Registrados
            </button>
          </nav>
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL: Ahora es una sola vista centrada */}
      <main className="flex-1 flex overflow-hidden p-6 justify-center items-center">
        
        {/* Usamos un contenedor que cambia de ancho máximo dependiendo del módulo */}
        {moduloActivo === 'registro' && (
          <div className="w-full max-w-2xl h-full flex flex-col justify-center pb-10 overflow-y-auto">
            <Registro onRegistroExitoso={handleRegistroExitoso} />
          </div>
        )}

        {moduloActivo === 'escaner' && (
          <div className="w-full max-w-5xl h-[600px] flex flex-col justify-center overflow-y-auto">
            <Escaner />
          </div>
        )}

        {moduloActivo === 'historial' && (
          <div className="w-full max-w-5xl h-full pb-4">
            <Historial />
          </div>
        )}

        {moduloActivo === 'vehiculos' && (
          <div className="w-full max-w-5xl h-full pb-4">
            <TablaVehiculos refreshTrigger={refreshTrigger} />
          </div>
        )}

      </main>
    </div>
  );
}

export default App;