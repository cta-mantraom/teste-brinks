import axios from 'axios'
import type { PaymentFormData } from '../schemas/payment'
import { paymentFormDataSchema, pixPaymentResponseSchema } from '../schemas/payment'

export interface PaymentService {
  createPayment(data: PaymentFormData): Promise<unknown>
  getPaymentStatus(paymentId: string): Promise<unknown>
}

export class MercadoPagoPaymentService implements PaymentService {
  // Use our API route instead of calling MercadoPago directly
  // This keeps the ACCESS_TOKEN secure on the server
  private readonly apiUrl = '/api/payments'
  
  async createPayment(data: unknown): Promise<unknown> {
    // Validate data with Zod before sending
    const validatedData = paymentFormDataSchema.parse(data)
    
    try {
      // Call our secure API route
      const response = await axios.post(
        `${this.apiUrl}/create`,
        validatedData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      // Validate response with Zod
      return pixPaymentResponseSchema.parse(response.data)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Payment failed: ${error.response?.data?.error || error.message}`)
      }
      throw error
    }
  }

  async getPaymentStatus(paymentId: string): Promise<unknown> {
    try {
      // Call our secure API route
      const response = await axios.get(
        `${this.apiUrl}/status/${paymentId}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to get payment status: ${error.response?.data?.error || error.message}`)
      }
      throw error
    }
  }
}