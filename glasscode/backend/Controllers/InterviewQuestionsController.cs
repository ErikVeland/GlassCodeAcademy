using Microsoft.AspNetCore.Mvc;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InterviewQuestionsController : ControllerBase
{
    public static readonly List<InterviewQuestion> Questions = new()
    {
        new InterviewQuestion
        {
            Id = 1,
            Topic = "OOP",
            Type = "multiple-choice",
            Question = "What is encapsulation in OOP?",
            Choices = new[]
            {
                "The ability to inherit from another class",
                "The ability to hide internal details and show only functionality",
                "The ability to override methods",
                "The ability to create objects"
            },
            CorrectAnswer = 1,
            Explanation = "Encapsulation is the concept of hiding internal details and exposing only what is necessary."
        },
        new InterviewQuestion
        {
            Id = 2,
            Topic = "LINQ",
            Type = "multiple-choice",
            Question = "Which LINQ method projects each element of a sequence into a new form?",
            Choices = new[]
            {
                "Where",
                "Select",
                "OrderBy",
                "GroupBy"
            },
            CorrectAnswer = 1,
            Explanation = "The Select method projects each element into a new form."
        },
        new InterviewQuestion
        {
            Id = 3,
            Topic = "C# Basics",
            Type = "open-ended",
            Question = "What is the difference between a class and a struct in C#?",
            Choices = null,
            CorrectAnswer = null,
            Explanation = "Classes are reference types and support inheritance, while structs are value types and do not."
        },
        new InterviewQuestion
        {
            Id = 4,
            Topic = "ASP.NET Core",
            Type = "multiple-choice",
            Question = "Which method is used to configure the HTTP request pipeline in ASP.NET Core?",
            Choices = new[]
            {
                "ConfigureServices",
                "Configure",
                "Main",
                "Startup"
            },
            CorrectAnswer = 1,
            Explanation = "The Configure method is used to set up the HTTP request pipeline."
        },
        new InterviewQuestion
        {
            Id = 5,
            Topic = "Entity Framework",
            Type = "multiple-choice",
            Question = "Which method is used to add a new entity to the DbContext in Entity Framework?",
            Choices = new[]
            {
                "AddEntity",
                "Insert",
                "Add",
                "Attach"
            },
            CorrectAnswer = 2,
            Explanation = "The Add method is used to add a new entity to the DbContext."
        },
        new InterviewQuestion
        {
            Id = 6,
            Topic = "C# Syntax",
            Type = "multiple-choice",
            Question = "What is the output of: Console.WriteLine(\"{1 + 2}3\");?",
            Choices = new[]
            {
                "{1 + 2}3",
                "123",
                "15",
                "43"
            },
            CorrectAnswer = 0,
            Explanation = "Since the string is not prefixed with $, it is not interpolated. The braces { } are treated as literal characters, so the output is '{1 + 2}3'."
        },
        new InterviewQuestion
        {
            Id = 7,
            Topic = "OOP",
            Type = "multiple-choice",
            Question = "Which keyword is used to prevent a class from being inherited?",
            Choices = new[]
            {
                "sealed",
                "static",
                "private",
                "readonly"
            },
            CorrectAnswer = 0,
            Explanation = "The 'sealed' keyword prevents a class from being inherited."
        },
        new InterviewQuestion
        {
            Id = 8,
            Topic = "C# Basics",
            Type = "open-ended",
            Question = "What does the 'var' keyword do in C#?",
            Choices = null,
            CorrectAnswer = null,
            Explanation = "'var' allows the compiler to infer the variable's type at compile time."
        },
        new InterviewQuestion
        {
            Id = 9,
            Topic = "LINQ",
            Type = "multiple-choice",
            Question = "Which LINQ method returns the number of elements in a sequence?",
            Choices = new[]
            {
                "Count",
                "Sum",
                "Average",
                "Max"
            },
            CorrectAnswer = 0,
            Explanation = "The Count method returns the number of elements in a sequence."
        },
        new InterviewQuestion
        {
            Id = 10,
            Topic = "ASP.NET Core",
            Type = "open-ended",
            Question = "What is middleware in ASP.NET Core?",
            Choices = null,
            CorrectAnswer = null,
            Explanation = "Middleware is software that's assembled into an application pipeline to handle requests and responses."
        },
        new InterviewQuestion { Id = 11, Topic = "C# Basics", Type = "multiple-choice", Question = "Which of these is a value type in C#?", Choices = new[]{"string","int","object","class"}, CorrectAnswer = 1, Explanation = "int is a value type; string, object, and class are reference types." },
        new InterviewQuestion { Id = 12, Topic = "OOP", Type = "multiple-choice", Question = "What is polymorphism?", Choices = new[]{"Ability to take many forms","Ability to inherit","Ability to encapsulate data","Ability to override methods"}, CorrectAnswer = 0, Explanation = "Polymorphism allows objects to be treated as instances of their parent class rather than their actual class." },
        new InterviewQuestion { Id = 13, Topic = "C# Syntax", Type = "multiple-choice", Question = "What does the 'static' keyword mean?", Choices = new[]{"Method can be overridden","Method belongs to the type itself","Method is private","Method is abstract"}, CorrectAnswer = 1, Explanation = "A static method belongs to the type itself, not to any instance." },
        new InterviewQuestion { Id = 14, Topic = "LINQ", Type = "multiple-choice", Question = "Which LINQ method filters a sequence?", Choices = new[]{"Select","Where","OrderBy","GroupBy"}, CorrectAnswer = 1, Explanation = "Where filters a sequence based on a predicate." },
        new InterviewQuestion { Id = 15, Topic = "Entity Framework", Type = "multiple-choice", Question = "What does DbSet<T> represent?", Choices = new[]{"A database connection","A table in the database","A query result","A migration"}, CorrectAnswer = 1, Explanation = "DbSet<T> represents a table in the database." },
        new InterviewQuestion { Id = 16, Topic = "ASP.NET Core", Type = "multiple-choice", Question = "What is dependency injection?", Choices = new[]{"A way to inject SQL","A way to provide dependencies to classes","A way to inject CSS","A way to inject JavaScript"}, CorrectAnswer = 1, Explanation = "Dependency injection provides dependencies to classes via constructors or properties." },
        new InterviewQuestion { Id = 17, Topic = "C# Basics", Type = "open-ended", Question = "What is the default value of a bool in C#?", Choices = null, CorrectAnswer = null, Explanation = "The default value of a bool is false." },
        new InterviewQuestion { Id = 18, Topic = "OOP", Type = "open-ended", Question = "What is inheritance?", Choices = null, CorrectAnswer = null, Explanation = "Inheritance allows a class to acquire properties and methods of another class." },
        new InterviewQuestion { Id = 19, Topic = "C# Syntax", Type = "multiple-choice", Question = "Which access modifier makes a member visible only within its own class?", Choices = new[]{"public","private","protected","internal"}, CorrectAnswer = 1, Explanation = "private limits visibility to the containing class only." },
        new InterviewQuestion { Id = 20, Topic = "LINQ", Type = "open-ended", Question = "What does the 'Select' method do in LINQ?", Choices = null, CorrectAnswer = null, Explanation = "Select projects each element of a sequence into a new form." },
        new InterviewQuestion { Id = 21, Topic = "C# Basics", Type = "multiple-choice", Question = "Which keyword is used to define a constant in C#?", Choices = new[]{"const","static","readonly","final"}, CorrectAnswer = 0, Explanation = "const is used to define a constant value." },
        new InterviewQuestion { Id = 22, Topic = "OOP", Type = "multiple-choice", Question = "What is an abstract class?", Choices = new[]{"A class that cannot be instantiated","A class with only static methods","A class with no methods","A class that is sealed"}, CorrectAnswer = 0, Explanation = "An abstract class cannot be instantiated and may contain abstract members." },
        new InterviewQuestion { Id = 23, Topic = "C# Syntax", Type = "multiple-choice", Question = "What is the output of: Console.WriteLine(2 + \"2\");?", Choices = new[]{"4","22","Error","2 2"}, CorrectAnswer = 1, Explanation = "2 + '2' (string) results in string concatenation: '22'." },
        new InterviewQuestion { Id = 24, Topic = "LINQ", Type = "multiple-choice", Question = "Which LINQ method sorts a sequence?", Choices = new[]{"OrderBy","Where","Select","GroupBy"}, CorrectAnswer = 0, Explanation = "OrderBy sorts a sequence in ascending order." },
        new InterviewQuestion { Id = 25, Topic = "Entity Framework", Type = "open-ended", Question = "What is a migration in Entity Framework?", Choices = null, CorrectAnswer = null, Explanation = "A migration is a way to update the database schema over time as your model changes." },
        new InterviewQuestion { Id = 26, Topic = "ASP.NET Core", Type = "multiple-choice", Question = "Which file configures services and middleware in ASP.NET Core?", Choices = new[]{"Startup.cs","Program.cs","App.config","Web.config"}, CorrectAnswer = 0, Explanation = "Startup.cs is used to configure services and middleware." },
        new InterviewQuestion { Id = 27, Topic = "C# Basics", Type = "multiple-choice", Question = "Which of these is NOT a primitive type in C#?", Choices = new[]{"int","string","float","decimal"}, CorrectAnswer = 1, Explanation = "string is not a primitive type; it's a reference type." },
        new InterviewQuestion { Id = 28, Topic = "OOP", Type = "open-ended", Question = "What is an interface?", Choices = null, CorrectAnswer = null, Explanation = "An interface defines a contract that implementing classes must follow." },
        new InterviewQuestion { Id = 29, Topic = "C# Syntax", Type = "multiple-choice", Question = "Which operator is used for null-coalescing?", Choices = new[]{"??","?.","::","&&"}, CorrectAnswer = 0, Explanation = "?? is the null-coalescing operator." },
        new InterviewQuestion { Id = 30, Topic = "LINQ", Type = "multiple-choice", Question = "Which LINQ method returns the first element?", Choices = new[]{"First","Single","Any","All"}, CorrectAnswer = 0, Explanation = "First returns the first element of a sequence." },
        new InterviewQuestion { Id = 31, Topic = "Entity Framework", Type = "multiple-choice", Question = "Which method saves changes to the database?", Choices = new[]{"Save","Commit","SaveChanges","Update"}, CorrectAnswer = 2, Explanation = "SaveChanges saves all changes made in the context to the database." },
        new InterviewQuestion { Id = 32, Topic = "ASP.NET Core", Type = "open-ended", Question = "What is Kestrel?", Choices = null, CorrectAnswer = null, Explanation = "Kestrel is a cross-platform web server for ASP.NET Core." },
        new InterviewQuestion { Id = 33, Topic = "C# Basics", Type = "multiple-choice", Question = "Which keyword is used to handle exceptions?", Choices = new[]{"try","catch","finally","all of the above"}, CorrectAnswer = 3, Explanation = "try, catch, and finally are all used in exception handling." },
        new InterviewQuestion { Id = 34, Topic = "OOP", Type = "multiple-choice", Question = "What is method overloading?", Choices = new[]{"Defining multiple methods with the same name but different parameters","Defining a method in a subclass","Defining a method as static","Defining a method as private"}, CorrectAnswer = 0, Explanation = "Method overloading allows multiple methods with the same name but different parameters." },
        new InterviewQuestion { Id = 35, Topic = "C# Syntax", Type = "open-ended", Question = "What does the 'using' statement do?", Choices = null, CorrectAnswer = null, Explanation = "'using' ensures that IDisposable objects are disposed of as soon as they go out of scope." },
        new InterviewQuestion { Id = 36, Topic = "LINQ", Type = "multiple-choice", Question = "Which LINQ method checks if any elements exist?", Choices = new[]{"Any","All","First","Count"}, CorrectAnswer = 0, Explanation = "Any returns true if any elements exist in the sequence." },
        new InterviewQuestion { Id = 37, Topic = "Entity Framework", Type = "multiple-choice", Question = "Which method attaches an existing entity to the context?", Choices = new[]{"Attach","Add","Update","Remove"}, CorrectAnswer = 0, Explanation = "Attach attaches an existing entity to the context without marking it as modified." },
        new InterviewQuestion { Id = 38, Topic = "ASP.NET Core", Type = "multiple-choice", Question = "What is middleware?", Choices = new[]{"A component that handles requests and responses","A database table","A configuration file","A static file"}, CorrectAnswer = 0, Explanation = "Middleware is a component that handles requests and responses in the pipeline." },
        new InterviewQuestion { Id = 39, Topic = "C# Basics", Type = "open-ended", Question = "What is the purpose of the 'readonly' keyword?", Choices = null, CorrectAnswer = null, Explanation = "'readonly' makes a field assignable only during declaration or in the constructor." },
        new InterviewQuestion { Id = 40, Topic = "OOP", Type = "multiple-choice", Question = "Which principle is being used when a subclass provides a specific implementation of a method already defined in its superclass?", Choices = new[]{"Encapsulation","Polymorphism","Inheritance","Overriding"}, CorrectAnswer = 3, Explanation = "Overriding allows a subclass to provide a specific implementation of a method." }
    };

    [HttpGet]
    public ActionResult<IEnumerable<InterviewQuestion>> GetAll()
    {
        return Ok(Questions);
    }

    [HttpGet("by-topic/{topic}")]
    public ActionResult<IEnumerable<InterviewQuestion>> GetByTopic(string topic)
    {
        var filtered = Questions.Where(q => q.Topic != null && q.Topic.Equals(topic, StringComparison.OrdinalIgnoreCase)).ToList();
        return Ok(filtered);
    }

    [HttpPost("submit")] // expects { questionId, answerIndex }
    public ActionResult<AnswerResult> SubmitAnswer([FromBody] AnswerSubmission submission)
    {
        var question = Questions.FirstOrDefault(q => q.Id == submission.QuestionId);
        if (question == null)
            return NotFound();
        
        // Open-ended questions always pass since they're for learning
        bool isCorrect = question.Type == "open-ended" || 
                        (question.CorrectAnswer.HasValue && submission.AnswerIndex == question.CorrectAnswer.Value);
        
        return Ok(new AnswerResult
        {
            IsCorrect = isCorrect,
            Explanation = question.Explanation
        });
    }
} 