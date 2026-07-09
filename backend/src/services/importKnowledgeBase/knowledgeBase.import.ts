/**
 * Knowledge Base Import Module
 * Implements the import framework for Knowledge Base module.
 */

import {
  BaseImportValidator,
  BaseImportExecutor,
  createImportRecordResult,
  registerImportModule
} from '../importFramework/importFramework.index.js';
import {
  ImportInput,
  ImportRecordResult,
  ColumnMapping
} from '../importFramework/importFramework.types.js';
import { normalizeValue } from '../importFramework/importFramework.parser.js';
import { createKnowledgeBaseArticle } from '../knowledgeBase.service.js';

// Status options
const VALID_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED', 'REVIEW'];

// ============================================================================
// Knowledge Base Validator
// ============================================================================

class KnowledgeBaseImportValidator extends BaseImportValidator {
  getColumnMappings(): ColumnMapping {
    return {
      title: ['title', 'subject', 'name', 'article title', 'article name', 'topic'],
      category: ['category', 'type', 'kind', 'section', 'folder', 'group'],
      body: ['body', 'content', 'description', 'details', 'text', 'article body'],
      status: ['status', 'state', 'stage'],
      authorName: ['author', 'author name', 'author_name', 'created by', 'writer']
    };
  }

  getRequiredFields(): string[] {
    return ['title', 'category'];
  }

  protected getEntityName(): string {
    return 'knowledge base article';
  }

  protected getModuleDisplayName(): string {
    return 'Knowledge Base';
  }

  protected validateRowData(
    row: Record<string, unknown>,
    rowNumber: number,
    _context: import('../importFramework/importFramework.types.js').ValidationContext,
    columnMap: Record<string, string | undefined>
  ): import('../importFramework/importFramework.types.js').FieldError[] {
    const errors: import('../importFramework/importFramework.types.js').FieldError[] = [];

    const status = normalizeValue(columnMap['status'] ? row[columnMap['status']] : row['Status']);

    if (status && !VALID_STATUSES.includes(status.toUpperCase())) {
      errors.push({
        row: rowNumber,
        field: 'Status',
        message: `Invalid status. Allowed: ${VALID_STATUSES.join(', ')}`
      });
    }

    return errors;
  }

  protected normalizeRowData(
    row: Record<string, unknown>,
    rowNumber: number,
    columnMap: Record<string, string | undefined>
  ): ImportInput {
    const title = normalizeValue(columnMap['title'] ? row[columnMap['title']] : row['Title']);
    const category = normalizeValue(columnMap['category'] ? row[columnMap['category']] : row['Category']);
    const body = normalizeValue(columnMap['body'] ? row[columnMap['body']] : row['Body']);
    const status = normalizeValue(columnMap['status'] ? row[columnMap['status']] : row['Status']);
    const authorName = normalizeValue(columnMap['authorName'] ? row[columnMap['authorName']] : row['AuthorName']);

    return {
      title,
      category,
      body: body || undefined,
      status: status || 'DRAFT',
      authorName: authorName || undefined,
      importedRow: rowNumber
    };
  }
}

// ============================================================================
// Knowledge Base Executor
// ============================================================================

class KnowledgeBaseImportExecutor extends BaseImportExecutor {
  protected getEntityName(): string {
    return 'knowledge base article';
  }

  async importRecord(input: ImportInput): Promise<ImportRecordResult> {
    try {
      const article = await createKnowledgeBaseArticle({
        title: input.title as string,
        category: input.category as string,
        body: input.body as string | undefined,
        status: input.status as string | undefined,
        authorName: input.authorName as string | null | undefined
      });

      return createImportRecordResult(true, input, { id: article.id });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return createImportRecordResult(false, input, { error: errorMessage });
    }
  }
}

// ============================================================================
// Module Registration
// ============================================================================

const knowledgeBaseValidator = new KnowledgeBaseImportValidator();
const knowledgeBaseExecutor = new KnowledgeBaseImportExecutor();

export function registerKnowledgeBaseImport(): void {
  registerImportModule('knowledge-base', () => knowledgeBaseValidator, () => knowledgeBaseExecutor);
}

export { knowledgeBaseValidator, knowledgeBaseExecutor };
