using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data
{
    public class GlassCodeDbContext : DbContext
    {
        public GlassCodeDbContext(DbContextOptions<GlassCodeDbContext> options) : base(options)
        {
        }

        // Core entities
        public DbSet<Course> Courses { get; set; }
        public DbSet<Module> Modules { get; set; }
        public DbSet<Lesson> Lessons { get; set; }
        public DbSet<LessonQuiz> LessonQuizzes { get; set; }
        public DbSet<InterviewQuestion> InterviewQuestions { get; set; }
        
        // User and progress tracking
        public DbSet<User> Users { get; set; }
        public DbSet<UserProgress> UserProgress { get; set; }
        public DbSet<UserLessonProgress> UserLessonProgress { get; set; }
        public DbSet<UserQuestionAttempt> UserQuestionAttempts { get; set; }
        public DbSet<UserLessonQuizAttempt> UserLessonQuizAttempts { get; set; }
        
        // Content metadata
        public DbSet<ContentTag> ContentTags { get; set; }
        public DbSet<LessonTag> LessonTags { get; set; }
        public DbSet<QuestionTag> QuestionTags { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Course entity
            modelBuilder.Entity<Course>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.Slug).IsRequired().HasMaxLength(100);
                entity.HasIndex(e => e.Slug).IsUnique();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            });

            // Configure Module entity
            modelBuilder.Entity<Module>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.Slug).IsRequired().HasMaxLength(100);
                entity.HasIndex(e => new { e.CourseId, e.Slug }).IsUnique();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                
                entity.HasOne(e => e.Course)
                    .WithMany(e => e.Modules)
                    .HasForeignKey(e => e.CourseId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure Lesson entity
            modelBuilder.Entity<Lesson>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Slug).IsRequired().HasMaxLength(100);
                entity.HasIndex(e => new { e.ModuleId, e.Slug }).IsUnique();
                entity.Property(e => e.Content).HasColumnType("jsonb");
                entity.Property(e => e.Metadata).HasColumnType("jsonb");
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                
                entity.HasOne(e => e.Module)
                    .WithMany(e => e.Lessons)
                    .HasForeignKey(e => e.ModuleId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure InterviewQuestion entity
            modelBuilder.Entity<InterviewQuestion>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Question).IsRequired().HasMaxLength(2000);
                entity.Property(e => e.Choices).HasColumnType("jsonb");
                entity.Property(e => e.Metadata).HasColumnType("jsonb");
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            });

            // Configure User entity
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
                entity.HasIndex(e => e.Email).IsUnique();
                entity.Property(e => e.Username).HasMaxLength(50);
                entity.HasIndex(e => e.Username).IsUnique();
                entity.Property(e => e.FirstName).HasMaxLength(100);
                entity.Property(e => e.LastName).HasMaxLength(100);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.LastLoginAt).IsRequired(false);
            });

            // Configure UserProgress entity
            modelBuilder.Entity<UserProgress>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.UserId, e.CourseId }).IsUnique();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                
                entity.HasOne(e => e.User)
                    .WithMany(e => e.UserProgress)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                    
                entity.HasOne(e => e.Course)
                    .WithMany()
                    .HasForeignKey(e => e.CourseId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure UserLessonProgress entity
            modelBuilder.Entity<UserLessonProgress>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.UserId, e.LessonId }).IsUnique();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                
                entity.HasOne(e => e.User)
                    .WithMany(e => e.UserLessonProgress)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                    
                entity.HasOne(e => e.Lesson)
                    .WithMany()
                    .HasForeignKey(e => e.LessonId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure UserQuestionAttempt entity
            modelBuilder.Entity<UserQuestionAttempt>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UserAnswer).HasColumnType("jsonb");
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                
                entity.HasOne(e => e.User)
                    .WithMany(e => e.UserQuestionAttempts)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                    
                entity.HasOne(e => e.Question)
                    .WithMany()
                    .HasForeignKey(e => e.QuestionId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure ContentTag entity
            modelBuilder.Entity<ContentTag>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(50);
                entity.HasIndex(e => e.Name).IsUnique();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            });

            // Configure many-to-many relationships
            modelBuilder.Entity<LessonTag>(entity =>
            {
                entity.HasKey(e => new { e.LessonId, e.TagId });
                
                entity.HasOne(e => e.Lesson)
                    .WithMany(e => e.LessonTags)
                    .HasForeignKey(e => e.LessonId)
                    .OnDelete(DeleteBehavior.Cascade);
                    
                entity.HasOne(e => e.Tag)
                    .WithMany(e => e.LessonTags)
                    .HasForeignKey(e => e.TagId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<QuestionTag>(entity =>
            {
                entity.HasKey(e => new { e.QuestionId, e.TagId });
                
                entity.HasOne(e => e.Question)
                    .WithMany(e => e.QuestionTags)
                    .HasForeignKey(e => e.QuestionId)
                    .OnDelete(DeleteBehavior.Cascade);
                    
                entity.HasOne(e => e.Tag)
                    .WithMany(e => e.QuestionTags)
                    .HasForeignKey(e => e.TagId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}