---
title: "Agentic AI Patterns: From ReAct to LATS"
date: "2026-10-03"
excerpt: "A practical deep dive into the reasoning patterns behind modern AI agents—from ReAct and Plan-and-Execute to ReWOO, Reflexion, Tree of Thoughts, and LATS. Understand how these patterns work, why they exist, and when to use each one."
image: "https://res.cloudinary.com/dq93uuksm/image/upload/v1790956975/Agentic_AI_Patterns_Infographic_dhi6zv.png"
---


## Why reasoning patterns matter

A large language model on its own is a brilliant one-shot answer machine. Ask it a question and it predicts the most likely reply in a single pass. That works for "summarize this email" but breaks down for "find the cheapest flight to Lisbon next month, check my calendar, and book it."

Tasks like that need the model to break a goal into steps, call outside tools, look at what came back, and change course when something fails. The moment you wrap an LLM in a loop that lets it do those things, you have an AI agent.

Every agent has the same four ingredients:

- The model (the brain): decides what to do next.
- Tools (the hands): search, APIs, code execution, databases, a browser.
- Memory (the notebook): the scratchpad of past steps, plus anything stored across runs.
- Control flow (the strategy): the rules for how the model thinks, acts, and checks its work.

The first three are mostly plumbing. The fourth is where the real design choices live, and it is what this post is about. An agentic reasoning pattern is a reusable recipe for that control flow.

We will walk through six patterns roughly in the order they appeared, because each one was invented to fix a weakness in the one before:

1. **ReAct** interleaves thinking and acting in one loop.
2. **Plan-and-Execute** writes a plan first, then works through it.
3. **ReWOO** plans every tool call upfront to save tokens.
4. **Reflexion** learns from its own failures between attempts.
5. **Tree of Thoughts** explores several lines of reasoning instead of one.
6. **LATS** combines search, acting, and reflection into one framework.

For each pattern you will get the core idea, a worked example, simplified pseudo-code, and an honest look at when it shines and when it hurts. At the end there is a comparison table and a decision guide.

## The foundations: thinking and acting

Every pattern in this post combines two older ideas. Understand these and the rest falls into place.

### Chain-of-Thought: let the model think out loud
In 2022, Google researchers showed that simply asking a model to reason step by step before answering sharply improves accuracy on math and logic problems. This is Chain-of-Thought (CoT) prompting.

```
Q: A cafe had 23 apples. It used 20 for lunch and bought 6 more. How many now?
A: Start with 23. After lunch: 23 - 20 = 3. After buying: 3 + 6 = 9. Answer: 9.
```
CoT works because each written step becomes context for the next one. The model effectively gets scratch paper. A follow-up idea, self-consistency, samples several reasoning chains and takes a majority vote on the answer.

The catch: CoT reasons only from what the model already knows. If a fact is missing or outdated, the model happily reasons its way to a confident, wrong answer. This is a major source of hallucination.

### Tool use: let the model act on the world
The opposite approach gives the model tools. Instead of guessing today's exchange rate, the model emits a structured call such as search("USD to EUR rate"). Your code runs it and feeds the result back.
Tools ground the model in real data. But a model that only calls tools, without reasoning between calls, flails: it cannot decompose a goal, notice a dead end, or decide what to try next.

#### The key insight
Reasoning without acting hallucinates. Acting without reasoning flails. Agentic patterns are different ways of weaving the two together, and they differ mainly in three questions:

- When does planning happen? Step by step, or all upfront?
- How many paths are explored? One, or a whole tree?
- Does the agent learn from failure? Within a run, or across runs?

Keep these three questions in mind. Each pattern below is a different answer to them.

## Pattern 1: ReAct (Reason + Act)
One-line summary: think a little, act once, look at the result, repeat.

ReAct is the default loop behind most agent frameworks today. Its insight is simple: interleave CoT-style reasoning with tool calls, so each thought is grounded by the previous observation and each action is guided by a thought.

**How it works**

