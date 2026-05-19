using Api.Modules.LeaveTypes;
using Microsoft.EntityFrameworkCore;

namespace Api.Modules.Users;

public class DuplicateUserEmailException : Exception
{
    public DuplicateUserEmailException() : base("A user with this email already exists.") { }
}

public class UserService
{
    private readonly UsersDbContext _db;

    public UserService(UsersDbContext db)
    {
        _db = db;
    }

    public Task<List<UserResponse>> GetAllAsync(CancellationToken ct = default)
    {
        return _db.Users
            .Include(u => u.Leaves)
            .ThenInclude(ul => ul.LeaveType)
            .Select(u => ToResponse(u))
            .ToListAsync(ct);
    }

    public async Task<UserResponse> CreateAsync(CreateUserRequest request, CancellationToken ct = default)
    {
        var emailLower = request.Email.ToLowerInvariant();
        var exists = await _db.Users.AnyAsync(u => u.Email.ToLower() == emailLower, ct);
        if (exists) throw new DuplicateUserEmailException();

        var user = new User
        {
            Name = request.Name,
            Email = request.Email,
            Role = request.Role,
        };

        var year = DateTime.UtcNow.Year;
        var leaveTypes = await _db.LeaveTypes.Where(lt => !lt.IsArchived).ToListAsync(ct);
        foreach (var lt in leaveTypes)
        {
            _db.UserLeaves.Add(new UserLeave
            {
                User = user,
                LeaveType = lt,
                Year = year,
                TotalDays = lt.DefaultTotalDays,
                TakenDays = 0,
            });
        }

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        await _db.Entry(user).Collection(u => u.Leaves).Query()
            .Include(ul => ul.LeaveType)
            .LoadAsync(ct);

        return ToResponse(user);
    }

    private static UserResponse ToResponse(User user) => new(
        user.Id,
        user.Name,
        user.Email,
        user.Role,
        user.Leaves.Select(ul => new UserLeaveResponse(
            ul.Id,
            ul.LeaveType.Name,
            ul.LeaveType.Allowed,
            ul.TotalDays,
            ul.TakenDays,
            ul.TotalDays.HasValue ? ul.TotalDays.Value - ul.TakenDays : null
        )).ToList()
    );
}
