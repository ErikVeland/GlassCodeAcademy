"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { AdminModule, AdminCourse } from "@/types/admin";
import LoadingScreen from "@/components/LoadingScreen";

export default function EditModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [module, setModule] = useState<AdminModule | null>(null);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [resolvedId, setResolvedId] = useState<string | null>(null);

  const fetchData = useCallback(async (id: string) => {
    try {
      setLoading(true);

      const moduleRes = await fetch(`/api/modules-db/${id}`);
      const moduleData = await moduleRes.json();
      setModule((moduleData?.data ?? moduleData) as AdminModule);

      const coursesRes = await fetch("/api/courses");
      const coursesResult = await coursesRes.json();
      const normalizedCourses = Array.isArray(coursesResult)
        ? coursesResult
        : (coursesResult?.data ?? []);
      setCourses(normalizedCourses as AdminCourse[]);

      setLoading(false);
    } catch (err) {
      setError("Failed to fetch data");
      setLoading(false);
      console.error(err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.resolve(params)
      .then((p) => {
        if (!mounted) return;
        setResolvedId(p.id);
        fetchData(p.id);
      })
      .catch((err) => {
        console.error("Error resolving params", err);
        setError("Failed to resolve route params");
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [params, fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!module) return;

    try {
      setSaving(true);

      const response = await fetch(`/api/modules-db/${module.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: module.title,
          slug: module.slug,
          description: module.description,
          order: module.order,
          isPublished: module.isPublished,
          courseId: module.courseId,
        }),
      });

      if (response.ok) {
        router.push("/admin");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update module");
      }
    } catch (err) {
      setError("Failed to update module");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    if (!module) return;
    const { name, value, type } = e.target;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    setModule({
      ...module,
      [name]: type === "checkbox" ? checked : value,
    } as AdminModule);
  };

  if (loading) {
    return <LoadingScreen message="Loading module data..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              Edit Module
            </h1>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-800">{error}</p>
              <button
                onClick={() => resolvedId && fetchData(resolvedId)}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              Edit Module
            </h1>
            <p className="text-lg text-gray-600">Module not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.push("/admin")}
            className="flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <svg
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">Edit Module</h1>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-8">
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700"
                >
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  value={module.title}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="slug"
                  className="block text-sm font-medium text-gray-700"
                >
                  Slug
                </label>
                <input
                  type="text"
                  name="slug"
                  id="slug"
                  value={module.slug}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={3}
                  value={module.description}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="order"
                  className="block text-sm font-medium text-gray-700"
                >
                  Order
                </label>
                <input
                  type="number"
                  name="order"
                  id="order"
                  value={module.order}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="courseId"
                  className="block text-sm font-medium text-gray-700"
                >
                  Course
                </label>
                <select
                  name="courseId"
                  id="courseId"
                  value={module.courseId}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  id="isPublished"
                  name="isPublished"
                  type="checkbox"
                  checked={module.isPublished}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="isPublished"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Published
                </label>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push("/admin")}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
