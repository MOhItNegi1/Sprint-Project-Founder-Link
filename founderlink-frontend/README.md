# FounderLink Frontend

Angular 21 frontend for the FounderLink microservices.

## Run

```bash
npm install
npm start
```

The dev server proxies API calls to the gateway at `http://localhost:8080`. Change `proxy.conf.json` if your gateway runs elsewhere.

## Covered API Areas

- Auth: register, login, refresh, logout
- Users: profile, update profile, admin user paging
- Startups: list, details, create, update, delete, approve, reject
- Investments: create, founder approval flow, my investments
- Notifications: list by user, mark as read
