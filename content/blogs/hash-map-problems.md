---
title: Why you should not use a Hashmap as your Key-Value Database Storage?
description: This blog explains why Hashmaps fail under load and why they’re not ideal for storage engines.
date: 2026-04-28
---

I was implementing a Key-Value database and I was naive enough to choose a HashMap (unordered_map) to implement this. I realized this when performing performance testing with an increasing number of concurrent threads, and my DB throughput drastically decreased. So, I needed to understand the reason and find a solution. In this blog, I will try to cover the granular details of what I learnt. My implementation was completely in C++, so I will mention the programming language sometimes, but I will keep this blog language agnostic.

To answer the question that this blog's title asks, you need to know the internal implementation details of an unordered_map in C++.

## unordered_map
```text
[0] -> [key | val] -> [key | val] -> [key | val]
[1] -> [key | val] -> [key | val]
[2] -> nullptr
[3] -> [key | val] -> [key | val] -> [key | val] -> [key | val]
...
[N-1] -> [key | val] -> [key | val] -> [key | val]
```
An unordered map is a collection of buckets and these buckets store a linked list of nodes, and each node contains your key and sometimes value (if you are storing value inside the node). Let me give you an example of insertion of a {key, val} pair to give you a clear idea.
```text
insert("name", "piyush");
-> Compute hash: h = hash("name")
-> Get bucket index: index = h % N, say index = 2
-> Traverse that bucket linked list (chain),
   if key already exists, update the key, else insert at the end.
   OR, insert directly at the beginning, to avoid traversing through the chain.
```
This method is known as **Separate Chaining**. When the hash function returns the same hash for different keys, it's called a collision. In such cases, we just keep inserting the node in the chain of that bucket. Example:

```text
insert("fruit", "apple");
-> Compute hash: h = hash("fruit")
-> Get bucket index: index = h % N, index = 2 (collision with the key "name")
-> In this case, the hash map will add this new node to the same bucket.
```
Now, you have a basic picture of the implementation of an unordered_map in C++. You can now easily think about how searching and deletion would work in an unordered_map.

There is one more term related to hash maps, and that is **Load Factor**, which is defined as:

> Load factor = (number of keys) / (total number of buckets)

Load factor gives you a rough idea of how full your hashmap is, and also tells you an approximate number of keys each bucket holds.

Since everyone is already aware of the pros of a hashmap, let's jump to the problems that might come in your way while using an unordered_map or a HashMap.

### Problems in a Hashmap

##### Rehashing
When the load factor of the hashmap increases above a certain threshold, it means your hashmap is overloaded. It will increase the number of buckets, and now you can think about the cost of this operation. Since `N` changes now, so the hashes that you computed for the keys will also change, and hence it requires rehashing of all the keys that were in the hashmap. This gives you unpredictable latency spikes.

##### Weak concurrency
Due to resizing, it leads to global restructuring of the data structure and this needs a global mutex lock which will block any operation on this hashmap. After this, all the nodes would have moved to other buckets, so every thread must synchronize. This means if a reader thread is reading some node from a bucket, and another thread inserts a key which triggers a rehash, then that reader thread is now traversing a bucket which doesn't exist. So threads must synchronize.

##### Poor write predictability
If many keys land in the same bucket, the hashmap ends up with a very long chain for that bucket. So insert becomes O(length of chain). Even if the hashmap inserts at the beginning, it's still problematic when searching the key, because the hashmap may need to traverse through the entire chain.

>Databases prefer **slightly slower but consistent** over **usually fast but occasionally terrible**.

##### No ordering
A hashmap doesn't store keys in a sorted order, so it doesn't perform well for range queries. Example:
```text
Operation: get values of keys ranging from "c" to "k".
You have to iterate through all the keys in the map and select the required values.
```
##### Cache inefficiency
To search for a key, the hashmap hashes the key and finds the bucket index first. Then it traverses through the chain of nodes to find the key. These nodes can be sitting anywhere in the memory, so the CPU has to access the memory randomly, not sequentially, and CPU doesn't prefer that. Different nodes might be in different cache lines, hence the CPU experiences more cache misses and has to fetch cache lines to search for a key. So the lookup of a key which was supposed to be `O(1)`, turns into `O(cache misses)`.

So, this is all for this blog, but stay tuned for the next one, because in the next blog, I will explain the data structure which solves the above problems and is used by one of the famous open source DBs, LevelDB. Till then the comment section is open for you to guess the name of that data structure.