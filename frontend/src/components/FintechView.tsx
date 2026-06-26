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
      // 1. Simular delay del contactless
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
    <div className="space-y-8">
      {/* HEADER FINTECH */}
      <div className="bg-gradient-to-r from-blue-700 to-cyan-600 rounded-3xl p-6 md:p-8 text-white shadow-md">
        <h1 className="text-3xl font-extrabold tracking-tight">Arquitectura Fintech: POS Virtual y Split Payments</h1>
        <p className="mt-2 text-blue-100 max-w-2xl text-sm md:text-base">
          Ecosistema de cobros sin fricción para Asistentes Viales. Habilita cobros sin contacto mediante el hardware NFC del celular y procesa pagos inmediatos con Yape/Plin aplicando el Split de comisiones (5%) de forma atómica.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* PARTE IZQUIERDA: LOGIN DE PRUEBA Y SWITCHER DE ROLES */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              🔑 Cuentas de Prueba & Roles
            </h2>
            <p className="text-xs text-gray-500">
              Usa un botón para iniciar sesión inmediatamente como Admin (Plataforma), Pedestrian (Cliente), o Worker (POS Virtual).
            </p>

            {loadingUsers ? (
              <div className="text-sm text-gray-500">Cargando cuentas...</div>
            ) : (
              <div className="space-y-2">
                {testUsers.map((u) => {
                  const isLogged = currentUser?.email === u.email;
                  return (
                    <button
                      key={u.id}
                      onClick={() => handleLoginAs(u)}
                      className={`w-full text-left p-3 rounded-xl border text-sm transition-all flex items-center justify-between ${
                        isLogged
                          ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-100 font-semibold text-blue-800'
                          : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
                      }`}
                    >
                      <div>
                        <div className="font-medium truncate">{u.name}</div>
                        <div className="text-xs text-gray-400 font-normal">{u.email}</div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold shrink-0 ${
                        u.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                        u.role === 'WORKER' ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {u.role}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {currentUser && (
              <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">Sesión activa</span>
                <button
                  onClick={handleLogout}
                  className="text-xs text-red-600 hover:underline font-semibold"
                >
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>

          {/* INFORMACIÓN DEL MOTOR DE SPLIT */}
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 space-y-3">
            <h3 className="font-bold text-gray-800 text-sm">⚙️ Motor de Split Payments (Mantenimiento)</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              La plataforma cobra una comisión fija de **5.00%** por cada transacción de asistencia completada para garantizar el soporte de servidores.
            </p>
            <div className="bg-white border border-gray-200 rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Monto del Peatón:</span>
                <span className="font-semibold text-gray-800">S/. 100.00</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-1.5 mb-1.5">
                <span className="text-gray-500">Comisión (5.00%):</span>
                <span className="font-semibold text-red-600">- S/. 5.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Neto para Asistente:</span>
                <span className="font-bold text-green-600">S/. 95.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* PARTE CENTRAL/DERECHA: BILLETERA BALANCE Y POS VIRTUAL */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* SECCIÓN MENSAJES ERROR / ÉXITO */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-medium">
              ⚠️ {error}
              {error === 'No tienes una billetera digital activa.' && (
                <button
                  onClick={handleActivateWallet}
                  className="ml-3 underline font-bold hover:text-red-900 transition-colors"
                >
                  Habilitar Billetera Digital Ahora
                </button>
              )}
            </div>
          )}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl text-sm font-semibold">
              🎉 {successMessage}
            </div>
          )}

          {/* CUADRO DE BILLETERA / SALDO */}
          {currentUser ? (
            loadingWallet ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-500">
                Obteniendo saldo y transacciones...
              </div>
            ) : wallet ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* SALDO ACTUAL */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:col-span-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Balance Disponible</h3>
                    <div className="text-4xl font-extrabold text-blue-600 tracking-tight mt-2">
                      S/. {Number(wallet.balance).toFixed(2)}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                    Billetera Tipo: <span className="font-semibold text-gray-700 uppercase">{wallet.type}</span>
                    <br />
                    Moneda: <span className="font-semibold text-gray-700">{wallet.currency}</span>
                  </div>
                </div>

                {/* HISTORIAL TRANSACCIONAL */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:col-span-2 space-y-4">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center justify-between">
                    <span>📝 Últimas Transacciones</span>
                    <span className="text-xs text-gray-400 font-normal">{wallet.transactions.length} registradas</span>
                  </h3>
                  
                  <div className="overflow-y-auto max-h-[160px] text-xs space-y-2 pr-1">
                    {wallet.transactions.length === 0 ? (
                      <div className="text-gray-400 py-4 text-center">No se registran cobros todavía.</div>
                    ) : (
                      wallet.transactions.map((t) => {
                        const isNfc = t.paymentMethod === 'NFC_TAP_TO_PAY';
                        return (
                          <div key={t.id} className="flex justify-between items-center p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 transition-colors">
                            <div className="space-y-0.5">
                              <div className="font-medium text-gray-800 flex items-center gap-1.5">
                                <span className={`h-2 w-2 rounded-full ${isNfc ? 'bg-indigo-500' : 'bg-green-500'}`} />
                                {t.paymentMethod === 'NFC_TAP_TO_PAY' ? 'Contactless NFC' : t.paymentMethod}
                              </div>
                              <div className="text-[10px] text-gray-400">
                                {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — Split Platform: {Number(t.feePercentage).toFixed(0)}%
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-green-600">+S/. {Number(wallet.type === 'PLATFORM' ? t.feeAmount : t.netAmount).toFixed(2)}</div>
                              <div className="text-[9px] text-gray-400">Bruto: S/. {Number(t.amount).toFixed(2)}</div>
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
            <div className="bg-blue-50 border border-blue-200 text-blue-700 p-6 rounded-2xl text-center">
              <h3 className="font-bold text-lg mb-2">Habilita tu POS Virtual en 1-Click</h3>
              <p className="text-sm max-w-md mx-auto mb-4">
                Por favor, selecciona una cuenta de prueba a la izquierda para iniciar sesión y ver tu billetera digital de asistencia vial.
              </p>
            </div>
          )}

          {/* POS VIRTUAL TERMINAL */}
          {wallet && wallet.type === 'MERCHANT' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  📱 POS Virtual: Terminal de Cobro
                </h2>
                <p className="text-xs text-gray-500 mt-1">Recibe un cobro seguro de los peatones simulando el hardware de tu teléfono.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* ENTRADA DE MONTO */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Monto a Cobrar (PEN)</label>
                    <div className="relative rounded-2xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-400 font-bold text-lg">S/.</span>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        min="0.5"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full border border-gray-300 rounded-2xl pl-12 pr-4 py-3.5 text-xl font-extrabold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="0.00"
                        disabled={processingPayment || qrTx !== null}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Método de Pago</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => { setPaymentMethod('NFC'); setQrTx(null); }}
                        className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          paymentMethod === 'NFC'
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm'
                            : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                        disabled={processingPayment || qrTx !== null}
                      >
                        📶 NFC Tap
                      </button>
                      <button
                        onClick={() => { setPaymentMethod('YAPE'); setQrTx(null); }}
                        className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          paymentMethod === 'YAPE'
                            ? 'bg-purple-50 border-purple-300 text-purple-700 shadow-sm'
                            : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                        disabled={processingPayment || qrTx !== null}
                      >
                        🍇 Yape QR
                      </button>
                      <button
                        onClick={() => { setPaymentMethod('PLIN'); setQrTx(null); }}
                        className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          paymentMethod === 'PLIN'
                            ? 'bg-cyan-50 border-cyan-300 text-cyan-700 shadow-sm'
                            : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600'
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
                      className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl font-bold shadow-md hover:bg-indigo-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                    >
                      {processingPayment ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Procesando Contactless...
                        </>
                      ) : (
                        'Iniciar Cobro Contactless NFC'
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleGenerateQR}
                      disabled={processingPayment || qrTx !== null}
                      className={`w-full text-white py-3.5 rounded-2xl font-bold shadow-md disabled:bg-gray-300 transition-colors ${
                        paymentMethod === 'YAPE' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-cyan-600 hover:bg-cyan-700'
                      }`}
                    >
                      Generar QR Dinámico {paymentMethod}
                    </button>
                  )}
                </div>

                {/* SIMULADOR VISUAL DE HARDWARE */}
                <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 flex flex-col justify-center items-center text-center relative min-h-[250px]">
                  
                  {processingPayment && paymentMethod === 'NFC' && (
                    <div className="space-y-4 animate-pulse">
                      <div className="text-5xl">📶</div>
                      <div className="text-sm font-bold text-indigo-700">Acerque la tarjeta de débito o crédito...</div>
                      <p className="text-xs text-gray-400">Simulando lectura segura de chip EMV L2 Contactless</p>
                    </div>
                  )}

                  {!processingPayment && paymentMethod === 'NFC' && (
                    <div className="space-y-4">
                      <div className="text-5xl">💳</div>
                      <div className="text-sm font-semibold text-gray-600">Lector NFC Listo para recibir pagos</div>
                      <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                        En dispositivos reales de los asistentes, esta pantalla permite que el peatón pague acercando su tarjeta de débito o crédito al sensor NFC trasero.
                      </p>
                    </div>
                  )}

                  {qrTx && (
                    <div className="space-y-4 w-full">
                      <div className="bg-white p-4 rounded-xl inline-block border border-gray-200 shadow-sm">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(qrTx.qrCodeUrl)}`}
                          alt="QR Dinámico"
                          className="w-32 h-140 mx-auto"
                        />
                      </div>
                      <div className="text-xs font-bold text-gray-700">QR Dinámico S/. {Number(amount).toFixed(2)}</div>
                      <div className="text-[10px] text-gray-400 font-mono">Ref: {qrTx.providerTransactionId}</div>
                      
                      {/* ACCIONES DE SIMULACIÓN DE WEBHOOK BANCARIO */}
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <button
                          onClick={() => handleSimulateWebhook('COMPLETED')}
                          className="bg-green-100 text-green-700 hover:bg-green-200 font-bold text-xs py-2 px-3 rounded-lg transition-colors"
                        >
                          🟢 Simular Éxito (Webhook)
                        </button>
                        <button
                          onClick={() => handleSimulateWebhook('FAILED')}
                          className="bg-red-100 text-red-700 hover:bg-red-200 font-bold text-xs py-2 px-3 rounded-lg transition-colors"
                        >
                          🔴 Cancelar Pago
                        </button>
                      </div>
                    </div>
                  )}

                  {!qrTx && (paymentMethod === 'YAPE' || paymentMethod === 'PLIN') && (
                    <div className="space-y-3">
                      <div className="text-5xl">{paymentMethod === 'YAPE' ? '🍇' : '💧'}</div>
                      <div className="text-sm font-semibold text-gray-600">Billetera Digital {paymentMethod}</div>
                      <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                        Haz click en "Generar QR" para simular la emisión de un código QR dinámico integrado con comisiones y webhooks.
                      </p>
                    </div>
                  )}

                </div>

              </div>
            </div>
          )}

          {/* BALANCE CENTRAL DE LA PLATAFORMA (ADMINS) */}
          {wallet && wallet.type === 'PLATFORM' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  🏦 Billetera Recaudadora (Plataforma Central)
                </h2>
                <p className="text-xs text-gray-500 mt-1">Como administrador del sistema de asignación vial, aquí observas las comisiones del 5% recaudadas por mantenimiento.</p>
              </div>
              
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-xs text-indigo-800 leading-relaxed">
                Cada vez que un peatón completa un cruce seguro y paga mediante NFC, Yape, o Plin, esta cuenta recibe de manera instantánea el 5.00% del monto total en una transacción atómica PostgreSQL. No es posible desviar o eludir esta retención.
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
