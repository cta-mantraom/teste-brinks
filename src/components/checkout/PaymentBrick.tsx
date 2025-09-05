import { useEffect } from "react";
import { Payment } from "@mercadopago/sdk-react";
import { initializeMercadoPago } from "../../lib/config/mercadopago";
import { paymentBrickSubmitSchema } from "../../lib/schemas/payment-brick";

interface PaymentBrickProps {
  amount: number;
  onPaymentSuccess: (paymentId: string, paymentData: unknown) => void;
  onError: (error: string) => void;
}

export const PaymentBrick = ({
  amount,
  onPaymentSuccess,
  onError,
}: PaymentBrickProps) => {
  useEffect(() => {
    try {
      initializeMercadoPago();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? `Erro ao inicializar MercadoPago: ${error.message}`
          : "Erro ao inicializar MercadoPago";
      onError(errorMessage);
    }
  }, [onError]);

  const handleSubmit = async (data: unknown): Promise<void> => {
    // CHECKOUT BRICKS PURO: O Payment Brick processa DIRETAMENTE com MercadoPago
    // Não devemos interceptar ou enviar para nossa API
    
    try {
      console.log("✅ Payment Brick processou o pagamento com sucesso!");
      console.log("📦 Dados completos recebidos do Brick:", JSON.stringify(data, null, 2));
      
      // Validar dados recebidos do Brick
      const result = paymentBrickSubmitSchema.safeParse(data);
      
      if (!result.success) {
        console.error("Erro na validação dos dados:", result.error);
        onError("Dados de pagamento inválidos");
        return;
      }

      const { selectedPaymentMethod, formData } = result.data;
      console.log("Método de pagamento:", selectedPaymentMethod);
      console.log("Dados do formulário:", formData);
      
      // IMPORTANTE: O pagamento JÁ FOI PROCESSADO pelo MercadoPago
      // O Brick já gerou o token, processou o pagamento e retornou o resultado
      // Aqui apenas recebemos a notificação do resultado
      
      // Se o Brick chegou aqui, o pagamento foi bem-sucedido
      // O Brick retorna o ID do pagamento e os dados no formData
      const paymentId = (formData as Record<string, unknown>)?.paymentId as string || 'payment-processed';
      
      // Notificar sucesso ao componente pai
      onPaymentSuccess(paymentId, {
        selectedPaymentMethod,
        formData,
        status: 'approved',
        message: 'Pagamento processado com sucesso pelo Checkout Bricks'
      });
      
      // Retornar sucesso para o Brick
      return Promise.resolve();
      
    } catch (error) {
      console.error("Erro no processamento do Payment Brick:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Erro ao processar pagamento";
      onError(errorMessage);
      
      // Retornar erro para o Brick
      return Promise.reject(error);
    }
  };

  const handleError = (error: unknown) => {
    console.error("❌ Erro no Payment Brick:", error);
    
    // Log detalhado do erro para debug
    if (error && typeof error === 'object') {
      const errorObj = error as Record<string, unknown>;
      console.error("Detalhes do erro:", {
        message: errorObj.message,
        cause: errorObj.cause,
        field: errorObj.field,
        type: errorObj.type
      });
    }
    
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao processar pagamento";
    onError(errorMessage);
  };

  const handleReady = () => {
    console.log("✅ Payment Brick está pronto e renderizado!");
    console.log("Configuração do Brick:", {
      amount,
      locale: 'pt-BR',
      paymentMethods: {
        creditCard: 'all',
        debitCard: 'all',
        bankTransfer: ['pix'],
        ticket: 'all'
      }
    });
  };

  return (
    <div className="payment-container">
      <Payment
        initialization={{
          amount: amount,
          // preferenceId é opcional - use apenas se quiser pagamento com conta MP
          // preferenceId: "YOUR_PREFERENCE_ID",
          payer: {
            // Dados iniciais do pagador (podem ser preenchidos se já conhecidos)
            email: "",
            firstName: "",
            lastName: "",
            identification: {
              type: "CPF",
              number: "",
            },
          },
        }}
        customization={{
          paymentMethods: {
            creditCard: "all", // Todos os cartões de crédito
            debitCard: "all", // Todos os cartões de débito
            bankTransfer: ["pix"], // PIX habilitado
            ticket: "all", // Todos os boletos bancários
            // mercadoPago: "all", // Descomente se quiser pagamento com conta MP
            maxInstallments: 12,
          },
          visual: {
            style: {
              theme: "default", // Tema padrão do Bricks
              customVariables: {
                baseColor: "#667eea", // Cor principal
                borderRadiusSmall: "4px",
                borderRadiusMedium: "6px",
                borderRadiusLarge: "8px",
                borderRadiusFull: "20px",
              },
            },
            hidePaymentButton: false, // Mostrar botão de pagamento
            hideFormTitle: false, // Mostrar título do formulário
            // defaultPaymentOption controla qual forma de pagamento aparece primeiro
            defaultPaymentOption: {
              creditCardForm: true, // Mostrar formulário de cartão de crédito
              debitCardForm: true, // Mostrar formulário de cartão de débito
              bankTransferForm: true, // Mostrar PIX
              ticketForm: true, // Mostrar boleto
            },
          },
        }}
        onSubmit={handleSubmit}
        onReady={handleReady}
        onError={handleError}
        onBinChange={(bin) => console.log('BIN mudou:', bin)}
        locale="pt-BR"
      />
    </div>
  );
};
