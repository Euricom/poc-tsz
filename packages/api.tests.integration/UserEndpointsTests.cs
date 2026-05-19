using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Api.Modules.Animals;
using Api.Modules.LeaveTypes;
using Api.Modules.Users;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;

namespace Api.Tests.Integration;

public class UserEndpointsTests : IClassFixture<WebApplicationFactory<Program>>
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() },
    };

    private readonly HttpClient _client;

    public UserEndpointsTests(WebApplicationFactory<Program> factory)
    {
        var guid = Guid.NewGuid();
        var testFactory = factory.WithWebHostBuilder(builder =>
        {
            builder.UseSetting("Auth:Disabled", "true");
            builder.UseSetting("App:DatabaseUrl", "Data Source=:memory:");
            builder.ConfigureServices(services =>
            {
                var toRemove = services
                    .Where(d =>
                        d.ServiceType == typeof(DbContextOptions<AnimalDbContext>) ||
                        d.ServiceType == typeof(IDbContextOptionsConfiguration<AnimalDbContext>) ||
                        d.ServiceType == typeof(AnimalDbContext) ||
                        d.ServiceType == typeof(DbContextOptions<UsersDbContext>) ||
                        d.ServiceType == typeof(IDbContextOptionsConfiguration<UsersDbContext>) ||
                        d.ServiceType == typeof(UsersDbContext))
                    .ToList();
                foreach (var d in toRemove)
                    services.Remove(d);

                services.AddDbContext<AnimalDbContext>(o =>
                    o.UseInMemoryDatabase("IntegrationTests_Animals_" + guid));
                services.AddDbContext<UsersDbContext>(o =>
                    o.UseInMemoryDatabase("IntegrationTests_Users_" + guid));
            });
        });
        _client = testFactory.CreateClient();
    }

    private async Task<UserResponse> SeedUserViaApiAsync(
        string name = "Alice",
        string email = "alice@example.com",
        Role role = Role.User)
    {
        var request = new CreateUserRequest { Name = name, Email = email, Role = role };
        var response = await _client.PostAsJsonAsync("/api/users", request, JsonOptions);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<UserResponse>(JsonOptions))!;
    }

    private async Task<LeaveType> SeedLeaveTypeViaApiAsync(
        string name = "Verlof",
        Allowed allowed = Allowed.Limited,
        int? defaultTotalDays = 20,
        string color = "#3B82F6")
    {
        var request = new CreateLeaveTypeRequest
        {
            Name = name,
            Allowed = allowed,
            DefaultTotalDays = defaultTotalDays,
            Color = color,
        };
        var response = await _client.PostAsJsonAsync("/api/leave-types", request, JsonOptions);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<LeaveType>(JsonOptions))!;
    }

    [Fact]
    public async Task GetUsers_ReturnsOkWithUsers()
    {
        var response = await _client.GetAsync("/api/users");

        response.EnsureSuccessStatusCode();
        var users = await response.Content.ReadFromJsonAsync<List<UserResponse>>(JsonOptions);
        Assert.NotNull(users);
    }

    [Fact]
    public async Task CreateUser_ValidRequest_ReturnsCreatedWithEmbeddedLeaves()
    {
        // DB is pre-seeded with Verlof (Limited, 20 days) and Ziekte (Unlimited) etc. by LeaveTypeSeeder
        var request = new CreateUserRequest { Name = "Alice", Email = "alice@test.com", Role = Role.Admin };
        var response = await _client.PostAsJsonAsync("/api/users", request, JsonOptions);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var user = await response.Content.ReadFromJsonAsync<UserResponse>(JsonOptions);
        Assert.NotNull(user);
        Assert.Equal("Alice", user.Name);
        Assert.Equal(Role.Admin, user.Role);
        Assert.NotEmpty(user.Leaves);
        Assert.Contains(user.Leaves, l => l.Name == "Verlof" && l.TotalDays == 20 && l.BalanceDays == 20);
        Assert.Contains(user.Leaves, l => l.Name == "Ziekte" && l.TotalDays == null && l.BalanceDays == null);
    }

    [Fact]
    public async Task CreateUser_DuplicateEmail_ReturnsConflict()
    {
        await SeedUserViaApiAsync(email: "dup@test.com");

        var request = new CreateUserRequest { Name = "Other", Email = "DUP@test.com", Role = Role.User };
        var response = await _client.PostAsJsonAsync("/api/users", request, JsonOptions);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task CreateLeaveType_BackfillsExistingUsers_ObservableViaGetUsers()
    {
        await SeedUserViaApiAsync(name: "ExistingUser", email: "existing@test.com");

        // Use a unique name to avoid conflict with the pre-seeded leave types
        await SeedLeaveTypeViaApiAsync("Loopbaanverlof", Allowed.Limited, 10, "#123456");

        var response = await _client.GetAsync("/api/users");
        var users = await response.Content.ReadFromJsonAsync<List<UserResponse>>(JsonOptions);

        Assert.NotNull(users);
        var user = Assert.Single(users);
        Assert.Contains(user.Leaves, l => l.Name == "Loopbaanverlof" && l.TotalDays == 10);
    }

    [Fact]
    public async Task GetUsers_RequiresAuth_WhenAuthEnabled()
    {
        var authFactory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseSetting("Auth:Disabled", "false");
            builder.UseSetting("Auth:TenantId", "00000000-0000-0000-0000-000000000001");
            builder.UseSetting("Auth:ClientId", "00000000-0000-0000-0000-000000000002");
            builder.UseSetting("App:DatabaseUrl", "Data Source=:memory:");
            builder.ConfigureServices(services =>
            {
                var toRemove = services
                    .Where(d =>
                        d.ServiceType == typeof(DbContextOptions<AnimalDbContext>) ||
                        d.ServiceType == typeof(IDbContextOptionsConfiguration<AnimalDbContext>) ||
                        d.ServiceType == typeof(AnimalDbContext) ||
                        d.ServiceType == typeof(DbContextOptions<UsersDbContext>) ||
                        d.ServiceType == typeof(IDbContextOptionsConfiguration<UsersDbContext>) ||
                        d.ServiceType == typeof(UsersDbContext))
                    .ToList();
                foreach (var d in toRemove)
                    services.Remove(d);

                var guid = Guid.NewGuid();
                services.AddDbContext<AnimalDbContext>(o => o.UseInMemoryDatabase("Auth_Animals_" + guid));
                services.AddDbContext<UsersDbContext>(o => o.UseInMemoryDatabase("Auth_Users_" + guid));
            });
        });
        var unauthClient = authFactory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
        });

        var response = await unauthClient.GetAsync("/api/users");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
