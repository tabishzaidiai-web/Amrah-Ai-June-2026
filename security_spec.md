# Security Specification

## Data Invariants
1. Users can only access their own user document.
2. Users can only access their own generations subcollection.
3. User role (e.g., 'Admin') cannot be self-updated.
4. Generations must belong to a valid user ID.

## The "Dirty Dozen" Payloads (Examples)
1. User attempts to update another user's document.
2. User attempts to create a generation with another user's ID.
3. User attempts to inject a ghost field `role: 'Admin'` into their own profile.
4. User tries to access a generation ID outside their own subcollection.
5. Generation payload missing required `url`.
6. Generation payload with invalid `userId`.
7. User attempts to set `registrationDate` to a future timestamp.
8. User attempts to create a user document with an invalid ID.
9. Admin attempts to elevate another user to Admin (should be restricted or server-side).
10. Attempt to read PII from another user's profile document.
11. Attempt to inject a 1MB string into the `url` field.
12. Attempt to bypass the `email_verified` check by spoofing an admin email.
