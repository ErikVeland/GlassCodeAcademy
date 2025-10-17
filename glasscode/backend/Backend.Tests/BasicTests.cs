using Xunit;

namespace Backend.Tests;

public class BasicTests
{
    [Fact]
    public void BasicTest_ShouldPass()
    {
        // Arrange
        var expected = 2;
        
        // Act
        var actual = 1 + 1;
        
        // Assert
        Assert.Equal(expected, actual);
    }

    [Theory]
    [InlineData(1, 1, 2)]
    [InlineData(2, 3, 5)]
    [InlineData(-1, 1, 0)]
    public void Addition_ShouldReturnCorrectSum(int a, int b, int expected)
    {
        // Act
        var result = a + b;
        
        // Assert
        Assert.Equal(expected, result);
    }
}