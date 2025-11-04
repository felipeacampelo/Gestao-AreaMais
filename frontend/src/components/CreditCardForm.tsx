import { useState } from 'react';
import { CreditCard, Lock } from 'lucide-react';

interface CreditCardFormProps {
  onSubmit: (cardData: CardData) => void;
  loading: boolean;
}

export interface CardData {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export default function CreditCardForm({ onSubmit, loading }: CreditCardFormProps) {
  const [cardData, setCardData] = useState<CardData>({
    holderName: '',
    number: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: '',
  });

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, '');
    if (value.length <= 16 && /^\d*$/.test(value)) {
      setCardData({ ...cardData, number: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(cardData);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => currentYear + i);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-white mb-6">
        <div className="flex justify-between items-start mb-8">
          <CreditCard className="w-12 h-12" />
          <div className="text-right text-sm opacity-80">
            <div>Cartão de Crédito</div>
            <div className="flex items-center gap-1 mt-1">
              <Lock className="w-3 h-3" />
              Seguro
            </div>
          </div>
        </div>
        
        <div className="font-mono text-xl tracking-wider mb-4">
          {formatCardNumber(cardData.number) || '•••• •••• •••• ••••'}
        </div>
        
        <div className="flex justify-between items-end">
          <div>
            <div className="text-xs opacity-70 mb-1">Titular</div>
            <div className="font-semibold">
              {cardData.holderName || 'NOME NO CARTÃO'}
            </div>
          </div>
          <div>
            <div className="text-xs opacity-70 mb-1">Validade</div>
            <div className="font-semibold">
              {cardData.expiryMonth && cardData.expiryYear
                ? `${cardData.expiryMonth}/${cardData.expiryYear.slice(-2)}`
                : 'MM/AA'}
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Número do Cartão *
        </label>
        <input
          type="text"
          required
          value={formatCardNumber(cardData.number)}
          onChange={handleCardNumberChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
          placeholder="1234 5678 9012 3456"
          maxLength={19}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nome no Cartão *
        </label>
        <input
          type="text"
          required
          value={cardData.holderName}
          onChange={(e) => setCardData({ ...cardData, holderName: e.target.value.toUpperCase() })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
          placeholder="NOME COMO ESTÁ NO CARTÃO"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mês *
          </label>
          <select
            required
            value={cardData.expiryMonth}
            onChange={(e) => setCardData({ ...cardData, expiryMonth: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
          >
            <option value="">MM</option>
            {Array.from({ length: 12 }, (_, i) => {
              const month = (i + 1).toString().padStart(2, '0');
              return (
                <option key={month} value={month}>
                  {month}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ano *
          </label>
          <select
            required
            value={cardData.expiryYear}
            onChange={(e) => setCardData({ ...cardData, expiryYear: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
          >
            <option value="">AAAA</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CVV *
          </label>
          <input
            type="text"
            required
            value={cardData.ccv}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= 4 && /^\d*$/.test(value)) {
                setCardData({ ...cardData, ccv: value });
              }
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            placeholder="123"
            maxLength={4}
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-700">
          <strong>Pagamento Seguro:</strong> Seus dados são criptografados e processados com segurança pelo Asaas.
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Processando...' : 'Confirmar Pagamento'}
      </button>
    </form>
  );
}