The agent cycles through three steps until it decides it is done:
1. Thought: the model reasons about the current situation and decides what to do.
2. Action: it calls one tool with specific inputs.
3. Observation: the tool's output is appended to the context.

The whole history (every thought, action, and observation) is fed back into the model on each turn. When the model has enough information, it emits a final answer instead of an action.

A worked example

Question: "Which is older, the company that makes the iPhone or the company that makes Windows?"

```
Thought 1: I need the founding years of Apple and Microsoft.
Action 1: search["Apple founding date"]
Observation 1: Apple was founded on April 1, 1976.

Thought 2: Now I need Microsoft's founding date.
Action 2: search["Microsoft founding date"]
Observation 2: Microsoft was founded on April 4, 1975.

Thought 3: 1975 is earlier than 1976, so Microsoft is older.
Action 3: finish["Microsoft (1975) is older than Apple (1976)."]
```
Notice how Thought 2 depends on Observation 1. The agent adapts as it goes. If the first search had returned nothing useful, the next thought could rephrase the query.

#### Pseudo-code
```python
def react_agent(question, tools, max_steps=10):
    history = [f"Question: {question}"]
    for step in range(max_steps):
        thought, action, args = llm.decide(history)   # one LLM call per step
        history.append(f"Thought: {thought}")
        if action == "finish":
            return args
        observation = tools[action](**args)
        history.append(f"Action: {action}({args})")
        history.append(f"Observation: {observation}")
    return "Stopped: step limit reached"
```
In modern APIs you rarely parse "Thought/Action" text yourself. Native tool calling (function calling) does the same job: the model returns a structured tool call, you run it, and you send back a tool result. That is ReAct under the hood.

## Pattern 2: Plan-and-Execute
One-line summary: write the whole to-do list first, then work through it, revising the list as needed.

ReAct's biggest weakness is short-sightedness. Plan-and-Execute fixes it by separating deciding what to do from doing it. The idea grew out of research like Plan-and-Solve prompting and early autonomous agents such as BabyAGI, and was popularized as a named pattern by LangChain and LangGraph.

##### How it works

There are three roles, which can be the same model with different prompts or different models entirely:

1. Planner: reads the goal and produces a numbered, multi-step plan.
2. Executor: carries out one step at a time. Each step is often a small ReAct loop with tools.
3. Replanner: after each step, looks at progress and decides to continue, rewrite the remaining steps, or finish.

A worked example

Goal: "Write a short market brief on the electric scooter industry in India."
```
PLAN
1. Find the current market size and growth rate.
2. Identify the top 5 manufacturers by sales.
3. Summarize the key government incentives.
4. List the main challenges (charging, battery cost).
5. Write a 300-word brief from steps 1-4.

EXECUTE step 1 -> found market size and growth estimates
REPLAN -> plan still valid, continue
EXECUTE step 2 -> sales data is split by quarter; needs an extra step
REPLAN -> insert step 2b: "Aggregate the last four quarters of sales"
...
EXECUTE step 5 -> final brief
```
The plan keeps the agent focused on the big picture, and the replanner keeps it flexible when reality differs from expectations.

#### Pseudo-code

```python
def plan_and_execute(goal):
    plan = planner_llm.make_plan(goal)          # list of steps
    done = []
    while plan:
        step = plan.pop(0)
        result = executor_agent.run(step, context=done)  # often a mini ReAct loop
        done.append((step, result))
        decision = replanner_llm.review(goal, done, plan)
        if decision.finished:
            return decision.answer
        plan = decision.remaining_steps           # may be rewritten
    return synthesize(goal, done)
```
Strengths

- Better on long, multi-step tasks: the explicit plan stops the agent drifting off-topic.
- Cheaper models for execution: a strong model plans, a smaller, faster model executes simple steps.
- Transparent: humans can read, edit, or approve the plan before anything runs.

Weaknesses

- Plan quality is everything: a bad initial plan wastes every step that follows.
- Still sequential: steps run one after another, so latency is not much better than ReAct.
- Replanning overhead: an extra LLM call after every step adds cost
- Rigidity risk: without a good replanner the agent marches through an outdated plan

