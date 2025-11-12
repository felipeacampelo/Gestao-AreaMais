import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, FileText, Calendar, CreditCard, Check, Ticket, X } from 'lucide-react';
import { getProducts, getProduct, createEnrollment, getEnrollments, validateCoupon, type Product, type Enrollment } from '../services/api'; // getEnrollments used in handleSubmit
import ProgressSteps from '../components/ProgressSteps';

export default function Enrollment() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completedEnrollment, setCompletedEnrollment] = useState<Enrollment | null>(null);
  
  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const steps = [
    { number: 1, title: 'Dados Pessoais', description: 'Informações básicas' },
    { number: 2, title: 'Pagamento', description: 'Escolha a forma de pagamento' },
    { number: 3, title: 'Confirmação', description: 'Inscrição concluída' },
  ];
  
  const [formData, setFormData] = useState({
    nome_completo: '',
    email: '',
    telefone: '',
    data_nascimento: '',
    cpf: '',
    rg: '',
    cep: '',
    tamanho_camiseta: '',
    membro_batista_capital: '',
    igreja: '',
    lider_pg: '',
    observacoes: '',
  });

  useEffect(() => {
    loadProducts();
    checkCompletedEnrollment();
    checkExistingEnrollment();
  }, []);

  const checkExistingEnrollment = async () => {
    try {
      const enrollmentsResponse = await getEnrollments();
      const enrollmentsData = Array.isArray(enrollmentsResponse.data) 
        ? enrollmentsResponse.data 
        : (enrollmentsResponse.data as any).results || [];
      
      // Check if user has any active enrollment (PENDING_PAYMENT or PAID)
      const activeEnrollment = enrollmentsData.find(
        (enrollment: any) => enrollment.status === 'PENDING_PAYMENT' || enrollment.status === 'PAID'
      );
      
      if (activeEnrollment) {
        // Redirect to My Enrollments page
        setError('Você já possui uma inscrição. Redirecionando para suas inscrições...');
        setTimeout(() => navigate('/minhas-inscricoes'), 2000);
      }
    } catch (err) {
      console.error('Error checking existing enrollment:', err);
    }
  };

  const checkCompletedEnrollment = async () => {
    try {
      const enrollmentsResponse = await getEnrollments();
      // Find enrollment with paid status
      const paidEnrollment = enrollmentsResponse.data.find(
        (enrollment: any) => enrollment.status === 'PAID'
      );
      
      if (paidEnrollment) {
        setCompletedEnrollment(paidEnrollment);
      }
    } catch (err) {
      console.error('Error checking completed enrollment:', err);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await getProducts();
      const productsList = response.data.results || [];
      setProducts(productsList);
      if (productsList.length > 0) {
        // Buscar detalhes do primeiro produto para ter o active_batch
        const detailResponse = await getProduct(productsList[0].id);
        setSelectedProduct(detailResponse.data);
      }
    } catch (err: any) {
      console.error('Erro ao carregar produtos:', err);
      setError(err.response?.data?.detail || 'Erro ao carregar produtos. Verifique se o backend está rodando.');
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Digite um código de cupom');
      return;
    }

    if (!selectedProduct || !selectedProduct.active_batch) {
      setCouponError('Selecione um produto primeiro');
      return;
    }

    setValidatingCoupon(true);
    setCouponError('');

    try {
      const baseAmount = parseFloat(String(selectedProduct.active_batch.pix_price || selectedProduct.active_batch.price));
      
      const response = await validateCoupon({
        code: couponCode.trim().toUpperCase(),
        product_id: selectedProduct.id,
        amount: baseAmount
      });

      setCouponApplied(true);
      setCouponDiscount(response.data.discount_amount);
      setCouponError('');
    } catch (err: any) {
      setCouponError(err.response?.data?.error || 'Cupom inválido');
      setCouponApplied(false);
      setCouponDiscount(0);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponApplied(false);
    setCouponDiscount(0);
    setCouponError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!selectedProduct || !selectedProduct.active_batch) {
      setError('Nenhum produto disponível para inscrição');
      setLoading(false);
      return;
    }

    // Validate age (minimum 17 years)
    if (formData.data_nascimento) {
      const birthDate = new Date(formData.data_nascimento);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < 17) {
        setError('Você precisa ter no mínimo 17 anos para se inscrever.');
        setLoading(false);
        return;
      }
    }

    try {
      // Check if user already has an active enrollment for this product
      try {
        const enrollmentsResponse = await getEnrollments();
        const existingEnrollment = enrollmentsResponse.data.find(
          (enrollment: any) => 
            enrollment.product_name === selectedProduct.name &&
            enrollment.status !== 'CANCELLED'
        );
        
        if (existingEnrollment) {
          setError('Você já possui uma inscrição ativa para este produto. Cada pessoa pode fazer apenas uma inscrição.');
          setLoading(false);
          return;
        }
      } catch (err) {
        // If check fails, continue with creation (will be validated on backend)
        console.error('Error checking existing enrollments:', err);
      }

      const response = await createEnrollment({
        product_id: selectedProduct.id,
        batch_id: selectedProduct.active_batch.id,
        form_data: formData,
        coupon_code: couponApplied ? couponCode : undefined,
      });

      // Redirecionar para página de pagamento
      navigate(`/payment/${response.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.form_data?.[0] || 'Erro ao criar inscrição');
    } finally {
      setLoading(false);
    }
  };

  // Show completed enrollment page if payment is confirmed
  if (completedEnrollment) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
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

          <ProgressSteps currentStep={3} steps={steps} />

          <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
            <div className="text-center mb-8">
              <div 
                className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                style={{ backgroundColor: 'rgba(220, 253, 97, 0.2)' }}
              >
                <Check 
                  className="w-8 h-8"
                  style={{ color: 'rgb(210, 243, 67)' }}
                />
              </div>
              <h1 className="text-3xl font-bold mb-2">🎉 Inscrição Completa!</h1>
              <p className="text-gray-600">
                Sua inscrição foi confirmada com sucesso. Obrigado por se inscrever!
              </p>
            </div>

            <div 
              className="border rounded-lg p-6 mb-8"
              style={{
                backgroundColor: 'rgba(220, 253, 97, 0.1)',
                borderColor: 'rgb(220, 253, 97)'
              }}
            >
              <h3 className="font-semibold text-lg mb-4">Detalhes da Inscrição</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Produto:</span>
                  <span className="font-semibold">{completedEnrollment.product_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lote:</span>
                  <span className="font-semibold">{completedEnrollment.batch_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor:</span>
                  <span className="font-semibold">R$ {completedEnrollment.final_amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span 
                    className="font-semibold"
                    style={{ color: 'rgb(210, 243, 67)' }}
                  >
                    ✓ Pago
                  </span>
                </div>
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center mb-8 font-medium transition-colors"
          style={{ color: 'rgb(165, 44, 240)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(145, 24, 220)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(165, 44, 240)'}
        >
          <ArrowLeft className="w-5 h-5 mr-2" style={{ color: 'inherit' }} />
          Voltar
        </button>

        {/* Progress Steps */}
        <ProgressSteps currentStep={1} steps={steps} />

        <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
          <h1 className="text-3xl font-bold mb-2">Dados Pessoais</h1>
          <p className="text-gray-600 mb-8">
            Preencha seus dados para continuar com a inscrição
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Produto Selecionado */}
          {selectedProduct && (
            <div className="rounded-lg p-6 mb-8" style={{ backgroundColor: 'rgba(165, 44, 240, 0.05)', border: '1px solid rgba(165, 44, 240, 0.2)' }}>
              <h3 className="font-semibold text-lg mb-2">
                {selectedProduct.name}
              </h3>
              <p className="text-gray-700 mb-4">{selectedProduct.description}</p>
              
              {selectedProduct.active_batch && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Lote:</span>
                    <span className="font-semibold ml-2">
                      {selectedProduct.active_batch.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Valor:</span>
                    <span className="font-semibold ml-2">
                      R$ {selectedProduct.active_batch.price}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">PIX à vista:</span>
                    <span className="font-semibold ml-2" style={{ color: 'rgba(0, 0, 0, 1)' }}>
                      R$ {selectedProduct.active_batch.pix_price.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={formData.nome_completo}
                onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple focus:border-transparent text-gray-900 bg-white"
                placeholder="Seu nome completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple focus:border-transparent text-gray-900 bg-white"
                placeholder="seu@email.com"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Telefone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple focus:border-transparent text-gray-900 bg-white"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  required
                  value={formData.data_nascimento}
                  onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 17)).toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple focus:border-transparent text-gray-900 bg-white"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  CPF *
                </label>
                <input
                  type="text"
                  required
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple focus:border-transparent text-gray-900 bg-white"
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CreditCard className="w-4 h-4 inline mr-2" />
                  RG *
                </label>
                <input
                  type="text"
                  required
                  value={formData.rg}
                  onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple focus:border-transparent text-gray-900 bg-white"
                  placeholder="00.000.000-0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CEP *
              </label>
              <input
                type="text"
                required
                value={formData.cep}
                onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple focus:border-transparent text-gray-900 bg-white"
                placeholder="00000-000"
                maxLength={9}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tamanho da Camiseta *
              </label>
              <select
                required
                value={formData.tamanho_camiseta}
                onChange={(e) => setFormData({ ...formData, tamanho_camiseta: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple focus:border-transparent text-gray-900 bg-white"
              >
                <option value="">Selecione o tamanho...</option>
                <option value="PP">PP</option>
                <option value="P">P</option>
                <option value="M">M</option>
                <option value="G">G</option>
                <option value="GG">GG</option>
                <option value="XG">XG</option>
              </select>
            </div>
            
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(165, 44, 240)' }}>
              </h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Você é membro da Batista Capital? *
                </label>
                <select
                  required
                  value={formData.membro_batista_capital}
                  onChange={(e) => setFormData({ ...formData, membro_batista_capital: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="">Selecione...</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </div>

              {formData.membro_batista_capital === 'nao' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qual sua igreja? *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.igreja}
                    onChange={(e) => setFormData({ ...formData, igreja: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple focus:border-transparent text-gray-900 bg-white"
                    placeholder="Nome da sua igreja"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quem é seu líder de PG? *
                </label>
                <select
                  required
                  value={formData.lider_pg}
                  onChange={(e) => setFormData({ ...formData, lider_pg: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="">Selecione seu líder de PG...</option>
                  <option value="Cleber e Bruna">Cleber e Bruna</option>
                  <option value="Thalles">Thalles</option>
                  <option value="Matheus Vox">Matheus Vox</option>
                  <option value="Renan e Karol">Rennan e Karol</option>
                  <option value="Guigo e Ana Lu">Guigo e Ana Lu</option>
                  <option value="Lucas Luz e Liz">Lucas Luz e Liz</option>
                  <option value="Lucas Daniel e Gih Bia">Lucas Daniel e Gih Bia</option>
                  <option value="Lucas Cardoso e Manu Camargo">Lucas Cardoso e Manu Camargo</option>
                  <option value="Pedrão e Julia">Pedrão e Julia</option>
                  <option value="Não tenho PG">Não tenho PG</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações Adicionais (opcional)
              </label>
              <textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple focus:border-transparent text-gray-900 bg-white"
                placeholder="Restrições alimentares, necessidades especiais, etc..."
              />
            </div>

            {/* Cupom de Desconto */}
            <div className="border-t pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Ticket className="w-4 h-4 inline mr-2" />
                Tem um cupom de desconto?
              </label>
              
              {!couponApplied ? (
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Digite o código do cupom"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900 bg-white uppercase"
                    disabled={validatingCoupon}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={validatingCoupon || !couponCode.trim()}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {validatingCoupon ? 'Validando...' : 'Aplicar'}
                  </button>
                </div>
              ) : (
                <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">Cupom aplicado!</p>
                        <p className="text-sm text-green-700">
                          Código: <span className="font-mono font-bold">{couponCode}</span>
                        </p>
                        <p className="text-sm text-green-700">
                          Desconto: <span className="font-bold">R$ {couponDiscount.toFixed(2)}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                      title="Remover cupom"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
              
              {couponError && (
                <p className="mt-2 text-sm text-red-600">{couponError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processando...' : 'Continuar para Pagamento'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
