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
