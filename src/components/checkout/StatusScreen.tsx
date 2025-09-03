import { useEffect, useState } from 'react'
import { StatusScreen } from '@mercadopago/sdk-react'
import type { PixPaymentResponse } from '../../lib/schemas/payment'

interface PaymentStatusScreenProps {
  paymentId: string
  paymentData?: PixPaymentResponse
}

export const PaymentStatusScreen = ({ paymentId, paymentData }: PaymentStatusScreenProps) => {
  const [showQRCode, setShowQRCode] = useState(false)
  const [copyButtonText, setCopyButtonText] = useState('Copiar Código PIX')

  useEffect(() => {
    if (paymentData?.point_of_interaction?.transaction_data) {
      setShowQRCode(true)
    }
  }, [paymentData])

  const copyPixCode = async () => {
    if (paymentData?.point_of_interaction?.transaction_data?.qr_code) {
      try {
        await navigator.clipboard.writeText(
          paymentData.point_of_interaction.transaction_data.qr_code
        )
        setCopyButtonText('Código copiado!')
        setTimeout(() => setCopyButtonText('Copiar Código PIX'), 2000)
      } catch (err) {
        console.error('Erro ao copiar código:', err)
      }
    }
  }

  return (
    <div className="status-container">
      <StatusScreen
        initialization={{
          paymentId: paymentId
        }}
        onReady={() => console.log('Status Screen carregado')}
        onError={(error) => console.error('Erro no Status Screen:', error)}
      />
      
      {showQRCode && paymentData?.point_of_interaction && (
        <div className="pix-section">
          <h3>Pagamento via PIX</h3>
          
          <div className="qr-code-section">
            <img 
              src={`data:image/png;base64,${paymentData.point_of_interaction.transaction_data.qr_code_base64}`}
              alt="QR Code PIX"
              className="qr-code"
            />
          </div>
          
          <div className="pix-code-section">
            <button 
              onClick={copyPixCode}
              className="copy-button"
            >
              {copyButtonText}
            </button>
            
            <a 
              href={paymentData.point_of_interaction.transaction_data.ticket_url}
              target="_blank"
              rel="noopener noreferrer"
              className="ticket-link"
            >
              Ver PIX no navegador
            </a>
          </div>

          <div className="pix-instructions">
            <p>1. Abra o app do seu banco</p>
            <p>2. Escolha pagar via PIX</p>
            <p>3. Escaneie o QR Code ou copie o código</p>
            <p>4. Confirme o pagamento</p>
          </div>
        </div>
      )}
    </div>
  )
}