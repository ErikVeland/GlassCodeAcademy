using Microsoft.AspNetCore.Mvc;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LessonsController : ControllerBase
{
    public static readonly List<Lesson> Lessons = new()
    {
        // OOP
        new Lesson { Id = 1, Topic = "OOP", Title = "Classes and Objects", Description = "A class is a blueprint for objects. An object is an instance of a class.", CodeExample = "class Car { public string Model; }\nvar myCar = new Car { Model = \"Tesla\" };\nConsole.WriteLine(myCar.Model);", Output = "Tesla" },
        new Lesson { Id = 2, Topic = "OOP", Title = "Inheritance", Description = "Inheritance allows a class to inherit members from another class.", CodeExample = "class Animal { public void Speak() => Console.WriteLine(\"Animal sound\"); }\nclass Dog : Animal { }\nvar d = new Dog();\nd.Speak();", Output = "Animal sound" },
        new Lesson { Id = 3, Topic = "OOP", Title = "Polymorphism", Description = "Polymorphism allows methods to behave differently based on the object instance.", CodeExample = "class Animal { public virtual void Speak() => Console.WriteLine(\"Animal\"); }\nclass Dog : Animal { public override void Speak() => Console.WriteLine(\"Woof\"); }\nAnimal a = new Dog();\na.Speak();", Output = "Woof" },
        new Lesson { Id = 4, Topic = "OOP", Title = "Encapsulation", Description = "Encapsulation hides internal state and requires all interaction to be performed through an object's methods.", CodeExample = "class Person { private int age; public void SetAge(int a) { age = a; } public int GetAge() => age; }\nvar p = new Person();\np.SetAge(30);\nConsole.WriteLine(p.GetAge());", Output = "30" },
        new Lesson { Id = 5, Topic = "OOP", Title = "Abstraction", Description = "Abstraction means exposing only relevant information and hiding the details.", CodeExample = "abstract class Shape { public abstract double Area(); }\nclass Square : Shape { public double Side; public override double Area() => Side * Side; }\nvar s = new Square { Side = 4 };\nConsole.WriteLine(s.Area());", Output = "16" },
        new Lesson { Id = 6, Topic = "OOP", Title = "Interfaces", Description = "An interface defines a contract that implementing classes must follow.", CodeExample = "interface IFly { void Fly(); }\nclass Bird : IFly { public void Fly() => Console.WriteLine(\"Flying\"); }\nvar b = new Bird();\nb.Fly();", Output = "Flying" },
        new Lesson { Id = 7, Topic = "OOP", Title = "Abstract Classes", Description = "Abstract classes can have abstract and concrete members. They cannot be instantiated.", CodeExample = "abstract class Animal { public abstract void Speak(); }\nclass Cat : Animal { public override void Speak() => Console.WriteLine(\"Meow\"); }\nAnimal a = new Cat();\na.Speak();", Output = "Meow" },
        new Lesson { Id = 8, Topic = "OOP", Title = "Method Overriding", Description = "A subclass can provide a specific implementation of a method already defined in its superclass.", CodeExample = "class Base { public virtual void Show() => Console.WriteLine(\"Base\"); }\nclass Derived : Base { public override void Show() => Console.WriteLine(\"Derived\"); }\nBase b = new Derived();\nb.Show();", Output = "Derived" },
        // C# Basics
        new Lesson { Id = 9, Topic = "C# Basics", Title = "Variables and Data Types", Description = "Variables store data. C# is strongly typed.", CodeExample = "int age = 25;\nstring name = \"Sam\";\nbool isActive = true;\nConsole.WriteLine($\"{name} {age} {isActive}\");", Output = "Sam 25 True" },
        new Lesson { Id = 10, Topic = "C# Basics", Title = "Constants and Readonly", Description = "const and readonly are used for values that should not change.", CodeExample = "const double Pi = 3.14;\nreadonly int year = 2024;\nConsole.WriteLine(Pi);", Output = "3.14" },
        new Lesson { Id = 11, Topic = "C# Basics", Title = "Operators", Description = "Operators perform operations on variables and values.", CodeExample = "int a = 5, b = 2;\nConsole.WriteLine(a + b);\nConsole.WriteLine(a * b);", Output = "7\n10" },
        new Lesson { Id = 12, Topic = "C# Basics", Title = "Control Flow", Description = "if, else, switch, for, while, and foreach control the flow of execution.", CodeExample = "for (int i = 0; i < 3; i++) { Console.WriteLine(i); }", Output = "0\n1\n2" },
        new Lesson { Id = 13, Topic = "C# Basics", Title = "Exception Handling", Description = "try, catch, finally are used to handle exceptions.", CodeExample = "try { int x = 5 / 0; } catch (Exception ex) { Console.WriteLine(\"Error\"); }", Output = "Error" },
        // C# Syntax
        new Lesson { Id = 14, Topic = "C# Syntax", Title = "Access Modifiers", Description = "public, private, protected, internal control visibility.", CodeExample = "class Demo { private int x; public void SetX(int v) { x = v; } }", Output = "" },
        new Lesson { Id = 15, Topic = "C# Syntax", Title = "Static and Readonly", Description = "static belongs to the type, readonly can only be set in the constructor.", CodeExample = "class Demo { public static int Count; public readonly int Id; public Demo(int id) { Id = id; } }", Output = "" },
        new Lesson { Id = 16, Topic = "C# Syntax", Title = "Using Statement", Description = "using ensures IDisposable objects are disposed.", CodeExample = "using (var sw = new System.IO.StringWriter()) { sw.Write(\"hi\"); Console.WriteLine(sw.ToString()); }", Output = "hi" },
        new Lesson { Id = 17, Topic = "C# Syntax", Title = "Null-Coalescing Operator", Description = "?? returns the left operand if not null, otherwise the right.", CodeExample = "string s = null;\nConsole.WriteLine(s ?? \"default\");", Output = "default" },
        // LINQ
        new Lesson { Id = 18, Topic = "LINQ", Title = "LINQ Select", Description = "Select projects each element into a new form.", CodeExample = "var nums = new[] {1,2,3};\nvar squares = nums.Select(n => n * n);\nforeach (var s in squares) Console.WriteLine(s);", Output = "1\n4\n9" },
        new Lesson { Id = 19, Topic = "LINQ", Title = "LINQ Where", Description = "Where filters a sequence based on a predicate.", CodeExample = "var nums = new[] {1,2,3,4};\nvar even = nums.Where(n => n % 2 == 0);\nforeach (var n in even) Console.WriteLine(n);", Output = "2\n4" },
        new Lesson { Id = 20, Topic = "LINQ", Title = "LINQ OrderBy", Description = "OrderBy sorts a sequence.", CodeExample = "var words = new[] {\"pear\",\"apple\",\"banana\"};\nvar sorted = words.OrderBy(w => w);\nforeach (var w in sorted) Console.WriteLine(w);", Output = "apple\nbanana\npear" },
        new Lesson { Id = 21, Topic = "LINQ", Title = "LINQ GroupBy", Description = "GroupBy groups elements by a key.", CodeExample = "var nums = new[] {1,2,2,3};\nvar groups = nums.GroupBy(n => n);\nforeach (var g in groups) Console.WriteLine($\"{g.Key}:{g.Count()}\");", Output = "1:1\n2:2\n3:1" },
        new Lesson { Id = 22, Topic = "LINQ", Title = "LINQ Any and First", Description = "Any checks if any elements exist, First returns the first element.", CodeExample = "var nums = new[] {1,2,3};\nConsole.WriteLine(nums.Any());\nConsole.WriteLine(nums.First());", Output = "True\n1" },
        // Entity Framework
        new Lesson { Id = 23, Topic = "Entity Framework", Title = "DbContext and DbSet", Description = "DbContext represents a session with the database, DbSet represents a table.", CodeExample = "public class MyContext : DbContext { public DbSet<User> Users { get; set; } }", Output = "" },
        new Lesson { Id = 24, Topic = "Entity Framework", Title = "CRUD Operations", Description = "Create, Read, Update, Delete with Entity Framework.", CodeExample = "context.Users.Add(new User { Name = \"Alice\" });\ncontext.SaveChanges();", Output = "" },
        new Lesson { Id = 25, Topic = "Entity Framework", Title = "Migrations", Description = "Migrations update the database schema as your model changes.", CodeExample = "dotnet ef migrations add InitialCreate\ndotnet ef database update", Output = "" },
        new Lesson { Id = 26, Topic = "Entity Framework", Title = "Attach and SaveChanges", Description = "Attach attaches an entity, SaveChanges saves changes to the database.", CodeExample = "context.Users.Attach(user);\ncontext.SaveChanges();", Output = "" },
        // ASP.NET Core
        new Lesson { Id = 27, Topic = "ASP.NET Core", Title = "Middleware", Description = "Middleware handles requests and responses in the pipeline.", CodeExample = "app.Use(async (context, next) => { await context.Response.WriteAsync(\"Hello\"); });", Output = "Hello" },
        new Lesson { Id = 28, Topic = "ASP.NET Core", Title = "Dependency Injection", Description = "ASP.NET Core uses dependency injection to provide services.", CodeExample = "public class MyService { }\nservices.AddSingleton<MyService>();", Output = "" },
        new Lesson { Id = 29, Topic = "ASP.NET Core", Title = "Startup and Program", Description = "Startup.cs and Program.cs configure services and middleware.", CodeExample = "public class Startup { public void ConfigureServices(IServiceCollection services) { } public void Configure(IApplicationBuilder app) { } }", Output = "" },
        new Lesson { Id = 30, Topic = "ASP.NET Core", Title = "Kestrel Web Server", Description = "Kestrel is the cross-platform web server for ASP.NET Core.", CodeExample = "// Kestrel is used by default in ASP.NET Core projects", Output = "" }
    };

    [HttpGet]
    public ActionResult<IEnumerable<Lesson>> GetAll()
    {
        Console.WriteLine($"Lessons count: {Lessons.Count}");
        if (Lessons == null || Lessons.Count == 0)
        {
            return StatusCode(500, "No lessons available.");
        }
        return Ok(Lessons);
    }

    [HttpGet("{id}")]
    public ActionResult<Lesson> Get(int id)
    {
        var lesson = Lessons.FirstOrDefault(l => l.Id == id);
        return lesson == null ? NotFound() : Ok(lesson);
    }
}