# Deploy on Google Cloud (Cloud Run + Cloud SQL)

Single Cloud Run service built from the root `Dockerfile` (the backend serves both the API and the SPA), with a dedicated application database on a shared Cloud SQL instance connected through a Unix socket.

| Resource | Value |
|---|---|
| Cloud Run / secrets / images project | `starred-randomizer-ruben` |
| Cloud SQL project | `jellyfin-ruben-12963` |
| Region | `europe-west8` (Milano) |
| Cloud Run service | `starred-randomizer` |
| Cloud SQL instance | `randomizer-pg16` (shared PostgreSQL 16) |
| Database / user | `starred_randomizer_cloudrun` / `starred_cloudrun_app` |
| DB password binding | `DB_PASSWORD=SHARED_DB_PASSWORD:2` |
| Other secrets (Secret Manager) | `GITHUB_TOKEN`, `BETTER_AUTH_SECRET` |
| Pool / maximum service instances | `DB_POOL_MAX=2` / `1` |
| Public service URL | `https://starred-randomizer-wglkbby7aa-oc.a.run.app` |
| Frontend origin / alternate service URL | `https://starred-randomizer-720866624958.europe-west8.run.app` |

## Existing infrastructure

```bash
P=starred-randomizer-ruben
R=europe-west8

gcloud services enable run.googleapis.com sqladmin.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com secretmanager.googleapis.com --project $P

# Inspect metadata only; do not print secret values.
gcloud sql instances describe randomizer-pg16 --project jellyfin-ruben-12963 \
  --format='json(state,connectionName,settings.backupConfiguration)'
```

The service already has access to its database through the existing cross-project service account permissions. Reuse those bindings rather than recreating the instance, users, or shared password. Never replace the shared instance configuration or restore the whole instance over other applications to roll back this app.

## Deploy / redeploy

Before the first Better Auth deployment (including an empty database), build the new image and run its `node backend/dist/migrate-auth.js` command as a controlled one-off job with the same Cloud SQL connection, database settings, and `BETTER_AUTH_SECRET` as the service. For existing data, take a full backup and stop all old application instances/writes first. See the migration and rollback instructions in [README.md](README.md#initialize-or-migrate-authentication). Do not run the old version against the migrated database; restoring the old application also requires restoring the backup. The web server only checks migration status and does not change the schema automatically.

Set `APP_ORIGIN` to the service's public HTTPS origin (no path or trailing slash). Preserve the existing frontend origin separately; Better Auth trusts both its base URL and the configured frontend origin.

From the repo root:

```bash
P=starred-randomizer-ruben
CONN=jellyfin-ruben-12963:europe-west8:randomizer-pg16
APP_ORIGIN=https://starred-randomizer-wglkbby7aa-oc.a.run.app
FRONTEND_ORIGIN=https://starred-randomizer-720866624958.europe-west8.run.app
: "${TRUST_PROXY_HOPS:?Set the verified fixed number of trusted proxy hops for this deployment}"
: "${IMAGE:?Set the immutable image URL produced by the validated release build}"

gcloud run deploy starred-randomizer --project $P --image "$IMAGE" --region europe-west8 \
  --port 8080 --min-instances 0 --max-instances 1 \
  --update-env-vars NODE_ENV=production,DB_HOST=/cloudsql/$CONN,DB_USER=starred_cloudrun_app,DB_NAME=starred_randomizer_cloudrun,DB_SSL=false,DB_POOL_MAX=2,BETTER_AUTH_URL=$APP_ORIGIN,CORS_ORIGIN=$FRONTEND_ORIGIN,TRUST_PROXY_HOPS=$TRUST_PROXY_HOPS \
  --update-secrets BETTER_AUTH_SECRET=BETTER_AUTH_SECRET:1 \
  --remove-secrets JWT_SECRET,COOKIE_SECRET
```

The command deliberately preserves the existing GitHub and shared database password secret bindings, Cloud SQL attachment, service account, IAM policy, and unrelated service settings. Use a tested image digest for redeploys.

For the first Better Auth cutover, temporarily disable only this service with `gcloud run services update starred-randomizer --scaling=0 --project $P --region europe-west8`. Wait for in-flight requests to finish, then create and verify a fresh backup on `randomizer-pg16` in `jellyfin-ruben-12963` before executing the migration job. Keep scaling at zero through migration and deployment, route all traffic to the new revision, and only then restore `--scaling=auto`. A failed migration transaction leaves the old schema intact; after a successful migration, do not re-enable the old image.

`DB_HOST` points to the Cloud SQL socket directory; `pg` treats a path as a Unix socket, so no TLS (`DB_SSL=false`). Schema changes require the explicit migration step. Remove obsolete JWT/cookie secret bindings when transitioning an existing service. After migration all users sign in again with their existing passwords.

Authentication limits are stored in PostgreSQL and shared by instances. Set `TRUST_PROXY_HOPS` only after verifying the request chain for your Cloud Run ingress, including any additional load balancer or CDN; the application intentionally does not infer this count from the platform name. With the default `0`, all clients of a proxy may share a login bucket. Positive values require that requests cannot bypass the trusted proxies or use a shorter route. Verify distinct client IPs and resistance to spoofed `X-Forwarded-For` prefixes in staging before rollout.

## Rotate the GitHub token

```bash
printf %s "<new-token>" | gcloud secrets versions add GITHUB_TOKEN --project starred-randomizer-ruben --data-file=-
gcloud run services update starred-randomizer --project starred-randomizer-ruben --region europe-west8
```

## Logs

```bash
gcloud run services logs read starred-randomizer --project starred-randomizer-ruben --region europe-west8
```

## Shared database recovery

Cloud SQL has automated backups and point-in-time recovery. Record the backup ID created for each schema-changing release. If rollback requires old application code, recover the application's database from a backup/clone and coordinate the switch; restoring the complete shared instance in place would overwrite other applications. This migration does not modify their databases.
