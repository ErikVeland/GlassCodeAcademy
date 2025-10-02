@extends('layouts.app')

@section('content')
<div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">Laravel Lessons</h1>
    
    <div class="mb-8">
        <input
            type="text"
            placeholder="Search lessons..."
            class="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @foreach($lessons as $lesson)
            <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div class="p-6">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="text-xl font-semibold text-gray-900">{{ $lesson->title }}</h3>
                        <span class="px-2 py-1 text-xs font-medium rounded-full 
                            @if($lesson->difficulty === 'Beginner') bg-green-100 text-green-800
                            @elseif($lesson->difficulty === 'Intermediate') bg-yellow-100 text-yellow-800
                            @else bg-red-100 text-red-800 @endif">
                            {{ $lesson->difficulty }}
                        </span>
                    </div>
                    
                    <p class="text-sm text-gray-500 mb-1">{{ $lesson->topic }}</p>
                    <p class="text-gray-600 mb-4">{{ $lesson->description }}</p>
                    
                    <a 
                        href="{{ route('lessons.show', $lesson->id) }}" 
                        class="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-300"
                    >
                        Start Lesson
                    </a>
                </div>
            </div>
        @endforeach
    </div>
</div>
@endsection