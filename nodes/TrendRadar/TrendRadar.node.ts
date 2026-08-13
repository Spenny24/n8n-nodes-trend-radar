import type {
  IExecuteFunctions,
  IDataObject,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { parseGoogleTrendsRss } from '../../utils/googleTrends';
import { calculateTrendScore } from '../../utils/trendScoring';

interface NormalisedTrend extends IDataObject {
  title: string;
  source: 'google_trends' | 'youtube';
  url?: string;
  publishedAt?: string;
  views?: number;
  searchVolume?: number;
  trendScore: number;
  region: string;
}

export class TrendRadar implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Trend Radar',
    name: 'trendRadar',
    icon: { light: 'file:../../icons/trendRadar.svg', dark: 'file:../../icons/trendRadar.dark.svg' },
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["source"]}}',
    description: 'Discover and normalise trending topics from Google Trends and YouTube',
    defaults: {
      name: 'Trend Radar',
    },
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    usableAsTool: true,
    credentials: [
      {
        name: 'youTubeApi',
        required: true,
        displayOptions: {
          show: {
            source: ['youtube', 'both'],
          },
        },
      },
    ],
    properties: [
      {
        displayName: 'Source',
        name: 'source',
        type: 'options',
        default: 'both',
        options: [
          { name: 'Google Trends', value: 'google_trends' },
          { name: 'YouTube', value: 'youtube' },
          { name: 'Both', value: 'both' },
        ],
      },
      {
        displayName: 'Region',
        name: 'region',
        type: 'string',
        default: 'GB',
        placeholder: 'GB',
        description: 'Two-letter country/region code used by the selected source',
      },
      {
        displayName: 'Maximum Results',
        name: 'maxResults',
        type: 'number',
        default: 10,
        typeOptions: { minValue: 1, maxValue: 50 },
      },
      {
        displayName: 'Published Within',
        name: 'publishedWithinHours',
        type: 'number',
        default: 168,
        typeOptions: { minValue: 1, maxValue: 720 },
        displayOptions: {
          show: { source: ['youtube', 'both'] },
        },
        description: 'Only include YouTube videos published within this many hours',
      },
      {
        displayName: 'Minimum Views',
        name: 'minimumViews',
        type: 'number',
        default: 0,
        typeOptions: { minValue: 0 },
        displayOptions: {
          show: { source: ['youtube', 'both'] },
        },
      },
      {
        displayName: 'Sort By',
        name: 'sortBy',
        type: 'options',
        default: 'trendScore',
        options: [
          { name: 'Trend Score', value: 'trendScore' },
          { name: 'Most Recent', value: 'recent' },
          { name: 'Popularity', value: 'popularity' },
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const source = this.getNodeParameter('source', 0) as 'google_trends' | 'youtube' | 'both';
    const region = String(this.getNodeParameter('region', 0)).trim().toUpperCase();
    const maxResults = this.getNodeParameter('maxResults', 0) as number;
    const minimumViews = this.getNodeParameter('minimumViews', 0, 0) as number;
    const publishedWithinHours = this.getNodeParameter('publishedWithinHours', 0, 168) as number;
    const sortBy = this.getNodeParameter('sortBy', 0) as string;

    if (!/^[A-Z]{2}$/.test(region)) {
      throw new NodeOperationError(this.getNode(), 'Region must be a two-letter code such as GB or US');
    }

    const trends: NormalisedTrend[] = [];

    if (source === 'google_trends' || source === 'both') {
      try {
        const rss = await this.helpers.httpRequest({
          method: 'GET',
          url: 'https://trends.google.com/trending/rss',
          qs: { geo: region },
          returnFullResponse: false,
          encoding: 'text',
        }) as string;

        for (const item of parseGoogleTrendsRss(rss)) {
          trends.push({
            ...item,
            region,
            trendScore: calculateTrendScore({
              searchVolume: item.searchVolume,
              publishedAt: item.publishedAt,
            }),
          });
        }
      } catch (error) {
        if (source === 'google_trends') {
          throw new NodeApiError(this.getNode(), error as JsonObject);
        }
      }
    }

    if (source === 'youtube' || source === 'both') {
      const publishedAfter = new Date(Date.now() - publishedWithinHours * 3_600_000).toISOString();

      try {
        const searchResponse = await this.helpers.httpRequestWithAuthentication.call(this, 'youTubeApi', {
          method: 'GET',
          url: 'https://www.googleapis.com/youtube/v3/search',
          qs: {
            part: 'snippet',
            type: 'video',
            order: 'viewCount',
            regionCode: region,
            publishedAfter,
            maxResults: Math.min(50, maxResults * 2),
          },
          json: true,
        }) as { items?: Array<{ id?: { videoId?: string }; snippet?: { title?: string; publishedAt?: string } }> };

        const ids = (searchResponse.items ?? [])
          .map((item) => item.id?.videoId)
          .filter((id): id is string => Boolean(id));

        if (ids.length) {
          const statsResponse = await this.helpers.httpRequestWithAuthentication.call(this, 'youTubeApi', {
            method: 'GET',
            url: 'https://www.googleapis.com/youtube/v3/videos',
            qs: {
              part: 'snippet,statistics',
              id: ids.join(','),
            },
            json: true,
          }) as {
            items?: Array<{
              id?: string;
              snippet?: { title?: string; publishedAt?: string };
              statistics?: { viewCount?: string };
            }>;
          };

          for (const item of statsResponse.items ?? []) {
            const views = Number(item.statistics?.viewCount ?? 0);
            if (views < minimumViews || !item.id) continue;
            const publishedAt = item.snippet?.publishedAt;
            trends.push({
              title: item.snippet?.title ?? item.id,
              source: 'youtube',
              url: `https://www.youtube.com/watch?v=${item.id}`,
              publishedAt,
              views,
              region,
              trendScore: calculateTrendScore({ views, publishedAt }),
            });
          }
        }
      } catch (error) {
        throw new NodeApiError(this.getNode(), error as JsonObject);
      }
    }

    if (sortBy === 'recent') {
      trends.sort((a, b) => Date.parse(String(b.publishedAt ?? 0)) - Date.parse(String(a.publishedAt ?? 0)));
    } else if (sortBy === 'popularity') {
      trends.sort((a, b) => Number(b.views ?? b.searchVolume ?? 0) - Number(a.views ?? a.searchVolume ?? 0));
    } else {
      trends.sort((a, b) => b.trendScore - a.trendScore);
    }

    const output = trends.slice(0, maxResults).map((json) => ({ json, pairedItem: { item: 0 } }));
    return [output];
  }
}
