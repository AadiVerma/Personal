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



