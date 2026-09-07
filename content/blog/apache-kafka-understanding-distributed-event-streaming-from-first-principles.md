---
title: "Apache Kafka: Understanding Distributed Event Streaming from First Principles"
date: "2026-09-03"
excerpt: "Understand Kafka from the ground up—its architecture, internals, use cases, and core design ideas."
image: "https://res.cloudinary.com/dq93uuksm/image/upload/v1788456995/ChatGPT_Image_Sep_3_2026_11_05_48_PM_azihx4.png"
---


# 1. Kafka in One Sentence

Apache Kafka is a distributed event-streaming platform that lets applications publish, store, read, and process streams of events reliably and at scale.

The Kafka documentation describes Kafka around three fundamental capabilities:

1. Publish and subscribe to streams of events.
2. Store those streams durably.
3. Process streams as they occur or retrospectively.

A useful mental model is:

``` text
                    KAFKA

Producer ────────→  Event Log  ────────→ Consumer
                         │
                         ├──────────────→ Consumer
                         │
                         └──────────────→ Consumer
```
The important word is **log**.

Kafka is not merely a place where messages wait to be consumed.

It is a **distributed, durable, append-only event log**.

------------------------------------------------------------------------

# 2. The Problem Kafka Solves

Imagine an e-commerce application.

You have:

``` text
Order Service
Payment Service
Inventory Service
Notification Service
Analytics Service
Fraud Service
```
A user places an order.

The Order Service needs to tell everyone:

``` text
OrderCreated
```
A naive architecture might look like:

``` text
                    ┌──→ Payment Service
                    │
Order Service ──────┼──→ Inventory Service
                    │
                    ├──→ Notification Service
                    │
                    ├──→ Analytics Service
                    │
                    └──→ Fraud Service
```

This works initially.

But as the system grows:

``` text
Order Service
     │
     ├── HTTP → Payment
     ├── HTTP → Inventory
     ├── HTTP → Notification
     ├── HTTP → Analytics
     ├── HTTP → Fraud
     ├── HTTP → Recommendation
     ├── HTTP → Shipping
     └── HTTP → Loyalty
```
Now the Order Service knows about almost everything.

### Problems
### 1. Tight coupling

The producer needs knowledge about consumers.

### 2. Consumer availability

What happens if Notification Service is down?

Should placing an order fail?

Usually, no.

### 3. Scaling

If Analytics suddenly needs to process millions of events, the producer should not care.

### 4. Replay

Suppose Fraud Detection was buggy for two hours.

Can we replay yesterday's events?

With normal synchronous APIs, not easily.

### 5. Multiple consumers

Different teams may want the same event for completely different reasons.

### 6. Backpressure

What happens when a consumer processes events slower than the producer creates them?

------------------------------------------------------------------------

## Kafka changes the architecture

``` text
                         ┌──→ Payment Service
                         │
                         ├──→ Inventory Service
                         │
Order Service ───────→ Kafka
                         ├──→ Notification Service
                         │
                         ├──→ Analytics Service
                         │
                         └──→ Fraud Service
```
The producer publishes an event.

Kafka stores it.

Consumers independently read it.

This creates **temporal and operational decoupling**.

------------------------------------------------------------------------

# 3. The Big Idea: Events

An **event** is a record that something happened.

Examples:

``` text
UserRegistered
OrderCreated
PaymentCompleted
PaymentFailed
ProductViewed
ShipmentCreated
TemperatureChanged
MoneyTransferred
```
An event might contain:

``` json
{
  "eventId": "evt-123",
  "eventType": "OrderCreated",
  "orderId": "order-9001",
  "userId": "user-42",
  "amount": 4999,
  "timestamp": "2026-09-03T18:30:00Z"
}
```

Kafka calls these records/events/messages.

Conceptually, an event has:

``` text
Key
Value
Timestamp
Headers
```
------------------------------------------------------------------------

# 4. Kafka Mental Model
If you remember only one diagram, remember this:

