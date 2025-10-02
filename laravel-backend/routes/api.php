<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\LaravelLessonController;
use App\Http\Controllers\LaravelInterviewQuestionController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware('api')->prefix('laravel')->group(function () {
    // Lessons routes
    Route::get('/lessons', [LaravelLessonController::class, 'index']);
    Route::get('/lessons/{id}', [LaravelLessonController::class, 'show']);
    
    // Interview questions routes
    Route::get('/questions', [LaravelInterviewQuestionController::class, 'index']);
    Route::get('/questions/{id}', [LaravelInterviewQuestionController::class, 'show']);
    Route::post('/questions/{id}/answer', [LaravelInterviewQuestionController::class, 'submitAnswer']);
    
    // Progress tracking
    Route::post('/progress', [LaravelLessonController::class, 'trackProgress']);
});