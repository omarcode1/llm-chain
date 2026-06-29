# PR: Add user authentication middleware

## Summary
Implements JWT-based authentication for protected API routes.

## Changes
- Added AuthMiddleware validating Bearer tokens
- Updated UserController to require auth on PATCH/DELETE
- Added unit tests for token expiry edge cases

## Test Plan
1. POST /login with valid credentials returns JWT
2. Protected routes return 401 without token
3. Expired tokens return 401 with clear message

## Risks
- Token secret must be rotated in production
- Existing clients need to adopt Authorization header
