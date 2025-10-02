<?php

namespace App\Http\Controllers;

use App\Models\LaravelInterviewQuestion;
use Illuminate\Http\Request;

class LaravelInterviewQuestionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = LaravelInterviewQuestion::query();
        
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
        
        $questions = $query->skip($offset)->take($limit)->get();
        
        return response()->json($questions);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $question = LaravelInterviewQuestion::findOrFail($id);
        return response()->json($question);
    }

    /**
     * Submit an answer to a question.
     */
    public function submitAnswer(Request $request, string $id)
    {
        $question = LaravelInterviewQuestion::findOrFail($id);
        
        $request->validate([
            'answer_index' => 'required|integer',
        ]);
        
        $answerIndex = $request->input('answer_index');
        
        $isCorrect = $question->type === 'open-ended' || 
                    ($question->correct_answer !== null && $answerIndex === $question->correct_answer);
        
        $result = [
            'is_correct' => $isCorrect,
            'explanation' => $question->explanation,
        ];
        
        return response()->json($result);
    }
}