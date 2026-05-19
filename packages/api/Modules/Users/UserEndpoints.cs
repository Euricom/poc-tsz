using Api.Common.Extensions;
using Api.Common.Filters;
using Api.Modules.LeaveTypes;

namespace Api.Modules.Users;

public static class UserEndpoints
{
    public static void Map(WebApplication app)
    {
        var group = app.MapApiGroup("users");
        if (!app.Configuration.GetValue<bool>(AuthExtensions.DisabledKey))
            group.RequireAuthorization();

        group.MapGet("/", async (UserService service, CancellationToken ct) =>
            TypedResults.Ok(await service.GetAllAsync(ct)));

        group.MapPost("/", async (CreateUserRequest request, UserService service, CancellationToken ct) =>
        {
            try
            {
                var user = await service.CreateAsync(request, ct);
                return Results.Created($"/api/users/{user.Id}", user);
            }
            catch (DuplicateUserEmailException ex)
            {
                return Results.Conflict(new { error = ex.Message });
            }
        }).AddEndpointFilter<ValidationFilter<CreateUserRequest>>();
    }
}
