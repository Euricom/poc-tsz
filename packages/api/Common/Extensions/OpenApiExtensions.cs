using Microsoft.OpenApi;

namespace Api.Common.Extensions;

public static class OpenApiExtensions
{
    public static IServiceCollection AddOpenApiWithRequiredNonNullable(this IServiceCollection services)
    {
        services.AddOpenApi(options =>
        {
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
        });
        return services;
    }
}
