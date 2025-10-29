import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  DollarSign, 
  FileText, 
  TrendingUp,
  CheckCircle,
  Clock,
  ArrowLeft,
  Search,
  Filter,
  Download,
  Eye,
  Settings
} from 'lucide-react';
import { getAdminDashboard, getAdminEnrollments } from '../services/api';

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
  };
  payment_methods: Array<{
    payment_method: string;
    count: number;
  }>;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, enrollmentsRes] = await Promise.all([
        getAdminDashboard(),
        getAdminEnrollments()
      ]);
      setStats(statsRes.data);
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
    const headers = ['ID', 'Nome', 'Email', 'Telefone', 'CPF', 'Produto', 'Status', 'Valor', 'Data'];
    const rows = enrollments.map(e => [
      e.id,
      e.form_data?.nome_completo || '',
      e.user_email,
      e.form_data?.telefone || '',
      e.form_data?.cpf || '',
      e.product?.name || '',
      e.status,
      `R$ ${e.final_amount}`,
      new Date(e.created_at).toLocaleDateString('pt-BR')
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 font-medium"
              style={{ color: 'rgb(165, 44, 240)' }}
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </button>
            <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
            <a
              href="http://localhost:8000/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: 'rgb(165, 44, 240)', color: 'white' }}
            >
              <Settings className="w-4 h-4" />
              Admin Django
            </a>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Inscrições */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(165, 44, 240, 0.1)' }}>
                  <Users className="w-6 h-6" style={{ color: 'rgb(165, 44, 240)' }} />
                </div>
                <span className="text-sm text-gray-500">+{stats.enrollments.recent} esta semana</span>
              </div>
              <h3 className="text-2xl font-bold mb-1">{stats.enrollments.total}</h3>
              <p className="text-gray-600">Total de Inscrições</p>
              <div className="mt-4 flex gap-4 text-sm">
                <span className="text-green-600">✓ {stats.enrollments.confirmed} confirmadas</span>
                <span className="text-yellow-600">⏳ {stats.enrollments.pending} pendentes</span>
              </div>
            </div>

            {/* Pagamentos */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(220, 253, 97, 0.2)' }}>
                  <CheckCircle className="w-6 h-6" style={{ color: 'rgb(210, 243, 67)' }} />
                </div>
                <span className="text-sm text-gray-500">+{stats.payments.recent} esta semana</span>
              </div>
              <h3 className="text-2xl font-bold mb-1">{stats.payments.confirmed}</h3>
              <p className="text-gray-600">Pagamentos Confirmados</p>
              <div className="mt-4 text-sm text-gray-500">
                {stats.payments.pending} aguardando confirmação
              </div>
            </div>

            {/* Receita Total */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(165, 44, 240, 0.1)' }}>
                  <DollarSign className="w-6 h-6" style={{ color: 'rgb(165, 44, 240)' }} />
                </div>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-1">
                R$ {stats.revenue.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-gray-600">Receita Confirmada</p>
              <div className="mt-4 text-sm text-gray-500">
                R$ {stats.revenue.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} pendente
              </div>
            </div>

            {/* Métodos de Pagamento */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(220, 253, 97, 0.2)' }}>
                  <FileText className="w-6 h-6" style={{ color: 'rgb(210, 243, 67)' }} />
                </div>
              </div>
              <h3 className="text-lg font-bold mb-3">Métodos de Pagamento</h3>
              <div className="space-y-2">
                {stats.payment_methods.map((method) => (
                  <div key={method.payment_method} className="flex justify-between text-sm">
                    <span className="text-gray-600">{method.payment_method}</span>
                    <span className="font-semibold">{method.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Inscrições List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Inscrições</h2>
            
            {/* Filters */}
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome, email, CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple"
                  style={{ width: '300px' }}
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple"
              >
                <option value="">Todos os status</option>
                <option value="PENDING_PAYMENT">Pendente</option>
                <option value="PAID">Pago</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
              
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple"
              >
                <option value="">Todas as formas</option>
                <option value="PIX_CASH">PIX à Vista</option>
                <option value="PIX_INSTALLMENT">PIX Parcelado</option>
                <option value="CREDIT_CARD">Cartão de Crédito</option>
              </select>
              
              <button
                onClick={handleSearch}
                className="btn-primary flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filtrar
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">ID</th>
                  <th className="text-left py-3 px-4 font-semibold">Nome</th>
                  <th className="text-left py-3 px-4 font-semibold">Email</th>
                  <th className="text-left py-3 px-4 font-semibold">Telefone</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Parcelas</th>
                  <th className="text-left py-3 px-4 font-semibold">Valor</th>
                  <th className="text-left py-3 px-4 font-semibold">Data</th>
                  <th className="text-left py-3 px-4 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">#{enrollment.id}</td>
                    <td className="py-3 px-4 font-medium">{enrollment.form_data?.nome_completo || '-'}</td>
                    <td className="py-3 px-4">{enrollment.user_email}</td>
                    <td className="py-3 px-4">{enrollment.form_data?.telefone || '-'}</td>
                    <td className="py-3 px-4">
                      <span
                        className="px-3 py-1 rounded-full text-sm font-medium"
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
                         enrollment.status === 'PENDING_PAYMENT' ? '⏳ Pendente' : 
                         enrollment.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {enrollment.payment_method === 'PIX_INSTALLMENT' ? (
                        <span className="text-sm">
                          {enrollment.payments?.filter((p: any) => p.status === 'RECEIVED' || p.status === 'CONFIRMED').length || 0}/{enrollment.installments}
                          <span className="text-gray-500 ml-1">pagas</span>
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium">R$ {enrollment.final_amount}</td>
                    <td className="py-3 px-4">
                      {new Date(enrollment.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedEnrollment(enrollment)}
                        className="flex items-center gap-1 px-3 py-1 text-sm rounded-lg transition-colors"
                        style={{ 
                          backgroundColor: 'rgba(165, 44, 240, 0.1)',
                          color: 'rgb(165, 44, 240)'
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        Ver
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Detalhes da Inscrição #{selectedEnrollment.id}</h2>
                  <button
                    onClick={() => setSelectedEnrollment(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Dados Pessoais */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'rgb(165, 44, 240)' }}>
                      Dados Pessoais
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600">Nome Completo</label>
                        <p className="font-medium">{selectedEnrollment.form_data?.nome_completo || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Email</label>
                        <p className="font-medium">{selectedEnrollment.user_email}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Telefone</label>
                        <p className="font-medium">{selectedEnrollment.form_data?.telefone || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Data de Nascimento</label>
                        <p className="font-medium">{selectedEnrollment.form_data?.data_nascimento || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">CPF</label>
                        <p className="font-medium">{selectedEnrollment.form_data?.cpf || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">RG</label>
                        <p className="font-medium">{selectedEnrollment.form_data?.rg || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Inscrição */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'rgb(165, 44, 240)' }}>
                      Informações da Inscrição
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600">Produto</label>
                        <p className="font-medium">{selectedEnrollment.product?.name || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Lote</label>
                        <p className="font-medium">{selectedEnrollment.batch?.name || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Método de Pagamento</label>
                        <p className="font-medium">
                          {selectedEnrollment.payment_method === 'PIX_CASH' && 'PIX à Vista'}
                          {selectedEnrollment.payment_method === 'PIX_INSTALLMENT' && 'PIX Parcelado'}
                          {selectedEnrollment.payment_method === 'CREDIT_CARD' && 'Cartão de Crédito'}
                          {!selectedEnrollment.payment_method && '-'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Parcelas</label>
                        <p className="font-medium">{selectedEnrollment.installments || 1}x</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Valor Total</label>
                        <p className="font-medium">R$ {selectedEnrollment.total_amount}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Desconto</label>
                        <p className="font-medium">R$ {selectedEnrollment.discount_amount}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Valor Final</label>
                        <p className="font-medium text-lg" style={{ color: 'rgb(165, 44, 240)' }}>
                          R$ {selectedEnrollment.final_amount}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Status</label>
                        <p className="font-medium">
                          {selectedEnrollment.status === 'PAID' ? '✓ Pago' : 
                           selectedEnrollment.status === 'PENDING_PAYMENT' ? '⏳ Aguardando Pagamento' : 
                           selectedEnrollment.status}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Observações */}
                  {selectedEnrollment.form_data?.observacoes && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3" style={{ color: 'rgb(165, 44, 240)' }}>
                        Observações
                      </h3>
                      <p className="text-gray-700">{selectedEnrollment.form_data.observacoes}</p>
                    </div>
                  )}

                  {/* Datas */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'rgb(165, 44, 240)' }}>
                      Datas
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600">Data da Inscrição</label>
                        <p className="font-medium">
                          {new Date(selectedEnrollment.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      {selectedEnrollment.paid_at && (
                        <div>
                          <label className="text-sm text-gray-600">Data do Pagamento</label>
                          <p className="font-medium">
                            {new Date(selectedEnrollment.paid_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setSelectedEnrollment(null)}
                    className="px-6 py-2 rounded-lg"
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
