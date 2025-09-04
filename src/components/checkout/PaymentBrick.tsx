import { useEffect } from "react";
import { Payment } from "@mercadopago/sdk-react";
import { initializeMercadoPago } from "../../lib/config/mercadopago";
import { paymentBrickSubmitSchema, type PaymentBrickFormData } from "../../lib/schemas/payment-brick";

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
    
    try {
      console.log("Pagamento processado pelo Payment Brick");
      console.log("Método:", selectedPaymentMethod);
      console.log("Dados:", formData);

      // Mapear dados do Brick para o formato esperado pelo backend
      // Usar dados do formData com validação de tipos
      const typedFormData = formData as PaymentBrickFormData | undefined;
      
      const paymentPayload = {
        transaction_amount: amount,
        payment_method_id: selectedPaymentMethod || 'pix',
        payer: typedFormData?.payer || {
          email: typedFormData?.email || '',
          first_name: typedFormData?.first_name || '',
          last_name: typedFormData?.last_name || '',
          identification: {
            type: 'CPF',
            number: typedFormData?.identification?.number || ''
          },
          phone: {
            area_code: typedFormData?.phone?.area_code || '',
            number: typedFormData?.phone?.number || ''
          }
        },
        description: 'Checkout Brinks',
        installments: typedFormData?.installments || 1
      };

      // Envia dados para nosso backend processar
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao processar pagamento");
      }

      const paymentResult = await response.json();
      
      // Retorna os dados do pagamento real do MercadoPago
      onPaymentSuccess(paymentResult.id.toString(), paymentResult);
      
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Erro ao processar pagamento";
      onError(errorMessage);
    }
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
          payer: {
            email: "",
          },
        }}
        customization={{
          paymentMethods: {
            creditCard: "all", // Todos os cartões de crédito
            debitCard: "all", // Todos os cartões de débito
            bankTransfer: ["pix"], // Apenas PIX para transferências
            //ticket: 'all',          // Todos os boletos
            // mercadoPago removido para não aparecer
            maxInstallments: 12,
          },
          visual: {
            style: {
              theme: "default",
              customVariables: {
                baseColor: "#667eea",
              },
            },
            hidePaymentButton: false, // Mostrar o botão de pagamento
            hideFormTitle: false,
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
