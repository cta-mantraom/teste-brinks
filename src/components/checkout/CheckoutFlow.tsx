import { useState } from 'react'
import { PaymentBrick } from './PaymentBrick'
import { PaymentStatusScreen } from './StatusScreen'
import type { PixPaymentResponse } from '../../lib/schemas/payment'

interface CheckoutFlowProps {
  amount: number
}

type CheckoutStep = 'payment' | 'status' | 'error'

export const CheckoutFlow = ({ amount }: CheckoutFlowProps) => {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('payment')
  const [paymentId, setPaymentId] = useState<string>('')
  const [paymentData, setPaymentData] = useState<PixPaymentResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handlePaymentSuccess = (id: string, data: unknown) => {
    setPaymentId(id)
    setPaymentData(data as PixPaymentResponse)
    setCurrentStep('status')
    setError(null)
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
    setCurrentStep('error')
  }

  const resetCheckout = () => {
    setCurrentStep('payment')
    setPaymentId('')
    setPaymentData(null)
    setError(null)
  }

  return (
    <div className="checkout-flow">
      <div className="checkout-header">
        <h1>Checkout - Brinks</h1>
        <p className="amount">Valor: R$ {amount.toFixed(2)}</p>
      </div>

      {currentStep === 'payment' && (
        <PaymentBrick
          amount={amount}
          onPaymentSuccess={handlePaymentSuccess}
          onError={handleError}
        />
      )}

      {currentStep === 'status' && paymentId && (
        <div className="status-wrapper">
          <PaymentStatusScreen
            paymentId={paymentId}
            paymentData={paymentData || undefined}
          />
          <button 
            onClick={resetCheckout}
            className="new-payment-button"
          >
            Fazer novo pagamento
          </button>
        </div>
      )}

      {currentStep === 'error' && (
        <div className="error-container">
          <h2>Erro no Pagamento</h2>
          <p className="error-message">{error}</p>
          <button 
            onClick={resetCheckout}
            className="retry-button"
          >
            Tentar Novamente
          </button>
        </div>
      )}
    </div>
  )
}