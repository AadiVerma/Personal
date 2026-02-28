---
title: "Post-Mortem: How a Replica Deletion Triggered a PostgreSQL Primary Meltdown"
date: "2026-02-28"
excerpt: "A stale PostgreSQL replication slot kept dead tuples from being vacuumed, causing massive table bloat and high CPU on the master DB. Dropping the inactive slot and running VACUUM restored performance."
image: "https://res.cloudinary.com/dq93uuksm/image/upload/v1772253961/postgresqlimage_mgr0ol.png"
---

We recently faced an incident where our master RDS instance CPU utilisation spiked significantly, causing our APIs to slow down. Traffic was normal. Read replica APIs were serving requests just fine. So what went wrong?

The answer lay deep inside PostgreSQL's replication internals — specifically the interaction between hot_standby_feedback, replication slots, and autovacuum.

How Our Database Setup Looks
We run a standard PostgreSQL primary-replica setup:
```
Master DB (RDS)  ──── writes ────▶  Application
      │
      │  streaming replication (WAL)
      │
      ▼
Read Replica 1  ──── reads ────▶  Application
Read Replica 2  ──── reads ────▶  Application
Read Replica 3  (went offline)

```

The master handles all writes. Read replicas serve read traffic and stay in sync by continuously consuming WAL (Write-Ahead Log) records streamed from the master.

## What Is hot_standby_feedback?
This is the feature at the heart of our incident and it is worth understanding deeply.
When you run a read replica in PostgreSQL, queries on the replica operate on a snapshot of the data. Meanwhile on the master, PostgreSQL runs `autovacuum` which continuously cleans up `dead tuples` — rows that were deleted or updated but not yet physically removed from disk.

Here is the problem this creates: imagine the master vacuums a row that the replica's ongoing query still needs to read. The replica gets a replication conflict and PostgreSQL cancels the query on the replica with:

```
ERROR: canceling statement due to conflict with recovery
```
Nobody wants their queries silently cancelled on the read replica. So PostgreSQL introduced `hot_standby_feedback`.

When `hot_standby_feedback = on` is set, the standby informs the primary about the oldest transaction running on it. As a result, the primary avoids cleaning up rows which are still being used by transactions on the standby.

This sounds great — no more query cancellations on replicas. But it comes with a significant hidden trade-off.

This prevents vacuum from purging the tuples on the primary because someone on the standby is querying them, which allows replication to proceed. But now the primary is bloated as vacuum cannot purge and free up tuples, further slowing reads and writes on the primary

So `hot_standby_feedback` is essentially a deal: `protect replica queries at the cost of potentially bloating the master`.

## What Are Replication Slots?
A replication slot is a record that PostgreSQL master keeps for each connected replica. It tracks exactly how much WAL data that replica has consumed so the master knows what it still needs to retain.

A replication slot is a data structure to ensure the standby server can catch up with the primary. If replication is delayed or the standby server is down, the replication slot will prevent VACUUM from deleting old rows.

Every replica gets its own named slot entry on the master. 

When a replica is healthy and connected, this is fine. The slot advances as the replica consumes WAL and the master vacuums freely. The danger emerges when a replica goes offline.

## What Actually Happened to Us
Here is the exact chain of events that caused our incident:

**Step 1 — Replica goes offline**
When we deleted one of our replica instance. Its replication slot remained registered on the master because PostgreSQL assumes the replica will come back and need to catch up.

**Step 2 — Vacuum gets blocked on the master**
With physical streaming replication with `hot_standby_feedback = on`, when replication is lagging or a replica server is stale, the oldest transaction that the replication slot needs the database to retain can get stuck, holding back the xmin horizon

The master could not vacuum dead tuples because the stale replication slot was holding back the xmin horizon — PostgreSQL's internal marker that determines which dead rows are safe to clean up.

**Step 3 — Dead tuples accumulate on master**
Every write operation on the master (inserts, updates, deletes) produces dead tuples. Normally autovacuum cleans these up continuously. With the slot holding everything back, dead tuples piled up unchecked on the master DB itself.

**Step 4 — Table bloat causes CPU spike**
The master now had to scan through bloated tables full of dead rows on every query. More data to scan meant more I/O, more CPU cycles, and slower query execution. Our RDS CPU utilisation climbed steadily even though traffic was completely normal.

**Step 5 — APIs slow down, read replicas stay fine**
APIs hitting the master slowed down noticeably. Read replica APIs remained perfectly healthy throughout — because replicas have no write activity, they accumulate no dead tuples, have no vacuum pressure, and experience no bloat whatsoever.

## Why the Dead Tuples Were on the Master, Not the Replica
The dead tuples were accumulating entirely on the master DB. The replica that went offline was not the one with the bloat problem — it was the cause of the master being unable to clean itself up. The offline replica's stale slot entry on the master was acting as a lock that said "don't vacuum anything yet, I might need it."

## How We Fixed It

We queried the master to list all replication slots and identified the stale slot belonging to the offline replica. We then manually dropped that slot entry, which immediately released the vacuum block. After dropping the slot we manually ran VACUUM on the master to flush out all the dead tuples that had been building up. CPU utilisation returned to normal shortly after.

## The hot_standby_feedback Dilemma

This incident surfaces a fundamental tension in PostgreSQL replication that every team running replicas should understand:


| Setting | Effect on Replica | Effect on Master |
|--------|--------|--------|
| `hot_standby_feedback = off` | Queries may get cancelled due to replication conflicts | Master vacuums freely, no bloat risk |
| `hot_standby_feedback = on` | Queries run safely without cancellation | Master can bloat if replica lags or goes offline |


## Key Takeaways

- hot_standby_feedback is a PostgreSQL feature that protects replica queries from being cancelled — but it does so by telling the master not to vacuum rows the replica still needs. When a replica goes offline with this enabled, the master stops vacuuming entirely for that slot.

- Replication slots are named records on the master that track each replica's consumption position. A slot from an offline replica does not disappear automatically — it sits there and blocks vacuum indefinitely.

- Dead tuples accumulate on the master, not the replica. The offline replica is the cause, but the master is where the pain is felt.

- An offline replica is not just a capacity problem — it is a direct health risk to the master database through vacuum blockage and table bloat.

- Read replicas appeared healthy throughout because they have no writes, no dead tuples, and no vacuum pressure.

