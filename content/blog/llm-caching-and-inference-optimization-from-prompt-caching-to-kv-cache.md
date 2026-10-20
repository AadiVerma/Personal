---
title: "LLM Caching and Inference Optimization: From Prompt Caching to KV Cache"
date: "2026-10-19"
excerpt: "Explore how LLM caching works, from prompt and semantic caching to KV-cache management, PagedAttention, speculative decoding, and inference optimization techniques that make AI applications faster, cheaper, and more scalable."
image: "https://res.cloudinary.com/dq93uuksm/image/upload/v1792405326/LLM_Caching_and_Inference_Optimisation_Infographic_xmydd6.png"
---

## Introduction

Large Language Models (LLMs) are powerful, but running them efficiently in production is a significant engineering challenge.

Every request can involve processing thousands of input tokens, retrieving relevant information, running transformer layers, generating output tokens, and consuming expensive GPU resources. When applications handle thousands or millions of requests, repeated computation can increase latency and cost considerably.

Consider an AI assistant that receives the same system instructions in every conversation. Or a coding assistant that repeatedly analyzes the same repository context. Or a customer support chatbot that answers similar questions every day.

Should the system recompute everything from scratch for every request?

Not necessarily. **Caching allows systems to reuse previously computed results or intermediate states instead of repeating expensive work.**

However, caching in LLM applications is not a single technique. It exists at several layers, from storing complete responses to reusing attention states inside transformer inference engines.

In this article, we will explore:

- Prompt caching and prefix caching
- KV (Key-Value) caching inside transformers
- Exact-match and semantic caching
- Embedding and retrieval caching
- PagedAttention and KV-cache management
- Prefill and decode optimization
- KV-cache quantization
- Speculative decoding
- Continuous batching and request scheduling
- Cache eviction, security, and monitoring

By the end, you should understand how these techniques fit together and when each one is useful.

---

## 1. Understanding the LLM Inference Pipeline

Before exploring caching, let's understand what happens when an LLM receives a request.

A simplified inference pipeline looks like this:

```text
User Request
     |
     v
Construct Prompt
     |
     v
Tokenization
     |
     v
Prefill Phase
(Process Input Tokens)
     |
     v
Decode Phase
(Generate Output Tokens)
     |
     v
Return Response
```

During inference, the model processes the input context and generates output tokens sequentially in standard autoregressive generation.

For a large prompt, processing the input can be expensive. During generation, the model must also use information from previously processed tokens.

Without caching, certain computations may be repeated unnecessarily across generation steps or across requests.

Caching addresses these inefficiencies in different ways.

## 2. The Different Types of LLM Caching

One of the most important distinctions is that not every cache stores the same thing.

| Cache type | What it stores | Main benefit |
|---|---|---|
| Exact-match response cache | Previous request results | Avoids repeated model calls |
| Semantic cache | Results for semantically similar queries | Reuses answers for paraphrased questions |
| Prompt caching | Reusable computation associated with prompt prefixes | Reduces repeated input processing |
| KV cache | Attention keys and values from processed tokens | Avoids recomputing historical attention state |
| Prefix cache | Reusable KV-cache blocks for matching prefixes | Reuses computation across requests |
| Embedding cache | Previously generated embeddings | Avoids repeated embedding computation |
| Retrieval cache | Search results or retrieved documents | Reduces repeated retrieval work |

These techniques can coexist in a single application.

For example, an AI support assistant might cache embeddings, reuse retrieval results, use provider-level prompt caching, and run on an inference engine with KV-cache reuse.

The key is understanding which expensive operation each cache eliminates.

---

## 3. Prompt Caching

Prompt caching allows an LLM service to reuse computation associated with a repeated portion of a prompt.

Imagine an application that sends the following instructions with every request:

```text
You are an AI coding assistant.

Follow these rules:
1. Write maintainable code.
2. Explain important trade-offs.
3. Include tests when appropriate.
4. Follow the repository's coding conventions.

[Large documentation and tool instructions]

User question: How should I implement pagination?
```

The instructions and documentation may remain unchanged across hundreds of requests. Only the final question changes.

Without prompt caching, the service may need to process the repeated prefix again for every request.

With prompt caching, a compatible inference service can reuse previously computed state for that prefix.

### How prompt caching works

