# Preserve user identities and Argon2 credentials when adopting Better Auth

We replace custom JWT authentication with Better Auth database sessions while keeping the existing user IDs, favorites, and GitHub API tokens. The migration moves the existing Argon2 hashes into credential accounts and configures Better Auth to continue using Argon2, rather than forcing password resets or remapping every user relationship. Existing JWT sessions are intentionally not accepted; users sign in again, and the migration is an explicit transactional deployment step rather than a startup side effect.
