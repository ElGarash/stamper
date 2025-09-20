// NotionService.ts
// Handles Notion OAuth and API calls

import { Platform } from 'react-native';

export interface NotionAuthToken {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

export interface NotionPage {
  id: string;
  title: string;
  properties: any;
  blocks?: any[];
}

export class NotionService {
  private static instance: NotionService;
  private token: NotionAuthToken | null = null;

  static getInstance() {
    if (!NotionService.instance) {
      NotionService.instance = new NotionService();
    }
    return NotionService.instance;
  }

  setToken(token: NotionAuthToken) {
    this.token = token;
  }

  getToken() {
    return this.token;
  }

  async authenticateWithOAuth(code: string): Promise<NotionAuthToken> {
    // TODO: Implement OAuth2 token exchange with Notion
    // Use fetch or axios to POST to Notion's /oauth/token endpoint
    throw new Error('OAuth2 authentication not implemented');
  }

  async fetchPages(tag?: string): Promise<NotionPage[]> {
    // TODO: Fetch pages from Notion API, filter by tag if provided
    throw new Error('Notion page fetching not implemented');
  }

  async fetchPageBlocks(pageId: string): Promise<any[]> {
    // TODO: Fetch blocks (content) for a Notion page
    throw new Error('Notion page blocks fetching not implemented');
  }
}
