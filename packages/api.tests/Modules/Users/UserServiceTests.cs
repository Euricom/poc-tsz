using Api.Modules.LeaveTypes;
using Api.Modules.Users;
using Microsoft.EntityFrameworkCore;

namespace Api.Tests.Modules.Users;

public class UserServiceTests
{
    private static UserService CreateService(out UsersDbContext context)
    {
        var options = new DbContextOptionsBuilder<UsersDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        context = new UsersDbContext(options);
        return new UserService(context);
    }

    // --- Slice 1: create user with leave backfill ---

    [Fact]
    public async Task Create_WithNonArchivedLeaveTypes_BackfillsOneLeavePerType()
    {
        var service = CreateService(out var context);
        await context.LeaveTypes.AddRangeAsync(
            new LeaveType { Name = "Verlof", Allowed = Allowed.Limited, DefaultTotalDays = 20, Color = "#3B82F6" },
            new LeaveType { Name = "Ziekte", Allowed = Allowed.Unlimited, Color = "#EF4444" }
        );
        await context.SaveChangesAsync();

        var request = new CreateUserRequest { Name = "Alice", Email = "alice@example.com", Role = Role.User };
        var user = await service.CreateAsync(request);

        Assert.Equal(2, user.Leaves.Count);
        Assert.Contains(user.Leaves, l => l.Name == "Verlof" && l.TotalDays == 20 && l.TakenDays == 0);
        Assert.Contains(user.Leaves, l => l.Name == "Ziekte" && l.TotalDays == null && l.TakenDays == 0);
    }

    [Fact]
    public async Task Create_ExcludesArchivedLeaveTypesFromBackfill()
    {
        var service = CreateService(out var context);
        await context.LeaveTypes.AddRangeAsync(
            new LeaveType { Name = "Active", Allowed = Allowed.Limited, DefaultTotalDays = 10, Color = "#000000" },
            new LeaveType { Name = "Archived", Allowed = Allowed.Limited, DefaultTotalDays = 5, Color = "#111111", IsArchived = true }
        );
        await context.SaveChangesAsync();

        var request = new CreateUserRequest { Name = "Bob", Email = "bob@example.com", Role = Role.User };
        var user = await service.CreateAsync(request);

        Assert.Single(user.Leaves);
        Assert.Equal("Active", user.Leaves[0].Name);
    }

    [Fact]
    public async Task Create_NoLeaveTypes_CreatesUserWithEmptyLeaves()
    {
        var service = CreateService(out _);

        var request = new CreateUserRequest { Name = "Charlie", Email = "charlie@example.com", Role = Role.Admin };
        var user = await service.CreateAsync(request);

        Assert.Equal("Charlie", user.Name);
        Assert.Equal("charlie@example.com", user.Email);
        Assert.Equal(Role.Admin, user.Role);
        Assert.Empty(user.Leaves);
        Assert.True(user.Id > 0);
    }

    // --- Slice 2: BalanceDays computation ---

    [Fact]
    public async Task Create_LimitedLeaveType_ComputesBalanceDays()
    {
        var service = CreateService(out var context);
        await context.LeaveTypes.AddAsync(
            new LeaveType { Name = "Verlof", Allowed = Allowed.Limited, DefaultTotalDays = 20, Color = "#000000" });
        await context.SaveChangesAsync();

        var user = await service.CreateAsync(new CreateUserRequest { Name = "D", Email = "d@example.com", Role = Role.User });

        var leave = user.Leaves.Single();
        Assert.Equal(20, leave.BalanceDays); // 20 - 0
    }

    [Fact]
    public async Task Create_UnlimitedLeaveType_BalanceDaysIsNull()
    {
        var service = CreateService(out var context);
        await context.LeaveTypes.AddAsync(
            new LeaveType { Name = "Ziekte", Allowed = Allowed.Unlimited, Color = "#000000" });
        await context.SaveChangesAsync();

        var user = await service.CreateAsync(new CreateUserRequest { Name = "E", Email = "e@example.com", Role = Role.User });

        var leave = user.Leaves.Single();
        Assert.Null(leave.BalanceDays);
    }

    // --- Slice 3: unique email ---

    [Fact]
    public async Task Create_DuplicateEmail_ThrowsDuplicateEmailException()
    {
        var service = CreateService(out var context);
        await context.Users.AddAsync(
            new User { Name = "Existing", Email = "existing@example.com", Role = Role.User });
        await context.SaveChangesAsync();

        var request = new CreateUserRequest { Name = "New", Email = "EXISTING@example.com", Role = Role.User };

        await Assert.ThrowsAsync<DuplicateUserEmailException>(
            () => service.CreateAsync(request));
    }

    // --- Slice 4: GetAll ---

    [Fact]
    public async Task GetAll_ReturnsUsersWithEmbeddedLeaves()
    {
        var service = CreateService(out var context);
        var lt = new LeaveType { Name = "ADV", Allowed = Allowed.Limited, DefaultTotalDays = 5, Color = "#000000" };
        await context.LeaveTypes.AddAsync(lt);
        await context.SaveChangesAsync();

        await service.CreateAsync(new CreateUserRequest { Name = "User1", Email = "u1@test.com", Role = Role.User });
        await service.CreateAsync(new CreateUserRequest { Name = "User2", Email = "u2@test.com", Role = Role.User });

        var users = await service.GetAllAsync();

        Assert.Equal(2, users.Count);
        Assert.All(users, u => Assert.Single(u.Leaves));
    }
}
