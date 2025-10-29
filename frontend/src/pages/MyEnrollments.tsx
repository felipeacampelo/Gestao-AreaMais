import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, CheckCircle, Clock, XCircle, CreditCard, AlertCircle } from 'lucide-react';
import { getEnrollments, type Enrollment } from '../services/api';

export default function MyEnrollments() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('MyEnrollments component mounted');
    loadEnrollments();
  }, []);

  const loadEnrollments = async () => {
    console.log('loadEnrollments called');
    try {
      console.log('Calling getEnrollments API...');
      const response = await getEnrollments();
      console.log('API Response:', response);
      
      // Handle both array and paginated response
      let enrollmentsData: Enrollment[] = [];
      
      if (Array.isArray(response.data)) {
        enrollmentsData = response.data;
      } else if (response.data && Array.isArray((response.data as any).results)) {
        // Paginated response
        enrollmentsData = (response.data as any).results;
      }
      
      console.log('Loaded enrollments:', enrollmentsData);
      enrollmentsData.forEach((e: any) => {
        console.log(`Enrollment ${e.id}:`, {
          payment_method: e.payment_method,
          installments: e.installments,
          payments_count: e.payments?.length || 0,
          payments: e.payments
        });
      });
      setEnrollments(enrollmentsData);
    } catch (err: any) {
      console.error('Error loading enrollments:', err);
      setError(err.response?.data?.detail || err.message || 'Erro ao carregar inscrições. Verifique se o backend está rodando.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="w-5 h-5" style={{ color: 'rgb(210, 243, 67)' }} />;
      case 'PENDING_PAYMENT':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'CANCELLED':
      case 'EXPIRED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'Pago';
      case 'PENDING_PAYMENT':
        return 'Aguardando Pagamento';
      case 'CANCELLED':
        return 'Cancelado';
      case 'EXPIRED':
        return 'Expirado';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'rgb(210, 243, 67)';
      case 'PENDING_PAYMENT':
        return '#eab308';
      case 'CANCELLED':
      case 'EXPIRED':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center mb-8 font-medium"
          style={{ color: 'rgb(165, 44, 240)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(145, 24, 220)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(165, 44, 240)'}
        >
          <ArrowLeft className="w-5 h-5 mr-2" style={{ color: 'inherit' }} />
          Voltar
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Minhas Inscrições</h1>
          <p className="text-gray-600 mb-8">
            Visualize todas as suas inscrições e seus status
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'rgb(165, 44, 240)' }}></div>
              <p className="mt-4 text-gray-600">Carregando inscrições...</p>
            </div>
          ) : enrollments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma inscrição encontrada</h3>
              <p className="text-gray-600 mb-6">
                Você ainda não fez nenhuma inscrição
              </p>
              <button
                onClick={() => navigate('/inscricao')}
                className="btn-primary"
              >
                Fazer Inscrição
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {enrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                  style={{
                    borderColor: enrollment.status === 'PAID' ? 'rgb(210, 243, 67)' : '#e5e7eb'
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(enrollment.status)}
                        <h3 className="text-xl font-semibold">
                          {enrollment.product_name || 'Produto'}
                        </h3>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <span className="text-sm text-gray-600">Lote:</span>
                          <p className="font-medium">{enrollment.batch_name || 'N/A'}</p>
                        </div>
                        
                        <div>
                          <span className="text-sm text-gray-600">Valor:</span>
                          <p className="font-medium">R$ {enrollment.final_amount}</p>
                        </div>
                        
                        <div>
                          <span className="text-sm text-gray-600">Forma de Pagamento:</span>
                          <p className="font-medium">
                            {enrollment.payment_method === 'PIX_CASH' && 'PIX à Vista'}
                            {enrollment.payment_method === 'PIX_INSTALLMENT' && 'PIX Parcelado'}
                            {enrollment.payment_method === 'CREDIT_CARD' && 'Cartão de Crédito'}
                            {!enrollment.payment_method && 'Não definido'}
                          </p>
                        </div>
                        
                        <div>
                          <span className="text-sm text-gray-600">Data da Inscrição:</span>
                          <p className="font-medium">
                            {new Date(enrollment.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <span
                        className="inline-block px-4 py-2 rounded-full text-sm font-semibold"
                        style={{
                          backgroundColor: `${getStatusColor(enrollment.status)}20`,
                          color: getStatusColor(enrollment.status)
                        }}
                      >
                        {getStatusText(enrollment.status)}
                      </span>
                    </div>
                  </div>

                  {/* Seção de Parcelas PIX */}
                  {enrollment.payment_method === 'PIX_INSTALLMENT' && enrollment.payments && enrollment.payments.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <CreditCard className="w-5 h-5" style={{ color: 'rgb(165, 44, 240)' }} />
                        Parcelas PIX ({enrollment.installments}x)
                      </h4>
                      
                      <div className="space-y-3">
                        {enrollment.payments.map((payment: any, index: number) => {
                          const daysUntilDue = payment.due_date 
                            ? Math.ceil((new Date(payment.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                            : null;
                          const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
                          const isDueSoon = daysUntilDue !== null && daysUntilDue > 0 && daysUntilDue <= 7;
                          
                          return (
                            <div 
                              key={payment.id} 
                              className="flex items-center justify-between p-4 rounded-lg border"
                              style={{
                                backgroundColor: payment.status === 'RECEIVED' || payment.status === 'CONFIRMED' 
                                  ? 'rgba(34, 197, 94, 0.05)' 
                                  : isOverdue 
                                  ? 'rgba(239, 68, 68, 0.05)'
                                  : isDueSoon
                                  ? 'rgba(234, 179, 8, 0.05)'
                                  : 'rgba(243, 244, 246, 1)',
                                borderColor: payment.status === 'RECEIVED' || payment.status === 'CONFIRMED'
                                  ? 'rgba(34, 197, 94, 0.3)'
                                  : isOverdue
                                  ? 'rgba(239, 68, 68, 0.3)'
                                  : isDueSoon
                                  ? 'rgba(234, 179, 8, 0.3)'
                                  : 'rgba(229, 231, 235, 1)'
                              }}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <span className="font-semibold">
                                    Parcela {index + 1}/{enrollment.installments}
                                  </span>
                                  <span
                                    className="px-2 py-1 rounded text-xs font-medium"
                                    style={{
                                      backgroundColor: payment.status === 'RECEIVED' || payment.status === 'CONFIRMED'
                                        ? 'rgba(34, 197, 94, 0.2)'
                                        : isOverdue
                                        ? 'rgba(239, 68, 68, 0.2)'
                                        : 'rgba(234, 179, 8, 0.2)',
                                      color: payment.status === 'RECEIVED' || payment.status === 'CONFIRMED'
                                        ? 'rgb(22, 163, 74)'
                                        : isOverdue
                                        ? 'rgb(220, 38, 38)'
                                        : 'rgb(161, 98, 7)'
                                    }}
                                  >
                                    {payment.status === 'RECEIVED' || payment.status === 'CONFIRMED' ? '✓ Paga' :
                                     isOverdue ? '⚠ Vencida' :
                                     '⏳ Pendente'}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  {payment.due_date && (
                                    <span>
                                      Vencimento: {new Date(payment.due_date).toLocaleDateString('pt-BR')}
                                    </span>
                                  )}
                                  {isDueSoon && (
                                    <span className="flex items-center gap-1 text-yellow-700 font-medium">
                                      <AlertCircle className="w-4 h-4" />
                                      Vence em {daysUntilDue} {daysUntilDue === 1 ? 'dia' : 'dias'}
                                    </span>
                                  )}
                                  {isOverdue && (
                                    <span className="flex items-center gap-1 text-red-700 font-medium">
                                      <AlertCircle className="w-4 h-4" />
                                      Vencida há {Math.abs(daysUntilDue!)} {Math.abs(daysUntilDue!) === 1 ? 'dia' : 'dias'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-lg">R$ {payment.amount}</span>
                                
                                {payment.status !== 'RECEIVED' && payment.status !== 'CONFIRMED' && (
                                  <button
                                    onClick={() => navigate(`/payment/${enrollment.id}?paymentId=${payment.id}`)}
                                    className="px-4 py-2 rounded-lg font-medium transition-colors"
                                    style={{
                                      backgroundColor: 'rgb(165, 44, 240)',
                                      color: 'white'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(145, 24, 220)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(165, 44, 240)'}
                                  >
                                    Pagar Agora
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Botão para antecipar todas as parcelas */}
                      {enrollment.payments.some((p: any) => p.status !== 'RECEIVED' && p.status !== 'CONFIRMED') && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-semibold text-green-900 mb-1">
                                Antecipe todas as parcelas?
                              </h5>
                              <p className="text-sm text-green-700">
                                Pague todas as parcelas pendentes de uma vez!
                              </p>
                            </div>
                            <button
                              onClick={() => navigate(`/payment/${enrollment.id}?payAll=true`)}
                              className="ml-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
                            >
                              Antecipar Todas
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {enrollment.status === 'PENDING_PAYMENT' && enrollment.payment_method !== 'PIX_INSTALLMENT' && (
                    <div className="mt-4 pt-4 border-t">
                      <button
                        onClick={() => navigate(`/payment/${enrollment.id}`)}
                        className="btn-primary"
                      >
                        Continuar Pagamento
                      </button>
                    </div>
                  )}

                  {enrollment.status === 'PAID' && enrollment.paid_at && (
                    <div className="mt-4 pt-4 border-t">
                      <span className="text-sm text-gray-600">
                        Pago em: {new Date(enrollment.paid_at).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(enrollment.paid_at).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
