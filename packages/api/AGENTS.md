This is a .NET API built with ASP.NET Core 10.0, using minimal API approach & MSQL DB
For C# conventions, see /docs/agents/conventions-csharp.md
If the API endpoints are updated, run `bun run gen:api` to update the API schema.

## EF Core migrations

- If you regenerate a migration (delete + re-add with a different name), also drop the dev SQLite file (`rm packages/api/tsz.db`). The migrations history table keeps the old name and `dev:api` will crash on startup with `table "..." already exists`.
- Don't rename a migration once it has been applied. Treat applied migrations as immutable; add a new one to amend.
  
## EF Core entity operations

- Don't `await DbSet<T>.AddAsync(...)` in a loop. `AddAsync` is only meaningful for value generators that need a DB round-trip (HiLo); SQLite autoincrement does not. For bulk inserts use `AddRangeAsync(items)` with a `Select(...)` projection; for a single insert plain `Add(...)` is fine.
- Don't null-coalesce on a required EF navigation property after `.Include(...)`. If the nav is declared `Type Nav { get; set; } = null!;` and the query Includes it, treat it as non-null in projection code (`leave.LeaveType.Name`, not `leave.LeaveType?.Name ?? ""`). The `?? fallback` is unreachable and hides bugs if the Include is later dropped.

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


