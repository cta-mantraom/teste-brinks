import { useState, useEffect } from 'react'
import { Payment } from '@mercadopago/sdk-react'
import { initializeMercadoPago } from '../../lib/config/mercadopago'
import { usePayment } from '../../hooks/usePayment'
import type { PaymentFormData, Payer } from '../../lib/schemas/payment'

interface PaymentBrickProps {
  amount: number
  onPaymentSuccess: (paymentId: string, paymentData: unknown) => void
  onError: (error: string) => void
}

export const PaymentBrick = ({ amount, onPaymentSuccess, onError }: PaymentBrickProps) => {
  const { createPayment, loading } = usePayment()
  const [showPaymentBrick, setShowPaymentBrick] = useState(false)
  const [payerInfo, setPayerInfo] = useState<Payer>({
    first_name: '',
    last_name: '',
    email: '',
    identification: {
      type: 'CPF',
      number: ''
    },
    phone: {
      area_code: '',
      number: ''
    }
  })

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
      // Add payer info to the payment data
      const enhancedFormData = {
        ...(formData as Record<string, unknown>),
        payer: {
          first_name: payerInfo.first_name,
          last_name: payerInfo.last_name,
          email: payerInfo.email,
          identification: payerInfo.identification,
          phone: payerInfo.phone
        }
      }
      
      const paymentData = enhancedFormData as PaymentFormData
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

  const handlePayerSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Validate payer info
    if (!payerInfo.first_name || !payerInfo.last_name || !payerInfo.email || 
        !payerInfo.identification.number || !payerInfo.phone.area_code || 
        !payerInfo.phone.number) {
      onError('Por favor, preencha todos os campos')
      return
    }
    setShowPaymentBrick(true)
  }

  if (loading) {
    return (
      <div className="payment-loading">
        <p>Processando pagamento...</p>
      </div>
    )
  }

  // Show payer form first
  if (!showPaymentBrick) {
    return (
      <div className="payer-form-container">
        <h3>Informações do Comprador</h3>
        <form onSubmit={handlePayerSubmit} className="payer-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">Nome</label>
              <input
                type="text"
                id="first_name"
                value={payerInfo.first_name}
                onChange={(e) => setPayerInfo({...payerInfo, first_name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="last_name">Sobrenome</label>
              <input
                type="text"
                id="last_name"
                value={payerInfo.last_name}
                onChange={(e) => setPayerInfo({...payerInfo, last_name: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              value={payerInfo.email}
              onChange={(e) => setPayerInfo({...payerInfo, email: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="cpf">CPF</label>
            <input
              type="text"
              id="cpf"
              value={payerInfo.identification.number}
              onChange={(e) => setPayerInfo({
                ...payerInfo, 
                identification: {...payerInfo.identification, number: e.target.value.replace(/\D/g, '')}
              })}
              placeholder="00000000000"
              maxLength={11}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group" style={{width: '30%'}}>
              <label htmlFor="phone_area">DDD</label>
              <input
                type="text"
                id="phone_area"
                value={payerInfo.phone.area_code}
                onChange={(e) => setPayerInfo({
                  ...payerInfo,
                  phone: {...payerInfo.phone, area_code: e.target.value.replace(/\D/g, '')}
                })}
                placeholder="11"
                maxLength={2}
                required
              />
            </div>
            <div className="form-group" style={{width: '70%'}}>
              <label htmlFor="phone_number">Telefone</label>
              <input
                type="text"
                id="phone_number"
                value={payerInfo.phone.number}
                onChange={(e) => setPayerInfo({
                  ...payerInfo,
                  phone: {...payerInfo.phone, number: e.target.value.replace(/\D/g, '')}
                })}
                placeholder="999999999"
                maxLength={9}
                required
              />
            </div>
          </div>

          <button type="submit" className="submit-button">
            Continuar para Pagamento
          </button>
        </form>
      </div>
    )
  }

  // Show payment brick after payer info is collected
  return (
    <div className="payment-container">
      <Payment
        initialization={{
          amount: amount,
          payer: {
            firstName: payerInfo.first_name,
            lastName: payerInfo.last_name,
            email: payerInfo.email,
            identification: {
              type: payerInfo.identification.type,
              number: payerInfo.identification.number
            }
          }
        }}
        customization={{
          paymentMethods: {
            creditCard: 'all',      // Habilita todos os cartões de crédito
            bankTransfer: ['pix']   // Habilita apenas PIX para transferências
            // Não incluir debitCard, ticket e mercadoPago os desabilita
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
      <button 
        onClick={() => setShowPaymentBrick(false)} 
        className="back-button"
      >
        Voltar
      </button>
    </div>
  )
}