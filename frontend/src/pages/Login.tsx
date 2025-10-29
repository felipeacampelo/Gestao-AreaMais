import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { login as apiLogin } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login: authLogin } = useAuth();
  
  const from = (location.state as any)?.from || '/';
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiLogin(formData.email, formData.password);
      
      // Save to auth context
      authLogin(response.data.user, response.data.token);
      
      // Redirect to where user came from or home
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.non_field_errors?.[0] || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: 'rgb(165, 44, 240)' }}>
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'rgb(220, 253, 97)' }}>
            Bem-vindo de volta!
          </h1>
          <p className="text-gray-300">
            Entre com sua conta para continuar
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white"
                style={{ outline: 'none' }}
                onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px rgb(165, 44, 240)'}
                onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Senha
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
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 border-gray-300 rounded"
                  style={{ accentColor: 'rgb(165, 44, 240)' }}
                />
                <span className="ml-2 text-sm text-gray-600">Lembrar-me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium"
                style={{ color: 'rgb(165, 44, 240)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(145, 24, 220)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(165, 44, 240)'}
              >
                Esqueceu a senha?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Não tem uma conta?{' '}
              <Link
                to="/register"
                className="font-medium"
                style={{ color: 'rgb(165, 44, 240)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(145, 24, 220)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(165, 44, 240)'}
              >
                Cadastre-se
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
