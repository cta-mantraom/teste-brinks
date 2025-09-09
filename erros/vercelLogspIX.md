Sep 09 13:33:15.61
POST
200
memoryys.com
/api/payments/create
2025-09-09T16:33:16.322Z [info] {"timestamp":"2025-09-09T16:33:16.316Z","level":"info","message":"Enforcing minimum cart value policy","service":"payment","operation":"validation","requested_amount":5,"enforced_amount":5,"minimum_value":5}
2025-09-09T16:33:16.323Z [info] {"timestamp":"2025-09-09T16:33:16.322Z","level":"info","message":"Payment request received","service":"payment","operation":"create_request","payment_method_id":"pix","isPix":true,"amount":5}
2025-09-09T16:33:16.325Z [info] {"timestamp":"2025-09-09T16:33:16.325Z","level":"info","message":"Payment sending_to_mercadopago","service":"payment","operation":"sending_to_mercadopago","paymentId":"N/A","payload":{"payment_method_id":"pix","hasToken":false,"amount":5,"itemsCount":1,"hasAdditionalInfo":true}}
2025-09-09T16:33:17.127Z [info] {"timestamp":"2025-09-09T16:33:17.124Z","level":"info","message":"Payment payment_created","service":"payment","operation":"payment_created","paymentId":"125515418040","status":"pending","status_detail":"pending_waiting_transfer","payment_method_id":"pix"}
Sep 09 13:33:17.14
POST
401
memoryys.com
/api/webhooks/mercadopago
2025-09-09T16:33:17.752Z [info] {"timestamp":"2025-09-09T16:33:17.749Z","level":"info","message":"Webhook notification_received","service":"webhook","operation":"notification_received","method":"POST","url":"/api/webhooks/mercadopago?data.id=125515418040&type=payment","headers":"x-forwarded-proto, x-vercel-proxy-signature, content-type, x-forwarded-host, x-vercel-ip-postal-code, x-b3-spanid, x-real-ip, x-forwarded-for, x-vercel-ip-continent, x-vercel-deployment-url, x-b3-parentspanid, x-vercel-ip-as-number, x-rest-pool-name, user-agent, x-vercel-proxy-signature-ts, x-vercel-ip-country-region, x-b3-traceid, x-vercel-function-path, x-vercel-forwarded-for, x-signature, x-vercel-ip-timezone, referer, traceparent, x-vercel-id, x-vercel-ip-city, x-vercel-oidc-token, x-vercel-ip-latitude, accept, x-trace-digest-38, x-b3-sampled, x-vercel-ip-country, accept-encoding, x-socket-timeout, host, x-vercel-ja4-digest, x-vercel-internal-ingress-port, x-vercel-internal-bot-check, x-vercel-ip-longitude, x-vercel-internal-ingress-bucket, x-request-id, x-vercel-proxied-for, forwarded, content-length, connection"}
2025-09-09T16:33:17.755Z [error] [WEBHOOK] URL chamada: /api/webhooks/mercadopago?data.id=125515418040&type=payment
2025-09-09T16:33:17.755Z [error] [WEBHOOK] Manifest construído: id:125515418040;request-id:c8bfa114-0814-4b0f-acb3-8a851f789ed5;ts:1757429449;
2025-09-09T16:33:17.755Z [error] [WEBHOOK] Headers presentes: { 'x-signature': true, 'x-request-id': true, 'data.id': true }
2025-09-09T16:33:17.761Z [error] [WEBHOOK] Assinatura inválida - hash não confere
2025-09-09T16:33:17.761Z [error] [WEBHOOK] Hash esperado: 8a1804db51...
2025-09-09T16:33:17.761Z [error] [WEBHOOK] Hash recebido: 61b794be0e...
2025-09-09T16:33:17.761Z [warning] {"timestamp":"2025-09-09T16:33:17.760Z","level":"warn","message":"Invalid webhook signature","service":"webhook","operation":"signature_validation"}
