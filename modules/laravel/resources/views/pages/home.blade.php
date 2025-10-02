@extends('layouts.app')

@section('content')
<div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
        <div class="text-center mb-12">
            <h1 class="text-4xl font-bold text-gray-900 mb-4">Learn Laravel with Fullstack Academy</h1>
            <p class="text-xl text-gray-600 mb-8">
                Master Laravel concepts through interactive lessons and quizzes
            </p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div class="bg-white rounded-lg shadow-md p-6">
                <h2 class="text-2xl font-semibold text-gray-900 mb-4">Interactive Lessons</h2>
                <p class="text-gray-600 mb-4">
                    Learn Laravel concepts with hands-on examples and code snippets
                </p>
                <a href="{{ route('lessons.index') }}" class="text-blue-500 hover:text-blue-700 font-medium">
                    Start Learning →
                </a>
            </div>
            
            <div class="bg-white rounded-lg shadow-md p-6">
                <h2 class="text-2xl font-semibold text-gray-900 mb-4">Practice Quizzes</h2>
                <p class="text-gray-600 mb-4">
                    Test your knowledge with interactive quizzes and get instant feedback
                </p>
                <a href="{{ route('quiz.index') }}" class="text-blue-500 hover:text-blue-700 font-medium">
                    Take Quiz →
                </a>
            </div>
            
            <div class="bg-white rounded-lg shadow-md p-6">
                <h2 class="text-2xl font-semibold text-gray-900 mb-4">Track Progress</h2>
                <p class="text-gray-600 mb-4">
                    Monitor your learning progress and earn certificates
                </p>
                <a href="{{ route('lessons.index') }}" class="text-blue-500 hover:text-blue-700 font-medium">
                    View Progress →
                </a>
            </div>
        </div>
    </div>
</div>
@endsection