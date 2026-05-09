import React, { useState, useEffect } from 'react';

// Fíjate en esta línea: Aquí es donde recibimos la variable 'refreshTrigger'
function TablaVehiculos({ refreshTrigger }) {
  const [vehiculos, setVehiculos] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(false);

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

  // useEffect normal: se ejecuta al inicio y cada vez que cambias de página manualmente
  useEffect(() => {
    fetchVehiculos(pagina);
  }, [pagina]);

  // useEffect gatillo: se ejecuta cuando guardas un vehículo nuevo desde el formulario
  useEffect(() => {
    if (refreshTrigger > 0 && pagina === 1) {
      fetchVehiculos(1);
    }
  }, [refreshTrigger]);

  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-800 px-5 py-3 flex justify-between items-center">
        <h3 className="text-white font-semibold text-sm">Vehículos Registrados</h3>
        <button onClick={() => fetchVehiculos(pagina)} className="text-slate-300 hover:text-white text-xs">🔄 Actualizar</button>
      </div>
      
      <div className="flex-1 overflow-auto p-0">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 uppercase text-xs sticky top-0 shadow-sm">
            <tr>
              <th className="px-4 py-3">Placa</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Color</th>
              <th className="px-4 py-3">Fecha Registro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cargando ? (
              <tr><td colSpan="4" className="text-center py-10 text-slate-400">Cargando...</td></tr>
            ) : vehiculos.length === 0 ? (
              <tr><td colSpan="4" className="text-center py-10 text-slate-400">No hay vehículos registrados</td></tr>
            ) : (
              vehiculos.map((v) => (
                <tr key={v._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-800">{v.Placa}</td>
                  <td className="px-4 py-3">{v.Tipo_vehiculo}</td>
                  <td className="px-4 py-3 capitalize">{v.color}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatearFecha(v.createdAt || v.fecha_registro)}</td>
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
          className="px-3 py-1 bg-white border border-slate-300 rounded text-xs font-medium text-slate-600 disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="text-xs text-slate-500">Página {pagina} de {totalPaginas}</span>
        <button 
          disabled={pagina === totalPaginas || totalPaginas === 0} 
          onClick={() => setPagina(pagina + 1)}
          className="px-3 py-1 bg-white border border-slate-300 rounded text-xs font-medium text-slate-600 disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

export default TablaVehiculos;