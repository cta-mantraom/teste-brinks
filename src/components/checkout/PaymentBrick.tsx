import { useEffect } from "react";
import { Payment } from "@mercadopago/sdk-react";
import { initializeMercadoPago } from "../../lib/config/mercadopago";

interface PaymentBrickProps {
  amount: number;
  userData?: {
    firstName: string;
    lastName: string;
    email: string;
    cpf: string;
    phone: string;
  };
  onPaymentSuccess: (paymentId: string, paymentData: unknown) => void;
  onError: (error: string) => void;
}

export const PaymentBrick = ({
  amount,
  userData,
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
    try {
      console.log("✅ Payment Brick processou o pagamento!");
      console.log("📦 Dados recebidos:", JSON.stringify(data, null, 2));
      
      // Extrair dados do Brick
      const brickData = data as Record<string, unknown>;
      const formData = brickData.formData as Record<string, unknown>;
      
      // Mapear payment_method_id corretamente
      let paymentMethodId = formData?.payment_method_id as string;
      
      // Corrigir mapeamento: bank_transfer (PIX) -> pix
      if (brickData.paymentType === 'bank_transfer' || paymentMethodId === 'pix') {
        paymentMethodId = 'pix';
      } else if (brickData.paymentType === 'credit_card') {
        paymentMethodId = 'credit_card';
      } else if (brickData.paymentType === 'debit_card') {
        paymentMethodId = 'debit_card';
      }
      
      // Preparar dados para enviar ao backend
      const paymentPayload = {
        transaction_amount: amount,
        payment_method_id: paymentMethodId, // Usar valores corretos: pix, credit_card, debit_card
        payer: {
          email: userData?.email || (formData?.payer as Record<string, unknown>)?.email || '',
          first_name: userData?.firstName || '',
          last_name: userData?.lastName || '',
          identification: {
            type: 'CPF',
            number: userData?.cpf.replace(/\D/g, '') || ''
          },
          phone: {
            area_code: userData?.phone.replace(/\D/g, '').slice(0, 2) || '',
            number: userData?.phone.replace(/\D/g, '').slice(2) || ''
          }
        },
        description: 'Checkout Brinks',
        installments: (formData?.installments as number) || 1
      };

      console.log("🚀 Enviando pagamento para processar:", paymentPayload);

      // Enviar para nossa API processar o pagamento
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
      console.log("✅ Pagamento criado com sucesso:", paymentResult);
      console.log("🆔 ID do pagamento MercadoPago:", paymentResult.id);
      
      // Para PIX, verificar se temos os dados do QR Code
      if (paymentMethodId === 'pix' && paymentResult.point_of_interaction) {
        console.log("📱 Dados PIX recebidos:", {
          hasQrCode: !!paymentResult.point_of_interaction?.transaction_data?.qr_code,
          hasQrCodeBase64: !!paymentResult.point_of_interaction?.transaction_data?.qr_code_base64
        });
      }
      
      // Notificar sucesso com ID real do pagamento
      onPaymentSuccess(paymentResult.id.toString(), paymentResult);
      
      return Promise.resolve();
      
    } catch (error) {
      console.error("❌ Erro ao processar pagamento:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Erro ao processar pagamento";
      onError(errorMessage);
      
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
    console.log("Configuração:", {
      amount,
      locale: 'pt-BR',
      methods: 'pix, credit_card, debit_card'
    });
  };

  return (
    <div className="payment-container">
      <Payment
        initialization={{
          amount: amount,
          // preferenceId é opcional - use apenas se quiser pagamento com conta MP
          // preferenceId: "YOUR_PREFERENCE_ID",
          payer: userData ? {
            // Pré-preencher com dados do usuário coletados no formulário
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            identification: {
              type: "CPF",
              number: userData.cpf.replace(/\D/g, ''), // Remove formatação do CPF
            },
          } : {
            // Campos vazios se não houver dados do usuário
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
            creditCard: "all", // Cartões de crédito
            debitCard: "all", // Cartões de débito
            bankTransfer: ["pix"], // PIX
            // ticket: "all", // Desabilitado por enquanto
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
