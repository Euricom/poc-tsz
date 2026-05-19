using System.Reflection;
using System.Text.Json.Serialization;
using Api.Common.Extensions;
using Api.Modules.Animals;
using Api.Modules.LeaveTypes;
using Api.Modules.Users;
using DotNetEnv;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

Env.TraversePath().Load();

var builder = WebApplication.CreateBuilder(args);

builder.AddEntraJwtAuth();
builder.Services.ConfigureHttpJsonOptions(o =>
{
    o.SerializerOptions.NumberHandling = JsonNumberHandling.Strict;
    o.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.AddOpenApiWithRequiredNonNullable();
var databaseUrl = builder.Configuration["App:DatabaseUrl"]
    ?? throw new InvalidOperationException("App:DatabaseUrl is missing");
builder.Services.AddDbContext<AnimalDbContext>(o =>
    o.UseSqlite(DatabaseUrl.ToSqliteConnectionString(databaseUrl)));
builder.Services.AddScoped<AnimalService>();

builder.Services.AddDbContext<UsersDbContext>(o =>
    o.UseSqlite(DatabaseUrl.ToSqliteConnectionString(databaseUrl),
        x => x.MigrationsHistoryTable("__EFMigrationsHistory_Users")
               .MigrationsAssembly("api")));
builder.Services.AddScoped<LeaveTypeService>();
builder.Services.AddScoped<UserService>();

var app = builder.Build();
app.EnsureAnimalDbSeeded();
app.EnsureUsersDbSeeded();
app.UseEntraJwtAuth();

// OpenAPI Spec
app.MapOpenApi("/openapi/{documentName}.json");
app.MapScalarApiReference("/openapi", o =>
    o.WithOpenApiRoutePattern("/openapi/{documentName}.json"));

app.MapGet("/", () => new
{
    name = "Animal API",
    version = Assembly.GetExecutingAssembly().GetName().Version?.ToString()
});

AnimalEndpoints.Map(app);
LeaveTypeEndpoints.Map(app);
UserEndpoints.Map(app);

app.Lifetime.ApplicationStarted.Register(() =>
{
    var addresses = app.Services.GetRequiredService<IServer>()
        .Features.Get<IServerAddressesFeature>()?.Addresses;
    if (addresses is null || addresses.Count == 0) return;

    var useColor = Environment.GetEnvironmentVariable("NO_COLOR") is null
        && !Console.IsOutputRedirected;
    var dim = useColor ? "\x1b[2m" : "";
    var ok = useColor ? "\x1b[1;32m" : "";
    var rst = useColor ? "\x1b[0m" : "";

    Console.WriteLine();
    Console.WriteLine($"{dim}──────────────────────────────────────────{rst}");
    foreach (var url in addresses)
        Console.WriteLine($"  {ok}API{rst} : {ok}{url}{rst}");
    Console.WriteLine($"{dim}──────────────────────────────────────────{rst}");
    Console.WriteLine();
});

app.Run();
