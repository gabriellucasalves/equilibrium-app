import type {
  ExternalSearchQuery,
  ExternalSearchResponse,
} from '@/features/external/types';

export interface ExternalInformationProvider {
  readonly name: string;
  search(query: ExternalSearchQuery): Promise<ExternalSearchResponse>;
}
