This is a .NET Integration Test project using xunit
For C# conventions, see /docs/agents/conventions-csharp.md

## Integration tests

- Integration tests boot the full app via `WebApplicationFactory<Program>`, which runs the production seeders. Every integration test starts with the 4 default LeaveTypes already present (and any future seeded data).
- Assert on `seeded + delta`, not absolute counts. Tests that assume an empty DB will be flaky as soon as a new seeder is added.