## Pattern 3: ReWOO (Reasoning WithOut Observation)
One-line summary: plan every tool call upfront with placeholders, run them all, then reason once at the end.

ReWOO attacks ReAct's cost problem. In ReAct, the model is called after every observation, and each call resends the growing history. ReWOO's insight is that for many tasks you can predict which tools you need before seeing any results. So why keep waking up the expensive model?

##### How it works
ReWOO has three modules:
1. Planner: one LLM call writes the full plan. Each step names a tool and its input, and later steps refer to earlier results using variables like #E1, #E2.
2. Worker: plain code, no LLM. It runs each tool in order, substituting the real result of #E1 wherever later steps reference it.
3. Solver: one final LLM call reads the plan plus all the evidence and writes the answer.

That is just two LLM calls no matter how many tools are used.

A worked example

Question: "What is the population of the capital of the country that won the 2022 FIFA World Cup?"
```
Plan: Find the 2022 World Cup winner.
#E1 = Search["2022 FIFA World Cup winner"]

Plan: Find the capital of that country.
#E2 = LLM["What is the capital of the country in: #E1"]

Plan: Find that city's population.
#E3 = Search["population of #E2"]

--- Worker runs the tools ---
#E1 -> "Argentina won the 2022 FIFA World Cup."
#E2 -> "Buenos Aires"
#E3 -> "Buenos Aires city has about 3.1 million people."

Solver: The 2022 winner was Argentina, whose capital is Buenos Aires,
        with a population of roughly 3.1 million (city proper).
```
Note the placeholders: the planner wrote #E2 and #E3 without knowing what #E1 would contain.

#### Pseudo-code
```python
def rewoo(question):
    plan = planner_llm.plan(question)       # LLM call 1: [(var, tool, input_template)]
    evidence = {}
    for var, tool, template in plan:         # no LLM in this loop
        tool_input = fill_placeholders(template, evidence)
        evidence[var] = tools[tool](tool_input)
    return solver_llm.solve(question, plan, evidence)   # LLM call 2
```
Because the plan is a dependency graph, independent steps can even run in parallel. LLM Compiler takes this idea further by streaming the plan as a task graph and executing independent tool calls concurrently.

Why it works

The ReWOO paper reported about 5x fewer tokens than ReAct on HotpotQA while slightly improving accuracy (about 4 percentage points). Separating planning from execution also makes the system more robust when a tool fails, and lets you use a small model for the planner after fine-tuning.

Strengths

- Token-efficient and cheaper: two LLM calls instead of one per step; no repeated history.
- Faster: tool calls can run back to back or in parallel with no model in the loop.
- Simple to audit: the plan is a clear, static recipe.

Weaknesses

- No adaptation mid-run: if #E1 returns something unexpected, the plan cannot change. Garbage flows straight to the solver.
- Needs predictable tasks: it struggles when the next step genuinely depends on what you discover.
- Planner must be strong: everything rides on getting the plan right the first time.

## Pattern 4: Reflexion
One-line summary: try, get feedback, write yourself a lesson, and try again with that lesson in mind.

The first three patterns share a blind spot: when they fail, they forget. Run the same failing agent again and it makes the same mistake. Reflexion adds learning from experience without retraining the model.

The authors call it verbal reinforcement learning. Traditional reinforcement learning updates a model's weights based on a reward. Reflexion instead turns the reward into a written lesson in plain language and stores it in memory. The model's weights never change; its context gets smarter.

How it works

Reflexion has three components:
1. Actor: the agent that attempts the task, usually a ReAct or CoT agent.
2. Evaluator: scores the attempt. This can be unit tests, an exact-match check, a heuristic ("the agent repeated the same action 3 times"), or another LLM acting as judge.
3. Self-Reflection model: on failure, it analyzes the trajectory and writes a short, specific lesson: what went wrong and what to do differently.

