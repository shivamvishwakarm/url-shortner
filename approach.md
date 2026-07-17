
# Approach

## How to generate unique id which is also short (max length 8)

## 1. Timestamp as an ID + Base62

The good thing about using timestamp as an ID is that it is always increasing. Since I'm using PostgreSQL for this project, which uses a B+ Tree index, new records will mostly be inserted towards the right-most leaf. This results in sequential writes and good write performance.

But this approach has one problem. A timestamp alone cannot guarantee uniqueness. If multiple requests arrive within the same timestamp resolution (for example, within the same millisecond), they'll generate the same ID. This problem becomes even more challenging when multiple application instances are running.

---

## 2. Auto Increment + Base62

We can use **in memory counter** and then encode it using Base62. We'll use redis **INCR**

This approach is simple, collision free, database friendly, and easy to maintain. Since auto increment IDs are sequential, they also work well with PostgreSQL's B+ Tree indexes.

---

## 3. URL Hash

The URL hash comes first in the mind when building this kind of system. But there are a few problems with using hashes.

The generated hash is usually too long for a URL shortener. We can truncate it, but then there is a chance of collision.

Another issue is that hashes are deterministic. The same URL will always generate the same hash. Depending on the product requirements, this may or may not be the desired behaviour.

---

## 4. Snowflake + Base62

This one is pretty interesting. Snowflake IDs are basically divided into multiple parts like (timestamp, machine ID, sequence number), and then we can Base62 encode the generated number.

This approach is collision free by design, database friendly, and scales very well in distributed systems.

But for this project, I'm building a simple service running on a single PostgreSQL instance. Introducing Snowflake would add unnecessary complexity without providing much benefit.

---

## Conclusion

For this project, I'll go with **Counter + Base62**.

It is easy to generate and maintain, collision free, database friendly, and produces short URL-safe codes.

Since PostgreSQL guarantees the uniqueness of the auto increment ID, and Base62 is a one-to-one encoding, every generated short code is also guaranteed to be unique.



# Custom alias handling

We can directly query the database to check whether the custom alias is already taken. Since we'll create a **UNIQUE index** on the `alias` column, this lookup is already highly optimized.

As a future optimization, we can introduce a **Bloom Filter** to quickly determine whether an alias is definitely not present before querying the database. However, Bloom Filters can produce **false positives**, meaning they may report that an alias exists when it actually doesn't. Therefore, the database must still be the source of truth.

For this assignment, using a Bloom Filter would add unnecessary complexity without providing much benefit.
