using Api.Common.Extensions;
using Api.Common.Filters;

namespace Api.Modules.LeaveTypes;

public static class LeaveTypeEndpoints
{
    public static void Map(WebApplication app)
    {
        var group = app.MapApiGroup("leave-types");
        if (!app.Configuration.GetValue<bool>(AuthExtensions.DisabledKey))
            group.RequireAuthorization();

        group.MapGet("/", async (LeaveTypeService service, bool includeArchived = false, CancellationToken ct = default) =>
            TypedResults.Ok(await service.GetAllAsync(includeArchived, ct)));

        group.MapPost("/", async (CreateLeaveTypeRequest request, LeaveTypeService service, CancellationToken ct) =>
        {
            try
            {
                var leaveType = await service.CreateAsync(request, ct);
                return Results.Created($"/api/leave-types/{leaveType.Id}", leaveType);
            }
            catch (DuplicateLeaveTypeNameException ex)
            {
                return Results.Conflict(new { error = ex.Message });
            }
        }).AddEndpointFilter<ValidationFilter<CreateLeaveTypeRequest>>();

        group.MapPut("/{id:int}", async (int id, UpdateLeaveTypeRequest request, LeaveTypeService service, CancellationToken ct) =>
        {
            try
            {
                var leaveType = await service.UpdateAsync(id, request, ct);
                return leaveType is not null
                    ? Results.Ok(leaveType)
                    : Results.NotFound();
            }
            catch (DuplicateLeaveTypeNameException ex)
            {
                return Results.Conflict(new { error = ex.Message });
            }
        }).AddEndpointFilter<ValidationFilter<UpdateLeaveTypeRequest>>();

        group.MapDelete("/{id:int}", async (int id, LeaveTypeService service, CancellationToken ct) =>
        {
            return await service.ArchiveAsync(id, ct)
                ? Results.NoContent()
                : Results.NotFound();
        });

        group.MapPost("/{id:int}/unarchive", async (int id, LeaveTypeService service, CancellationToken ct) =>
        {
            return await service.UnarchiveAsync(id, ct)
                ? Results.NoContent()
                : Results.NotFound();
        });
    }
}
