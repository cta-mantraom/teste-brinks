import { useState, type FormEvent } from 'react'
import './UserDataForm.css'

export interface UserData {
  firstName: string
  lastName: string
  email: string
  cpf: string
  phone: string
}

interface UserDataFormProps {
  amount: number
  onSubmit: (userData: UserData) => void
}

export const UserDataForm = ({ amount, onSubmit }: UserDataFormProps) => {
  const [formData, setFormData] = useState<UserData>({
    firstName: '',
    lastName: '',
    email: '',
    cpf: '',
    phone: ''
  })

  const [errors, setErrors] = useState<Partial<UserData>>({})

  const formatCPF = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    
    // Limita a 11 dígitos
    const limited = numbers.substring(0, 11)
    
    // Formata como XXX.XXX.XXX-XX
    if (limited.length <= 3) return limited
    if (limited.length <= 6) return `${limited.slice(0, 3)}.${limited.slice(3)}`
    if (limited.length <= 9) return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`
    return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`
  }

  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    
    // Limita a 11 dígitos
    const limited = numbers.substring(0, 11)
    
    // Formata como (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    if (limited.length <= 2) return limited
    if (limited.length <= 7) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`
    if (limited.length <= 10) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`
    }
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`
  }

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }

  const validateCPF = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, '')
    return numbers.length === 11
  }

  const validatePhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '')
    return numbers.length >= 10 && numbers.length <= 11
  }

  const handleChange = (field: keyof UserData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    
    // Aplicar formatação específica
    if (field === 'cpf') {
      value = formatCPF(value)
    } else if (field === 'phone') {
      value = formatPhone(value)
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Limpar erro ao digitar
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<UserData> = {}
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Nome é obrigatório'
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Sobrenome é obrigatório'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email inválido'
    }
    
    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório'
    } else if (!validateCPF(formData.cpf)) {
      newErrors.cpf = 'CPF deve ter 11 dígitos'
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório'
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Telefone inválido'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  return (
    <div className="user-data-form-container">
      <div className="form-header">
        <h2>Complete seus dados</h2>
        <p className="form-subtitle">Preencha as informações abaixo para prosseguir com o pagamento</p>
      </div>

      <div className="plan-info">
        <div className="plan-card">
          <h3>Plano Selecionado</h3>
          <div className="plan-amount">R$ {amount.toFixed(2)}</div>
          <p className="plan-description">Assinatura mensal</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="user-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">Nome *</label>
            <input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleChange('firstName')}
              placeholder="João"
              className={errors.firstName ? 'error' : ''}
            />
            {errors.firstName && <span className="error-message">{errors.firstName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Sobrenome *</label>
            <input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleChange('lastName')}
              placeholder="Silva"
              className={errors.lastName ? 'error' : ''}
            />
            {errors.lastName && <span className="error-message">{errors.lastName}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            placeholder="joao.silva@email.com"
            className={errors.email ? 'error' : ''}
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="cpf">CPF *</label>
            <input
              id="cpf"
              type="text"
              value={formData.cpf}
              onChange={handleChange('cpf')}
              placeholder="000.000.000-00"
              className={errors.cpf ? 'error' : ''}
            />
            {errors.cpf && <span className="error-message">{errors.cpf}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Telefone *</label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange('phone')}
              placeholder="(11) 99999-9999"
              className={errors.phone ? 'error' : ''}
            />
            {errors.phone && <span className="error-message">{errors.phone}</span>}
          </div>
        </div>

        <button type="submit" className="submit-button">
          Prosseguir para Pagamento
        </button>
      </form>

      <div className="form-footer">
        <p className="security-info">
          🔒 Seus dados estão seguros e protegidos
        </p>
      </div>
    </div>
  )
}