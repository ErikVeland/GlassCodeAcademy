<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Lesson;

class LessonController extends Controller
{
    /**
     * Display a listing of the lessons.
     *
     * @return \Illuminate\View\View
     */
    public function index()
    {
        $lessons = Lesson::all();
        return view('pages.lessons', compact('lessons'));
    }

    /**
     * Display the specified lesson.
     *
     * @param  int  $id
     * @return \Illuminate\View\View
     */
    public function show($id)
    {
        $lesson = Lesson::findOrFail($id);
        return view('pages.lesson-detail', compact('lesson'));
    }

    /**
     * API endpoint to get all lessons.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function apiIndex()
    {
        $lessons = Lesson::all();
        return response()->json($lessons);
    }

    /**
     * API endpoint to get a specific lesson.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function apiShow($id)
    {
        $lesson = Lesson::findOrFail($id);
        return response()->json($lesson);
    }
}