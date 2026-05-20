using System.Reflection;
using Api.Common;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace Api.Common.Extensions;

public static class OpenApiExtensions
{
    public static IServiceCollection AddOpenApiWithRequiredNonNullable(this IServiceCollection services)
    {
        services.AddOpenApi(options =>
        {
            options.CreateSchemaReferenceId = (typeInfo) =>
                typeInfo.Type.GetCustomAttribute<SchemaNameAttribute>()?.Name
                ?? OpenApiOptions.CreateDefaultSchemaReferenceId(typeInfo);

            options.AddSchemaTransformer((schema, _, _) =>
            {
                if (schema.Properties is { Count: > 0 })
                {
                    schema.Required ??= new HashSet<string>();
                    foreach (var (name, property) in schema.Properties)
                    {
                        var isNullable = property.Type is { } t && (t & JsonSchemaType.Null) != 0;
                        if (!isNullable) schema.Required.Add(name);
                    }
                }
                return Task.CompletedTask;
            });

            options.AddDocumentTransformer((document, _, _) =>
            {
                var offenders = (document.Components?.Schemas?.Keys ?? Enumerable.Empty<string>())
                    .Where(name => name.EndsWith("Response", StringComparison.Ordinal))
                    .ToList();

                if (offenders.Count > 0)
                {
                    throw new InvalidOperationException(
                        $"OpenAPI schema names ending in 'Response' are not allowed: {string.Join(", ", offenders)}. " +
                        "Response DTOs must be named after the resource (e.g. 'User' instead of 'UserResponse') " +
                        "via [SchemaName(\"...\")]. See docs/agents/conventions-csharp.md → 'API contract DTOs'.");
                }

                return Task.CompletedTask;
            });
        });
        return services;
    }
}
