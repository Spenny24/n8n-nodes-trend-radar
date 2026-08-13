import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  Icon,
  INodeProperties,
} from 'n8n-workflow';

export class YouTubeApi implements ICredentialType {
  name = 'youTubeApi';
  displayName = 'YouTube Data API';
  documentationUrl = 'https://github.com/Spenny24/n8n-nodes-trend-radar#credentials';
  icon: Icon = { light: 'file:../icons/trendRadar.svg', dark: 'file:../icons/trendRadar.dark.svg' };

  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description: 'Google API key with YouTube Data API v3 enabled',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      qs: {
        key: '={{$credentials.apiKey}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://www.googleapis.com/youtube/v3',
      url: '/videos',
      qs: {
        part: 'id',
        id: 'dQw4w9WgXcQ',
      },
    },
  };
}
