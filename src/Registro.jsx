import React, { useState } from 'react';

function Registro({ onRegistroExitoso }) {
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
    // Diseño ampliado con sombras más suaves y mayor padding
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden w-full">
      <div className="bg-slate-800 px-8 py-5">
        <h2 className="text-lg font-bold text-white tracking-wide">Registro de Nuevo Vehículo</h2>
        <p className="text-slate-300 text-sm mt-1">Ingrese los datos para autorizar el acceso al establecimiento.</p>
      </div>

      <div className="p-8">
        {mensaje && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-semibold text-center shadow-sm ${mensaje.tipo === 'exito' ? 'bg-green-50 text-green-700 border border-green-200' : mensaje.tipo === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
            {mensaje.texto}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Nombre del Propietario</label>
              <input type="text" name="Nombres" value={formData.Nombres} onChange={handleChange} required className="w-full px-4 py-2.5 text-base bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" placeholder="Ej: Juan Pérez" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">ID Universitario / Cédula</label>
              <input type="text" name="id_universitario" value={formData.id_universitario} onChange={handleChange} required className="w-full px-4 py-2.5 text-base bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Placa del Vehículo</label>
              <input type="text" name="Placa" value={formData.Placa} onChange={handleChange} required maxLength="6" className="w-full px-4 py-2.5 text-lg bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 uppercase font-black tracking-widest text-blue-900" placeholder="XYZ123" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Vehículo</label>
              <select name="Tipo_vehiculo" value={formData.Tipo_vehiculo} onChange={handleChange} className="w-full px-4 py-2.5 text-base bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                <option value="Automóvil">Automóvil</option>
                <option value="Motocicleta">Motocicleta</option>
                <option value="Camioneta">Camioneta</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Color</label>
              <input type="text" name="color" value={formData.color} onChange={handleChange} required className="w-full px-4 py-2.5 text-base bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" placeholder="Ej: Negro" />
            </div>
          </div>

          <button type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-base transition-all shadow-lg hover:shadow-blue-500/30">
            Guardar Vehículo
          </button>
        </form>
      </div>
    </div>
  );
}

export default Registro;