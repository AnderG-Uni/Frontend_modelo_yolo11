import React, { useRef, useState, useEffect } from 'react';

function Escaner() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [modo, setModo] = useState('placa'); 
  const [escaneando, setEscaneando] = useState(false);
  const [toast, setToast] = useState({ visible: false, mensaje: '', tipo: 'exito' });

  const procesandoRef = useRef(false);
  const [resultado, setResultado] = useState({ estado: 'ESPERANDO', texto: 'Cámara apagada' });
  const [boxUI, setBoxUI] = useState(null);
  const [datosVehiculoExitoso, setDatosVehiculoExitoso] = useState(null);
  const [accionVehiculo, setAccionVehiculo] = useState(null); 

  const [busquedaPlaca, setBusquedaPlaca] = useState('');
  const [alertaManual, setAlertaManual] = useState(null); 
  const trackerPlacaNoRegistrada = useRef({ placa: null, count: 0, firstSeen: null });
  const [esperandoConfirmacion, setEsperandoConfirmacion] = useState(false);

  // Estados MODO VISITANTES
  const [subModoVisitante, setSubModoVisitante] = useState('ingreso'); 
  const [formVisitante, setFormVisitante] = useState({ nombres: '', identificacion: '', placa: '', color: '', observaciones: '' });
  const [fotoVisitante, setFotoVisitante] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);

  const mostrarToast = (mensaje, tipo = 'exito') => {
    setToast({ visible: true, mensaje, tipo });
    setTimeout(() => setToast({ visible: false, mensaje: '', tipo: 'exito' }), 4000);
  };

  // ==========================================
  // LÓGICA DE BÚSQUEDA Y REGISTRO MANUAL
  // ==========================================
  const buscarPlacaManual = async () => {
    if (!busquedaPlaca.trim()) return;
    try {
      const res = await fetch(`http://localhost:3000/api/v1/vehiculos/${busquedaPlaca.trim()}`);
      const data = await res.json();

      if (data.estado === 'OK') {
        setDatosVehiculoExitoso(data.datos);
        setEsperandoConfirmacion(true); 
        setAccionVehiculo(null);
        setAlertaManual(null);
        detenerCamara(); 
      } else {
        mostrarToast('Vehículo no encontrado, debe registrarlo.', 'error');
      }
    } catch (error) {
      mostrarToast('Error de conexión al buscar.', 'error');
    }
  };

  const confirmarRegistroManual = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/v1/reconocimiento/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placa: datosVehiculoExitoso.Placa })
      });
      const data = await res.json();

      if (data.estado === 'OK') {
        if (data.accion === 'SALIDA') {
          mostrarToast('Salida registrada exitosamente', 'salida'); 
        } else {
          mostrarToast('Ingreso registrado exitosamente', 'exito'); 
        }
        
        setDatosVehiculoExitoso(null);
        setEsperandoConfirmacion(false);
        setBusquedaPlaca('');
        setAccionVehiculo(null);
      } else {
        mostrarToast(data.mensaje || 'Error al autorizar', 'error');
      }
    } catch (error) {
      mostrarToast('Error de conexión.', 'error');
    }
  };

  const limpiarInterfaz = () => {
    setDatosVehiculoExitoso(null);
    setEsperandoConfirmacion(false);
    setBusquedaPlaca('');
    setAccionVehiculo(null);
    setAlertaManual(null);
  };

  // ==========================================
  // FUNCIONES VISITANTES
  // ==========================================
  const handleVisitanteChange = (e) => setFormVisitante({ ...formVisitante, [e.target.name]: e.target.value });

  const capturarFotoVisitante = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    setFotoPreview(canvasRef.current.toDataURL('image/jpeg', 0.8));
    canvasRef.current.toBlob((blob) => setFotoVisitante(blob), 'image/jpeg', 0.8);
  };

  const descartarFoto = () => { setFotoPreview(null); setFotoVisitante(null); };

  const handleSubmitVisitante = async (e) => {
    e.preventDefault();

    if (subModoVisitante === 'ingreso') {
      if (!fotoVisitante) return mostrarToast('Por favor, capture una foto del vehículo.', 'error');

      const formData = new FormData();
      formData.append('nombres', formVisitante.nombres);
      formData.append('identificacion', formVisitante.identificacion);
      formData.append('placa', formVisitante.placa);
      formData.append('color', formVisitante.color);
      formData.append('observaciones', formVisitante.observaciones);
      formData.append('imagen', fotoVisitante, 'visitante.jpg');

      try {
        const response = await fetch('http://localhost:3000/api/v1/reconocimiento/registro-ingreso', { method: 'POST', body: formData });
        const data = await response.json();
        
        if (response.ok && data.estado === 'OK') {
          mostrarToast('Ingreso de visitante registrado.', 'exito');
          setFormVisitante({ nombres: '', identificacion: '', placa: '', color: '', observaciones: '' });
          descartarFoto(); detenerCamara(); setModo('placa'); limpiarInterfaz(); 
        } else {
          mostrarToast(data.mensaje || 'Error al autorizar', 'error');
        }
      } catch (error) { mostrarToast('Error de conexión', 'error'); }
    } else {
      if (!formVisitante.placa) return mostrarToast('La placa es obligatoria para registrar la salida.', 'error');

      try {
        const response = await fetch('http://localhost:3000/api/v1/reconocimiento/registro-salida-visitante', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ placa: formVisitante.placa }) 
        });
        const data = await response.json();

        if (response.ok && data.estado === 'OK') {
          mostrarToast('Salida de visitante registrada.', 'salida'); 
          setFormVisitante({ nombres: '', identificacion: '', placa: '', color: '', observaciones: '' });
          detenerCamara(); setModo('placa'); limpiarInterfaz(); 
        } else {
          mostrarToast(data.mensaje || 'Error al registrar salida', 'error');
        }
      } catch (error) { mostrarToast('Error de conexión', 'error'); }
    }
  };

  // ==========================================
  // FUNCIONES DE LA CÁMARA
  // ==========================================
  const iniciarCamara = async () => {
    try {
      limpiarInterfaz();
      descartarFoto();
      trackerPlacaNoRegistrada.current = { placa: null, count: 0, firstSeen: null }; 
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setEscaneando(true);
      procesandoRef.current = false;
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
    fetch('http://localhost:3000/api/v1/reconocimiento/cancelar', { method: 'POST' }).catch(()=>null);
  };

  useEffect(() => { descartarFoto(); }, [modo, subModoVisitante]);

  // ==========================================
  // LÓGICA DE ESCANEO CONTINUO
  // ==========================================
  useEffect(() => {
    let intervalo;
    let escaneoActivo = true; 

    const capturarYEnviar = async () => {
      if (!videoRef.current || !canvasRef.current || procesandoRef.current || !escaneoActivo || modo !== 'placa') return;

      procesandoRef.current = true; 
      const ctx = canvasRef.current.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

      canvasRef.current.toBlob(async (blob) => {
        const formData = new FormData(); formData.append('imagen', blob, 'frame.jpg');
        try {
          const response = await fetch('http://localhost:3000/api/v1/reconocimiento/escanear', { method: 'POST', body: formData });
          const data = await response.json();
          if (!escaneoActivo) return; 

          if (data.box) {
            setBoxUI({ ...data.box, color: data.estado === 'OK' ? '#22c55e' : '#ef4444', etiqueta: `${data.placa} ${data.confianza}%` });
          } else { setBoxUI(null); }

          if (data.estado === 'OK') {
            setResultado({ estado: 'OK', texto: `${data.mensaje} • ${data.placa}` });
            detenerCamara(); 
            setDatosVehiculoExitoso(data.datosVehiculo);
            setAccionVehiculo(data.accion); 
            setEsperandoConfirmacion(false); 
            trackerPlacaNoRegistrada.current = { placa: null, count: 0, firstSeen: null };
          } else if (data.estado === 'FAIL' && data.placa) {
            setResultado({ estado: 'FAIL', texto: data.mensaje });
            const ahora = Date.now();
            if (trackerPlacaNoRegistrada.current.placa === data.placa) {
              trackerPlacaNoRegistrada.current.count += 1;
              if (trackerPlacaNoRegistrada.current.count >= 2 && (ahora - trackerPlacaNoRegistrada.current.firstSeen) >= 5000) {
                detenerCamara();
                setAlertaManual(data.placa); 
                setBusquedaPlaca(data.placa); 
                trackerPlacaNoRegistrada.current = { placa: null, count: 0, firstSeen: null };
              }
            } else {
              trackerPlacaNoRegistrada.current = { placa: data.placa, count: 1, firstSeen: ahora };
            }
          } else {
            setResultado({ estado: 'BUSCANDO', texto: 'Buscando placa...' });
          }
        } catch (error) { if (escaneoActivo) console.error("Error API"); } finally { if (escaneoActivo) procesandoRef.current = false; }
      }, 'image/jpeg', 0.8);
    };

    if (escaneando && modo === 'placa') intervalo = setInterval(capturarYEnviar, 200); 
    return () => { escaneoActivo = false; clearInterval(intervalo); };
  }, [escaneando, modo]);

  const getColorClase = () => {
    if (resultado.estado === 'OK') return 'bg-green-500 text-white';
    if (resultado.estado === 'FAIL') return 'bg-red-500 text-white';
    if (resultado.estado === 'BUSCANDO') return 'bg-blue-500 text-white';
    return 'bg-slate-800 text-slate-200';
  };
  const formatearFecha = () => new Date().toLocaleDateString('es-CO');

  return (
    <div className="flex flex-col items-center w-full h-full relative">
      
      {/* NOTIFICACIÓN FLOTANTE */}
      {toast.visible && (
        <div className={`fixed bottom-8 right-8 z-50 px-6 py-4 rounded-xl shadow-2xl text-white font-bold tracking-wide animate-fade-in-up flex items-center gap-3 ${
          toast.tipo === 'exito' ? 'bg-green-600' : 
          toast.tipo === 'salida' ? 'bg-blue-600' : 
          'bg-red-600'
        }`}>
          {toast.tipo === 'exito' ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          ) : toast.tipo === 'salida' ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          )}
          {toast.mensaje}
        </div>
      )}

      {/* CINTA SUPERIOR PRINCIPAL */}
      <div className="bg-slate-200/70 p-1.5 rounded-xl flex gap-1 mt-8 mb-6 shadow-inner">
        <button onClick={() => setModo('placa')} className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all duration-300 ${modo === 'placa' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}>
          Escaneo Placa
        </button>
        <button onClick={() => setModo('visitante')} className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all duration-300 ${modo === 'visitante' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}>
          Visitantes
        </button>
      </div>

      <div className="flex flex-row w-full gap-5 h-[420px]">
        
        {/* COLUMNA IZQUIERDA: CÁMARA */}
        <div className="w-1/2 bg-white p-3 rounded-2xl shadow-sm border border-slate-200 flex flex-col relative">
          <div className="relative bg-slate-900 rounded-xl flex-1 flex justify-center items-center overflow-hidden border border-slate-300 shadow-inner group">
            
            {fotoPreview && <img src={fotoPreview} alt="Captura Visitante" className="absolute inset-0 w-full h-full object-cover z-20" />}

            {alertaManual && !escaneando && modo === 'placa' && (
              <div className="absolute inset-0 z-40 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                <div className="bg-red-500/20 text-red-500 p-3 rounded-full mb-3 border border-red-500/30">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 className="text-red-500 font-bold text-lg mb-1">Vehículo no identificado</h3>
                <p className="text-slate-300 text-xs mb-4 font-medium">Valida manualmente si existe la placa:</p>
                <div className="bg-red-600 text-white font-black text-3xl px-6 py-2 rounded-xl tracking-widest border-2 border-red-400 shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                  {alertaManual}
                </div>
              </div>
            )}

            {!alertaManual && modo === 'placa' && (
              <div className={`absolute top-3 left-1/2 -translate-x-1/2 z-30 px-5 py-1.5 rounded-full font-bold text-xs tracking-wide shadow-md transition-colors duration-300 ${getColorClase()}`}>
                {resultado.texto}
              </div>
            )}

            {boxUI && modo === 'placa' && !alertaManual && (
              <div className="absolute z-20 transition-all duration-150 ease-linear pointer-events-none" style={{ left: `${boxUI.x}px`, top: `${boxUI.y}px`, width: `${boxUI.w}px`, height: `${boxUI.h}px`, border: `3px solid ${boxUI.color}` }}>
                <div className="absolute -top-6 left-[-3px] px-2 py-0.5 text-white font-bold text-xs shadow-md" style={{ backgroundColor: boxUI.color }}>{boxUI.etiqueta}</div>
              </div>
            )}

            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${!escaneando && 'opacity-20'}`} />
            <canvas ref={canvasRef} width="640" height="480" className="hidden" />
            
            {!escaneando && !alertaManual && !fotoPreview && (
              <div className="absolute flex flex-col items-center text-slate-400 z-10">
                <span className="text-3xl mb-1">📷</span>
                <p className="text-sm font-medium">
                  {modo === 'visitante' ? (subModoVisitante === 'ingreso' ? 'Tomar foto del vehículo' : 'Cámara opcional para salida') : 'Cámara Inactiva'}
                </p>
              </div>
            )}

            {modo === 'visitante' && subModoVisitante === 'ingreso' && escaneando && (
              <button type="button" onClick={fotoPreview ? descartarFoto : capturarFotoVisitante} className={`absolute bottom-3 z-30 backdrop-blur-md text-white font-bold py-2 px-5 rounded-full text-sm shadow-lg transition-all ${fotoPreview ? 'bg-red-500/90 border border-red-400 hover:bg-red-600' : 'bg-white/20 hover:bg-white/40 border border-white/50'}`}>
                {fotoPreview ? '🔄 Retomar Foto' : '📸 Capturar Foto'}
              </button>
            )}
          </div>

          <div className="mt-2 flex gap-2">
            {!escaneando ? (
              <button onClick={iniciarCamara} className={`w-full text-white font-bold py-2 rounded-xl text-sm transition-all shadow-md bg-slate-800 hover:bg-slate-900`}>
                Encender Cámara
              </button>
            ) : (
              <button onClick={detenerCamara} className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 rounded-xl text-sm border border-red-200 transition-all">
                Apagar Cámara
              </button>
            )}
            {!escaneando && datosVehiculoExitoso && modo === 'placa' && !alertaManual && (
              <button onClick={limpiarInterfaz} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-sm transition-all shadow-md">
                Buscar Nuevo
              </button>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="w-1/2 flex flex-col h-full gap-4">
          
          {modo === 'placa' ? (
             <div className="relative w-full shadow-sm flex-1 bg-white rounded-2xl border border-slate-200 p-5 flex flex-col">
              
              {/* LA BARRA DE BÚSQUEDA AHORA QUEDA LIBRE */}
              <div className="relative w-full shadow-sm mb-3">
                <input 
                  type="text" 
                  value={busquedaPlaca}
                  onChange={(e) => setBusquedaPlaca(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && buscarPlacaManual()}
                  placeholder="Buscar placa manualmente..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-bold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all uppercase placeholder:normal-case placeholder:font-normal text-blue-900" 
                />
                <button onClick={buscarPlacaManual} className="absolute right-2 top-1.5 bg-white text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 shadow-sm border border-slate-200 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </button>
              </div>

              {/* CONTENEDOR INDEPENDIENTE PARA LA TARJETA Y EL OVERLAY */}
              <div className="relative flex-1 flex flex-col">
                <div className={`flex flex-col h-full transition-opacity duration-500 ${alertaManual && !esperandoConfirmacion ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-3 py-1 rounded-md uppercase tracking-wider">
                      {datosVehiculoExitoso ? datosVehiculoExitoso.Tipo_vehiculo : 'Tipo de Vehículo'}
                    </span>
                    
                    <div className="flex gap-2">
                      {esperandoConfirmacion ? (
                        <button onClick={confirmarRegistroManual} className="flex items-center gap-1.5 px-4 py-1 text-xs font-black rounded-md text-white bg-green-500 hover:bg-green-600 shadow-md border border-green-600 transition-all animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          AUTORIZAR INGRESO / SALIDA
                        </button>
                      ) : (
                        <>
                          <div className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md border transition-all ${accionVehiculo === 'INGRESO' ? 'text-green-700 bg-green-100 border-green-300 shadow-sm' : 'text-slate-400 border-slate-200 bg-slate-50'}`}>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            Ingreso
                          </div>
                          <div className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md border transition-all ${accionVehiculo === 'SALIDA' ? 'text-blue-700 bg-blue-100 border-blue-300 shadow-sm' : 'text-slate-400 border-slate-200 bg-slate-50'}`}>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                            Salida
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter mt-3">
                    {datosVehiculoExitoso ? datosVehiculoExitoso.Placa : '------'}
                  </h2>
                  <p className="text-slate-400 text-xs font-medium mb-4 mt-0.5">
                    {datosVehiculoExitoso ? `ID Universitario: ${datosVehiculoExitoso.id_universitario}` : 'Esperando detección...'}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-y-3 gap-x-3 text-sm mt-auto mb-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1 mb-0.5">Color</span>
                      <span className="font-semibold text-slate-700 text-sm">{datosVehiculoExitoso ? datosVehiculoExitoso.color : '--'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1 mb-0.5">Fecha Acceso</span>
                      <span className="font-semibold text-slate-700 text-sm">{datosVehiculoExitoso ? formatearFecha() : '--'}</span>
                    </div>
                    <div className="col-span-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1 mb-0.5">Propietario</span>
                      <span className="font-black text-slate-800 text-base">{datosVehiculoExitoso ? datosVehiculoExitoso.Nombres : '----------------'}</span>
                    </div>
                  </div>
                </div>

                {/* EL AVISO SÓLO CUBRE LA INFO, NO LA BARRA DE BÚSQUEDA */}
                {alertaManual && !esperandoConfirmacion && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[2px] rounded-xl z-10">
                    <div className="bg-slate-800 text-white px-5 py-2 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 animate-pulse">
                      <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                      Realiza la búsqueda manual
                    </div>
                  </div>
                )}
              </div>
             </div>
          ) : (
            /* --- MODO 2: VISITANTES --- */
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col">
              <div className="flex justify-center mb-3">
                <div className="bg-slate-100 p-1 rounded-lg inline-flex text-[11px] font-bold border border-slate-200">
                  <button onClick={() => setSubModoVisitante('ingreso')} className={`px-5 py-1 rounded-md transition-all ${subModoVisitante === 'ingreso' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                    Registrar Ingreso
                  </button>
                  <button onClick={() => setSubModoVisitante('salida')} className={`px-5 py-1 rounded-md transition-all ${subModoVisitante === 'salida' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                    Registrar Salida
                  </button>
                </div>
              </div>

              <div className="mb-2">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none mb-1">
                  {subModoVisitante === 'ingreso' ? 'Registro de Entrada' : 'Registro de Salida'}
                </h3>
                <p className="text-[10px] text-slate-500">
                  {subModoVisitante === 'ingreso' ? 'Complete los datos y tome la foto.' : 'Ingrese la placa del visitante que sale.'}
                </p>
              </div>

              <form onSubmit={handleSubmitVisitante} className="flex flex-col gap-2.5 flex-1">
                <div className="grid grid-cols-2 gap-2">
                  {subModoVisitante === 'ingreso' && (
                    <>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5 uppercase tracking-wider">Nombres y Apellidos</label>
                        <input type="text" name="nombres" value={formVisitante.nombres} onChange={handleVisitanteChange} required placeholder="Ej: Carlos Rodriguez" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5 uppercase tracking-wider">Identificación / Cédula</label>
                        <input type="text" name="identificacion" value={formVisitante.identificacion} onChange={handleVisitanteChange} required placeholder="Ej: 1143890234" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50" />
                      </div>
                    </>
                  )}

                  <div className={subModoVisitante === 'salida' ? 'col-span-2 mt-2' : ''}>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5 uppercase tracking-wider">Placa</label>
                    <input type="text" name="placa" value={formVisitante.placa} onChange={handleVisitanteChange} required placeholder="XYZ123" maxLength="6" className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 uppercase font-bold text-blue-900 ${subModoVisitante === 'salida' ? 'py-2 text-lg tracking-widest' : 'py-1.5 text-xs'}`} />
                  </div>

                  {subModoVisitante === 'ingreso' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5 uppercase tracking-wider">Color</label>
                      <input type="text" name="color" value={formVisitante.color} onChange={handleVisitanteChange} required placeholder="Ej: Gris" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50" />
                    </div>
                  )}
                </div>
                
                {subModoVisitante === 'ingreso' && (
                  <div className="flex flex-col flex-1">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5 uppercase tracking-wider">Observaciones</label>
                    <textarea name="observaciones" value={formVisitante.observaciones} onChange={handleVisitanteChange} required placeholder="Motivo de la visita..." className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 flex-1 resize-none"></textarea>
                  </div>
                )}

                <button type="submit" className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-sm transition-all shadow-md ${subModoVisitante === 'salida' ? 'mt-auto' : 'mt-1'}`}>
                  {subModoVisitante === 'ingreso' ? 'Autorizar Ingreso' : 'Confirmar Salida'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Escaner;