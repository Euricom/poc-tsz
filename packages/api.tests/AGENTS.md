This is a .NET Test project using xunit
For C# conventions, see /docs/agents/conventions-csharp.md

## In-memory provider quirks

- The unit test harness uses `Microsoft.EntityFrameworkCore.InMemory`, which does NOT honor SQLite features like `UseCollation("NOCASE")` or unique-index constraints the same way the real DB does.
- Keep explicit `ToLower()` / `ToLowerInvariant()` comparisons in service code for case-insensitive uniqueness checks even when the column has a NOCASE collation — the collation only fires under SQLite.
- Don't rely on EF to surface a duplicate-key exception from a unique index in unit tests; the service must do the existence check and throw a typed exception itself.
