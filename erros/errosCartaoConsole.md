Dados do usuário coletados: {firstName: 'william', lastName: 'freitas rondon', email: 'appparaty@gmail.com', cpf: '397.465.718-50', phone: '(24) 99268-4832'}cpf: "397.465.718-50"email: "appparaty@gmail.com"firstName: "william"lastName: "freitas rondon"phone: "(24) 99268-4832"[[Prototype]]: Object
index-B829kDCn.js:66 ✅ Payment Brick está pronto e renderizado!
index-B829kDCn.js:66 Configuração: {amount: 5, locale: 'pt-BR', methods: 'pix, credit_card, debit_card'}amount: 5locale: "pt-BR"methods: "pix, credit_card, debit_card"[[Prototype]]: Object
index-B829kDCn.js:66 BIN mudou: 22365655
index-B829kDCn.js:66 ✅ Payment Brick processou o pagamento!
index-B829kDCn.js:66 📦 Dados recebidos: {
"paymentType": "credit_card",
"selectedPaymentMethod": "credit_card",
"formData": {
"token": "db57b62678817c57a4132e1e3a50e5d1",
"issuer_id": "24",
"payment_method_id": "master",
"transaction_amount": 5,
"installments": 1,
"payer": {
"email": "appparaty@gmail.com",
"identification": {
"type": "CPF",
"number": "39746571850"
}
}
}
}
index-B829kDCn.js:66 💳 Token do cartão incluído no payload
index-B829kDCn.js:66 🚀 Enviando pagamento para processar: {transaction_amount: 5, payment_method_id: 'credit_card', payer: {…}, description: 'Checkout Brinks', installments: 1, …}description: "Checkout Brinks"installments: 1issuer_id: "24"payer: email: "appparaty@gmail.com"entity_type: "individual"first_name: "william"identification: number: "39746571850"type: "CPF"[[Prototype]]: Objectlast_name: "freitas rondon"phone: area_code: "24"number: "992684832"[[Prototype]]: Objecttype: "customer"[[Prototype]]: Objectpayment_method_id: "credit_card"token: "db57b62678817c57a4132e1e3a50e5d1"transaction_amount: 5[[Prototype]]: Object
index-B829kDCn.js:66 POST https://memoryys.com/api/payments/create 400 (Bad Request)
❌ Erro ao processar pagamento: Error: Dados de pagamento inválidos
at d (index-B829kDCn.js:66:23457)
