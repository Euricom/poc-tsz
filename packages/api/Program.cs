using System.Reflection;
using System.Text.Json.Serialization;
using Api.Modules.Animals;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Scalar.AspNetCore;

Env.TraversePath().Load();

var builder = WebApplication.CreateBuilder(args);

var authDisabled = builder.Configuration.GetValue<bool>("Auth:Disabled");
if (!authDisabled)
{
    var tenantId = builder.Configuration["AzureAd:TenantId"]
        ?? throw new InvalidOperationException("AzureAd:TenantId is missing");
    var clientId = builder.Configuration["AzureAd:ClientId"]
        ?? throw new InvalidOperationException("AzureAd:ClientId is missing");

    builder.Services
        .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(o =>
        {
            o.Authority = $"https://login.microsoftonline.com/{tenantId}/v2.0";
            o.TokenValidationParameters = new TokenValidationParameters
            {
                ValidAudiences = new[] { $"api://{clientId}" },
                ValidIssuers   = new[] { $"https://sts.windows.net/{tenantId}/" },
            };
        });
    builder.Services.AddAuthorization();
}

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.NumberHandling = JsonNumberHandling.Strict;
});
builder.Services.AddOpenApi(options =>
{
    options.AddSchemaTransformer((schema, _, _) =>
    {
        if (schema.Properties is { Count: > 0 })
        {
            schema.Required ??= new HashSet<string>();
            foreach (var (name, property) in schema.Properties)
            {
                var isNullable = property.Type is { } t && (t & JsonSchemaType.Null) != 0;
                if (!isNullable)
                {
                    schema.Required.Add(name);
                }
            }
        }
        return Task.CompletedTask;
    });
});
builder.Services.AddDbContext<AnimalDbContext>(options =>
{
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection"));
});
builder.Services.AddScoped<AnimalService>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AnimalDbContext>();
    db.Database.EnsureCreated();
    if (!db.Animals.Any())
        new AnimalSeeder(db).Seed();
}


// app.UseHttpsRedirection();
if (!authDisabled)
{
    app.UseAuthentication();
    app.UseAuthorization();
}
else
{
    app.Logger.LogWarning("Auth:Disabled=true — API is unauthenticated. Do not run this in any shared env.");
}

app.MapOpenApi("/openapi/{documentName}.json");
app.MapScalarApiReference("/openapi", options =>
{
    options.WithOpenApiRoutePattern("/openapi/{documentName}.json");
});

app.MapGet("/", () => new
{
    name = "Animal API",
    version = Assembly.GetExecutingAssembly().GetName().Version?.ToString()
});

AnimalEndpoints.Map(app);

app.Run();