``` text
                         Kafka Cluster
              ┌─────────────────────────────┐
              │                             │
Producer ────→ │ Topic                      │
              │   │                         │
              │   ├── Partition 0           │
              │   ├── Partition 1           │
              │   └── Partition 2           │
              │                             │
              └──────────────┬──────────────┘
                             │
                 ┌───────────┴───────────┐
                 ↓                       ↓
          Consumer Group A        Consumer Group B
             │      │                  │
             ↓      ↓                  ↓
          Worker  Worker             Worker
```

And the key relationship is:

``` text
Topic
  ↓
Partitions
  ↓
Ordered Records
  ↓
Offsets
```
------------------------------------------------------------------------
# 5. Kafka Core Architecture
The main components are:
```text
                     Kafka Cluster
              ┌────────────────────────┐
              │                        │
              │  Broker 1              │
Producer ───→ │  Broker 2              │
              │  Broker 3              │
              │                        │
              └───────────┬────────────┘
                          │
                       Topic
                          │
              ┌───────────┼───────────┐
              ↓           ↓           ↓
             P0          P1          P2
             │           │           │
          replicas     replicas    replicas
              │           │           │
              └───────────┼───────────┘
                          ↓
                   Consumer Group
                    /      |      \
                   C1      C2      C3
```

> Partitions can be many per broker. Replicas of the same partition need distinct brokers.

Let's understand each one.
------------------------------------------------------------------------

# 6. Topics
A **topic** is a named stream/category of events.

Examples:

``` text
orders
payments
users
shipments
inventory-events
click-events
```

Think:

``` text
Topic = logical stream of related events
```

For example:

``` text
orders

OrderCreated
OrderCreated
OrderCancelled
OrderCreated
OrderShipped
...
```

A topic is not one physical file.

It is split into partitions.

``` text
orders
 ├── Partition 0
 ├── Partition 1
 ├── Partition 2
 └── Partition 3
```
------------------------------------------------------------------------
# 7. Partitions

A partition is an **ordered, append-only sequence of records**.

Example:

``` text
Partition 0

offset
  0   OrderCreated
  1   PaymentCompleted
  2   OrderShipped
  3   OrderDelivered
```

Another partition:

``` text
Partition 1

offset
  0   OrderCreated
  1   OrderCreated
  2   OrderCancelled
```

### Why partitions?

Because one machine/process cannot necessarily handle all traffic.

Partitions allow Kafka to distribute work.

``` text
                    Topic
                      │
          ┌───────────┼───────────┐
          ↓           ↓           ↓
       P0            P1          P2
          │           │           │
       Broker 1    Broker 2    Broker 3
```

More partitions means more potential parallelism.

------------------------------------------------------------------------

## The critical rule

Kafka guarantees ordering within a partition, not across an entire multi-partition topic.

If you need events for a particular entity to remain ordered, use a stable key.

For example:

``` text
key = userId
```

Kafka can consistently route events with the same key to the same partition.

Therefore:

``` text
User 42
  ↓
Partition 3

User 42
  ↓
Partition 3

User 42
  ↓
Partition 3
```

So their events can be processed in partition order.

------------------------------------------------------------------------

# 8. Offsets
Every record inside a partition gets an offset.

``` text
Partition 0

Offset    Event
------    ----------------
0         OrderCreated
1         PaymentStarted
2         PaymentCompleted
3         OrderShipped
4         OrderDelivered
```

Offset `3` means:

> The fourth record in this partition's log.

Offsets are unique **within a partition**.

This is important:

``` text
Partition 0 → offset 100
Partition 1 → offset 100
```

These are different records.

An offset is not globally unique across a topic.

------------------------------------------------------------------------

# 9. Producers

A producer publishes events to Kafka.

Conceptually:

``` java
producer.send(
    new ProducerRecord<>("orders", orderId, orderEvent)
);
```

The producer has to determine:

``` text
Which topic?
Which partition?
What key?
What serialization?
```
------------------------------------------------------------------------

## Partition selection

Conceptually:

``` text
record
  │
  ├── key exists?
  │       │
  │       ↓
  │    partitioner
  │       │
  │       ↓
  │    Partition N
  │
  └── no key?
          │
          ↓
       partitioning strategy
```

Using a key is often important for ordering.

For example:

``` text
key = customerId
```
means all events for that customer can be routed consistently to one partition.

