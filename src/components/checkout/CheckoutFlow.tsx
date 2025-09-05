import { useState } from 'react'
import { UserDataForm, type UserData } from './UserDataForm'
import { PaymentBrick } from './PaymentBrick'
import { PaymentStatusScreen } from './StatusScreen'

interface CheckoutFlowProps {
  amount: number
}

type CheckoutStep = 'user-data' | 'payment' | 'status' | 'error'

export const CheckoutFlow = ({ amount }: CheckoutFlowProps) => {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('user-data')
  const [userData, setUserData] = useState<UserData | null>(null)
  const [paymentId, setPaymentId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const handleUserDataSubmit = (data: UserData) => {
    setUserData(data)
    setCurrentStep('payment')
    console.log('Dados do usuário coletados:', data)
  }

  const handlePaymentSuccess = (id: string, data: unknown) => {
    console.log('Pagamento bem-sucedido! ID:', id)
    console.log('Dados do pagamento:', data)
    setPaymentId(id)
    setCurrentStep('status')
    setError(null)
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
    setCurrentStep('error')
  }

  const resetCheckout = () => {
    setCurrentStep('user-data')
    setUserData(null)
    setPaymentId('')
    setError(null)
  }

  return (
    <div className="checkout-flow">
      <div className="checkout-header">
        <h1>Checkout - Brinks</h1>
        {currentStep !== 'user-data' && (
          <p className="amount">Valor: R$ {amount.toFixed(2)}</p>
        )}
        {userData && currentStep === 'payment' && (
          <div className="user-info">
            <p>Cliente: {userData.firstName} {userData.lastName}</p>
            <p>Email: {userData.email}</p>
          </div>
        )}
      </div>

      {currentStep === 'user-data' && (
        <UserDataForm
          amount={amount}
          onSubmit={handleUserDataSubmit}
        />
      )}

      {currentStep === 'payment' && userData && (
        <PaymentBrick
          amount={amount}
          userData={userData}
          onPaymentSuccess={handlePaymentSuccess}
          onError={handleError}
        />
      )}

      {currentStep === 'status' && paymentId && (
        <PaymentStatusScreen
          paymentId={paymentId}
          onReset={resetCheckout}
        />
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