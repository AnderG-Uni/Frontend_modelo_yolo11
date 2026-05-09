import React, { useState } from 'react';

function Registro({ onRegistroExitoso }) {
  // 1. Estos son los estados que probablemente se borraron
  const [formData, setFormData] = useState({
    Nombres: '',
    id_universitario: '',
    Placa: '',
    Tipo_vehiculo: 'Automóvil',
    color: ''
  });
  const [mensaje, setMensaje] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje({ texto: 'Procesando registro...', tipo: 'info' });

    try {
      const response = await fetch('http://localhost:3000/api/v1/vehiculos/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      if (response.ok) {
        setMensaje({ texto: '¡Vehículo registrado con éxito!', tipo: 'exito' });
        setFormData({ Nombres: '', id_universitario: '', Placa: '', Tipo_vehiculo: 'Automóvil', color: '' });
        
        // 2. Aquí llamamos al gatillo para actualizar la tabla
        if (onRegistroExitoso) {
          onRegistroExitoso();
        }
      } else {
        setMensaje({ texto: `Error: ${data.error} - ${data.detalle || ''}`, tipo: 'error' });
      }
    } catch (error) {
      setMensaje({ texto: 'Error de conexión con el servidor API', tipo: 'error' });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-800 px-5 py-3">
        <h2 className="text-sm font-bold text-white">Nuevo Vehículo</h2>
      </div>

      <div className="p-5">
        {mensaje && (
          <div className={`mb-4 p-2.5 rounded-lg text-xs font-medium text-center ${mensaje.tipo === 'exito' ? 'bg-green-50 text-green-700' : mensaje.tipo === 'error' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
            {mensaje.texto}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Propietario</label>
              <input type="text" name="Nombres" value={formData.Nombres} onChange={handleChange} required className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded outline-none focus:border-blue-500" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ID Univ.</label>
              <input type="text" name="id_universitario" value={formData.id_universitario} onChange={handleChange} required className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded outline-none focus:border-blue-500" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Placa</label>
              <input type="text" name="Placa" value={formData.Placa} onChange={handleChange} required maxLength="6" className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded outline-none focus:border-blue-500 uppercase font-bold tracking-widest" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo</label>
              <select name="Tipo_vehiculo" value={formData.Tipo_vehiculo} onChange={handleChange} className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded outline-none focus:border-blue-500">
                <option value="Automóvil">Auto</option>
                <option value="Motocicleta">Moto</option>
                <option value="Camioneta">Camioneta</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Color</label>
              <input type="text" name="color" value={formData.color} onChange={handleChange} required className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded outline-none focus:border-blue-500" />
            </div>
          </div>

          <button type="submit" className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-sm transition-all shadow-md">
            Registrar
          </button>
        </form>
      </div>
    </div>
  );
}

export default Registro;