------------------------------------------------------------------------

# 10. Consumers

Consumers read events from Kafka.

Conceptually:

``` java
while (true) {
    records = consumer.poll(...);

    for (record : records) {
        process(record);
    }
}
```

Unlike many traditional queues, the consumer's position is represented by an offset.

This makes it possible to move backward:

``` text
Current offset = 1000

Need to replay?

Move to:

offset = 800
```

Then process again.

This is one of Kafka's most powerful ideas.

------------------------------------------------------------------------
# 11. Consumer Groups

A consumer group is a set of consumers cooperating to consume a topic.

Suppose:

``` text
Topic: orders

P0
P1
P2
P3
```

Consumer group:

``` text
Group A

Consumer A1 → P0, P1
Consumer A2 → P2, P3
```

Each partition is assigned to one consumer within that group at a time.

-----------------------------------------------------------------------
## Scaling consumers
If:

``` text
4 partitions
4 consumers
```

you can have:

``` text
Consumer 1 → P0
Consumer 2 → P1
Consumer 3 → P2
Consumer 4 → P3
```

But:

``` text
4 partitions
6 consumers
```

means two consumers have no partition assigned.

Therefore:

> For a traditional Kafka consumer group, you cannot get more active
> partition-level parallelism than the number of partitions.

------------------------------------------------------------------------

# 12. Kafka as Queue + Pub/Sub

Kafka can behave like both.

## Queue-like behavior

One consumer group:

``` text
             Kafka
               │
       ┌───────┼───────┐
       ↓       ↓       ↓
      C1      C2      C3

       Same Consumer Group
```

Each event is processed by one consumer in the group.

------------------------------------------------------------------------
## Pub/Sub-like behavior

Multiple consumer groups:

``` text
                 Kafka
                   │
       ┌───────────┼───────────┐
       ↓           ↓           ↓
   Group A      Group B      Group C
      │            │            │
 Payment       Analytics    Notification
```

Each group independently tracks its position.

So the same event can be processed independently by all three groups.

------------------------------------------------------------------------
# 13. How a Message Travels Through Kafka

This is the flow to understand deeply.

``` text
Application
    │
    ↓
Producer API
    │
    ↓
Serialization
    │
    ↓
Partition Selection
    │
    ↓
Producer Batch
    │
    ↓
Network Request
    │
    ↓
Partition Leader
    │
    ↓
Append to Log
    │
    ↓
Replication
    │
    ↓
Acknowledgement
```
Then:

``` text
Kafka Partition
       │
       ↓
Consumer Fetch Request
       │
       ↓
Records returned
       │
       ↓
Consumer processing
       │
       ↓
Offset commit
```

------------------------------------------------------------------------
# 14. How Kafka Stores Data

This is where Kafka differs fundamentally from many messaging systems.

A partition behaves conceptually like:

``` text
append-only log

0 → event A
1 → event B
2 → event C
3 → event D
4 → event E
```

Kafka doesn't normally remove an event just because one consumer
processed it.

Instead, records are retained according to policies such as:

``` text
retention.ms
retention.bytes
```

So:

``` text
Producer
   ↓
Kafka Log

Consumer A ──→ offset 500
Consumer B ──→ offset 300
Consumer C ──→ offset 100
```

All can have independent positions.

------------------------------------------------------------------------

# 15. Replication and Fault Tolerance

A Kafka partition can have multiple replicas.

Example:

``` text
Replication Factor = 3

Partition P0

Broker 1 → Leader
Broker 2 → Follower
Broker 3 → Follower
```

The replicas maintain copies of the partition log.

Why?

Because machines fail.

Without replication:

``` text
Broker dies
   ↓
Data unavailable/lost
```

With replication:

``` text
Broker 1 dies

Broker 2 or 3
   ↓
Can take leadership
```

Kafka's replication unit is the **partition**.

------------------------------------------------------------------------
# 16. Leader, Followers and ISR

For a partition:

``` text
Partition 0

Broker 1 → Leader
Broker 2 → Follower
Broker 3 → Follower
```

The leader handles writes.

Followers replicate the leader's log.

