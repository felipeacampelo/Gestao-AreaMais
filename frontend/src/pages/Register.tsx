import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Phone, FileText, AlertCircle } from 'lucide-react';
import { register as apiRegister } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    phone: '',
    cpf: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.password2) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    try {
      const response = await apiRegister(formData);
      
      // Save to auth context
      authLogin(response.data.user, response.data.token);
      
      // Redirect to home
      navigate('/');
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData) {
        const errorMessage = Object.entries(errorData)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        setError(errorMessage);
      } else {
        setError('Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: 'rgb(165, 44, 240)' }}>
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'rgb(220, 253, 97)' }}>
            Crie sua conta
          </h1>
          <p className="text-gray-300">
            Preencha os dados abaixo para começar
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Nome *
                </label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white"
                  style={{ outline: 'none' }}
                  onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px rgb(165, 44, 240)'}
                  onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                  placeholder="João"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sobrenome *
                </label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white"
                  style={{ outline: 'none' }}
                  onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px rgb(165, 44, 240)'}
                  onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                  placeholder="Silva"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="seu@email.com"
              />
            </div>

            {/* Telefone e CPF */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white"
                  style={{ outline: 'none' }}
                  onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px rgb(165, 44, 240)'}
                  onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  CPF
                </label>
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white"
                  style={{ outline: 'none' }}
                  onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px rgb(165, 44, 240)'}
                  onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>
            </div>

            {/* Senhas */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Senha *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white"
                  style={{ outline: 'none' }}
                  onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px rgb(165, 44, 240)'}
                  onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                  placeholder="••••••••"
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Senha *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password2}
                  onChange={(e) => setFormData({ ...formData, password2: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white"
                  style={{ outline: 'none' }}
                  onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px rgb(165, 44, 240)'}
                  onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                  placeholder="••••••••"
                  minLength={8}
                />
              </div>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                required
                className="w-4 h-4 border-gray-300 rounded mt-1"
                style={{ accentColor: 'rgb(165, 44, 240)' }}
              />
              <label className="ml-2 text-sm text-gray-600">
                Eu concordo com os{' '}
                <Link to="/terms" className="font-medium" style={{ color: 'rgb(165, 44, 240)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(145, 24, 220)'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(165, 44, 240)'}>
                  Termos de Uso
                </Link>{' '}
                e{' '}
                <Link to="/privacy" className="font-medium" style={{ color: 'rgb(165, 44, 240)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(145, 24, 220)'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(165, 44, 240)'}>
                  Política de Privacidade
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{' '}
              <Link
                to="/login"
                className="font-medium"
                style={{ color: 'rgb(165, 44, 240)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(145, 24, 220)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(165, 44, 240)'}
              >
                Faça login
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-sm"
            style={{ color: 'rgb(220, 253, 97)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(210, 243, 67)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(220, 253, 97)'}
          >
            ← Voltar para início
          </Link>
        </div>
      </div>
    </div>
  );
}
