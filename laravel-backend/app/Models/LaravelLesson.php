<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class LaravelLesson extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'topic',
        'title',
        'description',
        'code_example',
        'output',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'id' => 'integer',
    ];
}