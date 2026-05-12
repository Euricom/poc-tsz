using Api.Common.Extensions;

namespace Api.Tests.Common;

public class DatabaseUrlTests
{
    [Theory]
    [InlineData("file:./tsz.db",                  "Data Source=./tsz.db")]
    [InlineData("file:/var/data/tsz.db",          "Data Source=/var/data/tsz.db")]
    [InlineData("sqlite:./tsz.db",                "Data Source=./tsz.db")]
    [InlineData("sqlite://./tsz.db",              "Data Source=./tsz.db")]
    [InlineData("./tsz.db",                       "Data Source=./tsz.db")]
    [InlineData(":memory:",                       "Data Source=:memory:")]
    [InlineData("Data Source=./tsz.db",           "Data Source=./tsz.db")]
    [InlineData("Data Source=:memory:;Cache=Shared", "Data Source=:memory:;Cache=Shared")]
    [InlineData("DataSource=./tsz.db",            "DataSource=./tsz.db")]
    [InlineData("Filename=./tsz.db",              "Filename=./tsz.db")]
    [InlineData("  file:./tsz.db  ",              "Data Source=./tsz.db")]
    public void ToSqliteConnectionString_Converts(string input, string expected)
    {
        Assert.Equal(expected, DatabaseUrl.ToSqliteConnectionString(input));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void ToSqliteConnectionString_RejectsEmpty(string? input)
    {
        Assert.Throws<ArgumentException>(() => DatabaseUrl.ToSqliteConnectionString(input!));
    }
}
