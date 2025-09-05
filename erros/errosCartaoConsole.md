Dados do usuário coletados: {firstName: 'william', lastName: 'freitas rondon', email: 'appparaty@gmail.com', cpf: '397.465.718-50', phone: '(24) 99268-4832'}cpf: "397.465.718-50"email: "appparaty@gmail.com"firstName: "william"lastName: "freitas rondon"phone: "(24) 99268-4832"[[Prototype]]: Object
index-CEk3wbQQ.js:66 ✅ Payment Brick está pronto e renderizado!
index-CEk3wbQQ.js:66 Configuração: {amount: 5, locale: 'pt-BR', methods: 'pix, credit_card, debit_card'}amount: 5locale: "pt-BR"methods: "pix, credit_card, debit_card"[[Prototype]]: Object
index-CEk3wbQQ.js:66 BIN mudou: 22365655
index-CEk3wbQQ.js:66 ✅ Payment Brick processou o pagamento!
index-CEk3wbQQ.js:66 📦 Dados recebidos: {
  "paymentType": "credit_card",
  "selectedPaymentMethod": "credit_card",
  "formData": {
    "token": "b70298783e7489e5c35a3452ebc1554f",
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
index-CEk3wbQQ.js:66 🚀 Enviando pagamento para processar: {transaction_amount: 5, payment_method_id: 'credit_card', payer: {…}, description: 'Checkout Brinks', installments: 1}description: "Checkout Brinks"installments: 1payer: email: "appparaty@gmail.com"entity_type: "individual"first_name: "william"identification: number: "39746571850"type: "CPF"[[Prototype]]: Objectlast_name: "freitas rondon"phone: area_code: "24"number: "992684832"[[Prototype]]: Objecttype: "customer"[[Prototype]]: Objectpayment_method_id: "credit_card"transaction_amount: 5[[Prototype]]: Object
index-CEk3wbQQ.js:66  POST https://memoryys.com/api/payments/create 400 (Bad Request)
d @ index-CEk3wbQQ.js:66
(anonymous) @ payment.js:1
(anonymous) @ payment.js:1
ge @ payment.js:1
(anonymous) @ payment.js:1
(anonymous) @ payment.js:1
(anonymous) @ payment.js:1
ge @ payment.js:1
_e @ payment.js:1
(anonymous) @ payment.js:1
a @ payment.js:1
Promise.then
d @ payment.js:1
(anonymous) @ payment.js:1
ge @ payment.js:1
Me.o.onSubmitCallback @ payment.js:1
(anonymous) @ payment.js:1
a @ payment.js:1
Promise.then
d @ payment.js:1
a @ payment.js:1
Promise.then
d @ payment.js:1
(anonymous) @ payment.js:1
ge @ payment.js:1
(anonymous) @ payment.js:1
(anonymous) @ payment.js:1
(anonymous) @ payment.js:1
setTimeout
(anonymous) @ payment.js:1
Me.ae @ payment.js:1
(anonymous) @ payment.js:1
(anonymous) @ payment.js:1
(anonymous) @ 2448.2448.js:1
(anonymous) @ 7754.7754.js:1
(anonymous) @ payment.js:1
c @ payment.js:1
(anonymous) @ 3581.3581.js:1Understand this error
index-CEk3wbQQ.js:66 ❌ Erro ao processar pagamento: Error: not_result_by_params
    at d (index-CEk3wbQQ.js:66:23111)