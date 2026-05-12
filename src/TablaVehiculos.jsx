import React, { useState, useEffect } from 'react';

function TablaVehiculos({ refreshTrigger }) {
  const [vehiculos, setVehiculos] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(false);
  
  // NUEVO: Estado para almacenar la búsqueda en tiempo real
  const [busqueda, setBusqueda] = useState('');

  const fetchVehiculos = async (page) => {
    setCargando(true);
    try {
      const response = await fetch(`http://localhost:3000/api/v1/vehiculos?page=${page}&limit=8`);
      const data = await response.json();
      if (data.estado === 'OK') {
        setVehiculos(data.datos);
        setTotalPaginas(data.paginacion.totalPaginas);
        setPagina(data.paginacion.paginaActual);
      }
    } catch (error) {
      console.error("Error al cargar la tabla", error);
    }
    setCargando(false);
  };

  useEffect(() => {
    fetchVehiculos(pagina);
  }, [pagina]);

  useEffect(() => {
    if (refreshTrigger > 0 && pagina === 1) {
      fetchVehiculos(1);
    }
  }, [refreshTrigger]);

  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
  };

  // NUEVO: Lógica de filtrado en tiempo real en el frontend
  const vehiculosFiltrados = vehiculos.filter((v) => {
    const termino = busqueda.toLowerCase();
    const placaMatch = v.Placa.toLowerCase().includes(termino);
    const nombreMatch = v.Nombres.toLowerCase().includes(termino);
    const idMatch = v.id_universitario.toLowerCase().includes(termino);
    return placaMatch || nombreMatch || idMatch;
  });

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* ENCABEZADO ACTUALIZADO CON BARRA DE BÚSQUEDA */}
      <div className="bg-slate-800 px-5 py-3 flex justify-between items-center gap-4">
        <h3 className="text-white font-semibold text-sm whitespace-nowrap">Vehículos Registrados</h3>
        
        {/* Barra de búsqueda centrada */}
        <div className="flex-1 max-w-md relative mx-auto hidden sm:block">
          <input 
            type="text" 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por placa, nombre o ID..." 
            className="w-full bg-slate-700/50 text-white placeholder-slate-400 text-xs px-4 py-2 rounded-full outline-none focus:bg-slate-700 focus:ring-2 focus:ring-blue-500 border border-slate-600 transition-all" 
          />
          {busqueda ? (
            <button 
              onClick={() => setBusqueda('')} 
              className="absolute right-3 top-2 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          ) : (
            <svg className="w-4 h-4 text-slate-400 absolute right-3 top-2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          )}
        </div>

        <button onClick={() => fetchVehiculos(pagina)} className="text-slate-300 hover:text-white text-xs whitespace-nowrap">🔄 Actualizar</button>
      </div>
      
      <div className="flex-1 overflow-auto p-0">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 uppercase text-xs sticky top-0 shadow-sm">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">Placa</th>
              {/* NUEVAS COLUMNAS */}
              <th className="px-4 py-3 whitespace-nowrap">Propietario</th>
              <th className="px-4 py-3 whitespace-nowrap">Identificación</th>
              {/* FIN NUEVAS COLUMNAS */}
              <th className="px-4 py-3 whitespace-nowrap">Tipo</th>
              <th className="px-4 py-3 whitespace-nowrap">Color</th>
              <th className="px-4 py-3 whitespace-nowrap">Fecha Registro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cargando ? (
              <tr><td colSpan="6" className="text-center py-10 text-slate-400">Cargando...</td></tr>
            ) : vehiculosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-10 text-slate-400">
                  {busqueda ? 'No se encontraron coincidencias' : 'No hay vehículos registrados'}
                </td>
              </tr>
            ) : (
              // Usamos vehiculosFiltrados en el mapeo
              vehiculosFiltrados.map((v) => (
                <tr key={v._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-blue-700 tracking-wider whitespace-nowrap">{v.Placa}</td>
                  {/* CELDAS DE LAS NUEVAS COLUMNAS */}
                  <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{v.Nombres}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{v.id_universitario}</td>
                  {/* --------------------------- */}
                  <td className="px-4 py-3 whitespace-nowrap">{v.Tipo_vehiculo}</td>
                  <td className="px-4 py-3 capitalize whitespace-nowrap">{v.color}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatearFecha(v.createdAt || v.fecha_registro)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex justify-between items-center">
        <button 
          disabled={pagina === 1} 
          onClick={() => setPagina(pagina - 1)}
          className="px-3 py-1 bg-white border border-slate-300 rounded text-xs font-medium text-slate-600 disabled:opacity-50 hover:bg-slate-100 transition-colors"
        >
          Anterior
        </button>
        <span className="text-xs text-slate-500">Página {pagina} de {totalPaginas}</span>
        <button 
          disabled={pagina === totalPaginas || totalPaginas === 0} 
          onClick={() => setPagina(pagina + 1)}
          className="px-3 py-1 bg-white border border-slate-300 rounded text-xs font-medium text-slate-600 disabled:opacity-50 hover:bg-slate-100 transition-colors"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

export default TablaVehiculos;