// src/types.ts - Shared interfaces for reverse proxy configuration and modules

/**
 * Represents a backend server instance.
 */
export interface BackendServer {
  host: string;
  port: number;
}

/**
 * Settings for SMTP email alerts.
 */
export interface EmailSettings {
  sendgridApiKey: string;
  smtpHost: string;
  smtpPort: number;
  username: string;
  password: string;
  from: string;
  to: string;
}

/**
 * Proxy-specific settings.
 */
export interface ProxySettings {
  httpsPort: number;
  httpRedirectPort: number;
  stickySessionMode: 'ip-hash' | 'cookie';
  rateLimit: {
    requests: number;
    windowMs: number;
  };
  allowedIps: string[];
  backendServers: BackendServer[];
}

/**
 * Settings for securing the Admin API.
 */
export interface AdminSettings {
  username: string;
  password: string;
  allowedAdminIps: string[];
}

/**
 * Root application settings.
 */
export interface AppSettings {
  ssl: {
    keyPath: string;
    certPath: string;
  };
  proxy: ProxySettings;
  admin: AdminSettings;
  email: EmailSettings;
}
