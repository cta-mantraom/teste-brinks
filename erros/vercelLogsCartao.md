Sep 09 13:33:15.61
POST
200
memoryys.com
/api/payments/create
2025-09-09T16:52:05.536Z [info] {"timestamp":"2025-09-09T16:52:05.533Z","level":"info","message":"Enforcing minimum cart value policy","service":"payment","operation":"validation","requested_amount":5,"enforced_amount":5,"minimum_value":5}
2025-09-09T16:52:05.536Z [info] {"timestamp":"2025-09-09T16:52:05.536Z","level":"info","message":"Payment request received","service":"payment","operation":"create_request","payment_method_id":"master","isPix":false,"amount":5}
2025-09-09T16:52:05.539Z [info] {"timestamp":"2025-09-09T16:52:05.538Z","level":"info","message":"Payment card_payment_prepared","service":"payment","operation":"card_payment_prepared","paymentId":"token_masked","payment_method_id":"master","hasIssuer":true,"hasToken":true}
2025-09-09T16:52:05.539Z [info] {"timestamp":"2025-09-09T16:52:05.538Z","level":"info","message":"Payment sending_to_mercadopago","service":"payment","operation":"sending_to_mercadopago","paymentId":"N/A","payload":{"payment_method_id":"master","hasToken":true,"issuer_id":24,"amount":5,"itemsCount":1,"hasAdditionalInfo":true}}
2025-09-09T16:52:09.112Z [info] {"timestamp":"2025-09-09T16:52:09.111Z","level":"info","message":"Payment payment_created","service":"payment","operation":"payment_created","paymentId":"125519010954","status":"approved","status_detail":"accredited","payment_method_id":"master"}
Sep 09 13:52:09.20
POST
401
memoryys.com
/api/webhooks/mercadopago
2025-09-09T16:52:09.657Z [info] {"timestamp":"2025-09-09T16:52:09.654Z","level":"info","message":"Webhook notification_received","service":"webhook","operation":"notification_received","method":"POST","url":"/api/webhooks/mercadopago?data.id=125519010954&type=payment","headers":"accept-encoding, x-vercel-internal-ingress-bucket, x-vercel-forwarded-for, x-b3-sampled, x-vercel-internal-bot-check, x-vercel-oidc-token, traceparent, x-b3-spanid, x-vercel-ip-latitude, x-socket-timeout, content-length, x-trace-digest-15, x-vercel-internal-ingress-port, x-vercel-ja4-digest, x-vercel-proxy-signature, x-vercel-ip-postal-code, x-b3-parentspanid, user-agent, x-vercel-proxied-for, x-vercel-id, host, x-vercel-deployment-url, x-forwarded-proto, referer, x-forwarded-host, x-vercel-ip-longitude, x-request-id, x-vercel-ip-as-number, x-vercel-proxy-signature-ts, x-b3-traceid, x-vercel-ip-country-region, x-vercel-function-path, content-type, x-vercel-ip-timezone, x-rest-pool-name, x-signature, x-forwarded-for, x-vercel-ip-city, forwarded, accept, x-vercel-ip-country, x-vercel-ip-continent, x-real-ip, connection"}
2025-09-09T16:52:09.659Z [error] [WEBHOOK] URL chamada: /api/webhooks/mercadopago?data.id=125519010954&type=payment
2025-09-09T16:52:09.659Z [error] [WEBHOOK] Manifest construído: id:125519010954;request-id:d7189c45-7f58-415d-bcf5-9f6675472e3e;ts:1757425554;
2025-09-09T16:52:09.660Z [error] [WEBHOOK] Headers presentes: { 'x-signature': true, 'x-request-id': true, 'data.id': true }
2025-09-09T16:52:09.665Z [error] [WEBHOOK] Assinatura inválida - hash não confere
2025-09-09T16:52:09.665Z [error] [WEBHOOK] Hash esperado: 4e378b12e1...
2025-09-09T16:52:09.665Z [error] [WEBHOOK] Hash recebido: 33c67e697f...
2025-09-09T16:52:09.665Z [warning] {"timestamp":"2025-09-09T16:52:09.665Z","level":"warn","message":"Invalid webhook signature","service":"webhook","operation":"signature_validation"}
