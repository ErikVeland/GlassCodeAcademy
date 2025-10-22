using backend.Services.Auth;
using System.Security.Claims;
using Xunit;

namespace backend.Tests.Services
{
    public class JwtValidationServiceTests
    {
        private readonly JwtValidationService _jwtService;
        private readonly string _testIssuer = "TestIssuer";
        private readonly string _testAudience = "TestAudience";
        private readonly string _testSecret = "TestSecretKey123456789012345678901234567890";

        public JwtValidationServiceTests()
        {
            _jwtService = new JwtValidationService(_testIssuer, _testAudience, _testSecret);
        }

        [Fact]
        public void GenerateToken_ShouldCreateValidToken()
        {
            // Arrange
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "123"),
                new Claim(ClaimTypes.Email, "test@example.com")
            };

            // Act
            var token = _jwtService.GenerateToken(claims);

            // Assert
            Assert.False(string.IsNullOrEmpty(token));
        }

        [Fact]
        public void ValidateToken_WithValidToken_ShouldReturnTrue()
        {
            // Arrange
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "123"),
                new Claim(ClaimTypes.Email, "test@example.com")
            };
            var token = _jwtService.GenerateToken(claims);

            // Act
            var isValid = _jwtService.ValidateToken(token, out var principal);

            // Assert
            Assert.True(isValid);
            Assert.NotNull(principal);
            Assert.Equal("123", principal.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            Assert.Equal("test@example.com", principal.FindFirst(ClaimTypes.Email)?.Value);
        }

        [Fact]
        public void ValidateToken_WithInvalidToken_ShouldReturnFalse()
        {
            // Arrange
            var invalidToken = "invalid.token.here";

            // Act
            var isValid = _jwtService.ValidateToken(invalidToken, out var principal);

            // Assert
            Assert.False(isValid);
            Assert.Null(principal);
        }

        [Fact]
        public void ValidateToken_WithExpiredToken_ShouldReturnFalse()
        {
            // Arrange
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "123")
            };
            
            // Create a token that was valid in the past but is now expired
            var now = DateTime.UtcNow;
            var tokenHandler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
            var key = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(_testSecret));
            var signingCredentials = new Microsoft.IdentityModel.Tokens.SigningCredentials(key, Microsoft.IdentityModel.Tokens.SecurityAlgorithms.HmacSha256);
            
            var tokenDescriptor = new Microsoft.IdentityModel.Tokens.SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = now.AddMinutes(-10), // Expired 10 minutes ago
                NotBefore = now.AddMinutes(-20), // Was valid 20 minutes ago
                Issuer = _testIssuer,
                Audience = _testAudience,
                SigningCredentials = signingCredentials
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var expiredToken = tokenHandler.WriteToken(token);

            // Act
            var isValid = _jwtService.ValidateToken(expiredToken, out var principal);

            // Assert
            Assert.False(isValid);
            Assert.Null(principal);
        }

        [Fact]
        public void GetPrincipalFromToken_WithValidToken_ShouldReturnPrincipal()
        {
            // Arrange
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "123"),
                new Claim(ClaimTypes.Email, "test@example.com")
            };
            var token = _jwtService.GenerateToken(claims);

            // Act
            var principal = _jwtService.GetPrincipalFromToken(token);

            // Assert
            Assert.NotNull(principal);
            Assert.Equal("123", principal.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            Assert.Equal("test@example.com", principal.FindFirst(ClaimTypes.Email)?.Value);
        }

        [Fact]
        public void GetPrincipalFromToken_WithInvalidToken_ShouldReturnNull()
        {
            // Arrange
            var invalidToken = "invalid.token.here";

            // Act
            var principal = _jwtService.GetPrincipalFromToken(invalidToken);

            // Assert
            Assert.Null(principal);
        }

        [Fact]
        public void IsTokenExpired_WithExpiredToken_ShouldReturnTrue()
        {
            // Arrange
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "123")
            };
            
            // Create a token that was valid in the past but is now expired
            var now = DateTime.UtcNow;
            var tokenHandler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
            var key = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(_testSecret));
            var signingCredentials = new Microsoft.IdentityModel.Tokens.SigningCredentials(key, Microsoft.IdentityModel.Tokens.SecurityAlgorithms.HmacSha256);
            
            var tokenDescriptor = new Microsoft.IdentityModel.Tokens.SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = now.AddMinutes(-10), // Expired 10 minutes ago
                NotBefore = now.AddMinutes(-20), // Was valid 20 minutes ago
                Issuer = _testIssuer,
                Audience = _testAudience,
                SigningCredentials = signingCredentials
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var expiredToken = tokenHandler.WriteToken(token);

            // Act
            var isExpired = _jwtService.IsTokenExpired(expiredToken);

            // Assert
            Assert.True(isExpired);
        }

        [Fact]
        public void IsTokenExpired_WithValidToken_ShouldReturnFalse()
        {
            // Arrange
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "123")
            };
            var validToken = _jwtService.GenerateToken(claims, DateTime.UtcNow.AddHours(1));

            // Act
            var isExpired = _jwtService.IsTokenExpired(validToken);

            // Assert
            Assert.False(isExpired);
        }
    }
}