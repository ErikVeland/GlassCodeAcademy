using backend.Services.Auth;
using System.Security.Claims;

class TestJwt
{
    static void Main(string[] args)
    {
        Console.WriteLine("Testing JWT Implementation");

        // Create JWT validation service
        var jwtService = new JwtValidationService(
            "GlassCodeAcademy",
            "GlassCodeAcademyUsers",
            "GlassCodeAcademySecretKey12345"
        );

        // Create test claims
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "123"),
            new Claim(ClaimTypes.Email, "test@example.com"),
            new Claim(ClaimTypes.Name, "Test User"),
            new Claim(ClaimTypes.Role, "User")
        };

        // Generate a token
        Console.WriteLine("Generating token...");
        var token = jwtService.GenerateToken(claims);
        Console.WriteLine($"Generated token: {token}");

        // Validate the token
        Console.WriteLine("\nValidating token...");
        var isValid = jwtService.ValidateToken(token, out var principal);
        Console.WriteLine($"Token is valid: {isValid}");

        if (isValid && principal != null)
        {
            Console.WriteLine("User claims:");
            foreach (var claim in principal.Claims)
            {
                Console.WriteLine($"  {claim.Type}: {claim.Value}");
            }
        }

        // Test with expired token
        Console.WriteLine("\nTesting expired token...");
        var expiredToken = jwtService.GenerateToken(claims, DateTime.UtcNow.AddMinutes(-5));
        var isExpiredValid = jwtService.ValidateToken(expiredToken, out _);
        Console.WriteLine($"Expired token is valid: {isExpiredValid}");

        // Test with invalid signature
        Console.WriteLine("\nTesting invalid signature...");
        var invalidToken = token.Substring(0, token.Length - 5) + "invalid";
        var isInvalidValid = jwtService.ValidateToken(invalidToken, out _);
        Console.WriteLine($"Invalid token is valid: {isInvalidValid}");

        Console.WriteLine("\nTest completed.");
    }
}