using System.ComponentModel.DataAnnotations;

namespace Api.Modules.LeaveTypes;

public class CreateLeaveTypeRequest : IValidatableObject
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    public Allowed Allowed { get; set; }

    public int? DefaultTotalDays { get; set; }

    [Required]
    [StringLength(7)]
    [RegularExpression(@"^#[0-9A-Fa-f]{6}$", ErrorMessage = "Color must be a valid hex color (#RRGGBB).")]
    public string Color { get; set; } = string.Empty;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Allowed == Allowed.Limited && DefaultTotalDays is null)
            yield return new ValidationResult(
                "DefaultTotalDays is required for Limited leave types.",
                [nameof(DefaultTotalDays)]);

        if (Allowed == Allowed.Unlimited && DefaultTotalDays is not null)
            yield return new ValidationResult(
                "DefaultTotalDays must be null for Unlimited leave types.",
                [nameof(DefaultTotalDays)]);
    }
}

public class UpdateLeaveTypeRequest : IValidatableObject
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    public Allowed Allowed { get; set; }

    public int? DefaultTotalDays { get; set; }

    [Required]
    [StringLength(7)]
    [RegularExpression(@"^#[0-9A-Fa-f]{6}$", ErrorMessage = "Color must be a valid hex color (#RRGGBB).")]
    public string Color { get; set; } = string.Empty;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Allowed == Allowed.Limited && DefaultTotalDays is null)
            yield return new ValidationResult(
                "DefaultTotalDays is required for Limited leave types.",
                [nameof(DefaultTotalDays)]);

        if (Allowed == Allowed.Unlimited && DefaultTotalDays is not null)
            yield return new ValidationResult(
                "DefaultTotalDays must be null for Unlimited leave types.",
                [nameof(DefaultTotalDays)]);
    }
}
