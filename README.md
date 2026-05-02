# FounderLink (Docker)

## Run everything

Prereqs: Docker Desktop + Docker Compose.

From the repo root:

```bash
docker compose up --build
```

## Useful URLs (host machine)

- Frontend: http://localhost:4200
- API Gateway: http://localhost:8080
- Eureka: http://localhost:8761
- Config Server: http://localhost:8888
- Zipkin: http://localhost:9411
- RabbitMQ UI: http://localhost:15672 (guest / guest)
- SonarQube: http://localhost:9000

## SonarQube

Start SonarQube:

```bash
docker compose up -d sonarqube
```

Scan all services (after creating a token in SonarQube):

```powershell
.\sonar\scan-all.ps1 -Token "<YOUR_TOKEN>"
```

## Notes

- Each domain service uses its own PostgreSQL database container:
  - Auth: `localhost:5433` (DB `founderlink_auth`)
  - Startup: `localhost:5434` (DB `founderlink_startup`)
  - Investment: `localhost:5435` (DB `founderlink_investment`)
  - Notification: `localhost:5436` (DB `founderlink_notification`)
- Spring Cloud Config is served from the local repo at `_config_repo_check` and uses the `docker` profile configs.