Lessons are kept in an episodic memory buffer (usually the last 1 to 3 reflections) and injected into the actor's prompt on the next attempt.

A worked example

Task: "Write a Python function that returns the median of a list."

```
Attempt 1 (Actor):
  def median(xs): return sorted(xs)[len(xs)//2]
Evaluator: 2 of 4 unit tests failed (even-length lists).

Reflection: "My solution returned the upper-middle element for even-length
lists. The median of an even-length list is the average of the two middle
values. I also did not handle an empty list."

Attempt 2 (Actor, with reflection in context):
  def median(xs):
      if not xs: raise ValueError("empty list")
      s, n = sorted(xs), len(xs)
      mid = n // 2
      return s[mid] if n % 2 else (s[mid-1] + s[mid]) / 2
Evaluator: 4 of 4 tests passed. Done.
```
#### Pseudo-code

```python
def reflexion(task, max_trials=4):
    memory = []                                   # episodic memory of lessons
    for trial in range(max_trials):
        trajectory = actor.run(task, lessons=memory[-3:])
        success, feedback = evaluator.score(task, trajectory)
        if success:
            return trajectory.answer
        lesson = reflector_llm.reflect(task, trajectory, feedback)
        memory.append(lesson)
    return trajectory.answer   # best effort after max_trials
```

Strengths

- Learns from mistakes without fine-tuning or extra training data.
- Interpretable learning: the lessons are human-readable, so you can see what the agent learned.
- Wraps any agent: you can add it on top of ReAct, Plan-and-Execute, or a plain CoT prompt.

Weaknesses

- Needs a good evaluator: if you cannot tell whether an attempt succeeded, reflection has nothing to learn from. An LLM judge can be confidently wrong.
- Multiple full attempts: cost and latency multiply by the number of trials.
- Bad lessons stick: a wrong reflection can mislead every later attempt.
- Needs retry-safe tasks: you cannot "try again" after sending an email or making a payment.

## Pattern 5: Tree of Thoughts (ToT)

One-line summary: instead of following one chain of reasoning, branch into several, score them, and explore the most promising ones.

Every pattern so far follows a single path. If step 2 goes wrong, everything after it is built on sand. Tree of Thoughts treats problem solving as search. Think of how a chess player considers several moves, imagines how each plays out, and abandons the bad ones.

How it works

ToT is defined by four design choices:
1. Thought decomposition: decide what one "thought" (one step) is. It could be one equation, one paragraph plan, or one crossword word.
2. Thought generation: at each node, the model proposes several candidate next thoughts (for example, 3 to 5).
3. State evaluation: the model judges each partial solution, either with a score ("rate 1 to 10") or a label ("sure / maybe / impossible"), or by voting across candidates.
4. Search algorithm: use breadth-first search (keep the best b candidates at each level) or depth-first search (go deep on the best branch, backtrack when a branch is judged hopeless).

A worked example: the Game of 24

Task: use the numbers 4, 9, 10, 13 with + − × ÷ to make exactly 24.

```
Root: [4, 9, 10, 13]

Level 1 candidates (generated):
  a) 13 - 9 = 4   -> left [4, 4, 10]    evaluator: "likely"
  b) 10 - 4 = 6   -> left [6, 9, 13]    evaluator: "maybe"
  c) 4 + 9 = 13   -> left [10, 13, 13]  evaluator: "impossible"  (pruned)

Expand (a): [4, 4, 10]
  a1) 10 - 4 = 6  -> left [4, 6]         evaluator: "sure" (4 x 6 = 24)
  a2) 4 + 4 = 8   -> left [8, 10]        evaluator: "impossible" (pruned)

Solution: (10 - 4) x (13 - 9) = 6 x 4 = 24
```

A linear CoT would commit to its first idea, say option (c), and fail. ToT sees that (c) is a dead end and moves on.

#### Pseudo-code (breadth-first)

