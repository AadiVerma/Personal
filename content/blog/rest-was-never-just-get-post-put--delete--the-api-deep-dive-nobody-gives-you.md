---
title: "REST Was Never Just GET, POST, PUT & DELETE — The API Deep Dive Nobody Gives You"
date: "2026-09-05"
excerpt: "Forget CRUD tutorials. Let’s unpack what APIs actually mean — REST, HTTP semantics, idempotency, caching, HATEOAS, GraphQL, gRPC, WebSockets, and the brand-new QUERY method."
image: "https://res.cloudinary.com/dq93uuksm/image/upload/v1788636646/ChatGPT_Image_Sep_6_2026_01_00_12_AM_hcknpi.png"
---


Most developers learn APIs like this:

```text
GET     → Read
POST    → Create
PUT     → Update
DELETE  → Delete
```
Then they build a few endpoints:

```text
GET    /users
GET    /users/42
POST   /users
PUT    /users/42
DELETE /users/42
```
And someone says:

> "Congratulations. You know REST."

Not really.

You know **CRUD over HTTP**.

REST is considerably deeper than that.

And HTTP itself is much more interesting than the five methods most API tutorials teach.

In fact, as of **June 2026**, HTTP has a standardized `QUERY` method designed specifically for safe, idempotent requests that need to carry a request body — something developers have historically abused `POST` for.

So let's step back and build the real mental model.

---

# 1. First: An API Is Not REST

This distinction is surprisingly important.

**API** is the general concept.

An API is simply a contract through which one piece of software interacts with another.

For example:

```text
Frontend
   ↓
  API
   ↓
Backend
   ↓
Database
```

REST is **one architectural style** for designing APIs.
Other common approaches include:

```text
REST
GraphQL
gRPC
SOAP
WebSockets
Server-Sent Events
Webhooks
RPC-style APIs
```
These aren't merely different syntaxes.

They represent different ways of thinking about communication.

---
# 2. The Most Important Mental Model: Resource vs Representation
This is where REST starts becoming interesting.

Suppose you have:

```text
/users/42
```
That URL identifies a **resource**.

It does not necessarily mean:

> "Here is some JSON stored at this location."

The resource is an abstract thing managed by the server.

Its representation might be:

```json
{
  "id": 42,
  "name": "Aditya",
  "email": "aditya@example.com"
}
```
But the same resource could potentially have another representation:

```text
JSON
XML
HTML
CSV
```
This distinction is part of HTTP's underlying model: clients manipulate or transfer **representations of resources**, rather than directly manipulating the server's internal objects or database rows.

Think:

```text
Resource
   │
   ├── JSON representation
   ├── XML representation
   └── HTML representation
```

That is why the HTTP headers:

```http
Accept
Content-Type
```
matter so much.

---
# 3. REST Is an Architectural Style
REST was introduced by Roy Fielding as a set of architectural constraints.

The commonly discussed constraints are:
### 1. Client–Server

Client and server have separate responsibilities.

```text
Client
  ↓
HTTP
  ↓
Server
```
The client doesn't need to know how the server stores data.

The server doesn't need to know how the client renders it.

---

### 2. Statelessness

Every request should contain everything necessary for the server to understand it.

For example:

```http
GET /orders/123
Authorization: Bearer <token>
```

The server should not depend on some mysterious conversational state from request #17.

This doesn't mean the application has no state.

The **resource can have state**.

The important idea is that the server shouldn't need to remember the client's interaction history in order to interpret the next request. HTTP itself is defined as stateless in this sense.

---

### 3. Cacheability
Responses should explicitly communicate whether they can be cached.

This is one of REST's most underrated advantages.

Imagine:

```text
GET /products/123
```

The response might include:

```http
Cache-Control: max-age=300
ETag: "abc123"
```

Now a browser, CDN, proxy, or other cache can potentially avoid repeatedly hitting your application.
REST isn't merely:

```text
Client → Server
```

It can become:

```text
Client
   ↓
CDN
   ↓
Cache
   ↓
Load Balancer
   ↓
Server
```
HTTP was designed with intermediaries and caching in mind.

---
### 4. Uniform Interface

This is probably the most important REST constraint.

Instead of inventing custom operations everywhere:

```text
/getUser
/createUser
/updateUser
/deleteUser
```

you use a consistent interface:

```text
GET    /users/42
POST   /users
PUT    /users/42
DELETE /users/42
```

