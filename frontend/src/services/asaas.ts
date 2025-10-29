// Declaração do tipo global do Asaas
declare global {
  interface Window {
    Asaas: any;
  }
}

export interface CardData {
  number: string;
  holderName: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export class AsaasService {
  private asaas: any;

  constructor() {
    // Aguardar o carregamento do SDK
    this.initAsaas();
  }

  private initAsaas() {
    // Verificar se o SDK está disponível
    if (typeof window !== 'undefined' && window.Asaas) {
      try {
        // Para sandbox, não precisa de chave
        this.asaas = window.Asaas;
        console.log('Asaas SDK inicializado com sucesso');
      } catch (error) {
        console.error('Erro ao inicializar Asaas:', error);
      }
    } else {
      console.warn('window.Asaas não está disponível ainda');
    }
  }

  private waitForAsaas(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.asaas) {
        resolve();
        return;
      }

      let attempts = 0;
      const maxAttempts = 20; // 2 segundos
      
      const interval = setInterval(() => {
        attempts++;
        
        if (typeof window !== 'undefined' && window.Asaas) {
          this.initAsaas();
          if (this.asaas) {
            clearInterval(interval);
            resolve();
            return;
          }
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          reject(new Error('Timeout ao carregar SDK do Asaas. Tente recarregar a página.'));
        }
      }, 100);
    });
  }

  async tokenizeCard(cardData: CardData): Promise<string> {
    try {
      // Aguardar SDK estar disponível
      await this.waitForAsaas();
      
      if (!this.asaas) {
        // Fallback: retornar erro informativo
        throw new Error(
          'SDK do Asaas não disponível. ' +
          'Para pagamento com cartão, use PIX como alternativa. ' +
          'Em produção, configure a chave pública do Asaas.'
        );
      }

      // Remover espaços do número do cartão
      const cleanNumber = cardData.number.replace(/\s/g, '');

      const tokenData = {
        number: cleanNumber,
        holderName: cardData.holderName,
        expiryMonth: cardData.expiryMonth,
        expiryYear: cardData.expiryYear,
        ccv: cardData.ccv,
      };

      // Tokenizar o cartão
      const response = await this.asaas.tokenizeCard(tokenData);
      
      if (response.error) {
        throw new Error(response.error.description || 'Erro ao tokenizar cartão');
      }

      return response.creditCardToken;
    } catch (error: any) {
      console.error('Erro ao tokenizar cartão:', error);
      throw new Error(
        error.message || 
        'Erro ao processar cartão. Use PIX como alternativa.'
      );
    }
  }
}

export default new AsaasService();
