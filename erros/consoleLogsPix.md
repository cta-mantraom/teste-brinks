Dados do usuário coletados: {firstName: 'william', lastName: 'freitas rondon', email: 'appparaty@gmail.com', cpf: '397.465.718-50', phone: '(24) 99268-4832'}cpf: "397.465.718-50"email: "appparaty@gmail.com"firstName: "william"lastName: "freitas rondon"phone: "(24) 99268-4832"[[Prototype]]: Object
index-CTl-DLlx.js:49 MercadoPago has already been initialized in your window, please remove the duplicate import
✅ Payment Brick está pronto e renderizado!
index-CTl-DLlx.js:66 Configuração: {amount: 5, locale: 'pt-BR', methods: 'pix, credit_card, debit_card'}amount: 5locale: "pt-BR"methods: "pix, credit_card, debit_card"[[Prototype]]: Object
payment.js:1✅ Payment Brick processou o pagamento!
index-CTl-DLlx.js:66 📦 Dados recebidos: {
"paymentType": "bank_transfer",
"selectedPaymentMethod": "bank_transfer",
"formData": {
"payment_method_id": "pix",
"transaction_amount": 5,
"payer": {
"email": "appparaty@gmail.com"
}
}
}
index-CTl-DLlx.js:66 🚀 Enviando pagamento para processar: {transaction_amount: 5, payment_method_id: 'pix', payer: {…}, description: 'Checkout Brinks', installments: 1}description: "Checkout Brinks"installments: 1payer: email: "appparaty@gmail.com"entity_type: "individual"first_name: "william"identification: number: "39746571850"type: "CPF"[[Prototype]]: Objectlast_name: "freitas rondon"phone: area_code: "24"number: "992684832"[[Prototype]]: Objecttype: "customer"[[Prototype]]: Objectpayment_method_id: "pix"transaction_amount: 5[[Prototype]]: Object
index-CTl-DLlx.js:66 ✅ Pagamento criado com sucesso: {id: 125515418040, status: 'pending', status_detail: 'pending_waiting_transfer', point_of_interaction: {…}}id: 125515418040point_of_interaction: application_data: name: nulloperating_system: nullversion: null[[Prototype]]: Objectbusiness_info: branch: nullsub_unit: "sdk"unit: "online_payments"[[Prototype]]: Objectlocation: source: nullstate_id: null[[Prototype]]: Objecttransaction_data: bank_info: {collector: {…}, is_same_bank_account_owner: null, origin_bank_id: null, origin_wallet_id: null, payer: {…}}bank_transfer_id: nulle2e_id: nullfinancial_institution: nullmerchant_category_code: nullqr_code: "00020126360014br.gov.bcb.pix0114+552499268483252040000530398654045.005802BR5908VIBRANE.6006Parati62250521mpqrinter125515418040630407A4"qr_code_base64: "Codigo qr code esta aqui apaguei por que é muito grade "ticket_url: "https://www.mercadopago.com.br/payments/125515418040/ticket?caller_id=2177054274&hash=fe2be038-4c35-4be0-a100-c403bdf39ea7"transaction_id: null[[Prototype]]: Objecttype: "OPENPLATFORM"[[Prototype]]: Objectstatus: "pending"status_detail: "pending_waiting_transfer"[[Prototype]]: Object
index-CTl-DLlx.js:66 🆔 ID do pagamento MercadoPago: 125515418040
index-CTl-DLlx.js:66 📱 Dados PIX recebidos: {hasQrCode: true, hasQrCodeBase64: true}hasQrCode: truehasQrCodeBase64: true[[Prototype]]: Object
index-CTl-DLlx.js:66 Pagamento bem-sucedido! ID: 125515418040
index-CTl-DLlx.js:66 Dados do pagamento: {id: 125515418040, status: 'pending', status_detail: 'pending_waiting_transfer', point_of_interaction: {…}}id: 125515418040point_of_interaction: application_data: name: nulloperating_system: nullversion: null[[Prototype]]: Objectbusiness_info: branch: nullsub_unit: "sdk"unit: "online_payments"[[Prototype]]: Objectlocation: source: nullstate_id: null[[Prototype]]: Objecttransaction_data: bank_info: {collector: {…}, is_same_bank_account_owner: null, origin_bank_id: null, origin_wallet_id: null, payer: {…}}bank_transfer_id: nulle2e_id: nullfinancial_institution: nullmerchant_category_code: nullqr_code: "00020126360014br.gov.bcb.pix0114+552499268483252040000530398654045.005802BR5908VIBRANE.6006Parati62250521mpqrinter125515418040630407A4"qr_code_base64: "Codigo qr code esta aqui apaguei por que é muito grande"ticket_url: "https://www.mercadopago.com.br/payments/125515418040/ticket?caller_id=2177054274&hash=fe2be038-4c35-4be0-a100-c403bdf39ea7"transaction_id: null[[Prototype]]: Objecttype: "OPENPLATFORM"[[Prototype]]: Objectstatus: "pending"status_detail: "pending_waiting_transfer"[[Prototype]]: Object
index-CTl-DLlx.js:66 🎯 Renderizando StatusScreen Brick do MercadoPago
index-CTl-DLlx.js:66 Payment ID: 125515418040
index-CTl-DLlx.js:66 ✅ StatusScreen Brick está pronto!
index-CTl-DLlx.js:66 Para PIX, o QR Code aparecerá automaticamente
