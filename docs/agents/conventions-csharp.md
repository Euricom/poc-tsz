# C# Guidelines

**General guidelines:**

- Make sure the follow the base coding guidelines in `docs/agents/coding-guidelines.md`

**C# Specific guidelines:**

- After C# changes, run `bun run build:api` and fix all errors

## EF Core migrations

- If you regenerate a migration (delete + re-add with a different name), also drop the dev SQLite file (`rm packages/api/tsz.db`). The migrations history table keeps the old name and `dev:api` will crash on startup with `table "..." already exists`.
- Don't rename a migration once it has been applied. Treat applied migrations as immutable; add a new one to amend.

## In-memory provider quirks

- The unit test harness uses `Microsoft.EntityFrameworkCore.InMemory`, which does NOT honor SQLite features like `UseCollation("NOCASE")` or unique-index constraints the same way the real DB does.
- Keep explicit `ToLower()` / `ToLowerInvariant()` comparisons in service code for case-insensitive uniqueness checks even when the column has a NOCASE collation — the collation only fires under SQLite.
- Don't rely on EF to surface a duplicate-key exception from a unique index in unit tests; the service must do the existence check and throw a typed exception itself.

## Integration tests

- Integration tests boot the full app via `WebApplicationFactory<Program>`, which runs the production seeders. Every integration test starts with the 4 default LeaveTypes already present (and any future seeded data).
- Assert on `seeded + delta`, not absolute counts. Tests that assume an empty DB will be flaky as soon as a new seeder is added.

## API contract DTOs

- Endpoints always return an explicit DTO defined in `*Contracts.cs`, never the EF entity directly — even when the shape is 1:1 with the entity. This decouples the wire format from storage and gives derived fields (e.g. `BalanceDays`) a home. The service does the entity → DTO projection.
- Every response/request DTO carries a `[SchemaName("...")]` attribute whose value matches the TypeSpec model name. This makes the OpenAPI schema (and the generated TypeScript types) match the TypeSpec contract verbatim. Example:
  ```csharp
  [SchemaName("User")]
  public class UserResponse { ... }
  ```
  `CreateXxxRequest` / `UpdateXxxRequest` need no attribute when their C# class name already matches the TypeSpec name.
- A document transformer in `OpenApiExtensions.AddOpenApiWithRequiredNonNullable` enforces this: the API will throw on OpenAPI document generation if any schema name ends in `Response`. Adding `[SchemaName("...")]` resolves it.

## Configuration overrides

- `Program.cs` calls `Env.TraversePath().Load()` (DotNetEnv) at startup, which populates env vars from `.env` before the configuration system reads them. Plain env-var overrides (e.g. `APP__DATABASEURL=...`) are shadowed by `.env`.
- To override config when invoking the API (scripts, automation, `bun run dev:api`), pass CLI arguments: `dotnet run --project packages/api -- --App:DatabaseUrl="Data Source=/tmp/test.db"`. CLI args win over env vars in ASP.NET Core's default configuration chain.
