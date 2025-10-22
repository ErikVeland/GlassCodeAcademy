using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace backend.Services.Auth
{
    public class JwtValidationService
    {
        private readonly string _issuer;
        private readonly string _audience;
        private readonly string _secretKey;
        private readonly SigningCredentials _signingCredentials;

        public JwtValidationService(string issuer, string audience, string secretKey)
        {
            _issuer = issuer;
            _audience = audience;
            _secretKey = secretKey;
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            _signingCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        }

        public bool ValidateToken(string token, out ClaimsPrincipal? principal)
        {
            principal = null;

            if (string.IsNullOrEmpty(token))
                return false;

            var tokenHandler = new JwtSecurityTokenHandler();

            try
            {
                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = _issuer,
                    ValidAudience = _audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey)),
                    ClockSkew = TimeSpan.Zero // Remove default 5-minute clock skew
                };

                principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);
                return true;
            }
            catch (SecurityTokenExpiredException)
            {
                // Token is expired
                return false;
            }
            catch (SecurityTokenInvalidSignatureException)
            {
                // Token signature is invalid
                return false;
            }
            catch (Exception)
            {
                // Any other validation error
                return false;
            }
        }

        public string GenerateToken(IEnumerable<Claim> claims, DateTime? expires = null)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_secretKey);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = expires ?? DateTime.UtcNow.AddHours(1),
                Issuer = _issuer,
                Audience = _audience,
                SigningCredentials = _signingCredentials
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        public ClaimsPrincipal? GetPrincipalFromToken(string token)
        {
            if (ValidateToken(token, out var principal))
            {
                return principal;
            }
            return null;
        }

        public bool IsTokenExpired(string token)
        {
            var tokenHandler = new JwtSecurityTokenHandler();

            if (tokenHandler.CanReadToken(token))
            {
                var jwtToken = tokenHandler.ReadJwtToken(token);
                return jwtToken.ValidTo < DateTime.UtcNow;
            }

            return true; // If we can't read the token, consider it expired
        }
    }
}