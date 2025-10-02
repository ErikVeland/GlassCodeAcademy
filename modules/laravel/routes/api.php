<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\LessonController;
use App\Http\Controllers\QuizController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('api')->group(function () {
    Route::get('/lessons', [LessonController::class, 'apiIndex']);
    Route::get('/lessons/{id}', [LessonController::class, 'apiShow']);
    
    Route::get('/questions', [QuizController::class, 'apiIndex']);
    Route::get('/questions/{id}', [QuizController::class, 'apiShow']);
    Route::post('/submit-answer', [QuizController::class, 'submitAnswer']);
});