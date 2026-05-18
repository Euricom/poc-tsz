namespace Api.Modules.LeaveTypes;

public class LeaveType
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Allowed Allowed { get; set; }
    public int? DefaultTotalDays { get; set; }
    public string Color { get; set; } = string.Empty;
    public bool IsArchived { get; set; }
}
