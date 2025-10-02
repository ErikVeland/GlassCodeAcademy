<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Question;

class QuizController extends Controller
{
    /**
     * Display the quiz page.
     *
     * @return \Illuminate\View\View
     */
    public function index()
    {
        $questions = Question::inRandomOrder()->limit(5)->get();
        return view('pages.quiz', compact('questions'));
    }

    /**
     * Submit an answer and get feedback.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function submitAnswer(Request $request)
    {
        $request->validate([
            'question_id' => 'required|exists:questions,id',
            'answer' => 'required|integer',
        ]);

        $question = Question::findOrFail($request->question_id);
        $isCorrect = $request->answer == $question->correct_answer;

        return response()->json([
            'correct' => $isCorrect,
            'explanation' => $question->explanation,
        ]);
    }

    /**
     * API endpoint to get all questions.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function apiIndex()
    {
        $questions = Question::all();
        return response()->json($questions);
    }

    /**
     * API endpoint to get a specific question.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function apiShow($id)
    {
        $question = Question::findOrFail($id);
        return response()->json($question);
    }
}