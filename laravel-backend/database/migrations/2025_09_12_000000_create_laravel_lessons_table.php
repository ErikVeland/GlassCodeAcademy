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
        Schema::create('laravel_lessons', function (Blueprint $table) {
            $table->id();
            $table->string('topic')->nullable();
            $table->string('title');
            $table->text('description');
            $table->text('code_example');
            $table->text('output');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('laravel_lessons');
    }
};