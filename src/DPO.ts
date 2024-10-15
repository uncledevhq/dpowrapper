import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

// Define the types for the config (without endpoint and paymentUrl)
export interface DPOConfig {
  redirectUrl: string;
  backUrl: string;
  companyToken: string;
  serviceId: string;
  currency?: string;
  country?: string;
}

// Interface for CreateTokenResponse
export interface CreateTokenResponse {
  API3G: {
    Result: string;
    ResultExplanation: string;
    TransToken: string;
    TransRef: string;
    Allocations?: {
      Allocation: {
        AllocationID: string;
        AllocationCode: string;
      };
    };
  };
}

// Interface for ChargeTokenMobileResponse
export interface ChargeTokenMobileResponse {
  API3G: {
    Result: string;
    ResultExplanation: string;
  };
}

// Default values for currency and country
const DEFAULT_CURRENCY = 'ZMW';  // Default to Zambian Kwacha
const DEFAULT_COUNTRY = 'Zambia';  // Default to Zambia

// Predefined endpoint and paymentUrl
const DEFAULT_ENDPOINT = 'https://api.directpay.online/API/v6/';
const DEFAULT_PAYMENT_URL = 'https://secure.3gdirectpay.com/';

/**
 * Main DPO Payment Wrapper class
 */
export class DPO {
  private config: DPOConfig;
  private xmlParser: XMLParser;

  constructor(config: DPOConfig) {
    this.config = config;
    this.xmlParser = new XMLParser();
  }

  // Method to create transaction token
  async createToken(amount: number, description: string): Promise<string> {
    const currency = this.config.currency || DEFAULT_CURRENCY;
    const xmlPayload = `
      <?xml version="1.0" encoding="utf-8"?>
      <API3G>
        <CompanyToken>${this.config.companyToken}</CompanyToken>
        <Request>createToken</Request>
        <TransactionAmount>${amount}</TransactionAmount>
        <TransactionCurrency>${currency}</TransactionCurrency>
        <TransactionDescription>${description}</TransactionDescription>
        <ServiceID>${this.config.serviceId}</ServiceID>
        <RedirectURL>${this.config.redirectUrl}</RedirectURL>
        <BackURL>${this.config.backUrl}</BackURL>
      </API3G>`;

    const response = await axios.post<string>(DEFAULT_ENDPOINT, xmlPayload, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });

    const parsedData = this.xmlParser.parse(response.data) as CreateTokenResponse;

    if (parsedData.API3G.Result === '000') {
      return parsedData.API3G.TransToken;
    } else {
      throw new Error(parsedData.API3G.ResultExplanation);
    }
  }

  // Method to verify transaction
  async verifyToken(transactionToken: string): Promise<boolean> {
    const xmlPayload = `
      <?xml version="1.0" encoding="utf-8"?>
      <API3G>
        <CompanyToken>${this.config.companyToken}</CompanyToken>
        <Request>verifyToken</Request>
        <TransactionToken>${transactionToken}</TransactionToken>
      </API3G>`;

    const response = await axios.post<string>(DEFAULT_ENDPOINT, xmlPayload, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });

    const parsedData = this.xmlParser.parse(response.data) as CreateTokenResponse;

    return parsedData.API3G.Result === '000';
  }

  // Method to prompt payment for mobile money
  async promptMobileMoneyPay(token: string, phoneNumber: string, amount: number, options: { MNO?: string, MNOcountry?: string } = {}): Promise<string> {
    const MNO = options.MNO || 'airtel';
    const MNOcountry = options.MNOcountry || this.config.country || DEFAULT_COUNTRY;

    const xmlPayload = `
      <?xml version="1.0" encoding="utf-8"?>
      <API3G>
        <CompanyToken>${this.config.companyToken}</CompanyToken>
        <Request>ChargeTokenMobile</Request>
        <TransactionToken>${token}</TransactionToken>
        <PhoneNumber>${phoneNumber}</PhoneNumber>
        <TransactionAmount>${amount}</TransactionAmount>
        <MNO>${MNO}</MNO>
        <MNOcountry>${MNOcountry}</MNOcountry>
      </API3G>`;

    const response = await axios.post<string>(DEFAULT_ENDPOINT, xmlPayload, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });

    const parsedData = this.xmlParser.parse(response.data) as ChargeTokenMobileResponse;

    if (parsedData.API3G.Result === '000') {
      return 'Payment prompt successful.';
    } else {
      throw new Error(parsedData.API3G.ResultExplanation);
    }
  }

  // Method to generate payment URL
  getDPOPaymentURL(transactionToken: string): string {
    return `${DEFAULT_PAYMENT_URL}?ID=${transactionToken}`;
  }
}