Kafka also tracks an **ISR (In-Sync Replicas)** set.

Conceptually:

``` text
Leader
  │
  ├── Follower 1 ✓
  ├── Follower 2 ✓
  └── Follower 3 ✗   ← fallen behind
```

Only replicas sufficiently caught up are considered in-sync according to
Kafka's replication rules.

This matters when selecting a safe replica after failure.

------------------------------------------------------------------------
# 17. What Happens When a Broker Dies?

Suppose:

``` text
P0

Broker 1 → Leader
Broker 2 → Follower
Broker 3 → Follower
```

Broker 1 crashes.

Kafka can elect an eligible follower as the new leader:

``` text
P0

Broker 2 → New Leader
Broker 3 → Follower
Broker 1 → Down
```

Clients discover the new leadership through Kafka's metadata mechanisms.

This is how Kafka continues operating despite broker failures.

------------------------------------------------------------------------
# 18. Ordering Guarantees

Kafka's ordering guarantee is:

``` text
ORDERING
   ↓
within a partition
```

Not:

``` text
entire topic with many partitions
```

Example:

``` text
P0:
A1
A2
A3

P1:
B1
B2
B3
```

Kafka does not promise a global ordering such as:

``` text
A1
B1
A2
B2
...
```

------------------------------------------------------------------------

## How to preserve order for an entity

Use a key.

``` text
key = orderId
```

Then:

``` text
Order 123 → P2
Order 123 → P2
Order 123 → P2
```

Therefore:

``` text
OrderCreated
PaymentCompleted
OrderShipped
```

can remain ordered for that order.

------------------------------------------------------------------------

# 19. Delivery Semantics

There are three common concepts.

## At-most-once

``` text
process 0 or 1 time
```

A message can be lost.

------------------------------------------------------------------------

## At-least-once

``` text
process 1 or more times
```

A message should not be lost, but duplicates can occur.

This is common and often practical.

Therefore consumers should often be **idempotent**.

Example:

``` text
Payment event

eventId = abc123
```

Consumer checks:

``` text
Have I already processed abc123?
```

If yes:

``` text
skip
```

------------------------------------------------------------------------

## Exactly-once

The goal is:

``` text
one logical processing result
```

Kafka provides mechanisms for exactly-once processing within supported
Kafka workflows, particularly through transactions and Kafka Streams.

Exactly-once is not magic.

It does not mean:

> Every external side effect in the entire universe happens exactly
> once.

If Kafka updates a database through an arbitrary external operation,
additional coordination/idempotency patterns may still be required.

------------------------------------------------------------------------
# 20. Retention vs Deletion After Consumption

This is one of the most important Kafka concepts.

In a traditional queue:

``` text
Producer
   ↓
Queue
   ↓
Consumer
   ↓
Message removed
```

Kafka:

``` text
Producer
   ↓
Kafka Log
   ↓
Consumer reads
   ↓
Record remains
```

It remains until the retention/compaction policy says otherwise.

Therefore:

``` text
Consumer reads event
        ↓
Nothing necessarily gets deleted
```

This enables replay.

------------------------------------------------------------------------

# 21. Log Compaction

Kafka supports a different retention strategy called **log compaction**.

Imagine:

``` text
key=user-42 value=name=Alice
key=user-42 value=name=Bob
key=user-42 value=name=Charlie
```

For a compacted topic, Kafka can eventually retain the latest value for
a key while cleaning up older superseded records, subject to compaction
semantics.

Useful for:

``` text
latest user profile
latest account state
configuration
entity state
```

Think:

``` text
Normal retention:
"What happened?"

Compaction:
"What is the latest known value for this key?"
```

------------------------------------------------------------------------
# 22. Why Kafka Is Fast

Kafka is fast not because of one magic optimization, but because its architecture is deliberately designed around sequential I/O, batching, zero-copy data transfer, compression, partition-level parallelism, and efficient use of the OS page cache.