```python
def tree_of_thoughts(problem, breadth=5, keep=3, depth=3):
    frontier = [problem.initial_state]
    for level in range(depth):
        candidates = []
        for state in frontier:
            for thought in llm.propose(state, n=breadth):    # generate
                candidates.append(state.extend(thought))
        scored = [(llm.evaluate(c), c) for c in candidates]  # evaluate
        frontier = [c for _, c in sorted(scored, reverse=True)[:keep]]  # prune
    return best_complete_solution(frontier)
```

Why it works

On the Game of 24, GPT-4 with Chain-of-Thought solved only 4% of problems. With Tree of Thoughts it solved 74%. It also produced more coherent creative writing and solved more mini crosswords. The gains come from the ability to look ahead and backtrack.

Strengths

- Escapes early mistakes: bad branches are pruned, good ones expanded.
- Explores alternatives: great when there are many plausible first moves.
- Flexible: you can tune breadth, depth, and search strategy to your budget

Weaknesses

- Very expensive: dozens to hundreds of LLM calls per problem.
- Evaluator-dependent: the model's self-scoring can be noisy, pruning a correct branch.
- Mostly internal reasoning: classic ToT explores thoughts, not real-world actions with tools, so it does not use external feedback.
- Complex to implement and tune compared with a simple loop.

## Pattern 6: LATS (Language Agent Tree Search)

One-line summary: search a tree of real actions (like ToT), act and observe at each node (like ReAct), and learn from failed branches (like Reflexion), all guided by Monte Carlo Tree Search.

LATS is where the story comes together. Each earlier pattern solved one problem:

• ReAct grounds reasoning in real observations but follows one path.

• Tree of Thoughts explores many paths but reasons only internally.

• Reflexion learns from failure but retries whole attempts linearly.

LATS unifies all three. It borrows Monte Carlo Tree Search (MCTS), the algorithm behind AlphaGo, and uses the LLM in three roles at once: as the agent that proposes actions, as the value function that scores states, and as the critic that writes reflections.

#### A quick primer on MCTS
MCTS builds a search tree gradually. It spends more effort on branches that look promising, while still occasionally trying less-explored branches in case they hide something better. This balance is called exploration vs. exploitation, and MCTS manages it with a formula called UCT (Upper Confidence bounds applied to Trees). In plain words, UCT prefers nodes that have a high average score or have rarely been visited.

How it works: the six steps

LATS repeats these steps until it finds a solution or runs out of budget:

1. Selection: starting at the root, walk down the tree, at each level picking the child with the best UCT score, until you reach a leaf.
2. Expansion: the LLM proposes n possible next actions from that leaf (for example, 5). Each one is actually executed in the environment, producing a real observation, and becomes a new child node.
3. Evaluation: the LLM scores each new node: how promising is this state? This can be combined with a self-consistency score across samples.
4. Simulation: from the best new node, keep acting (ReAct-style) until reaching a terminal state: success, failure, or a step limit.
5. Backpropagation: the final reward is passed back up the path, updating the value and visit count of every ancestor node. Good branches become more attractive next time.
6. Reflection: if the trajectory failed, the LLM writes a reflection explaining why. That lesson is stored and added to the context of future expansions, so the agent does not repeat the mistake on other branches

A worked example

Task: "On a shopping site, find a men's waterproof hiking jacket under $100 with at least 4 stars."

```
Root: homepage
├─ A1: search["waterproof hiking jacket men"]      value 0.7
│   ├─ A1a: click item #1 ($140)                   -> over budget, value 0.2
│   ├─ A1b: filter price < $100                    value 0.8  <- selected
│   │    └─ simulate: click item #3, 4.4 stars, $89, waterproof -> SUCCESS (reward 1.0)
│   └─ A1c: click item #2 (not waterproof)         value 0.1
└─ A2: browse category "Outdoor"                     value 0.4

Reflection stored from an earlier failed branch (A1a):
  "I clicked a product before applying the price filter and wasted steps.
   Apply budget filters first."
```
The reflection from A1a improves how every other branch is expanded, and the backpropagated reward makes the A1b path the one the agent returns.

#### Pseudo-code

