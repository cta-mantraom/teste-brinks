import { useState } from 'react'
import { MercadoPagoPaymentService } from '../lib/services/payment.service'
import type { PaymentFormData, PixPaymentResponse } from '../lib/schemas/payment'

interface UsePaymentReturn {
  createPayment: (data: PaymentFormData) => Promise<PixPaymentResponse | null>
  loading: boolean
  error: string | null
  clearError: () => void
}

export const usePayment = (): UsePaymentReturn => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const paymentService = new MercadoPagoPaymentService()

  const createPayment = async (data: PaymentFormData): Promise<PixPaymentResponse | null> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await paymentService.createPayment(data)
      return response as PixPaymentResponse
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao processar pagamento'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  const clearError = () => setError(null)

  return {
    createPayment,
    loading,
    error,
    clearError
  }
}