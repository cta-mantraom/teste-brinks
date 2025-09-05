import { StatusScreen } from '@mercadopago/sdk-react'
import { useEffect } from 'react'
import './StatusScreen.css'

interface PaymentStatusScreenProps {
  paymentId: string
  onReset?: () => void
}

export const PaymentStatusScreen = ({ paymentId, onReset }: PaymentStatusScreenProps) => {
  useEffect(() => {
    console.log('🎯 Renderizando StatusScreen Brick do MercadoPago')
    console.log('Payment ID:', paymentId)
  }, [paymentId])

  const handleReady = () => {
    console.log('✅ StatusScreen Brick está pronto!')
    console.log('Para PIX, o QR Code aparecerá automaticamente')
  }

  const handleError = (error: unknown) => {
    console.error('❌ Erro no StatusScreen Brick:', error)
  }

  // Se não temos um ID real de pagamento, mostrar mensagem
  if (!paymentId || paymentId === 'payment-processed') {
    return (
      <div className="status-container">
        <div className="status-message">
          <h2>⏳ Processando pagamento...</h2>
          <p>Aguarde enquanto processamos seu pagamento.</p>
          {onReset && (
            <button onClick={onReset} className="retry-button">
              Tentar Novamente
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="status-brick-container">
      {/* StatusScreen Brick do MercadoPago */}
      <StatusScreen
        initialization={{
          paymentId: paymentId
        }}
        customization={{
          visual: {
            // Não esconder QR Code do PIX
            hidePixQrCode: false,
            style: {
              theme: 'default',
              customVariables: {
                baseColor: '#667eea'
              }
            }
          },
          backUrls: {
            // URLs de retorno após pagamento
            'return': window.location.origin,
            'error': window.location.origin
          }
        }}
        onReady={handleReady}
        onError={handleError}
        locale="pt-BR"
      />
      
      {/* Botão para novo pagamento */}
      {onReset && (
        <div className="new-payment-container">
          <button onClick={onReset} className="new-payment-button">
            Fazer Novo Pagamento
          </button>
        </div>
      )}
    </div>
  )
}

// Exportação adicional para manter compatibilidade
export default PaymentStatusScreen