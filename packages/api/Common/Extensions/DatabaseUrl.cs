namespace Api.Common.Extensions;

public static class DatabaseUrl
{
    public static string ToSqliteConnectionString(string url)
    {
        if (string.IsNullOrWhiteSpace(url))
            throw new ArgumentException("Database URL is empty", nameof(url));

        var trimmed = url.Trim();
        if (LooksLikeConnectionString(trimmed)) return trimmed;

        var path = trimmed;
        if (path.StartsWith("sqlite://", StringComparison.OrdinalIgnoreCase)) path = path[9..];
        else if (path.StartsWith("sqlite:", StringComparison.OrdinalIgnoreCase)) path = path[7..];
        else if (path.StartsWith("file:", StringComparison.OrdinalIgnoreCase)) path = path[5..];

        return $"Data Source={path}";
    }

    private static bool LooksLikeConnectionString(string url) =>
        url.StartsWith("Data Source=", StringComparison.OrdinalIgnoreCase) ||
        url.StartsWith("DataSource=", StringComparison.OrdinalIgnoreCase) ||
        url.StartsWith("Filename=", StringComparison.OrdinalIgnoreCase);
}
