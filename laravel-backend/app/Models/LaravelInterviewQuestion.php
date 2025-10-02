<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class LaravelInterviewQuestion extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'topic',
        'type',
        'question',
        'choices',
        'correct_answer',
        'explanation',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'id' => 'integer',
        'choices' => 'array',
        'correct_answer' => 'integer',
    ];
}