```python
def lats(task, iterations=30, n_children=5):
    root = Node(state=env.reset(task))
    reflections = []
    for _ in range(iterations):
        node = select_by_uct(root)                                  # 1. selection
        for action in llm.propose(node.state, reflections, n=n_children):
            obs = env.step(node.state, action)                      # 2. expansion (real action)
            child = node.add_child(action, obs)
            child.value = llm.evaluate(child.state)                 # 3. evaluation
        best = max(node.children, key=lambda c: c.value)
        reward, trajectory = simulate(best, reflections)            # 4. simulation
        backpropagate(best, reward)                                 # 5. backpropagation
        if reward == 1.0:
            return trajectory
        reflections.append(llm.reflect(task, trajectory))           # 6. reflection
    return best_trajectory(root)
```

Strengths

• Best-in-class quality on complex, multi-step tasks in the original benchmarks.

• Recovers from mistakes: backtracking plus reflection means one bad action does not doom the run.

• Grounded: every node reflects a real observation, not just an imagined thought.

Weaknesses

• The most expensive pattern here: many branches, many real actions, many LLM calls.

• Requires a resettable environment: to explore branches, the agent must be able to return to an earlier state. That is easy for code or a sandbox, but impossible for side effects like sending an email or placing an order.

• Slow: unsuitable for real-time, interactive use.

• Complex to build: tree management, value estimates, and reflection memory all need careful engineering.

### Side by side: which pattern when?
The six patterns sit on a spectrum from cheap and simple (ReWOO, ReAct) to expensive and powerful (ToT, LATS). Here is how they compare on the three questions from the start, plus cost.


| Pattern | Year | When it plans | Paths explored | Learns from failure | LLM calls per task | Best for |
|--------|--------|--------|--------|--------|--------|--------|
| ReAct | 2022 | One step at a time | One |No |One per step |Open-ended, exploratory tasks; the default |
| Plan-and-Execute | 2023 | Upfront, with replanning | One | Partly (replanner) | Plan + steps + replans | Long tasks with clear structure |
| ReWOO | 2023 | Fully upfront | One |No |Two |Predictable, cost-sensitive workflows |
| Reflexion | 2023 | Per attempt | One per attempt |Yes, across attempts |Attempts × steps |Tasks with reliable success checks |
| Tree of Thoughts | 2023 | Per branch, with lookahead | Many (internal thoughts) |Via pruning |Dozens to hundreds |Hard puzzles and planning, no tools |
| LATS | 2023 | Per branch, via MCTS | Many (real actions) |Yes, across branches |Hundreds |Hardest tasks in resettable environments |

## A simple decision guide

Ask these questions in order:
1. Are the steps known in advance and is cost a priority? Use ReWOO.
2. Is the task long but clearly decomposable, or does a human need to approve the plan? Use Plan-and-Execute.
3. Is it open-ended, where the next step depends on what you find? Use ReAct.
4. Can you automatically check whether an answer is correct, and is retrying safe? Wrap your agent in Reflexion.
5. Is it a hard reasoning problem where early wrong turns are fatal, and no tools are needed? Use Tree of Thoughts.
6. Is it hard, multi-step, in a sandbox you can reset, with quality worth a big budget? Use LATS.
When in doubt, start with ReAct. It is the baseline every other pattern is measured against, and you will learn exactly where it fails before you pay for something heavier.

## Putting patterns into production

In real systems these patterns are building blocks, not rival religions. The best agents usually mix them.

### Combining patterns

• Plan-and-Execute + ReAct: a planner breaks the goal into steps, and each step is a small ReAct loop. This is the most common architecture for research and coding agents.

• ReAct + Reflexion: run a ReAct agent; if tests or a checker fail, reflect and retry. A cheap, high-value upgrade for coding agents.

• ReWOO for the known parts, ReAct for the rest: batch the predictable lookups, then hand off to an adaptive loop for the messy part.

• Routing: a lightweight classifier sends easy requests to a cheap pattern and hard ones to an expensive pattern, keeping average cost low.

