import { BrevoClient, type BaseClientOptions } from '@getbrevo/brevo';
import { env } from './env';

export interface BrevoConfig {
  apiKey: string;
  senderEmail: string;
  senderName: string;
}

export const brevoConfig: BrevoConfig = {
  apiKey: env.BREVO_API_KEY,
  senderEmail: env.BREVO_SENDER_EMAIL,
  senderName: env.BREVO_SENDER_NAME,
};

export const validateBrevoConfig = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!brevoConfig.apiKey || brevoConfig.apiKey.trim() === '') {
    errors.push('BREVO_API_KEY is missing or empty in environment variables');
  }

  if (!brevoConfig.senderEmail || brevoConfig.senderEmail.trim() === '') {
    errors.push('BREVO_SENDER_EMAIL is missing or empty in environment variables');
  }

  if (!brevoConfig.senderName || brevoConfig.senderName.trim() === '') {
    errors.push('BREVO_SENDER_NAME is missing or empty in environment variables');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const initBrevoClient = (): BrevoClient | null => {
  const validation = validateBrevoConfig();
  if (!validation.valid) {
    console.warn('⚠️  [BrevoConfig] Brevo configuration invalid:', validation.errors);
    return null;
  }

  try {
    const clientOptions: BaseClientOptions = {
      apiKey: brevoConfig.apiKey,
    };

    const apiInstance = new BrevoClient(clientOptions);

    console.log('✅ [BrevoConfig] Brevo Transactional Email client initialized successfully', {
      senderName: brevoConfig.senderName,
      senderEmail: brevoConfig.senderEmail,
    });

    return apiInstance;
  } catch (error: any) {
    console.error('❌ [BrevoConfig] Failed to initialize Brevo client:', error?.message || error);
    return null;
  }
};
