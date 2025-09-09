# Debug de Webhook MercadoPago

## Problema Identificado
- Webhooks retornando 401 "Invalid signature"
- Hash esperado diferente do hash recebido

## Possíveis Causas

### 1. Segredo Incorreto
- Verificar se `MERCADOPAGO_WEBHOOK_SECRET` está correto
- O segredo deve ser obtido em: Painel MP > Integrações > Webhooks > Chave secreta

### 2. Formato do Manifest
Atual:
```
id:[data.id];request-id:[x-request-id];ts:[ts];
```

Alternativas para testar:
```
# Sem espaços
id:[data.id];request-id:[x-request-id];ts:[ts];

# Com espaços após dois pontos (menos provável)
id: [data.id];request-id: [x-request-id];ts: [ts];

# Ordem diferente
ts:[ts];id:[data.id];request-id:[x-request-id];
```

### 3. Tratamento do data.id
- Logs mostram data.id numérico: 125519010954
- Não deve ser convertido para lowercase (só alfanuméricos)
- Testar sem conversão

### 4. Timestamp
- O ts vem do header x-signature
- Não confundir com Date.now()

## Como Verificar o Segredo

1. Acesse o painel do MercadoPago
2. Vá em Integrações > Webhooks
3. Clique em "Configurar notificações"
4. Copie a "Chave secreta" exibida
5. Atualize a variável de ambiente:
```bash
MERCADOPAGO_WEBHOOK_SECRET=sua_chave_aqui
```

## Logs para Debug
No arquivo `/api/webhooks/mercadopago.ts`, já temos logs de:
- URL chamada
- Manifest construído
- Headers presentes
- Hash esperado vs recebido

## Próximos Passos
1. Confirmar segredo no painel
2. Testar variações do manifest se necessário
3. Verificar se o payment_id precisa ser string ou número