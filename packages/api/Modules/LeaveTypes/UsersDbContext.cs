using Api.Modules.Users;
using Microsoft.EntityFrameworkCore;

namespace Api.Modules.LeaveTypes;

public class UsersDbContext : DbContext
{
    public UsersDbContext(DbContextOptions<UsersDbContext> options) : base(options)
    {
    }

    public DbSet<LeaveType> LeaveTypes => Set<LeaveType>();
    public DbSet<User> Users => Set<User>();
    public DbSet<UserLeave> UserLeaves => Set<UserLeave>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new LeaveTypeConfiguration());
        modelBuilder.ApplyConfiguration(new UserConfiguration());
        modelBuilder.ApplyConfiguration(new UserLeaveConfiguration());
    }
}
