---
title: Designing a Multithreaded Data Structure
description: An engineering-focused deep dive into designing a high-performance multithreaded data structure with thread-safe reads and writes.
date: 2026-02-21
---

While I was implementing the Count-Min Sketch data structure, which is supposed to be thread-safe, I learned a lot about how to design an optimal thread-safe counter that reduces latency in a system having a lot of thread contention. In this blog, you will learn about different ways to design a thread-safe counter.

I am taking the example of a 2-D array that stores a count at each cell. This way, you will learn different ways to handle thread safety.

```cpp
	   0     1     2     3     4
	+-----+-----+-----+-----+-----+
0	|     |     |     |     |     |
	+-----+-----+-----+-----+-----+
1	|     |     |     |     |     |
	+-----+-----+-----+-----+-----+
2	|     |     |     |     |     |
	+-----+-----+-----+-----+-----+
3	|     |     |     |     |     |
	+-----+-----+-----+-----+-----+
```

Pseudo Code to increment any cell:
```cpp
increment(i, j) {
	a[i][j]++;
}
```

So this increment operation consists of 3 CPU instructions:

1. **Load** : Copy the value from memory into a register so that the CPU can perform the arithmetic operation.
2. **Increment** : Increment the value.
3. **Store** : Store the new value back to memory.

If multiple threads start incrementing the same `a[i][j]`, you must ensure they do not interleave during the load–increment–store sequence. What I want to say is that you must make sure that once a thread completes all these 3 operations, only then should another thread access the value to read/write. So, let's learn how to do it.

# Global Mutex

Pseudo Code
```cpp
mutex global_mutex_; // declare a global mutex to lock/release

increment(i, j) {
	lock(global_mutex_);
	a[i][j]++;
	// do we really need to unlock? I will explain.
}
```

Now, when thread `t1` comes to increment, it first locks the `global_mutex_` and performs the operations (load, increment, store). When another thread `t2` tries to call the same function concurrently (at the same time as `t1`), it also tries to acquire the mutex. But the OS does not allow it since this mutex is not free. So this thread has to wait and may get preempted, so that it can be scheduled later. The same thing will happen to all the threads while thread `t1` is performing its operation.

This way, we make sure that all the threads calling the `increment` function concurrently will increment the counter safely.
### Why do we not need to unlock the mutex?

Because the line `lock(global_mutex_)` uses something called RAII (Resource Acquisition Is Initialization). Let me explain what is happening here:

- When `lock` is created, its constructor gets called and it acquires the lock.
- When the `increment` function ends (even if an exception happens), `lock` goes out of scope and its destructor gets called, which unlocks the mutex.

Great, you just learned a beautiful application of destructors.

This way of using a global mutex does make this operation thread-safe, but:

- Do we really need to lock the entire matrix for any cell update?
- Is it time-optimized? Locking the entire matrix may cost us computation time.

What if `t1` wants to increment `a[1][2]` and `t2` wants to increment `a[1][0]`? They can do it concurrently; it is completely safe, isn’t it? This leads us to the 2nd method.

______
# Row-Level Mutex

Pseudo Code
```cpp
vector<std::mutex> row_mutexes_;    // fine-grained locking
resize the vector according to the number of rows in the matrix

increment(i, j) {
	lock(row_mutexes_[i]);
	a[i][j]++;
}
```

Same explanation, just one small difference here: now different threads operating on different rows of the same matrix can run concurrently and safely. This saves computation time as we are not locking the entire matrix.

Now we can think of even finer-grained locking. Since multiple threads writing to different cells of the matrix can safely run concurrently, why lock the entire row? Why not lock the cell itself? This leads us to the 3rd method.

______
# Cell-Level Mutex

Pseudo Code
```cpp
vector<vector<mutex>> cell_mutexes_;
resize the vector according to the dimennsions of the matrix

increment(i, j) {
	lock(cell_mutexes_[i][j]);
	a[i][j]++;
}
```

Now, threads operating on different cells can safely run concurrently, saving even more computation time.

