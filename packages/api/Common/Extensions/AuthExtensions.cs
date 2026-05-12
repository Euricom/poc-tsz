using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace Api.Common.Extensions;

public static class AuthExtensions
{
    public const string DisabledKey = "Auth:Disabled";

    public static WebApplicationBuilder AddEntraJwtAuth(this WebApplicationBuilder builder)
    {
        if (builder.Configuration.GetValue<bool>(DisabledKey)) return builder;

        var tenantId = builder.Configuration["Auth:TenantId"]
            ?? throw new InvalidOperationException("Auth:TenantId is missing");
        var clientId = builder.Configuration["Auth:ClientId"]
            ?? throw new InvalidOperationException("Auth:ClientId is missing");

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
        return builder;
    }

    public static WebApplication UseEntraJwtAuth(this WebApplication app)
    {
        if (app.Configuration.GetValue<bool>(DisabledKey))
        {
            app.Logger.LogWarning("Auth:Disabled=true — API is unauthenticated. Do not run this in any shared env.");
            return app;
        }
        app.UseAuthentication();
        app.UseAuthorization();
        return app;
    }
}
