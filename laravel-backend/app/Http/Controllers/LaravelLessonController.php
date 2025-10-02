<?php

namespace App\Http\Controllers;

use App\Models\LaravelLesson;
use Illuminate\Http\Request;

class LaravelLessonController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = LaravelLesson::query();
        
        // Apply filters if provided
        if ($request->has('topic')) {
            $query->where('topic', $request->input('topic'));
        }
        
        // Apply sorting if provided
        if ($request->has('sort_by')) {
            $sortOrder = $request->input('sort_order', 'asc');
            $query->orderBy($request->input('sort_by'), $sortOrder);
        }
        
        // Apply pagination if provided
        $limit = $request->input('limit', 10);
        $offset = $request->input('offset', 0);
        
        $lessons = $query->skip($offset)->take($limit)->get();
        
        return response()->json($lessons);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $lesson = LaravelLesson::findOrFail($id);
        return response()->json($lesson);
    }

    /**
     * Track user progress on a lesson.
     */
    public function trackProgress(Request $request)
    {
        $request->validate([
            'user_id' => 'required|integer',
            'lesson_id' => 'required|integer',
            'module' => 'required|string',
        ]);

        // In a real application, you would save this to a database
        $progress = [
            'user_id' => $request->input('user_id'),
            'lesson_id' => $request->input('lesson_id'),
            'module' => $request->input('module'),
            'status' => 'completed',
            'timestamp' => now(),
        ];

        return response()->json($progress);
    }
}