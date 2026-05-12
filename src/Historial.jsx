import React, { useState, useEffect } from 'react';
import DetallesVehiculo from './DetallesVehiculo'; 

function Historial() {
  const [registros, setRegistros] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [placaSeleccionada, setPlacaSeleccionada] = useState(null);

  const [busqueda, setBusqueda] = useState('');

  const fetchHistorial = async (page) => {
    setCargando(true);
    try {
      const response = await fetch(`http://localhost:3000/api/v1/historial?page=${page}&limit=8`);
      const data = await response.json();
      if (data.estado === 'OK') {
        setRegistros(data.datos);
        setTotalPaginas(data.paginacion.totalPaginas);
        setPagina(data.paginacion.paginaActual);
      }
    } catch (error) {
      console.error("Error al cargar historial", error);
    }
    setCargando(false);
  };

  useEffect(() => { 
    if (!placaSeleccionada) {
      fetchHistorial(pagina); 
    }
  }, [pagina, placaSeleccionada]);

  const formatearFechaHora = (fechaISO) => {
    if (!fechaISO) return null;
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const registrosFiltrados = registros.filter((reg) => {
    const termino = busqueda.toLowerCase();
    const placaMatch = reg.placa.toLowerCase().includes(termino);
    const propietarioMatch = reg.propietario.toLowerCase().includes(termino);
    return placaMatch || propietarioMatch;
  });

  if (placaSeleccionada) {
    return <DetallesVehiculo placa={placaSeleccionada} onVolver={() => setPlacaSeleccionada(null)} />;
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in-up">
      
      {/* HEADER CON BARRA DE BÚSQUEDA CENTRADA */}
      <div className="bg-slate-800 px-5 py-3 flex justify-between items-center gap-4">
        <h2 className="text-sm font-bold text-white whitespace-nowrap">🕒 Historial de Entradas y Salidas</h2>
        
        {/* BARRA DE BÚSQUEDA */}
        <div className="flex-1 max-w-md relative mx-auto hidden sm:block">
          <input 
            type="text" 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar vehículo por placa o propietario..." 
            className="w-full bg-slate-700/50 text-white placeholder-slate-400 text-xs px-4 py-2 rounded-full outline-none focus:bg-slate-700 focus:ring-2 focus:ring-blue-500 border border-slate-600 transition-all" 
          />
          {busqueda ? (
            <button onClick={() => setBusqueda('')} className="absolute right-3 top-2 text-slate-400 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          ) : (
            <svg className="w-4 h-4 text-slate-400 absolute right-3 top-2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          )}
        </div>

        <button onClick={() => fetchHistorial(pagina)} className="text-slate-300 hover:text-white text-xs whitespace-nowrap">🔄 Refrescar</button>
      </div>

      <div className="flex-1 overflow-auto bg-white p-0">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] sticky top-0 shadow-sm">
            <tr>
              <th className="px-4 py-3 border-b border-slate-100 whitespace-nowrap">Vehículo</th>
              <th className="px-4 py-3 border-b border-slate-100 whitespace-nowrap">Propietario</th>
              {/* NUEVA COLUMNA: TIPO */}
              <th className="px-4 py-3 border-b border-slate-100 whitespace-nowrap">Tipo</th>
              <th className="px-4 py-3 border-b border-slate-100 whitespace-nowrap">Ingreso</th>
              <th className="px-4 py-3 border-b border-slate-100 whitespace-nowrap">Salida</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cargando ? (
              <tr><td colSpan="5" className="text-center py-10 text-slate-400">Cargando datos...</td></tr>
            ) : registrosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-10 text-slate-400">
                  {busqueda ? 'No se encontraron coincidencias' : 'No hay registros'}
                </td>
              </tr>
            ) : (
              registrosFiltrados.map((reg) => (
                <tr key={reg._id} className="hover:bg-slate-50 transition-colors">
                  <td 
                    className="px-4 py-3 font-black text-blue-600 tracking-wider uppercase whitespace-nowrap cursor-pointer hover:text-blue-800 hover:underline transition-all"
                    onClick={() => setPlacaSeleccionada(reg.placa)}
                  >
                    {reg.placa}
                  </td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{reg.propietario}</td>
                  
                  {/* NUEVA CELDA: Lógica condicional para el Tipo */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {reg.tipo_registro === 'Visitante' ? (
                      <span className="bg-orange-50 text-orange-600 border border-orange-200 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                        Visitante
                      </span>
                    ) : (
                      <span className="bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                        Usuario
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{formatearFechaHora(reg.fecha_ingreso)}</td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {reg.fecha_salida ? (
                      <span className="text-slate-500">{formatearFechaHora(reg.fecha_salida)}</span>
                    ) : (
                      <span className="bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded text-[11px] font-bold shadow-sm">
                        Activo
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex justify-between items-center">
        <button 
          disabled={pagina === 1} 
          onClick={() => setPagina(pagina - 1)}
          className="px-3 py-1 bg-white border border-slate-300 rounded text-xs font-medium text-slate-600 disabled:opacity-50 transition-colors hover:bg-slate-50"
        >
          Anterior
        </button>
        <span className="text-xs text-slate-500">Página {pagina} de {totalPaginas}</span>
        <button 
          disabled={pagina === totalPaginas || totalPaginas === 0} 
          onClick={() => setPagina(pagina + 1)}
          className="px-3 py-1 bg-white border border-slate-300 rounded text-xs font-medium text-slate-600 disabled:opacity-50 transition-colors hover:bg-slate-50"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

export default Historial;