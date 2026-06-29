import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

export interface ParentChildDocuments {
  parents: Document[];
  children: Document[];
}

/**
 * Splits parent documents into child chunks while preserving parent references in metadata.
 */
export async function splitIntoParentChildDocuments(
  documents: Document[],
  chunkSize = 512,
  chunkOverlap = 64,
): Promise<ParentChildDocuments> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
  });

  const parents = documents.filter((d) => d.metadata.type === 'parent' || !d.metadata.type);
  const childDocs: Document[] = [];

  for (const parent of parents) {
    const parentId =
      (parent.metadata.parentId as string | undefined) ??
      (parent.metadata.key as string | undefined) ??
      `parent-${childDocs.length}`;

    const chunks = await splitter.splitDocuments([
      new Document({
        pageContent: parent.pageContent,
        metadata: { ...parent.metadata, parentId, type: 'parent' },
      }),
    ]);

    for (const [index, chunk] of chunks.entries()) {
      childDocs.push(
        new Document({
          pageContent: chunk.pageContent,
          metadata: {
            ...parent.metadata,
            type: 'child',
            parentId,
            chunkIndex: index,
          },
        }),
      );
    }
  }

  return { parents, children: childDocs.length > 0 ? childDocs : documents };
}

/**
 * Resolves retrieved child chunks back to their full parent document content.
 */
export function resolveParentDocuments(
  retrieved: Document[],
  allParents: Document[],
): Document[] {
  const parentMap = new Map<string, Document>();
  for (const parent of allParents) {
    const id =
      (parent.metadata.parentId as string | undefined) ??
      (parent.metadata.key as string | undefined);
    if (id) parentMap.set(id, parent);
  }

  const seen = new Set<string>();
  const resolved: Document[] = [];

  for (const doc of retrieved) {
    const parentId = doc.metadata.parentId as string | undefined;
    if (parentId && parentMap.has(parentId) && !seen.has(parentId)) {
      seen.add(parentId);
      resolved.push(parentMap.get(parentId)!);
    } else if (!parentId) {
      resolved.push(doc);
    }
  }

  return resolved;
}
