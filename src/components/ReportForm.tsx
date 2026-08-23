"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { reportSchema } from "@/schemas/report.schema";

export default function ReportForm({ initialType = "LOST" }: { initialType?: "LOST" | "FOUND" }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");

  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/suggestions?field=category").then((res) => res.ok ? res.json() : { data: [] }),
      fetch("/api/suggestions?field=location").then((res) => res.ok ? res.json() : { data: [] }),
      fetch("/api/suggestions?field=color").then((res) => res.ok ? res.json() : { data: [] }),
    ]).then(([catRes, locRes, colRes]) => {
      setCategories(catRes.data || []);
      setLocations(locRes.data || []);
      setColors(colRes.data || []);
    }).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setServerError("");

    const formData = new FormData(e.currentTarget);
    let imageUrl: string | undefined = undefined;

    const fileInput = e.currentTarget.elements.namedItem("image") as HTMLInputElement;
    const file = fileInput?.files?.[0];

    if (file) {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        setServerError("Image upload is not configured. Please check environment variables.");
        setIsSubmitting(false);
        return;
      }

      const imgFormData = new FormData();
      imgFormData.append("file", file);
      imgFormData.append("upload_preset", uploadPreset);

      try {
        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: imgFormData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.secure_url) {
          imageUrl = uploadData.secure_url;
        } else {
          throw new Error("Upload failed");
        }
      } catch (err) {
        setServerError("Failed to upload image. Please try again.");
        setIsSubmitting(false);
        return;
      }
    }

    const data = {
      type: formData.get("type") as string,
      title: formData.get("title") as string,
      category: formData.get("category") as string,
      description: formData.get("description") as string,
      color: formData.get("color") as string,
      location: formData.get("location") as string,
      eventDate: formData.get("eventDate") as string,
      contactEmail: formData.get("contactEmail") as string,
      imageUrl,
    };

    const result = reportSchema.safeParse(data);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0].toString()] = issue.message;
        }
      });
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      const resData = await response.json();

      if (!response.ok) {
        setServerError(resData.error || "Failed to submit report.");
        setIsSubmitting(false);
        return;
      }

      router.push(`/reports/${resData.data.id}`);
    } catch {
      setServerError("An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      {serverError && (
        <div className="p-4 text-sm text-red-800 bg-red-50 rounded-lg border border-red-200">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Report Type *</label>
          <select name="type" defaultValue={initialType} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="LOST">Lost an Item</option>
            <option value="FOUND">Found an Item</option>
          </select>
          {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date of Event *</label>
          <input type="date" name="eventDate" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500" />
          {errors.eventDate && <p className="mt-1 text-sm text-red-600">{errors.eventDate}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Item Title *</label>
        <input type="text" name="title" required placeholder="e.g., Black Apple AirPods Pro" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500" />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Category *</label>
          <input type="text" name="category" list="categories" required placeholder="e.g., Electronics" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500" />
          <datalist id="categories">
            {categories.map((c) => <option key={c} value={c} />)}
          </datalist>
          {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Location *</label>
          <input type="text" name="location" list="locations" required placeholder="e.g., Main Library" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500" />
          <datalist id="locations">
            {locations.map((l) => <option key={l} value={l} />)}
          </datalist>
          {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Color (Optional)</label>
        <input type="text" name="color" list="colors" placeholder="e.g., Black" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500" />
        <datalist id="colors">
          {colors.map((c) => <option key={c} value={c} />)}
        </datalist>
        {errors.color && <p className="mt-1 text-sm text-red-600">{errors.color}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
        <textarea name="description" rows={4} placeholder="Any specific details, identifying marks, or context..." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500" />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Contact Email *</label>
          <input type="email" name="contactEmail" required placeholder="your@email.com" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500" />
          {errors.contactEmail && <p className="mt-1 text-sm text-red-600">{errors.contactEmail}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Item Image (Optional)</label>
          <input type="file" name="image" accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-300 rounded-md shadow-sm p-1" />
        </div>
      </div>

      <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed">
        {isSubmitting ? "Submitting..." : "Submit Report"}
      </button>
    </form>
  );
}
