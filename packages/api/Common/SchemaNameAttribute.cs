namespace Api.Common;

[AttributeUsage(AttributeTargets.Class, AllowMultiple = false, Inherited = false)]
public sealed class SchemaNameAttribute(string name) : Attribute
{
    public string Name { get; } = name;
}
