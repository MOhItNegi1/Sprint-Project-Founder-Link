# Founder Link Data Seeder

Standalone Spring Boot project for loading local demo data into the Founder Link microservice databases.

## Folder Structure

```text
data-seeder/
  pom.xml
  README.md
  src/main/resources/application.properties
  src/main/java/com/founderlink/seeder/
    DataSeederApplication.java
    auth/
      Role.java
      User.java
      UserDetails.java
      UserRepository.java
      UserDetailsRepository.java
    config/
      DataSourceConfig.java
    startup/
      SeedData.java
      StartupSeedData.java
      SeederRunner.java
```

## What It Seeds

- 10 founder users: `founder1@test.com` through `founder10@test.com`
- 5 investor users: `investor1@test.com` through `investor5@test.com`
- BCrypt encoded password for every account: `Password@123`
- User profile rows in `user_details`
- 1 meaningful startup for every founder
- 3 investments for every startup, with mixed `PENDING`, `APPROVED`, `REJECTED`, and `COMPLETED` states
- Founder and investor notifications

The seeder is idempotent. It checks existing emails, startups, investments, and notifications before inserting.

## Database Config

The default ports match this repository's `docker-compose.yml`:

- Auth DB: `localhost:5433/founderlink_auth`
- Startup DB: `localhost:5434/founderlink_startup`
- Investment DB: `localhost:5435/founderlink_investment`
- Notification DB: `localhost:5436/founderlink_notification`

If your Docker PostgreSQL is exposed on `localhost:5432`, edit `src/main/resources/application.properties` and change the ports to `5432`.

The JDBC URLs include `?options=-c%20TimeZone=Asia/Kolkata`. This is the PostgreSQL-supported IANA name for Indian Standard Time; it is the same `+05:30` zone people often refer to as `Asia/Calcutta`.

Schema changes are disabled:

```properties
spring.jpa.hibernate.ddl-auto=none
spring.sql.init.mode=never
```

## Run Locally

Start your existing Docker databases first, then run:

```powershell
cd C:\Users\mohit\Desktop\FounderLink\data-seeder
mvn spring-boot:run
```

The app exits after seeding. You can delete the whole `data-seeder` folder after execution.

## Login Credentials

All seeded accounts use the same raw password. The database stores only the BCrypt hash.

```text
Password for every seeded user: Password@123

Founders:
founder1@test.com / Password@123
founder2@test.com / Password@123
founder3@test.com / Password@123
founder4@test.com / Password@123
founder5@test.com / Password@123
founder6@test.com / Password@123
founder7@test.com / Password@123
founder8@test.com / Password@123
founder9@test.com / Password@123
founder10@test.com / Password@123

Investors:
investor1@test.com / Password@123
investor2@test.com / Password@123
investor3@test.com / Password@123
investor4@test.com / Password@123
investor5@test.com / Password@123
```
