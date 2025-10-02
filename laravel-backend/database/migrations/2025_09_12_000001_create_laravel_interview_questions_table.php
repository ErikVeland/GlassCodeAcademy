<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('laravel_interview_questions', function (Blueprint $table) {
            $table->id();
            $table->string('topic')->nullable();
            $table->string('type')->nullable();
            $table->text('question')->nullable();
            $table->json('choices')->nullable();
            $table->integer('correct_answer')->nullable();
            $table->text('explanation')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('laravel_interview_questions');
    }
};