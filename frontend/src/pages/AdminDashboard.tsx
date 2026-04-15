import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  DollarSign, 
  FileText, 
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Search,
  Filter,
  Download,
  Eye,
  Settings
} from 'lucide-react';
import { getAdminDashboard, getAdminEnrollments } from '../services/api';

interface BatchStats {
  id: number;
  name: string;
  product_name: string;
  max_enrollments: number | null;
  current_enrollments: number;
  pending: number;
  paid: number;
  status: string;
}

interface DashboardStats {
  enrollments: {
    total: number;
    pending: number;
    confirmed: number;
    recent: number;
  };
  payments: {
    total: number;
    confirmed: number;
    pending: number;
    recent: number;
  };
  revenue: {
    total: number;
    pending: number;
    fees: number;
    net: number;
  };
  payment_methods: Array<{
    payment_method: string;
    count: number;
  }>;
  batches: BatchStats[];
}

interface OverduePayment {
  id: number;
  installment_number: number;
  amount: string;
  due_date: string;
  days_overdue: number;
}

interface OverdueEnrollment {
  enrollment: any;
  overdue_payments: OverduePayment[];
  total_overdue_amount: number;
  oldest_due_date: string;
}

const parseLocalDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [allEnrollments, setAllEnrollments] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOverduePayments, setShowOverduePayments] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const overdueEnrollments = useMemo<OverdueEnrollment[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const unpaidStatuses = new Set(['CREATED', 'PENDING', 'OVERDUE']);

    const groups = allEnrollments
      .map((enrollment) => {
        const overduePayments = (enrollment.payments || [])
          .filter((payment: any) => {
            if (!payment?.due_date) return false;
            if (!unpaidStatuses.has(payment.status)) return false;

            const dueDate = parseLocalDate(payment.due_date);
            return dueDate < today;
          })
          .map((payment: any) => {
            const dueDate = parseLocalDate(payment.due_date);
            const daysOverdue = Math.max(
              0,
              Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
            );

            return {
              id: payment.id,
              installment_number: payment.installment_number,
              amount: payment.amount,
              due_date: payment.due_date,
              days_overdue: daysOverdue,
            };
          })
          .sort((a: OverduePayment, b: OverduePayment) => b.days_overdue - a.days_overdue);

        if (!overduePayments.length) {
          return null;
        }

        const total_overdue_amount = overduePayments.reduce(
          (sum: number, payment: OverduePayment) => sum + Number(payment.amount || 0),
          0
        );

        const oldest_due_date = overduePayments
          .slice()
          .sort((a: OverduePayment, b: OverduePayment) => a.days_overdue - b.days_overdue)[0].due_date;

        return {
          enrollment,
          overdue_payments: overduePayments,
          total_overdue_amount,
          oldest_due_date,
        };
      })
      .filter((item): item is OverdueEnrollment => item !== null)
      .sort((a, b) => {
        if (b.overdue_payments.length !== a.overdue_payments.length) {
          return b.overdue_payments.length - a.overdue_payments.length;
        }
        if (b.total_overdue_amount !== a.total_overdue_amount) {
          return b.total_overdue_amount - a.total_overdue_amount;
        }
        return b.oldest_due_date.localeCompare(a.oldest_due_date);
      });

    return groups;
  }, [allEnrollments]);

  const overduePaymentsCount = overdueEnrollments.reduce(
    (sum, item) => sum + item.overdue_payments.length,
    0
  );

  const overdueTotalAmount = overdueEnrollments.reduce(
    (sum, item) => sum + item.total_overdue_amount,
    0
  );

  const loadData = async () => {
    try {
      const [statsRes, enrollmentsRes] = await Promise.all([
        getAdminDashboard(),
        getAdminEnrollments()
      ]);
      setStats(statsRes.data);
      setAllEnrollments(enrollmentsRes.data);
      setEnrollments(enrollmentsRes.data);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      const res = await getAdminEnrollments({
        search: searchTerm,
        status: statusFilter || undefined,
        payment_method: paymentMethodFilter || undefined
      });
      setEnrollments(res.data);
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'ID', 'Nome Completo', 'Email', 'Telefone', 'CPF', 'RG',
      'Data Nascimento', 'Tamanho Camiseta', 'Membro Batista Capital',
      'Igreja', 'Líder PG', 'Produto', 'Lote', 'Status',
      'Método Pagamento', 'Parcelas', 'Valor Total', 'Desconto',
      'Valor Final', 'Data Inscrição', 'Data Pagamento'
    ];
    const rows = enrollments.map(e => [
      e.id,
      e.form_data?.nome_completo || '',
      e.user_email,
      e.form_data?.telefone || '',
      e.form_data?.cpf || '',
      e.form_data?.rg || '',
      e.form_data?.data_nascimento || '',
      e.form_data?.tamanho_camiseta || '',
      e.form_data?.membro_batista_capital || '',
      e.form_data?.igreja || '',
      e.form_data?.lider_pg || '',
      e.product?.name || '',
      e.batch?.name || '',
      e.status,
      e.payment_method === 'PIX_CASH' ? 'PIX à Vista' : 
      e.payment_method === 'PIX_INSTALLMENT' ? 'PIX Parcelado' : 
      e.payment_method === 'CREDIT_CARD' ? 'Cartão de Crédito' : '',
      e.installments || '',
      e.total_amount || '',
      e.discount_amount || '',
      e.final_amount,
      new Date(e.created_at).toLocaleDateString('pt-BR'),
      e.paid_at ? new Date(e.paid_at).toLocaleDateString('pt-BR') : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inscricoes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'rgb(165, 44, 240)' }}></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1 sm:gap-2 font-medium text-sm sm:text-base"
              style={{ color: 'rgb(165, 44, 240)' }}
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Voltar</span>
            </button>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Painel Admin</h1>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={exportToCSV}
              className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm sm:text-base"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar</span> CSV
            </button>
            <a
              href="https://gestao-areamais-production.up.railway.app/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
              style={{ backgroundColor: 'rgb(165, 44, 240)', color: 'white' }}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </a>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            {/* Total Inscrições */}
            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className="p-2 sm:p-3 rounded-full" style={{ backgroundColor: 'rgba(165, 44, 240, 0.1)' }}>
                  <Users className="w-4 h-4 sm:w-6 sm:h-6" style={{ color: 'rgb(165, 44, 240)' }} />
                </div>
                <span className="text-xs sm:text-sm text-gray-500 hidden sm:block">+{stats.enrollments.recent} esta semana</span>
              </div>
              <h3 className="text-lg sm:text-2xl font-bold mb-1">{stats.enrollments.total}</h3>
              <p className="text-xs sm:text-base text-gray-600">Inscrições</p>
              <div className="mt-2 sm:mt-4 flex flex-col sm:flex-row gap-1 sm:gap-4 text-xs sm:text-sm">
                <span className="text-green-600">✓ {stats.enrollments.confirmed}</span>
                <span className="text-yellow-600">⏳ {stats.enrollments.pending}</span>
              </div>
            </div>

            {/* Pagamentos */}
            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className="p-2 sm:p-3 rounded-full" style={{ backgroundColor: 'rgba(220, 253, 97, 0.2)' }}>
                  <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6" style={{ color: 'rgb(210, 243, 67)' }} />
                </div>
                <span className="text-xs sm:text-sm text-gray-500 hidden sm:block">+{stats.payments.recent} esta semana</span>
              </div>
              <h3 className="text-lg sm:text-2xl font-bold mb-1">{stats.payments.confirmed}</h3>
              <p className="text-xs sm:text-base text-gray-600">Confirmados</p>
              <div className="mt-2 sm:mt-4 text-xs sm:text-sm text-gray-500">
                {stats.payments.pending} pendentes
              </div>
            </div>

            {/* Receita Líquida */}
            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className="p-2 sm:p-3 rounded-full" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                  <DollarSign className="w-4 h-4 sm:w-6 sm:h-6" style={{ color: 'rgb(34, 197, 94)' }} />
                </div>
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <h3 className="text-sm sm:text-2xl font-bold mb-1 text-green-600">
                <span className="hidden sm:inline">R$ </span>{stats.revenue.net.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-xs sm:text-base text-gray-600">Receita Líquida</p>
              <div className="mt-2 sm:mt-4 space-y-1 text-xs sm:text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Bruta:</span>
                  <span>R$ {stats.revenue.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-red-500">
                  <span>Taxas:</span>
                  <span>- R$ {stats.revenue.fees.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Métodos de Pagamento */}
            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className="p-2 sm:p-3 rounded-full" style={{ backgroundColor: 'rgba(220, 253, 97, 0.2)' }}>
                  <FileText className="w-4 h-4 sm:w-6 sm:h-6" style={{ color: 'rgb(210, 243, 67)' }} />
                </div>
              </div>
              <h3 className="text-xs sm:text-lg font-bold mb-2 sm:mb-3">Métodos</h3>
              <div className="space-y-1 sm:space-y-2">
                {stats.payment_methods.filter((method) => method.payment_method).map((method) => (
                  <div key={method.payment_method} className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-600 truncate">{(method.payment_method || '').replace('PIX à Vista', 'PIX').replace('PIX Parcelado', 'PIX Parc.').replace('Cartão de Crédito', 'Cartão')}</span>
                    <span className="font-semibold ml-1">{method.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pagamentos em atraso */}
        <div className="bg-white rounded-xl shadow-lg mb-6 sm:mb-8 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowOverduePayments((value) => !value)}
            className="w-full px-3 sm:px-6 py-4 flex items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold truncate">Pagamentos em atraso</h2>
                <p className="text-sm text-gray-600 hidden sm:block">
                  Clique na seta para ver as inscrições e parcelas atrasadas.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 font-medium text-sm whitespace-nowrap">
                {overduePaymentsCount} parcelas
              </span>
              {showOverduePayments ? (
                <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
              )}
            </div>
          </button>

          {showOverduePayments && (
            <div className="border-t px-3 sm:px-6 py-4 sm:py-6">
              <div className="flex flex-wrap gap-2 sm:gap-3 text-sm mb-4">
                <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 font-medium">
                  {overdueEnrollments.length} inscrições
                </span>
                <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 font-medium">
                  R$ {formatCurrency(overdueTotalAmount)}
                </span>
                <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 font-medium">
                  {overduePaymentsCount} parcelas em aberto
                </span>
              </div>

              {overdueEnrollments.length === 0 ? (
                <div className="rounded-lg border border-dashed border-green-200 bg-green-50 px-4 py-6 text-green-800">
                  Nenhum pagamento está em atraso no momento.
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {overdueEnrollments.map((item) => {
                    const name = item.enrollment.form_data?.nome_completo || item.enrollment.user_email || 'Sem nome';
                    return (
                      <div
                        key={item.enrollment.id}
                        className="rounded-xl border border-red-200 bg-red-50/50 p-4 sm:p-5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-base sm:text-lg truncate">{name}</p>
                            <p className="text-sm text-gray-600">
                              {item.enrollment.user_email} • {item.enrollment.product?.name || item.enrollment.product_name || 'Produto'}
                            </p>
                            <p className="text-sm text-gray-600">
                              Lote: {item.enrollment.batch?.name || item.enrollment.batch_name || 'N/A'}
                            </p>
                          </div>

                          <button
                            onClick={() => setSelectedEnrollment(item.enrollment)}
                            className="px-3 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors"
                            style={{ backgroundColor: 'rgb(165, 44, 240)', color: 'white' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(145, 24, 220)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(165, 44, 240)'}
                          >
                            Ver inscrição
                          </button>
                        </div>

                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                          <div className="rounded-lg bg-white p-3 border">
                            <p className="text-gray-500">Parcelas atrasadas</p>
                            <p className="font-semibold">{item.overdue_payments.length}</p>
                          </div>
                          <div className="rounded-lg bg-white p-3 border">
                            <p className="text-gray-500">Total em atraso</p>
                            <p className="font-semibold">R$ {formatCurrency(item.total_overdue_amount)}</p>
                          </div>
                          <div className="rounded-lg bg-white p-3 border col-span-2 sm:col-span-1">
                            <p className="text-gray-500">Mais antiga</p>
                            <p className="font-semibold">
                              {parseLocalDate(item.oldest_due_date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          {item.overdue_payments.map((payment) => (
                            <div
                              key={payment.id}
                              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg bg-white border px-3 py-2"
                            >
                              <div>
                                <p className="font-medium">
                                  Parcela {payment.installment_number}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Venceu em {parseLocalDate(payment.due_date).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                              <div className="text-left sm:text-right">
                                <p className="font-semibold">R$ {payment.amount}</p>
                                <p className="text-sm text-red-700">
                                  {payment.days_overdue} {payment.days_overdue === 1 ? 'dia' : 'dias'} em atraso
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Inscrições por Lote */}
        {stats && stats.batches && stats.batches.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Inscrições por Lote</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {stats.batches.map((batch) => (
                <div 
                  key={batch.id} 
                  className="border rounded-lg p-3 sm:p-4"
                  style={{
                    borderColor: batch.status === 'ACTIVE' ? 'rgb(165, 44, 240)' : '#e5e7eb',
                    backgroundColor: batch.status === 'ACTIVE' ? 'rgba(165, 44, 240, 0.05)' : 'white'
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm sm:text-base">{batch.name}</h3>
                    <span 
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: batch.status === 'ACTIVE' ? 'rgba(165, 44, 240, 0.2)' : 
                                        batch.status === 'FULL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(156, 163, 175, 0.2)',
                        color: batch.status === 'ACTIVE' ? 'rgb(165, 44, 240)' : 
                               batch.status === 'FULL' ? 'rgb(220, 38, 38)' : 'rgb(107, 114, 128)'
                      }}
                    >
                      {batch.status === 'ACTIVE' ? 'Ativo' : 
                       batch.status === 'FULL' ? 'Esgotado' : 
                       batch.status === 'SCHEDULED' ? 'Agendado' : 
                       batch.status === 'ENDED' ? 'Encerrado' : batch.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{batch.product_name}</p>
                  
                  {/* Barra de progresso */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">Vagas</span>
                      <span className="font-medium">
                        {batch.current_enrollments}{batch.max_enrollments ? `/${batch.max_enrollments}` : ''}
                      </span>
                    </div>
                    {batch.max_enrollments && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all"
                          style={{ 
                            width: `${Math.min((batch.current_enrollments / batch.max_enrollments) * 100, 100)}%`,
                            backgroundColor: batch.current_enrollments >= batch.max_enrollments ? 'rgb(239, 68, 68)' : 'rgb(165, 44, 240)'
                          }}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Detalhes */}
                  <div className="flex gap-3 text-xs">
                    <span className="text-green-600">✓ {batch.paid} pagos</span>
                    <span className="text-yellow-600">⏳ {batch.pending} pend.</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inscrições List */}
        <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6">
          <div className="flex flex-col gap-4 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-2xl font-bold">Inscrições</h2>
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple text-sm sm:text-base text-gray-900 bg-white"
                />
              </div>
              
              <div className="flex gap-2 sm:gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 sm:flex-none px-2 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple text-sm sm:text-base text-gray-900 bg-white"
                >
                  <option value="">Status</option>
                  <option value="PENDING_PAYMENT">Pendente</option>
                  <option value="PAID">Pago</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
                
                <select
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  className="flex-1 sm:flex-none px-2 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple text-sm sm:text-base text-gray-900 bg-white"
                >
                  <option value="">Forma</option>
                  <option value="PIX_CASH">PIX</option>
                  <option value="PIX_INSTALLMENT">PIX Parc.</option>
                  <option value="CREDIT_CARD">Cartão</option>
                </select>
                
                <button
                  onClick={handleSearch}
                  className="btn-primary flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4"
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filtrar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="sm:hidden space-y-3">
            {enrollments.map((enrollment) => (
              <div 
                key={enrollment.id} 
                className="border rounded-lg p-3 hover:bg-gray-50"
                onClick={() => setSelectedEnrollment(enrollment)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{enrollment.form_data?.nome_completo || '-'}</p>
                    <p className="text-xs text-gray-500">#{enrollment.id}</p>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: enrollment.status === 'PAID' 
                        ? 'rgba(34, 197, 94, 0.2)' 
                        : enrollment.status === 'PENDING_PAYMENT'
                        ? 'rgba(234, 179, 8, 0.2)'
                        : 'rgba(239, 68, 68, 0.2)',
                      color: enrollment.status === 'PAID' 
                        ? 'rgb(22, 163, 74)' 
                        : enrollment.status === 'PENDING_PAYMENT'
                        ? 'rgb(161, 98, 7)'
                        : 'rgb(220, 38, 38)'
                    }}
                  >
                    {enrollment.status === 'PAID' ? '✓ Pago' : 
                     enrollment.status === 'PENDING_PAYMENT' ? '⏳ Pend.' : 
                     enrollment.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>{enrollment.form_data?.telefone || enrollment.user_email}</span>
                  <span className="font-semibold text-gray-900">R$ {enrollment.final_amount}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 lg:px-4 font-semibold text-sm">ID</th>
                  <th className="text-left py-3 px-2 lg:px-4 font-semibold text-sm">Nome</th>
                  <th className="text-left py-3 px-2 lg:px-4 font-semibold text-sm hidden lg:table-cell">Email</th>
                  <th className="text-left py-3 px-2 lg:px-4 font-semibold text-sm hidden xl:table-cell">Telefone</th>
                  <th className="text-left py-3 px-2 lg:px-4 font-semibold text-sm hidden xl:table-cell">Camiseta</th>
                  <th className="text-left py-3 px-2 lg:px-4 font-semibold text-sm">Status</th>
                  <th className="text-left py-3 px-2 lg:px-4 font-semibold text-sm hidden lg:table-cell">Pagamento</th>
                  <th className="text-left py-3 px-2 lg:px-4 font-semibold text-sm">Valor</th>
                  <th className="text-left py-3 px-2 lg:px-4 font-semibold text-sm">Ações</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2 lg:px-4 text-sm">#{enrollment.id}</td>
                    <td className="py-3 px-2 lg:px-4 font-medium text-sm">{enrollment.form_data?.nome_completo || '-'}</td>
                    <td className="py-3 px-2 lg:px-4 text-sm hidden lg:table-cell">{enrollment.user_email}</td>
                    <td className="py-3 px-2 lg:px-4 text-sm hidden xl:table-cell">{enrollment.form_data?.telefone || '-'}</td>
                    <td className="py-3 px-2 lg:px-4 text-sm hidden xl:table-cell">{enrollment.form_data?.tamanho_camiseta || '-'}</td>
                    <td className="py-3 px-2 lg:px-4">
                      <span
                        className="px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm font-medium whitespace-nowrap"
                        style={{
                          backgroundColor: enrollment.status === 'PAID' 
                            ? 'rgba(34, 197, 94, 0.2)' 
                            : enrollment.status === 'PENDING_PAYMENT'
                            ? 'rgba(234, 179, 8, 0.2)'
                            : 'rgba(239, 68, 68, 0.2)',
                          color: enrollment.status === 'PAID' 
                            ? 'rgb(22, 163, 74)' 
                            : enrollment.status === 'PENDING_PAYMENT'
                            ? 'rgb(161, 98, 7)'
                            : 'rgb(220, 38, 38)'
                        }}
                      >
                        {enrollment.status === 'PAID' ? '✓ Pago' : 
                         enrollment.status === 'PENDING_PAYMENT' ? '⏳ Pend.' : 
                         enrollment.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 lg:px-4 hidden lg:table-cell">
                      {enrollment.payment_method === 'PIX_INSTALLMENT' && enrollment.payments ? (
                        <div className="text-sm">
                          <span className="font-medium">
                            {enrollment.payments.filter((p: any) => p.status === 'CONFIRMED' || p.status === 'RECEIVED').length}/{enrollment.payments.length}
                          </span>
                          <span className="text-gray-500 ml-1">parc.</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">
                          {enrollment.payment_method === 'PIX_CASH' ? 'PIX' : 
                           enrollment.payment_method === 'CREDIT_CARD' ? 'Cartão' : '-'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 lg:px-4 font-medium text-sm">R$ {enrollment.final_amount}</td>
                    <td className="py-3 px-2 lg:px-4">
                      <button
                        onClick={() => setSelectedEnrollment(enrollment)}
                        className="flex items-center gap-1 px-2 lg:px-3 py-1 text-xs lg:text-sm rounded-lg transition-colors"
                        style={{ 
                          backgroundColor: 'rgba(165, 44, 240, 0.1)',
                          color: 'rgb(165, 44, 240)'
                        }}
                      >
                        <Eye className="w-3 h-3 lg:w-4 lg:h-4" />
                        <span className="hidden lg:inline">Ver</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Detalhes */}
        {selectedEnrollment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 sm:p-4">
            <div className="bg-white rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-2xl font-bold">Inscrição #{selectedEnrollment.id}</h2>
                  <button
                    onClick={() => setSelectedEnrollment(null)}
                    className="text-gray-500 hover:text-gray-700 p-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  {/* Dados Pessoais */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3" style={{ color: 'rgb(165, 44, 240)' }}>
                      Dados Pessoais
                    </h3>
                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                      <div className="col-span-2 sm:col-span-1">
                        <label className="text-xs sm:text-sm text-gray-600">Nome Completo</label>
                        <p className="font-medium text-sm sm:text-base">{selectedEnrollment.form_data?.nome_completo || '-'}</p>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="text-xs sm:text-sm text-gray-600">Email</label>
                        <p className="font-medium text-sm sm:text-base break-all">{selectedEnrollment.user_email}</p>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm text-gray-600">Telefone</label>
                        <p className="font-medium text-sm sm:text-base">{selectedEnrollment.form_data?.telefone || '-'}</p>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm text-gray-600">Nascimento</label>
                        <p className="font-medium text-sm sm:text-base">{selectedEnrollment.form_data?.data_nascimento || '-'}</p>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm text-gray-600">CPF</label>
                        <p className="font-medium text-sm sm:text-base">{selectedEnrollment.form_data?.cpf || '-'}</p>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm text-gray-600">RG</label>
                        <p className="font-medium text-sm sm:text-base">{selectedEnrollment.form_data?.rg || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Dados do Acampamento */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3" style={{ color: 'rgb(165, 44, 240)' }}>
                      Acampamento
                    </h3>
                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                      <div>
                        <label className="text-xs sm:text-sm text-gray-600">Camiseta</label>
                        <p className="font-medium text-sm sm:text-base">{selectedEnrollment.form_data?.tamanho_camiseta || '-'}</p>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm text-gray-600">Membro BC</label>
                        <p className="font-medium text-sm sm:text-base">{selectedEnrollment.form_data?.membro_batista_capital === 'sim' ? 'Sim' : selectedEnrollment.form_data?.membro_batista_capital === 'nao' ? 'Não' : '-'}</p>
                      </div>
                      {selectedEnrollment.form_data?.membro_batista_capital === 'nao' && (
                        <div>
                          <label className="text-xs sm:text-sm text-gray-600">Igreja</label>
                          <p className="font-medium text-sm sm:text-base">{selectedEnrollment.form_data?.igreja || '-'}</p>
                        </div>
                      )}
                      <div>
                        <label className="text-xs sm:text-sm text-gray-600">Líder PG</label>
                        <p className="font-medium text-sm sm:text-base">{selectedEnrollment.form_data?.lider_pg || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Inscrição */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3" style={{ color: 'rgb(165, 44, 240)' }}>
                      Pagamento
                    </h3>
                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                      <div>
                        <label className="text-xs sm:text-sm text-gray-600">Produto</label>
                        <p className="font-medium text-sm sm:text-base">{selectedEnrollment.product?.name || '-'}</p>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm text-gray-600">Lote</label>
                        <p className="font-medium text-sm sm:text-base">{selectedEnrollment.batch?.name || '-'}</p>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm text-gray-600">Método</label>
                        <p className="font-medium text-sm sm:text-base">
                          {selectedEnrollment.payment_method === 'PIX_CASH' && 'PIX'}
                          {selectedEnrollment.payment_method === 'PIX_INSTALLMENT' && 'PIX Parc.'}
                          {selectedEnrollment.payment_method === 'CREDIT_CARD' && 'Cartão'}
                          {!selectedEnrollment.payment_method && '-'}
                        </p>
                      </div>
                      {selectedEnrollment.payment_method === 'PIX_INSTALLMENT' && selectedEnrollment.payments ? (
                        <div>
                          <label className="text-xs sm:text-sm text-gray-600">Parcelas</label>
                          <p className="font-medium text-sm sm:text-base">
                            {selectedEnrollment.payments.filter((p: any) => p.status === 'CONFIRMED' || p.status === 'RECEIVED').length}/{selectedEnrollment.payments.length}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <label className="text-xs sm:text-sm text-gray-600">Parcelas</label>
                          <p className="font-medium text-sm sm:text-base">{selectedEnrollment.installments || 1}x</p>
                        </div>
                      )}
                      <div>
                        <label className="text-xs sm:text-sm text-gray-600">Total</label>
                        <p className="font-medium text-sm sm:text-base">R$ {selectedEnrollment.total_amount}</p>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm text-gray-600">Desconto</label>
                        <p className="font-medium text-sm sm:text-base">R$ {selectedEnrollment.discount_amount}</p>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm text-gray-600">Valor Final</label>
                        <p className="font-medium text-base sm:text-lg" style={{ color: 'rgb(165, 44, 240)' }}>
                          R$ {selectedEnrollment.final_amount}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm text-gray-600">Status</label>
                        <p className="font-medium text-sm sm:text-base">
                          {selectedEnrollment.status === 'PAID' ? '✓ Pago' : 
                           selectedEnrollment.status === 'PENDING_PAYMENT' ? '⏳ Pendente' : 
                           selectedEnrollment.status}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Observações */}
                  {selectedEnrollment.form_data?.observacoes && (
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3" style={{ color: 'rgb(165, 44, 240)' }}>
                        Observações
                      </h3>
                      <p className="text-sm sm:text-base text-gray-700">{selectedEnrollment.form_data.observacoes}</p>
                    </div>
                  )}

                  {/* Detalhes das Parcelas - PIX Parcelado */}
                  {selectedEnrollment.payment_method === 'PIX_INSTALLMENT' && selectedEnrollment.payments && selectedEnrollment.payments.length > 0 && (
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3" style={{ color: 'rgb(165, 44, 240)' }}>
                        Parcelas
                      </h3>
                      <div className="space-y-2">
                        {selectedEnrollment.payments.map((payment: any) => (
                          <div 
                            key={payment.id} 
                            className="flex items-center justify-between p-2 sm:p-3 rounded-lg border"
                            style={{
                              backgroundColor: payment.status === 'CONFIRMED' || payment.status === 'RECEIVED' 
                                ? 'rgba(34, 197, 94, 0.1)' 
                                : 'rgba(234, 179, 8, 0.1)',
                              borderColor: payment.status === 'CONFIRMED' || payment.status === 'RECEIVED'
                                ? 'rgba(34, 197, 94, 0.3)'
                                : 'rgba(234, 179, 8, 0.3)'
                            }}
                          >
                            <div>
                              <p className="font-medium text-sm sm:text-base">Parcela {payment.installment_number}</p>
                              <p className="text-xs sm:text-sm text-gray-600">
                                {new Date(payment.due_date).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-sm sm:text-base">R$ {payment.amount}</p>
                              <p className="text-xs sm:text-sm">
                                {payment.status === 'CONFIRMED' || payment.status === 'RECEIVED' ? (
                                  <span className="text-green-600 font-medium">✓ Paga</span>
                                ) : (
                                  <span className="text-yellow-600 font-medium">⏳ Pend.</span>
                                )}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Datas */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3" style={{ color: 'rgb(165, 44, 240)' }}>
                      Datas
                    </h3>
                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                      <div>
                        <label className="text-xs sm:text-sm text-gray-600">Inscrição</label>
                        <p className="font-medium text-sm sm:text-base">
                          {new Date(selectedEnrollment.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      {selectedEnrollment.paid_at && (
                        <div>
                          <label className="text-xs sm:text-sm text-gray-600">Pagamento</label>
                          <p className="font-medium text-sm sm:text-base">
                            {new Date(selectedEnrollment.paid_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 sm:mt-6 flex justify-end">
                  <button
                    onClick={() => setSelectedEnrollment(null)}
                    className="w-full sm:w-auto px-6 py-2 rounded-lg text-sm sm:text-base"
                    style={{ backgroundColor: 'rgb(165, 44, 240)', color: 'white' }}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
