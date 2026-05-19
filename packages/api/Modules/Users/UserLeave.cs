using Api.Modules.LeaveTypes;

namespace Api.Modules.Users;

public class UserLeave
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int LeaveTypeId { get; set; }
    public LeaveType LeaveType { get; set; } = null!;
    public int Year { get; set; }
    public int? TotalDays { get; set; }
    public int TakenDays { get; set; }
}
