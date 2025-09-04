import { useEffect, useState } from 'react'
import type { PixPaymentResponse } from '../../lib/schemas/payment'

interface PaymentStatusScreenProps {
  paymentId: string
  paymentData?: PixPaymentResponse
}

export const PaymentStatusScreen = ({ paymentId, paymentData: initialData }: PaymentStatusScreenProps) => {
  const [showQRCode, setShowQRCode] = useState(false)
  const [copyButtonText, setCopyButtonText] = useState('Copiar Código PIX')
  const [paymentData, setPaymentData] = useState<PixPaymentResponse | undefined>(initialData)
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Se já temos os dados iniciais, use-os
    if (initialData?.point_of_interaction?.transaction_data) {
      setPaymentData(initialData)
      setShowQRCode(true)
      updateStatusMessage(initialData.status)
    } else if (paymentId) {
      // Se não temos dados iniciais, busque do backend
      fetchPaymentStatus()
    }
  }, [paymentId, initialData])

  const fetchPaymentStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/payments/status?paymentId=${paymentId}`)
      
      if (!response.ok) {
        throw new Error('Falha ao buscar status do pagamento')
      }

      const data = await response.json()
      setPaymentData(data)
      
      if (data.point_of_interaction?.transaction_data) {
        setShowQRCode(true)
      }
      
      updateStatusMessage(data.status)
    } catch (error) {
      console.error('Erro ao buscar status:', error)
      setStatusMessage('Os detalhes de pagamento não foram encontrados')
    } finally {
      setIsLoading(false)
    }
  }

  const updateStatusMessage = (status: string) => {
    const statusMessages: Record<string, string> = {
      pending: 'Aguardando pagamento...',
      approved: 'Pagamento aprovado!',
      rejected: 'Pagamento rejeitado',
      cancelled: 'Pagamento cancelado',
      in_process: 'Processando pagamento...',
      in_mediation: 'Em mediação',
      charged_back: 'Estornado',
      refunded: 'Reembolsado',
    }
    
    setStatusMessage(statusMessages[status] || 'Status desconhecido')
  }

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
      {isLoading && (
        <div className="loading-container">
          <p>Carregando detalhes do pagamento...</p>
        </div>
      )}
      
      {!isLoading && statusMessage && (
        <div className="status-message">
          <h2>{statusMessage}</h2>
          {paymentData && (
            <p className="payment-id">ID do Pagamento: {paymentData.id}</p>
          )}
        </div>
      )}
      
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