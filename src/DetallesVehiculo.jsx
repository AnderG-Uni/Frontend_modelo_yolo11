import React, { useState, useEffect } from 'react';

function DetallesVehiculo({ placa, onVolver }) {
  const [vehiculo, setVehiculo] = useState(null);
  const [historialPlaca, setHistorialPlaca] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchDetalles = async () => {
      setCargando(true);
      try {
        const [resVehiculo, resHistorial] = await Promise.all([
          fetch(`http://localhost:3000/api/v1/vehiculos/${placa}`),
          fetch(`http://localhost:3000/api/v1/historial/vehiculo/${placa}`)
        ]);

        const dataVehiculo = await resVehiculo.json();
        const dataHistorial = await resHistorial.json();

        // Extraemos el historial primero para saber si es un visitante
        let esVisitante = false;
        let ultimoRegistroVisitante = null;

        if (dataHistorial.estado === 'OK' && dataHistorial.datos.length > 0) {
          setHistorialPlaca(dataHistorial.datos);
          // Tomamos el registro más reciente
          const ultimo = dataHistorial.datos[0];
          // Validamos si tiene la etiqueta de visitante o si en observaciones dice "visitante"
          if (ultimo.tipo_registro === 'Visitante' || (ultimo.observaciones && ultimo.observaciones.toLowerCase().includes('visitante'))) {
            esVisitante = true;
            ultimoRegistroVisitante = ultimo;
          }
        } else {
          setHistorialPlaca([]);
        }

        // LÓGICA CONDICIONAL PARA POBLAR LA TARJETA
        if (dataVehiculo.estado === 'OK') {
          // 1. Es un vehículo registrado normalmente (Estudiantes, Profesores, etc.)
          setVehiculo(dataVehiculo.datos);
        } else if (esVisitante && ultimoRegistroVisitante) {
          // 2. No está registrado, pero ES UN VISITANTE en el historial
          setVehiculo({
            Placa: ultimoRegistroVisitante.placa,
            Nombres: ultimoRegistroVisitante.propietario,
            id_universitario: ultimoRegistroVisitante.identificacion || '---',
            Tipo_vehiculo: ultimoRegistroVisitante.tipo_registro, // Traerá "Visitante"
            color: ultimoRegistroVisitante.color || '---',
            ruta_foto: ultimoRegistroVisitante.ruta_foto // Traemos la foto del backend
          });
        } else {
          // 3. Definitivamente no existe en ningún lado (vehículo fantasma)
          setVehiculo({
            Placa: placa,
            Nombres: 'Vehículo no encontrado en BD',
            id_universitario: '---',
            Tipo_vehiculo: '---',
            color: '---',
            ruta_foto: null
          });
        }

      } catch (error) {
        console.error("Error al cargar detalles de la base de datos:", error);
      } finally {
        setCargando(false);
      }
    };

    fetchDetalles();
  }, [placa]);

  const formatearFechaHora = (fechaISO) => {
    if (!fechaISO) return null;
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in-up">
      
      {/* HEADER CON BOTÓN DE ATRÁS */}
      <div className="bg-slate-800 px-5 py-3 flex items-center gap-4">
        <button 
          onClick={onVolver}
          className="flex items-center gap-1.5 text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          Atrás
        </button>
        <h2 className="text-sm font-bold text-white">Detalles del Vehículo: <span className="text-blue-400">{placa}</span></h2>
      </div>

      <div className="flex-1 overflow-auto p-6 flex flex-col gap-6">
        
        {cargando ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-sm font-medium">Cargando información desde la base de datos...</p>
          </div>
        ) : (
          <>
            {/* 1. TARJETA DE INFORMACIÓN DEL VEHÍCULO */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-center gap-6 shadow-sm">
              
              {/* CÍRCULO DE FOTO: Ahora es dinámico */}
              <div className="w-20 h-20 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-inner flex-shrink-0 overflow-hidden">
                {vehiculo?.ruta_foto ? (
                  <img 
                    src={`http://localhost:3000${vehiculo.ruta_foto}`} 
                    alt="Foto del Visitante" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl">🚗</span>
                )}
              </div>
              
              <div className="flex-1 grid grid-cols-3 gap-y-4 gap-x-6">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Placa</span>
                  <span className="font-black text-xl text-blue-700">{vehiculo?.Placa}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Propietario</span>
                  <span className="font-bold text-slate-800 text-lg">{vehiculo?.Nombres}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Identificación</span>
                  <span className="font-semibold text-slate-700">{vehiculo?.id_universitario}</span>
                </div>
                <div>
                  {/* TÍTULO CONDICIONAL: Si es Visitante dice "TIPO USUARIO", si no dice "TIPO" */}
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">
                    {vehiculo?.Tipo_vehiculo === 'Visitante' ? 'Tipo Usuario' : 'Tipo'}
                  </span>
                  <span className="font-semibold text-slate-700">{vehiculo?.Tipo_vehiculo}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Color</span>
                  <span className="font-semibold text-slate-700">{vehiculo?.color}</span>
                </div>
              </div>
            </div>

            {/* 2. TABLA DE HISTORIAL ESPECÍFICO */}
            <div className="flex flex-col flex-1 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Últimos Ingresos Registrados</h3>
              </div>
              
              <div className="flex-1 overflow-auto bg-white">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] sticky top-0">
                    <tr>
                      <th className="px-4 py-2.5 border-b border-slate-100">Fecha de Ingreso</th>
                      <th className="px-4 py-2.5 border-b border-slate-100">Fecha de Salida</th>
                      <th className="px-4 py-2.5 border-b border-slate-100 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historialPlaca.length === 0 ? (
                      <tr><td colSpan="3" className="text-center py-8 text-slate-400 text-sm">No hay registros previos para mostrar.</td></tr>
                    ) : (
                      historialPlaca.map((reg, index) => (
                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">{formatearFechaHora(reg.fecha_ingreso)}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{reg.fecha_salida ? formatearFechaHora(reg.fecha_salida) : '--'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            {!reg.fecha_salida ? (
                              <span className="bg-green-50 text-green-600 border border-green-200 px-2.5 py-0.5 rounded text-[11px] font-bold shadow-sm">Adentro</span>
                            ) : (
                              <span className="bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded text-[11px] font-bold">Salió</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DetallesVehiculo;