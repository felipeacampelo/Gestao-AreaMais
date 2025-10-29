import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Copy, Check, QrCode, CreditCard as CreditCardIcon } from 'lucide-react';
import { getEnrollment, createPayment, type Enrollment, type Payment } from '../services/api';
import ProgressSteps from '../components/ProgressSteps';
import CreditCardForm, { type CardData } from '../components/CreditCardForm';

export default function PaymentPage() {
  console.log('PaymentPage component loaded');
  const navigate = useNavigate();
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const [searchParams] = useSearchParams();
  const hasLoadedRef = useRef(false);
  
  const paymentIdFromUrl = searchParams.get('paymentId');
  
  console.log('enrollmentId:', enrollmentId);
  console.log('paymentId from URL:', paymentIdFromUrl);
  
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState<'PIX_CASH' | 'PIX_INSTALLMENT' | 'CREDIT_CARD'>('PIX_CASH');
  const [installments, setInstallments] = useState(1);
  const [showCardForm, setShowCardForm] = useState(false);

  const steps = [
    { number: 1, title: 'Dados Pessoais', description: 'Informações básicas' },
    { number: 2, title: 'Pagamento', description: 'Escolha a forma de pagamento' },
    { number: 3, title: 'Confirmação', description: 'Inscrição concluída' },
  ];

  useEffect(() => {
    if (enrollmentId && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      
      (async () => {
        try {
          const response = await getEnrollment(Number(enrollmentId));
          setEnrollment(response.data);
          
          if (response.data.payments && response.data.payments.length > 0) {
            let selectedPayment = response.data.payments[0];
            
            // Check if specific payment was selected from URL
            if (paymentIdFromUrl) {
              // Find payment by ID from URL
              selectedPayment = response.data.payments.find((p: any) => p.id === Number(paymentIdFromUrl)) || response.data.payments[0];
            }
            
            console.log('Selected payment (FINAL):', selectedPayment);
            setPayment(selectedPayment);
          }
        } catch (err) {
          console.error('Error loading enrollment:', err);
        }
      })();
    }
  }, [enrollmentId, paymentIdFromUrl]);


  // Poll payment status when payment exists and is not confirmed
  useEffect(() => {
    if (!payment || payment.status === 'CONFIRMED' || payment.status === 'RECEIVED') {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const response = await getEnrollment(Number(enrollmentId));
        // Find the SAME payment by ID, not just the first one
        const updatedPayment = response.data.payments?.find((p: any) => p.id === payment.id);
        
        if (updatedPayment) {
          console.log('Polling - Updated payment:', updatedPayment);
          // Update payment to get latest status
          setPayment(updatedPayment);
          
          if (updatedPayment.status === 'CONFIRMED' || updatedPayment.status === 'RECEIVED') {
            clearInterval(pollInterval);
          }
        }
      } catch (err) {
        console.error('Error polling payment status:', err);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [payment?.id, enrollmentId]);

  const loadEnrollment = async () => {
    try {
      const response = await getEnrollment(Number(enrollmentId));
      setEnrollment(response.data);
      // If payment is already confirmed, don't reset it
      if (payment && (payment.status === 'CONFIRMED' || payment.status === 'RECEIVED')) {
        return;
      }
    } catch (err) {
      setError('Erro ao carregar inscrição');
    }
  };

  const handleCreatePayment = async () => {
    if (!enrollmentId) return;

    // Se for cartão, mostrar formulário
    if (paymentMethod === 'CREDIT_CARD') {
      setShowCardForm(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await createPayment({
        enrollment_id: Number(enrollmentId),
        payment_method: paymentMethod,
        installments: paymentMethod === 'PIX_CASH' ? 1 : installments,
      });

      setPayment(response.data);
      // Mark payment as loaded to prevent overwriting
      setPaymentLoaded(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao criar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handleCardSubmit = async (cardData: CardData) => {
    if (!enrollmentId) return;

    setLoading(true);
    setError('');

    try {
      // Enviar dados do cartão para o backend tokenizar
      // O backend vai tokenizar de forma segura com a API do Asaas
      const response = await createPayment({
        enrollment_id: Number(enrollmentId),
        payment_method: 'CREDIT_CARD',
        installments,
        credit_card_data: {
          number: cardData.number.replace(/\s/g, ''),
          holderName: cardData.holderName,
          expiryMonth: cardData.expiryMonth,
          expiryYear: cardData.expiryYear,
          ccv: cardData.ccv,
        },
      });

      setPayment(response.data);
      // Mark payment as loaded to prevent overwriting
      setPaymentLoaded(true);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erro ao processar cartão');
    } finally {
      setLoading(false);
    }
  };

  const copyPixCode = () => {
    if ((payment as any)?.pix_copy_paste) {
      navigator.clipboard.writeText((payment as any).pix_copy_paste);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Prevent going back to payment selection if payment is already created
  const handleBackClick = () => {
    if (payment && (payment.status === 'PENDING' || payment.status === 'CONFIRMED' || payment.status === 'RECEIVED')) {
      // Don't allow going back if payment exists
      return;
    }
    navigate('/');
  };


  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <button
          onClick={handleBackClick}
          className="flex items-center mb-8 font-medium"
          style={{ color: payment && (payment.status === 'PENDING' || payment.status === 'CONFIRMED' || payment.status === 'RECEIVED') ? '#ccc' : 'rgb(165, 44, 240)' }}
          onMouseEnter={(e) => {
            if (!(payment && (payment.status === 'PENDING' || payment.status === 'CONFIRMED' || payment.status === 'RECEIVED'))) {
              e.currentTarget.style.color = 'rgb(145, 24, 220)';
            }
          }}
          onMouseLeave={(e) => {
            if (!(payment && (payment.status === 'PENDING' || payment.status === 'CONFIRMED' || payment.status === 'RECEIVED'))) {
              e.currentTarget.style.color = 'rgb(165, 44, 240)';
            }
          }}
          disabled={!!(payment && (payment.status === 'PENDING' || payment.status === 'CONFIRMED' || payment.status === 'RECEIVED'))}
        >
          <ArrowLeft className="w-5 h-5 mr-2" style={{ color: 'inherit' }} />
          Voltar
        </button>

        {/* Progress Steps */}
        <ProgressSteps currentStep={payment ? 3 : 2} steps={steps} />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 mt-8">
            {error}
          </div>
        )}

        {!payment ? (
          /* Seleção de Pagamento */
          <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
            <h1 className="text-3xl font-bold mb-2">Forma de Pagamento</h1>
            <p className="text-gray-600 mb-8">
              Escolha como deseja pagar sua inscrição
            </p>

            {enrollment && (
              <div className="rounded-lg p-6 mb-8" style={{ backgroundColor: 'rgba(165, 44, 240, 0.05)', border: '1px solid rgba(165, 44, 240, 0.2)' }}>
                <h3 className="font-semibold text-lg mb-2">Resumo da Inscrição</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Produto:</span>
                    <span className="font-semibold ml-2">{enrollment.product.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Valor Total:</span>
                    <span className="font-semibold ml-2">R$ {enrollment.final_amount}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Opções de Pagamento */}
            <div className="space-y-4 mb-8">
              {/* PIX à Vista */}
              <div
                onClick={() => {
                  setPaymentMethod('PIX_CASH');
                  setInstallments(1);
                }}
                className="border-2 rounded-lg p-6 cursor-pointer transition-all"
                style={{
                  borderColor: paymentMethod === 'PIX_CASH' ? 'rgb(165, 44, 240)' : '#e5e7eb',
                  backgroundColor: paymentMethod === 'PIX_CASH' ? 'rgba(165, 44, 240, 0.05)' : 'transparent'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <QrCode className="w-6 h-6 mr-3" style={{ color: 'rgb(165, 44, 240)' }} />
                    <div>
                      <h3 className="font-semibold text-lg">PIX à Vista</h3>
                      <p className="text-sm text-gray-600">Pagamento único com 10% de desconto</p>
                    </div>
                  </div>
                  {enrollment && (
                    <div className="text-right">
                      <div className="text-2xl font-bold" style={{ color: 'rgb(210, 243, 67)' }}>
                        R$ {enrollment.product.active_batch?.pix_price.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500 line-through">
                        R$ {enrollment.final_amount}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* PIX Parcelado */}
              <div
                onClick={() => setPaymentMethod('PIX_INSTALLMENT')}
                className="border-2 rounded-lg p-6 cursor-pointer transition-all"
                style={{
                  borderColor: paymentMethod === 'PIX_INSTALLMENT' ? 'rgb(165, 44, 240)' : '#e5e7eb',
                  backgroundColor: paymentMethod === 'PIX_INSTALLMENT' ? 'rgba(165, 44, 240, 0.05)' : 'transparent'
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <QrCode className="w-6 h-6 mr-3" style={{ color: 'rgb(165, 44, 240)' }} />
                    <div>
                      <h3 className="font-semibold text-lg">PIX Parcelado</h3>
                      <p className="text-sm text-gray-600">Parcele em até 8x via PIX</p>
                    </div>
                  </div>
                  {enrollment && (
                    <div className="text-2xl font-bold text-gray-900">
                      R$ {enrollment.final_amount}
                    </div>
                  )}
                </div>

                {paymentMethod === 'PIX_INSTALLMENT' && (
                  <div className="mt-4 pt-4 border-t">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de parcelas:
                    </label>
                    <select
                      value={installments}
                      onChange={(e) => setInstallments(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple text-gray-900 bg-white"
                    >
                      {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                        <option key={num} value={num}>
                          {num}x de R$ {enrollment ? (parseFloat(enrollment.final_amount) / num).toFixed(2) : '0.00'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Cartão de Crédito */}
              <div
                onClick={() => setPaymentMethod('CREDIT_CARD')}
                className="border-2 rounded-lg p-6 cursor-pointer transition-all"
                style={{
                  borderColor: paymentMethod === 'CREDIT_CARD' ? 'rgb(165, 44, 240)' : '#e5e7eb',
                  backgroundColor: paymentMethod === 'CREDIT_CARD' ? 'rgba(165, 44, 240, 0.05)' : 'transparent'
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <CreditCardIcon className="w-6 h-6 mr-3" style={{ color: 'rgb(165, 44, 240)' }} />
                    <div>
                      <h3 className="font-semibold text-lg">Cartão de Crédito</h3>
                      <p className="text-sm text-gray-600">Parcele em até 8x no cartão</p>
                    </div>
                  </div>
                  {enrollment && (
                    <div className="text-2xl font-bold text-gray-900">
                      R$ {enrollment.final_amount}
                    </div>
                  )}
                </div>

                {paymentMethod === 'CREDIT_CARD' && (
                  <div className="mt-4 pt-4 border-t">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de parcelas:
                    </label>
                    <select
                      value={installments}
                      onChange={(e) => setInstallments(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple text-gray-900 bg-white"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                        <option key={num} value={num}>
                          {num}x de R$ {enrollment ? (parseFloat(enrollment.final_amount) / num).toFixed(2) : '0.00'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {!showCardForm ? (
              <button
                onClick={handleCreatePayment}
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processando...' : 'Continuar'}
              </button>
            ) : (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Dados do Cartão</h2>
                  <button
                    onClick={() => setShowCardForm(false)}
                    className="text-sm font-medium"
                    style={{ color: 'rgb(165, 44, 240)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(145, 24, 220)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(165, 44, 240)'}
                    disabled={loading}
                  >
                    ← Voltar
                  </button>
                </div>
                <CreditCardForm onSubmit={handleCardSubmit} loading={loading} />
              </div>
            )}
          </div>
        ) : (
          /* Confirmação de Pagamento */
          <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
            <div className="text-center mb-8">
              <div 
                className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                style={{
                  backgroundColor: payment.status === 'CONFIRMED' || payment.status === 'RECEIVED'
                    ? 'rgba(220, 253, 97, 0.2)'
                    : 'rgba(165, 44, 240, 0.2)'
                }}
              >
                <Check 
                  className="w-8 h-8"
                  style={{
                    color: payment.status === 'CONFIRMED' || payment.status === 'RECEIVED'
                      ? 'rgb(210, 243, 67)'
                      : 'rgb(165, 44, 240)'
                  }}
                />
              </div>
              <h1 className="text-3xl font-bold mb-2">
                {payment.status === 'CONFIRMED' || payment.status === 'RECEIVED'
                  ? '🎉 Pagamento Confirmado!'
                  : payment.pix_qr_code 
                    ? 'Pagamento Gerado!' 
                    : 'Pagamento Processado!'}
              </h1>
              
              {/* Indicação da Parcela */}
              {enrollment?.payment_method === 'PIX_INSTALLMENT' && (payment as any)?.installment_number && (
                <div className="mb-3">
                  <span className="inline-block px-4 py-2 rounded-full font-semibold text-sm" style={{ backgroundColor: 'rgba(165, 44, 240, 0.1)', color: 'rgb(165, 44, 240)' }}>
                    Parcela {(payment as any).installment_number}/{enrollment.installments}
                  </span>
                </div>
              )}
              
              <p className="text-gray-600">
                {payment.status === 'CONFIRMED' || payment.status === 'RECEIVED'
                  ? 'Seu pagamento foi confirmado com sucesso! Você receberá um email de confirmação.'
                  : payment.pix_qr_code 
                    ? 'Escaneie o QR Code ou copie o código PIX'
                    : 'Seu pagamento com cartão está sendo processado'}
              </p>
            </div>

            {/* QR Code */}
            {payment.pix_qr_code && (
              <div className="flex justify-center mb-8">
                <img
                  src={`data:image/png;base64,${payment.pix_qr_code}`}
                  alt="QR Code PIX"
                  className="w-64 h-64 border-4 border-gray-200 rounded-lg"
                />
              </div>
            )}

            {/* Código Copia e Cola */}
            {(payment as any)?.pix_copy_paste && (
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código PIX (Copia e Cola):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={(payment as any).pix_copy_paste}
                    readOnly
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  />
                  <button
                    onClick={copyPixCode}
                    className="px-6 py-3 rounded-lg transition-colors flex items-center gap-2 font-semibold"
                    style={{ backgroundColor: 'rgb(165, 44, 240)', color: '#ffffff' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(145, 24, 220)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(165, 44, 240)'}
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
            )}

            {/* Informações do Pagamento */}
            <div 
              className="border rounded-lg p-6 mb-8"
              style={{
                backgroundColor: payment.status === 'CONFIRMED' || payment.status === 'RECEIVED' 
                  ? 'rgba(220, 253, 97, 0.1)' 
                  : 'rgba(165, 44, 240, 0.05)',
                borderColor: payment.status === 'CONFIRMED' || payment.status === 'RECEIVED' 
                  ? 'rgb(220, 253, 97)' 
                  : 'rgba(165, 44, 240, 0.2)'
              }}
            >
              <h3 className="font-semibold text-lg mb-4">Detalhes do Pagamento</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor:</span>
                  <span className="font-semibold">R$ {payment.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vencimento:</span>
                  <span className="font-semibold">
                    {new Date(payment.due_date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span 
                    className="font-semibold"
                    style={{
                      color: payment.status === 'CONFIRMED' || payment.status === 'RECEIVED'
                        ? 'rgb(210, 243, 67)'
                        : '#d97706'
                    }}
                  >
                    {payment.status === 'CONFIRMED' || payment.status === 'RECEIVED' 
                      ? '✓ Pagamento Confirmado!' 
                      : 'Aguardando Pagamento'}
                  </span>
                </div>
                {(payment.status === 'CONFIRMED' || payment.status === 'RECEIVED') && payment.paid_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pago em:</span>
                    <span className="font-semibold" style={{ color: 'rgb(210, 243, 67)' }}>
                      {new Date(payment.paid_at).toLocaleDateString('pt-BR')} às {new Date(payment.paid_at).toLocaleTimeString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => navigate('/')}
                className="btn-secondary"
              >
                Voltar para Início
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
