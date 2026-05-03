export interface JsonlJobDescription {
  custom_id: string;
  html: string;
  id?: number;
  job_level: string;
  job_level_signals: string[];
  npc_seed?: string;
  title: string;
}

export interface JsonlDatasetManifestEntry {
  label: string;
  url: string;
  description?: string;
  format?: 'jsonl';
  count?: number;
}

export interface LoadedJsonlDataset {
  dataset: JsonlDatasetManifestEntry;
  jobs: JsonlJobDescription[];
}

const JSONL_MANIFEST_URL = '/data/manifest.json';

let manifestPromise: Promise<JsonlDatasetManifestEntry[]> | null = null;
const jobsPromises = new Map<string, Promise<JsonlJobDescription[]>>();

function parseJsonl<T>(raw: string): T[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T);
}

function parseJsonlJobs(raw: string): JsonlJobDescription[] {
  return parseJsonl<JsonlJobDescription>(raw).map((job, index) => ({
    ...job,
    id: typeof job.id === 'number' ? job.id : index,
  }));
}

function fetchJsonl(url: string, label: string): Promise<string> {
  return fetch(url).then((response) => {
    if (!response.ok) {
      throw new Error(`Unable to load ${label}: ${response.status}`);
    }
    return response.text();
  });
}

export function loadDatasetManifest(): Promise<JsonlDatasetManifestEntry[]> {
  if (!manifestPromise) {
    manifestPromise = fetch(JSONL_MANIFEST_URL).then((response) => {
      if (!response.ok) {
        throw new Error(`Unable to load dataset manifest: ${response.status}`);
      }
      return response.json() as Promise<JsonlDatasetManifestEntry[]>;
    });
  }
  return manifestPromise;
}

function resolveDataset(
  datasets: JsonlDatasetManifestEntry[],
  label?: string | null,
): JsonlDatasetManifestEntry {
  if (!datasets.length) {
    throw new Error('Dataset manifest is empty.');
  }
  return datasets.find((dataset) => dataset.label === label) ?? datasets[0];
}

export async function loadJsonlDataset(label?: string | null): Promise<LoadedJsonlDataset> {
  const datasets = await loadDatasetManifest();
  const dataset = resolveDataset(datasets, label);

  if (!jobsPromises.has(dataset.label)) {
    jobsPromises.set(
      dataset.label,
      fetchJsonl(dataset.url, `JSONL jobs for ${dataset.label}`).then(parseJsonlJobs),
    );
  }

  return {
    dataset,
    jobs: await jobsPromises.get(dataset.label)!,
  };
}

export function loadJsonlJobs(label?: string | null): Promise<JsonlJobDescription[]> {
  return loadJsonlDataset(label).then((loaded) => loaded.jobs);
}

export function findJsonlJobById(
  jobs: JsonlJobDescription[],
  id: string | null,
): JsonlJobDescription | undefined {
  if (!jobs.length) return undefined;
  if (!id) return jobs[0];

  return jobs.find((job) => (
    String(job.id) === id ||
    job.custom_id === id ||
    job.npc_seed === id
  ));
}

export function textFromJobHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}

export function excerptFromJobHtml(html: string, maxLength = 180): string {
  const text = textFromJobHtml(html);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

function sanitizeJobDocument(doc: Document): void {
  doc.querySelectorAll('script, iframe, object, embed, link, meta').forEach((node) => {
    node.remove();
  });

  doc.body.querySelectorAll('*').forEach((node) => {
    for (const attr of Array.from(node.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      if (name.startsWith('on') || value.startsWith('javascript:')) {
        node.removeAttribute(attr.name);
      }
    }
  });

  const rawUrlPattern = /https?:\/\/[^\s,<)]+/gi;
  const getUrlLabel = (url: string) => (
    url.includes('careers.example.test') ? 'job post link' : 'external link'
  );

  doc.body.querySelectorAll('span').forEach((span) => {
    const text = span.textContent ?? '';
    if (!rawUrlPattern.test(text)) return;

    rawUrlPattern.lastIndex = 0;
    span.removeAttribute('style');
  });

  doc.body.querySelectorAll('a').forEach((link) => {
    const href = link.getAttribute('href')?.trim() ?? '';
    const text = (link.textContent ?? '').trim();
    const looksLikeRawUrl = /^https?:\/\/\S+/i.test(text);
    if (!looksLikeRawUrl) return;

    link.setAttribute('data-raw-url-link', 'true');
    link.setAttribute('title', href);
    link.textContent = getUrlLabel(href || text);
  });

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    textNodes.push(current as Text);
    current = walker.nextNode();
  }

  textNodes.forEach((textNode) => {
    const parent = textNode.parentElement;
    if (parent?.closest('a')) return;

    const value = textNode.nodeValue ?? '';
    if (!rawUrlPattern.test(value)) return;

    rawUrlPattern.lastIndex = 0;
    textNode.nodeValue = value.replace(rawUrlPattern, getUrlLabel);
  });
}

export function sanitizeJobHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  sanitizeJobDocument(doc);

  return doc.body.innerHTML;
}

export function previewJobHtml(html: string, maxBlocks = 3): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  sanitizeJobDocument(doc);

  const previewBlocks = Array.from(doc.body.children)
    .filter((node) => (node.textContent ?? '').trim().length > 0)
    .slice(0, maxBlocks)
    .map((node) => node.outerHTML);

  if (previewBlocks.length > 0) {
    return previewBlocks.join('');
  }

  const excerpt = excerptFromJobHtml(html, 420);
  return excerpt ? `<p>${excerpt}</p>` : '';
}
