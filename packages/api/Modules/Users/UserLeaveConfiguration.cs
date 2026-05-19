using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Modules.Users;

public class UserLeaveConfiguration : IEntityTypeConfiguration<UserLeave>
{
    public void Configure(EntityTypeBuilder<UserLeave> builder)
    {
        builder.ToTable("UserLeaves");
        builder.HasKey(ul => ul.Id);
        builder.Property(ul => ul.Year).IsRequired();
        builder.Property(ul => ul.TotalDays);
        builder.Property(ul => ul.TakenDays).IsRequired().HasDefaultValue(0);

        builder.HasOne(ul => ul.User)
            .WithMany(u => u.Leaves)
            .HasForeignKey(ul => ul.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ul => ul.LeaveType)
            .WithMany()
            .HasForeignKey(ul => ul.LeaveTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(ul => new { ul.UserId, ul.LeaveTypeId, ul.Year }).IsUnique();
    }
}