The **method carries semantics**.
The URI identifies the target.

The representation describes state.

That separation is what makes HTTP APIs predictable.

---
### 5. Layered System

The client doesn't necessarily communicate directly with the application server.

There could be:

```text
Client
   ↓
CDN
   ↓
WAF
   ↓
API Gateway
   ↓
Load Balancer
   ↓
Service
   ↓
Database
```

Each layer can perform a specific responsibility without the client needing to know the complete architecture.

---
# 4. REST vs "RESTful"

You'll often hear:

> "This is a REST API."

But many APIs called REST APIs aren't strictly RESTful.

For example:

```text
POST /getUser
POST /deleteUser
POST /updateUser
```

These are perfectly valid HTTP APIs.

But they don't make strong use of HTTP's uniform interface.

A more resource-oriented design would be:

```text
GET    /users/42
DELETE /users/42
PATCH  /users/42
```

So there is a spectrum:

```text
RPC over HTTP
      ↓
HTTP API
      ↓
Resource-oriented API
      ↓
RESTful API
      ↓
REST with stronger hypermedia constraints
```
# 5. HTTP Methods Are Semantics, Not CRUD Labels

This is one of the biggest misconceptions.

`GET` does not mean "database SELECT."

`POST` does not mean "database INSERT."

`PUT` does not mean "database UPDATE."

The methods describe **intent at the HTTP layer**.

Your backend implementation could involve:

```text
GET → Redis
POST → Kafka
PUT → PostgreSQL
DELETE → event queue
```

HTTP doesn't care.

---
# 6. Safe vs Idempotent — Two Concepts People Constantly Mix Up

### Safe

A method is **safe** when its intended semantics are read-only.

Examples:

```text
GET
HEAD
OPTIONS
QUERY
```

A server can still log requests or perform incidental side effects.

For example:

```text
GET /article/123
```

could increment an analytics counter.

That doesn't make GET semantically unsafe.

---

### Idempotent

A method is idempotent if repeating the same request has the same **intended effect** as making it once.

For example:

```http
PUT /users/42

{
  "name": "Aditya"
}
```

Send it once:

```text
name = Aditya
```

Send it ten times:

```text
name = Aditya
```

The intended state is still the same.

HTTP defines `PUT`, `DELETE`, and safe methods as idempotent.

This matters enormously for retries.

Imagine:

```text
Client → Server
       PUT /users/42
       ↓
     SUCCESS
       ↓
Network connection dies
```

The client doesn't know whether the server processed it.

Because PUT is idempotent, retrying is generally safe.

With:

```text
POST /payments
```

blindly retrying could potentially create two operations.

That's why idempotency isn't theoretical trivia.

It directly affects distributed-system reliability.

---
# 7. GET

`GET` asks for the current selected representation of a resource.

```http
GET /users/42
```

A subtle but important detail:

**GET is not "retrieve from database."**

The server could return:

```text
database data
cached data
computed data
aggregated data
another service's data
```

The implementation is irrelevant to the HTTP semantics.

GET responses are also naturally suited to caching.

---

# 8. HEAD

`HEAD` is basically:

> "Give me the response metadata without the response content."

For example:

```http
HEAD /video/movie.mp4
```

You might receive:

```http
Content-Length: 824734823
Content-Type: video/mp4
ETag: "abc"
```

without downloading the actual video.

Useful for:

```text
Existence checks
File metadata
Cache validation
Content size
Conditional requests
```

---

# 9. POST

POST means:

> Process this representation according to the semantics of the target resource.

That's much broader than:

> "Create a database record."

For example:

```http
POST /orders
```

could create an order.

But:

```http
POST /payments/123/refund
```

could initiate a refund.

Or:

```http
POST /search
```

could execute a complex search.

POST is intentionally flexible.

The tradeoff is that POST is **not inherently idempotent**.

---

# 10. PUT
PUT has a very specific semantic:

> Replace the state of the target resource with the enclosed representation.

For example:

```http
PUT /users/42
```

```json
{
  "name": "Aditya",
  "email": "a@example.com"
}
```

PUT is idempotent.

One common mistake is treating PUT as:

> "Update some fields."

That's usually what PATCH is better suited for.

---

# 11. PATCH

PATCH means:

> Apply partial modifications to a resource.

For example:

```http
PATCH /users/42
```

```json
{
  "email": "new@example.com"
}
```

The user doesn't need to send the entire resource.