So, all these three methods help us implement a thread-safe counter, but all involve locking of threads, which involves:

- OS-level locking
- Scheduling
- Context switching

Because of these things, all three design approaches may still not achieve the desired computation time for this operation. So does an approach exist that doesn't involve locking and still gives us thread safety?

Yes, and this leads us to our 4th and final way of designing a thread-safe counter.

_____
# Atomic Increment

Pseudo Code
```cpp
vector<vector<atomic<uint32_t>>> matrix_;
Resize the vector

// to increment matrix_[i][j] by 1
matrix_[i][j].fetch_add(
	1, memory_order_relaxed
);

// to read
uint32_t value = matrix_[i][j].load(memory_order_relaxed);
```

Don't get confused by the syntax, this is just the way you write the code to read or write atomically. But I will go deep into the implementation of this, how are we even able to increment values without locking? First, you need to understand:

- How CPU cores use cache lines to operate
- What a cache line is
- How cache coherency is maintained across cores

Let's understand it with an example where a CPU has 2 cores.

![cache-line](/piyush-writes/images/thread-safe-counters/cache-lines.jpeg)

The cores keep values stored in their cache so that they can operate faster, and after any modification, they load the cache line into RAM later. One block of 64B (a typical size) is called a cache line. But since it is distributed across multiple cores, how are values maintained across cores (cache coherency)?

### Cache Coherency Protocol

The CPU uses a protocol called MESI (Modified, Exclusive, Shared, Invalid) to maintain coherency across cores.

When a thread `t1` running on `Core1` wants to update a cache line, the CPU sends a message on the **CPU interconnect** to all other cores to **invalidate** their copies of that cache line, updating their state to **Invalid**. Then `Core1` takes **exclusive** control of the cache line and modifies it. After modification, the cache line state becomes **Modified**.

If another thread `t2` running on `Core2` wants to read/write the same cache line concurrently, the CPU does not allow it to take exclusive ownership because it is currently held by `t1`. Once `t1` finishes updating, `t2` can take exclusive ownership. Since the cache line in `Core2` is invalid, it receives the updated cache line shared from `Core1`.

Each core has three cache layers:

- L1 Cache (Fastest, private to the core)
- L2 Cache (Faster, private to the core)
- L3 Cache (Shared across cores)

So `Core1` shares the updated cache line via the L3 cache, not by storing it back to RAM, because writing to RAM and reading it again would be slower.

Core1 → Shared Cache → Core2 ---> Fast  
Core1 → RAM → Core2 ---> Slow

Take a deep breath now, because these things can be very complicated. I am trying to explain them in simple words. You just learned how the CPU works with cache lines. I already have a post on X pinned which says, "CPUs are MESI."

Now, let's learn how atomic increment works.

So when we write `fetch_add` in the code, it gets converted into a CPU instruction:
```asm
LOCK XADD [memory]
```

When thread `t1` running on `Core1` hits this instruction, it requests **exclusive** control of the cache line and sends a message on the **CPU interconnect** to invalidate copies in other cores. If another thread `t2` running on `Core2` hits the same instruction concurrently, it cannot get exclusive control. But this thread is not locked or put into a wait queue to be scheduled later. Instead, it is paused at this instruction (`LOCK XADD`). This means the thread is still on the core and not preempted.

Why is this faster?

- No OS-level locking is involved
- The scheduler is not involved
- No context switching
- The thread is not preempted; it remains on the core
- CPU-level stalling of the instruction happens in nanoseconds

Because of the cache coherency protocol, these threads can increment the counters atomically.

In simple words:

- With a mutex, threads are waiting at the door to enter, but the door is closed.
- With atomic increment, threads are waiting at the door to enter, the door is open, but they are paused at the door.

Reading values does not involve locking. To read a value, the core running the thread just checks whether its cache line state is valid. If not, it gets the updated cache line from shared cache.

This method is much faster than the three methods explained above.

So, you just learned different ways of designing thread-safe counters.



\- Piyush