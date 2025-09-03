export interface PaymentBrickCustomization {
  paymentMethods: {
    creditCard?: 'all' | string[]
    debitCard?: 'all' | string[]
    ticket?: 'all' | string[]
    bankTransfer?: string[]
    mercadoPago?: string[]
  }
  visual?: {
    style?: {
      theme?: 'default' | 'dark' | 'bootstrap' | 'flat'
      customVariables?: Record<string, string>
    }
    hideFormTitle?: boolean
    hidePaymentButton?: boolean
  }
}

export interface PaymentBrickInitialization {
  amount: number
  payer?: {
    email?: string
    firstName?: string
    lastName?: string
    identification?: {
      type?: string
      number?: string
    }
  }
}

export interface StatusScreenInitialization {
  paymentId: string
}

export interface BrickCallbacks {
  onReady?: () => void
  onError?: (error: Error) => void
  onSubmit?: (formData: unknown) => Promise<unknown>
}