```                    Why Kafka is Fast
                           │
        ┌──────────────────┼──────────────────┐
        ↓                  ↓                  ↓
   Sequential I/O      Zero-Copy          Batching
        │                  │                  │
        ↓                  ↓                  ↓
   Cheap disk writes   Less CPU copying   Fewer requests
        │                  │                  │
        └──────────────────┼──────────────────┘
                           ↓
                  Efficient data pipeline
                           │
              ┌────────────┼────────────┐
              ↓            ↓            ↓
        Compression   Page Cache    Partitions
              │            │            │
              ↓            ↓            ↓
          Less data     Fast reads    Parallelism
          transferred
```
## 22.1 Sequential Append — Kafka Writes Like a Log

Kafka doesn't behave like a traditional database that constantly updates arbitrary locations on disk.

Instead, Kafka's partitions are essentially append-only logs.

Imagine:
Partition P0

```
┌────┬────┬────┬────┬────┬────┐
│ A  │ B  │ C  │ D  │ E  │    │
└────┴────┴────┴────┴────┴────┘
                         ↑
                      append
```
New records are generally appended to the end:

## 22.2 Zero-Copy — One of Kafka's Big Performance Advantages
Imagine a consumer wants a Kafka record.

A naïve architecture might look like:
```
Disk
  │
  ↓
Kernel memory
  │
  ↓
Application memory
  │
  ↓
Socket buffer
  │
  ↓
Network
  │
  ↓
Consumer
```
Notice how the same data may be copied multiple times between kernel and user space.

That means:
CPU work
+
memory copying
+
context switches

Kafka can use the operating system's zero-copy mechanisms, such as `sendfile`, to efficiently transfer file data from the page cache toward the network socket without requiring the Kafka application to copy the entire payload into its own user-space buffer first.

Conceptually:
```Traditional

Disk
 ↓
Kernel
 ↓ copy
Kafka application
 ↓ copy
Socket
 ↓
Network
```
Versus:
```
Zero-copy style

Disk / Page Cache
       │
       │ efficient kernel-level transfer
       ↓
    Socket
       │
       ↓
    Network
       │
       ↓
   Consumer
```
The important idea is:

> Don't unnecessarily bring data into application memory just to copy it back into the kernel/network path.

That reduces:
```
CPU usage
Memory bandwidth
Data copying
Context switching
```
This becomes extremely valuable when Kafka is moving gigabytes or terabytes of data.

Important nuance

"Zero-copy" does not mean literally zero bytes are ever copied anywhere.

It means Kafka can avoid unnecessary user-space copies and leverage kernel-supported data-transfer paths.


## 22.3 Batching

Imagine the producer sends 1,000 messages.
Naïve approach:
```
send
send
send
send
send
...
1000 network requests
1001. 
1002.
 ```

That's expensive because every request has overhead:
```
system call
network overhead
protocol overhead
broker processing
```

Kafka instead encourages batching:

```
          1000 events
               │
               ↓
        ┌──────────────┐
        │    Batch     │
        │ E E E E E E E │
        └──────────────┘
               │
               ↓
            Kafka
```
This dramatically reduces per-message overhead.

## 22.4 Batching Happens on More Than One Side
This is important.

It's not just:
```
Producer → batch
```
Kafka also organizes records internally into batches and writes/handles data efficiently in larger chunks.

So instead of thinking:
```
event → disk
event → disk
event → disk
```
think:
```
event
event
event
event
   ↓
 batch
   ↓
 efficient I/O
```
This is one reason Kafka can achieve very high throughput.
## 22.5 Compression
Now imagine:
```
1000 events
```
Many events contain repeated structures:
```json
{
  "userId": 123,
  "eventType": "purchase",
  "timestamp": ...
}
```
There is a lot of redundancy.
Kafka can compress batches:
```
Events
  │
  ↓
Batch
  │
  ↓
Compression
  │
  ↓
Smaller batch
  │
  ↓
Network
```
For example conceptually:
```
Before compression

████████████████████████████████

After compression

██████████████
```
That means:
```
less network bandwidth
+
less disk bandwidth
+
less storage
```
And because compression works particularly well on batches, Kafka's batching and compression work nicely together.

## 22.6 Page Cache
Another important piece is the operating system's page cache.
Kafka doesn't try to keep the entire Kafka dataset in its own Java heap.

Instead, Kafka works heavily with the filesystem and allows the OS to cache frequently accessed data in memory.

