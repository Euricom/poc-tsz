using Microsoft.EntityFrameworkCore;

namespace Api.Modules.LeaveTypes;

public class DuplicateLeaveTypeNameException : Exception
{
    public DuplicateLeaveTypeNameException() : base("A leave type with this name already exists.") { }
}

public class LeaveTypeService
{
    private readonly UsersDbContext _db;

    public LeaveTypeService(UsersDbContext db)
    {
        _db = db;
    }

    public Task<List<LeaveType>> GetAllAsync(bool includeArchived = false, CancellationToken ct = default)
    {
        var query = _db.LeaveTypes.AsQueryable();
        if (!includeArchived)
            query = query.Where(lt => !lt.IsArchived);
        return query.ToListAsync(ct);
    }

    public async Task<LeaveType> CreateAsync(CreateLeaveTypeRequest request, CancellationToken ct = default)
    {
        var nameLower = request.Name.ToLowerInvariant();
        var exists = await _db.LeaveTypes.AnyAsync(
            lt => !lt.IsArchived && lt.Name.ToLower() == nameLower, ct);
        if (exists) throw new DuplicateLeaveTypeNameException();

        var leaveType = new LeaveType
        {
            Name = request.Name,
            Allowed = request.Allowed,
            DefaultTotalDays = request.DefaultTotalDays,
            Color = request.Color,
        };
        await _db.LeaveTypes.AddAsync(leaveType, ct);
        await _db.SaveChangesAsync(ct);
        return leaveType;
    }

    public async Task<LeaveType?> UpdateAsync(int id, UpdateLeaveTypeRequest request, CancellationToken ct = default)
    {
        var leaveType = await _db.LeaveTypes.FindAsync([id], ct);
        if (leaveType is null) return null;

        var nameLower = request.Name.ToLowerInvariant();
        var exists = await _db.LeaveTypes.AnyAsync(
            lt => lt.Id != id && !lt.IsArchived && lt.Name.ToLower() == nameLower, ct);
        if (exists) throw new DuplicateLeaveTypeNameException();

        leaveType.Name = request.Name;
        leaveType.Allowed = request.Allowed;
        leaveType.DefaultTotalDays = request.DefaultTotalDays;
        leaveType.Color = request.Color;
        await _db.SaveChangesAsync(ct);
        return leaveType;
    }

    public async Task<bool> ArchiveAsync(int id, CancellationToken ct = default)
    {
        var leaveType = await _db.LeaveTypes.FindAsync([id], ct);
        if (leaveType is null) return false;

        leaveType.IsArchived = true;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> UnarchiveAsync(int id, CancellationToken ct = default)
    {
        var leaveType = await _db.LeaveTypes.FindAsync([id], ct);
        if (leaveType is null) return false;

        leaveType.IsArchived = false;
        await _db.SaveChangesAsync(ct);
        return true;
    }
}