```text
Request 1
    |
    v
Common Prompt Prefix
    |
    v
Compute Prefix State
    |
    v
Store Reusable State
    |
    v
Generate Response


Request 2
    |
    v
Same Prompt Prefix + New Question
    |
    v
Cache Lookup
    |
    v
Reuse Cached Prefix State
    |
    v
Process Remaining Input
    |
    v
Generate Response
```

The important point is that the model still needs to process the new information and generate a new answer. Prompt caching does not mean every request receives a previously generated response.

### What makes a prompt cacheable?

This depends on the provider or inference engine. Common considerations include:

- Repeated prompt prefixes
- Stable system instructions
- Consistent tool definitions
- Repeated documentation or context
- Matching token sequences and supported cache boundaries
- Provider-specific minimum prefix lengths and retention rules

A cache hit is not guaranteed merely because two prompts look similar to a human. Some systems require matching token prefixes.

### How to structure prompts for better caching

A useful design is to place stable content before dynamic content.

Less cache-friendly:

```text
User ID: 123
Current time: 10:30
Question: Explain database indexing.

[Large static system instructions]
[Large documentation]
```

More cache-friendly:

```text
[Stable system instructions]
[Stable tool definitions]
[Stable documentation]

User ID: 123
Current time: 10:30
Question: Explain database indexing.
```

The second structure keeps the reusable prefix stable for longer.

This is a general design principle, not a guarantee that every provider will cache the entire prefix.

### Benefits

- Lower repeated input-processing costs
- Potentially lower time to first token
- Reduced cost for cache-eligible input tokens
- Better efficiency for long prompts and repeated workflows

### Limitations

- Cache eligibility depends on implementation-specific rules.
- Dynamic content inserted near the beginning can reduce prefix reuse.
- Cache retention and expiration vary by provider.
- New output tokens still incur generation costs.
- A cache hit does not necessarily eliminate all prompt-processing work.

Further reading:

