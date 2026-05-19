namespace Api.Modules.Users;

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public Role Role { get; set; }
    public List<UserLeave> Leaves { get; set; } = [];
}
