<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class QuestionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('questions')->insert([
            [
                'topic' => 'Routing',
                'type' => 'multiple-choice',
                'question' => 'What is the correct way to define a route in Laravel?',
                'choices' => json_encode([
                    'Route::get(\'/example\', \'ExampleController@index\');',
                    'Route::get(\'/example\', [ExampleController::class, \'index\']);',
                    'Router::define(\'/example\', ExampleController::index);',
                    'app()->get(\'/example\', \'ExampleController@index\');'
                ]),
                'correct_answer' => 1,
                'explanation' => 'In Laravel 8 and later, the recommended way to define routes is using the array syntax with the controller class and method name.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'topic' => 'Eloquent',
                'type' => 'multiple-choice',
                'question' => 'Which method is used to retrieve all records from a model?',
                'choices' => json_encode([
                    'User::get()',
                    'User::all()',
                    'User::fetch()',
                    'User::find()'
                ]),
                'correct_answer' => 1,
                'explanation' => 'The all() method retrieves all records from the database table associated with the model.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'topic' => 'Blade',
                'type' => 'multiple-choice',
                'question' => 'How do you display data in a Blade template?',
                'choices' => json_encode([
                    '{{ $variable }}',
                    '{$variable}',
                    '<%= $variable %>',
                    '<% $variable %>'
                ]),
                'correct_answer' => 0,
                'explanation' => 'In Blade templates, you use double curly braces {{ }} to display data.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'topic' => 'Middleware',
                'type' => 'multiple-choice',
                'question' => 'Where are route middleware registered in Laravel?',
                'choices' => json_encode([
                    'config/middleware.php',
                    'app/Http/Kernel.php',
                    'routes/web.php',
                    'app/Providers/AppServiceProvider.php'
                ]),
                'correct_answer' => 1,
                'explanation' => 'Route middleware are registered in the app/Http/Kernel.php file in the $routeMiddleware property.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'topic' => 'Database',
                'type' => 'multiple-choice',
                'question' => 'Which command is used to run migrations in Laravel?',
                'choices' => json_encode([
                    'php artisan make:migration',
                    'php artisan migrate',
                    'php artisan run:migrations',
                    'php artisan execute:migrations'
                ]),
                'correct_answer' => 1,
                'explanation' => 'The php artisan migrate command is used to run all pending migrations.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}