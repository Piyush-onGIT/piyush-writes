---
title: Why Basic Consistent Hashing Isn’t Enough (And How Big Systems Fix It)
description: Practical limitations of basic consistent hashing and understand how large-scale systems like DynamoDB and Cassandra overcome them.
date: 2026-02-13
---

In this blog, you will learn how industry giants like Amazon and Facebook addressed the limitations of basic consistent hashing. If you don’t know about Consistent Hashing, please read my previous blog on the same here:  
[https://piyush-ongit.github.io/piyush-writes/blog/load-balancing](https://piyush-ongit.github.io/piyush-writes/blog/load-balancing).

Let’s start by understanding the two major limitations of basic consistent hashing:

1. The random position assignment of each node on the ring leads to non-uniform data and load distribution.
2. The basic algorithm is oblivious to the heterogeneity in the performance of nodes.

The first one is simple. As I explained in the previous blog, in consistent hashing we hash the server IDs and place them on the ring based on the hash value. This hash value can be any random number, so the servers can end up at random positions on the ring. Because of this randomness, the distribution of requests going to a particular server becomes non-uniform.

The second limitation means that the basic algorithm does not know which node has better processing power (better performance). It simply places them randomly on the ring assuming all nodes are equal. This leads to the creation of hot spots. A node with less processing power can get overwhelmed because a huge number of requests may be routed to it. This becomes a bottleneck in the system.

![ring-with-hotspot](/piyush-writes/images/better-consistent-hashing/ring1-hotspot.jpeg)

Now let’s understand the ways to address these challenges and design a robust system.

## Virtual Nodes

In basic consistent hashing, each server is placed only once on the ring. But what if we place each server at multiple positions on the ring?

Example: Suppose we have 3 physical servers, `A`, `B`, and `C`. Now we need to place them on the ring in such a way that the load gets evenly distributed and no server gets overwhelmed.

![ring-with-vnodes](/piyush-writes/images/better-consistent-hashing/ring-vnodes.jpeg)

In the above figure, you see `A1`, `B1`, `C1`, and so on. These are nothing but the physical servers `A`, `B`, and `C`, but placed at multiple points on the ring. `A1`, `A2`, `A3` are the virtual nodes of physical node `A`. The same applies to `B` and `C`.

The advantages of using virtual nodes are:

- If a node becomes unavailable, the load gets evenly distributed among the remaining available nodes. Without virtual nodes, the next available node would suddenly start receiving a large number of additional requests.
- When a new node is added, or when a previously unavailable node becomes available again, it accepts a roughly equivalent amount of load from each of the other available nodes. Basically, the cost of adding a new server to the ring is minimized. (What is cost here? -> I have explained this in detail in my previous blog.)

This technique is used by Amazon’s DynamoDB to balance the load across multiple nodes. When a user sends a `get` or `put` request to the database, it is evenly distributed across the available nodes.

## Dynamic Load Balancing

When a node becomes a hot spot, meaning it processes a large number of requests, it becomes heavily loaded and creates a bottleneck in the system. However, we can utilize the lightly loaded nodes - and this is where the concept of dynamic load balancing comes in.

We can analyze the load information on the ring and move lightly loaded nodes in such a way that the node which was previously a hot spot becomes evenly loaded. This technique helps make deterministic decisions to balance the load based on the performance of the nodes.

Since we analyze load information during runtime, this approach is called **Dynamic Load Balancing**. Moving a node on the ring simply means that the node becomes responsible for a new range of hash values (i.e., a different range of request hashes).

Cassandra DB uses this technique to partition data across multiple servers.

So in this way, we can fine-tune the basic consistent hashing algorithm to address its challenges and meet our system needs.

\- Piyush