But here's the interesting part:

**PATCH is not automatically idempotent.**

For example:

```json
{
  "operation": "increment",
  "amount": 1
}
```

Repeating that operation could produce:

```text
1 → 2 → 3
```

So PATCH's idempotency depends on the patch semantics.

---

# 12. DELETE

```http
DELETE /users/42
```

DELETE means remove the association between the target resource and its current functionality/state as defined by the resource.

It doesn't necessarily mean:

```sql
DELETE FROM users WHERE id = 42;
```

Your implementation could instead:

```text
mark deleted
disable resource
remove a mapping
enqueue deletion
cascade asynchronously
```

Again:

**HTTP describes semantics, not your database implementation.**

DELETE is idempotent.

Deleting something twice doesn't normally make the intended result "more deleted."

---

# 13. And Now: QUERY

This is where modern HTTP gets interesting.

Historically developers faced a problem.

Suppose you have a complicated search:

```text
POST /products/search
```

with:

```json
{
  "filters": {
    "category": ["laptop", "tablet"],
    "price": {
      "min": 500,
      "max": 2000
    }
  },
  "sort": ["price:asc"],
  "facets": true
}
```

Why POST?

Because GET request bodies don't have generally defined semantics in HTTP.

But POST has another problem:

```text
POST = potentially unsafe + non-idempotent
```

So intermediaries and clients can't treat it like a normal safe query.

This is exactly the gap `QUERY` addresses.

---

# 14. QUERY: The New HTTP Method

In **June 2026**, RFC 10008 standardized the HTTP `QUERY` method.

Its semantics are:

```text
QUERY
  ↓
safe
  ↓
idempotent
  ↓
request body allowed
  ↓
server processes query
  ↓
returns result
```

Conceptually:

```http
QUERY /products
Content-Type: application/json

{
  "filters": {
    "category": "laptop",
    "price": {
      "max": 2000
    }
  }
}
```

This is fundamentally different from:

```http
POST /products/search
```

because the method itself tells HTTP infrastructure:

> "This request is a safe, idempotent query."

That distinction can matter for retries, intermediaries, tooling, and future caching behavior.

The IETF registry now lists `QUERY` as **safe and idempotent**.

# 15. QUERY Does Not Mean "GET 2.0"

This is important.

`GET` still has an enormous advantage:

```text
GET /products?category=laptop&maxPrice=2000
```

The query is encoded in the URI.

That makes it naturally bookmarkable, shareable and compatible with existing infrastructure.

`QUERY` becomes interesting when the query itself is too complex or large to sensibly encode in a URI.

Think:

```text
Simple query
     ↓
GET

Complex structured query
     ↓
QUERY
```

Not:

```text
QUERY replaces GET
```

It doesn't.

---

# 16. HTTP Status Codes Are Part of the API Contract

A good API doesn't return:

```http
200 OK
```

for everything.

HTTP gives clients meaningful signals.

Common categories:

```text
2xx → Success
3xx → Redirection
4xx → Client-side problem
5xx → Server-side problem
```
# 19. Conditional Requests: One of HTTP's Best-Kept Secrets

Suppose:

```http
GET /users/42
```

returns:

```http
ETag: "abc123"
```

Later the client says:

```http
GET /users/42
If-None-Match: "abc123"
```

If nothing changed:

```http
304 Not Modified
```

No need to transfer the entire representation again.

This is **cache validation**.

But ETags become even more interesting when dealing with concurrent updates.

---

# 20. Preventing the Lost Update Problem

Imagine:

```text
Alice reads user
       ↓
name = Alice

Bob reads same user
       ↓
name = Bob
```

Now:

```text
Alice updates
Bob updates
```

Bob might accidentally overwrite Alice's change.

Conditional requests can solve this.

Client reads:

```http
ETag: "v10"
```

Then updates:

```http
PUT /users/42
If-Match: "v10"
```

If the resource has changed:

```text
412 Precondition Failed
```

Now the server refuses the stale update.

This is optimistic concurrency control implemented through HTTP semantics.

That's a very different level of API design than simply knowing `PUT`.

---
# 21. Content Negotiation

An API isn't necessarily locked to one representation.

The client can say:

```http
Accept: application/json
```

and tell the server what representation it prefers.

Similarly:

```http
Content-Type: application/json
```

describes what the client actually sent.

So:

