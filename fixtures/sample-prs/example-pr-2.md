# PR: Fix pagination bug in task list endpoint

## Summary
Fixes off-by-one error causing empty last page in GET /api/v1/tasks.

## Changes
- Corrected skip calculation in ListTasksUseCase
- Added regression test for page boundary

## Test Plan
1. Seed 25 tasks, request page 3 with limit 10
2. Verify 5 tasks returned (not 0)

## Risks
- Low risk; isolated to pagination logic
