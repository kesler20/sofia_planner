# Sofia authentication and data boundaries

```mermaid
flowchart TD
    Website["Public website on GitHub Pages"] -->|Try demo| Demo["Demo app"]
    Website -->|Personal sign-in| Personal["Personal app"]
    Preference["Browser preference"] -.->|Skip website on return| Personal
    Demo --> Samples["Synthetic sample resources"]
    Samples <--> Local["Demo storage in this browser"]
    Personal --> Auth0["Auth0 authorization code + PKCE"]
    Auth0 <-->|Verify Google identity or reuse session| Google["Google sign-in"]
    Auth0 -->|Signed API access token| Personal
    Personal -->|Bearer token on every resource request| API["One Fly.io resource API"]
    API --> Signature{"Valid RS256 signature, issuer, audience and expiry?"}
    JWKS["Auth0 public signing keys"] -.->|Verify signature| Signature
    Signature -->|No| Unauthorized["401 Authentication required"]
    Signature -->|Yes| Owner{"Subject matches configured owner?"}
    Owner -->|No| Forbidden["403 Personal access only"]
    Owner -->|Yes| Namespace["Configured owner account topic"]
    Namespace <--> Redis["Private resources in Redis"]
```

The public website and demo need no sign-in. Demo installs a local resource
transport and uses synthetic data, with changes stored only in that browser.
Its requests never fall through to the personal API. Reset demo removes its
local changes. Published analytics in demo remain illustrative sample results.

The saved personal-mode preference controls navigation only. It grants no
permission to read private resources. Direct demo and website links override it.
The personal app remembers the preference only after successful API authorization.
Signing out clears it. Tokens are held in memory. Session restoration after a
reload may require Auth0 session recovery or interactive Google sign-in.

## Personal sign-in and a resource read

```mermaid
sequenceDiagram
    actor User
    participant Browser as Sofia personal app
    participant Auth0
    participant Google
    participant API as Fly.io API
    participant Redis
    User->>Browser: Open personal planner
    Browser->>Auth0: Authorization request with state and PKCE
    Auth0->>Google: Confirm identity when needed
    Google-->>Auth0: Verified identity
    Auth0-->>Browser: Authorization code and state
    Browser->>Auth0: Exchange code with PKCE verifier
    Auth0-->>Browser: Signed API access token
    Browser->>API: GET /v1/account with bearer token
    API->>API: Verify token and exact owner subject
    API-->>Browser: Authorized account topic
    Browser->>Browser: Remember personal entry and mount pages
    Browser->>API: Resource read with bearer token
    API->>API: Verify owner and requested namespace
    API->>Redis: Read owner's resource
    Redis-->>API: Resource data
    API-->>Browser: Authorized resource data
```

Auth0 issues the API access token after Google confirms the user's identity.
The backend validates the Auth0 API token, rather than trusting a Google ID token,
an email claim or a caller-selected account name. The official JWT middleware
checks the signature using Auth0's public signing keys, together with the exact
issuer, API audience, expiry and subject. The keys can be cached by the middleware.

`AUTH0_OWNER_SUBJECT` is the immutable Google-linked identity allowed to use this
private deployment. `AUTH0_OWNER_ACCOUNT_TOPIC` selects the existing Redis namespace
containing its records. These values stay in private server configuration. Unknown
subjects are rejected and no visitor account is provisioned. Explicit topic paths
must equal the resolved owner's topic, or use the current-account alias `me`.
CORS restricts browser origins but does not replace token or owner validation.

Only one Fly app and one machine host the resource backend. GitHub Pages serves
static frontend assets. The demo has no backend service. Automation Engine publishes
through trusted direct Redis access independently of browser API authentication.

## Implementation references

- [App entry and remembered mode](../src/entry/appMode.ts)
- [Auth0 provider](../src/Auth0Provider.tsx)
- [Authorized account session](../src/auth/AccountSession.tsx)
- [Bearer header and session guard](../src/auth/resourceSession.ts)
- [Demo resource transport](../src/demo/demoStorage.ts)
- [Backend token and owner verification](../backend/src/infrastructure/auth/accountAuth.ts)
- [Resource route boundaries](../backend/src/app.ts)
