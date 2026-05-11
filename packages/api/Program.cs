using System.Reflection;
using System.Text.Json.Serialization;
using Api.Common.Extensions;
using Api.Modules.Animals;
using DotNetEnv;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

Env.TraversePath().Load();

var builder = WebApplication.CreateBuilder(args);

builder.AddEntraJwtAuth();
builder.Services.ConfigureHttpJsonOptions(o =>
    o.SerializerOptions.NumberHandling = JsonNumberHandling.Strict);
builder.Services.AddOpenApiWithRequiredNonNullable();
builder.Services.AddDbContext<AnimalDbContext>(o =>
    o.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<AnimalService>();

var app = builder.Build();
app.EnsureAnimalDbSeeded();
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

app.Run();
