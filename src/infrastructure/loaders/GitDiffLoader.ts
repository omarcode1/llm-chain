import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { Document } from '@langchain/core/documents';

const execFileAsync = promisify(execFile);

export interface GitDiffLoaderOptions {
  repoPath: string;
  branch?: string;
  diffPath?: string;
}

/**
 * Loads git diffs from a branch comparison or patch file into LangChain Documents.
 */
export class GitDiffLoader {
  constructor(private readonly options: GitDiffLoaderOptions) {}

  /**
   * Loads diff content as a parent document for RAG and PR generation.
   */
  async load(): Promise<Document[]> {
    let diffContent: string;

    if (this.options.diffPath) {
      diffContent = await readFile(this.options.diffPath, 'utf-8');
    } else if (this.options.branch) {
      const { stdout } = await execFileAsync(
        'git',
        ['diff', `origin/main...${this.options.branch}`],
        { cwd: this.options.repoPath, maxBuffer: 10 * 1024 * 1024 },
      );
      diffContent = stdout || '(empty diff)';
    } else {
      const { stdout } = await execFileAsync('git', ['diff', 'HEAD'], {
        cwd: this.options.repoPath,
        maxBuffer: 10 * 1024 * 1024,
      });
      diffContent = stdout || '(empty diff)';
    }

    const truncated =
      diffContent.length > 50000
        ? `${diffContent.slice(0, 50000)}\n\n...(diff truncated)`
        : diffContent;

    return [
      new Document({
        pageContent: truncated,
        metadata: {
          source: 'git',
          branch: this.options.branch ?? 'working-tree',
          type: 'parent',
          parentId: `diff-${this.options.branch ?? 'head'}`,
        },
      }),
    ];
  }
}
