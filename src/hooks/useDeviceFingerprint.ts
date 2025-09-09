import { useEffect, useState } from 'react';

declare global {
  interface Window {
    MP_DEVICE_SESSION_ID?: string;
    MP?: {
      getDeviceId?: () => string;
    };
  }
}

export const useDeviceFingerprint = () => {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    const captureDeviceId = () => {
      // Tentar capturar de diferentes formas
      // 1. Pelo window.MP_DEVICE_SESSION_ID (security.js)
      if (window.MP_DEVICE_SESSION_ID) {
        setDeviceId(window.MP_DEVICE_SESSION_ID);
        console.log('📱 Device ID capturado via MP_DEVICE_SESSION_ID:', window.MP_DEVICE_SESSION_ID);
        return;
      }

      // 2. Pelo MP.getDeviceId() (SDK V2)
      if (window.MP?.getDeviceId) {
        const id = window.MP.getDeviceId();
        if (id) {
          setDeviceId(id);
          console.log('📱 Device ID capturado via MP.getDeviceId():', id);
          return;
        }
      }

      // 3. Tentar criar um via script security.js dinamicamente
      if (!document.querySelector('script[src*="security.js"]')) {
        const script = document.createElement('script');
        script.src = 'https://www.mercadopago.com/v2/security.js';
        script.setAttribute('view', 'checkout');
        script.onload = () => {
          // Aguardar um pouco para o script gerar o ID
          setTimeout(() => {
            if (window.MP_DEVICE_SESSION_ID) {
              setDeviceId(window.MP_DEVICE_SESSION_ID);
              console.log('📱 Device ID capturado após carregar security.js:', window.MP_DEVICE_SESSION_ID);
            }
          }, 1000);
        };
        document.head.appendChild(script);
      }
    };

    // Tentar capturar imediatamente
    captureDeviceId();

    // Tentar novamente após um delay (caso o SDK ainda esteja carregando)
    const timer = setTimeout(captureDeviceId, 2000);

    return () => clearTimeout(timer);
  }, []);

  return deviceId;
};