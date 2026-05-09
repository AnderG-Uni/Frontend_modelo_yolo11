import React, { useState, useEffect } from 'react';

function Historial() {
  const [registros, setRegistros] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(false);

  const fetchHistorial = async (page) => {
    setCargando(true);
    try {
      // AJUSTE 1: Cambiamos limit=10 a limit=8
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

  useEffect(() => { fetchHistorial(pagina); }, [pagina]);

  const formatearFechaHora = (fechaISO) => {
    if (!fechaISO) return null;
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-800 px-5 py-3 flex justify-between items-center">
        <h2 className="text-sm font-bold text-white">🕒 Historial de Entradas y Salidas</h2>
        <button onClick={() => fetchHistorial(pagina)} className="text-slate-300 hover:text-white text-xs">🔄 Refrescar</button>
      </div>

      <div className="flex-1 overflow-auto bg-white p-0">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] sticky top-0 shadow-sm">
            <tr>
              <th className="px-4 py-3 border-b border-slate-100 whitespace-nowrap">Vehículo</th>
              <th className="px-4 py-3 border-b border-slate-100 whitespace-nowrap">Propietario</th>
              <th className="px-4 py-3 border-b border-slate-100 whitespace-nowrap">Ingreso</th>
              <th className="px-4 py-3 border-b border-slate-100 whitespace-nowrap">Salida</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cargando ? (
              <tr><td colSpan="4" className="text-center py-10 text-slate-400">Cargando datos...</td></tr>
            ) : registros.length === 0 ? (
              <tr><td colSpan="4" className="text-center py-10 text-slate-400">No hay registros</td></tr>
            ) : (
              registros.map((reg) => (
                <tr key={reg._id} className="hover:bg-slate-50 transition-colors">
                  {/* AJUSTE 2: Cambiamos py-2.5 a py-3 para igualar la otra tabla */}
                  <td className="px-4 py-3 font-bold text-slate-800 tracking-wider uppercase whitespace-nowrap">{reg.placa}</td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{reg.propietario}</td>
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