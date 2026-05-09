import React, { useRef, useState, useEffect } from 'react';

function Escaner() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [escaneando, setEscaneando] = useState(false);
  const [resultado, setResultado] = useState({ estado: 'ESPERANDO', texto: 'Cámara apagada' });
  const [boxUI, setBoxUI] = useState(null);

  const [mostrarTarjetaExito, setMostrarTarjetaExito] = useState(false);
  const [datosVehiculoExitoso, setDatosVehiculoExitoso] = useState(null);
  const [accionVehiculo, setAccionVehiculo] = useState('INGRESO');

  // EL CANDADO DE SEGURIDAD: Evita enviar fotos si Python está ocupado
  const procesandoRef = useRef(false);

  const iniciarCamara = async () => {
    try {
      setMostrarTarjetaExito(false); setDatosVehiculoExitoso(null); setBoxUI(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setEscaneando(true);
      procesandoRef.current = false; // Liberamos el candado al iniciar
      setResultado({ estado: 'BUSCANDO', texto: 'Analizando fotogramas...' });
    } catch (error) {
      alert("Error al acceder a la cámara.");
    }
  };

  const detenerCamara = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setEscaneando(false);
    setResultado({ estado: 'ESPERANDO', texto: 'Cámara apagada' });
    setBoxUI(null); 
  };

  const reintentarEscaner = () => iniciarCamara();

  useEffect(() => {
    let intervalo;
    let escaneoActivo = true; 

    const capturarYEnviar = async () => {
      // SI PYTHON AÚN ESTÁ PROCESANDO, O SI LA CÁMARA SE APAGÓ, IGNORAMOS ESTE CICLO
      if (!videoRef.current || !canvasRef.current || procesandoRef.current || !escaneoActivo) return;

      // CERRAMOS EL CANDADO
      procesandoRef.current = true;

      const ctx = canvasRef.current.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

      canvasRef.current.toBlob(async (blob) => {
        const formData = new FormData(); 
        formData.append('imagen', blob, 'frame.jpg');
        
        try {
          const response = await fetch('http://localhost:3000/api/v1/reconocimiento/escanear', { 
            method: 'POST', body: formData 
          });
          const data = await response.json();

          if (!escaneoActivo) return; // Si apagó la cámara mientras llegaba la respuesta, ignoramos

          if (data.box) {
            setBoxUI({ ...data.box, color: data.estado === 'OK' ? '#22c55e' : '#ef4444', etiqueta: `${data.placa} ${data.confianza}%` });
          } else {
            setBoxUI(null);
          }

          if (data.estado === 'OK') {
            setResultado({ estado: 'OK', texto: `${data.mensaje} • ${data.placa}` });
            detenerCamara(); 
            setDatosVehiculoExitoso(data.datosVehiculo);
            setAccionVehiculo(data.accion);
            setMostrarTarjetaExito(true);
          } else if (data.estado === 'FAIL' && data.placa) {
            setResultado({ estado: 'FAIL', texto: data.mensaje });
          } else {
            setResultado({ estado: 'BUSCANDO', texto: 'Buscando placa...' });
          }
        } catch (error) {
          if (escaneoActivo) console.error("Error contactando al API");
        } finally {
          // IMPORTANTE: SIN IMPORTAR SI FALLÓ O FUNCIONÓ, ABRIMOS EL CANDADO PARA LA SIGUIENTE FOTO
          if (escaneoActivo) procesandoRef.current = false;
        }
      }, 'image/jpeg', 0.8);
    };

    // Revisamos muy rápido (cada 200ms), pero gracias al candado, solo disparará cuando Python esté libre
    if (escaneando) intervalo = setInterval(capturarYEnviar, 200); 
    
    return () => { 
      escaneoActivo = false; 
      clearInterval(intervalo); 
    };
  }, [escaneando]);

  const getColorClase = () => {
    if (resultado.estado === 'OK') return 'bg-green-500 text-white';
    if (resultado.estado === 'FAIL') return 'bg-red-500 text-white';
    if (resultado.estado === 'BUSCANDO') return 'bg-blue-500 text-white';
    return 'bg-slate-800 text-slate-200';
  };

  const formatearHoraActual = () => new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  const isIngreso = accionVehiculo === 'INGRESO';
  const estiloTarjeta = isIngreso 
    ? { bgIcon: 'bg-green-100', textIcon: 'text-green-600', borderIcon: 'border-green-200', titulo: 'Acceso Concedido' }
    : { bgIcon: 'bg-blue-100', textIcon: 'text-blue-600', borderIcon: 'border-blue-200', titulo: 'Vehículo Retirado' };

  return (
    <div className="flex flex-col items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
      
      <div className="mb-4 w-full">
        {!escaneando ? (
          <button onClick={iniciarCamara} className="w-full flex justify-center items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl text-sm transition-transform hover:scale-[1.02]">
            Encender Escáner
          </button>
        ) : (
          <button onClick={detenerCamara} className="w-full flex justify-center items-center gap-2 bg-red-50 text-red-600 font-bold py-2.5 rounded-xl text-sm border border-red-200">
            Apagar Escáner
          </button>
        )}
      </div>

      {mostrarTarjetaExito && datosVehiculoExitoso ? (
        
        <div className="w-[500px] h-[375px] bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center justify-between shadow-lg shadow-slate-100 animate-fade-in-up">
          <div className="flex flex-col items-center gap-3">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-md border ${estiloTarjeta.bgIcon} ${estiloTarjeta.textIcon} ${estiloTarjeta.borderIcon}`}>
              {isIngreso ? (
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">{estiloTarjeta.titulo}</h3>
          </div>

          <div className="w-full bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-2">
              <span className={`text-3xl font-bold tracking-widest uppercase ${isIngreso ? 'text-green-600' : 'text-blue-600'}`}>
                {datosVehiculoExitoso.Placa}
              </span>
              <span className="text-xs text-slate-400 font-medium">{formatearHoraActual()}</span>
            </div>
            <p className="text-sm font-medium text-slate-600">👤 Propietario: <span className='text-slate-800 font-semibold'>{datosVehiculoExitoso.Nombres}</span></p>
            <p className="text-sm font-medium text-slate-600">🚗 Vehículo: <span className='text-slate-800 font-semibold'>{datosVehiculoExitoso.Tipo_vehiculo}</span></p>
          </div>

          <button onClick={reintentarEscaner} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-md">
            Continuar Escaneo →
          </button>
        </div>

      ) : (
        <div className="relative bg-slate-900 p-1 rounded-xl w-[500px] h-[375px] flex justify-center items-center overflow-hidden border border-slate-300 shadow-inner group">
          <div className={`absolute top-3 left-1/2 -translate-x-1/2 z-30 px-5 py-1.5 rounded-full font-bold text-xs tracking-wide shadow-md transition-colors duration-300 ${getColorClase()}`}>
            {resultado.texto}
          </div>
          {boxUI && (
            <div className="absolute z-20 transition-all duration-150 ease-linear pointer-events-none" style={{ left: `${boxUI.x}px`, top: `${boxUI.y}px`, width: `${boxUI.w}px`, height: `${boxUI.h}px`, border: `3px solid ${boxUI.color}` }}>
              <div className="absolute -top-7 left-[-3px] px-2 py-0.5 text-white font-bold text-sm shadow-md" style={{ backgroundColor: boxUI.color }}>{boxUI.etiqueta}</div>
            </div>
          )}
          <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover rounded-lg bg-black ${!escaneando && 'opacity-30'}`} />
          <canvas ref={canvasRef} width="640" height="480" className="hidden" />
        </div>
      )}
    </div>
  );
}

export default Escaner;