Conceptually:

```
Kafka
  │
  ↓
Filesystem
  │
  ↓
OS Page Cache
  │
  ↓
Disk
```
Suppose a consumer asks for recently written data.

If that data is already in the page cache:

```
Consumer
   ↓
Kafka
   ↓
Page Cache
   ↓
Network
```
The disk may not need to be accessed at all.

That's extremely fast.
## 22.8 Sequential Read + Page Cache + Zero-Copy
Now these optimizations start working together.

Imagine:
```
Producer
   │
   ↓
Partition
   │
   ↓
Sequential append
   │
   ↓
Filesystem
   │
   ↓
Page Cache
   │
   ↓
Zero-copy transfer
   │
   ↓
Network
   │
   ↓
Consumer
```
Kafka is deliberately designed so that this path can be extremely efficient.

The data doesn't need to be repeatedly transformed and copied by the application.
## 22.9 Kafka Doesn't Need to Keep Everything in RAM

This is another misconception worth clearing up.
You might think:

> "Kafka is fast because it stores all messages in memory."

Not exactly.

Kafka can store huge amounts of data on disk.

For example:
```
RAM
 └── hot/recently accessed data

Disk
 ├── older data
 ├── older data
 ├── older data
 └── older data
```
The OS page cache decides what should remain cached.
So Kafka gets:

```
Disk durability
       +
OS caching
       +
Sequential I/O
```
rather than:
```
Everything must fit into RAM
```
So the deeper mental model is:
```
                 Kafka Performance

                         │
       ┌─────────────────┼──────────────────┐
       ↓                 ↓                  ↓
     Avoid             Avoid              Avoid
   random I/O       unnecessary copies   tiny requests
       │                 │                  │
       ↓                 ↓                  ↓
 sequential I/O      zero-copy           batching
       │                 │                  │
       └─────────────────┼──────────────────┘
                         ↓
                  High throughput
                         │
          ┌──────────────┼──────────────┐
          ↓              ↓              ↓
     compression     page cache     partition
                                   parallelism
```

```
                    Why Kafka Is Fast
                           │
                           ↓
                  Append-only logs
                           │
                           ↓
                  Sequential I/O
                           │
             ┌─────────────┴─────────────┐
             ↓                           ↓
          Batching                   Page Cache
             │                           │
             ↓                           ↓
      Fewer operations            Fast repeated reads
             │
             ↓
        Compression
             │
             ↓
      Less network traffic
             │
             ↓
        Zero-copy
             │
             ↓
     Less memory copying
             │
             ↓
    Partition parallelism
             │
             ↓
      Horizontal scaling
             │
             ↓
       HIGH THROUGHPUT
```

# 23. Kafka vs Redis
This is one of the most common comparisons.

The first principle:

> **Kafka and Redis solve different primary problems.**

Redis is fundamentally a fast in-memory data structure server with persistence, replication, and several data types. Redis also provides Pub/Sub and Streams. Kafka is fundamentally a distributed event-streaming platform centered around durable partitioned logs.

## Mental model

### Redis

``` text
Redis

"Give me this data quickly."
```

Typical use:

``` text
GET user:42
SET session:abc ...
INCR counter
SADD online-users ...
```

### Kafka
``` text
Kafka

"Store this stream of events and let independent consumers process it."
```

Typical use:

``` text
OrderCreated
PaymentCompleted
ShipmentCreated
...
```
------------------------------------------------------------------------
## Comparison
```

  -----------------------------------------------------------------------------
  Feature                 Kafka                   Redis
  ----------------------- ----------------------- -----------------------------
  Primary abstraction     Distributed event log   Data structure server

  Main strength           Durable streaming       Very fast data access/state

  Typical storage         Disk/log oriented       Memory-first with persistence
                                                  options

  Replay                  Core capability         Available with Streams, not
                                                  Pub/Sub

  Consumer groups         Core concept            Supported by Streams

  Pub/Sub                 Not the main            Native Pub/Sub
                          abstraction             

  Partitions              Core scaling model      Different scaling model

  Long event history      Excellent fit           Not primary purpose

  Cache                   Poor fit                Excellent fit

  Session store           Poor fit                Excellent fit

  Counters                Not ideal               Excellent fit

  Event pipeline          Excellent fit           Streams can fit
                                                  smaller/specific workloads

  Stream processing       Kafka Streams/ecosystem Redis
                                                  Streams/functions/ecosystem
```
  -----------------------------------------------------------------------------

