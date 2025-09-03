import { useEffect } from 'react'
import { Payment } from '@mercadopago/sdk-react'
import { initializeMercadoPago } from '../../lib/config/mercadopago'
import { usePayment } from '../../hooks/usePayment'
import type { PaymentFormData } from '../../lib/schemas/payment'

interface PaymentBrickProps {
  amount: number
  onPaymentSuccess: (paymentId: string, paymentData: unknown) => void
  onError: (error: string) => void
}

export const PaymentBrick = ({ amount, onPaymentSuccess, onError }: PaymentBrickProps) => {
  const { createPayment, loading } = usePayment()

  useEffect(() => {
    try {
      initializeMercadoPago()
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? `Erro ao inicializar MercadoPago: ${error.message}`
        : 'Erro ao inicializar MercadoPago'
      onError(errorMessage)
    }
  }, [onError])

  const handleSubmit = async (formData: unknown): Promise<void> => {
    try {
      const paymentData = formData as PaymentFormData
      const result = await createPayment({
        ...paymentData,
        transaction_amount: amount
      })

      if (result?.id) {
        onPaymentSuccess(String(result.id), result)
      } else {
        onError('Pagamento não foi processado')
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? `Erro ao processar pagamento: ${error.message}`
        : 'Erro ao processar pagamento'
      onError(errorMessage)
    }
  }

  if (loading) {
    return (
      <div className="payment-loading">
        <p>Processando pagamento...</p>
      </div>
    )
  }

  return (
    <div className="payment-container">
      <Payment
        initialization={{
          amount: amount,
          payer: {
            email: ''
          }
        }}
        customization={{
          paymentMethods: {
            creditCard: 'all',
            debitCard: 'all',
            bankTransfer: ['pix']
          },
          visual: {
            style: {
              theme: 'default'
            }
          }
        }}
        onSubmit={handleSubmit}
        onReady={() => console.log('Payment Brick carregado')}
        onError={(error) => onError(error.message)}
      />
    </div>
  )
}