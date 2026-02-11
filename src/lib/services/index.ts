/**
 * Services barrel export
 * 
 * Exports all service modules from a single entry point.
 */

// Service classes and instances
export { ListsService, listsService } from './lists.service';
export { TasksService, tasksService, type TaskFilterOptions } from './tasks.service';
export { SubtasksService, subtasksService } from './subtasks.service';
export { LabelsService, labelsService } from './labels.service';
export { RemindersService, remindersService } from './reminders.service';
export { AttachmentsService, attachmentsService } from './attachments.service';
export { SearchService, searchService, type SearchOptions, type CombinedSearchResult, type TaskSearchResult } from './search.service';
