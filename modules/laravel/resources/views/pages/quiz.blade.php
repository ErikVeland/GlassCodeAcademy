@extends('layouts.app')

@section('content')
<div class="container mx-auto px-4 py-8">
    <div class="max-w-3xl mx-auto">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Laravel Quiz</h1>
        <p class="text-gray-600 mb-8">Test your knowledge of Laravel concepts</p>
        
        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
            <div class="mb-6">
                <div class="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Question 1 of {{ $questions->count() }}</span>
                    <span>0% Complete</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-blue-500 h-2 rounded-full" style="width: 0%"></div>
                </div>
            </div>
            
            <div>
                <h2 class="text-xl font-semibold text-gray-900 mb-6">What is the correct way to define a route in Laravel?</h2>
                
                <div class="space-y-3 mb-6">
                    <label class="block w-full text-left p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <div class="flex items-center">
                            <input type="radio" name="question-1" class="mr-3 h-4 w-4 text-blue-500">
                            <span>Route::get('/example', 'ExampleController@index');</span>
                        </div>
                    </label>
                    
                    <label class="block w-full text-left p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <div class="flex items-center">
                            <input type="radio" name="question-1" class="mr-3 h-4 w-4 text-blue-500">
                            <span>$router->get('/example', [ExampleController::class, 'index']);</span>
                        </div>
                    </label>
                    
                    <label class="block w-full text-left p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <div class="flex items-center">
                            <input type="radio" name="question-1" class="mr-3 h-4 w-4 text-blue-500">
                            <span>Router::define('/example', ExampleController::index);</span>
                        </div>
                    </label>
                    
                    <label class="block w-full text-left p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <div class="flex items-center">
                            <input type="radio" name="question-1" class="mr-3 h-4 w-4 text-blue-500">
                            <span>app()->get('/example', 'ExampleController@index');</span>
                        </div>
                    </label>
                </div>
            </div>
            
            <div class="flex justify-between mt-8">
                <button class="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-400 cursor-not-allowed" disabled>
                    ← Previous
                </button>
                
                <button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium">
                    Next →
                </button>
            </div>
        </div>
    </div>
</div>
@endsection