// Secure Secret Management for Real Data Integration
// Handles API keys and sensitive configuration with encryption

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface SecretConfig {
  encrypted: boolean;
  secrets: Record<string, string>;
  metadata: {
    createdAt: number;
    lastUpdated: number;
    version: string;
  };
}

export class SecretManager {
  private encryptionKey: string;
  private secretsPath: string;
  private secrets: Map<string, string> = new Map();

  constructor(encryptionKey?: string, secretsPath?: string) {
    this.encryptionKey = encryptionKey || process.env.ENCRYPTION_KEY || this.generateEncryptionKey();
    this.secretsPath = secretsPath || path.join(process.cwd(), '.secrets.json');
    this.loadSecrets();
  }

  private generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private encrypt(text: string): string {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, this.encryptionKey);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  private decrypt(encryptedText: string): string {
    const algorithm = 'aes-256-gcm';
    const parts = encryptedText.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipher(algorithm, this.encryptionKey);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  private loadSecrets(): void {
    try {
      if (fs.existsSync(this.secretsPath)) {
        const data = fs.readFileSync(this.secretsPath, 'utf8');
        const config: SecretConfig = JSON.parse(data);
        
        for (const [key, value] of Object.entries(config.secrets)) {
          const decryptedValue = config.encrypted ? this.decrypt(value) : value;
          this.secrets.set(key, decryptedValue);
        }
      }
    } catch (error) {
      console.warn('Failed to load secrets file:', error);
    }
  }

  private saveSecrets(): void {
    try {
      const config: SecretConfig = {
        encrypted: true,
        secrets: {},
        metadata: {
          createdAt: Date.now(),
          lastUpdated: Date.now(),
          version: '1.0.0'
        }
      };

      for (const [key, value] of this.secrets.entries()) {
        config.secrets[key] = this.encrypt(value);
      }

      fs.writeFileSync(this.secretsPath, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('Failed to save secrets file:', error);
    }
  }

  public setSecret(key: string, value: string): void {
    this.secrets.set(key, value);
    this.saveSecrets();
  }

  public getSecret(key: string): string | undefined {
    // First try to get from encrypted secrets
    const secret = this.secrets.get(key);
    if (secret) {
      return secret;
    }

    // Fallback to environment variables
    return process.env[key];
  }

  public hasSecret(key: string): boolean {
    return this.secrets.has(key) || !!process.env[key];
  }

  public deleteSecret(key: string): void {
    this.secrets.delete(key);
    this.saveSecrets();
  }

  public listSecrets(): string[] {
    return Array.from(this.secrets.keys());
  }

  public validateRequiredSecrets(requiredSecrets: string[]): { valid: boolean; missing: string[] } {
    const missing: string[] = [];
    
    for (const secret of requiredSecrets) {
      if (!this.hasSecret(secret)) {
        missing.push(secret);
      }
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }

  // Real Data Integration specific methods
  public getRealDataSecrets(): Record<string, string> {
    const requiredSecrets = [
      'ALCHEMY_API_KEY',
      'INFURA_API_KEY',
      'COINGECKO_API_KEY',
      'ETHERSCAN_API_KEY'
    ];

    const secrets: Record<string, string> = {};
    
    for (const key of requiredSecrets) {
      const value = this.getSecret(key);
      if (value) {
        secrets[key] = value;
      }
    }

    return secrets;
  }

  public validateRealDataSecrets(): { valid: boolean; missing: string[]; warnings: string[] } {
    const required = [
      'ALCHEMY_API_KEY',
      'INFURA_API_KEY',
      'COINGECKO_API_KEY'
    ];

    const optional = [
      'ANKR_API_KEY',
      'QUICKNODE_API_KEY',
      'MORALIS_API_KEY',
      'COINMARKETCAP_API_KEY',
      'DEFIPULSE_API_KEY'
    ];

    const missing: string[] = [];
    const warnings: string[] = [];

    // Check required secrets
    for (const secret of required) {
      if (!this.hasSecret(secret)) {
        missing.push(secret);
      }
    }

    // Check optional secrets
    for (const secret of optional) {
      if (!this.hasSecret(secret)) {
        warnings.push(`Optional secret ${secret} not configured - reduced failover capability`);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
      warnings
    };
  }
}

// Singleton instance
let secretManagerInstance: SecretManager | null = null;

function getSecretManager(): SecretManager {
  if (!secretManagerInstance) {
    secretManagerInstance = new SecretManager();
  }
  return secretManagerInstance;
}

// Environment-specific secret validation
function validateEnvironmentSecrets(environment: string): void {
  const secretManager = getSecretManager();
  const validation = secretManager.validateRealDataSecrets();

  if (!validation.valid) {
    const message = `Missing required secrets for ${environment} environment: ${validation.missing.join(', ')}`;
    
    if (environment === 'production') {
      throw new Error(message);
    } else {
      console.warn(message);
    }
  }

  if (validation.warnings.length > 0) {
    validation.warnings.forEach(warning => console.warn(warning));
  }
}

module.exports = {
  SecretManager,
  getSecretManager,
  validateEnvironmentSecrets
};