- [OpenAI Prompt Caching Guide](https://developers.openai.com/api/docs/guides/prompt-caching)
- [Anthropic Prompt Caching Documentation](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)

---

## 4. KV Cache: Understanding the Transformer Internals

Prompt caching is often exposed as an API feature. KV caching, on the other hand, is a fundamental inference optimization inside transformer-based models.

To understand it, we need to look at attention.

### A brief introduction to attention

For each token, a transformer attention layer computes three representations:

- Query (Q)
- Key (K)
- Value (V)

The attention operation can be expressed as:

```text
Attention(Q, K, V) =
    softmax((Q × transpose(K)) / sqrt(d_k)) × V
```

Here, `d_k` is the dimension of the query and key vectors.

The query is used to determine which previous tokens are relevant. Keys represent information used for matching, and values contain information combined into the attention output.

During autoregressive generation, each new token can attend to earlier tokens in its context.

The key optimization is that the model does not need to recompute the keys and values for all earlier tokens every time it generates a new token.

### What is KV caching?

**KV caching stores the previously computed key and value tensors so they can be reused during subsequent decoding steps.**

Consider a model generating a sentence:

```text
Input: Explain caching

Generated token 1: Caching
Generated token 2: helps
Generated token 3: reduce
Generated token 4: repeated
Generated token 5: computation
```

At each generation step, the model can reuse the cached keys and values for the preceding tokens and compute the new token's state.

Without a KV cache, much of this historical key/value computation would be repeated.

With a KV cache:

```text
Prompt tokens
     |
     v
Compute K and V tensors
     |
     v
Store in KV Cache
     |
     v
Generate next token
     |
     v
Compute K and V for new token
     |
     v
Append to KV Cache
     |
     v
Continue generation
```

This substantially reduces redundant computation during autoregressive decoding.

### Why does the KV cache matter?

The KV cache is particularly important for:

- Long-context conversations
- Multi-turn assistants
- Coding agents
- Long document analysis
- High-throughput inference servers
- Applications generating many tokens per request

However, there is a trade-off: the cache consumes memory, often GPU memory, and its size increases as active sequences grow.

### Estimating KV-cache memory

For a conventional transformer with a standard KV cache, an approximate memory formula is:

```text
KV_Cache_Memory_Bytes =
    2 * L * B * T * H_KV * D_head * S
```

Where:

- `KV_Cache_Memory_Bytes` = total KV-cache memory in bytes
- `L` = number of transformer layers
- `B` = number of active sequences
- `T` = number of cached tokens per sequence
- `H_KV` = number of key/value heads
- `D_head` = dimension of each attention head
- `S` = bytes per stored element, such as 2 for FP16 or BF16

The factor of `2` accounts for both keys and values.

#### Example calculation

Suppose a model has:

- 32 transformer layers
- 8 key/value heads
- 128 dimensions per head
- 8,192 cached tokens
- BF16 cache storage, requiring 2 bytes per element
- 1 active sequence

Substitute these values into the formula:

```text
KV_Cache_Memory_Bytes =
    2 * 32 * 1 * 8192 * 8 * 128 * 2

KV_Cache_Memory_Bytes =
    1,073,741,824 bytes
```

That is approximately **1 GiB for one sequence** under these assumptions.

At 16 concurrent sequences with the same context length, this becomes approximately 16 GiB.

Actual memory usage depends on the architecture, attention design, allocation strategy, and implementation overhead.

This illustrates why KV-cache management becomes a major concern in production inference.

---

## 5. Prefix Caching: Reusing KV State Across Requests

A normal KV cache helps a model reuse earlier token states within an active generation.

Prefix caching extends the idea by allowing compatible KV-cache state from one request to be reused by another request with the same prefix.

Consider a coding assistant:

```text
System Instructions:
You are a coding assistant.

Repository Documentation:
[Thousands of tokens]

Available Tools:
[Tool definitions]

User Question:
How do I fix this bug?
```

A second request may use the same instructions, documentation, and tools but ask a different question.

Instead of recomputing the entire matching prefix, a compatible inference engine can reuse the existing KV-cache blocks.

### How prefix caching works

```text
Request A
    |
    v
Process Shared Prefix
    |
    v
Create KV Cache Blocks
    |
    v
Keep Blocks Available for Reuse


Request B
    |
    v
Check Prefix Cache
    |
    +---- Cache Hit ----> Reuse Matching Blocks
    |                             |
    |                             v
    |                     Process New Suffix
    |
    +---- Cache Miss ---> Compute Missing Prefix
                                  |
                                  v
                           Continue Generation
```

The cache typically stores intermediate attention state, not the final answer.

### How does an inference engine identify matching prefixes?

Implementations vary. For example, vLLM uses hashes associated with token blocks and their preceding prefixes to identify reusable cache blocks.

This allows it to find matching portions of a prompt and reuse their computed state.

### Where is prefix caching useful?

- Shared system prompts
- Repeated tool definitions
- Multi-turn conversations
- Agents working on the same repository
- Repeated document analysis
- Large prompts reused across multiple requests

### An important distinction

Prefix caching is not the same as semantic caching.

Two questions can mean the same thing but have different token sequences. Semantic caching may reuse a response based on meaning; prefix caching requires compatible previously computed prefix state according to the inference engine's matching rules.

Further reading:

- [vLLM Automatic Prefix Caching](https://docs.vllm.ai/en/latest/features/automatic_prefix_caching/)

---

## 6. Exact-Match Response Caching

Not every optimization needs to operate inside a transformer.

Sometimes the best solution is to avoid calling the LLM entirely.

Exact-match response caching stores the output associated with a request key.

Suppose a user asks:

```text
What is the capital of France?
```

The application generates an answer and stores it.

If the same request arrives again with the same cache key and relevant configuration, the application can return the stored answer without invoking the model.

### Architecture

```text
Incoming Request
       |
       v
Normalize Request
       |
       v
Generate Cache Key
       |
       v
Check Response Cache
       |
       +---- Hit ----> Return Stored Response
       |
       +---- Miss ---> Call LLM
                           |
                           v
                      Store Result
                           |
                           v
                      Return Result
```

### Example implementation using Redis

The following Python example uses an OpenAI-compatible client and Redis. It demonstrates the pattern; it is not a complete production implementation.

```python
import hashlib
import json
import os

import redis
from openai import OpenAI

client = OpenAI()
cache = redis.Redis.from_url(
    os.environ["REDIS_URL"],
    decode_responses=True
)

CACHE_TTL = 3600


def generate_answer(question: str) -> str:
    model = "gpt-4.1-mini"

    cache_input = {
        "model": model,
        "question": question,
        "system_prompt_version": "v1",
    }

    serialized = json.dumps(
        cache_input,
        sort_keys=True,
        separators=(",", ":"),
    )

    cache_key = "llm:response:" + hashlib.sha256(
        serialized.encode()
    ).hexdigest()

    cached_answer = cache.get(cache_key)

    if cached_answer is not None:
        return cached_answer

    response = client.responses.create(
        model=model,
        instructions="Answer clearly and accurately.",
        input=question,
    )

    answer = response.output_text

    cache.setex(
        cache_key,
        CACHE_TTL,
        answer,
    )

    return answer
```

### What should a real cache key include?

Depending on the application, it may need to include:

- Model identifier and version
- System instructions
- User input
- Relevant conversation context
- Tool configuration
- Output format
- Temperature and other generation parameters
- Tenant or permission scope
- Retrieval configuration and document version

If two requests differ in a way that affects the answer, they should not accidentally share a cache entry.

For example, caching a response that contains private account data under a key that omits the user identity can create a serious data leak.

### When should exact-match caching be used?

It works well when requests repeat frequently and the expected response remains valid.

Examples include:

- Frequently requested public information
- Stable documentation answers
- Repeated deterministic transformations
- Reusable internal reference data

It is less useful when every request contains unique context or depends on rapidly changing information.

---

## 7. Semantic Caching

Exact-match caching requires requests to match according to the application's cache-key rules.

But users often ask the same question in different ways.

For example:

```text
Question A:
How do I reset my password?

Question B:
I forgot my password. How can I change it?

Question C:
What is the process for recovering account access?
```

These questions have similar meanings but different text.

Semantic caching attempts to recognize this similarity and reuse a previously generated response when it is appropriate.

### How semantic caching works

```text
Incoming Query
      |
      v
Generate Query Embedding
      |
      v
Search Cached Query Embeddings
      |
      v
Find Nearest Candidate
      |
      v
Check Similarity Threshold
      |
      +---- Suitable Match ----> Return Cached Answer
      |
      +---- No Suitable Match -> Run Normal LLM Pipeline
                                      |
                                      v
                                Cache New Result
```

The cache typically stores:

- The original query
- Its embedding
- The response
- Model and prompt metadata
- Expiration information
- Tenant and permission information

When a new query arrives, the system compares its embedding with previously cached queries.

If the similarity is sufficiently high, the cached answer may be reused.

### Similarity thresholds

A semantic cache usually needs a threshold that determines when two queries are similar enough.

For example, a system might use a cosine-similarity threshold:

```text
similarity(a, b) =
    dot_product(a, b) /
    (norm(a) * norm(b))
```

The appropriate threshold depends on the embedding model, data, application, and consequences of a wrong answer. There is no universally correct value.

A low threshold increases potential cache hits but also increases the risk of returning irrelevant answers.

A high threshold is more conservative but may miss useful matches.

### The biggest problem: semantic similarity is not correctness

Consider these two questions:

```text
Can I take 5 mg of this medication?

Can I take 50 mg of this medication?
```

The questions are semantically similar but have materially different meanings.

Similarly:

```text
How do I delete my account?

How do I deactivate my account temporarily?
```

A semantic cache that treats these as interchangeable can return an incorrect or harmful answer.

A robust implementation should consider:

- Similarity thresholds
- Exact constraints and numerical values
- Model and prompt versions
- Freshness requirements
- Tenant and authorization boundaries
- Query type and risk level
- Validation or additional checks before reusing an answer

For high-risk or highly personalized requests, returning a cached answer based only on embedding similarity may be inappropriate.

### When is semantic caching useful?

- Frequently asked support questions
- Repeated questions over stable documentation
- Internal knowledge assistants
- Public FAQ systems
- Repeated low-risk queries over relatively stable data

Further reading:

- [Redis Semantic Cache Documentation](https://redis.io/docs/latest/develop/use-cases/semantic-cache/)

---

## 8. Embedding and Retrieval Caching

Caching is also useful in Retrieval-Augmented Generation (RAG) pipelines.

A typical RAG system looks like this:

```text
User Query
    |
    v
Generate Embedding
    |
    v
Search Vector Database
    |
    v
Retrieve Relevant Documents
    |
    v
Construct Prompt
    |
    v
Generate LLM Response
```

Several stages can benefit from caching.

### Embedding cache

If the same text is embedded repeatedly, the application can reuse its embedding instead of calling the embedding model again.

The cache key should account for the embedding model and relevant preprocessing configuration.

### Retrieval cache

If the same query repeatedly retrieves the same documents, the application may cache the retrieval result.

However, retrieval results can become stale when:

- Documents are updated
- Index contents change
- User permissions change
- Filters or metadata change
- The retrieval configuration changes

### How this fits with other caches

```text
User Query
    |
    v
Embedding Cache
    |
    v
Retrieval Cache
    |
    v
Response Cache or Semantic Cache
    |
    v
Prompt Caching / KV Cache
    |
    v
LLM Response
```

This is a conceptual diagram, not a mandatory pipeline. A system should use only the caches that provide measurable value for its workload.

For example, if embedding generation is cheap but the LLM call is expensive, response caching might provide more benefit than embedding caching.

---

## 9. PagedAttention and KV-Cache Memory Management

As the number of concurrent requests increases, managing KV-cache memory becomes a major challenge.

Traditional implementations can suffer from memory fragmentation and inefficient allocation when requests have different sequence lengths.

PagedAttention addresses this problem by organizing KV-cache storage into blocks that can be allocated and managed more flexibly.

### The basic idea

Imagine a GPU has memory available for many active requests.

A simple allocation strategy might reserve large contiguous regions for each request. If requests have different lengths, some reserved space may go unused.

PagedAttention divides KV-cache storage into blocks and maps logical token positions to physical memory blocks.

```text
Request A
Logical KV Cache:
[Block 1] [Block 2] [Block 3]

Physical GPU Memory:
[Block 7] [Block 2] [Block 9]


Request B
Logical KV Cache:
[Block 1] [Block 2]

Physical GPU Memory:
[Block 4] [Block 8]
```

The illustration is simplified: logical block positions and physical block identifiers are managed by the serving engine.

The important idea is that a request does not need one large contiguous region of GPU memory.

### Benefits

- More flexible KV-cache allocation
- Reduced memory fragmentation
- Better support for concurrent requests
- More efficient use of available GPU memory
- A foundation for block-level cache reuse

### PagedAttention vs. prefix caching

These concepts are related but solve different problems.

**PagedAttention** is an attention and memory-management approach for handling KV-cache blocks efficiently.

**Prefix caching** reuses previously computed KV-cache state when compatible prompts share a prefix.

Paged KV-cache infrastructure makes block management practical, while prefix caching exploits repeated computation across requests.

Further reading:

- [vLLM Documentation](https://docs.vllm.ai/en/latest/design/prefix_caching/)

---

## 10. Cache Eviction and Cache Locality

Caches have limited capacity. Eventually, the system must decide which entries to retain and which to remove.

This is called cache eviction.

### Common eviction strategies

| Strategy | How it works | Main consideration |
|---|---|---|
| LRU | Evicts the least recently used entry | Useful when recent usage predicts future reuse |
| LFU | Evicts the least frequently used entry | Useful when popularity is relatively stable |
| TTL | Expires entries after a configured duration | Useful for controlling staleness |
| Priority-based | Retains entries based on assigned importance | Useful when some entries are more valuable |
| Size-aware | Considers memory consumed by each entry | Useful when cache entries vary significantly in size |

These strategies are not interchangeable. For example, TTL defines an expiration rule, whereas LRU defines a replacement preference when capacity is needed.

### Why cache locality matters

Suppose a system receives many requests with the same large prefix.

If those requests are routed to an inference worker that already has the relevant cache blocks, the system may benefit from reuse.

If requests are distributed across workers without considering cache locality, the same prefix may need to be processed independently on multiple workers.

Cache-aware routing attempts to improve reuse by considering where cached state already exists.

However, routing decisions must also account for load balancing, latency, fault tolerance, and resource availability. Sending every request to one worker merely to maximize cache hits can create a bottleneck.

---

## 11. KV-Cache Quantization

KV caches can consume substantial GPU memory, especially for long contexts and high concurrency.

One approach to reducing memory usage is quantization: representing cached values with lower-precision data types.

For example:

- FP16 and BF16 use 16-bit representations.
- FP8 uses 8-bit representations.
- INT8 uses 8-bit integer representations.
- INT4 uses 4-bit integer representations.

The exact benefits depend on the implementation and metadata overhead.

### Simplified memory comparison

| Storage precision | Bytes per value | Approximate storage relative to FP16 |
|---|---:|---:|
| FP16 | 2 | 100% |
| FP8 | 1 | 50% |
| INT8 | 1 | 50% |
| INT4 | 0.5 | 25% |

These percentages describe idealized raw value storage. Real implementations can require scales, metadata, alignment, or additional workspace, so actual memory savings may differ.

### Why not always use the lowest precision?

Lower precision introduces quantization error.

Depending on the model and quantization method, this may affect output quality, numerical stability, or performance.

The serving hardware and inference kernels also matter. A lower-precision representation is useful only if the implementation can process it efficiently.

The goal is not simply to minimize memory. It is to achieve the best trade-off between:

- Memory capacity
- Throughput
- Latency
- Output quality
- Hardware compatibility

Further reading:

- [NVIDIA — KV-Cache Optimization](https://developer.nvidia.com/blog/optimizing-inference-for-long-context-and-large-batch-sizes-with-nvfp4-kv-cache/)

---

## 12. Prefill vs. Decode Optimization

LLM inference has two major phases: prefill and decode.

Understanding the difference helps explain why caching is only one part of inference optimization.

### Prefill

During prefill, the model processes the input prompt and computes the attention state needed for generation.

This phase can involve substantial parallel computation across the input tokens.

It is often compute-intensive, although actual bottlenecks depend on model architecture, context length, hardware, and batch size.

### Decode

During decode, the model generates output tokens one at a time in standard autoregressive generation.

The model uses previously computed KV state and appends the new token's state to the cache.

Decode is often constrained by memory bandwidth, sequential dependencies, and the time required for each generation step.

### Comparison

| Characteristic | Prefill | Decode |
|---|---|---|
| Main task | Process input tokens | Generate output tokens |
| Parallelism | High across prompt tokens | More sequential across generated tokens |
| Typical bottleneck | Compute and attention work | Memory bandwidth and per-token latency |
| Main performance metric | Time to first token | Inter-token latency and generation throughput |
| Cache role | Creates KV state | Reuses and extends KV state |

### Important optimization metrics

**Time to First Token (TTFT):** Time from receiving a request until the first generated token becomes available.

**Inter-Token Latency (ITL):** Time between successive generated tokens.

**Throughput:** The amount of work completed per unit of time, often measured in tokens per second or requests per second.

A system can have excellent throughput but poor latency for an individual user, or excellent latency at low load but poor throughput at scale.

Optimizing an LLM service requires understanding which metric matters for the workload.

---

## 13. Speculative Decoding

KV caching reduces repeated computation, but generating output tokens still involves sequential steps in standard autoregressive decoding.

Speculative decoding attempts to accelerate generation by proposing multiple tokens and verifying them using the target model.

### How it works

A common approach uses a smaller draft model to propose a sequence of tokens.

The larger target model then verifies the proposed sequence using a compatible verification procedure.

```text
Prompt
  |
  v
Draft Model
  |
  v
Propose Multiple Tokens
  |
  v
Target Model Verifies
  |
  +---- Accepted Tokens
  |
  +---- Rejected / Corrected Token
  |
  v
Continue Generation
```

Under an appropriate verification algorithm, speculative decoding can preserve the target model's intended output distribution while reducing sequential generation overhead.

The exact behavior depends on the speculative decoding method.

### Why can it help?

The target model may be able to verify multiple proposed tokens in a single forward pass rather than generating each token in a separate sequential pass.

This can improve generation speed when the draft tokens are accepted frequently enough and the verification overhead is worthwhile.

### Limitations

- Drafting introduces its own computation cost.
- Poor acceptance rates can reduce the benefit.
- Performance depends on the models, hardware, output length, and serving implementation.
- Not every workload benefits equally.

Speculative decoding is not a cache. It is a complementary inference optimization.

---

## 14. Continuous Batching and Request Scheduling

When many users send requests simultaneously, an inference server must decide how to schedule them on available hardware.

Traditional static batching groups requests together and may wait for the batch to finish before forming the next batch.

Continuous batching allows requests to enter and leave the active batch dynamically as their generation progresses.

### Simplified illustration

```text
Time 1:
Request A | Request B | Request C

Request B finishes.

Time 2:
Request A | Request D | Request C

Request A finishes.

Time 3:
Request D | Request E | Request C
```

Instead of leaving capacity unused until every original request finishes, the scheduler can admit new requests as resources become available.

### Why it matters for caching

Continuous batching and KV caching complement each other.

- KV caching avoids recomputing previously processed token state.
- Paged allocation helps manage cache memory.
- Continuous batching helps keep the accelerator busy.
- Scheduling determines which requests run and when.

The challenge is that each active request consumes memory and compute resources. Increasing concurrency indefinitely can cause memory pressure or worsen latency.

A good serving engine balances cache capacity, request latency, throughput, and scheduling fairness.

---

## 15. Distributed KV Caching and Cache Offloading

In larger inference systems, the KV cache may not fit entirely in the fastest available memory.

Some serving architectures therefore support moving cached state between storage tiers or sharing it across workers.

A simplified hierarchy might look like this:

```text
          GPU Memory
               |
               v
          CPU Memory
               |
               v
     Remote Cache / Storage
```

The exact hierarchy varies by implementation. Some systems support CPU offloading, remote KV-cache pools, or specialized high-speed interconnects.

### Why distribute or offload the KV cache?

- Preserve useful cache state beyond GPU capacity
- Improve reuse across requests or workers
- Support longer contexts and larger workloads
- Reduce repeated prefill computation
- Better handle multi-turn agent workflows

### The trade-offs

Moving KV state is not free.

Transfer latency, bandwidth, serialization overhead, synchronization, cache misses, and coordination can all reduce the benefit.

A remote cache is most useful when the cost of recomputing the state is greater than the cost of retrieving it.

Further reading:

- [vLLM — Serving Agentic Workloads at Scale with Mooncake](https://vllm.ai/blog/2026-05-06-mooncake-store)

---

## 16. Security and Correctness in LLM Caching

Caching introduces a separate class of engineering risks.

A cache hit is useful only when the cached data is valid for the current request and safe to reuse.

### Tenant isolation

Imagine two users ask an AI assistant about their respective invoices.

If the response cache key omits user identity or authorization scope, one user could receive another user's cached result.

Sensitive information must not be shared merely because two requests have similar text.

### Prompt injection and cached responses

An attacker may attempt to introduce malicious instructions or manipulate the content that gets cached.

Applications should carefully validate the data being cached and the context in which cached content is reused.

### Stale information

An answer about an account balance, product availability, or current policy may become invalid shortly after it is generated.

Such answers need appropriate expiration or invalidation rules, or should bypass caching altogether.

### Cache timing and shared infrastructure

In shared inference environments, observable differences in latency can sometimes reveal information about cache reuse.

Inference engines may provide isolation controls to reduce these risks. For example, vLLM documents optional cache salting for isolating prefix-cache reuse across trust groups.

Further reading:

- [vLLM Prefix Caching Design](https://docs.vllm.ai/en/latest/design/prefix_caching/)

### A practical checklist

- Include relevant model and prompt versions in cache keys.
- Enforce authorization before returning cached content.
- Scope private responses to the correct tenant and user.
- Define expiration and invalidation policies.
- Avoid semantic reuse when small differences materially change the answer.
- Treat retrieved and cached content as untrusted input.
- Measure cache behavior without logging unnecessary sensitive data.

---

## 17. How to Measure Cache Performance

Implementing caching does not automatically guarantee a faster or cheaper system.

You need to measure whether it actually improves the workload.

### Cache hit rate

The cache hit rate measures how often requests find a usable cached entry.

```text
Hit Rate (%) =
    Cache Hits / (Cache Hits + Cache Misses) * 100
```

For example, if 700 out of 1,000 eligible lookups are hits:

```text
Hit Rate = 700 / 1000 * 100
         = 70%
```

This metric is useful, but a high hit rate alone does not prove that the cache is beneficial. Hits may return low-value results or require expensive lookup operations.

### Latency

Measure:

- Median latency
- P95 and P99 latency
- Time to first token
- Inter-token latency
- Total response time

Compare results before and after introducing caching under similar traffic conditions.

### Cost

Track:

- Input and output token usage
- Cached input-token pricing, where applicable
- Embedding costs
- Vector-search costs
- GPU utilization
- Cache storage and network costs

A semantic cache may reduce LLM calls but add embedding and vector-search overhead.

### Cache effectiveness

A useful evaluation should answer:

1. How often does the cache hit?
2. How much latency does a hit save?
3. How much computation or money is avoided?
4. How often are cached answers stale or incorrect?
5. How much memory does the cache consume?
6. Does performance remain stable under concurrency?

Measure quality alongside performance, especially for semantic caches.

---

## 18. Choosing the Right Caching Strategy

Different workloads benefit from different strategies.

| Use case | Recommended starting point |
|---|---|
| Repeated identical API requests | Exact-match response cache |
| Paraphrased FAQ questions | Semantic cache with validation |
| Repeated long system prompts | Provider prompt caching |
| High-throughput open-source inference | KV cache and prefix caching |
| Large numbers of concurrent requests | Paged KV allocation and continuous batching |
| Long-context inference with GPU memory pressure | KV-cache quantization or offloading |
| Repeated RAG queries | Embedding and retrieval caching |
| Long-running multi-turn agents | Prefix caching and appropriate distributed KV-cache strategies |

These are starting points, not universal rules. The best strategy depends on the model, traffic distribution, context lengths, freshness requirements, and cost structure.

---

## 19. Building a Practical LLM Caching System

If you're building an AI application, you can introduce caching incrementally.

### Step 1: Establish a baseline

Measure latency, token usage, cost, throughput, and answer quality without the new cache.

### Step 2: Identify repeated work

Determine whether the application repeats exact requests, semantic queries, embeddings, retrieval operations, or prompt prefixes.

### Step 3: Choose the appropriate cache

Start with the cache that removes the most expensive repeated operation.

For example, a FAQ assistant might benefit from response caching, while an open-source inference server with repeated long prompts might benefit from prefix caching.

### Step 4: Define cache keys and validity rules

Specify what makes two requests interchangeable and how changes to models, prompts, permissions, and source data affect cache validity.

### Step 5: Set expiration and eviction policies

Choose how long results should remain valid and what should happen when capacity is exhausted.

### Step 6: Benchmark under realistic traffic

Test cache hits, misses, concurrent requests, long contexts, and changing data.

### Step 7: Monitor and iterate

Track cache hit rate, latency, cost, memory usage, stale-result rates, and correctness.

The objective is not to maximize cache hits at any cost. It is to maximize useful reuse while preserving correctness and reliability.

---

## 20. The Future of LLM Caching

As LLM applications become more complex, caching is evolving from a simple application optimization into a core component of inference infrastructure.

Several developments are particularly important:

**Long-context inference:** Larger contexts increase KV-cache memory requirements, making efficient allocation and compression increasingly important.

**Agentic workloads:** Agents may repeatedly use shared instructions, tools, and context across multiple turns, creating opportunities for prefix reuse.

**Distributed inference:** Remote cache pools and cache-aware scheduling can make reuse possible across a wider set of workers.

**Memory-efficient serving:** Quantization, paging, offloading, and improved attention implementations help serve more concurrent workloads within available hardware limits.

**Adaptive caching:** Systems can use observed traffic, cache value, freshness requirements, and resource pressure to decide what should be retained.

These directions reinforce a broader principle: efficient LLM serving requires coordination between model computation, memory management, application design, and scheduling.

---

## Conclusion

LLM caching is not one technique but a collection of optimizations that operate at different layers of an AI system.

Exact-match caching avoids repeated requests. Semantic caching reuses answers for sufficiently similar queries. Prompt caching reduces repeated processing of eligible prompt prefixes. KV caching avoids recomputing historical attention state during generation, while prefix caching extends that reuse across compatible requests.

At the infrastructure level, PagedAttention, cache eviction, quantization, offloading, and continuous batching help manage memory and improve serving efficiency. Speculative decoding complements these techniques by reducing sequential generation overhead.

The most important lesson is to understand **what is being cached, why it can be reused, and what correctness guarantees must hold before reusing it**.

A well-designed caching system can reduce cost and latency substantially, but only when it is matched to the workload and evaluated with real measurements.

The goal is not simply to make LLMs generate faster. It is to build AI systems that deliver reliable results while using computation and infrastructure efficiently.

---

## Further Reading

### Prompt caching

- [OpenAI — Prompt Caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- [Anthropic — Prompt Caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)

### KV cache and inference infrastructure

- [NVIDIA — Mastering LLM Techniques: Inference Optimization](https://developer.nvidia.com/blog/mastering-llm-techniques-inference-optimization/)
- [vLLM — Automatic Prefix Caching](https://docs.vllm.ai/en/latest/features/automatic_prefix_caching/)
- [NVIDIA — KV Cache Reuse Optimizations](https://developer.nvidia.com/blog/introducing-new-kv-cache-reuse-optimizations-in-nvidia-tensorrt-llm/)
- [NVIDIA — NVFP4 KV Cache Optimization](https://developer.nvidia.com/blog/optimizing-inference-for-long-context-and-large-batch-sizes-with-nvfp4-kv-cache/)

### Semantic caching

- [Redis — Semantic Cache Documentation](https://redis.io/docs/latest/develop/use-cases/semantic-cache/)

### Distributed KV caching

- [vLLM — Serving Agentic Workloads at Scale with Mooncake](https://vllm.ai/blog/2026-05-06-mooncake-store)

*The exact caching behavior, supported data types, retention policies, and configuration options depend on the model provider and inference engine. Consult the relevant documentation before applying these techniques in production.*