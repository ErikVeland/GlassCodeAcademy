<header class="bg-blue-500 text-white shadow-md">
    <div class="container mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
            <a href="{{ route('home') }}" class="text-2xl font-bold">Laravel Learning Module</a>
            <nav>
                <ul class="flex space-x-6">
                    <li><a href="{{ route('home') }}" class="hover:text-blue-200">Home</a></li>
                    <li><a href="{{ route('lessons.index') }}" class="hover:text-blue-200">Lessons</a></li>
                    <li><a href="{{ route('quiz.index') }}" class="hover:text-blue-200">Quiz</a></li>
                </ul>
            </nav>
        </div>
    </div>
</header>