/**
 * Import Framework
 * 
 * A reusable framework for importing data from Excel/CSV files.
 * 
 * Usage:
 * 1. Create a validator class extending BaseImportValidator
 * 2. Create an executor class extending BaseImportExecutor
 * 3. Register your module with ImportFramework
 * 4. Use ImportFramework.upload(), .validate(), and .execute() in routes
 * 
 * @example
 * ```typescript
 * // users.import.ts
 * import { BaseImportValidator, BaseImportExecutor } from './importFramework';
 * 
 * class UsersImportValidator extends BaseImportValidator {
 *   getColumnMappings() { return { name: ['name', 'full name'], email: ['email', 'e-mail'] }; }
 *   getRequiredFields() { return ['name', 'email']; }
 *   // ... implement validation logic
 * }
 * 
 * class UsersImportExecutor extends BaseImportExecutor {
 *   // ... implement import logic
 * }
 * 
 * export const usersImportValidator = new UsersImportValidator();
 * export const usersImportExecutor = new UsersImportExecutor();
 * ```
 */

// Types
export * from './importFramework.types.js';

// Parser
export * from './importFramework.parser.js';

// Validator
export * from './importFramework.validator.js';

// Importer
export * from './importFramework.importer.js';

// Framework orchestrator
export { 
  ImportFramework,
  importUpload,
  registerImportModule,
  getModuleValidator,
  getModuleExecutor,
  isModuleRegistered,
  getRegisteredModules,
  buildValidationContext,
  importErrorHandler
} from './importFramework.orchestrator.js';
