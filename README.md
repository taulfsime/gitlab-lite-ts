# gitlab-lite-ts

A minimalistic, type-safe Typescript library for GitLab API interactions.

## Installation

```bash
npm install @taulfsime/gitlab-lite-ts
```

## Quick Start

```typescript
import { Gitlab } from '@taulfsime/gitlab-lite-ts';

// Initialize with your GitLab instance and access token
const gitlab = new Gitlab('your-access-token', 'https://gitlab.example.com');

// Fetch pipelines for a project
const pipelines = await gitlab.getPipelines(123);
console.log(`Found ${pipelines.totalItems} pipelines`);

// Get jobs for a specific pipeline
const jobs = await gitlab.getJobs(123, 456);
console.log(`Pipeline has ${jobs.items.length} jobs`);
```

## API Reference

### Constructor

```typescript
new Gitlab(token: string, gitlabUrl: string)
```

- `token`: Your GitLab personal access token or API token
- `gitlabUrl`: The base URL of your GitLab instance (e.g., <https://gitlab.com>)

### Methods

#### `getPipelines(projectId, filter?)`

Retrieves pipelines for a specific project.

```typescript
async getPipelines(
  projectId: number,
  filter?: gitlab_filter_pipeline_t
): Promise<{
  perPage: number;
  totalPages: number;
  totalItems: number;
  items: gitlab_pipeline_t[];
}>
```

**Parameters:**

- `projectId`: The ID of the GitLab project
- `filter` (optional): Filter options for pagination and sorting

**Filter Options:**

- `id`: Filter by pipeline ID
- `order_by`: Order by 'id', 'status', 'ref', 'updated_at', or 'user_id' (default: 'id')
- `scope`: Filter by 'running', 'pending', 'finished', 'branches', or 'tags'
- `sort`: Sort order 'asc' or 'desc' (default: 'desc')
- `source`: Filter by pipeline source
- `status`: Filter by pipeline status
- `ref`: Filter by git reference
- `per_page`: Number of results per page
- `page`: Page number for pagination
- `sha`: Filter by commit SHA

#### `getJobs(projectId, pipelineId?, filter?)`

Retrieves jobs for a project or specific pipeline.

```typescript
async getJobs(
  projectId: number,
  pipelineId?: number,
  filter?: gitlab_filter_job_t
): Promise<{
  perPage: number;
  totalPages: number;
  totalItems: number;
  items: gitlab_job_t[];
}>
```

**Parameters:**

- `projectId`: The ID of the GitLab project
- `pipelineId` (optional): The ID of a specific pipeline. If omitted, returns all jobs for the project
- `filter` (optional): Filter options for pagination and sorting

#### `listPipelinesByMergeRequest(projectId, mergeRequestIId, filter?)`

Retrieves pipelines associated with a merge request.

```typescript
async listPipelinesByMergeRequest(
  projectId: number,
  mergeRequestIId: number,
  filter?: gitlab_filter_pipeline_t
): Promise<{
  perPage: number;
  totalPages: number;
  totalItems: number;
  items: gitlab_pipeline_t[];
}>
```

**Parameters:**

- `projectId`: The ID of the GitLab project
- `mergeRequestIId`: The internal ID of the merge request
- `filter` (optional): Filter options for pagination and sorting

#### `getArtifact(projectId, jobId, path)`

Downloads an artifact from a specific job.

```typescript
async getArtifact(
  projectId: number,
  jobId: number,
  path: string
): Promise<ArrayBuffer | null>
```

**Parameters:**

- `projectId`: The ID of the GitLab project
- `jobId`: The ID of the job containing the artifact
- `path`: The path to the artifact file within the job's artifacts

**Returns:** ArrayBuffer containing the artifact data, or null if not found

## Examples

### Basic Usage

```typescript
import { Gitlab } from '@taulfsime/gitlab-lite-ts';

const gitlab = new Gitlab(process.env.GITLAB_TOKEN!, 'https://gitlab.com');

// Get recent pipelines
const recentPipelines = await gitlab.getPipelines(123, {
  per_page: 10,
  order_by: 'updated_at',
  sort: 'desc',
});

console.log(`Found ${recentPipelines.totalItems} total pipelines`);
recentPipelines.items.forEach(pipeline => {
  console.log(`Pipeline ${pipeline.id}: ${pipeline.status} (${pipeline.ref})`);
});
```

### Working with Jobs

```typescript
// Get all jobs for a project
const allJobs = await gitlab.getJobs(123);

// Get jobs for a specific pipeline
const pipelineJobs = await gitlab.getJobs(123, 456);

// Filter jobs by status
const failedJobs = pipelineJobs.items.filter(job => job.status === 'failed');
console.log(`Found ${failedJobs.length} failed jobs`);
```

### Downloading Artifacts

```typescript
// Download a specific artifact
const artifactData = await gitlab.getArtifact(123, 789, 'dist/app.zip');

if (artifactData) {
  // Save to file or process the ArrayBuffer
  const buffer = Buffer.from(artifactData);
  // ... handle the artifact data
}
```

### Merge Request Pipelines

```typescript
// Get pipelines for a merge request
const mrPipelines = await gitlab.listPipelinesByMergeRequest(123, 45, {
  status: 'success',
  per_page: 5,
});

console.log(`MR has ${mrPipelines.totalItems} successful pipelines`);
```

## License

MIT - See [LICENSE](./LICENSE) file for details.

## Changelog

### v0.0.1

- Initial release with basic GitLab API and TypeScript support