Redis Pub/Sub specifically provides at-most-once delivery: if a subscriber cannot receive/process a message, that Pub/Sub message is lost. Redis Streams provide persisted stream entries and consumer groups with stronger delivery options. 

------------------------------------------------------------------------

## Can Kafka and Redis coexist?
Absolutely.

A common architecture:

``` text
                    Kafka
                      │
              ┌───────┼────────┐
              ↓       ↓        ↓
          Analytics  Search   Services
                       │
                       ↓
                    Redis
                       │
              ┌────────┼────────┐
              ↓        ↓        ↓
            Cache    Session   Counters
```
A useful rule:

``` text
Kafka → event history / streaming backbone

Redis → fast current state / cache / data structures
```

------------------------------------------------------------------------
# 24. Kafka vs Database

Kafka is **not a replacement for your relational database**.

Database:

``` text
Store current application state

users
orders
payments
products
```

Kafka:

``` text
Store streams of events

UserRegistered
OrderCreated
PaymentCompleted
OrderShipped
```

A useful distinction:

``` text
Database:
"What is the current state?"

Kafka:
"What events happened?"
```

These can complement each other.

``` text
Application
    │
    ├────→ PostgreSQL
    │
    └────→ Kafka
```

------------------------------------------------------------------------
# 25. Event-Driven Architecture
A request-driven system often looks like:

``` text
Client
  ↓
API
  ↓
Service A
  ↓
Service B
  ↓
Service C
```

An event-driven system can look like:

``` text
                    Event
                      ↓
                   Kafka
                 /   |   \
                /    |    \
               ↓     ↓     ↓
             A       B      C
```

Each service reacts to events.

------------------------------------------------------------------------

## Event vs command

A useful distinction:

### Event

``` text
OrderCreated
```

Means:

> This happened.

### Command

``` text
CreateOrder
```

Means:

> Please do this.

Kafka can carry both, but designing them with clear semantics matters.

------------------------------------------------------------------------
# 26. Database + Kafka and CDC
One of the most useful real-world patterns is **Change Data Capture (CDC)**.
Suppose:

``` text
PostgreSQL
    │
    │ database changes
    ↓
CDC connector
    │
    ↓
Kafka
    │
    ├── Analytics
    ├── Search
    ├── Data Lake
    └── Other Services
```

Instead of repeatedly querying:

``` text
SELECT * FROM orders
```

downstream systems can consume changes.

A common ecosystem choice is Debezium, which can capture database
changes and publish them into Kafka-compatible event pipelines.

------------------------------------------------------------------------

## Why CDC is useful

Imagine:

``` text
orders table

INSERT order
UPDATE order
UPDATE order
UPDATE order
```

CDC can turn those changes into a stream.

Then:

``` text
Database
   ↓
Change Events
   ↓
Kafka
   ↓
Many Consumers
```

This is extremely useful for data integration.

------------------------------------------------------------------------

# 27. Kafka Connect
Kafka Connect is designed for moving data between Kafka and external
systems.

Conceptually:

``` text
External System
      │
      ↓
Kafka Connect
      │
      ↓
Kafka
```

or:

``` text
Kafka
  │
  ↓
Kafka Connect
  │
  ↓
External System
```

Examples:

``` text
PostgreSQL → Kafka
Kafka → Elasticsearch
Kafka → Object Storage
Kafka → Data Warehouse
```

Kafka Connect provides reusable connectors rather than forcing every
application team to write custom integration code.

--------------------------------------------------------------------
# 28. Kafka Streams

Kafka Streams is a library for building applications that process Kafka
data streams.

Example:

``` text
Orders
  ↓
filter high-value orders
  ↓
group by customer
  ↓
aggregate
  ↓
CustomerSpending
```

Conceptually:

