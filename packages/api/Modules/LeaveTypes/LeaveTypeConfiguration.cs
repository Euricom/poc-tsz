using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Modules.LeaveTypes;

public class LeaveTypeConfiguration : IEntityTypeConfiguration<LeaveType>
{
    public void Configure(EntityTypeBuilder<LeaveType> builder)
    {
        builder.ToTable("LeaveTypes");
        builder.HasKey(l => l.Id);
        builder.Property(l => l.Name).IsRequired().HasMaxLength(100);
        builder.Property(l => l.Allowed).IsRequired();
        builder.Property(l => l.DefaultTotalDays);
        builder.Property(l => l.Color).IsRequired().HasMaxLength(7);
        builder.Property(l => l.IsArchived).IsRequired().HasDefaultValue(false);
    }
}
