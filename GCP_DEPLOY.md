# Deploy on Google Cloud (Cloud Run + Cloud SQL)

Single Cloud Run service built from the root `Dockerfile` (the backend serves both the API and the SPA), with PostgreSQL on Cloud SQL connected through the Cloud Run Unix socket.

| Resource | Value |
|---|---|
| Project | `starred-randomizer-ruben` |
| Region | `europe-west8` (Milano) |
| Cloud Run service | `starred-randomizer` |
| Cloud SQL instance | `starred-db` (Postgres 15, `db-f1-micro`) |
| Database / user | `starred_randomizer` / `app` |
| Secrets (Secret Manager) | `GITHUB_TOKEN`, `JWT_SECRET`, `COOKIE_SECRET`, `DB_PASSWORD` |

## One-time setup

```bash
P=starred-randomizer-ruben
R=europe-west8

gcloud services enable run.googleapis.com sqladmin.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com secretmanager.googleapis.com --project $P

# Cloud SQL
gcloud sql instances create starred-db --project $P --database-version=POSTGRES_15 \
  --edition=ENTERPRISE --tier=db-f1-micro --region=$R --storage-size=10GB
gcloud sql databases create starred_randomizer --instance starred-db --project $P

# Secrets
for s in JWT_SECRET COOKIE_SECRET DB_PASSWORD; do
  openssl rand -hex 32 | tr -d '\n' | gcloud secrets create $s --project $P --data-file=-
done
printf %s "<github-token>" | gcloud secrets create GITHUB_TOKEN --project $P --data-file=-

gcloud sql users create app --instance starred-db --project $P \
  --password="$(gcloud secrets versions access latest --secret DB_PASSWORD --project $P)"

# IAM for the default Compute service account (used by Cloud Run)
SA=$(gcloud projects describe $P --format='value(projectNumber)')-compute@developer.gserviceaccount.com
gcloud projects add-iam-policy-binding $P --member=serviceAccount:$SA --role=roles/secretmanager.secretAccessor
gcloud projects add-iam-policy-binding $P --member=serviceAccount:$SA --role=roles/cloudsql.client
```

## Deploy / redeploy

From the repo root:

```bash
P=starred-randomizer-ruben
CONN=$P:europe-west8:starred-db

gcloud run deploy starred-randomizer --project $P --source . --region europe-west8 \
  --allow-unauthenticated --port 8080 --min-instances 0 --max-instances 2 \
  --add-cloudsql-instances $CONN \
  --set-env-vars NODE_ENV=production,DB_HOST=/cloudsql/$CONN,DB_USER=app,DB_NAME=starred_randomizer,DB_SSL=false \
  --set-secrets GITHUB_TOKEN=GITHUB_TOKEN:latest,JWT_SECRET=JWT_SECRET:latest,COOKIE_SECRET=COOKIE_SECRET:latest,DB_PASSWORD=DB_PASSWORD:latest
```

Later redeploys only need `gcloud run deploy starred-randomizer --project $P --source . --region europe-west8` (env vars and secrets are kept).

`DB_HOST` points to the Cloud SQL socket directory; `pg` treats a path as a Unix socket, so no TLS (`DB_SSL=false`). Tables are created automatically on startup.

## Rotate the GitHub token

```bash
printf %s "<new-token>" | gcloud secrets versions add GITHUB_TOKEN --project starred-randomizer-ruben --data-file=-
gcloud run services update starred-randomizer --project starred-randomizer-ruben --region europe-west8
```

## Logs

```bash
gcloud run services logs read starred-randomizer --project starred-randomizer-ruben --region europe-west8
```

## Costs

Cloud SQL `db-f1-micro` is ~$9–10/month even when idle; Cloud Run with `min-instances 0` is essentially within the free tier.
