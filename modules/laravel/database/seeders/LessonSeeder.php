<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LessonSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('lessons')->insert([
            [
                'topic' => 'Routing',
                'title' => 'Basic Routing in Laravel',
                'description' => 'Learn how to define routes in Laravel applications.',
                'content' => 'Routing is the mechanism by which Laravel matches incoming HTTP requests to the appropriate controller methods or closures. Routes are defined in the routes/web.php file for web routes and routes/api.php for API routes.',
                'code_example' => "Route::get('/welcome', function () {\n    return 'Welcome to Laravel!';\n});\n\nRoute::get('/user/{id}', function ($id) {\n    return 'User '.$id;\n});",
                'output' => "Welcome to Laravel!\nUser 123",
                'difficulty' => 'Beginner',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'topic' => 'Eloquent',
                'title' => 'Eloquent ORM Basics',
                'description' => 'Learn how to work with databases using Eloquent ORM.',
                'content' => 'Eloquent ORM is Laravel\'s ActiveRecord implementation for working with databases. Each database table has a corresponding "Model" which is used to interact with that table. Models allow you to query for data in your tables, as well as insert new records.',
                'code_example' => "use App\Models\User;\n\n// Retrieve all users\n$users = User::all();\n\n// Find a specific user\n$user = User::find(1);\n\n// Create a new user\n$user = new User;\n$user->name = 'John Doe';\n$user->email = 'john@example.com';\n$user->save();",
                'output' => "// Collection of User models\n// Single User model\n// Saved User model",
                'difficulty' => 'Intermediate',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'topic' => 'Blade',
                'title' => 'Blade Templates',
                'description' => 'Learn how to create dynamic views using Blade templating engine.',
                'content' => 'Blade is the simple, yet powerful templating engine provided with Laravel. Unlike other popular PHP templating engines, Blade does not restrict you from using plain PHP code in your views. All Blade views are compiled into plain PHP code and cached until they are modified.',
                'code_example' => "@extends('layouts.app')\n\n@section('content')\n    <h1>{{ \$title }}</h1>\n    \n    @if(count(\$users) > 0)\n        <ul>\n            @foreach(\$users as \$user)\n                <li>{{ \$user->name }}</li>\n            @endforeach\n        </ul>\n    @endif\n@endsection",
                'output' => "<h1>Page Title</h1>\n<ul>\n    <li>John Doe</li>\n    <li>Jane Smith</li>\n</ul>",
                'difficulty' => 'Beginner',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}