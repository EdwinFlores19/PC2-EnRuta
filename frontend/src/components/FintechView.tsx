import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Wallet {
  id: string;
  balance: string;
  currency: string;
  type: string;
  transactions: Array<{
    id: string;
    amount: string;
    netAmount: string;
    feeAmount: string;
    feePercentage: string;
    paymentMethod: string;
    status: string;
    createdAt: string;
  }>;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export default function FintechView(): React.JSX.Element {
  // Cuentas de prueba
  const [testUsers, setTestUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [error, setError] = useState('');

  // Formulario de cobro
  const [amount, setAmount] = useState('15.00');
  const [paymentMethod, setPaymentMethod] = useState<'NFC' | 'YAPE' | 'PLIN'>('NFC');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Estado para Yape/Plin QR
  const [qrTx, setQrTx] = useState<{ id: string; providerTransactionId: string; qrCodeUrl: string } | null>(null);

  // Cargar usuarios de prueba al montar
  useEffect(() => {
    fetchTestUsers();
    // Si ya hay token, intentar cargar billetera del usuario guardado
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchWalletDetails();
    } else {
      setWallet(null);
    }
  }, [currentUser]);

  const fetchTestUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data } = await apiClient.get('/auth/debug/users');
      if (data?.status === 'success' && data?.data) {
        setTestUsers(data.data);
      }
    } catch (err: any) {
      console.error('Error al obtener usuarios de prueba:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleLoginAs = async (user: User) => {
    setError('');
    setSuccessMessage('');
    setQrTx(null);
    try {
      const { data } = await apiClient.post('/auth/login', {
        email: user.email,
        password: 'Password123!', // Contraseña común en seed
      });

      if (data?.status === 'success' && data?.data) {
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        setCurrentUser(data.data.user);
        setSuccessMessage(`Sesión iniciada correctamente como: ${user.name}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setWallet(null);
    setQrTx(null);
    setSuccessMessage('Sesión cerrada.');
  };

  const fetchWalletDetails = async () => {
    setLoadingWallet(true);
    setError('');
    try {
      const { data } = await apiClient.get('/payments/wallet/my');
      if (data?.status === 'success') {
        setWallet(data.data);
      }
    } catch (err: any) {
      console.warn('Error al obtener billetera:', err);
      if (err.response?.status === 404) {
        setError('No tienes una billetera digital activa.');
      } else {
        setError(err.response?.data?.message || 'Error de conexión con billetera.');
      }
    } finally {
      setLoadingWallet(false);
    }
  };

  const handleActivateWallet = async () => {
    setError('');
    setSuccessMessage('');
    try {
      const { data } = await apiClient.post('/payments/wallet', {});
      if (data?.status === 'success') {
        setSuccessMessage('¡Billetera digital activada exitosamente!');
        fetchWalletDetails();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al activar billetera.');
    }
  };

  // Simular pago Tap-to-Pay (NFC)
  const handleSimulateTapToPay = async () => {
    if (!wallet) return;
    setError('');
    setSuccessMessage('');
    setProcessingPayment(true);

    try {
      // Simular delay del contactless
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const mockNfcToken = `tok_nfc_visa_${Math.floor(1000 + Math.random() * 9000)}`;

      const { data } = await apiClient.post('/payments/tap-to-pay', {
        walletId: wallet.id,
        amount: Number(amount),
        token: mockNfcToken,
      });

      if (data?.status === 'success') {
        setSuccessMessage(`¡Pago NFC exitoso! S/. ${Number(amount).toFixed(2)} procesados con Split Payment.`);
        fetchWalletDetails(); // Actualizar balance
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al procesar pago Tap-to-Pay.');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Emitir QR dinámico Yape/Plin
  const handleGenerateQR = async () => {
    if (!wallet) return;
    setError('');
    setSuccessMessage('');
    setQrTx(null);
    setProcessingPayment(true);

    try {
      const { data } = await apiClient.post('/payments/yape-plin/qr', {
        walletId: wallet.id,
        amount: Number(amount),
        paymentMethod,
      });

      if (data?.status === 'success' && data?.data) {
        setQrTx({
          id: data.data.id,
          providerTransactionId: data.data.providerTransactionId,
          qrCodeUrl: data.data.qrCodeUrl,
        });
        setSuccessMessage(`Código QR dinámico de ${paymentMethod} emitido. Listo para escaneo.`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al generar código QR.');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Simular Webhook de confirmación bancaria
  const handleSimulateWebhook = async (status: 'COMPLETED' | 'FAILED') => {
    if (!qrTx) return;
    setError('');
    setSuccessMessage('');
    setProcessingPayment(true);

    try {
      const { data } = await apiClient.post('/payments/webhooks/yape-plin', {
        providerTransactionId: qrTx.providerTransactionId,
        status,
        metadata: {
          simulatedMethod: paymentMethod,
          payerPhone: '992384721',
          payerName: 'Alex Ramos',
          deviceIp: '192.168.1.100',
        },
      });

      if (data?.status === 'success') {
        if (status === 'COMPLETED') {
          setSuccessMessage(`¡Pago por Webhook confirmado! S/. ${Number(amount).toFixed(2)} depositados y split ejecutado.`);
        } else {
          setError('Pago rechazado o cancelado mediante simulación de webhook.');
        }
        setQrTx(null);
        fetchWalletDetails(); // Refrescar balances
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al enviar webhook.');
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* HEADER FINTECH */}
      <div className="bg-gradient-to-r from-blue-700 via-cyan-700 to-[#0B0F19] rounded-3xl p-6 md:p-8 text-white shadow-xl border border-slate-800">
        <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider font-mono inline-block mb-3">
          📶 PASARELA DE COBROS INTEGRADA & SPLIT PAYMENTS
        </span>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Arquitectura Fintech: POS Virtual y Split Payments</h1>
        <p className="mt-2 text-slate-300 max-w-2xl text-sm md:text-base leading-relaxed">
          Ecosistema de cobros sin fricción para Asistentes Viales. Habilita cobros sin contacto mediante el hardware NFC del celular y procesa pagos inmediatos con Yape/Plin aplicando el Split de comisiones (5%) de forma atómica.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* PARTE IZQUIERDA: LOGIN DE PRUEBA Y SWITCHER DE ROLES */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-[#101625] rounded-3xl border border-slate-800 shadow-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              🔑 Cuentas de Prueba & Roles
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Selecciona una cuenta para iniciar sesión inmediatamente como Admin (Plataforma), Pedestrian (Cliente), o Worker (POS Virtual).
            </p>

            {loadingUsers ? (
              <div className="text-sm text-slate-500 flex items-center gap-2 py-4">
                <div className="h-4 w-4 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
                <span>Cargando cuentas...</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {testUsers.map((u) => {
                  const isLogged = currentUser?.email === u.email;
                  return (
                    <button
                      key={u.id}
                      onClick={() => handleLoginAs(u)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                        isLogged
                          ? 'bg-blue-500/10 border-blue-500/50 ring-2 ring-blue-500/20 font-bold text-white'
                          : 'bg-slate-900 hover:bg-slate-800/80 border-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="text-sm font-extrabold truncate">{u.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{u.email}</div>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-md uppercase font-black shrink-0 ${
                        u.role === 'ADMIN' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        u.role === 'WORKER' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {u.role}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {currentUser && (
              <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold font-mono">SESIÓN ACTIVA</span>
                <button
                  onClick={handleLogout}
                  className="text-xs text-red-400 hover:text-red-300 font-bold hover:underline"
                >
                  Cerrar Sesión &times;
                </button>
              </div>
            )}
          </div>

          {/* INFORMACIÓN DEL MOTOR DE SPLIT */}
          <div className="bg-[#101625] rounded-3xl border border-slate-800 p-6 space-y-4">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-1.5">
              <span>⚙️</span> Motor de Split Payments (Atómico)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              La plataforma deduce una comisión fija del **5.00%** por cada transacción para garantizar el soporte de servidores e infraestructura vial.
            </p>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs space-y-2 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Monto Peatón:</span>
                <span className="font-bold text-white">S/. 100.00</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2 text-red-400">
                <span>Comisión (5.00%):</span>
                <span>- S/. 5.00</span>
              </div>
              <div className="flex justify-between text-emerald-400 pt-1">
                <span className="font-bold">Neto Asistente:</span>
                <span className="font-black">S/. 95.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* PARTE CENTRAL/DERECHA: BILLETERA BALANCE Y POS VIRTUAL */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* SECCIÓN MENSAJES ERROR / ÉXITO */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">⚠️ {error}</span>
              {error === 'No tienes una billetera digital activa.' && (
                <button
                  onClick={handleActivateWallet}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-300 font-extrabold px-3 py-1.5 rounded-lg text-xs transition-colors"
                >
                  Habilitar Billetera Digital
                </button>
              )}
            </div>
          )}
          {successMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl text-sm font-semibold">
              🎉 {successMessage}
            </div>
          )}

          {/* CUADRO DE BILLETERA / SALDO */}
          {currentUser ? (
            loadingWallet ? (
              <div className="bg-[#101625] rounded-3xl border border-slate-800 p-10 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-3">
                <div className="h-6 w-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
                <span>Obteniendo saldos y transacciones seguras...</span>
              </div>
            ) : wallet ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* SALDO ACTUAL */}
                <div className="bg-[#101625] rounded-3xl border border-slate-800 shadow-2xl p-6 md:col-span-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Balance Disponible</h3>
                    <div className="text-4xl font-black text-blue-400 tracking-tight mt-3 font-mono">
                      S/. {Number(wallet.balance).toFixed(2)}
                    </div>
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-800/80 text-xs text-slate-400 space-y-1 font-mono">
                    <div>Tipo: <span className="font-bold text-white uppercase">{wallet.type}</span></div>
                    <div>Moneda: <span className="font-bold text-white">{wallet.currency}</span></div>
                  </div>
                </div>

                {/* HISTORIAL TRANSACCIONAL */}
                <div className="bg-[#101625] rounded-3xl border border-slate-800 shadow-2xl p-6 md:col-span-2 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center justify-between">
                    <span className="flex items-center gap-1.5">📝 Últimas Transacciones</span>
                    <span className="text-xs text-slate-400 font-bold font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{wallet.transactions.length} registros</span>
                  </h3>
                  
                  <div className="overflow-y-auto max-h-[170px] text-xs space-y-2 pr-1 scrollbar-thin">
                    {wallet.transactions.length === 0 ? (
                      <div className="text-slate-500 py-6 text-center font-semibold">No se registran cobros todavía.</div>
                    ) : (
                      wallet.transactions.map((t) => {
                        const isNfc = t.paymentMethod === 'NFC_TAP_TO_PAY';
                        return (
                          <div key={t.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-900 hover:bg-slate-800/60 border border-slate-800/80 transition-colors">
                            <div className="space-y-0.5">
                              <div className="font-bold text-white flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${isNfc ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                                {t.paymentMethod === 'NFC_TAP_TO_PAY' ? 'Contactless NFC' : t.paymentMethod}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — Split: {Number(t.feePercentage).toFixed(0)}%
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-extrabold text-emerald-400 font-mono text-sm">+S/. {Number(wallet.type === 'PLATFORM' ? t.feeAmount : t.netAmount).toFixed(2)}</div>
                              <div className="text-[9px] text-slate-500 font-mono">Bruto: S/. {Number(t.amount).toFixed(2)}</div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            ) : null
          ) : (
            <div className="bg-[#101625] border border-slate-800 text-slate-300 p-8 rounded-3xl text-center space-y-4">
              <span className="text-4xl block">💳</span>
              <h3 className="font-extrabold text-white text-xl">Habilita tu POS Virtual en 1-Click</h3>
              <p className="text-sm max-w-md mx-auto text-slate-400 leading-relaxed">
                Por favor, selecciona una cuenta de prueba en el panel izquierdo para iniciar sesión y ver tu billetera digital de asistencia vial.
              </p>
            </div>
          )}

          {/* POS VIRTUAL TERMINAL */}
          {wallet && wallet.type === 'MERCHANT' && (
            <div className="bg-[#101625] rounded-3xl border border-slate-800 shadow-2xl p-6 md:p-8 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  📱 POS Virtual: Terminal de Cobro
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Recibe cobros sin contacto simulando el hardware de tu teléfono en la calle.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* ENTRADA DE MONTO */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Monto a Cobrar (PEN)</label>
                    <div className="relative rounded-2xl shadow-inner">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-slate-400 font-black text-xl">S/.</span>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        min="0.5"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-2xl font-black text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                        placeholder="0.00"
                        disabled={processingPayment || qrTx !== null}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Método de Pago</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => { setPaymentMethod('NFC'); setQrTx(null); }}
                        className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          paymentMethod === 'NFC'
                            ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400 shadow-sm'
                            : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                        }`}
                        disabled={processingPayment || qrTx !== null}
                      >
                        📶 NFC Tap
                      </button>
                      <button
                        onClick={() => { setPaymentMethod('YAPE'); setQrTx(null); }}
                        className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          paymentMethod === 'YAPE'
                            ? 'bg-purple-500/10 border-purple-500/50 text-purple-400 shadow-sm'
                            : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                        }`}
                        disabled={processingPayment || qrTx !== null}
                      >
                        🍇 Yape QR
                      </button>
                      <button
                        onClick={() => { setPaymentMethod('PLIN'); setQrTx(null); }}
                        className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          paymentMethod === 'PLIN'
                            ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-sm'
                            : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                        }`}
                        disabled={processingPayment || qrTx !== null}
                      >
                        💧 Plin QR
                      </button>
                    </div>
                  </div>

                  {paymentMethod === 'NFC' ? (
                    <button
                      onClick={handleSimulateTapToPay}
                      disabled={processingPayment}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-indigo-500/10 transition-colors flex items-center justify-center gap-2"
                    >
                      {processingPayment ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Procesando Contactless...
                        </>
                      ) : (
                        'Iniciar Cobro Contactless NFC 📶'
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleGenerateQR}
                      disabled={processingPayment || qrTx !== null}
                      className={`w-full text-white py-4 rounded-xl font-bold shadow-lg transition-colors ${
                        paymentMethod === 'YAPE' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-cyan-600 hover:bg-cyan-500'
                      }`}
                    >
                      Generar QR Dinámico {paymentMethod}
                    </button>
                  )}
                </div>

                {/* SIMULADOR VISUAL DE HARDWARE */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 flex flex-col justify-center items-center text-center relative min-h-[260px] shadow-inner">
                  
                  {processingPayment && paymentMethod === 'NFC' && (
                    <div className="space-y-4 animate-pulse">
                      <div className="text-5xl">📶</div>
                      <div className="text-sm font-bold text-indigo-400">Acerque la tarjeta de débito o crédito...</div>
                      <p className="text-xs text-slate-500 max-w-xs leading-relaxed">Simulando lectura segura de chip EMV L2 Contactless en la calle.</p>
                    </div>
                  )}

                  {!processingPayment && paymentMethod === 'NFC' && (
                    <div className="space-y-4">
                      <div className="text-5xl">💳</div>
                      <div className="text-sm font-bold text-slate-300">Lector NFC Listo para recibir pagos</div>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                        En dispositivos reales de los asistentes viales, esta pantalla permite que el peatón pague acercando su tarjeta o celular al lector NFC trasero.
                      </p>
                    </div>
                  )}

                  {qrTx && (
                    <div className="space-y-4 w-full animate-fadeIn">
                      <div className="bg-white p-3.5 rounded-2xl inline-block border border-slate-800 shadow-xl">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(qrTx.qrCodeUrl)}`}
                          alt="QR Dinámico"
                          className="w-32 h-32 mx-auto"
                        />
                      </div>
                      <div className="text-xs font-black text-white font-mono uppercase tracking-wider">QR Dinámico S/. {Number(amount).toFixed(2)}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Ref: {qrTx.providerTransactionId}</div>
                      
                      {/* ACCIONES DE SIMULACIÓN DE WEBHOOK BANCARIO */}
                      <div className="grid grid-cols-2 gap-2.5 pt-2 max-w-xs mx-auto">
                        <button
                          onClick={() => handleSimulateWebhook('COMPLETED')}
                          className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 font-black text-xs py-2 rounded-xl transition-all"
                        >
                          🟢 Pago Exitoso
                        </button>
                        <button
                          onClick={() => handleSimulateWebhook('FAILED')}
                          className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 font-black text-xs py-2 rounded-xl transition-all"
                        >
                          🔴 Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  {!qrTx && (paymentMethod === 'YAPE' || paymentMethod === 'PLIN') && (
                    <div className="space-y-3">
                      <div className="text-5xl">{paymentMethod === 'YAPE' ? '🍇' : '💧'}</div>
                      <div className="text-sm font-bold text-slate-300">Billetera Digital {paymentMethod}</div>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                        Haz click en "Generar QR" para simular la emisión de un código QR dinámico integrado con split comisiones y webhooks.
                      </p>
                    </div>
                  )}

                </div>

              </div>
            </div>
          )}

          {/* BALANCE CENTRAL DE LA PLATAFORMA (ADMINS) */}
          {wallet && wallet.type === 'PLATFORM' && (
            <div className="bg-[#101625] rounded-3xl border border-slate-800 shadow-2xl p-6 md:p-8 space-y-4">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  🏦 Billetera Recaudadora (Plataforma Central)
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Como administrador del sistema de asignación vial, aquí observas las comisiones del 5% recaudadas por mantenimiento de la infraestructura.</p>
              </div>
              
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 text-xs text-slate-300 leading-relaxed">
                Cada vez que un peatón completa un cruce seguro y paga mediante NFC, Yape, o Plin, esta cuenta recibe de manera instantánea el 5.00% del monto total en una transacción atómica PostgreSQL. No es posible desviar o eludir esta retención.
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
