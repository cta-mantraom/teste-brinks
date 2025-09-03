Renderização padrão
Antes de realizar a renderização do Payment Brick, primeiro execute os passos de inicialização compartilhados entre todos os Bricks. A partir disso, veja abaixo as informações necessárias para você configurar e renderizar o Payment Brick.

Nota
Para consultar tipagens e especificações dos parâmetros e respostas de funções do Brick, consulte a documentação técnica.
Configurar o Brick
Crie a configuração de inicialização do Brick.

const initialization = {
 amount: 100,
 preferenceId: "<PREFERENCE_ID>",
};
const customization = {
 paymentMethods: {
   ticket: "all",
   bankTransfer: "all",
   creditCard: "all",
   prepaidCard: "all",
   debitCard: "all",
   mercadoPago: "all",
 },
};
const onSubmit = async (
 { selectedPaymentMethod, formData }
) => {
 // callback chamado ao clicar no botão de submissão dos dados
 return new Promise((resolve, reject) => {
   fetch("/process_payment", {
     method: "POST",
     headers: {
       "Content-Type": "application/json",
     },
     body: JSON.stringify(formData),
   })
     .then((response) => response.json())
     .then((response) => {
       // receber o resultado do pagamento
       resolve();
     })
     .catch((error) => {
       // lidar com a resposta de erro ao tentar criar o pagamento
       reject();
     });
 });
};
const onError = async (error) => {
 // callback chamado para todos os casos de erro do Brick
 console.log(error);
};
const onReady = async () => {
 /*
   Callback chamado quando o Brick estiver pronto.
   Aqui você pode ocultar loadings do seu site, por exemplo.
 */
};
Atenção
Sempre que o usuário sair da tela onde algum Brick é exibido, é necessário destruir a instância atual com o comando window.paymentBrickController.unmount(). Ao entrar novamente, uma nova instância deve ser gerada.
Para utilizar o método de pagamento (paymentMethods) do tipo "mercadoPago" é preciso enviar uma preferência durante a inicialização do Brick, substituindo o valor <PREFERENCE_ID> pelo ID da preferência criada. As instruções para criação da preferência estão na seção Habilitar pagamento com Mercado Pago.

Renderizar o Brick
Uma vez criadas as configurações, insira o código abaixo para renderizar o Brick.

Importante
O id paymentBrick_container da div html abaixo, deve corresponder ao valor enviado dentro do método create() da etapa anterior.
import { Payment } from '@mercadopago/sdk-react';

<Payment
   initialization={initialization}
   customization={customization}
   onSubmit={onSubmit}
   onReady={onReady}
   onError={onError}
/>