```text
Accept
   ↓
"What format do I want?"

Content-Type
   ↓
"What format am I sending?"
```

These are fundamentally different concepts.

HTTP explicitly defines mechanisms for content negotiation.

---

# 22. Caching Is More Than Redis

When developers hear "API caching", they often think:

```text
Application → Redis
```

HTTP caching can happen outside your application:

```text
Browser
   ↓
CDN
   ↓
Reverse Proxy
   ↓
API Gateway
   ↓
Application
```

And the cache might make the application request unnecessary.

That's one reason HTTP's semantics are powerful.

Your API isn't necessarily communicating only with your application.

It's communicating through an ecosystem of intermediaries.

---

# 23. Pagination Is an API Design Problem, Not Just a SQL Problem

The naive approach:

```http
GET /users?page=5&limit=20
```

is easy.

But offset pagination becomes problematic at scale.

Imagine:

```text
OFFSET 1000000
LIMIT 20
```

The database may have to walk through huge amounts of data before reaching the requested window.

Cursor pagination instead looks like:

```http
GET /users?cursor=eyJpZCI6MTAwMH0
```

Conceptually:

```text
Page 1
  ↓
cursor ABC

Page 2
  ↓
cursor DEF

Page 3
  ↓
cursor XYZ
```

Now pagination is based on a position in an ordered dataset rather than an ever-growing offset.

---

# 24. HATEOAS: The REST Constraint Most "REST APIs" Ignore

HATEOAS stands for:

> Hypermedia As The Engine Of Application State

Instead of returning only:

```json
{
  "id": 42,
  "status": "pending"
}
```

a hypermedia-oriented API might return:

```json
{
  "id": 42,
  "status": "pending",
  "_links": {
    "self": "/orders/42",
    "cancel": "/orders/42/cancel",
    "payment": "/orders/42/payment"
  }
}
```

The response tells the client what actions/resources are available.

The client doesn't have to hard-code every possible transition.

This is one of the more demanding interpretations of REST, and it's why simply having JSON + HTTP verbs doesn't automatically mean an API fully embraces REST.

---
# 25. GraphQL
GraphQL flips the model.

Instead of saying:

```text
GET /users/42
GET /users/42/orders
GET /users/42/orders/123
```

the client describes the data it needs.

Example:

```graphql
query {
  user(id: 42) {
    name
    email
    orders {
      id
      total
    }
  }
}
```

The server exposes a typed schema.

The client controls the shape of the response.

GraphQL supports operations such as:

```text
query
mutation
subscription
```

and has a formal type system and introspection model.

### GraphQL shines when:

```text
Clients have different data requirements
Mobile bandwidth matters
Frontend teams need flexibility
Data comes from many backend sources
```

But flexibility comes with complexity:

```text
Query cost
Caching complexity
Authorization
N+1 queries
Schema governance
Potentially expensive nested queries
```

---
# 26. gRPC

gRPC is much more RPC-oriented.

Instead of:

```text
GET /users/42
```

you define a service:

```protobuf
service UserService {
  rpc GetUser(GetUserRequest) returns (User);
}
```

The client effectively calls:

```text
UserService.GetUser(...)
```

The interface is usually defined with Protocol Buffers.

gRPC is particularly attractive for:

```text
Microservice-to-microservice communication
Low-latency systems
Strong contracts
Streaming
Polyglot backend environments
```

gRPC supports unary and streaming communication patterns and uses Protocol Buffers as its common IDL/message format.

Mental model:

```text
REST:
Resource-oriented

gRPC:
Service/method-oriented
```

---

# 27. SOAP

SOAP is older and much more enterprise-oriented.

It typically revolves around XML-based messages and formally defined contracts.

You might encounter:

```text
WSDL
XML
SOAP Envelope
WS-Security
WS-ReliableMessaging
```

It is verbose compared with modern JSON APIs but can still make sense in highly regulated or legacy enterprise ecosystems.

Don't confuse:

```text
Old
```

with:

```text
Bad
```

Architectural decisions depend on the environment.

---

# 28. WebSockets

REST is fundamentally request/response:

```text
Client → Request
Server → Response
```

WebSockets create a persistent, bidirectional communication channel:

```text
Client ←────────→ Server
       messages
       messages
       messages
```

This is useful for:

```text
Chat
Live collaboration
Multiplayer games
Trading interfaces
Real-time dashboards
```

The server can push messages whenever necessary.

---

# 29. Server-Sent Events

