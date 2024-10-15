
export interface PaymentConfig {
    endpoint: string;
    paymentUrl: string;
    redirectUrl: string;
    backUrl: string;
    companyToken: string;
    serviceId: string;
  }
  
  export const defaultConfig: PaymentConfig = {
    endpoint: 'https://example.com/api',  // Set a real endpoint
    paymentUrl: 'https://example.com/pay',
    redirectUrl: 'https://example.com/redirect',
    backUrl: 'https://example.com/back',
    companyToken: 'YOUR_COMPANY_TOKEN',
    serviceId: 'YOUR_SERVICE_ID',
  };
  