``` text
Input Topic
     ↓
Transform
     ↓
Filter
     ↓
Group
     ↓
Aggregate
     ↓
Output Topic
```

Kafka Streams supports concepts such as:

-   transformations
-   filtering
-   grouping
-   aggregation
-   joins
-   windowing
-   stateful processing
-   event-time processing

Kafka's official documentation lists Kafka Streams as one of its core
APIs. [Kafka documentation](https://kafka.apache.org/intro/)

# 29. Schema Management

Once Kafka becomes the central event backbone, event contracts become
extremely important.

Bad:

``` json
{
  "x": 12,
  "y": 45
}
```

Better:

``` json
{
  "eventType": "OrderCreated",
  "eventVersion": 1,
  "orderId": "123",
  "customerId": "456",
  "amount": 4999
}
```

At scale, teams often use a schema system/registry with formats such as:

``` text
Avro
Protobuf
JSON Schema
```

The goal is to manage:

``` text
Producer contract
       ↕
Schema
       ↕
Consumer contract
```

and evolve it safely.


# 30. Rebalancing
Suppose:

``` text
Topic
 ├── P0
 ├── P1
 ├── P2
 └── P3
```

Consumer group:

``` text
C1 → P0, P1
C2 → P2, P3
```

C2 crashes.

Kafka needs to redistribute partitions.

Potentially:

``` text
C1 → P0, P1, P2, P3
```

A consumer group therefore has coordination and assignment behavior.

This redistribution is called **rebalancing**.
Frequent rebalances can hurt throughput and increase processing disruption, so stable consumer behavior matters.

------------------------------------------------------------------------
# 31. Production Architecture
A simplified production design:

``` text
                    Applications
                         │
              ┌──────────┴──────────┐
              ↓                     ↓
           Producers             Producers
              │                     │
              └──────────┬──────────┘
                         ↓
               ┌──────────────────┐
               │   Kafka Cluster  │
               │                  │
               │ Broker 1         │
               │ Broker 2         │
               │ Broker 3         │
               │ Broker 4         │
               └────────┬─────────┘
                        │
          ┌─────────────┼─────────────┐
          ↓             ↓             ↓
       Consumer      Consumer      Consumer
        Group A       Group B       Group C
```

For important workloads, think about:

-   replication factor
-   availability zones
-   partition count
-   retention
-   throughput
-   disk capacity
-   network capacity
-   consumer lag
-   schema evolution
-   security
-   monitoring
-   disaster recovery
-   cross-cluster replication where needed

------------------------------------------------------------------------
# Final Mental Model

When you see:

``` text
                    Kafka
```

don't immediately think:

``` text
"message queue"
```

Think:

``` text
                 DISTRIBUTED EVENT LOG

                         ↓

             Durable stream of events

                         ↓

       ┌─────────────────┼─────────────────┐
       ↓                 ↓                 ↓
   Consumer A        Consumer B        Consumer C
       │                 │                 │
   own offset        own offset        own offset
       │                 │                 │
     replay            replay            replay
```

That mental model unlocks almost everything else in Kafka.

------------------------------------------------------------------------
## Further Reading

-   [Apache Kafka --- Introduction](https://kafka.apache.org/intro/)
-   [Apache Kafka ---
    Design](https://kafka.apache.org/documentation/#design)
-   [Apache Kafka --- Quickstart](https://kafka.apache.org/quickstart/)
-   [Redis Documentation](https://redis.io/docs/latest/)
-   [Redis Pub/Sub](https://redis.io/docs/latest/develop/pubsub/)
-   [Redis
    Streams](https://redis.io/docs/latest/develop/data-types/streams/)

------------------------------------------------------------------------
## Sources

The conceptual descriptions of Kafka's event model, topics, partitions,
consumer groups, retention, replication, ordering, and APIs are based
primarily on Apache Kafka's official documentation. Redis comparisons
use Redis's official documentation for Redis data types, persistence,
Pub/Sub, and Streams.

-   Apache Kafka official documentation: https://kafka.apache.org/intro/
-   Apache Kafka design documentation:
    https://kafka.apache.org/documentation/#design
-   Redis official documentation: https://redis.io/docs/latest/



