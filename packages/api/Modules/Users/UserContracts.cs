using System.ComponentModel.DataAnnotations;
using Api.Modules.LeaveTypes;

namespace Api.Modules.Users;

public class CreateUserRequest
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    public Role Role { get; set; }
}

public record UserLeaveResponse(
    int Id,
    string Name,
    Allowed Allowed,
    int? TotalDays,
    int TakenDays,
    int? BalanceDays
);

public record UserResponse(
    int Id,
    string Name,
    string Email,
    Role Role,
    List<UserLeaveResponse> Leaves
);
