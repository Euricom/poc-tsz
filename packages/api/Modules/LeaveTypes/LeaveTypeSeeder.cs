using Microsoft.EntityFrameworkCore;

namespace Api.Modules.LeaveTypes;

public static class LeaveTypeSeederExtensions
{
    public static WebApplication EnsureUsersDbSeeded(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<UsersDbContext>();
        if (db.Database.IsRelational())
            db.Database.Migrate();
        else
            db.Database.EnsureCreated();
        if (!db.LeaveTypes.Any()) new LeaveTypeSeeder(db).Seed();
        return app;
    }
}

public class LeaveTypeSeeder(UsersDbContext context)
{
    public void Seed()
    {
        context.LeaveTypes.AddRange(
            new LeaveType { Name = "Verlof",        Allowed = Allowed.Limited,   DefaultTotalDays = 20,  Color = "#3B82F6" },
            new LeaveType { Name = "ADV",           Allowed = Allowed.Limited,   DefaultTotalDays = 5,   Color = "#10B981" },
            new LeaveType { Name = "Anciënniteit",  Allowed = Allowed.Limited,   DefaultTotalDays = 0,   Color = "#8B5CF6" },
            new LeaveType { Name = "Ziekte",        Allowed = Allowed.Unlimited, DefaultTotalDays = null, Color = "#EF4444" }
        );
        context.SaveChanges();
    }
}
