export type gitlab_job_t = {
  id: number;
  status: 'success' | 'failed' | 'canceled' | 'skipped' | 'pending' | 'running';
  name: string;
  pipeline: {
    id: number;
    project_id: number;
    status: 'success';
    sha: string;
  };
  artifacts: {
    filename: string;
    size: number;
    file_format: string;
    file_type: string;
  };
};

type gitlab_filter_job_t = {
  id?: number;
  order_by?: 'id' | 'status' | 'ref' | 'updated_at' | 'user_id';
  sort?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
};

type gitlab_pipeline_source_t =
  | 'web'
  | 'merge_request_event'
  | 'api'
  | 'chat'
  | 'external'
  | 'external_pull_request_event'
  | 'ondemand_dast_scan'
  | 'ondemand_dast_validation'
  | 'parent_pipeline'
  | 'pipeline'
  | 'push'
  | 'schedule'
  | 'security_orchestration_policy'
  | 'trigger'
  | 'webide';

type gitlab_pipeline_status_t =
  | 'created'
  | 'waiting_for_resource'
  | 'preparing'
  | 'pending'
  | 'running'
  | 'success'
  | 'failed'
  | 'canceled'
  | 'skipped'
  | 'manual'
  | 'scheduled';

export type gitlab_pipeline_t = {
  id: number;
  status: gitlab_pipeline_status_t;
  source: gitlab_pipeline_source_t;
  sha: string;
  ref: string;
  project_id: number;
};

type gitlab_filter_pipeline_t = {
  id?: number;
  order_by?: 'id' | 'status' | 'ref' | 'updated_at' | 'user_id'; // (default: id
  scope?: 'running' | 'pending' | 'finished' | 'branches' | 'tags';
  sort?: 'asc' | 'desc'; // (default: desc)
  source?: gitlab_pipeline_source_t;
  status?: gitlab_pipeline_status_t;
  ref?: string;
  per_page?: number;
  page?: number;
  sha?: string;
};

type gitlab_merge_request_t = {
  id: number;
  iid: number;
  name: string;
  project_id: number;
  state: 'opened';
  draft: boolean;
  sha: string;
};

type gitlab_items_return_t<T> = {
  perPage: number;
  totalPages: number;
  totalItems: number;
  items: T[];
};

//TODO: (k.todorov) By default, GET requests return 20 results at a time because the API results are paginated.

export class Gitlab {
  private token: string;
  private gitlabUrl: string;

  constructor(token: string, gitlabUrl: string) {
    this.token = token;
    this.gitlabUrl = formatPath(gitlabUrl);
  }

  getPipelines(
    projectId: number,
    filter: gitlab_filter_pipeline_t = {}
  ): Promise<gitlab_items_return_t<gitlab_pipeline_t>> {
    const query = filterToQuery(filter);

    return this.requestItems<gitlab_pipeline_t>(
      `/projects/${projectId}/pipelines?${query}`
    );
  }

  getJobs(
    projectId: number,
    pipelineId?: number,
    filter: gitlab_filter_job_t = {}
  ): Promise<gitlab_items_return_t<gitlab_job_t>> {
    const query = filterToQuery(filter);

    const url = [
      `projects/${projectId}`,
      ...(typeof pipelineId === 'number' ? [`pipelines/${pipelineId}`] : []),
      'jobs',
    ].join('/');

    return this.requestItems<gitlab_job_t>(`${url}?${query}`);
  }

  listPipelinesByMergeRequest(
    projectId: number,
    mergeRequestIId: number,
    filter: gitlab_filter_pipeline_t = {}
  ): Promise<gitlab_items_return_t<gitlab_pipeline_t>> {
    const query = filterToQuery(filter);

    return this.requestItems<gitlab_pipeline_t>(
      `/projects/${projectId}/merge_requests/${mergeRequestIId}/pipelines?${query}`
    );
  }

  async getArtifact(
    projectId: number,
    jobId: number,
    path: string
  ): Promise<ArrayBuffer | null> {
    path = formatPath(path);
    const resp = await this.doRequest(
      `/projects/${projectId}/jobs/${jobId}/artifacts/${path}`
    );

    if (!resp) {
      console.error(`Error fetching artifact "${path}"`);
      return null;
    }

    return resp.arrayBuffer();
  }

  private async requestItems<T = any>(
    path: string
  ): Promise<gitlab_items_return_t<T>> {
    const resp = await this.doRequest(path);

    if (!resp) {
      return {
        items: [],
        totalPages: 0,
        totalItems: 0,
        perPage: 0,
      };
    }

    const items = await resp.json();
    const totalPages = resp.headers.get('X-Total-Pages');
    const totalItems = resp.headers.get('X-Total');
    const perPage = resp.headers.get('X-Per-Page');

    return {
      items,
      totalPages: parseInt(totalPages!),
      totalItems: parseInt(totalItems!),
      perPage: parseInt(perPage!),
    };
  }

  private async doRequest(path: string): Promise<Response | null> {
    path = formatPath(path);

    try {
      const result = await fetch([this.gitlabUrl, 'api/v4', path].join('/'), {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      return result;
    } catch (error) {
      console.error('Error fetching data:', error);
    }

    return null;
  }
}

function formatPath(path: string): string {
  return path.replace(/^\/+/, '');
}

function filterToQuery(filter: Record<string, string | number>): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(filter)) {
    if (typeof value !== 'undefined') {
      query.set(key, String(value));
    }
  }

  return query.toString();
}
