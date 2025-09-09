Dados do usuário coletados: {firstName: 'william', lastName: 'freitas rondon', email: 'appparaty@gmail.com', cpf: '397.465.718-50', phone: '(24) 99268-4832'}cpf: "397.465.718-50"email: "appparaty@gmail.com"firstName: "william"lastName: "freitas rondon"phone: "(24) 99268-4832"[[Prototype]]: Object
index-CTl-DLlx.js:66 ✅ Payment Brick está pronto e renderizado!
index-CTl-DLlx.js:66 Configuração: {amount: 5, locale: 'pt-BR', methods: 'pix, credit_card, debit_card'}amount: 5locale: "pt-BR"methods: "pix, credit_card, debit_card"[[Prototype]]: Object
index-CTl-DLlx.js:66 BIN mudou: 22365655
index-CTl-DLlx.js:66 ✅ Payment Brick processou o pagamento!
index-CTl-DLlx.js:66 📦 Dados recebidos: {
"paymentType": "credit_card",
"selectedPaymentMethod": "credit_card",
"formData": {
"token": "162942b1c89060b1d776b7e29b32df54",
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
index-CTl-DLlx.js:66 💳 Payload do cartão preparado: {payment_method_id: 'master', token: '162942b1c8...', issuer_id: 24}issuer_id: 24payment_method_id: "master"token: "162942b1c8..."[[Prototype]]: Object
index-CTl-DLlx.js:66 🚀 Enviando pagamento para processar: {transaction_amount: 5, payment_method_id: 'master', payer: {…}, description: 'Checkout Brinks', installments: 1, …}description: "Checkout Brinks"installments: 1issuer_id: 24payer: email: "appparaty@gmail.com"entity_type: "individual"first_name: "william"identification: number: "39746571850"type: "CPF"[[Prototype]]: Objectlast_name: "freitas rondon"phone: area_code: "24"number: "992684832"[[Prototype]]: Objecttype: "customer"[[Prototype]]: Objectpayment_method_id: "master"token: "162942b1c89060b1d776b7e29b32df54"transaction_amount: 5[[Prototype]]: Object
index-CTl-DLlx.js:66 ✅ Pagamento criado com sucesso: {id: 125519010954, status: 'approved', status_detail: 'accredited', point_of_interaction: {…}}id: 125519010954point_of_interaction: business_info: branch: nullsub_unit: "sdk"unit: "online_payments"[[Prototype]]: Objecttransaction_data: ticket_id: "53610635592_7b7e766f7437327f6276_A"[[Prototype]]: Objecttype: "UNSPECIFIED"[[Prototype]]: Objectstatus: "approved"status_detail: "accredited"[[Prototype]]: Object
index-CTl-DLlx.js:66 🆔 ID do pagamento MercadoPago: 125519010954
index-CTl-DLlx.js:66 Pagamento bem-sucedido! ID: 125519010954
index-CTl-DLlx.js:66 Dados do pagamento: {id: 125519010954, status: 'approved', status_detail: 'accredited', point_of_interaction: {…}}id: 125519010954point_of_interaction: business_info: branch: nullsub_unit: "sdk"unit: "online_payments"[[Prototype]]: Objecttransaction_data: ticket_id: "53610635592_7b7e766f7437327f6276_A"[[Prototype]]: Objecttype: "UNSPECIFIED"[[Prototype]]: Objectstatus: "approved"status_detail: "accredited"[[Prototype]]: Object
index-CTl-DLlx.js:66 🎯 Renderizando StatusScreen Brick do MercadoPago
index-CTl-DLlx.js:66 Payment ID: 125519010954
index-CTl-DLlx.js:66 ✅ StatusScreen Brick está pronto!
index-CTl-DLlx.js:66 Para PIX, o QR Code aparecerá automaticamente