SSE takes a different approach.

The client establishes a connection:

```text
Client → Server
```

and the server continuously sends events:

```text
Server → Client
Server → Client
Server → Client
```

Useful for:

```text
Notifications
Live feeds
Progress updates
AI streaming
Monitoring dashboards
```

Unlike WebSockets, communication is primarily server → client.

---

# 30. Webhooks

Webhooks invert the polling problem.

Without a webhook:

```text
Client:
"Did payment finish?"

Client:
"Did payment finish?"

Client:
"Did payment finish?"
```

With a webhook:

```text
Payment Provider
       ↓
POST /webhooks/payment
       ↓
Your Server
```

The provider tells you when something happened.

This is essentially:

> "Instead of repeatedly asking me, give me an address where I can notify you."

---

# 31. REST vs GraphQL vs gRPC vs WebSockets
A useful mental model:

```text
REST
│
├── Resource-oriented
├── HTTP-native
└── Great general-purpose API

GraphQL
│
├── Query-oriented
├── Client-controlled response shape
└── Great for complex data requirements

gRPC
│
├── RPC-oriented
├── Strong contracts
└── Great for service-to-service communication

WebSockets
│
├── Connection-oriented
├── Bidirectional
└── Great for real-time interaction
```

None of them "replaces" all the others.

---
# 32. Rate Limiting

Your API may be perfectly implemented and still fall over if clients can send unlimited traffic.

Common models:

```text
Fixed window
Sliding window
Token bucket
Leaky bucket
```

A response might communicate:

```http
429 Too Many Requests
```

and provide retry information.

Rate limiting is not just a security mechanism.

It is resource governance.

---
# 33. The API Gateway Is Not "The API"

In production architectures you might see:

```text
Client
   ↓
API Gateway
   ↓
Service A
Service B
Service C
Service D
```

The gateway might handle:

```text
Authentication
TLS termination
Rate limiting
Routing
Request transformation
Observability
Caching
WAF policies
```

But don't put every business rule there.

Otherwise your gateway becomes:

```text
The distributed monolith
```

---
# 34. The Bigger Picture

At the beginner level:

```text
REST API
   ↓
GET / POST / PUT / DELETE
```

At the intermediate level:

```text
REST
   ↓
Resources
HTTP methods
Status codes
JSON
```

At the senior level:

```text
REST
│
├── Resource semantics
├── HTTP semantics
├── Safe vs idempotent
├── Cacheability
├── Conditional requests
├── ETags
├── Content negotiation
├── Concurrency control
├── Hypermedia
├── Intermediaries
├── Retries
├── Idempotency keys
├── Pagination
├── Versioning
├── Rate limiting
├── Authentication
├── Authorization
└── Failure semantics
```

And beyond REST:
```text
             API
              │
      ┌───────┼────────┐
      ↓       ↓        ↓
     REST  GraphQL    gRPC
      │       │        │
      │       │        └── RPC
      │       │
      │       └──────────── Query-oriented
      │
      └──────────────────── Resource-oriented
```

And for real-time communication:

```text
WebSockets
SSE
Webhooks
```

There is no universally "best" API style.

The right question is:

> **What communication model matches the problem?**

---
```text
                 HTTP API
                    │
        ┌───────────┴───────────┐
        │                       │
     Resource                Semantics
        │                       │
      URI                  HTTP Method
                                │
                    ┌───────────┼───────────┐
                    ↓           ↓           ↓
                  Safe      Idempotent   Cacheable
                    │           │           │
                    └───────────┼───────────┘
                                ↓
                       Status + Headers
                                │
                 ┌──────────────┼──────────────┐
                 ↓              ↓              ↓
             Caching       Concurrency     Negotiation
                 │              │              │
                ETag         If-Match       Accept
                               │
                               ↓
                         API Reliability
                               │
              ┌────────────────┼────────────────┐
              ↓                ↓                ↓
           Retries       Idempotency       Rate Limits
```
And remember:

**REST is not CRUD.**

**HTTP is not merely a transport for JSON.**

**An API is not just a collection of endpoints.**

The real power comes from the semantics that sit underneath them.

And now HTTP has even gained a new standardized tool for a problem developers have been solving awkwardly for years:

```text
QUERY
```

A safe, idempotent HTTP method designed to carry complex query input without pretending that every query is a `POST`.

That's the part of API design worth understanding.

Not just:

```text
GET /users
```