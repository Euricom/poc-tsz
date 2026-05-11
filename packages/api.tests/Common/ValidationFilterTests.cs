using Api.Common.Filters;
using Api.Modules.Animals;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace Api.Tests.Common;

public class ValidationFilterTests
{
    private sealed class TestInvocationContext : EndpointFilterInvocationContext
    {
        public TestInvocationContext(params object?[] args)
        {
            HttpContext = new DefaultHttpContext();
            Arguments = args;
        }
        public override HttpContext HttpContext { get; }
        public override IList<object?> Arguments { get; }
        public override T GetArgument<T>(int index) => (T)Arguments[index]!;
    }

    [Fact]
    public async Task InvalidModel_ReturnsValidationProblem()
    {
        var filter = new ValidationFilter<CreateAnimalRequest>();
        var request = new CreateAnimalRequest { Name = "", Species = "Dog", Age = 999 };
        var context = new TestInvocationContext(request);

        var result = await filter.InvokeAsync(context, _ => ValueTask.FromResult<object?>(null));

        var problem = Assert.IsType<ProblemHttpResult>(result);
        var details = Assert.IsType<HttpValidationProblemDetails>(problem.ProblemDetails);
        Assert.Contains("Name", details.Errors.Keys);
        Assert.Contains("Age", details.Errors.Keys);
    }

    [Fact]
    public async Task ValidModel_CallsNext()
    {
        var filter = new ValidationFilter<CreateAnimalRequest>();
        var request = new CreateAnimalRequest { Name = "Rex", Species = "Dog", Age = 2 };
        var context = new TestInvocationContext(request);
        var sentinel = new object();

        var result = await filter.InvokeAsync(context, _ => ValueTask.FromResult<object?>(sentinel));

        Assert.Same(sentinel, result);
    }

    [Fact]
    public async Task NoMatchingArgument_ReturnsBadRequest()
    {
        var filter = new ValidationFilter<CreateAnimalRequest>();
        var context = new TestInvocationContext("not the right type");

        var result = await filter.InvokeAsync(context, _ => ValueTask.FromResult<object?>(null));

        Assert.NotNull(result);
        Assert.Contains("BadRequest", result!.GetType().Name);
    }
}
