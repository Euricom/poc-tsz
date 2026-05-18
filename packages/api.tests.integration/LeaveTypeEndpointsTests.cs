using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Api.Modules.Animals;
using Api.Modules.LeaveTypes;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;

namespace Api.Tests.Integration;

public class LeaveTypeEndpointsTests : IClassFixture<WebApplicationFactory<Program>>
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() },
    };

    private readonly HttpClient _client;

    public LeaveTypeEndpointsTests(WebApplicationFactory<Program> factory)
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
    public async Task GetLeaveTypes_ReturnsOkWithTypes()
    {
        var response = await _client.GetAsync("/api/leave-types");

        response.EnsureSuccessStatusCode();
        var types = await response.Content.ReadFromJsonAsync<List<LeaveType>>(JsonOptions);
        Assert.NotNull(types);
    }

    [Fact]
    public async Task GetLeaveTypes_ExcludesArchivedByDefault()
    {
        var seeded = await SeedLeaveTypeViaApiAsync("ToArchive");
        await _client.DeleteAsync($"/api/leave-types/{seeded.Id}");

        var response = await _client.GetAsync("/api/leave-types");

        var types = await response.Content.ReadFromJsonAsync<List<LeaveType>>(JsonOptions);
        Assert.NotNull(types);
        Assert.DoesNotContain(types, t => t.Name == "ToArchive");
    }

    [Fact]
    public async Task GetLeaveTypes_IncludeArchived_ReturnsArchivedToo()
    {
        var seeded = await SeedLeaveTypeViaApiAsync("ArchivedType", color: "#111111");
        await _client.DeleteAsync($"/api/leave-types/{seeded.Id}");

        var response = await _client.GetAsync("/api/leave-types?includeArchived=true");

        response.EnsureSuccessStatusCode();
        var types = await response.Content.ReadFromJsonAsync<List<LeaveType>>(JsonOptions);
        Assert.NotNull(types);
        Assert.Contains(types, t => t.Name == "ArchivedType");
    }

    [Fact]
    public async Task CreateLeaveType_ValidRequest_ReturnsCreated()
    {
        var request = new CreateLeaveTypeRequest
        {
            Name = "Vakantie",
            Allowed = Allowed.Limited,
            DefaultTotalDays = 25,
            Color = "#FF0000",
        };

        var response = await _client.PostAsJsonAsync("/api/leave-types", request, JsonOptions);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var leaveType = await response.Content.ReadFromJsonAsync<LeaveType>(JsonOptions);
        Assert.NotNull(leaveType);
        Assert.Equal("Vakantie", leaveType.Name);
        Assert.Equal("#FF0000", leaveType.Color);
    }

    [Fact]
    public async Task CreateLeaveType_InvalidColor_ReturnsBadRequest()
    {
        var request = new CreateLeaveTypeRequest
        {
            Name = "Test",
            Allowed = Allowed.Limited,
            DefaultTotalDays = 5,
            Color = "invalid",
        };

        var response = await _client.PostAsJsonAsync("/api/leave-types", request, JsonOptions);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateLeaveType_DuplicateName_ReturnsConflict()
    {
        await SeedLeaveTypeViaApiAsync("Duplicate", color: "#222222");

        var request = new CreateLeaveTypeRequest
        {
            Name = "DUPLICATE",
            Allowed = Allowed.Limited,
            DefaultTotalDays = 10,
            Color = "#333333",
        };

        var response = await _client.PostAsJsonAsync("/api/leave-types", request, JsonOptions);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task UpdateLeaveType_ValidRequest_ReturnsOk()
    {
        var seeded = await SeedLeaveTypeViaApiAsync("Original", color: "#444444");

        var request = new UpdateLeaveTypeRequest
        {
            Name = "Updated",
            Allowed = Allowed.Unlimited,
            DefaultTotalDays = null,
            Color = "#555555",
        };

        var response = await _client.PutAsJsonAsync($"/api/leave-types/{seeded.Id}", request, JsonOptions);

        response.EnsureSuccessStatusCode();
        var updated = await response.Content.ReadFromJsonAsync<LeaveType>(JsonOptions);
        Assert.NotNull(updated);
        Assert.Equal("Updated", updated.Name);
        Assert.Equal("#555555", updated.Color);
    }

    [Fact]
    public async Task UpdateLeaveType_NonExisting_ReturnsNotFound()
    {
        var request = new UpdateLeaveTypeRequest
        {
            Name = "X",
            Allowed = Allowed.Limited,
            DefaultTotalDays = 1,
            Color = "#000000",
        };

        var response = await _client.PutAsJsonAsync("/api/leave-types/9999", request, JsonOptions);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeleteLeaveType_ExistingId_ReturnsNoContent()
    {
        var seeded = await SeedLeaveTypeViaApiAsync("ToDelete", color: "#666666");

        var response = await _client.DeleteAsync($"/api/leave-types/{seeded.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task DeleteLeaveType_SoftDeletes_RowStillExists()
    {
        var seeded = await SeedLeaveTypeViaApiAsync("SoftDelete", color: "#777777");
        await _client.DeleteAsync($"/api/leave-types/{seeded.Id}");

        var response = await _client.GetAsync("/api/leave-types?includeArchived=true");
        var types = await response.Content.ReadFromJsonAsync<List<LeaveType>>(JsonOptions);

        Assert.NotNull(types);
        Assert.Contains(types, t => t.Name == "SoftDelete" && t.IsArchived);
    }

    [Fact]
    public async Task DeleteLeaveType_NonExisting_ReturnsNotFound()
    {
        var response = await _client.DeleteAsync("/api/leave-types/9999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetLeaveTypes_RequiresAuth_WhenAuthEnabled()
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

        var response = await unauthClient.GetAsync("/api/leave-types");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
