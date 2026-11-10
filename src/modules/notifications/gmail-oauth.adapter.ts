import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { NotificationsConfig } from './config/notifications.config';

export interface OAuthCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export interface IOAuthAdapter {
  getAccessToken(): Promise<string>;
  refreshAccessToken(): Promise<string>;
}

@Injectable()
export class GmailOAuthAdapter implements IOAuthAdapter {
  private oAuth2Client: OAuth2Client;
  private credentials: OAuthCredentials;

  constructor(
    private configService: ConfigService,
    private notificationsConfig: NotificationsConfig,
  ) {
    this.credentials = {
      clientId: this.configService.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: this.configService.get<string>('GOOGLE_CLIENT_SECRET')!,
      refreshToken: this.configService.get<string>('GOOGLE_REFRESH_TOKEN')!,
    };

    this.oAuth2Client = new OAuth2Client(
      this.credentials.clientId,
      this.credentials.clientSecret,
      this.notificationsConfig.googleOAuthRedirectUrl,
    );

    this.oAuth2Client.setCredentials({
      refresh_token: this.credentials.refreshToken,
    });
  }

  async getAccessToken(): Promise<string> {
    try {
      const { token } = await this.oAuth2Client.getAccessToken();
      if (!token) {
        throw new Error('Failed to get access token');
      }
      return token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  async refreshAccessToken(): Promise<string> {
    try {
      const { credentials } = await this.oAuth2Client.refreshAccessToken();
      const { access_token } = credentials;

      if (!access_token) {
        throw new Error('Failed to refresh access token');
      }

      return access_token;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw error;
    }
  }
}
