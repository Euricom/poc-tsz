using Api.Modules.LeaveTypes;
using Api.Modules.Users;
using Microsoft.EntityFrameworkCore;

namespace Api.Tests;

public class LeaveTypeServiceTests
{
    private static LeaveTypeService CreateService(out UsersDbContext context)
    {
        var options = new DbContextOptionsBuilder<UsersDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        context = new UsersDbContext(options);
        return new LeaveTypeService(context);
    }

    [Fact]
    public async Task GetAll_ExcludesArchivedByDefault()
    {
        var service = CreateService(out var context);
        await context.LeaveTypes.AddRangeAsync(
            new LeaveType { Name = "Verlof", Allowed = Allowed.Limited, DefaultTotalDays = 20, Color = "#3B82F6", IsArchived = false },
            new LeaveType { Name = "Ziekte", Allowed = Allowed.Unlimited, Color = "#EF4444", IsArchived = true }
        );
        await context.SaveChangesAsync();

        var result = await service.GetAllAsync();

        Assert.Single(result);
        Assert.Equal("Verlof", result[0].Name);
    }

    [Fact]
    public async Task GetAll_IncludeArchived_ReturnsAll()
    {
        var service = CreateService(out var context);
        await context.LeaveTypes.AddRangeAsync(
            new LeaveType { Name = "Verlof", Allowed = Allowed.Limited, DefaultTotalDays = 20, Color = "#3B82F6", IsArchived = false },
            new LeaveType { Name = "Ziekte", Allowed = Allowed.Unlimited, Color = "#EF4444", IsArchived = true }
        );
        await context.SaveChangesAsync();

        var result = await service.GetAllAsync(includeArchived: true);

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task Create_AddsLeaveTypeAndReturnsIt()
    {
        var service = CreateService(out _);
        var request = new CreateLeaveTypeRequest
        {
            Name = "ADV",
            Allowed = Allowed.Limited,
            DefaultTotalDays = 5,
            Color = "#10B981",
        };

        var created = await service.CreateAsync(request);

        Assert.Equal("ADV", created.Name);
        Assert.Equal(Allowed.Limited, created.Allowed);
        Assert.Equal(5, created.DefaultTotalDays);
        Assert.Equal("#10B981", created.Color);
        Assert.False(created.IsArchived);
        Assert.True(created.Id > 0);
    }

    [Fact]
    public async Task Create_DuplicateName_ThrowsDuplicateException()
    {
        var service = CreateService(out var context);
        await context.LeaveTypes.AddAsync(
            new LeaveType { Name = "Verlof", Allowed = Allowed.Limited, DefaultTotalDays = 20, Color = "#3B82F6" });
        await context.SaveChangesAsync();

        var request = new CreateLeaveTypeRequest
        {
            Name = "VERLOF",
            Allowed = Allowed.Limited,
            DefaultTotalDays = 10,
            Color = "#000000",
        };

        await Assert.ThrowsAsync<DuplicateLeaveTypeNameException>(
            () => service.CreateAsync(request));
    }

    [Fact]
    public async Task Create_SameNameAsArchived_Succeeds()
    {
        var service = CreateService(out var context);
        await context.LeaveTypes.AddAsync(
            new LeaveType { Name = "Verlof", Allowed = Allowed.Limited, DefaultTotalDays = 20, Color = "#3B82F6", IsArchived = true });
        await context.SaveChangesAsync();

        var request = new CreateLeaveTypeRequest
        {
            Name = "Verlof",
            Allowed = Allowed.Limited,
            DefaultTotalDays = 15,
            Color = "#000000",
        };

        var created = await service.CreateAsync(request);

        Assert.Equal("Verlof", created.Name);
    }

    [Fact]
    public async Task Update_ChangesNameAllowedDaysColor()
    {
        var service = CreateService(out var context);
        var added = context.LeaveTypes.Add(
            new LeaveType { Name = "Old", Allowed = Allowed.Limited, DefaultTotalDays = 10, Color = "#000000" });
        await context.SaveChangesAsync();

        var request = new UpdateLeaveTypeRequest
        {
            Name = "New",
            Allowed = Allowed.Unlimited,
            DefaultTotalDays = null,
            Color = "#FFFFFF",
        };
        var updated = await service.UpdateAsync(added.Entity.Id, request);

        Assert.NotNull(updated);
        Assert.Equal("New", updated.Name);
        Assert.Equal(Allowed.Unlimited, updated.Allowed);
        Assert.Null(updated.DefaultTotalDays);
        Assert.Equal("#FFFFFF", updated.Color);
    }

    [Fact]
    public async Task Update_DoesNotAffectOtherRows()
    {
        var service = CreateService(out var context);
        var target = context.LeaveTypes.Add(
            new LeaveType { Name = "Target", Allowed = Allowed.Limited, DefaultTotalDays = 10, Color = "#000000" });
        var other = context.LeaveTypes.Add(
            new LeaveType { Name = "Other", Allowed = Allowed.Limited, DefaultTotalDays = 5, Color = "#FFFFFF" });
        await context.SaveChangesAsync();

        var request = new UpdateLeaveTypeRequest
        {
            Name = "Updated",
            Allowed = Allowed.Limited,
            DefaultTotalDays = 20,
            Color = "#123456",
        };
        await service.UpdateAsync(target.Entity.Id, request);

        var otherRow = await context.LeaveTypes.FindAsync(other.Entity.Id);
        Assert.NotNull(otherRow);
        Assert.Equal("Other", otherRow.Name);
        Assert.Equal(5, otherRow.DefaultTotalDays);
        Assert.Equal(2, await context.LeaveTypes.CountAsync());
    }

    [Fact]
    public async Task Archive_SetsIsArchivedTrue_NeverDeletes()
    {
        var service = CreateService(out var context);
        var added = context.LeaveTypes.Add(
            new LeaveType { Name = "Verlof", Allowed = Allowed.Limited, DefaultTotalDays = 20, Color = "#3B82F6" });
        await context.SaveChangesAsync();

        var result = await service.ArchiveAsync(added.Entity.Id);

        Assert.True(result);
        var row = await context.LeaveTypes.FindAsync(added.Entity.Id);
        Assert.NotNull(row);
        Assert.True(row.IsArchived);
        Assert.Equal(1, await context.LeaveTypes.CountAsync());
    }

    [Fact]
    public async Task Archive_NonExisting_ReturnsFalse()
    {
        var service = CreateService(out _);

        var result = await service.ArchiveAsync(999);

        Assert.False(result);
    }

    [Fact]
    public async Task Create_BackfillsUserLeaveForEachExistingUser()
    {
        var service = CreateService(out var context);
        await context.Users.AddRangeAsync(
            new User { Name = "Alice", Email = "alice@example.com", Role = Role.User },
            new User { Name = "Bob", Email = "bob@example.com", Role = Role.Admin }
        );
        await context.SaveChangesAsync();

        var request = new CreateLeaveTypeRequest
        {
            Name = "ADV",
            Allowed = Allowed.Limited,
            DefaultTotalDays = 5,
            Color = "#000000",
        };
        await service.CreateAsync(request);

        var userLeaves = await context.UserLeaves.ToListAsync();
        Assert.Equal(2, userLeaves.Count);
        Assert.All(userLeaves, ul => Assert.Equal(5, ul.TotalDays));
        Assert.All(userLeaves, ul => Assert.Equal(0, ul.TakenDays));
        Assert.All(userLeaves, ul => Assert.Equal(DateTime.UtcNow.Year, ul.Year));
    }

    [Fact]
    public async Task Create_WithNoExistingUsers_CreatesLeaveTypeWithoutBackfill()
    {
        var service = CreateService(out var context);

        var request = new CreateLeaveTypeRequest
        {
            Name = "Unlimited type",
            Allowed = Allowed.Unlimited,
            Color = "#000000",
        };
        await service.CreateAsync(request);

        var userLeaves = await context.UserLeaves.ToListAsync();
        Assert.Empty(userLeaves);
    }
}
