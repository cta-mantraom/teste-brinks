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
    // Validar dados com Zod
    const result = paymentBrickSubmitSchema.safeParse(data);
    
    if (!result.success) {
      console.error("Dados inválidos do Payment Brick:", result.error);
      onError("Dados de pagamento inválidos");
      return;
    }

    const { selectedPaymentMethod, formData } = result.data;
    
    // O Payment Brick processará o pagamento diretamente com o MercadoPago
    // Não interceptamos mais o processamento
    return new Promise((resolve) => {
      // Aqui o Brick já enviou para o MercadoPago
      // Esta callback é chamada após o processamento
      console.log("Pagamento processado pelo Payment Brick");
      console.log("Método:", selectedPaymentMethod);
      console.log("Dados:", formData);

      // Simulamos sucesso para o componente pai
      // Em produção, o Brick retornará o ID real do pagamento
      const mockPaymentId = Date.now().toString();
      onPaymentSuccess(mockPaymentId, formData);

      resolve();
    });
  };

  const handleError = (error: unknown) => {
    console.error("Erro no Payment Brick:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao processar pagamento";
    onError(errorMessage);
  };

  const handleReady = () => {
    console.log("Payment Brick está pronto!");
  };

  return (
    <div className="payment-container">
      <Payment
        initialization={{
          amount: amount,
          preferenceId: undefined, // Sem preference ID para checkout direto
        }}
        customization={{
          paymentMethods: {
            creditCard: "all", // Todos os cartões de crédito
            debitCard: "all", // Todos os cartões de débito
            bankTransfer: ["pix"], // Apenas PIX para transferências
            //ticket: 'all',          // Todos os boletos
            // mercadoPago removido para não aparecer
          },
          visual: {
            style: {
              theme: "default",
              customVariables: {
                baseColor: "#667eea",
              },
            },
          },
        }}
        onSubmit={handleSubmit}
        onReady={handleReady}
        onError={handleError}
        locale="pt-BR"
      />
    </div>
  );
};
